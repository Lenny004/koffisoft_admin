<script lang="ts">
  import { Pencil, Plus, UserRoundCheck, UserRoundX } from '@lucide/svelte';
  import { resolve } from '$app/paths';
  import {
    createColumnHelper,
    createTable,
    FlexRender,
    tableFeatures,
  } from '@tanstack/svelte-table';

  import { Alert } from '$lib/components/ui/alert/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import FormField from '$lib/components/ui/form-field.svelte';
  import * as Table from '$lib/components/ui/table/index.js';
  import type { EmployeeRow, PageMeta, UserRow } from '$lib/users/types';
  import { FORM_LIMITS } from '$lib/validation/limits';
  import type { EmployeeFilterValues } from '$lib/validation/users';

  interface Props {
    data: {
      employees: EmployeeRow[];
      userOptions: UserRow[];
      locationId: string;
      meta: PageMeta;
      filters: EmployeeFilterValues;
      permissions: string[];
      error?: string;
    };
    form?: { errors?: Record<string, string> | string[]; success?: boolean } | null;
  }

  let { data, form }: Props = $props();
  let dialogOpen = $state(false);
  let editingEmployeeId = $state<string | null>(null);
  let employeeCode = $state('');
  let firstName = $state('');
  let lastName = $state('');
  let jobCode = $state('barista');
  let hireDate = $state('');
  let terminationDate = $state('');
  let status = $state('active');
  let phone = $state('');
  let email = $state('');
  let userId = $state('');

  const canManage = $derived(data.permissions.includes('users.manage'));
  const features = tableFeatures({});
  const columnHelper = createColumnHelper<typeof features, EmployeeRow>();
  const columns = columnHelper.columns([
    columnHelper.accessor('employeeCode', { header: 'Código' }),
    columnHelper.accessor('firstName', { header: 'Empleado' }),
    columnHelper.accessor('jobCode', { header: 'Cargo' }),
    columnHelper.accessor('status', { header: 'Estado' }),
    columnHelper.accessor('user', { header: 'Usuario' }),
  ]);
  const table = createTable({
    features,
    columns,
    get data() {
      return data.employees;
    },
  });

  function fieldError(name: string): string {
    const errors = form?.errors;
    return errors && !Array.isArray(errors) ? (errors[name] ?? '') : '';
  }

  function globalErrors(): string[] {
    if (!form?.errors) return [];
    return Array.isArray(form.errors) ? form.errors : form.errors._form ? [form.errors._form] : [];
  }

  function startCreate() {
    editingEmployeeId = null;
    employeeCode = '';
    firstName = '';
    lastName = '';
    jobCode = 'barista';
    hireDate = new Date().toISOString().slice(0, 10);
    terminationDate = '';
    status = 'active';
    phone = '';
    email = '';
    userId = '';
    dialogOpen = true;
  }

  function startEdit(employee: EmployeeRow) {
    editingEmployeeId = employee.id;
    employeeCode = employee.employeeCode;
    firstName = employee.firstName;
    lastName = employee.lastName;
    jobCode = employee.jobCode;
    hireDate = employee.hireDate;
    terminationDate = employee.terminationDate ?? '';
    status = employee.status;
    phone = employee.phone ?? '';
    email = employee.email ?? '';
    userId = employee.user?.id ?? '';
    dialogOpen = true;
  }

  function confirmAction(message: string): boolean {
    return window.confirm(message);
  }

  function jobLabel(value: string): string {
    return (
      {
        manager: 'Gerente',
        cashier: 'Caja',
        server: 'Mesero',
        cook: 'Cocina',
        barista: 'Barista',
        inventory: 'Inventario',
      }[value] ?? value
    );
  }

  function employeeStatusLabel(value: string): string {
    return { active: 'Activo', inactive: 'Inactivo', on_leave: 'En licencia' }[value] ?? value;
  }

  function employeeStatusVariant(value: string): 'success' | 'danger' | 'warning' {
    if (value === 'active') return 'success';
    if (value === 'on_leave') return 'warning';
    return 'danger';
  }

  function pageQuery(page: number): string {
    const params = new URLSearchParams();
    if (data.filters.search) params.set('search', data.filters.search);
    if (data.filters.status) params.set('status', data.filters.status);
    if (data.filters.jobCode) params.set('jobCode', data.filters.jobCode);
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    return query ? `?${query}` : '';
  }

  $effect(() => {
    if (form?.success) dialogOpen = false;
  });
</script>

<section class="employees" aria-labelledby="employees-title">
  <header class="page-header">
    <div>
      <p class="page-header__eyebrow">Organización interna</p>
      <h2 class="page-header__title" id="employees-title">Empleados</h2>
      <p class="page-header__description">
        Mantén el directorio laboral de la sede y vincula cada registro con una cuenta opcional.
      </p>
    </div>
    {#if canManage}
      <Button onclick={startCreate}><Plus class="size-4" aria-hidden="true" />Nuevo empleado</Button
      >
    {/if}
  </header>

  {#if data.error}
    <Alert variant="destructive"><p>{data.error}</p></Alert>
  {:else if globalErrors().length}
    <Alert variant="destructive">
      {#each globalErrors() as message (message)}<p>{message}</p>{/each}
    </Alert>
  {/if}

  <Card.Card>
    <Card.CardHeader>
      <Card.CardTitle>Directorio de empleados</Card.CardTitle>
      <Card.CardDescription
        >Filtra por estado o cargo sin descargar el directorio completo al navegador.</Card.CardDescription
      >
    </Card.CardHeader>
    <Card.CardContent>
      <form class="employees__toolbar" method="GET">
        <FormField id="employee-search" label="Buscar">
          <input
            id="employee-search"
            name="search"
            value={data.filters.search}
            maxlength={FORM_LIMITS.user.searchMaxLength}
            placeholder="Código, nombre o correo"
            autocomplete="off"
          />
        </FormField>
        <FormField id="employee-status-filter" label="Estado">
          <select id="employee-status-filter" name="status" value={data.filters.status}>
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="on_leave">En licencia</option>
          </select>
        </FormField>
        <FormField id="employee-job-filter" label="Cargo">
          <select id="employee-job-filter" name="jobCode" value={data.filters.jobCode}>
            <option value="">Todos los cargos</option>
            <option value="manager">Gerente</option>
            <option value="cashier">Caja</option>
            <option value="server">Mesero</option>
            <option value="cook">Cocina</option>
            <option value="barista">Barista</option>
            <option value="inventory">Inventario</option>
          </select>
        </FormField>
        <Button type="submit" variant="secondary">Buscar</Button>
      </form>

      <div class="employees__table-wrap">
        <Table.Root>
          <Table.Header>
            {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
              <Table.Row>
                {#each headerGroup.headers as header (header.id)}
                  <Table.Head class="employees__table-head"
                    >{#if !header.isPlaceholder}<FlexRender {header} />{/if}</Table.Head
                  >
                {/each}
                {#if canManage}<Table.Head class="employees__table-head">Acciones</Table.Head>{/if}
              </Table.Row>
            {/each}
          </Table.Header>
          <Table.Body>
            {#each table.getRowModel().rows as row (row.id)}
              <Table.Row>
                {#each row.getAllCells() as cell (cell.id)}
                  <Table.Cell>
                    {#if cell.column.id === 'employeeCode'}
                      <strong>{row.original.employeeCode}</strong>
                    {:else if cell.column.id === 'firstName'}
                      <div class="employees__primary-cell">
                        <strong>{row.original.firstName} {row.original.lastName}</strong>
                        <span
                          >{row.original.email ?? 'Sin correo'} · Contratación {row.original
                            .hireDate}</span
                        >
                      </div>
                    {:else if cell.column.id === 'jobCode'}
                      {jobLabel(row.original.jobCode)}
                    {:else if cell.column.id === 'status'}
                      <Badge variant={employeeStatusVariant(row.original.status)}
                        >{employeeStatusLabel(row.original.status)}</Badge
                      >
                    {:else if cell.column.id === 'user'}
                      {#if row.original.user}
                        <div class="employees__primary-cell">
                          <strong>{row.original.user.username}</strong><span
                            >{row.original.user.status === 'active'
                              ? 'Cuenta activa'
                              : 'Cuenta no activa'}</span
                          >
                        </div>
                      {:else}<span>Sin vínculo</span>{/if}
                    {:else}
                      <FlexRender {cell} />
                    {/if}
                  </Table.Cell>
                {/each}
                {#if canManage}
                  <Table.Cell>
                    <div class="employees__actions">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar ${row.original.employeeCode}`}
                        onclick={() => startEdit(row.original)}
                        ><Pencil class="size-4" aria-hidden="true" /></Button
                      >
                      {#if row.original.status !== 'inactive'}
                        <form
                          method="POST"
                          action="?/delete"
                          onsubmit={(event: SubmitEvent) => {
                            if (
                              !confirmAction(
                                `El empleado ${row.original.employeeCode} se desactivará. ¿Continuar?`,
                              )
                            )
                              event.preventDefault();
                          }}
                        >
                          <input type="hidden" name="id" value={row.original.id} />
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Desactivar ${row.original.employeeCode}`}
                            ><UserRoundX
                              class="size-4 text-destructive"
                              aria-hidden="true"
                            /></Button
                          >
                        </form>
                      {/if}
                      {#if row.original.user}<UserRoundCheck
                          class="employees__linked-icon"
                          aria-label="Tiene usuario vinculado"
                        />{/if}
                    </div>
                  </Table.Cell>
                {/if}
              </Table.Row>
            {:else}
              <Table.Row
                ><Table.Cell colspan={canManage ? 6 : 5} class="employees__empty"
                  >No hay empleados para mostrar.</Table.Cell
                ></Table.Row
              >
            {/each}
          </Table.Body>
        </Table.Root>
      </div>

      <nav class="employees__pagination" aria-label="Paginación de empleados">
        <span>{data.meta.total} empleado{data.meta.total === 1 ? '' : 's'} en total</span>
        <div class="employees__pagination-actions">
          {#if data.meta.page > 1}<a
              class="employees__page-link"
              href={resolve(('/empleados' + pageQuery(data.meta.page - 1)) as '/empleados')}
              >Anterior</a
            >{/if}
          <span>Página {data.meta.page} de {data.meta.totalPages}</span>
          {#if data.meta.page < data.meta.totalPages}<a
              class="employees__page-link"
              href={resolve(('/empleados' + pageQuery(data.meta.page + 1)) as '/empleados')}
              >Siguiente</a
            >{/if}
        </div>
      </nav>
    </Card.CardContent>
  </Card.Card>
</section>

<Dialog.Root bind:open={dialogOpen}>
  <Dialog.Content size="lg">
    <Dialog.Header>
      <Dialog.Title>{editingEmployeeId ? 'Editar empleado' : 'Nuevo empleado'}</Dialog.Title>
      <Dialog.Description
        >El vínculo con un usuario es opcional y se valida dentro de la misma transacción.</Dialog.Description
      >
    </Dialog.Header>
    <form class="employees__form" method="POST" action="?/save">
      {#if editingEmployeeId}<input type="hidden" name="id" value={editingEmployeeId} />{/if}
      <input type="hidden" name="locationId" value={data.locationId} />
      <Dialog.Body class="employees__dialog-body">
        <p class="form-legend">
          <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
        </p>
        <div class="employees__form-grid">
          <FormField
            id="employee-code"
            label="Código de empleado"
            required
            error={fieldError('employeeCode')}
            maxLength={FORM_LIMITS.user.employeeCodeMaxLength}
          >
            <input
              id="employee-code"
              name="employeeCode"
              bind:value={employeeCode}
              maxlength={FORM_LIMITS.user.employeeCodeMaxLength}
              placeholder="Ej. EMP-001"
              autocomplete="off"
              required
              aria-invalid={Boolean(fieldError('employeeCode'))}
            />
          </FormField>
          <FormField
            id="employee-first-name"
            label="Nombre"
            required
            error={fieldError('firstName')}
            maxLength={FORM_LIMITS.user.employeeNameMaxLength}
          >
            <input
              id="employee-first-name"
              name="firstName"
              bind:value={firstName}
              maxlength={FORM_LIMITS.user.employeeNameMaxLength}
              placeholder="Ej. Ana"
              autocomplete="given-name"
              required
              aria-invalid={Boolean(fieldError('firstName'))}
            />
          </FormField>
          <FormField
            id="employee-last-name"
            label="Apellido"
            required
            error={fieldError('lastName')}
            maxLength={FORM_LIMITS.user.employeeNameMaxLength}
          >
            <input
              id="employee-last-name"
              name="lastName"
              bind:value={lastName}
              maxlength={FORM_LIMITS.user.employeeNameMaxLength}
              placeholder="Ej. Gómez"
              autocomplete="family-name"
              required
              aria-invalid={Boolean(fieldError('lastName'))}
            />
          </FormField>
          <FormField id="employee-job-code" label="Cargo" required error={fieldError('jobCode')}>
            <select id="employee-job-code" name="jobCode" bind:value={jobCode} required>
              <option value="manager">Gerente</option><option value="cashier">Caja</option><option
                value="server">Mesero</option
              ><option value="cook">Cocina</option><option value="barista">Barista</option><option
                value="inventory">Inventario</option
              >
            </select>
          </FormField>
          <FormField
            id="employee-hire-date"
            label="Fecha de contratación"
            required
            error={fieldError('hireDate')}
          >
            <input
              id="employee-hire-date"
              name="hireDate"
              type="date"
              bind:value={hireDate}
              placeholder="AAAA-MM-DD"
              autocomplete="off"
              required
              aria-invalid={Boolean(fieldError('hireDate'))}
            />
          </FormField>
          <FormField id="employee-status" label="Estado" required error={fieldError('status')}>
            <select id="employee-status" name="status" bind:value={status} required>
              <option value="active">Activo</option><option value="inactive">Inactivo</option
              ><option value="on_leave">En licencia</option>
            </select>
          </FormField>
          <FormField
            id="employee-termination-date"
            label="Fecha de terminación"
            error={fieldError('terminationDate')}
          >
            <input
              id="employee-termination-date"
              name="terminationDate"
              type="date"
              bind:value={terminationDate}
              placeholder="AAAA-MM-DD"
              autocomplete="off"
              aria-invalid={Boolean(fieldError('terminationDate'))}
            />
          </FormField>
          <FormField
            id="employee-phone"
            label="Teléfono"
            error={fieldError('phone')}
            maxLength={FORM_LIMITS.user.phoneMaxLength}
          >
            <input
              id="employee-phone"
              name="phone"
              type="tel"
              inputmode="tel"
              bind:value={phone}
              maxlength={FORM_LIMITS.user.phoneMaxLength}
              placeholder="Ej. +503 7000 0000"
              autocomplete="tel"
              aria-invalid={Boolean(fieldError('phone'))}
            />
          </FormField>
          <FormField
            id="employee-email"
            label="Correo laboral"
            error={fieldError('email')}
            maxLength={FORM_LIMITS.user.emailMaxLength}
          >
            <input
              id="employee-email"
              name="email"
              type="email"
              bind:value={email}
              maxlength={FORM_LIMITS.user.emailMaxLength}
              placeholder="Ej. ana@koffi-soft.com"
              autocomplete="email"
              aria-invalid={Boolean(fieldError('email'))}
            />
          </FormField>
          <FormField
            id="employee-user"
            label="Usuario vinculado"
            error={fieldError('userId')}
            class="employees__field--wide"
          >
            <select id="employee-user" name="userId" bind:value={userId}>
              <option value="">Sin usuario vinculado</option>
              {#each data.userOptions as user (user.id)}<option value={user.id}
                  >{user.username} · {user.email}</option
                >{/each}
            </select>
          </FormField>
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => (dialogOpen = false)}
          >Cancelar</Button
        >
        <Button type="submit">Guardar empleado</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

<style>
  /* Bloque del directorio laboral; usa los mismos tokens y superficies del catálogo. */
  .employees {
    display: grid;
    gap: var(--space-lg);
  }

  .employees__toolbar,
  .employees__form,
  :global(.employees__dialog-body) {
    display: grid;
    gap: var(--space-md);
  }

  .employees__toolbar {
    align-items: end;
    margin-block-end: var(--space-lg);
  }

  .employees__toolbar input,
  .employees__toolbar select,
  .employees__form input:not([type='hidden']),
  .employees__form select {
    min-block-size: 2.75rem;
    inline-size: 100%;
    padding: var(--space-sm) var(--space-md);
    color: var(--foreground);
    border: 1px solid var(--input);
    border-radius: var(--radius-md);
    background: var(--surface-panel);
  }

  .employees__table-wrap {
    overflow-x: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  :global(.employees__table-head) {
    color: var(--table-header-text);
    background: var(--table-header);
    font-size: var(--font-size-xs);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .employees__primary-cell,
  .employees__actions,
  .employees__pagination,
  .employees__pagination-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
  }

  .employees__primary-cell {
    display: grid;
    gap: var(--space-xs);
    min-inline-size: 13rem;
  }

  .employees__primary-cell span {
    color: var(--text-muted);
    font-size: var(--font-size-xs);
  }

  :global(.employees__linked-icon) {
    inline-size: var(--icon-size-sm);
    color: var(--status-success);
  }

  :global(.employees__empty) {
    block-size: 6rem;
    color: var(--text-muted);
    text-align: center;
  }

  .employees__pagination {
    justify-content: space-between;
    margin-block-start: var(--space-lg);
    color: var(--text-muted);
    font-size: var(--font-size-sm);
  }

  .employees__page-link {
    padding: var(--space-xs) var(--space-sm);
    color: var(--primary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    text-decoration: none;
  }

  .employees__page-link:hover,
  .employees__page-link:focus-visible {
    background: var(--secondary);
  }

  .employees__form-grid {
    display: grid;
    gap: var(--space-md);
  }

  :global(.employees__field--wide) {
    grid-column: 1 / -1;
  }

  @media (min-width: 48rem) {
    .employees__toolbar {
      grid-template-columns: minmax(12rem, 1.5fr) minmax(9rem, 0.75fr) minmax(9rem, 0.75fr) auto;
    }

    .employees__form-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
