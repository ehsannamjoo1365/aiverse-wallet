# AIVerse Wallet backend — authentication foundation

This directory contains the first backend milestone. It is deliberately limited to account authentication. It is **not** a production-ready wallet and does not implement blockchain access, key custody, or transaction signing.

## Requirements

- PHP 8.1 or newer.
- PHP extensions: `pdo`, `pdo_mysql`, and Argon2id support in PHP's password API.
- MySQL 8.0+ or compatible MariaDB.
- HTTPS on the deployed origin.

The code fails closed if Argon2id is unavailable. Do not silently replace it with a fast general-purpose hash.

## Installation

1. Create a MySQL database and a dedicated database user with only the permissions needed for this application.
2. Import `schema.sql`.
3. Copy `config.example.php` to `config.php`. Keep `config.php` out of the public web root and out of version control.
4. Set the database values, the exact HTTPS frontend origin, and a cryptographically random `app_key` (at least 32 random bytes encoded as 64 hexadecimal characters).
5. Configure the web server document root to point to `backend/public`; keep `backend/src` and `backend/config.php` outside the document root.
6. Serve the frontend and API from the same origin. This API intentionally does not enable permissive CORS.
7. Test on a staging environment before connecting any real user accounts.

Example secret generation on a trusted server:

```sh
php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"
```

Do not paste database passwords, application secrets, recovery phrases, or private keys into GitHub issues or chat.

## API

All routes are served by `public/api/auth.php`; pass the action as a query parameter.

| Method | Action | Purpose |
|---|---|---|
| GET | `?action=csrf` | Start a session and obtain a CSRF token |
| POST | `?action=register` | Create an account |
| POST | `?action=login` | Authenticate an account |
| GET | `?action=me` | Return the current account, if authenticated |
| POST | `?action=logout` | Invalidate the current session |

For every POST request, send JSON and the `X-CSRF-Token` header returned by the CSRF endpoint. Browser requests must include credentials (same-origin cookies).

Example request sequence:

```js
const csrfResponse = await fetch('/api/auth.php?action=csrf', {
  credentials: 'same-origin'
});
const { csrf_token } = await csrfResponse.json();

const response = await fetch('/api/auth.php?action=register', {
  method: 'POST',
  credentials: 'same-origin',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrf_token
  },
  body: JSON.stringify({ email: 'user@example.com', password: 'a-long-unique-password' })
});
```

## Security controls in this milestone

- Passwords are hashed with PHP `PASSWORD_ARGON2ID`; plaintext passwords are never stored.
- Sessions are server-side, cookie-only, strict-mode sessions.
- Session cookies use `Secure`, `HttpOnly`, and `SameSite=Strict`.
- Session IDs are regenerated after successful login and registration.
- State-changing requests require a session-bound CSRF token.
- The API checks the configured origin and uses prepared SQL statements.
- Login attempts are throttled per email/IP-derived HMAC key.
- Responses disable caching and avoid returning password hashes.

## Known limitations — do not call this production-ready

- No email verification, password reset, MFA, account recovery, audit trail, or administrator controls yet.
- Rate limiting is a basic database-backed control and needs load/concurrency testing and operational monitoring.
- Session storage uses PHP's configured session handler; production deployments should use a hardened server-side store and tested backup/expiry procedures.
- No formal penetration test or independent cryptographic review has been performed.
- No blockchain network, wallet provider, seed phrase, private key, or transaction-signing feature is included.

Account login and wallet authorization are separate security domains. Future wallet signing must happen locally in a reviewed wallet/provider flow; private keys and seed phrases must never be submitted to this API.
