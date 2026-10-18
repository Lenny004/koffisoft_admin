/** Contratos de notificaciones alineados con koffisoft_api. */

export const NOTIFICATION_TYPES = [
  'LowStock',
  'LotExpiring',
  'SupplierReminder',
  'MaintenanceDue',
  'ReservationNew',
  'ContactMessage',
  'BackupSuccess',
  'BackupFailed',
  'SecurityAlert',
  'System',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_SEVERITIES = ['Info', 'Warning', 'Error', 'Success'] as const;
export type NotificationSeverity = (typeof NOTIFICATION_SEVERITIES)[number];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  LowStock: 'Stock bajo',
  LotExpiring: 'Lote por vencer',
  SupplierReminder: 'Recordatorio de proveedor',
  MaintenanceDue: 'Mantenimiento pendiente',
  ReservationNew: 'Nueva reservación',
  ContactMessage: 'Mensaje de contacto',
  BackupSuccess: 'Respaldo exitoso',
  BackupFailed: 'Respaldo fallido',
  SecurityAlert: 'Alerta de seguridad',
  System: 'Sistema',
};

export const NOTIFICATION_SEVERITY_LABELS: Record<NotificationSeverity, string> = {
  Info: 'Información',
  Warning: 'Advertencia',
  Error: 'Error',
  Success: 'Éxito',
};

export interface NotificationItem {
  id: string;
  notificationType: NotificationType;
  severity: NotificationSeverity;
  title: string;
  body: string;
  internalLink: string | null;
  readAt: string | null;
  archived: boolean;
  createdAt: string;
}

export interface NotificationPageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface NotificationPage {
  data: NotificationItem[];
  meta: NotificationPageMeta;
}

export interface UnreadCount {
  unreadCount: number;
}
