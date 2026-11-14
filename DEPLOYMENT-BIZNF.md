# AIVerse Wallet — Biz.nf deployment gate

Target domain: https://bestapplicationes.atwebpages.com

## Important: do not deploy authentication over HTTP

The authentication API requires HTTPS and uses Secure, HttpOnly, SameSite=Strict session cookies. It deliberately returns an error when the request is not HTTPS. Biz.nf's published hosting comparison currently marks its shared SSL feature as unavailable on the Free plan and available on paid plans. Therefore, a free-plan account may host the visual prototype but must not host this login system unless HTTPS is demonstrably enabled for this exact domain.

Official plan comparison: https://www.biz.nf/web-hosting.php

## Verify the actual account before deployment

1. Open https://bestapplicationes.atwebpages.com in a browser and confirm that the address bar shows a valid HTTPS connection (not a redirect back to HTTP and not a certificate warning).
2. In the Biz.nf control panel, verify the PHP version for this exact domain.
3. Verify these PHP capabilities on this exact domain: PDO, PDO MySQL (`pdo_mysql`), and Argon2id (`PASSWORD_ARGON2ID`).
4. Verify the MySQL server version, database name, host name, and database username in the control panel. Do not send passwords or secret keys in chat.
5. Confirm whether the web root can be set to `backend/public`. The private `backend/config.php` and `backend/src` must remain outside the web root. If the host cannot provide this layout, configure a private config file outside the public directory before deployment.
6. Only after all checks pass: import `backend/schema.sql`, create `backend/config.php` from `backend/config.example.php`, fill the actual DB values in the server File Manager, and generate a unique 32-byte random `app_key` on a trusted machine.

## Current application paths

The API entry point in the repository is `backend/public/api/auth.php`. The frontend is not yet connected to it. The API currently expects same-origin requests and the configured origin is:

```
https://bestapplicationes.atwebpages.com
```

Do not use GitHub Pages as the PHP API host. GitHub Pages can serve static files only; it cannot execute this PHP backend.

## Deployment status

- Repository target origin configured: yes (example config only).
- Domain HTTPS verified: no.
- PHP extensions verified on this domain: no.
- Database configured/imported: no.
- Secrets installed on host: no.
- API deployed or live-tested: no.
- Frontend connected to authentication: no.

This document is intentionally a deployment gate, not a claim that the site is already live.
