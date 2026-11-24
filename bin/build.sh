#!/usr/bin/env bash
# Build a versioned customer ZIP: artspay-woocommerce-X.Y.Z.zip + .sha256
# Run from the plugin repository root, or: ./bin/build.sh
#
# ./bin/build.sh --wporg builds the WordPress.org package instead: releases/wporg/artspay-X.Y.Z.zip.
# Same code, but in the folder WordPress.org uses, without the Update URI header (which would stop
# updates from WordPress.org) and without the repository's Markdown files.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

MAIN_PHP="artspay-woocommerce.php"
SLUG="artspay-woocommerce"
WPORG=0
if [[ "${1:-}" == "--wporg" ]]; then
	WPORG=1
	SLUG="artspay"
fi

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

# The plugin header, the constant and the readme must agree, or stores see the wrong version.
HEADER_VERSION="$(sed -n 's/^ \* Version: *\([^ ]*\).*/\1/p' "$MAIN_PHP")"
STABLE_TAG="$(sed -n 's/^Stable tag: *\([^ ]*\).*/\1/p' readme.txt)"
if [[ -z "${ARTSPAY_VERSION:-}" && ( "$VERSION" != "$HEADER_VERSION" || "$VERSION" != "$STABLE_TAG" ) ]]; then
	echo "build: versions differ: constant ${VERSION}, header ${HEADER_VERSION}, readme ${STABLE_TAG}" >&2
	exit 1
fi

RELEASES_DIR="${ROOT}/releases"
if [[ "$WPORG" == 1 ]]; then
	RELEASES_DIR="${RELEASES_DIR}/wporg"
fi
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

rsync -am "${EXCLUDES[@]}" "${ROOT}/" "${STAGE}/"

if [[ "$WPORG" == 1 ]]; then
	grep -v '^ \* Update URI:' "${STAGE}/${MAIN_PHP}" > "${STAGE}/${SLUG}.php"
	rm "${STAGE}/${MAIN_PHP}"
	rm -rf "${STAGE}/docs"
	rm -f "${STAGE}"/*.md
fi

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
