export type SeoResourceType = 'menu_item' | 'event' | 'announcement' | 'page';

export interface SeoMetadata {
  id: string | null;
  resourceType: SeoResourceType;
  resourceKey: string;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string | null;
  canonicalUrl: string;
  noindex: boolean;
  locationId: string | null;
  updatedAt: string | null;
}
