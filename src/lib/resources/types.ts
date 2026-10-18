/** Contratos de recursos y mantenimientos alineados con koffisoft_api. */

export const RESOURCE_CATEGORIES = [
  'Equipment',
  'Furniture',
  'Supplies',
  'Kitchenware',
  'Electronics',
  'Other',
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export const RESOURCE_STATUSES = ['Operational', 'Maintenance', 'Broken', 'Retired'] as const;
export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];

export const RESOURCE_CATEGORY_LABELS: Record<ResourceCategory, string> = {
  Equipment: 'Equipo',
  Furniture: 'Mobiliario',
  Supplies: 'Insumos',
  Kitchenware: 'Utensilios',
  Electronics: 'Electrónica',
  Other: 'Otro',
};

export const RESOURCE_STATUS_LABELS: Record<ResourceStatus, string> = {
  Operational: 'Operativo',
  Maintenance: 'En mantenimiento',
  Broken: 'Fuera de servicio',
  Retired: 'Retirado',
};

export interface ResourceItem {
  id: string;
  locationId: string;
  resourceCode: string;
  name: string;
  category: ResourceCategory;
  location: string | null;
  status: ResourceStatus;
  purchaseDate: string | null;
  cost: string | null;
  supplierId: string | null;
  supplierName?: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResourcePage {
  data: ResourceItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface MaintenanceSchedule {
  id: string;
  resourceId: string;
  scheduledDate: string;
  description: string;
  completed: boolean;
  completedAt: string | null;
  completedByUserId: string | null;
  notes: string | null;
  createdAt: string;
}
