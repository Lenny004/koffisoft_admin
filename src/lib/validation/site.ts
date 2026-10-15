import { z } from 'zod';

import { FORM_LIMITS } from './limits';

const url = z
  .string()
  .trim()
  .max(FORM_LIMITS.site.imageUrlMaxLength)
  .refine((value) => {
    if (!value) return true;
    try {
      return ['http:', 'https:'].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, 'Usa una URL HTTP(S) válida.')
  .transform((value) => value || null);

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/u, 'Usa el formato HH:mm.');
const optionalCoordinate = (minimum: number, maximum: number) =>
  z.union([z.literal('').transform(() => null), z.coerce.number().min(minimum).max(maximum)]);
const serviceType = z
  .string()
  .trim()
  .min(1)
  .max(FORM_LIMITS.site.serviceTypeMaxLength)
  .regex(/^[a-z][a-z0-9_-]*$/u, 'Usa minúsculas, números, guion o guion bajo.');

const teamMember = z.object({
  name: z.string().trim().min(1).max(FORM_LIMITS.site.teamNameMaxLength),
  role: z.string().trim().min(1).max(FORM_LIMITS.site.teamRoleMaxLength),
  description: z.string().trim().min(1).max(FORM_LIMITS.site.teamDescriptionMaxLength),
});

export const siteContentSchema = z.object({
  location: z.object({
    addressLine: z.string().trim().min(1).max(FORM_LIMITS.site.addressMaxLength),
    municipality: z.string().trim().min(1).max(FORM_LIMITS.site.municipalityMaxLength),
    department: z.string().trim().min(1).max(FORM_LIMITS.site.departmentMaxLength),
    phone: z
      .string()
      .trim()
      .max(FORM_LIMITS.site.phoneMaxLength)
      .transform((value) => value || null),
    email: z.union([
      z.literal('').transform(() => null),
      z.string().trim().email().max(FORM_LIMITS.site.emailMaxLength),
    ]),
    latitude: optionalCoordinate(-90, 90),
    longitude: optionalCoordinate(-180, 180),
  }),
  profile: z.object({
    heroEyebrow: z.string().trim().min(1).max(FORM_LIMITS.site.heroEyebrowMaxLength),
    heroTitle: z.string().trim().min(1).max(FORM_LIMITS.site.heroTitleMaxLength),
    heroDescription: z.string().trim().min(1).max(FORM_LIMITS.site.editorialMaxLength),
    heroImageUrl: url,
    aboutTitle: z.string().trim().min(1).max(FORM_LIMITS.site.heroTitleMaxLength),
    aboutDescription: z.string().trim().min(1).max(FORM_LIMITS.site.editorialMaxLength),
    aboutMission: z.string().trim().min(1).max(FORM_LIMITS.site.editorialMaxLength),
    aboutVision: z.string().trim().min(1).max(FORM_LIMITS.site.editorialMaxLength),
    aboutTeam: z.array(teamMember).max(FORM_LIMITS.site.maxTeam),
    socialFacebookUrl: url,
    socialInstagramUrl: url,
    socialTikTokUrl: url,
  }),
  hours: z
    .array(
      z.object({
        serviceType,
        dayOfWeek: z.coerce.number().int().min(1).max(7),
        opensAt: time,
        closesAt: time,
        crossesMidnight: z.boolean(),
        active: z.boolean(),
      }),
    )
    .max(FORM_LIMITS.site.maxHours),
  overrides: z
    .array(
      z.object({
        serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u),
        serviceType,
        opensAt: time.nullable(),
        closesAt: time.nullable(),
        isClosed: z.boolean(),
        reason: z.string().trim().min(1).max(FORM_LIMITS.site.reasonMaxLength),
      }),
    )
    .max(FORM_LIMITS.site.maxOverrides),
});
