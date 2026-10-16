export interface ImportantAnnouncement {
  id: string;
  locationId: string;
  title: string;
  message: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  publicationStatus?: 'Draft' | 'Scheduled' | 'Published';
  publishedAt?: string | null;
  scheduledAt?: string | null;
  expiresAt?: string | null;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
