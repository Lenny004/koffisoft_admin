import type { PageMeta } from '$lib/reservations/types';

export type EventType = 'Wedding' | 'Birthday' | 'Corporate' | 'Meeting' | 'Anniversary' | 'Other';
export type EventStatus =
  | 'Inquiry'
  | 'Quoted'
  | 'Negotiating'
  | 'Tentative'
  | 'Confirmed'
  | 'InProgress'
  | 'Completed'
  | 'Cancelled'
  | 'Lost';
export type EventSpaceBookingStatus = 'Held' | 'Confirmed' | 'Released';
export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired' | 'Cancelled';
export type EventQuoteLineType =
  'Menu' | 'Beverage' | 'Venue' | 'Decoration' | 'Staffing' | 'Service' | 'Other';

export interface EventSpaceBooking {
  id: string;
  eventId: string;
  venueSpaceId: string;
  startsAt: string;
  endsAt: string;
  setupStartsAt: string | null;
  teardownEndsAt: string | null;
  bookingStatus: EventSpaceBookingStatus;
  capacityReserved: number;
  holdExpiresAt: string | null;
}

export interface EventRequirement {
  id: string;
  eventId: string;
  requirementType: string;
  description: string;
  guestCount: number | null;
  severity: string;
  status: string;
  resolvedAt: string | null;
  createdAt: string;
}

export interface Event {
  id: string;
  locationId: string;
  eventCode: string;
  eventType: EventType;
  title: string;
  contactNameSnapshot: string;
  contactPhoneSnapshot: string;
  contactEmailSnapshot: string | null;
  preferredLanguage: string;
  startsAt: string;
  endsAt: string;
  setupStartsAt: string | null;
  estimatedGuestCount: number;
  confirmedGuestCount: number | null;
  budgetTarget: string | null;
  status: EventStatus;
  source: string;
  specialRequirements: string | null;
  internalNotes: string | null;
  coordinatorUserId: string | null;
  spaceBookings: EventSpaceBooking[];
  requirements: EventRequirement[];
  createdAt: string;
  updatedAt: string;
}

export interface EventPage {
  data: Event[];
  meta: PageMeta;
}

export interface EventPackageLine {
  id: string;
  lineType: EventQuoteLineType;
  menuItemVariantId: string | null;
  labelEs: string;
  labelEn: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  sortOrder: number;
  active: boolean;
}

export interface EventPackage {
  id: string;
  locationId: string;
  packageCode: string;
  nameEs: string;
  nameEn: string;
  descriptionEs: string | null;
  descriptionEn: string | null;
  pricingModel: string;
  basePrice: string;
  minGuestCount: number | null;
  maxGuestCount: number | null;
  active: boolean;
  lines: EventPackageLine[];
}

export interface EventQuoteLine {
  id: string;
  eventPackageLineId: string | null;
  menuItemVariantId: string | null;
  lineType: EventQuoteLineType;
  labelEs: string;
  labelEn: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  discountAmount: string;
  taxRate: string;
  taxableAmount: string;
  taxAmount: string;
  lineTotal: string;
  sortOrder: number;
}

export interface EventQuote {
  id: string;
  eventId: string;
  eventPackageId: string | null;
  versionNo: number;
  status: QuoteStatus;
  currency: string;
  validUntil: string;
  subtotalAmount: string;
  discountAmount: string;
  taxableAmount: string;
  taxAmount: string;
  totalAmount: string;
  termsEs: string | null;
  termsEn: string | null;
  lines: EventQuoteLine[];
  createdAt: string;
  updatedAt: string;
}

export interface EventQuotePage {
  data: EventQuote[];
  meta: PageMeta;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  Wedding: 'Boda',
  Birthday: 'Cumpleaños',
  Corporate: 'Corporativo',
  Meeting: 'Reunión',
  Anniversary: 'Aniversario',
  Other: 'Otro',
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  Inquiry: 'Consulta',
  Quoted: 'Cotizado',
  Negotiating: 'Negociación',
  Tentative: 'Tentativo',
  Confirmed: 'Confirmado',
  InProgress: 'En curso',
  Completed: 'Completado',
  Cancelled: 'Cancelado',
  Lost: 'Perdido',
};

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  Draft: 'Borrador',
  Sent: 'Enviada',
  Accepted: 'Aceptada',
  Rejected: 'Rechazada',
  Expired: 'Expirada',
  Cancelled: 'Cancelada',
};

export function eventStatusLabel(status: EventStatus): string {
  return EVENT_STATUS_LABELS[status] ?? status;
}

export function eventTypeLabel(type: EventType): string {
  return EVENT_TYPE_LABELS[type] ?? type;
}

export function quoteStatusLabel(status: QuoteStatus): string {
  return QUOTE_STATUS_LABELS[status] ?? status;
}
