const EL_SALVADOR_TIMEZONE = 'America/El_Salvador';
const PLAIN_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

const dateTimeFormatter = new Intl.DateTimeFormat('es-SV', {
  timeZone: EL_SALVADOR_TIMEZONE,
  dateStyle: 'medium',
  timeStyle: 'short',
});

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: EL_SALVADOR_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Las respuestas de la API son instantes; la interfaz siempre los presenta en la zona de la sede. */
export function formatElSalvadorDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : dateTimeFormatter.format(date);
}

/** Fecha calendario en zona de la sede; las cadenas `YYYY-MM-DD` se muestran sin reinterpretar. */
export function formatElSalvadorDate(value: string): string {
  if (PLAIN_DATE_PATTERN.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : dateFormatter.format(date);
}

/** Fecha de hoy en formato calendario según la zona horaria de la sede. */
export function todayInElSalvador(): string {
  return dateFormatter.format(new Date());
}

/** `datetime-local` no incluye offset; la API exige una fecha ISO con offset explícito. */
export function localElSalvadorDateTimeToIso(value: string): string {
  if (!value) return '';
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/u.test(value)) return '';
  return `${value}:00-06:00`;
}

/** Adapta un instante ISO al valor que espera un control `datetime-local` en la sede. */
export function isoToElSalvadorDateTimeLocal(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: EL_SALVADOR_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value: partValue }) => [type, partValue]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

export const EL_SALVADOR_TIMEZONE_NAME = EL_SALVADOR_TIMEZONE;
