import { expect, test } from '@playwright/test';

test('muestra el panel placeholder', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Koffi-Soft.*Administración/);
  await expect(page.getByRole('heading', { name: /panel privado/i })).toBeVisible();
});
