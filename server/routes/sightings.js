
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import pool from '../db.js';

const router = express.Router();

const sightingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        error: 'Too many sightings submitted. Please try again later.',
    },
});

// Require an authenticated session
function requireAuth(req, res, next) {
    if (!req.session?.userId) {
        return res.status(401).json({
            error: 'Please log in to continue.',
        });
    }

    next();
}

// Validate PostgreSQL BIGINT IDs
function isValidId(id) {
    return (
        typeof id === 'string' &&
        /^[1-9]\d{0,18}$/.test(id) &&
        BigInt(id) <= 9223372036854775807n
    );
}

// Validate sighting details
function validateSighting(body) {
    if (
        !body ||
        typeof body.location !== 'string' ||
        typeof body.description !== 'string' ||
        typeof body.seen_at !== 'string'
    ) {
        return null;
    }

    const location = body.location.trim();
    const description = body.description.trim();
    const seenAtText = body.seen_at.trim();

    // Require an ISO date/time with an explicit timezone
    const hasTimeZone =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(
            seenAtText
        );

    const seenAtMs = Date.parse(seenAtText);

    if (
        !location ||
        location.length > 255 ||
        description.length < 10 ||
        description.length > 1000 ||
        !hasTimeZone ||
        !Number.isFinite(seenAtMs) ||
        seenAtMs > Date.now() + 5 * 60 * 1000
    ) {
        return null;
    }

    return {
        location,
        description,
        seenAt: new Date(seenAtMs).toISOString(),
    };
}

// ============================================
// SUBMIT PET SIGHTING
// ============================================

router.post(
    '/reports/:reportId/sightings',
    requireAuth,
    sightingLimiter,
    async (req, res) => {
        const { reportId } = req.params;

        if (!isValidId(reportId)) {
            return res.status(400).json({
                error: 'Invalid pet report ID.',
            });
        }

        const sighting = validateSighting(req.body);

        if (!sighting) {
            return res.status(400).json({
                error:
                    'Provide a valid location, description (10–1000 characters), and sighting time with a timezone. The time cannot be in the future.',
            });
        }

        try {
            // Only allow sightings for owned lost-pet reports.
            // Never trust a reporter ID sent by the frontend.
            const result = await pool.query(
                `INSERT INTO pet_sightings
          (
            report_id,
            reporter_id,
            location,
            seen_at,
            description
          )
         SELECT
           p.id,
           $2::bigint,
           $3::varchar(255),
           $4::timestamptz,
           $5::text
         FROM pet_reports AS p
         WHERE p.id = $1::bigint
           AND p.status = 'Lost'
           AND p.reunited_at IS NULL
           AND p.user_id IS NOT NULL
           AND p.user_id <> $2::bigint
         RETURNING
           id,
           report_id,
           location,
           seen_at,
           description,
           is_read,
           created_at`,
                [
                    reportId,
                    req.session.userId,
                    sighting.location,
                    sighting.seenAt,
                    sighting.description,
                ]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error:
                        'This lost-pet report is unavailable for sightings.',
                });
            }

            return res.status(201).json({
                message: 'Sighting submitted successfully.',
                sighting: result.rows[0],
            });
        } catch (error) {
            console.error('Failed to create sighting:', error);

            return res.status(500).json({
                error: 'Unable to submit sighting.',
            });
        }
    }
);

// ============================================
// GET SIGHTINGS FOR ONE OWNED REPORT
// ============================================

router.get(
    '/reports/:reportId/sightings',
    requireAuth,
    async (req, res) => {
        const { reportId } = req.params;

        if (!isValidId(reportId)) {
            return res.status(400).json({
                error: 'Invalid pet report ID.',
            });
        }

        try {
            const owned = await pool.query(
                `SELECT id
         FROM pet_reports
         WHERE id = $1::bigint
           AND user_id = $2`,
                [reportId, req.session.userId]
            );

            if (owned.rows.length === 0) {
                return res.status(404).json({
                    error: 'Report not found or not accessible.',
                });
            }

            const result = await pool.query(
                `SELECT
           id,
           report_id,
           location,
           seen_at,
           description,
           is_read,
           created_at
         FROM pet_sightings
         WHERE report_id = $1::bigint
         ORDER BY created_at DESC, id DESC
         LIMIT 100`,
                [reportId]
            );

            return res.json(result.rows);
        } catch (error) {
            console.error('Failed to load sightings:', error);

            return res.status(500).json({
                error: 'Unable to load sightings.',
            });
        }
    }
);

// ============================================
// GET MY SIGHTING NOTIFICATIONS
// ============================================

router.get(
    '/sightings/mine',
    requireAuth,
    async (req, res) => {
        try {
            const result = await pool.query(
                `SELECT
           s.id,
           s.report_id,
           p.name AS pet_name,
           s.location,
           s.seen_at,
           s.description,
           s.is_read,
           s.created_at
         FROM pet_sightings AS s
         JOIN pet_reports AS p
           ON p.id = s.report_id
         WHERE p.user_id = $1
         ORDER BY s.created_at DESC, s.id DESC
         LIMIT 100`,
                [req.session.userId]
            );

            return res.json(result.rows);
        } catch (error) {
            console.error(
                'Failed to load notifications:',
                error
            );

            return res.status(500).json({
                error: 'Unable to load notifications.',
            });
        }
    }
);

// ============================================
// MARK A SIGHTING AS READ
// ============================================

router.patch(
    '/sightings/:sightingId/read',
    requireAuth,
    async (req, res) => {
        const { sightingId } = req.params;

        if (!isValidId(sightingId)) {
            return res.status(400).json({
                error: 'Invalid sighting ID.',
            });
        }

        try {
            // Verify ownership in the UPDATE itself
            const result = await pool.query(
                `UPDATE pet_sightings AS s
         SET is_read = TRUE
         FROM pet_reports AS p
         WHERE s.id = $1::bigint
           AND p.id = s.report_id
           AND p.user_id = $2
         RETURNING
           s.id,
           s.report_id,
           s.is_read`,
                [sightingId, req.session.userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'Sighting not found or not accessible.',
                });
            }

            return res.json({
                message: 'Sighting marked as read.',
                sighting: result.rows[0],
            });
        } catch (error) {
            console.error(
                'Failed to mark sighting as read:',
                error
            );

            return res.status(500).json({
                error: 'Unable to update sighting.',
            });
        }
    }
);

export default router;
