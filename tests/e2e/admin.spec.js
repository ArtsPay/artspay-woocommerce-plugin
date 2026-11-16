// ArtsPay settings screens: sections, sub-pages, and partial saves that keep other settings.
const { test, expect } = require('@playwright/test');

const SETTINGS = '/wp-admin/admin.php?page=wc-settings&tab=checkout&section=fatzebra';

test.beforeEach(async ({ page }) => {
  await page.goto('/wp-login.php');
  await page.fill('#user_login', process.env.ARTSPAY_E2E_ADMIN_USER || 'admin');
  await page.fill('#user_pass', process.env.ARTSPAY_E2E_ADMIN_PASSWORD || 'admin');
  await page.click('#wp-submit');
  await page.waitForURL(/wp-admin/);
});

test('main page lists the sections and Fraud & security rows', async ({ page }) => {
  await page.goto(SETTINGS);
  await expect(page.locator('.artspay-gateway-settings__heading')).toHaveText([
    'General',
    'Account details',
    'Card form',
    'Express checkouts',
    'Fraud & security',
    'Advanced settings',
  ]);
  const rows = page.locator('#artspay-fraud-security .artspay-express-settings__label');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(1)).toContainText('3D Secure');
});

const SUBPAGES = {
  forter: ['fraud_data', 'fraud_device_id', 'fraud_decline_notify'],
  three_ds: ['three_ds_enabled', 'oauth_access_key', 'oauth_access_secret'],
  captcha: ['captcha_enabled', 'captcha_provider', 'captcha_site_key', 'captcha_secret_key'],
};

for (const [subpage, fields] of Object.entries(SUBPAGES)) {
  test(`${subpage} sub-page shows only its own fields`, async ({ page }) => {
    await page.goto(`${SETTINGS}&artspay_page=${subpage}`);
    const names = await page
      .locator('.form-table [name^="woocommerce_fatzebra_"]')
      .evaluateAll((els) => els.map((el) => el.name.replace('woocommerce_fatzebra_', '')));
    expect(names).toEqual(fields);
  });
}

test('saving a sub-page keeps settings from other pages', async ({ page }) => {
  await page.goto(SETTINGS);
  const username = await page.inputValue('#woocommerce_fatzebra_username');
  const cardForm = await page.inputValue('#woocommerce_fatzebra_card_form');

  await page.goto(`${SETTINGS}&artspay_page=captcha`);
  const provider = page.locator('#woocommerce_fatzebra_captcha_provider');
  const original = await provider.inputValue();
  await provider.selectOption(original === 'google' ? 'cloudflare' : 'google');
  await page.click('button[name="save"]');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/artspay_page=captcha/);

  // Put the provider back so the store is left as it was.
  await provider.selectOption(original);
  await page.click('button[name="save"]');
  await page.waitForLoadState('networkidle');

  await page.goto(SETTINGS);
  await expect(page.locator('#woocommerce_fatzebra_username')).toHaveValue(username);
  await expect(page.locator('#woocommerce_fatzebra_card_form')).toHaveValue(cardForm);

  await page.goto(`${SETTINGS}&artspay_page=three_ds`);
  await expect(page.locator('#woocommerce_fatzebra_oauth_access_key')).not.toHaveValue('');
});
