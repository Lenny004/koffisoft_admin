import { expect, test } from '@playwright/test';

test('muestra el acceso del panel', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Koffi-Soft.*(Iniciar sesión|Primer uso)/u);
  await expect(
    page.getByRole('heading', { name: /iniciar sesión|configura el propietario/i }),
  ).toBeVisible();
});

test('muestra el formulario de recuperación de contraseña', async ({ page }) => {
  await page.goto('/?recuperar=1');
  await expect(page.getByRole('heading', { name: /olvidé mi contraseña/i })).toBeVisible();
  await expect(page.getByLabel(/correo electrónico/i)).toBeVisible();
});

test('pide un token válido para restablecer la contraseña', async ({ page }) => {
  await page.goto('/restablecer');
  await expect(page.getByRole('heading', { name: /restablecer contraseña/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /solicitar enlace/i })).toBeVisible();
});
