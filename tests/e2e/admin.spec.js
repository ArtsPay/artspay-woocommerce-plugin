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
  three_ds: ['three_ds_enabled'],
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
  const username = await page.inputValue('#woocommerce_fatzebra_test_username');
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
  await expect(page.locator('#woocommerce_fatzebra_test_username')).toHaveValue(username);
  await expect(page.locator('#woocommerce_fatzebra_card_form')).toHaveValue(cardForm);
  await expect(page.locator('#woocommerce_fatzebra_test_oauth_access_key')).not.toHaveValue('');
});

test('3D Secure page says whether Fat Zebra accepts the OAuth details', async ({ page }) => {
  const secret = page.locator('#woocommerce_fatzebra_test_oauth_access_secret');
  const connection = page.locator('.artspay-3ds-connection');
  const save = async (value) => {
    await page.goto(SETTINGS);
    await secret.fill(value);
    await page.click('button[name="save"]');
    await page.waitForLoadState('networkidle');
    await page.goto(`${SETTINGS}&artspay_page=three_ds`);
  };

  await page.goto(SETTINGS);
  const original = await secret.inputValue();
  await page.goto(`${SETTINGS}&artspay_page=three_ds`);
  await expect(connection).toContainText('Fat Zebra accepts these OAuth details');
  try {
    await save('wrong-secret');
    await expect(connection).toContainText('Fat Zebra refused the OAuth access key or secret');
    await page.goto(SETTINGS);
    await expect(page.locator('#artspay-fraud-security .artspay-express-settings__label').nth(1)).toContainText('Needs setup');
  } finally {
    await save(original);
  }
  await expect(connection).toContainText('Fat Zebra accepts these OAuth details');
});

test('account details: tabs keep test and live apart', async ({ page }) => {
  const liveUser = page.locator('#woocommerce_fatzebra_username');
  const testUser = page.locator('#woocommerce_fatzebra_test_username');
  const save = async () => {
    await page.click('button[name="save"]');
    await page.waitForLoadState('networkidle');
  };

  await page.goto(SETTINGS);
  // The store is in test mode, so Test shows first and Live is hidden.
  await expect(testUser).toBeVisible();
  await expect(liveUser).toBeHidden();
  await expect(page.locator('#artspay-account-tab-test')).toContainText('In use');
  const originalLive = await liveUser.inputValue();
  const originalTest = await testUser.inputValue();

  // Looking at Live doesn't change the mode.
  await page.click('#artspay-account-tab-live');
  await expect(liveUser).toBeVisible();
  await expect(testUser).toBeHidden();
  await expect(page.locator('#woocommerce_fatzebra_sandbox_mode_yes')).toBeChecked();

  try {
    await liveUser.fill('live-user-e2e');
    await save();
    await expect(testUser).toHaveValue(originalTest);
    await expect(liveUser).toHaveValue('live-user-e2e');
    await expect(page.locator('#woocommerce_fatzebra_sandbox_mode_yes')).toBeChecked();
  } finally {
    await page.goto(SETTINGS);
    await page.click('#artspay-account-tab-live');
    await liveUser.fill(originalLive);
    await save();
  }
});

test('choosing a mode shows its details, and says when they are incomplete', async ({ page }) => {
  await page.goto(SETTINGS);
  await page.check('#woocommerce_fatzebra_sandbox_mode_no');
  await expect(page.locator('#woocommerce_fatzebra_username')).toBeVisible();
  const token = page.locator('#woocommerce_fatzebra_token');
  const original = await token.inputValue();
  try {
    await token.fill('');
    await page.click('button[name="save"]');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.artspay-needs-setup')).toContainText('the live account details are incomplete');
    await expect(page.locator('#artspay-account-panel-live')).toContainText('Still needed: Gateway token');
  } finally {
    await page.goto(SETTINGS);
    await page.check('#woocommerce_fatzebra_sandbox_mode_no');
    await token.fill(original);
    await page.check('#woocommerce_fatzebra_sandbox_mode_yes');
    await page.click('button[name="save"]');
    await page.waitForLoadState('networkidle');
  }
  await expect(page.locator('#woocommerce_fatzebra_sandbox_mode_yes')).toBeChecked();
});
