/** Contratos de órdenes de compra y perfil extendido de proveedor. */

export const PURCHASE_ORDER_STATUSES = [
  'Draft',
  'Submitted',
  'Approved',
  'Received',
  'Cancelled',
] as const;

export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  Draft: 'Borrador',
  Submitted: 'Enviada',
  Approved: 'Aprobada',
  Received: 'Recibida',
  Cancelled: 'Cancelada',
};

export interface PurchaseOrderLine {
  id: string;
  ingredientId: string;
  ingredientName: string;
  unitId: string;
  unitCode: string;
  quantityOrdered: string;
  unitCost: string;
  totalCost: string;
  quantityReceived: string | null;
  receivedAt: string | null;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  locationId: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDelivery: string | null;
  totalAmount: string;
  notes: string | null;
  createdByUserId: string;
  approvedByUserId: string | null;
  approvedAt: string | null;
  lines: PurchaseOrderLine[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderPage {
  data: PurchaseOrder[];
  total: number;
  page: number;
  perPage: number;
}

export interface SupplierProfile {
  id: string;
  locationId: string;
  supplierCode: string;
  name: string;
  taxId: string | null;
  phone: string | null;
  email: string | null;
  addressLine: string | null;
  deliveryDays: number | null;
  orderReminderDays: number | null;
  lastOrderDate: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierOrderHistory {
  orders: PurchaseOrder[];
  totalOrders: number;
  totalAmount: string;
}
