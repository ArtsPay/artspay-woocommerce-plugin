#!/usr/bin/env bash
# Build a versioned customer ZIP: artspay-woocommerce-X.Y.Z.zip + .sha256
# Run from the plugin repository root, or: ./bin/build.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SLUG="artspay-woocommerce"
MAIN_PHP="${SLUG}.php"

if [[ ! -f "$MAIN_PHP" ]]; then
	echo "build: expected ${MAIN_PHP} in ${ROOT}" >&2
	exit 1
fi

# Version: ARTSPAY_VERSION=1.2.3 ./bin/build.sh overrides plugin constant.
if [[ -n "${ARTSPAY_VERSION:-}" ]]; then
	VERSION="$ARTSPAY_VERSION"
else
	VERSION="$(grep -E "const ARTSPAY_PLUGIN_VERSION" "$MAIN_PHP" | sed -n "s/.*const ARTSPAY_PLUGIN_VERSION = '\([^']*\)'.*/\1/p")"
fi

if [[ -z "$VERSION" ]]; then
	echo "build: could not read version from ${MAIN_PHP}" >&2
	exit 1
fi

RELEASES_DIR="${ROOT}/releases"
mkdir -p "$RELEASES_DIR"

TMP="$(mktemp -d)"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

STAGE="${TMP}/${SLUG}"
mkdir -p "$STAGE"

# Always omit VCS and local build output (even if missing from .distignore).
EXCLUDES=(
	--exclude='.git/'
	--exclude='releases/'
)
if [[ -f "${ROOT}/.distignore" ]]; then
	while IFS= read -r line || [[ -n "$line" ]]; do
		[[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
		line="${line//$'\r'/}"
		EXCLUDES+=( --exclude="$line" )
	done < "${ROOT}/.distignore"
fi

rsync -a "${EXCLUDES[@]}" "${ROOT}/" "${STAGE}/"

OUT_ZIP="${RELEASES_DIR}/${SLUG}-${VERSION}.zip"
rm -f "${OUT_ZIP}" "${OUT_ZIP}.sha256"
( cd "$TMP" && zip -r -q "$OUT_ZIP" "$SLUG" )

if command -v shasum >/dev/null 2>&1; then
	( cd "$RELEASES_DIR" && shasum -a 256 "${SLUG}-${VERSION}.zip" >"${SLUG}-${VERSION}.zip.sha256" )
	echo "build: ${OUT_ZIP}"
	echo "build: ${RELEASES_DIR}/${SLUG}-${VERSION}.zip.sha256"
	cat "${RELEASES_DIR}/${SLUG}-${VERSION}.zip.sha256"
else
	echo "build: ${OUT_ZIP}"
	echo "build: (install shasum/openssl to write .sha256 alongside the zip)" >&2
fi
