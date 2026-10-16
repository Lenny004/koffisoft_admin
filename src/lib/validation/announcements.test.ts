import { describe, expect, it } from 'vitest';

import { announcementSchema } from './announcements';

const validAnnouncement = {
  title: 'Horario especial',
  message: 'Cerramos temprano este sábado.',
  ctaLabel: 'Reservar',
  ctaUrl: '/reservas',
  startsAt: '2026-10-25T10:00:00-06:00',
  endsAt: '2026-10-25T18:00:00-06:00',
  displayOrder: 0,
  active: true,
};

describe('announcementSchema', () => {
  it('acepta una ruta relativa segura y fechas ordenadas', () => {
    expect(announcementSchema.safeParse(validAnnouncement).success).toBe(true);
  });

  it('rechaza CTA insegura, vigencia invertida y orden fuera de rango', () => {
    const result = announcementSchema.safeParse({
      ...validAnnouncement,
      ctaUrl: 'javascript:alert(1)',
      startsAt: '2026-10-25T18:00:00-06:00',
      endsAt: '2026-10-25T10:00:00-06:00',
      displayOrder: 100_001,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual(
        expect.arrayContaining(['ctaUrl', 'endsAt', 'displayOrder']),
      );
    }
  });
});
