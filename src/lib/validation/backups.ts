/**
 * Reglas de formulario para crear o eliminar respaldos.
 */
import { z } from 'zod';

export const backupCreateSchema = z.object({
  type: z.enum(['database', 'uploads', 'full'], {
    message: 'Selecciona el tipo de respaldo.',
  }),
});

export const backupDeleteSchema = z.object({
  id: z.string().uuid('El respaldo seleccionado no es válido.'),
});

export type BackupCreateValues = z.infer<typeof backupCreateSchema>;
