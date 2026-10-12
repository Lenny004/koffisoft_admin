import { describe, expect, it } from 'vitest';

import {
  createEmployeeSchema,
  createUserSchema,
  employeeFilterSchema,
  userFilterSchema,
} from './users';

describe('validación administrativa de usuarios', () => {
  it('acepta una cuenta completa y normaliza el correo', () => {
    const result = createUserSchema.safeParse({
      username: 'ana.admin',
      email: ' ANA@EXAMPLE.COM ',
      password: 'Una contraseña segura 123',
      confirmPassword: 'Una contraseña segura 123',
      employeeId: '',
      roleIds: [],
      mustChangePassword: true,
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('ana@example.com');
  });

  it('rechaza credenciales que no cumplen los límites de la API', () => {
    const result = createUserSchema.safeParse({
      username: 'a',
      email: 'no-es-correo',
      password: 'corta',
      confirmPassword: 'distinta',
      employeeId: '',
      roleIds: [],
      mustChangePassword: false,
    });

    expect(result.success).toBe(false);
  });
});

describe('filtros administrativos', () => {
  it('conserva la paginación y filtros permitidos', () => {
    const result = userFilterSchema.parse({
      page: '2',
      search: 'ana',
      status: 'active',
      role: 'admin',
    });
    expect(result).toEqual({ page: 2, search: 'ana', status: 'active', role: 'admin' });
  });

  it('rechaza un cargo de empleado desconocido', () => {
    expect(
      employeeFilterSchema.safeParse({ page: '1', search: '', status: '', jobCode: 'director' })
        .success,
    ).toBe(false);
  });
});

describe('validación de empleados', () => {
  it('permite el vínculo opcional a un usuario', () => {
    const result = createEmployeeSchema.safeParse({
      locationId: '550e8400-e29b-41d4-a716-446655440000',
      employeeCode: 'EMP-001',
      firstName: 'Ana',
      lastName: 'Gómez',
      jobCode: 'barista',
      hireDate: '2026-10-12',
      status: 'active',
      phone: '',
      email: '',
      userId: '',
    });

    expect(result.success).toBe(true);
  });
});
