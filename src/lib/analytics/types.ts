/**
 * Contratos de respuesta de analítica web (sedes, resumen, páginas, productos y referrers).
 */
export interface AnalyticsLocation {
  id: string;
  code: string;
  name: string;
  timezone: string;
}

export interface AnalyticsDailyPoint {
  date: string;
  visits: number;
}

export interface AnalyticsSummary {
  totalVisits: number;
  daily: AnalyticsDailyPoint[];
}

export interface AnalyticsPageRow {
  path: string;
  visits: number;
}

export interface AnalyticsProductRow {
  resourceType: 'menu_item' | 'event';
  resourceKey: string;
  visits: number;
}

export interface AnalyticsReferrerRow {
  host: string;
  visits: number;
}

export interface AnalyticsFilters {
  locationId: string;
  from: string;
  to: string;
  minDate: string;
  maxDate: string;
}
