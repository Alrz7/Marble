CREATE SEQUENCE IF NOT EXISTS display_id_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

ALTER TABLE users
    ADD COLUMN display_id VARCHAR(30)
    DEFAULT ('U_' || nextval('display_id_seq')::text);

ALTER TABLE users
    ADD CONSTRAINT users_display_id_key UNIQUE (display_id);

UPDATE users SET display_id = display_id WHERE display_id IS NULL;

ALTER TABLE users
    ALTER COLUMN display_id SET NOT NULL;
