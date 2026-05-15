ALTER TABLE users
    ALTER COLUMN display_id DROP NOT NULL;

ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_display_id_key;

ALTER TABLE users
    DROP COLUMN IF EXISTS display_id;

DROP SEQUENCE IF EXISTS display_id_seq;
