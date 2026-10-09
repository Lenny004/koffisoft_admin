/**
 * Límites compartidos con koffisoft_api.
 *
 * Cada valor se mantiene junto a su origen para que los formularios del panel
 * y las validaciones Zod no diverjan de Prisma, los CHECK SQL o los DTOs.
 */
export const FORM_LIMITS = {
  auth: {
    emailMaxLength: 200, // User.email / LoginDto.email @db.VarChar(200), @MaxLength(200).
    passwordMinLength: 12, // LoginDto/ChangePasswordDto @MinLength(12).
    passwordMaxLength: 128, // LoginDto/ChangePasswordDto @MaxLength(128).
    totpLength: 6, // MfaCodeDto @Matches(/^\d{6}$/).
    recoveryCodeMinLength: 20, // RecoveryCodeDto @MinLength(20).
    recoveryCodeMaxLength: 32, // RecoveryCodeDto @MaxLength(32).
    mfaLabelMaxLength: 100, // UserMfaFactor.label @db.VarChar(100), MfaSetupDto @MaxLength(100).
  },
  contact: {
    nameMaxLength: 200, // ContactMessage.name_snapshot @db.VarChar(200).
    emailMaxLength: 200, // ContactMessage.email @db.VarChar(200).
    phoneMaxLength: 40, // ContactMessage.phone @db.VarChar(40).
    messageMinLength: 10, // Límite UX conservado por la validación pública.
    messageMaxLength: 2000, // ContactMessage.message es @db.Text; límite UX del servidor público.
  },
  reservation: {
    contactNameMaxLength: 200, // Reservation.contact_name_snapshot @db.VarChar(200), DTO @MaxLength(200).
    contactPhoneMaxLength: 40, // Reservation.contact_phone_snapshot @db.VarChar(40), DTO @MaxLength(40).
    contactEmailMaxLength: 200, // Reservation.contact_email_snapshot @db.VarChar(200), DTO @MaxLength(200).
    specialRequestsMaxLength: 10_000, // Reservation.special_requests @db.Text, DTO @MaxLength(10_000).
    partySizeMin: 1, // reservations.party_size CHECK (> 0), DTO @Min(1).
    partySizeMax: 100, // DTO de disponibilidad y creación pública @Max(100).
    durationMinutesMin: 30, // DTO @Min(30).
    durationMinutesMax: 360, // DTO @Max(360).
  },
  event: {
    eventCodeMaxLength: 50, // Event.event_code @db.VarChar(50), DTO @MaxLength(50).
    titleMaxLength: 200, // Event.title @db.VarChar(200), DTO @MaxLength(200).
    contactNameMaxLength: 200, // Event.contact_name_snapshot @db.VarChar(200), DTO @MaxLength(200).
    contactPhoneMaxLength: 40, // Event.contact_phone_snapshot @db.VarChar(40), DTO @MaxLength(40).
    contactEmailMaxLength: 200, // Event.contact_email_snapshot @db.VarChar(200), DTO @MaxLength(200).
    estimatedGuestCountMin: 1, // events.estimated_guest_count CHECK (> 0), DTO @Min(1).
    estimatedGuestCountMax: 10_000, // DTO @Max(10_000).
    confirmedGuestCountMin: 1, // events.confirmed_guest_count CHECK (> 0), DTO @Min(1).
    budgetMax: 999_999_999_999.99, // Event.budget_target @db.Decimal(14,2), CHECK >= 0; DTO exige dos decimales.
    specialRequirementsMaxLength: 10_000, // Event.special_requirements @db.Text, DTO @MaxLength(10_000).
    internalNotesMaxLength: 10_000, // Event.internal_notes @db.Text, DTO @MaxLength(10_000).
    packageCodeMaxLength: 50, // EventPackage.package_code @db.VarChar(50), DTO @MaxLength(50).
    packageNameMaxLength: 160, // EventPackage.name_es/name_en @db.VarChar(160), DTO @MaxLength(160).
    packageDescriptionMaxLength: 10_000, // EventPackage.description_* @db.Text, DTO @MaxLength(10_000).
    packagePriceMax: 999_999_999_999.99, // EventPackage.base_price @db.Decimal(14,2), CHECK >= 0.
    packageGuestCountMin: 1, // event_packages.*_guest_count CHECK (> 0), DTO @Min(1).
    lineLabelMaxLength: 200, // EventPackageLine/EventQuoteLine.label_* @db.VarChar(200), DTO @MaxLength(200).
    lineUnitMaxLength: 40, // EventPackageLine/EventQuoteLine.unit @db.VarChar(40), DTO @MaxLength(40).
    lineQuantityMax: 99_999_999.999999, // Event*Line.quantity @db.Decimal(14,6), CHECK > 0.
    linePriceMax: 999_999_999_999.99, // Event*Line.unit_price @db.Decimal(14,2), CHECK >= 0.
    taxRateMin: 0, // Decimal(7,6), SQL CHECK BETWEEN 0 AND 1.
    taxRateMax: 1, // Decimal(7,6), SQL CHECK BETWEEN 0 AND 1.
    descriptionMaxLength: 10_000, // EventRequirement.description @db.Text, DTO @MaxLength(10_000).
    requirementGuestCountMin: 1, // event_requirements.guest_count CHECK (> 0), DTO @Min(1).
  },
  menu: {
    categorySlugMaxLength: 120, // MenuCategory.slug @db.VarChar(120), DTO @MaxLength(120).
    categoryNameMaxLength: 120, // MenuCategory.name_* @db.VarChar(120), DTO @MaxLength(120).
    categoryDescriptionMaxLength: 10_000, // MenuCategory.description_* @db.Text, DTO @MaxLength(10_000).
    productSkuMaxLength: 50, // MenuItem.sku @db.VarChar(50), DTO @MaxLength(50).
    productSlugMaxLength: 160, // MenuItem.slug @db.VarChar(160), DTO @MaxLength(160).
    productNameMaxLength: 160, // MenuItem.name_* @db.VarChar(160), DTO @MaxLength(160).
    productDescriptionMaxLength: 10_000, // MenuItem.description_* @db.Text, DTO @MaxLength(10_000).
    priceMin: 0, // menu_prices.price CHECK (>= 0), DTO @Min(0).
    priceMax: 9_999_999_999.99, // MenuPrice.price @db.Decimal(14,2), DTO @Max(9_999_999_999.99).
    dayOfWeekMin: 1, // menu_availability.day_of_week CHECK BETWEEN 1 AND 7, DTO @Min(1).
    dayOfWeekMax: 7, // menu_availability.day_of_week CHECK BETWEEN 1 AND 7, DTO @Max(7).
    searchMaxLength: 120, // AdminListQueryDto.search @MaxLength(120).
    allergenMaxLength: 40, // PublicMenuQueryDto.allergen @MaxLength(40).
  },
  venue: {
    smallIntMax: 32_767, // PostgreSQL SMALLINT usado por capacidades y asientos.
    spaceCodeMaxLength: 40, // VenueSpace.code @db.VarChar(40), DTO @MaxLength(40).
    spaceNameMaxLength: 120, // VenueSpace.name_* @db.VarChar(120), DTO @MaxLength(120).
    spaceTypeMaxLength: 30, // VenueSpace.space_type @db.VarChar(30), DTO @MaxLength(30).
    capacityMin: 1, // venue_spaces capacities CHECK (> 0), DTO @Min(1).
    tableCodeMaxLength: 30, // DiningTable.table_code @db.VarChar(30), DTO @MaxLength(30).
    tableNameMaxLength: 80, // DiningTable.name @db.VarChar(80), DTO @MaxLength(80).
    shapeMaxLength: 20, // DiningTable.shape @db.VarChar(20), DTO @MaxLength(20).
  },
  pagination: {
    pageMin: 1, // DTOs administrativos @Min(1).
    pageSizeMax: 100, // DTOs administrativos @Max(100).
  },
} as const;

export const FORM_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/u,
  slug: /^[a-z0-9-]+$/u,
  decimal2: /^\d+(\.\d{1,2})?$/u,
  decimal6: /^\d+(\.\d{1,6})?$/u,
  time: /^([01]\d|2[0-3]):[0-5]\d$/u,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu,
} as const;
