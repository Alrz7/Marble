CREATE TABLE IF NOT EXISTS pgp_sessions (
        id BIGSERIAL PRIMARY KEY,
        alpha TEXT NOT NULL,
        beta TEXT NOT NULL,
        alpha_messages BYTEA,
        beta_messages BYTEA
);
