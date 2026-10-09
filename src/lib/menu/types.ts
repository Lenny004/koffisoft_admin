export interface MenuPageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface MenuCategory {
  id: string;
  locationId: string;
  slug: string;
  nameEs: string;
  nameEn: string;
  descriptionEs: string | null;
  descriptionEn: string | null;
  displayOrder: number;
  active: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuVariant {
  id: string;
  prepStationId: string;
  sku: string;
  nameEs: string;
  nameEn: string;
  isDefault: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  category: { id: string; slug: string; nameEs: string };
  sku: string;
  slug: string;
  itemType: string;
  nameEs: string;
  nameEn: string;
  descriptionEs: string | null;
  descriptionEn: string | null;
  publicVisible: boolean;
  active: boolean;
  variants: MenuVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface MenuPrice {
  id: string;
  variantId: string;
  locationId: string;
  channel: string;
  price: string;
  currency: string;
  includesTax: boolean;
  taxRateId: string;
  validFrom: string;
  validTo: string | null;
  active: boolean;
}

export interface MenuAllergen {
  id: string;
  code: string;
  nameEs: string;
  nameEn: string;
  active: boolean;
}

export interface MenuVariantAllergen extends MenuAllergen {
  presenceType: 'contains' | 'may_contain';
  isReviewed: boolean;
  reviewedAt: string | null;
}

export interface MenuAvailability {
  id: string;
  variantId: string;
  locationId: string;
  channel: string;
  dayOfWeek: number;
  startsAt: string;
  endsAt: string;
  crossesMidnight: boolean;
  validFrom: string | null;
  validTo: string | null;
  active: boolean;
}

export interface MenuRow {
  id: string;
  categoryId: string;
  category: string;
  categorySlug: string;
  sku: string;
  slug: string;
  itemType: string;
  name: string;
  nameEn: string;
  descriptionEs: string | null;
  descriptionEn: string | null;
  publicVisible: boolean;
  active: boolean;
  variants: MenuVariant[];
  image: string;
}

export type CategoryRow = MenuCategory;
