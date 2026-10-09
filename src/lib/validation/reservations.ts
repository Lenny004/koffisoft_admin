import { z } from 'zod';

const uuid = z.string().uuid('El identificador no es válido.');
const optionalNumber = z.coerce.number().int().min(1).optional().or(z.literal(''));

export const reservationFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  dateFrom: z.string().date().optional().or(z.literal('')),
  dateTo: z.string().date().optional().or(z.literal('')),
  status: z
    .enum([
      'Requested',
      'PendingConfirmation',
      'Confirmed',
      'Seated',
      'Completed',
      'Cancelled',
      'NoShow',
      'Expired',
    ])
    .optional()
    .or(z.literal('')),
  spaceId: uuid.optional().or(z.literal('')),
});

export const venueSpaceSchema = z.object({
  id: uuid.optional().or(z.literal('')),
  locationId: uuid,
  code: z.string().trim().min(1, 'El código es obligatorio.').max(40),
  nameEs: z.string().trim().min(1, 'El nombre en español es obligatorio.').max(120),
  nameEn: z.string().trim().min(1, 'El nombre en inglés es obligatorio.').max(120),
  spaceType: z.enum(['indoor', 'terrace', 'viewpoint', 'private_room', 'garden', 'other']),
  seatedCapacity: z.coerce.number().int().min(1, 'La capacidad debe ser mayor que cero.'),
  standingCapacity: optionalNumber,
  allowsTableReservation: z.boolean(),
  allowsPrivateEvent: z.boolean(),
  active: z.boolean(),
});

export const diningTableSchema = z.object({
  id: uuid.optional().or(z.literal('')),
  spaceId: uuid,
  tableCode: z.string().trim().min(1, 'El código de mesa es obligatorio.').max(30),
  name: z.string().trim().min(1, 'El nombre de mesa es obligatorio.').max(80),
  seatCount: z.coerce.number().int().min(1, 'Los asientos deben ser mayores que cero.'),
  shape: z.enum(['round', 'square', 'rectangular', 'communal']),
  active: z.boolean(),
});

export const assignTablesSchema = z.object({
  reservationId: uuid,
  tableIds: z.array(uuid),
});

export function validationMessages(error: z.ZodError): string[] {
  return error.issues.map((issue) => issue.message);
}
