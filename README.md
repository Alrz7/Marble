<div align="center">
  <a href="https://github.com/Alrz7/Marble">
    <img width="2251" height="522" alt="Marble-Horizontal2" src="https://github.com/user-attachments/assets/d6e7a9ad-d5f6-4994-aeef-2dd184fc815d" />
  </a>
</div>

> **MVP — Work in Progress.** Core features are under active development, APIs may change, and you will hit bugs. Not yet audited — do not use for sensitive production data.

## What is Marble

Marble is an E2EE messenger with a Go backend and a Tauri/React client.

Design goals: **client sovereignty, server agnosticism, and ephemeral server storage.** The server never sees plaintext or your MasterKey. Offline messages are stored encrypted and purged after the recipient ACKs. A local-only vault (Saved Messages) never leaves the device.

```
  ┌──────────────────────────────────────────────────────────────────┐
  │                        MARBLE CLIENT (Tauri)                     │
  │                                                                  │
  │   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐   │
  │   │   Account 1      │  │   Account 2      │  │ Offline Vault│   │
  │   │ (→ Server A)     │  │ (→ Server B)     │  │ (local-only, │   │
  │   │  E2EE            │  │  E2EE            │  │  never syncs)│   │
  │   └───────┬──────────┘  └───────┬──────────┘  └──────────────┘   │
  │           │                     │                                │
  └───────────┼─────────────────────┼────────────────────────────────┘
              │ E2EE                │ E2EE
              │ Curve25519/OpenPGP  │ Curve25519/OpenPGP
              ▼                     ▼
     ┌──────────────────┐  ┌──────────────────┐
     │  MARBLE SERVER A │  │  MARBLE SERVER B │   ... any server
     │  Go + Postgres   │  │  Go + Postgres   │       (self-hostable)
     └──────────────────┘  └──────────────────┘
```

* **Multi-tenant:** One client holds multiple accounts, each bound to a different server. Strict isolation per cryptographic domain.
* **Server-agnostic:** Any Marble server speaks the same WS/REST protocol. No vendor lock-in.
* **Offline vault:** `Saved Messages` is a local SQLite session — encrypted at rest, never transmitted.
* **Deterministic errors:** Client uses `Result<T, AppError>` (Go/Rust-style) instead of `try/catch`.

---

## Technology Stack

| Layer | Choice |
|-------|--------|
| **Server** | Go `net/http` + `httprouter`, PostgreSQL, `gorilla/websocket`, `golang-jwt/jwt/v5`, `ProtonMail/gopenpgp/v3`, `knadh/koanf` (YAML config), `uber-go/zap` |
| **Client** | TypeScript, React 19, Vite, Tailwind CSS 4, Zustand, `openpgp` (Curve25519), `jwt-decode`, `framer-motion`, `lucide-react` |
| **Native** | Tauri 2, plugins: `sql` (SQLite), `keyring-api`, `fs`, `http`, `clipboard-manager`, `opener` |
| **DB** | Server: PostgreSQL · Client: SQLite (per-account, AES-GCM encrypted) |

---

## Cryptography

> Marble has **not** been externally audited. The model below is the intended design — review `enc/` and `src/logic/enc/` before trusting it.

Local data is encrypted with **AES-GCM-256**. Network payloads are E2EE with **OpenPGP Curve25519**. Key derivation uses **Argon2** (512-bit output).

### MasterKey Lifecycle

```
          [ Master Phrase ]  (shown once at signup, then wiped)
                    │
                    ▼  Argon2 → 512-bit (64 bytes)
                    │
          ┌─────────┴──────────┐  split in half
          │                    │
          ▼                    ▼
   ┌──────────────┐     ┌──────────────┐
   │  Local Hash  │     │ Server Hash  │──► sent to server, re-hashed & stored
   │ (MasterKey)  │     └──────────────┘    used for login + JWT issuance
   └──────┬───────┘
          │
          ├────► encrypts ──► [ SQLite DB (AES-GCM, per-record) ]
          │
          ▼ (encrypted at rest by)
   ┌──────────────┐                  ┌───────────────────────────────┐
   │ Wrapping Key │ ◄── derived ───  │ Daily Passphrase / OS Keyring │
   └──────────────┘                  └───────────────────────────────┘

   Recovery: re-enter Master Phrase → Argon2 → same MasterKey → vault unlocks
   Daily unlock: Passphrase/Keyring → Wrapping Key → decrypts stored MasterKey
```

* **Threat model:** Server stores only `hash(ServerHash)` and never sees `MasterKey` or plaintext. It *does* see account metadata (displayId, session membership, message timing/counts) and temporarily holds offline ciphertext.
* **What is E2EE today:** Message `content` is OpenPGP-encrypted client-side before `actv` send. Everything else (counts, `session_last_seq`, avatars) is not.
* **Daily auth:** OS Keychain or a short passphrase derives a Wrapping Key that decrypts the at-rest MasterKey — so you don't retype the Master Phrase every launch.

---

## Message Routing (Ephemeral Server)

```
  [ Sender ] ── E2EE ciphertext ──► [ WebSocket Server : /actv ]
                                            │
                              Recipient state
                    ┌───────────────────────┴───────────────────────┐
                    │                                               │
               [ ONLINE ]                                      [ OFFLINE ]
                    │                                               │
                    ▼                                               ▼
            in-memory direct                               persist to Postgres
            routing (no DB I/O)                             (ciphertext only)
                    │                                               │
                    ▼                                               │
              [ Recipient ] ◄──────── sync on reconnect ────────────┘
                    │
                    └── ACK (delivered) ──► [ Server PURGES row ]
```

* **Online:** Routed in-memory, zero DB writes.
* **Offline:** Persisted as ciphertext in `message` table.
* **On reconnect:** Server syncs pending messages; client ACK triggers `DELETE` — honoring the ephemeral model.

---

## Database Schema

```
  users ──1:1── pgp_profile
    │ 1
    │ n
    ├─── session (alpha_id, beta_id  CHECK alpha < beta, UNIQUE pair)
    │      │ 1
    │      │ n
    │      └─── message (session_id, sender_id, seq, content, profile)
    │
    └─── tokens (hash PK, user_id, expiry, scope, type)
```

See `db/migrations/000001_init_schema.up.sql` for the full DDL.

---

## Getting Started

### Prerequisites

* Go 1.22+ · PostgreSQL 15+ · `golang-migrate` CLI · Node 20+ · Rust (for Tauri)

### 1. Server

```bash
# config
cp tmp/marble.yaml marble.yaml   # edit port, jwtSecret, db DSN, mailer
# env var used by Makefile:
export MARBLE_DB_DSN="postgres://user:pass@localhost:5432/marble?sslmode=disable"

# migrate
make -C db migrateUpAll        # or: migrate -path=db/migrations -database=$MARBLE_DB_DSN up

# run
go run .
# REST on :6280, WS on /actv, health on GET /
```

`marble.yaml` shape (see `tmp/marble.yaml`):

```yaml
app:  { version: v0.1.3, env: Development }
api:
  port: 6280
  jwtSecret: "<32+ random bytes, base64>"
  env: Development
  limiter: { enabled: true, rps: 2, burst: 6, timeout: 2m }
  users:  { properties: [withActivation] }
  mailer: { enabled: false, smtp-host: localhost, smtp-port: 1025, ... }
```

### 2. Client

```bash
cd client/Marble
npm ci
npm run dev          # Vite on http://localhost:1420
# or full Tauri window:
npm run tauri dev
npm run build        # tsc && vite build
```

Tauri security is locked to `csp: default-src 'self'; connect-src 'self' http: https: ws: wss:` in `src-tauri/tauri.conf.json`.

---

## Project Structure

```
Marble/
├── app/                # server application
│   ├── api/            # REST handlers, JWT, middlewares, routes
│   ├── active/         # WS hub, in-memory store, message/session handlers
│   ├── session/        # session + message persistence
│   ├── users/          # users + tokens
│   └── setup.go        # wiring (config, logger, db, api)
├── config/             # koanf YAML loader
├── db/                 # pg connection + migrations + Models aggregate
├── enc/pgp/            # server-side OpenPGP helpers
├── internal/           # helpers, loggy (zap), mailer, validator
├── client/Marble/      # Tauri + React client
│   ├── src/
│   │   ├── components/ # auth, chat, sidebar, settings
│   │   └── logic/      # enc, active (WS), auth, db (SQLite), messages, sessions, states
│   └── src-tauri/      # Tauri Rust shell + tauri.conf.json
├── tmp/marble.yaml     # example config
└── main.go             # entrypoint → app.Main()
```

---

## API Overview

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/` | — | Health: `{"status":"available"}` |
| `POST` | `/auth/signup` | — | Create account |
| `POST` | `/auth/login` | — | Issue JWT + refresh token |
| `POST` | `/auth/refresh` | refresh | Rotate tokens |
| `PATCH` | `/account/update` | JWT | Update profile |
| `DELETE` | `/account/delete` | JWT | Delete account |
| `GET` | `/actv` | JWT (WS) | WebSocket — all realtime messaging |

WS protocol: JSON `{ status, channel, token, body }` — channels `auth`, `message`, `session`, `user`. See `app/active/actTypes.go` and `client/Marble/src/logic/active/`.

---

## Roadmap

* [ ] Audit Argon2id params + per-user salt, add `pgx` + context-aware queries, fix WS lifecycle (close/cancel, raise 4KB read limit)
* [ ] E2EE coverage: encrypt session metadata, add key rotation
* [ ] Offline reliability: retry + idempotent ACK, pagination for large sync
* [ ] Tests: `go test ./...` + client unit tests for `enc/` round-trips
* [ ] CI: lint, test, and Tauri build on PR (currently release-only)

---

## Licence

See [LICENCE](./LICENCE).

---

<p align="center"><i>Built with care — contributions and sharp reviews welcome.</i></p>
