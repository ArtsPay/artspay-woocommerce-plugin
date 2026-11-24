=== ArtsPay for WooCommerce ===
Contributors: artspayintegration
Tags: payments, credit card, apple pay, google pay, subscriptions
Requires at least: 6.0
Tested up to: 7.1
Requires PHP: 8.0
Requires Plugins: woocommerce
Stable tag: 3.4.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Accept cards, Google Pay and Apple Pay in WooCommerce with ArtsPay, the payments company that gives back to the arts.

== Description ==

ArtsPay for WooCommerce is the official ArtsPay plugin. Customers pay by card, Google Pay or Apple Pay without leaving your checkout, and payments are processed by Fat Zebra, ArtsPay's payment gateway.

**You need an ArtsPay account.** [Sign up with ArtsPay](https://www.artspay.com/signup) to get your gateway details.

= Checkout =

* Works with the Checkout block and the classic checkout
* Secure hosted card form inside your checkout, so card numbers never reach your server. This is the default for new stores
* On-site card form, for stores that need it
* Google Pay and Apple Pay on the cart and checkout
* Deferred payments: store the card and charge it when you're ready
* WooCommerce Subscriptions support

= Security =

* 3D Secure with the hosted card form, so the customer's bank verifies the cardholder
* Payment attempt limits that stop card testing, always on
* Optional captcha: Google reCAPTCHA v3 or Cloudflare Turnstile
* Optional Forter fraud screening, if it's turned on for your account
* Works with WooCommerce's High-Performance Order Storage (HPOS)

== Installation ==

1. Go to **Plugins → Add New**, search for "ArtsPay", then install and activate.
2. Go to **WooCommerce → Settings → Payments → ArtsPay**.
3. Enter the gateway username, token and shared secret from ArtsPay, and save.
4. Place an order with a [test card](https://www.artspay.com/docs/developer/testing/test-card-numbers) while test mode is on.
5. When you're ready to go live, enter your live details and turn test mode off.

The [setup guide](https://www.artspay.com/docs/guides/wordpress-woocommerce) covers every setting.

= Already using the "WooCommerce ArtsPay Gateway" ZIP? =

Install this plugin, deactivate the old one, then activate this one. Your settings, orders and saved cards stay as they are. Delete the old copy once you've placed a test order.

== Frequently Asked Questions ==

= Do I need an ArtsPay account? =

Yes. [Sign up](https://www.artspay.com/signup), or [contact ArtsPay](https://www.artspay.com/contact-us) if you have a question first. ArtsPay doesn't appear at checkout until your account details are saved.

= Is the plugin free? =

Yes. ArtsPay charges for processing payments. See [artspay.com](https://www.artspay.com).

= Do card numbers pass through my server? =

Not with the secure hosted form, which is the default for new stores. They go straight from the customer's browser to Fat Zebra. With the on-site card form, card numbers pass through your server, which adds to your PCI requirements. Stores set up before 3.4.0 keep the form they were using.

= Does it support 3D Secure? =

Yes, with the secure hosted form. Ask ArtsPay to turn it on for your account, then set it up under **Fraud & security → 3D Secure**. Your store must use HTTPS.

= Does it support Google Pay and Apple Pay? =

Yes. Turn them on under **Express checkouts** in the ArtsPay settings. Both need HTTPS on a live store. Google Pay needs a merchant ID from ArtsPay, and Apple Pay needs your domain verified.

= Does it work with the Checkout block? =

Yes, from 3.3.0.

= What happens to my settings if I delete the plugin? =

They're kept, along with your order data, so you can reinstall without setting up again.

= Where can I get help? =

Use the support forum for questions about the plugin. For anything about your account or a payment, email support@artspay.com. Please don't post order, card or account details in the forum.

= How do I report a security problem? =

Email support@artspay.com. Please don't post it in the forum.

== Screenshots ==

1. Secure hosted card form on the checkout
2. ArtsPay settings
3. Fraud & security settings

== External services ==

This plugin takes payments, so it connects to the services below. Nothing is contacted until ArtsPay is enabled with your account details, and optional services are only used when you turn them on.

= Fat Zebra (payment gateway) =

Processes every payment. Required.

* **Payments, refunds and captures** (gateway.fatzebra.com.au): your server sends the order number and a link to the order in your dashboard, the amount and currency, the customer's name and IP address, a summary of the items, and the card token. With the on-site card form it also sends the card number, expiry date and security code. Wallet payments send the Google Pay or Apple Pay payment token.
* **Secure hosted card form** (paynow.pmnts.io): the customer's browser loads the form and sends card details straight to Fat Zebra.
* **3D Secure** (cdn.pmnts.io, api.pmnts.io): the customer's browser loads Fat Zebra's script and sends the card token and payment amount so the bank can verify the cardholder. Your server requests an access token with your OAuth details.
* **Apple Pay** (paynow.pmnts.io, gateway.pmnts.io): your server sends your domain and store name to start a payment session, and your domain when you check or register it.

In test mode the plugin uses Fat Zebra's sandbox (gateway.sandbox.fatzebra.com.au, pmnts-sandbox.io and gateway-sandbox.pmnts.io) instead.

[Services agreement](https://www.fatzebra.com/services-agreement), [privacy policy](https://www.fatzebra.com/privacy-policy). ArtsPay's own [terms](https://www.artspay.com/terms-and-conditions) and [privacy policy](https://www.artspay.com/privacy) also apply.

= Forter (fraud screening, through Fat Zebra) =

Used only if you turn on Forter. Order, customer, shipping and item details are sent to Fat Zebra with each payment for screening by Forter. If device fingerprinting is on, the customer's browser loads a script from gateway.pmnts.io that creates a device ID.

[Terms](https://www.forter.com/service-terms-of-use/), [privacy policy](https://www.forter.com/service-privacy-policy/).

= Google Pay =

Used only if you turn on Google Pay. The customer's browser loads pay.google.com on the cart and checkout, which receives the payment amount, currency and store name. The settings page also loads it to preview the button.

[Terms](https://payments.developers.google.com/terms/sellertos), [privacy policy](https://policies.google.com/privacy).

= Apple Pay =

Used only if you turn on Apple Pay. The customer's browser loads Apple's script from applepay.cdn-apple.com on the cart and checkout, and Apple receives the payment amount, currency and store name. The settings page also loads it to preview the button.

[Terms](https://developer.apple.com/apple-pay/terms/apple-pay-web/), [privacy policy](https://www.apple.com/legal/privacy/).

= Google reCAPTCHA =

Used only if you choose it as your captcha. The customer's browser loads it from www.google.com at checkout, and your server sends the captcha token and the customer's IP address to Google to check it.

[Terms](https://policies.google.com/terms), [privacy policy](https://policies.google.com/privacy).

= Cloudflare Turnstile =

Used only if you choose it as your captcha. The customer's browser loads it from challenges.cloudflare.com at checkout, and your server sends the captcha token and the customer's IP address to Cloudflare to check it.

[Terms](https://www.cloudflare.com/website-terms/), [privacy policy](https://www.cloudflare.com/privacypolicy/).

== Changelog ==

= 3.4.0 =
* Update - The plugin is now called ArtsPay for WooCommerce. The gateway, settings, orders and saved cards are unchanged.
* Update - New stores use the secure hosted card form. Existing stores keep the card form they have.
* Update - The plugin no longer comes with built-in test credentials. ArtsPay shows as needing setup, and stays off the checkout, until your account details are saved.
* Update - If the hosted form is chosen without a Gateway Shared Secret, ArtsPay no longer appears at checkout. Before, it fell back to the on-site card form.
* Update - Australian states use WooCommerce's own full names again (for example "Victoria" instead of "VIC"). Saved addresses are unaffected.
* Update - Stores without HTTPS get Fat Zebra's default look for the hosted form, instead of a stylesheet from ArtsPay's CDN.
* Security - The Apple Pay session endpoint only accepts Apple's servers, limits requests that arrive without a valid nonce (filter: `artspay_apple_pay_session_limit`), and no longer returns the gateway's error details.
* Fix - If two copies of the plugin are active, only one runs, and the dashboard says so.
* Fix - Saving a settings sub-page first on a new store no longer blanks the other settings.
* Fix - Unexpected payment errors no longer write raw error data to the order notes.
* Dev - Direct access checks on every file, and `bin/build.sh --wporg` builds the WordPress.org package.

= 3.3.0 =
* Add - Block Cart and Checkout support, including the hosted card form, 3D Secure, captcha, Google Pay and Apple Pay.
* Fix - Payment errors (such as a decline) now show their reason on the block checkout.
* Update - Google Pay and Apple Pay payments skip the captcha. Attempt limits still apply.
* Remove - An uninstall script that deleted options belonging to another plugin.

Earlier versions are in changelog.txt.

== Upgrade Notice ==

= 3.4.0 =
New name: ArtsPay for WooCommerce. Your settings and card form stay the same. If you chose the secure hosted form, check your Gateway Shared Secret is saved: without it, ArtsPay no longer appears at checkout.
