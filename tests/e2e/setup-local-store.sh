#!/usr/bin/env bash
# Build a throwaway WooCommerce store (SQLite, PHP's built-in server) for the browser tests.
# Needs php, wp-cli and the Fat Zebra sandbox credentials in the environment (see README.md).
set -euo pipefail

PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STORE_DIR="${ARTSPAY_E2E_STORE_DIR:-/tmp/artspay-e2e-store}"
HOST="${ARTSPAY_E2E_HOST:-lvh.me:8099}"
WP="${WP_CLI:-wp} --path=$STORE_DIR/site"

for var in FZ_USERNAME FZ_TOKEN FZ_SHARED_SECRET FZ_OAUTH_KEY FZ_OAUTH_SECRET; do
	if [[ -z "${!var:-}" ]]; then
		echo "setup: set $var (Fat Zebra sandbox credentials)" >&2
		exit 1
	fi
done

if [[ -e "$STORE_DIR" ]]; then
	echo "setup: $STORE_DIR already exists, remove it first" >&2
	exit 1
fi

mkdir -p "$STORE_DIR/site" "$STORE_DIR/db"
$WP core download --quiet

# WordPress can't start without a database, so the SQLite plugin is fetched directly, then its
# drop-in lets WordPress run without MySQL.
curl -sSL -o "$STORE_DIR/sqlite.zip" https://downloads.wordpress.org/plugin/sqlite-database-integration.latest-stable.zip
unzip -q "$STORE_DIR/sqlite.zip" -d "$STORE_DIR/site/wp-content/plugins/"
rm "$STORE_DIR/sqlite.zip"
SQLITE="$STORE_DIR/site/wp-content/plugins/sqlite-database-integration"
sed -e "s#{SQLITE_IMPLEMENTATION_FOLDER_PATH}#$SQLITE#" -e "s#{SQLITE_PLUGIN}#sqlite-database-integration/load.php#" \
	"$SQLITE/db.copy" > "$STORE_DIR/site/wp-content/db.php"

cat > "$STORE_DIR/site/wp-config.php" <<EOF
<?php
define( 'DB_DIR', '$STORE_DIR/db/' );
define( 'DB_FILE', 'wp.sqlite' );
define( 'DB_NAME', 'wp' );
define( 'DB_USER', '' );
define( 'DB_PASSWORD', '' );
define( 'DB_HOST', '' );
define( 'DB_CHARSET', 'utf8' );
define( 'DB_COLLATE', '' );
foreach ( array( 'AUTH_KEY', 'SECURE_AUTH_KEY', 'LOGGED_IN_KEY', 'NONCE_KEY', 'AUTH_SALT', 'SECURE_AUTH_SALT', 'LOGGED_IN_SALT', 'NONCE_SALT' ) as \$k ) { define( \$k, 'artspay-e2e-' . \$k ); }
\$table_prefix = 'wp_';
define( 'WP_HOME', 'http://$HOST' );
define( 'WP_SITEURL', 'http://$HOST' );
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', '$STORE_DIR/debug.log' );
define( 'WP_DEBUG_DISPLAY', false );
define( 'DISABLE_WP_CRON', true );
if ( ! defined( 'ABSPATH' ) ) { define( 'ABSPATH', __DIR__ . '/' ); }
require_once ABSPATH . 'wp-settings.php';
EOF

$WP core install --url="http://$HOST" --title="ArtsPay E2E" --admin_user=admin --admin_password=admin \
	--admin_email=test@example.com --skip-email --quiet
$WP plugin install woocommerce --quiet

rsync -a --exclude .git --exclude releases --exclude tests --exclude 'docs/PLAN-*' \
	"$PLUGIN_DIR/" "$STORE_DIR/site/wp-content/plugins/artspay-woocommerce/"
$WP plugin activate woocommerce artspay-woocommerce --quiet

$WP option update woocommerce_currency AUD --quiet
$WP option update woocommerce_default_country 'AU:NSW' --quiet
$WP option update woocommerce_coming_soon no --quiet

# Classic (shortcode) checkout: the block checkout is covered separately.
CHECKOUT=$($WP post create --post_type=page --post_status=publish --post_title=Checkout --post_content='[woocommerce_checkout]' --porcelain)
CART=$($WP post create --post_type=page --post_status=publish --post_title=Cart --post_content='[woocommerce_cart]' --porcelain)
$WP option update woocommerce_checkout_page_id "$CHECKOUT" --quiet
$WP option update woocommerce_cart_page_id "$CART" --quiet
PRODUCT=$($WP wc product create --name="Test Print" --type=simple --regular_price=25.00 --virtual=true --user=admin --porcelain)

# Fat Zebra references must be unique per merchant, and a shared sandbox merchant has used low
# order numbers already. Start this store's IDs high to avoid "Reference is already taken".
$WP eval 'global $wpdb; $wpdb->query( "INSERT INTO {$wpdb->posts} (ID, post_type, post_status) VALUES (" . ( 900000 + wp_rand( 0, 99999 ) ) . ", \"artspay_e2e_seed\", \"trash\")" );' --quiet

SETTINGS=$(php -r 'echo json_encode( array(
	"enabled" => "yes", "sandbox_mode" => "yes", "debug_mode" => "yes",
	"username" => getenv( "FZ_USERNAME" ), "token" => getenv( "FZ_TOKEN" ), "shared_secret" => getenv( "FZ_SHARED_SECRET" ),
	"card_form" => "hosted", "three_ds_enabled" => "yes",
	"oauth_access_key" => getenv( "FZ_OAUTH_KEY" ), "oauth_access_secret" => getenv( "FZ_OAUTH_SECRET" ),
	"deferred_payments" => "no", "captcha_enabled" => "no", "fraud_data" => "no",
) );')
$WP option update woocommerce_fatzebra_settings "$SETTINGS" --format=json --quiet

cat <<EOF

Store ready in $STORE_DIR.
Start it:   php -S 127.0.0.1:${HOST##*:} -t $STORE_DIR/site
Then run:   ARTSPAY_E2E_BASE_URL=http://$HOST ARTSPAY_E2E_PRODUCT_ID=$PRODUCT ARTSPAY_E2E_CHECKOUT_PATH=/?page_id=$CHECKOUT npx playwright test
EOF
