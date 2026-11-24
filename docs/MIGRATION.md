# Upgrading

- [To 3.4.1](#to-341)
- [To 3.4.0](#to-340)
- [From a pre-3.1.0 install](#from-a-pre-310-install)

## To 3.4.1

Test and live account details are now kept separately, under **Account details**.

- **Store in live mode:** nothing moves. Your details are in the **Live** tab, and **Test** is empty.
- **Store in test mode:** your details are copied to **Test**, and also stay in **Live**. If both are the same, the Live tab says **Check**: enter your live ones before you switch.
- **Enable Test Mode** is now **Mode** (Test or Live).
- The OAuth key and secret moved from the 3D Secure page to Account details. Card logos and deferred payments moved to Card form.
- Google Pay has a test and a live gateway merchant ID.
- Orders record the mode they were paid in. In test mode you can't refund, capture or renew a live order. Once a store is live, a test order can be refunded (in the sandbox) but not captured or renewed. Orders from before 3.4.1 use the store's current mode.

Going back to an older version is safe: the live details keep the setting names older versions use.

For developers: read credentials with `get_mode_option()` or `get_gateway_credentials()`. Test values are stored with a `test_` prefix.

## To 3.4.0

- The plugin is called **ArtsPay for WooCommerce**. The gateway ID (`fatzebra`), settings, orders and saved cards are unchanged.
- There are no built-in test credentials. ArtsPay stays off the checkout until your account details are saved.
- If the card form is **Secure hosted form**, the **Shared secret** must be saved. Without it ArtsPay no longer appears at checkout. Earlier versions fell back to the on-site form.
- New stores use the secure hosted form. Existing stores keep the form they have.
- Australian states show WooCommerce's full names, such as "Victoria". Saved addresses are unaffected.

## From a pre-3.1.0 install

Version 3.1.0 was a structural refactor (namespaced `ArtsPay\*` classes, PSR-4 autoloading) that also removed several settings that had become redundant or unused. If you're upgrading a store that's been running an older version of this plugin, read this before you update.

### Settings that no longer exist

#### Test Mode — merged into Sandbox Mode

Older versions had two separate toggles: **Sandbox Mode** (which gateway URL to call) and **Test Mode** (whether transactions were flagged as test to Fat Zebra). These are now the same setting.

- Before: you could run, for example, the sandbox gateway with Test Mode off, or the live gateway with Test Mode on.
- Now: **Sandbox Mode** alone controls both — sandbox on always sends `test: true` to Fat Zebra, live always sends `test: false`.

If your store had these two settings in different states, transaction behaviour changes after upgrading. Check **WooCommerce → Settings → Payments → ArtsPay** and confirm **Sandbox Mode** reflects what you actually want (off for real, live-charged transactions).

#### Hosted Payment Page (HPP) — removed entirely

The **Use Hosted Payment Page**, **Logo URL**, and **CSS URL** settings are gone; HPP checkout is no longer supported. If your store was using HPP, checkout now falls through to **Inline**. Test checkout on staging after upgrading — the customer-facing flow changes from a redirect to an on-site form.

From 3.2.0, a hosted card form is back as **Card form → Secure hosted form**. It loads Fat Zebra's form inside the checkout rather than redirecting, and supports 3D Secure. The old Logo URL and CSS URL settings do not return.

#### Payment Method Title / Payment Icon — removed

These admin fields (custom checkout title text and a custom icon URL) no longer exist. The gateway now shows a fixed title ("Credit / Debit Card", translatable via the `artspay` text domain) and a fixed icon. If you need a custom icon, it's now a developer-level change via the `woocommerce_fatzebra_icon` filter rather than an admin setting — there is no admin UI replacement for icon customization.

### For developers extending this plugin

The 3.1.0 refactor also renamed/moved classes — if you have custom code hooking into the old structure, it will break silently (no deprecation shims exist):

- `includes/Gateways/GooglePayGateway.php` no longer exists; Google Pay now lives under `includes/Express/GooglePay.php`.
- Classes moved under the `ArtsPay\*` namespace with PSR-4 autoloading — any direct `require`/`include` of plugin files by third-party code should switch to referencing the namespaced classes instead.

### Checklist

1. Note your current **Sandbox Mode** and (if present) **Test Mode** settings before upgrading.
2. Upgrade the plugin.
3. Re-open **WooCommerce → Settings → Payments → ArtsPay** and confirm **Mode** is correct. It was called Sandbox Mode, and it fully controls test and live behaviour.
4. If you were using the Hosted Payment Page, test a full Inline checkout on staging.
5. If you'd customized the payment title or icon, expect the defaults; use the `woocommerce_fatzebra_icon` filter if a custom icon is required.
6. Run a full sandbox checkout (purchase, refund, and subscription renewal if applicable) before considering the upgrade complete.
