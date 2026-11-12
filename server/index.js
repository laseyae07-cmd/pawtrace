
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import path from 'node:path';
import { unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import pool from './db.js';
import { uploadPetPhoto } from './upload.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

// ============================================
// MIDDLEWARE
// ============================================

// Allow the React frontend to send session cookies
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());

// ============================================
// SESSION CONFIGURATION
// ============================================

if (
  !process.env.SESSION_SECRET ||
  process.env.SESSION_SECRET.length < 32
) {
  throw new Error(
    'A secure SESSION_SECRET is required in server/.env.'
  );
}

const PgSessionStore = connectPgSimple(session);

app.use(
  session({
    name: 'pawtrace.sid',

    store: new PgSessionStore({
      pool,
      tableName: 'user_sessions',
      createTableIfMissing: true,
    }),

    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Register, login, current user and logout
app.use('/api/auth', authRoutes);

// ============================================
// UPLOADED PHOTOS
// ============================================

app.use(
  '/uploads',
  express.static(
    path.join(currentDirectory, 'uploads')
  )
);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/', (req, res) => {
  res.json({
    message: 'PAWTRACE API is running!',
  });
});

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

// Protect routes that require a logged-in user
function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({
      error: 'Please log in to continue.',
    });
  }

  next();
}

// ============================================
// REPORT VALIDATION
// ============================================

function validateReport(body) {
  if (
    !body ||
    typeof body.name !== 'string' ||
    typeof body.location !== 'string' ||
    typeof body.description !== 'string' ||
    !['Dog', 'Cat'].includes(body.type) ||
    !['Lost', 'Found'].includes(body.status)
  ) {
    return null;
  }

  const name = body.name.trim();
  const location = body.location.trim();
  const description = body.description.trim();

  if (!name || !location || !description) {
    return null;
  }

  return {
    name,
    type: body.type,

    breed:
      typeof body.breed === 'string'
        ? body.breed.trim() || null
        : null,

    color:
      typeof body.color === 'string'
        ? body.color.trim() || null
        : null,

    location,
    status: body.status,
    description,
  };
}

// ============================================
// SAVE PET REPORT
// ============================================

// Automatically associate new reports with
// the authenticated user's ID.
async function insertReport(report, imageUrl, userId) {
  const result = await pool.query(
    `INSERT INTO pet_reports
      (
        name,
        animal_type,
        breed,
        color,
        location,
        status,
        description,
        image_url,
        user_id
      )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      report.name,
      report.type,
      report.breed,
      report.color,
      report.location,
      report.status,
      report.description,
      imageUrl,
      userId,
    ]
  );

  return result.rows[0];
}

// Remove unused photos after failed submissions
async function removeUploadedFile(req) {
  if (!req.file?.path) {
    return;
  }

  try {
    await unlink(req.file.path);
  } catch (error) {
    console.error(
      'Failed to remove unused upload:',
      error
    );
  }
}

// ============================================
// GET ALL PET REPORTS
// ============================================

// Public route
app.get('/api/reports', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM pet_reports
       ORDER BY created_at DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    console.error(
      'Failed to fetch pet reports:',
      error
    );

    return res.status(500).json({
      error: 'Failed to fetch pet reports.',
    });
  }
});

// ============================================
// GET MY PET REPORTS
// ============================================

// Private route
// IMPORTANT: This route must appear before /:id
app.get(
  '/api/reports/mine',
  requireAuth,
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT *
         FROM pet_reports
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [req.session.userId]
      );

      return res.json(result.rows);
    } catch (error) {
      console.error(
        'Failed to fetch user reports:',
        error
      );

      return res.status(500).json({
        error: 'Unable to load your pet reports.',
      });
    }
  }
);

// ============================================
// GET SINGLE PET REPORT
// ============================================

// Public route
app.get('/api/reports/:id', async (req, res) => {
  const { id } = req.params;

  if (
    !/^[1-9]\d*$/.test(id) ||
    id.length > 19
  ) {
    return res.status(400).json({
      error: 'Invalid pet report ID.',
    });
  }

  try {
    const result = await pool.query(
      `SELECT *
       FROM pet_reports
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Pet report not found.',
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error(
      'Failed to fetch pet report:',
      error
    );

    return res.status(500).json({
      error: 'Failed to fetch pet report.',
    });
  }
});

// ============================================
// CREATE PET REPORT WITHOUT PHOTO
// ============================================

// Private route
app.post(
  '/api/reports',
  requireAuth,
  async (req, res) => {
    const report = validateReport(req.body);

    if (!report) {
      return res.status(400).json({
        error: 'Please provide valid pet report details.',
      });
    }

    const imageUrl =
      typeof req.body.image === 'string'
        ? req.body.image
        : null;

    try {
      const savedReport = await insertReport(
        report,
        imageUrl,
        req.session.userId
      );

      return res.status(201).json(savedReport);
    } catch (error) {
      console.error(
        'Failed to save pet report:',
        error
      );

      return res.status(500).json({
        error: 'Failed to save the pet report.',
      });
    }
  }
);

// ============================================
// CREATE PET REPORT WITH OPTIONAL PHOTO
// ============================================

// Private route
app.post(
  '/api/reports/with-photo',

  // Require login before uploading any files
  requireAuth,

  // Handle image uploads
  (req, res, next) => {
    uploadPetPhoto(req, res, (error) => {
      if (error) {
        const message =
          error.code === 'LIMIT_FILE_SIZE'
            ? 'The photo must be 5 MB or smaller.'
            : error.message;

        return res.status(400).json({
          error:
            message || 'Failed to upload the photo.',
        });
      }

      next();
    });
  },

  // Save report to PostgreSQL
  async (req, res) => {
    const report = validateReport(req.body);

    if (!report) {
      await removeUploadedFile(req);

      return res.status(400).json({
        error: 'Please provide valid pet report details.',
      });
    }

    try {
      const imageUrl = req.file
        ? `/uploads/${req.file.filename}`
        : null;

      const savedReport = await insertReport(
        report,
        imageUrl,
        req.session.userId
      );

      return res.status(201).json(savedReport);
    } catch (error) {
      await removeUploadedFile(req);

      console.error(
        'Failed to save report with photo:',
        error
      );

      return res.status(500).json({
        error: 'Failed to save the pet report.',
      });
    }
  }
);

// ============================================
// REPORT OWNERSHIP HELPERS
// ============================================

// Validate report IDs before database queries.
function isValidReportId(id) {
  return (
    typeof id === 'string' &&
    /^[1-9]\d*$/.test(id) &&
    id.length <= 19 &&
    BigInt(id) <= 9223372036854775807n
  );
}

// ============================================
// EDIT MY PET REPORT
// ============================================

// PATCH /api/reports/:id
// Only the report owner can update its details.
app.patch(
  '/api/reports/:id',
  requireAuth,
  async (req, res) => {
    const { id } = req.params;

    if (!isValidReportId(id)) {
      return res.status(400).json({
        error: 'Invalid pet report ID.',
      });
    }

    const report = validateReport(req.body);

    if (!report) {
      return res.status(400).json({
        error: 'Please provide valid pet report details.',
      });
    }

    if (
      report.name.length > 100 ||
      report.location.length > 255 ||
      report.description.length > 1000 ||
      (report.breed?.length ?? 0) > 100 ||
      (report.color?.length ?? 0) > 100
    ) {
      return res.status(400).json({
        error: 'One or more report fields are too long.',
      });
    }

    try {
      const result = await pool.query(
        `UPDATE pet_reports
         SET
           name = $1,
           animal_type = $2,
           breed = $3,
           color = $4,
           location = $5,
           status = $6,
           description = $7
         WHERE id = $8::bigint
           AND user_id = $9
         RETURNING *`,
        [
          report.name,
          report.type,
          report.breed,
          report.color,
          report.location,
          report.status,
          report.description,
          id,
          req.session.userId,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Report not found or not accessible.',
        });
      }

      return res.status(200).json({
        message: 'Pet report updated successfully.',
        report: result.rows[0],
      });
    } catch (error) {
      console.error('Failed to update report:', error);

      return res.status(500).json({
        error: 'Unable to update the pet report.',
      });
    }
  }
);

// ============================================
// DELETE MY PET REPORT
// ============================================

// DELETE /api/reports/:id
// Only the report owner can delete it.
app.delete(
  '/api/reports/:id',
  requireAuth,
  async (req, res) => {
    const { id } = req.params;

    if (!isValidReportId(id)) {
      return res.status(400).json({
        error: 'Invalid pet report ID.',
      });
    }

    try {
      const result = await pool.query(
        `DELETE FROM pet_reports
         WHERE id = $1::bigint
           AND user_id = $2
         RETURNING id, image_url`,
        [id, req.session.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Report not found or not accessible.',
        });
      }

      const deletedReport = result.rows[0];
      const imageUrl = deletedReport.image_url;

      // Remove local uploaded photos only.
      // Never use arbitrary URLs as filesystem paths.
      if (typeof imageUrl === 'string') {
        const match = imageUrl.match(
          /^\/uploads\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|jpeg|png|webp))$/i
        );

        if (match) {
          const photoPath = path.join(
            currentDirectory,
            'uploads',
            match[1]
          );

          try {
            await unlink(photoPath);
          } catch (fileError) {
            if (fileError.code !== 'ENOENT') {
              console.error(
                'Failed to remove deleted report photo:',
                fileError
              );
            }
          }
        }
      }

      return res.status(200).json({
        message: 'Pet report deleted successfully.',
        deletedId: deletedReport.id,
      });
    } catch (error) {
      console.error('Failed to delete report:', error);

      return res.status(500).json({
        error: 'Unable to delete the pet report.',
      });
    }
  }
);

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(
    `PAWTRACE API running at http://localhost:${PORT}`
  );
});
