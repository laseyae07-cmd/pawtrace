
import express from 'express';
import bcrypt from 'bcryptjs';
import { rateLimit } from 'express-rate-limit';
import pool from '../db.js';

const router = express.Router();

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Too many registration attempts. Please try again later.',
  },
});

// POST /api/auth/register
router.post('/register', registerLimiter, async (req, res) => {
  const { full_name, email, password } = req.body ?? {};

  if (
    typeof full_name !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string'
  ) {
    return res.status(400).json({
      error: 'Name, email and password are required.',
    });
  }

  const name = full_name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!name || name.length > 100) {
    return res.status(400).json({
      error: 'Please enter a valid name (maximum 100 characters).',
    });
  }

  if (
    normalizedEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
  ) {
    return res.status(400).json({
      error: 'Please enter a valid email address.',
    });
  }

  if (
    password.length < 8 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters and no more than 72 bytes.',
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, full_name, email, created_at`,
      [name, normalizedEmail, passwordHash]
    );

    return res.status(201).json({
      message: 'Account created successfully.',
      user: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'An account with this email already exists.',
      });
    }

    console.error('Registration failed:', error);

    return res.status(500).json({
      error: 'Failed to create account.',
    });
  }
});


const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: 'Too many login attempts. Please try again later.',
  },
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res, next) => {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !email.trim() ||
    !password
  ) {
    return res.status(400).json({
      error: 'Email and password are required.',
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (
    normalizedEmail.length > 254 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    return res.status(401).json({
      error: 'Invalid email or password.',
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, full_name, email, password_hash
       FROM users
       WHERE LOWER(email) = $1
       LIMIT 1`,
      [normalizedEmail]
    );

    const user = result.rows[0];

    const validPassword = user
      ? await bcrypt.compare(password, user.password_hash)
      : false;

    if (!validPassword) {
      return res.status(401).json({
        error: 'Invalid email or password.',
      });
    }

    // Regenerate the session to prevent session fixation.
    req.session.regenerate((error) => {
      if (error) {
        return next(error);
      }

      req.session.userId = String(user.id);

      req.session.save((saveError) => {
        if (saveError) {
          return next(saveError);
        }

        return res.json({
          message: 'Login successful.',
          user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
          },
        });
      });
    });
  } catch (error) {
    console.error('Login failed:', error);

    return res.status(500).json({
      error: 'Unable to log in.',
    });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({
      error: 'Not authenticated.',
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, full_name, email, created_at
       FROM users
       WHERE id = $1`,
      [req.session.userId]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        error: 'Not authenticated.',
      });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Failed to fetch current user:', error);

    return res.status(500).json({
      error: 'Unable to load your account.',
    });
  }
});


 // POST /api/auth/logout
router.post('/logout', (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie('pawtrace.sid', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return res.status(200).json({
      message: 'Logged out successfully.',
    });
  });
});

export default router;
