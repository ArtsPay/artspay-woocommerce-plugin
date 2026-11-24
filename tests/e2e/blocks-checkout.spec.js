// Block Checkout with the secure hosted card form and 3D Secure on (see README for setup).
const { test, expect } = require('@playwright/test');
const { allowInsecureTestOrigin, payWithHostedCard, completeChallenge, expectOrderReceived } = require('./helpers');

const PRODUCT_ID = process.env.ARTSPAY_E2E_PRODUCT_ID || '12';
const BLOCKS_PATH = process.env.ARTSPAY_E2E_BLOCKS_CHECKOUT_PATH;

test.skip(!BLOCKS_PATH, 'Set ARTSPAY_E2E_BLOCKS_CHECKOUT_PATH to a page with the Checkout block');

async function openBlockCheckout(page) {
  await allowInsecureTestOrigin(page);
  await page.goto(`/?add-to-cart=${PRODUCT_ID}`);
  await page.goto(BLOCKS_PATH);
  await page.waitForSelector('.wc-block-checkout');

  await page.fill('#email', 'buyer@example.com');
  const fields = {
    'billing-first_name': 'Test',
    'billing-last_name': 'Buyer',
    'billing-address_1': '1 George St',
    'billing-city': 'Sydney',
    'billing-postcode': '2000',
  };
  for (const [id, value] of Object.entries(fields)) {
    await page.fill(`#${id}`, value);
  }
  await page.locator('#billing-state').selectOption('NSW').catch(() => {});

  await page.locator('input[value="fatzebra"]').check({ force: true });
}

async function expectBlockError(page, text) {
  await expect(page.locator('.wc-block-components-notice-banner.is-error, .wc-block-store-notice.is-error').first()).toContainText(text, {
    timeout: 90000,
  });
}

test('ArtsPay is listed and Place order waits for a card', async ({ page }) => {
  await openBlockCheckout(page);
  await page.waitForSelector('.artspay-hosted-card__iframe', { timeout: 30000 });
  await expect(page.locator('.wc-block-components-checkout-place-order-button')).toBeHidden();
});

test('block: frictionless 3DS card pays', async ({ page }) => {
  await openBlockCheckout(page);
  await payWithHostedCard(page, '4000000000001000');
  await expectOrderReceived(page);
});

test('block: 3DS challenge card pays after the bank code', async ({ page }) => {
  await openBlockCheckout(page);
  await payWithHostedCard(page, '4000000000001091');
  await completeChallenge(page);
  await expectOrderReceived(page);
});

test('block: failed 3DS check blocks the payment', async ({ page }) => {
  await openBlockCheckout(page);
  await payWithHostedCard(page, '4000000000001018');
  await expectBlockError(page, 'Your bank could not verify this card');
});

// Google Pay can't complete headless (it needs a signed-in Google account), so this serves a fake
// pay.js that returns a made-up token. Fat Zebra declines it, which proves the token reached the
// gateway, and checks the checkout recovers. Needs Google Pay switched on in the store.
const FAKE_PAY_JS = `window.google = window.google || {}; window.google.payments = { api: { PaymentsClient: function () {
  this.isReadyToPay = function () { return Promise.resolve({ result: true }); };
  this.createButton = function (o) { var b = document.createElement('button'); b.type = 'button'; b.className = 'fake-gpay'; b.textContent = 'Fake Google Pay'; b.onclick = o.onClick; return b; };
  this.loadPaymentData = function () { return Promise.resolve({
    email: 'wallet@example.com',
    paymentMethodData: {
      info: { billingAddress: { name: 'Wallet Buyer', address1: '2 Pitt St', locality: 'Sydney', administrativeArea: 'NSW', postalCode: '2000', countryCode: 'AU', phoneNumber: '0400000001' } },
      tokenizationData: { token: JSON.stringify({ protocolVersion: 'ECv2', signature: 'fake', signedMessage: '{}' }) }
    } }); };
} } };`;

test('block: Google Pay token reaches the gateway and a decline restores the checkout', async ({ page }) => {
  test.skip(!process.env.ARTSPAY_E2E_GOOGLE_PAY, 'Set ARTSPAY_E2E_GOOGLE_PAY=1 with Google Pay switched on');
  await page.route('**/pay.google.com/gp/p/js/pay.js*', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: FAKE_PAY_JS })
  );
  await page.goto(`/?add-to-cart=${PRODUCT_ID}`);
  await page.goto(BLOCKS_PATH);
  await page.click('.fake-gpay');
  await expectBlockError(page, 'Wallet details');
  await expect(page.locator('#billing-first_name')).toHaveValue('Wallet');
  await expect(page.locator('input[value="fatzebra"]')).toHaveCount(1);
  await expect(page.locator('.wc-block-components-checkout-place-order-button')).toBeEnabled();
});

// Apple Pay can't run in Chromium, so this stubs ApplePaySession and checks a click on the
// <apple-pay-button> starts a session, on the Cart and Checkout blocks. Needs Apple Pay switched on.
const APPLE_STUB = `window.__applePay = [];
window.ApplePaySession = function (version, request) { window.__applePay.push(request); this.begin = function () { window.__applePay.push('begin'); }; this.abort = function () {}; };
window.ApplePaySession.canMakePayments = function () { return true; };
window.ApplePaySession.supportsVersion = function () { return true; };
window.ApplePaySession.STATUS_SUCCESS = 0;`;

for (const [where, pathEnv] of [['checkout', 'ARTSPAY_E2E_BLOCKS_CHECKOUT_PATH'], ['cart', 'ARTSPAY_E2E_BLOCKS_CART_PATH']]) {
  test(`block ${where}: Apple Pay button starts a payment session`, async ({ page }) => {
    test.skip(!process.env.ARTSPAY_E2E_APPLE_PAY || !process.env[pathEnv], `Set ARTSPAY_E2E_APPLE_PAY=1 and ${pathEnv} with Apple Pay switched on`);
    await page.addInitScript(APPLE_STUB);
    await page.goto(`/?add-to-cart=${PRODUCT_ID}`);
    await page.goto(process.env[pathEnv]);
    await page.locator('apple-pay-button').click({ force: true });
    await expect.poll(() => page.evaluate(() => window.__applePay.includes('begin'))).toBe(true);
  });
}
