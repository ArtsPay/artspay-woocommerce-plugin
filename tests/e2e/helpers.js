// Shared steps for the checkout tests.
const { expect } = require('@playwright/test');

const PRODUCT_ID = process.env.ARTSPAY_E2E_PRODUCT_ID || '12';
const CHECKOUT_PATH = process.env.ARTSPAY_E2E_CHECKOUT_PATH || '/?page_id=10';

/**
 * Stand in for HTTPS on a plain-http test store. fatzebra.js calls crypto.randomUUID, which
 * browsers only provide on secure pages. Real stores are HTTPS, so this is test-only.
 */
async function allowInsecureTestOrigin(page) {
  await page.addInitScript(() => {
    if (window.crypto && !window.crypto.randomUUID) {
      window.crypto.randomUUID = () =>
        '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
          (c ^ (window.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
        );
    }
  });
}

/** Add the test product and fill in billing details on the checkout. */
async function openCheckout(page) {
  await allowInsecureTestOrigin(page);
  await page.goto(`/?add-to-cart=${PRODUCT_ID}`);
  await page.goto(CHECKOUT_PATH);

  const fields = {
    billing_first_name: 'Test',
    billing_last_name: 'Buyer',
    billing_address_1: '1 George St',
    billing_city: 'Sydney',
    billing_postcode: '2000',
    billing_phone: '0400000000',
    billing_email: 'buyer@example.com',
  };
  for (const [id, value] of Object.entries(fields)) {
    await page.fill(`#${id}`, value);
  }
  await page.selectOption('#billing_state', 'NSW').catch(() => {});
}

/** Enter a card in the Fat Zebra hosted form and press its Pay now button. */
async function payWithHostedCard(page, cardNumber) {
  await page.waitForSelector('.artspay-hosted-card__iframe', { timeout: 30000 });
  const frame = page.frameLocator('.artspay-hosted-card__iframe');
  await frame.locator('#payment_request_card_holder').fill('Test Buyer', { timeout: 30000 });
  await frame.locator('#payment_request_card_number').fill(cardNumber);
  await frame.locator('#payment_request_expiry_date').pressSequentially('122030');
  await frame.locator('#payment_request_security_code').fill('123');
  await frame.locator('#pay-now').click();
}

/** Complete the sandbox bank challenge (Cardinal) with its fixed code. */
async function completeChallenge(page) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      if (!/cardinal|acs|challenge/i.test(frame.url())) continue;
      const input = frame.locator('input[type="text"], input[type="tel"], input[type="password"]').first();
      if (await input.count()) {
        await input.fill('1234');
        await frame.locator('input[type="submit"], button[type="submit"], button').first().click();
        return;
      }
    }
    await page.waitForTimeout(1000);
  }
  throw new Error('No 3DS challenge appeared');
}

async function expectOrderReceived(page) {
  await page.waitForURL(/order-received/, { timeout: 90000 });
}

async function expectCheckoutError(page, text) {
  const notice = page.locator('.woocommerce-error, .wc-block-components-notice-banner.is-error').first();
  await expect(notice).toContainText(text, { timeout: 90000 });
}

module.exports = {
  allowInsecureTestOrigin,
  openCheckout,
  payWithHostedCard,
  completeChallenge,
  expectOrderReceived,
  expectCheckoutError,
};
