import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
  // La ruta permite verificar que una pantalla privada no queda pública por accidente.
  // No representa autenticación real: se habilita explícitamente solo para pruebas locales.
  if (env.ENABLE_PROTECTED_TEST_ROUTE !== 'true') {
    error(404, 'Ruta de prueba no habilitada');
  }

  return {
    status: 'habilitada para pruebas locales',
  };
};
