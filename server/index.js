import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config();

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
}));

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'PAWTRACE API is running!' });
});

app.get('/api/reports', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM pet_reports ORDER BY created_at DESC'
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch reports:', error.message);
        res.status(500).json({ error: 'Failed to fetch pet reports.' });
    }
});


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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`PAWTRACE API running at http://localhost:${PORT}`);
});
