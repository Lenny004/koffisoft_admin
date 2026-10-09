import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

import { dashboardFixture, type DashboardReservation } from '$lib/fixtures/dashboard';
import { apiRequest, readJson } from '$lib/server/api';

/** Consulta reservas solo con sede configurada; ventas y fallback permanecen marcados como fixture. */
interface ReservationResponse {
  id: string;
  reservationCode: string;
  contactNameSnapshot: string;
  startsAt: string;
  partySize: number;
  status: string;
}

interface ReservationPage {
  data: ReservationResponse[];
}

function todayRange(): { from: string; to: string } {
  const date = new Date();
  const value = date.toISOString().slice(0, 10);
  return { from: value, to: value };
}

export const load: PageServerLoad = async (event) => {
  let reservations: DashboardReservation[] = dashboardFixture.reservations;
  let reservationSource: 'api' | 'fixture' = 'fixture';

  if (
    env.API_BASE_URL &&
    env.DEFAULT_LOCATION_ID &&
    event.locals.permissions.includes('reservations.read')
  ) {
    try {
      const range = todayRange();
      const query = new URLSearchParams({
        locationId: env.DEFAULT_LOCATION_ID,
        dateFrom: range.from,
        dateTo: range.to,
        page: '1',
        pageSize: '5',
      });
      const response = await apiRequest(event, `/reservations/admin?${query}`, env.API_BASE_URL);
      if (response.ok) {
        const payload = await readJson<ReservationPage>(response);
        reservations = (payload?.data ?? []).map((reservation) => ({
          id: reservation.id,
          guest: reservation.contactNameSnapshot,
          time: new Intl.DateTimeFormat('es-SV', { hour: '2-digit', minute: '2-digit' }).format(
            new Date(reservation.startsAt),
          ),
          partySize: reservation.partySize,
          status: reservation.status,
        }));
        reservationSource = 'api';
      }
    } catch {
      // La pantalla conserva fixtures de presentación si la API no está disponible.
    }
  }

  return {
    kpis: dashboardFixture.kpis.map((kpi) =>
      kpi.label === 'Reservas de hoy' && reservationSource === 'api'
        ? { ...kpi, value: String(reservations.length), note: 'Lectura de /reservations/admin.' }
        : kpi,
    ),
    reservations,
    reservationSource,
  };
};
