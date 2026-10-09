export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type ReservationStatus =
  | 'Requested'
  | 'PendingConfirmation'
  | 'Confirmed'
  | 'Seated'
  | 'Completed'
  | 'Cancelled'
  | 'NoShow'
  | 'Expired';

export type ReservationTableStatus = 'Held' | 'Assigned' | 'Released';

export interface VenueSpace {
  id: string;
  locationId: string;
  code: string;
  nameEs: string;
  nameEn: string;
  spaceType: string;
  seatedCapacity: number;
  standingCapacity: number | null;
  allowsTableReservation: boolean;
  allowsPrivateEvent: boolean;
  active: boolean;
  tableCount: number;
}

export interface DiningTable {
  id: string;
  spaceId: string;
  tableCode: string;
  name: string;
  seatCount: number;
  shape: string;
  active: boolean;
}

export interface ReservationTable extends DiningTable {
  reservationTableId: string;
  allocationStatus: ReservationTableStatus;
  startsAt: string;
  endsAt: string;
}

export interface Reservation {
  id: string;
  locationId: string;
  reservationCode: string;
  contactNameSnapshot: string;
  contactPhoneSnapshot: string;
  contactEmailSnapshot: string | null;
  preferredLanguage: string;
  startsAt: string;
  endsAt: string;
  partySize: number;
  status: ReservationStatus;
  source: string;
  preferredSpaceId: string | null;
  specialRequests: string | null;
  internalNotes: string | null;
  tables: ReservationTable[];
  createdAt: string;
  updatedAt: string;
}

export interface ReservationPage {
  data: Reservation[];
  meta: PageMeta;
}

export type ReservationAction = 'confirm' | 'seat' | 'complete' | 'cancel' | 'no-show';

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  Requested: 'Solicitada',
  PendingConfirmation: 'Pendiente de confirmar',
  Confirmed: 'Confirmada',
  Seated: 'Sentada',
  Completed: 'Completada',
  Cancelled: 'Cancelada',
  NoShow: 'No-show',
  Expired: 'Expirada',
};

export const RESERVATION_ACTION_LABELS: Record<ReservationAction, string> = {
  confirm: 'Confirmar',
  seat: 'Sentar',
  complete: 'Completar',
  cancel: 'Cancelar',
  'no-show': 'Marcar no-show',
};

const ACTIONS_BY_STATUS: Record<ReservationStatus, ReservationAction[]> = {
  Requested: ['confirm', 'cancel'],
  PendingConfirmation: ['confirm', 'cancel'],
  Confirmed: ['seat', 'cancel', 'no-show'],
  Seated: ['complete', 'cancel'],
  Completed: [],
  Cancelled: [],
  NoShow: [],
  Expired: [],
};

/** Mantiene las acciones visibles alineadas con las transiciones del controlador de la API. */
export function reservationActionsFor(status: ReservationStatus): ReservationAction[] {
  return ACTIONS_BY_STATUS[status];
}

export function reservationStatusLabel(status: ReservationStatus): string {
  return RESERVATION_STATUS_LABELS[status] ?? status;
}

export const SPACE_TYPES = [
  ['indoor', 'Interior'],
  ['terrace', 'Terraza'],
  ['viewpoint', 'Mirador'],
  ['private_room', 'Salón privado'],
  ['garden', 'Jardín'],
  ['other', 'Otro'],
] as const;

export const TABLE_SHAPES = [
  ['round', 'Redonda'],
  ['square', 'Cuadrada'],
  ['rectangular', 'Rectangular'],
  ['communal', 'Comunal'],
] as const;
