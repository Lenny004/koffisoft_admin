export interface DashboardReservation {
  id: string;
  guest: string;
  time: string;
  partySize: number;
  status: string;
}

export const dashboardFixture = {
  source: 'fixture' as const,
  kpis: [
    { label: 'Reservas de hoy', value: '8', note: 'Dato de prueba mientras se configura la sede.' },
    {
      label: 'Ventas del día',
      value: '$428.50',
      note: 'Fixture visual; no sustituye un endpoint de ventas.',
    },
    {
      label: 'Ventas mensuales',
      value: '$8,940',
      note: 'Fixture visual; no sustituye un endpoint de ventas.',
    },
  ],
  reservations: [
    { id: 'fixture-1', guest: 'María López', time: '10:30', partySize: 4, status: 'confirmed' },
    { id: 'fixture-2', guest: 'Carlos Rivera', time: '13:00', partySize: 2, status: 'requested' },
    { id: 'fixture-3', guest: 'Sofía Martínez', time: '18:30', partySize: 6, status: 'seated' },
  ] satisfies DashboardReservation[],
};
