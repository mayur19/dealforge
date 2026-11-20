import { expect, test, type Page } from '@playwright/test';

/** Development-only demo credentials (see README). */
const PASSWORD = 'DemoPassword!2026';
const PRICING = 'pricing@helix.example';
const REP = 'rep@helix.example';

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome');
}

test('redirects anonymous users to the login page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
});

test('rejects invalid credentials', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(REP);
  await page.getByLabel('Password').fill('wrong-password-123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toHaveText('Invalid email or password.');
});

test('sales rep sees the catalog read-only and signs out', async ({ page }) => {
  await signIn(page, REP);
  await page.getByRole('link', { name: 'Product catalog' }).click();
  await expect(page.getByRole('heading', { name: 'Product catalog' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'DEPLOY-DAY' })).toBeVisible();
  await expect(page.getByRole('form', { name: 'New product' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Price books/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('pricing manager creates a product with exact integer money', async ({ page }) => {
  const sku = `E2E-${Date.now()}`;
  await signIn(page, PRICING);
  await page.goto('/products');
  const form = page.getByRole('form', { name: 'New product' });
  await form.getByLabel('SKU').fill(sku);
  await form.getByLabel('Name', { exact: true }).fill('E2E onboarding workshop');
  await form.getByLabel('Category').fill('Services');
  await form.getByLabel('Unit', { exact: true }).fill('session');
  await form.getByLabel('List price (USD)').fill('1,250.10');
  await form.getByLabel('Unit cost (USD)').fill('800.05');
  await form.getByRole('button', { name: 'Create product' }).click();
  await expect(page.getByText(`Created ${sku}.`)).toBeVisible();
});

test('pending screens name their backlog ticket', async ({ page }) => {
  await signIn(page, REP);
  await page.getByRole('link', { name: /Quote builder/ }).click();
  await expect(page.getByRole('heading', { name: 'Quote builder' })).toBeVisible();
  await expect(page.getByText('DF-036')).toBeVisible();
});

// Acceptance scenarios D-01..D-21 (PRD §9) are tracked as DF-055..DF-058.
