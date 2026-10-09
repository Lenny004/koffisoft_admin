import { expect, test } from '@playwright/test';

test('muestra el acceso del panel', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Koffi-Soft.*Iniciar sesión/u);
  await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();
});
