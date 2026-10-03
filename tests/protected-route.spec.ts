import { expect, test } from '@playwright/test';

test('no publica la ruta protegida de prueba por defecto', async ({ page }) => {
  const response = await page.goto('/prueba-protegida');

  expect(response?.status()).toBe(404);
});
