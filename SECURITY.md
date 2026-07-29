# Security

## Supported versions

Security fixes are applied to the current maintenance line of the plugin. Use the latest release from your distribution channel.

## Reporting a vulnerability

**Please do not** open a public GitHub issue for undisclosed security vulnerabilities.

Instead, report details privately to the ArtsPay team through the contact channel you use for merchant support (e.g. your ArtsPay representative or the security contact your organization has on file).

Include:

- Affected plugin version and WordPress/WooCommerce versions
- Steps to reproduce or a clear description of the issue
- Impact assessment if known (e.g. authentication, data exposure, XSS)

We aim to acknowledge valid reports promptly and coordinate disclosure after a fix is available.

## Secure development

- Never commit API tokens, shared secrets, or production credentials to the repository.
- Review changes that touch payment processing, checkout forms, or admin settings with extra care.
