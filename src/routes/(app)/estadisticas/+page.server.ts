import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

import { AnalyticsApiError, createAnalyticsClient } from '$lib/server/analytics';
import type { AnalyticsFilters } from '$lib/analytics/types';
import { analyticsFilterSchema } from '$lib/validation/analytics';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const MAX_RANGE_DAYS = 366;

/** Fecha UTC de hoy en formato YYYY-MM-DD para acotar rangos. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Desplaza una fecha ISO en días usando calendario UTC. */
function shiftDate(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Comprueba que el query param sea una fecha ISO válida YYYY-MM-DD. */
function validDate(value: string | null): value is string {
  if (!value || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Deriva from/to desde la URL con tope de MAX_RANGE_DAYS y fallback de 30 días si el rango es inválido. */
function requestedRange(from: string | null, to: string | null): { from: string; to: string } {
  const defaultTo = today();
  const selectedTo = validDate(to) ? to : defaultTo;
  const selectedFrom = validDate(from) ? from : shiftDate(selectedTo, -(MAX_RANGE_DAYS - 1));
  const tooLong = Date.parse(`${selectedTo}T00:00:00Z`) - Date.parse(`${selectedFrom}T00:00:00Z`);
  return tooLong < 0 || tooLong / 86_400_000 + 1 > MAX_RANGE_DAYS
    ? { from: shiftDate(selectedTo, -29), to: selectedTo }
    : { from: selectedFrom, to: selectedTo };
}

/** Estructura vacía de analytics para permisos denegados o errores de carga. */
function emptyData(filters: AnalyticsFilters) {
  return {
    filters,
    locations: [],
    summary: { totalVisits: 0, daily: [] },
    pages: [],
    products: [],
    referrers: [],
    error: undefined as string | undefined,
  };
}

/** Carga sedes, valida filtros y consulta resumen, páginas, productos y referrers en paralelo. */
export const load: PageServerLoad = async (event) => {
  const permissions = event.locals.permissions;
  const range = requestedRange(
    event.url.searchParams.get('from'),
    event.url.searchParams.get('to'),
  );
  const maxDate = today();
  const filters: AnalyticsFilters = {
    locationId: event.url.searchParams.get('locationId') ?? env.DEFAULT_LOCATION_ID ?? '',
    from: range.from,
    to: range.to,
    minDate: shiftDate(maxDate, -(MAX_RANGE_DAYS - 1)),
    maxDate,
  };

  if (!permissions.includes('analytics.read')) {
    return emptyData(filters);
  }

  if (!env.API_BASE_URL) {
    return { ...emptyData(filters), error: 'Configura API_BASE_URL para consultar estadísticas.' };
  }

  try {
    const client = createAnalyticsClient(event, env.API_BASE_URL);
    const locations = await client.listLocations();
    const selectedLocation =
      locations.find((location) => location.id === filters.locationId) ?? locations[0];
    if (!selectedLocation) {
      return {
        ...emptyData(filters),
        locations,
        error: 'No hay sedes activas disponibles para tus permisos.',
      };
    }

    const selectedFilters = { ...filters, locationId: selectedLocation.id };
    const parsedFilters = analyticsFilterSchema.safeParse({
      locationId: selectedFilters.locationId,
      from: selectedFilters.from,
      to: selectedFilters.to,
    });
    if (!parsedFilters.success) {
      return {
        ...emptyData(selectedFilters),
        locations,
        error: parsedFilters.error.issues[0]?.message ?? 'Los filtros no son vÃ¡lidos.',
      };
    }

    const [summary, pages, products, referrers] = await Promise.all([
      client.getSummary(selectedFilters.locationId, selectedFilters.from, selectedFilters.to),
      client.getPages(selectedFilters.locationId, selectedFilters.from, selectedFilters.to),
      client.getProducts(selectedFilters.locationId, selectedFilters.from, selectedFilters.to),
      client.getReferrers(selectedFilters.locationId, selectedFilters.from, selectedFilters.to),
    ]);

    return {
      filters: selectedFilters,
      locations,
      summary,
      pages,
      products,
      referrers,
      error: undefined,
    };
  } catch (error) {
    return {
      ...emptyData(filters),
      error:
        error instanceof AnalyticsApiError
          ? error.message
          : 'No se pudieron cargar las estadísticas en este momento.',
    };
  }
};
