import { describe, expect, it } from 'vitest';

import { announcementSchema } from './announcements';

const base = {
  title: 'Horario especial',
  message: 'Cerramos temprano.',
  displayOrder: 0,
  active: true,
};

describe('validación de avisos', () => {
  it('acepta CTA interna y HTTP(S)', () => {
    expect(announcementSchema.safeParse({ ...base, ctaUrl: '/reservas' }).success).toBe(true);
    expect(
      announcementSchema.safeParse({ ...base, ctaUrl: 'https://koffi.example/reservas' }).success,
    ).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>x</script>',
    'vbscript:msgbox(1)',
    'ftp://externo.example',
    'https:\\externo.example',
    '//externo.example',
  ])('rechaza CTA insegura %s', (ctaUrl) =>
    expect(announcementSchema.safeParse({ ...base, ctaUrl }).success).toBe(false),
  );
});
