// Classic checkout with the secure hosted card form and 3D Secure on (see README for setup).
const { test, expect } = require('@playwright/test');
const {
  openCheckout,
  payWithHostedCard,
  completeChallenge,
  expectOrderReceived,
  expectCheckoutError,
} = require('./helpers');

test('Place order stays hidden until a card is entered', async ({ page }) => {
  await openCheckout(page);
  await page.waitForSelector('.artspay-hosted-card__iframe');
  await expect(page.locator('#place_order')).toBeHidden();
});

test('frictionless 3DS card pays', async ({ page }) => {
  await openCheckout(page);
  await payWithHostedCard(page, '4000000000001000');
  await expectOrderReceived(page);
});

test('3DS challenge card pays after the bank code', async ({ page }) => {
  await openCheckout(page);
  await payWithHostedCard(page, '4000000000001091');
  await completeChallenge(page);
  await expectOrderReceived(page);
});

test('failed 3DS check blocks the payment', async ({ page }) => {
  await openCheckout(page);
  await payWithHostedCard(page, '4000000000001018');
  await expectCheckoutError(page, 'Your bank could not verify this card');
});

test('server refuses a hosted card payment that skipped 3DS', async ({ page }) => {
  // Simulate a tampered browser: drop the 3DS step and submit the card token on its own.
  await page.addInitScript(() => {
    let cfg;
    window.ArtsPay = window.ArtsPay || {};
    Object.defineProperty(window.ArtsPay, 'hostedCard', {
      get: () => cfg,
      set: (value) => {
        cfg = Object.assign({}, value, { threeDs: false });
      },
      configurable: true,
    });
  });
  await openCheckout(page);
  await payWithHostedCard(page, '4000000000001000');
  await expectCheckoutError(page, 'Your card needs to be verified with your bank first');
});
