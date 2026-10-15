import { describe, expect, it } from 'vitest';

import { siteContentSchema } from './site';

const valid = {
  location: {
    addressLine: 'Km 20',
    municipality: 'Comasagua',
    department: 'La Libertad',
    phone: '',
    email: '',
    latitude: '',
    longitude: '',
  },
  profile: {
    heroEyebrow: 'Café',
    heroTitle: 'Título',
    heroDescription: 'Descripción',
    heroImageUrl: '',
    aboutTitle: 'Nosotros',
    aboutDescription: 'Historia',
    aboutMission: 'Misión',
    aboutVision: 'Visión',
    aboutTeam: [],
    socialFacebookUrl: '',
    socialInstagramUrl: '',
    socialTikTokUrl: '',
  },
  hours: [
    {
      serviceType: 'public',
      dayOfWeek: 1,
      opensAt: '08:00',
      closesAt: '18:00',
      crossesMidnight: false,
      active: true,
    },
  ],
  overrides: [],
};

describe('siteContentSchema', () => {
  it('acepta el contrato de contenido', () =>
    expect(siteContentSchema.safeParse(valid).success).toBe(true));
  it('rechaza URL insegura y día fuera de rango', () =>
    expect(
      siteContentSchema.safeParse({
        ...valid,
        profile: { ...valid.profile, heroImageUrl: 'javascript:alert(1)' },
        hours: [{ ...valid.hours[0], dayOfWeek: 8 }],
      }).success,
    ).toBe(false));
});
