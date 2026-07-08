export const MG1 = `--sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id BLOB NOT NULL,
    display_id BLOB NOT NULL,
    hmac_display_id BLOB NOT NULL,
    name BLOB NOT NULL,
    email BLOB NOT NULL,
    encrypted_master_key BLOB NOT NULL,
    profile_avatar BLOB
);

CREATE TABLE pgp_profile (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    private_key BLOB NOT NULL,
    public_key BLOB NOT NULL,
    revocation_certificate BLOB NOT NULL
);

CREATE TABLE audience (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id BLOB NOT NULL,
    display_id BLOB NOT NULL,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name BLOB NOT NULL,
    public_key BLOB NOT NULL,
    profile_avatar BLOB
);

CREATE TABLE session (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id BLOB NOT NULL,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    audience_id INTEGER NOT NULL REFERENCES audience(id) ON DELETE CASCADE,
    last_sequence INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE message (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seq INTEGER NOT NULL,
    session_id INTEGER NOT NULL REFERENCES session(id) ON DELETE CASCADE,
    content BLOB NOT NULL,
    sender_id BLOB NOT NULL,
    timestamp BLOB NOT NULL,
    status BLOB NOT NULL
);

CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    value INTEGER NOT NULL
);

INSERT INTO app_settings (key, value) VALUES ('active_user_id', -1);
`;
