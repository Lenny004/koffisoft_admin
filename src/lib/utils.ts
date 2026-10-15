export { cn } from 'cn';

/** Normaliza el parámetro de página antes de enviarlo a una consulta administrativa. */
export function parsePositivePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
