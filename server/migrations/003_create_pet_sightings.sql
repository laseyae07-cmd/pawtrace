
CREATE TABLE IF NOT EXISTS pet_sightings (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    report_id BIGINT NOT NULL
        REFERENCES pet_reports(id)
        ON DELETE CASCADE,

    reporter_id BIGINT
        REFERENCES users(id)
        ON DELETE SET NULL,

    location VARCHAR(255) NOT NULL,

    seen_at TIMESTAMPTZ NOT NULL,

    description TEXT NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT sighting_location_not_empty
        CHECK (LENGTH(TRIM(location)) > 0),

    CONSTRAINT sighting_description_valid
        CHECK (
            LENGTH(TRIM(description)) BETWEEN 10 AND 1000
        )
);

CREATE INDEX IF NOT EXISTS idx_sightings_report
ON pet_sightings(report_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sightings_unread
ON pet_sightings(report_id)
WHERE is_read = FALSE;
