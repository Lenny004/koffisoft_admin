export interface InventoryPageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface InventoryUnit {
  id: string;
  code: string;
  name: string;
  precisionScale: number;
  active: boolean;
}

export interface IngredientCategory {
  id: string;
  name: string;
  active: boolean;
}

export interface StorageLocation {
  id: string;
  locationId: string;
  code: string;
  name: string;
  active: boolean;
}

export interface SupplierLink {
  supplierId: string;
  supplierName: string;
  supplierSku: string | null;
  packQuantity: string;
  packUnitId: string;
  packUnitCode: string;
  unitCost: string;
  isPreferred: boolean;
}

export interface Ingredient {
  id: string;
  categoryId: string;
  categoryName: string;
  baseUnitId: string;
  baseUnitCode: string;
  baseUnitName: string;
  sku: string;
  name: string;
  description: string | null;
  reorderLevel: string;
  currentStock: string;
  lowStock: boolean;
  trackLots: boolean;
  active: boolean;
  supplierLinks: SupplierLink[];
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  locationId: string;
  supplierCode: string;
  name: string;
  taxId: string | null;
  phone: string | null;
  email: string | null;
  addressLine: string | null;
  active: boolean;
  ingredientCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceiptListItem {
  id: string;
  locationId: string;
  supplierId: string;
  supplierName: string;
  receiptNumber: string;
  receivedAt: string;
  notes: string | null;
  lineCount: number;
  createdAt: string;
}

export interface GoodsReceiptLine {
  id: string;
  ingredientId: string;
  ingredientName: string;
  inventoryLotId: string;
  lotCode: string;
  unitId: string;
  unitCode: string;
  quantityReceived: string;
  unitCost: string;
  totalCost: string;
  receivedOn: string;
  expiresOn: string | null;
}

export interface GoodsReceipt extends GoodsReceiptListItem {
  storageLocationId: string;
  lines: GoodsReceiptLine[];
}

export type InventoryMovementType =
  'receipt' | 'sale_consumption' | 'waste' | 'adjustment_in' | 'adjustment_out';

export interface InventoryMovement {
  id: string;
  storageLocationId: string;
  storageLocationCode: string;
  ingredientId: string;
  ingredientName: string;
  inventoryLotId: string | null;
  lotCode: string | null;
  movementType: InventoryMovementType;
  quantityDelta: string;
  unitCost: string;
  goodsReceiptLineId: string | null;
  orderLineId: string | null;
  reason: string | null;
  createdByUserId: string | null;
  createdAt: string;
}

export interface InventoryAlerts {
  locationId: string;
  generatedAt: string;
  lowStock: Array<{
    ingredientId: string;
    sku: string;
    name: string;
    baseUnitCode: string;
    currentStock: string;
    reorderLevel: string;
  }>;
  expiringLots: Array<{
    inventoryLotId: string;
    ingredientId: string;
    ingredientName: string;
    lotCode: string;
    storageLocationId: string;
    storageLocationCode: string;
    remainingStock: string;
    expiresOn: string;
  }>;
}

export interface Recipe {
  id: string;
  menuItemVariantId: string;
  menuItemSku: string;
  menuItemName: string;
  variantName: string;
  versionNo: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  yieldQuantity: string;
  yieldUnitId: string;
  yieldUnitCode: string;
  notes: string | null;
  active: boolean;
  lines: Array<{
    id: string;
    ingredientId: string;
    ingredientName: string;
    ingredientSku: string;
    unitId: string;
    unitCode: string;
    quantity: string;
    notes: string | null;
  }>;
}
