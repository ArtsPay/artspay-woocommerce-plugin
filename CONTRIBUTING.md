# Contributing

Thank you for helping improve WooCommerce ArtsPay Gateway.

## Before you start

- Read [`AGENTS.md`](AGENTS.md) for architecture, conventions, and pitfalls.
- Do not commit secrets, production credentials, or personal data.

## Pull requests

1. **Scope** – One logical change per PR when possible (feature, fix, or docs).
2. **Changelog** – Add an entry to [`changelog.txt`](changelog.txt) under a new dated `YYYY-MM-DD - version X.Y.Z` block (or append to the next unreleased block if your team uses that convention). Use the same prefix style as existing lines (`* Fix -`, `* Dev -`, `* Add -`, etc.).
3. **PHP** – Run `./bin/check-php-syntax.sh` from the plugin root before pushing. CI also runs syntax checking, a security-scoped PHPCS pass (WordPress coding standards, see [`phpcs.xml`](phpcs.xml)), and CodeQL on every pull request — see [`.github/workflows/`](.github/workflows/).
4. **Manual testing** – For payment or checkout changes, describe how you tested (sandbox, classic checkout, blocks if relevant).

## Code style

- Follow existing patterns in `includes/` (namespaces, hook usage, escaping in admin output).
- Prefer WordPress coding standards for PHP (tabs, translated strings with `artspay` text domain).

## Releasing a build to customers

1. Bump `ARTSPAY_PLUGIN_VERSION` and the `Version` header in [`artspay-woocommerce.php`](artspay-woocommerce.php).
2. Append [`changelog.txt`](changelog.txt) with a dated `YYYY-MM-DD - version X.Y.Z` block.
3. Push a tag matching `v<version>` (e.g. `v3.1.2`) on the release commit. [`.github/workflows/release.yml`](.github/workflows/release.yml) builds the ZIP with `bin/build.sh` and publishes it as a GitHub Release automatically — no manual upload needed.

To build a ZIP locally instead (e.g. to test the packaging before tagging), run `./bin/build.sh` from the repo root; it writes `releases/artspay-woocommerce-<version>.zip` (+ `.sha256`). The `releases/` directory is gitignored—do not commit the ZIP.

## WordPress.org packaging

If this plugin is ever published on WordPress.org, maintain a separate **`readme.txt`** in [WordPress readme format](https://developer.wordpress.org/plugins/wordpress-org/how-your-readme-txt-works/) in addition to this repository’s [`README.md`](README.md). Release metadata formats differ between `changelog.txt`, `readme.txt`, and GitHub—keep them consistent when you cut a release.
