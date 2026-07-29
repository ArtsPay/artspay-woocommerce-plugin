#!/usr/bin/env bash
# Lint all PHP files under the plugin root (no WordPress required).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

count=0
errors=0

while IFS= read -r -d '' file; do
	count=$((count + 1))
	if ! php -l "$file" > /dev/null; then
		php -l "$file"
		errors=$((errors + 1))
	fi
done < <(find . -name '*.php' -print0)

if [[ "$errors" -gt 0 ]]; then
	echo "check-php-syntax: $errors file(s) failed." >&2
	exit 1
fi

echo "check-php-syntax: OK ($count PHP file(s))."
