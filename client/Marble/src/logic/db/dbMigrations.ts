export const MG1 = `--sql
CREATE TABLE IF NOT EXISTS session (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  storage_id TEXT NOT NULL UNIQUE,
  last_sequence INTEGER NOT null DEFAULT 0
  );

CREATE TABLE IF NOT EXISTS message (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seq INTEGER NOT NULL,
  session_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES session (id)
);
`;
