/**
 * Usuarios administrativos, roles y empleados expuestos al directorio del panel.
 */
export const USER_STATUSES = ['active', 'inactive', 'locked'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const EMPLOYEE_STATUSES = ['active', 'inactive', 'on_leave'] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export const JOB_CODES = ['manager', 'cashier', 'server', 'cook', 'barista', 'inventory'] as const;
export type JobCode = (typeof JOB_CODES)[number];

export interface UserRoleSummary {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface UserEmployeeSummary {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  jobCode: JobCode;
  status: EmployeeStatus;
}

export interface UserRow {
  id: string;
  username: string;
  email: string;
  status: UserStatus;
  mustChangePassword: boolean;
  failedLoginAttempts: number;
  lockedAt: string | null;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  emailVerifiedAt: string | null;
  roles: UserRoleSummary[];
  employee: UserEmployeeSummary | null;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface UserPage {
  data: UserRow[];
  meta: PageMeta;
}

export interface EmployeeUserSummary {
  id: string;
  username: string;
  status: UserStatus;
}

export interface EmployeeRow {
  id: string;
  locationId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  jobCode: JobCode;
  status: EmployeeStatus;
  phone: string | null;
  email: string | null;
  hireDate: string;
  terminationDate: string | null;
  user: EmployeeUserSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeePage {
  data: EmployeeRow[];
  meta: PageMeta;
}

export interface RoleRow {
  id: string;
  businessId: string;
  code: string;
  name: string;
  active: boolean;
  permissions: string[];
}

export interface UserLookupRow {
  id: string;
  username: string;
  email: string;
  status: UserStatus;
  employee: UserEmployeeSummary | null;
}
