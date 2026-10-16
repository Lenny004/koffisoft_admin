export type ContactStatus = 'New' | 'InProgress' | 'Replied' | 'Closed' | 'Spam';
export type ContactTopic = 'general' | 'reservation' | 'event' | 'feedback' | 'other';

export interface ContactAudit {
  action: string;
  actorUserId: string | null;
  actorUsername: string | null;
  createdAt: string;
}

export interface ContactRelation {
  id: string;
  label: string;
}

export interface ContactMessage {
  id: string;
  locationId: string;
  customerId: string | null;
  reservationId: string | null;
  eventId: string | null;
  name: string;
  email: string;
  phone: string | null;
  languageCode: string;
  topic: ContactTopic | string;
  message: string;
  status: ContactStatus;
  assignedToUserId: string | null;
  assignedToUsername: string | null;
  customer: ContactRelation | null;
  reservation: ContactRelation | null;
  event: ContactRelation | null;
  receivedAt: string;
  repliedAt: string | null;
  archivedAt: string | null;
  archivedByUserId: string | null;
  audit: ContactAudit[];
}

export interface ContactPage {
  data: ContactMessage[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface ContactConversion {
  type: 'customer' | 'reservation' | 'event';
  id: string;
  created: boolean;
}

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  New: 'Nuevo',
  InProgress: 'En progreso',
  Replied: 'Respondido',
  Closed: 'Cerrado',
  Spam: 'Spam',
};

export const CONTACT_TOPIC_LABELS: Record<string, string> = {
  general: 'General',
  reservation: 'Reserva',
  event: 'Evento',
  feedback: 'Comentario',
  other: 'Otro',
};

export function contactStatusLabel(status: ContactStatus): string {
  return CONTACT_STATUS_LABELS[status] ?? status;
}
