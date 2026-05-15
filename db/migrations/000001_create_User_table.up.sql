CREATE SEQUENCE custom_bigint_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

CREATE TABLE IF NOT EXISTS users (
    user_name VARCHAR(60) NOT NULL,
    email VARCHAR(150) NOT NULL,
    id BIGINT PRIMARY KEY DEFAULT nextval('custom_bigint_seq')
);

CREATE TABLE IF NOT EXISTS pgp_profile (
    id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    auth_key TEXT NOT NULL,
    public_identity_key TEXT NOT NULL,
    sessions JSONB
)