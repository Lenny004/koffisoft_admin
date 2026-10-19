/**
 * Props tipadas entre `inventario/+page.server.ts` y `inventory-module.svelte` (listas, filtros y formularios).
 */
import type {
  Ingredient,
  IngredientCategory,
  InventoryAlerts,
  InventoryMovement,
  InventoryPageMeta,
  InventoryUnit,
  Recipe,
  StorageLocation,
  Supplier,
} from './types';

export interface InventoryPageData {
  items: Ingredient[];
  filterItems: Ingredient[];
  selectedItem: Ingredient | null;
  movements: InventoryMovement[];
  receipts: Array<{
    id: string;
    supplierName: string;
    receiptNumber: string;
    receivedAt: string;
    lineCount: number;
  }>;
  recipes: Recipe[];
  units: InventoryUnit[];
  categories: IngredientCategory[];
  storageLocations: StorageLocation[];
  suppliers: Supplier[];
  alerts: InventoryAlerts | null;
  itemMeta: InventoryPageMeta;
  movementMeta: InventoryPageMeta;
  receiptMeta: InventoryPageMeta;
  recipeMeta: InventoryPageMeta;
  filters: {
    page: number;
    search: string;
    storageLocationId: string;
    movementPage: number;
    ingredientId: string;
    movementType: string;
    dateFrom: string;
    dateTo: string;
    expiryDays: number;
  };
  locationId: string;
  permissions: string[];
  error?: string;
}

export interface InventoryActionForm {
  action?: string;
  success?: boolean;
  errors?: Record<string, string> | string[];
}

export interface SupplierPageData {
  suppliers: Supplier[];
  meta: InventoryPageMeta;
  search: string;
  locationId: string;
  permissions: string[];
  historySupplierId?: string;
  history?: {
    supplierName: string;
    totalOrders: number;
    totalAmount: string;
    orders: Array<{
      id: string;
      orderNumber: string;
      status: string;
      orderDate: string;
      totalAmount: string;
    }>;
  } | null;
  error?: string;
}
