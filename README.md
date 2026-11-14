# AIVerse Wallet

AIVerse Wallet is being developed as a **non-custodial wallet**. The current `index.html` is a visual prototype only; its balances are sample data and it does not connect to a blockchain or sign transactions.

## Current milestone

- [x] Preserve the original prototype on `main`.
- [x] Create an isolated development branch for the security foundation.
- [x] Add a PHP authentication API foundation and MySQL schema.
- [ ] Configure a real HTTPS PHP hosting environment and database.
- [ ] Connect the frontend to the authenticated API.
- [ ] Add read-only blockchain data integrations.
- [ ] Add wallet connection and client-side transaction signing.
- [ ] Complete independent security review and testnet testing.

## Backend requirements

- PHP 8.1+ with PDO MySQL and Argon2id support.
- MySQL 8.0+ (or a compatible MariaDB release).
- HTTPS for every deployed request.
- A server-side configuration file containing database credentials and a random application secret. Never commit that file.

See [backend/README.md](backend/README.md) for setup and API details.

## Important security boundary

Account authentication is not wallet custody. The authentication API in this milestone stores account password hashes and server-side sessions only. It does **not** create, import, store, transmit, or sign with blockchain private keys. Private keys and seed phrases must never be sent to this backend.

The application must not be used to hold or transfer real funds until wallet connection, local signing, chain validation, recovery, threat modelling, and independent testing are complete.
