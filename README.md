<div align="center">
  <a href="[Marble-logo](https://github.com/Alrz7/Marble)">
    <img width="2251" height="522" alt="Marble-Horizontal2" src="https://github.com/user-attachments/assets/d6e7a9ad-d5f6-4994-aeef-2dd184fc815d" />
  </a>
</div>

> **Note:** Marble is currently in the **MVP (Minimum Viable Product)** stage. Many core features are still under development, APIs may change, and you might encounter unexpected bugs.

## Introduction

Marble is a security-focused, zero-knowledge E2EE Messenger Built using a Go-based backend and a Tauri/React client, it ensures that all user data remains completely sovereign, decentralized, and mathematically inaccessible to unauthorized entities—including the server infrastructure itself.

Featuring a beautiful, minimalist glass-blur user interface with a dark-blue-gray color palette, Marble balances enterprise-grade cryptographic security with an elegant, highly responsive user experience.

---

## 1. Architectural Overview

Marble is designed to be highly flexible, secure, and decentralized. It departs from traditional centralized messaging paradigms through the following core architectural decisions:

* **Multi-Tenancy & Data Isolation:** A single Marble client can host multiple distinct accounts simultaneously. Strict data isolation ensures that an authenticated user only has access to their specific cryptographic domain.
* **Server Agnosticism:** The ecosystem is not server-strict. Different users operating on the same physical client can seamlessly connect to entirely independent servers.
* **Platform Independence:** While the current iteration leverages Tauri for native integration, the core client logic is written in pure TypeScript, rendering the application highly portable and easily implementable across other platforms.
* **Deterministic Error Handling:** The TypeScript client discards traditional `try/catch` paradigms in favor of a Go/Rust-inspired `Result<T, AppError>` model, ensuring robust, predictable state execution and error management.
* **Offline Secure Vault:** The client features an integrated "Saved Messages" session acting as a secure local note vault. It operates on entirely separated methods, strictly remaining local, with its data never transmitting to the server.

---

## 2. Technology Stack

### Server-Side

* **Core Runtime:** Go (`net/http` for REST APIs).
* **Database Engine:** PostgreSQL (`[github.com/lib/pq](https://github.com/lib/pq)`).
* **Caching Layer:** Local in-memory caching for active user management (designed for future Redis migration).
* **Key Go Packages:**
* [github.com/Alrz7/fig](https://github.com/Alrz7/fig) (Custom configuration management).
* [github.com/ProtonMail/gopenpgp/v3](https://github.com/ProtonMail/gopenpgp/v3) (OpenPGP integration).
* [github.com/golang-jwt/jwt/v5](https://github.com/golang-jwt/jwt/v5) (JWT Authentication).
* [github.com/gorilla/websocket](https://github.com/gorilla/websocket) (WebSocket connectivity).
* [https://github.com/uber-go/zap](https://github.com/uber-go/zap)`Zap` (Structured logging).

### Client-Side
* **Core Logic & UI:** TypeScript, React, Vite, Tailwind CSS, Zustand (State Management), Lucid-React (UI Components).
* **Native Framework:** Tauri.
* **Local Storage:** SQLite.
* **Authentication & Cryptography:** `jwt-decode` (JWT integration), OpenPGP (E2EE).
* **Tauri Plugins:**
* `@tauri-apps/plugin-clipboard-manager`
* `@tauri-apps/plugin-fs`
* `@tauri-apps/plugin-http`
* `@tauri-apps/plugin-opener`
* `@tauri-apps/plugin-sql`
* `tauri-plugin-keyring-api`

### Client Preview
<div align="center">
  <img width="720" alt="marble-demo" src="https://github.com/user-attachments/assets/ca046f39-d292-4359-8fe8-29eecf262c18" />
</div>

---

## 3. Cryptography & Security Protocol

Marble is engineered to operate without needing to trust the host server. The cryptographic layer is modular (not encryption-strict) and allows for the seamless replacement of OpenPGP with alternative algorithms if required.

* **Encryption Standards:** The platform utilizes 256-bit Argon2 for key derivation, AES-GCM-256 for local client-side encryption, and OpenPGP Curve25519 for end-to-end network encryption.
* **Granular Local Encryption:** Data is not encrypted as a single monolithic block. The client encrypts database records part-by-part prior to insertion. Almost all fields are encrypted; only quantitative metrics (e.g., counts, lengths) remain visible to the local system.
* **Session Initiation Signatures:** First-initiation messages (which establish new messaging sessions) are cryptographically signed using the sender's private key, enabling strict validation by both the receiving client and the server infrastructure.
* **Secure Portability:** Due to its autonomous encryption-authentication structure, user data can be safely and entirely exported or imported locally without exposing plaintext to the network.

---

## 4. Advanced Authentication (Auth-V2)

Marble utilizes a highly sophisticated, multi-tiered authentication architecture designed to maximize security while providing flexible daily usability.

### The MasterKey Lifecycle

Upon account creation, the user is provided with a cryptographically strong **Master Phrase** (Recovery Key).

1. The client hashes this Master Phrase using **Argon2** to generate the permanent, unchangeable **MasterKey**.
2. The original Master Phrase is then immediately and permanently wiped from system memory.
3. All user data is symmetrically encrypted using this MasterKey.

### Daily Authentication & Wrapping Keys

To prevent the friction of entering a long Master Phrase on every application launch, users can opt for a daily authentication method: OS System Keychain, a custom Passphrase, or a combination of both.

* The chosen daily method is used to generate a **Wrapping Key**.
* The Wrapping Key is utilized to encrypt the MasterKey, which is then safely persisted in the local SQLite database.
* If a user wishes to change their daily passphrase or authentication method, the system seamlessly decrypts the MasterKey using the legacy method, and re-encrypts it with the new one. The underlying user data remains untouched.

### Data Recovery (Forward Hashing & Rollback)

* **Rollback:** During normal operation, the daily method generates the Wrapping Key, which decrypts the encrypted MasterKey, subsequently unlocking the database.
* **Forward Hashing:** If the daily authentication method is lost or the user migrates to a new device, the original Master Phrase is utilized. By hashing the phrase with Argon2, the system natively regenerates the MasterKey, recovering all encrypted data instantly.

### Server Authentication & JWT

A secondary hash is derived separately from the original MasterKey. The client retains this hash for auto-login procedures and transmits it to the server. The server performs an additional hashing iteration before storing it. This mechanism powers the generation of long-lived JWTs; upon prolonged inactivity, the client silently authenticates using the secondary hash to refresh the token.

---

## 5. Network & WebSocket Routing

Client-server communication is fundamentally driven by a locally integrated WebSocket (WS) routing system, ensuring real-time, bidirectional data transfer with zero-knowledge persistence.

### Authentication & Handshake

WebSocket authentication is aggressively executed via token verification embedded strictly within the initial WS handshake message.

### Symmetrical Routing Topology

Routing logic is executed symmetrically across both network boundaries:

* **Server-Side:** *Client Handlers* manage incoming requests originating from the client. *Server Handlers* process and format outgoing responses to the client.
* **Client-Side:** *Server Handlers* manage incoming push notifications and payloads from the server. *Client Handlers* format and manage outgoing requests.

### Zero-Knowledge Message Delivery

Marble guarantees that the server retains no permanent record of communications.

* **Synchronous Delivery (Online):** If the recipient is actively connected, the encrypted message payload is routed directly to them in-memory, completely bypassing database I/O on the server.
* **Asynchronous Delivery (Offline):** If the recipient is offline, the encrypted payload is temporarily persisted in the PostgreSQL database.
* **Automated State Sync & Purge:** As soon as an offline recipient reconnects, the server automatically synchronizes all pending sessions and messages. Once the client receives, processes, and notifies the server of successful ingestion, the server permanently deletes those messages from the PostgreSQL database, honoring the zero-knowledge ephemeral storage model.
