
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import pool from './db.js';
import { uploadPetPhoto } from './upload.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

// Middleware
app.use(
  cors({
    origin: 'http://localhost:5173',
  })
);

app.use(express.json());

// Serve uploaded pet photos
app.use(
  '/uploads',
  express.static(path.join(currentDirectory, 'uploads'))
);

// Check whether the API is running
app.get('/', (req, res) => {
  res.json({
    message: 'PAWTRACE API is running!',
  });
});

// Get all pet reports
app.get('/api/reports', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pet_reports ORDER BY created_at DESC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch reports:', error.message);

    res.status(500).json({
      error: 'Failed to fetch pet reports.',
    });
  }
});

// Create a pet report without a photo
app.post('/api/reports', async (req, res) => {
  const {
    name,
    type,
    breed,
    color,
    location,
    status,
    description,
    image,
  } = req.body;

  if (
    !name?.trim() ||
    !location?.trim() ||
    !description?.trim() ||
    !['Dog', 'Cat'].includes(type) ||
    !['Lost', 'Found'].includes(status)
  ) {
    return res.status(400).json({
      error: 'Please provide valid pet report details.',
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO pet_reports
        (name, animal_type, breed, color, location,
         status, description, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        name.trim(),
        type,
        breed?.trim() || null,
        color?.trim() || null,
        location.trim(),
        status,
        description.trim(),
        image || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to save report:', error.message);

    res.status(500).json({
      error: 'Failed to save the pet report.',
    });
  }
});

// Create a pet report with an optional photo
app.post(
  '/api/reports/with-photo',
  (req, res, next) => {
    uploadPetPhoto(req, res, (error) => {
      if (error) {
        const message =
          error.code === 'LIMIT_FILE_SIZE'
            ? 'The photo must be 5 MB or smaller.'
            : error.message;

        return res.status(400).json({
          error: message || 'Failed to upload the photo.',
        });
      }

      next();
    });
  },
  async (req, res) => {
    const {
      name,
      type,
      breed,
      color,
      location,
      status,
      description,
    } = req.body;

    if (
      !name?.trim() ||
      !location?.trim() ||
      !description?.trim() ||
      !['Dog', 'Cat'].includes(type) ||
      !['Lost', 'Found'].includes(status)
    ) {
      return res.status(400).json({
        error: 'Please provide valid pet report details.',
      });
    }

    try {
      const imageUrl = req.file
        ? `/uploads/${req.file.filename}`
        : null;

      const result = await pool.query(
        `INSERT INTO pet_reports
          (name, animal_type, breed, color, location,
           status, description, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          name.trim(),
          type,
          breed?.trim() || null,
          color?.trim() || null,
          location.trim(),
          status,
          description.trim(),
          imageUrl,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(
        'Failed to save pet report:',
        error.message
      );

      res.status(500).json({
        error: 'Failed to save the pet report.',
      });
    }
  }
);

// Start the server
app.listen(PORT, () => {
  console.log(`PAWTRACE API running at http://localhost:${PORT}`);
});
