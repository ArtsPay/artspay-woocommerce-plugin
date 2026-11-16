# Browser tests

Playwright tests that run a real classic checkout and the ArtsPay settings screens against the Fat Zebra sandbox. They cover the secure hosted card form, 3D Secure (frictionless, challenge, failed, and a tampered browser that skips it), and settings sub-page saves.

These place real sandbox orders, so they are not part of CI. Run them before a release, and after changes to checkout, 3DS or settings.

## Setup

You need PHP 8.0+, [wp-cli](https://wp-cli.org), Node 22 and the Fat Zebra sandbox credentials for a merchant with 3D Secure enabled and an OAuth client.

```sh
cd tests/e2e
npm install
npx playwright install chromium

export FZ_USERNAME=... FZ_TOKEN=... FZ_SHARED_SECRET=... FZ_OAUTH_KEY=... FZ_OAUTH_SECRET=...
npm run setup-store
```

`setup-store` builds a throwaway store in `/tmp/artspay-e2e-store` (WordPress on SQLite, WooCommerce, a $25 product, a classic checkout page, and ArtsPay with the hosted form and 3DS on) and prints the commands to start it and run the tests. It copies the plugin from this repo, so re-run `rsync` (or delete the store and run setup again) after code changes.

## Gotchas

- **Host name.** The store runs on `lvh.me`, which resolves to your machine. Fat Zebra's firewall returns 403 for requests that contain `localhost` or `127.0.0.1` links, and the order link in the purchase metadata would contain one.
- **HTTPS.** fatzebra.js needs a secure page (`crypto.randomUUID`). The tests add that one function to the plain-http test store. Real stores must be on HTTPS.
- **References.** Fat Zebra references are unique per merchant, and a shared sandbox merchant has used low order numbers already. Setup starts the store's order IDs high, and the plugin adds a random suffix to every reference.
- **wp-cli memory.** If `wp core download` stops with exit code 255, PHP ran out of memory extracting WordPress. Point `WP_CLI` at a wrapper that runs `php -d memory_limit=512M wp-cli.phar`.
- **HPOS.** The store starts on WooCommerce's default storage. To test both, run once, then `wp wc hpos sync && wp wc hpos enable` and run again.

## Not covered here

Deferred capture, refunds, subscriptions, wallets and captcha are tested by hand (see the test matrix in the release checklist). Apple Pay can't complete in the sandbox.
