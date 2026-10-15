export type PublicationResourceType = 'announcement' | 'event' | 'menu_item';
export type PublicationStatus = 'Draft' | 'Scheduled' | 'Published';
export type PublicationAction = 'draft' | 'schedule' | 'publish' | 'unpublish';

export interface PublicationEntry {
  resourceType: PublicationResourceType;
  resourceId: string;
  title: string;
  kindLabel: string;
  publicationStatus: PublicationStatus;
  publishedAt: string | null;
  scheduledAt: string | null;
  expiresAt: string | null;
  active: boolean;
}

export interface PublicationContext {
  locationId: string;
  timezone: string;
}

export interface PreviewTokenResponse {
  resourceType: PublicationResourceType;
  resourceId: string;
  previewPath: string;
  expiresAt: string;
}
