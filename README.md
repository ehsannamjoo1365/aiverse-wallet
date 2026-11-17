# AIVerse Wallet

AIVerse Wallet is being developed as a browser-based, non-custodial wallet project.

> **Current status: UI prototype only. Not a real wallet.**
>
> The dashboard no longer displays fictional balances; it shows that blockchain connectivity is inactive. The watch-only address book stores public addresses, labels, and optional tags/memos locally in the current browser. It performs basic format checks only; it does not verify checksums or fetch on-chain balances. The app does not generate or store private keys, manage seed phrases, sign transactions, connect to blockchain networks, or send/receive assets. Do not enter a seed phrase, private key, password, or real funds.

## Project goals

- A Persian-first, responsive wallet interface.
- A clear separation between watch-only portfolio features and signing capabilities.
- Client-side key handling and transaction signing only after the security design and implementation are independently reviewed.
- Explicit network selection and transaction previews.
- No server-side collection of recovery phrases or private keys.
- An assistant panel that will only be connected to an AI service through a carefully scoped backend; secrets must never be embedded in browser code.

## Current repository

- `index.html`: Persian-first static wallet dashboard.
- `watch-only.js`: local watch-only public-address book for BTC, BCH, XRP, ADA, TRON, Ethereum, BNB Smart Chain, and Solana. It stores public addresses, labels, and optional tags/memos in this browser's local storage only.
- `address-validation.js`: basic network-specific address-format checks. These checks do not verify checksums, prove network ownership, or query a blockchain.
- `scripts/test-address-validation.mjs`: automated format-validation tests.
- `.github/workflows/pages.yml`: GitHub Pages deployment workflow.

## Publish with GitHub Pages

1. Open **Settings → Pages** in this repository.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Push to the `main` branch. The workflow will upload and deploy the repository's static site.
4. Open the Pages section to obtain the actual published URL and check the deployment status.

The deployment workflow does not change repository visibility or enable Pages in repository settings.

### Important plan and visibility note

GitHub Pages is available for public repositories on GitHub Free. Publishing from a private repository requires an eligible paid plan. A Pages site is publicly reachable unless a supported private-publishing configuration is available and selected. Do not make this repository public until you have reviewed the source and confirmed it contains no private information. See the official [GitHub Pages publishing-source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Security rules

- Never commit `.env` files, API keys, access tokens, private keys, seed phrases, wallet backups, or real user data.
- Treat all balances in the current prototype as fictional.
- Watch-only entries are stored in browser local storage, are not encrypted by this app, and do not sync across devices. Do not use shared or public devices for private address books.
- Do not connect real funds until key generation, entropy, backup/recovery, derivation paths, address validation, signing, fee calculation, network handling, and transaction broadcasting have been implemented and independently audited.
- GitHub Pages is static hosting; it cannot safely host private server-side API credentials or a trusted signing backend.
- Report security issues privately to the repository owner. Do not publish exploit details in a public issue.

## Development status

This repository is an early prototype. Passing a static deployment workflow only verifies that the static files can be published; it does not certify wallet security or blockchain functionality.
