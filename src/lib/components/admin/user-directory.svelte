<script lang="ts">
  import {
    KeyRound,
    LockKeyhole,
    Pencil,
    Plus,
    Power,
    RotateCcw,
    ShieldCheck,
    UserRoundCog,
  } from '@lucide/svelte';
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
  import type { EmployeeRow, PageMeta, RoleRow, UserRow } from '$lib/users/types';
  import { FORM_LIMITS, FORM_PATTERNS } from '$lib/validation/limits';
  import type { UserFilterValues } from '$lib/validation/users';

  interface Props {
    data: {
      users: UserRow[];
      employeeOptions: EmployeeRow[];
      roles: RoleRow[];
      meta: PageMeta;
      filters: UserFilterValues;
      permissions: string[];
      error?: string;
    };
    form?: { errors?: Record<string, string> | string[]; success?: boolean } | null;
  }

  let { data, form }: Props = $props();
  let userDialogOpen = $state(false);
  let rolesDialogOpen = $state(false);
  let editingUserId = $state<string | null>(null);
  let rolesUser = $state<UserRow | null>(null);
  let username = $state('');
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let employeeId = $state('');
  let mustChangePassword = $state(false);
  let roleIds = $state<string[]>([]);

  const canManage = $derived(data.permissions.includes('users.manage'));
  const canManageRoles = $derived(data.permissions.includes('roles.manage'));
  const features = tableFeatures({});
  const columnHelper = createColumnHelper<typeof features, UserRow>();
  const columns = columnHelper.columns([
    columnHelper.accessor('username', { header: 'Usuario' }),
    columnHelper.accessor('email', { header: 'Correo' }),
    columnHelper.accessor('status', { header: 'Estado' }),
    columnHelper.accessor('roles', { header: 'Roles' }),
    columnHelper.accessor('employee', { header: 'Empleado' }),
  ]);
  const table = createTable({
    features,
    columns,
    get data() {
      return data.users;
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
    editingUserId = null;
    username = '';
    email = '';
    password = '';
    confirmPassword = '';
    employeeId = '';
    mustChangePassword = true;
    roleIds = [];
    userDialogOpen = true;
  }

  function startEdit(user: UserRow) {
    editingUserId = user.id;
    username = user.username;
    email = user.email;
    password = '';
    confirmPassword = '';
    employeeId = user.employee?.id ?? '';
    mustChangePassword = user.mustChangePassword;
    userDialogOpen = true;
  }

  function startRoles(user: UserRow) {
    rolesUser = user;
    roleIds = user.roles.map((role) => role.id);
    rolesDialogOpen = true;
  }

  function confirmAction(message: string): boolean {
    return window.confirm(message);
  }

  function statusLabel(status: string): string {
    return { active: 'Activo', inactive: 'Inactivo', locked: 'Bloqueado' }[status] ?? status;
  }

  function statusVariant(status: string): 'success' | 'danger' | 'warning' {
    if (status === 'active') return 'success';
    if (status === 'locked') return 'warning';
    return 'danger';
  }

  function jobLabel(jobCode: string): string {
    return (
      {
        manager: 'Gerente',
        cashier: 'Caja',
        server: 'Mesero',
        cook: 'Cocina',
        barista: 'Barista',
        inventory: 'Inventario',
      }[jobCode] ?? jobCode
    );
  }

  function formatDate(value: string | null): string {
    return value
      ? new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium' }).format(new Date(value))
      : '—';
  }

  function pageQuery(page: number): string {
    const params = new URLSearchParams();
    if (data.filters.search) params.set('search', data.filters.search);
    if (data.filters.status) params.set('status', data.filters.status);
    if (data.filters.role) params.set('role', data.filters.role);
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    return query ? `?${query}` : '';
  }

  $effect(() => {
    if (form?.success) {
      userDialogOpen = false;
      rolesDialogOpen = false;
    }
  });
</script>

<section class="users" aria-labelledby="users-title">
  <header class="page-header">
    <div>
      <p class="page-header__eyebrow">Acceso y seguridad</p>
      <h2 class="page-header__title" id="users-title">Usuarios administrativos</h2>
      <p class="page-header__description">
        Administra cuentas, roles, vínculos laborales y controles de seguridad sin exponer secretos.
      </p>
    </div>
    {#if canManage}
      <Button onclick={startCreate}><Plus class="size-4" aria-hidden="true" />Nuevo usuario</Button>
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
      <Card.CardTitle>Directorio de cuentas</Card.CardTitle>
      <Card.CardDescription
        >La búsqueda y los filtros se ejecutan antes de paginar en la API.</Card.CardDescription
      >
    </Card.CardHeader>
    <Card.CardContent>
      <form class="users__toolbar" method="GET">
        <FormField id="user-search" label="Buscar">
          <input
            id="user-search"
            name="search"
            value={data.filters.search}
            maxlength={FORM_LIMITS.user.searchMaxLength}
            placeholder="Usuario, correo o empleado"
            autocomplete="off"
          />
        </FormField>
        <FormField id="user-status-filter" label="Estado">
          <select id="user-status-filter" name="status" value={data.filters.status}>
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="locked">Bloqueados</option>
          </select>
        </FormField>
        <FormField id="user-role-filter" label="Rol">
          <input
            id="user-role-filter"
            name="role"
            value={data.filters.role}
            maxlength={FORM_LIMITS.user.roleCodeMaxLength}
            pattern={FORM_PATTERNS.roleCode.source}
            placeholder="Ej. admin"
            autocomplete="off"
          />
        </FormField>
        <Button type="submit" variant="secondary">Buscar</Button>
      </form>

      <div class="users__table-wrap">
        <Table.Root>
          <Table.Header>
            {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
              <Table.Row>
                {#each headerGroup.headers as header (header.id)}
                  <Table.Head class="users__table-head">
                    {#if !header.isPlaceholder}<FlexRender {header} />{/if}
                  </Table.Head>
                {/each}
                {#if canManage || canManageRoles}<Table.Head class="users__table-head"
                    >Acciones</Table.Head
                  >{/if}
              </Table.Row>
            {/each}
          </Table.Header>
          <Table.Body>
            {#each table.getRowModel().rows as row (row.id)}
              <Table.Row>
                {#each row.getAllCells() as cell (cell.id)}
                  <Table.Cell>
                    {#if cell.column.id === 'username'}
                      <div class="users__primary-cell">
                        <strong>{row.original.username}</strong>
                        <span>Alta: {formatDate(row.original.createdAt)}</span>
                      </div>
                    {:else if cell.column.id === 'status'}
                      <Badge variant={statusVariant(row.original.status)}
                        >{statusLabel(row.original.status)}</Badge
                      >
                    {:else if cell.column.id === 'roles'}
                      <div class="users__badge-list">
                        {#each row.original.roles as role (role.id)}<Badge variant="outline"
                            >{role.name}</Badge
                          >{:else}<span>Sin roles</span>{/each}
                      </div>
                    {:else if cell.column.id === 'employee'}
                      {#if row.original.employee}
                        <div class="users__primary-cell">
                          <strong
                            >{row.original.employee.firstName}
                            {row.original.employee.lastName}</strong
                          >
                          <span
                            >{row.original.employee.employeeCode} · {jobLabel(
                              row.original.employee.jobCode,
                            )}</span
                          >
                        </div>
                      {:else}<span>Sin vínculo</span>{/if}
                    {:else}
                      <FlexRender {cell} />
                    {/if}
                  </Table.Cell>
                {/each}
                {#if canManage || canManageRoles}
                  <Table.Cell>
                    <div class="users__actions">
                      {#if canManage}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar ${row.original.username}`}
                          onclick={() => startEdit(row.original)}
                        >
                          <Pencil class="size-4" aria-hidden="true" />
                        </Button>
                        {#if row.original.status !== 'active'}
                          <form
                            method="POST"
                            action="?/status"
                            onsubmit={(event: SubmitEvent) => {
                              if (!confirmAction(`¿Activar la cuenta de ${row.original.username}?`))
                                event.preventDefault();
                            }}
                          >
                            <input type="hidden" name="id" value={row.original.id} />
                            <input type="hidden" name="action" value="activate" />
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Activar ${row.original.username}`}
                              ><Power class="size-4" aria-hidden="true" /></Button
                            >
                          </form>
                        {:else}
                          <form
                            method="POST"
                            action="?/status"
                            onsubmit={(event: SubmitEvent) => {
                              if (
                                !confirmAction(`¿Desactivar la cuenta de ${row.original.username}?`)
                              )
                                event.preventDefault();
                            }}
                          >
                            <input type="hidden" name="id" value={row.original.id} />
                            <input type="hidden" name="action" value="deactivate" />
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Desactivar ${row.original.username}`}
                              ><Power class="size-4 text-destructive" aria-hidden="true" /></Button
                            >
                          </form>
                        {/if}
                        {#if row.original.status !== 'locked'}
                          <form
                            method="POST"
                            action="?/status"
                            onsubmit={(event: SubmitEvent) => {
                              if (
                                !confirmAction(
                                  `¿Bloquear la cuenta de ${row.original.username}? Se revocarán sus sesiones.`,
                                )
                              )
                                event.preventDefault();
                            }}
                          >
                            <input type="hidden" name="id" value={row.original.id} />
                            <input type="hidden" name="action" value="block" />
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Bloquear ${row.original.username}`}
                              ><LockKeyhole class="size-4" aria-hidden="true" /></Button
                            >
                          </form>
                        {/if}
                        {#if row.original.mfaEnabled}
                          <form
                            method="POST"
                            action="?/resetMfa"
                            onsubmit={(event: SubmitEvent) => {
                              if (
                                !confirmAction(
                                  `¿Restablecer MFA para ${row.original.username}? Tendrá que configurarlo de nuevo.`,
                                )
                              )
                                event.preventDefault();
                            }}
                          >
                            <input type="hidden" name="id" value={row.original.id} />
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Restablecer MFA de ${row.original.username}`}
                              ><RotateCcw class="size-4" aria-hidden="true" /></Button
                            >
                          </form>
                        {/if}
                        {#if !row.original.mustChangePassword}
                          <form
                            method="POST"
                            action="?/forcePasswordChange"
                            onsubmit={(event: SubmitEvent) => {
                              if (
                                !confirmAction(
                                  `¿Forzar cambio de contraseña para ${row.original.username}?`,
                                )
                              )
                                event.preventDefault();
                            }}
                          >
                            <input type="hidden" name="id" value={row.original.id} />
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Forzar cambio de contraseña de ${row.original.username}`}
                              ><KeyRound class="size-4" aria-hidden="true" /></Button
                            >
                          </form>
                        {/if}
                      {/if}
                      {#if canManageRoles}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Asignar roles a ${row.original.username}`}
                          onclick={() => startRoles(row.original)}
                        >
                          <UserRoundCog class="size-4" aria-hidden="true" />
                        </Button>
                      {/if}
                    </div>
                  </Table.Cell>
                {/if}
              </Table.Row>
            {:else}
              <Table.Row
                ><Table.Cell colspan={canManage || canManageRoles ? 6 : 5} class="users__empty"
                  >No hay usuarios para mostrar.</Table.Cell
                ></Table.Row
              >
            {/each}
          </Table.Body>
        </Table.Root>
      </div>

      <nav class="users__pagination" aria-label="Paginación de usuarios">
        <span>{data.meta.total} usuario{data.meta.total === 1 ? '' : 's'} en total</span>
        <div class="users__pagination-actions">
          {#if data.meta.page > 1}<a
              class="users__page-link"
              href={resolve(('/usuarios' + pageQuery(data.meta.page - 1)) as '/usuarios')}
              >Anterior</a
            >{/if}
          <span>Página {data.meta.page} de {data.meta.totalPages}</span>
          {#if data.meta.page < data.meta.totalPages}<a
              class="users__page-link"
              href={resolve(('/usuarios' + pageQuery(data.meta.page + 1)) as '/usuarios')}
              >Siguiente</a
            >{/if}
        </div>
      </nav>
    </Card.CardContent>
  </Card.Card>
</section>

<Dialog.Root bind:open={userDialogOpen}>
  <Dialog.Content size="lg">
    <Dialog.Header>
      <Dialog.Title>{editingUserId ? 'Editar usuario' : 'Nuevo usuario'}</Dialog.Title>
      <Dialog.Description
        >Los datos se validan contra el contrato administrativo de usuarios.</Dialog.Description
      >
    </Dialog.Header>
    <form class="users__form" method="POST" action="?/save">
      {#if editingUserId}<input type="hidden" name="id" value={editingUserId} />{/if}
      <Dialog.Body class="users__dialog-body">
        <p class="form-legend">
          <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
        </p>
        <div class="users__form-grid">
          <FormField
            id="user-username"
            label="Usuario"
            required
            error={fieldError('username')}
            maxLength={FORM_LIMITS.user.usernameMaxLength}
          >
            <input
              id="user-username"
              name="username"
              bind:value={username}
              minlength={FORM_LIMITS.user.usernameMinLength}
              maxlength={FORM_LIMITS.user.usernameMaxLength}
              pattern={FORM_PATTERNS.username.source}
              placeholder="Ej. ana.admin"
              autocomplete="username"
              required
              aria-invalid={Boolean(fieldError('username'))}
            />
          </FormField>
          <FormField
            id="user-email"
            label="Correo electrónico"
            required
            error={fieldError('email')}
            maxLength={FORM_LIMITS.user.emailMaxLength}
          >
            <input
              id="user-email"
              name="email"
              type="email"
              bind:value={email}
              maxlength={FORM_LIMITS.user.emailMaxLength}
              placeholder="Ej. ana@koffi-soft.com"
              autocomplete="email"
              required
              aria-invalid={Boolean(fieldError('email'))}
            />
          </FormField>
          {#if !editingUserId}
            <FormField
              id="user-password"
              label="Contraseña"
              required
              error={fieldError('password')}
            >
              <input
                id="user-password"
                name="password"
                type="password"
                bind:value={password}
                minlength={FORM_LIMITS.user.passwordMinLength}
                maxlength={FORM_LIMITS.user.passwordMaxLength}
                placeholder="Ej. Una contraseña segura"
                autocomplete="new-password"
                required
                aria-invalid={Boolean(fieldError('password'))}
              />
            </FormField>
            <FormField
              id="user-confirm-password"
              label="Confirmar contraseña"
              required
              error={fieldError('confirmPassword')}
            >
              <input
                id="user-confirm-password"
                name="confirmPassword"
                type="password"
                bind:value={confirmPassword}
                minlength={FORM_LIMITS.user.passwordMinLength}
                maxlength={FORM_LIMITS.user.passwordMaxLength}
                placeholder="Ej. Repite la contraseña"
                autocomplete="new-password"
                required
                aria-invalid={Boolean(fieldError('confirmPassword'))}
              />
            </FormField>
          {/if}
          <FormField
            id="user-employee"
            label="Empleado vinculado"
            error={fieldError('employeeId')}
            class="users__field--wide"
          >
            <select id="user-employee" name="employeeId" bind:value={employeeId}>
              <option value="">Sin vínculo laboral</option>
              {#each data.employeeOptions as employee (employee.id)}
                <option value={employee.id}
                  >{employee.employeeCode} · {employee.firstName} {employee.lastName}</option
                >
              {/each}
            </select>
          </FormField>
        </div>
        {#if !editingUserId && data.roles.length > 0}
          <fieldset class="users__role-fieldset">
            <legend>Roles iniciales</legend>
            <div class="users__role-list">
              {#each data.roles as role (role.id)}
                <label
                  ><input type="checkbox" name="roleIds" value={role.id} bind:group={roleIds} />
                  {role.name} <span>{role.code}</span></label
                >
              {/each}
            </div>
          </fieldset>
        {/if}
        {#if !editingUserId}
          <label class="users__checkbox"
            ><input
              type="hidden"
              name="mustChangePassword"
              value={String(mustChangePassword)}
            /><input type="checkbox" bind:checked={mustChangePassword} /> Exigir cambio de contraseña
            en el próximo acceso</label
          >
        {/if}
      </Dialog.Body>
      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => (userDialogOpen = false)}
          >Cancelar</Button
        >
        <Button type="submit">Guardar usuario</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={rolesDialogOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Asignar roles</Dialog.Title>
      <Dialog.Description
        >Reemplaza las asignaciones activas de {rolesUser?.username ??
          'la cuenta'}.</Dialog.Description
      >
    </Dialog.Header>
    <form
      class="users__form"
      method="POST"
      action="?/roles"
      onsubmit={(event: SubmitEvent) => {
        if (!confirmAction(`¿Reemplazar los roles de ${rolesUser?.username ?? 'la cuenta'}?`))
          event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={rolesUser?.id ?? ''} />
      <Dialog.Body class="users__dialog-body">
        {#if data.roles.length}
          <div class="users__role-list">
            {#each data.roles as role (role.id)}
              <label
                ><input type="checkbox" name="roleIds" value={role.id} bind:group={roleIds} />
                {role.name} <span>{role.code}</span></label
              >
            {/each}
          </div>
        {:else}
          <Alert variant="warning"><p>No hay roles activos disponibles para asignar.</p></Alert>
        {/if}
      </Dialog.Body>
      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => (rolesDialogOpen = false)}
          >Cancelar</Button
        >
        <Button type="submit"><ShieldCheck class="size-4" aria-hidden="true" />Guardar roles</Button
        >
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

<style>
  /* Bloque del directorio RBAC; conserva la jerarquía visual de las tablas del panel. */
  .users {
    display: grid;
    gap: var(--space-lg);
  }

  .users__toolbar,
  .users__form,
  :global(.users__dialog-body),
  .users__role-list {
    display: grid;
    gap: var(--space-md);
  }

  .users__toolbar {
    align-items: end;
    margin-block-end: var(--space-lg);
  }

  .users__toolbar input,
  .users__toolbar select,
  .users__form input:not([type='checkbox']):not([type='hidden']),
  .users__form select {
    min-block-size: 2.75rem;
    inline-size: 100%;
    padding: var(--space-sm) var(--space-md);
    color: var(--foreground);
    border: 1px solid var(--input);
    border-radius: var(--radius-md);
    background: var(--surface-panel);
  }

  .users__table-wrap {
    overflow-x: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  :global(.users__table-head) {
    color: var(--table-header-text);
    background: var(--table-header);
    font-size: var(--font-size-xs);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .users__primary-cell,
  .users__badge-list,
  .users__actions,
  .users__pagination,
  .users__pagination-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
  }

  .users__primary-cell {
    display: grid;
    gap: var(--space-xs);
    min-inline-size: 10rem;
  }

  .users__primary-cell span,
  .users__badge-list > span,
  .users__role-list span {
    color: var(--text-muted);
    font-size: var(--font-size-xs);
  }

  .users__actions {
    min-inline-size: 9rem;
  }

  :global(.users__empty) {
    block-size: 6rem;
    color: var(--text-muted);
    text-align: center;
  }

  .users__pagination {
    justify-content: space-between;
    margin-block-start: var(--space-lg);
    color: var(--text-muted);
    font-size: var(--font-size-sm);
  }

  .users__page-link {
    padding: var(--space-xs) var(--space-sm);
    color: var(--primary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    text-decoration: none;
  }

  .users__page-link:hover,
  .users__page-link:focus-visible {
    background: var(--secondary);
  }

  .users__form-grid {
    display: grid;
    gap: var(--space-md);
  }

  :global(.users__field--wide) {
    grid-column: 1 / -1;
  }

  .users__role-fieldset {
    margin: 0;
    padding: var(--space-md);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .users__role-fieldset legend {
    padding-inline: var(--space-xs);
    font-weight: var(--font-weight-bold);
  }

  .users__role-list label,
  .users__checkbox {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    font-size: var(--font-size-sm);
  }

  @media (min-width: 48rem) {
    .users__toolbar {
      grid-template-columns: minmax(12rem, 1.5fr) minmax(9rem, 0.75fr) minmax(9rem, 0.75fr) auto;
    }

    .users__form-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
