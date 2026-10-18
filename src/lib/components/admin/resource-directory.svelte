<script lang="ts">
  /**
   * Directorio de recursos físicos: inventario de equipos, mantenimientos programados
   * y completados, con filtros GET independientes para cada listado.
   */
  import { CalendarClock, Pencil, Plus } from '@lucide/svelte';
  import { resolve } from '$app/paths';

  import { Alert } from '$lib/components/ui/alert/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import FormField from '$lib/components/ui/form-field.svelte';
  import SearchSelect from '$lib/components/ui/search-select.svelte';
  import * as Table from '$lib/components/ui/table/index.js';
  import type { Supplier } from '$lib/inventory/types';
  import { formatElSalvadorDate, formatElSalvadorDateTime } from '$lib/formatting/dates';
  import {
    RESOURCE_CATEGORIES,
    RESOURCE_CATEGORY_LABELS,
    RESOURCE_STATUS_LABELS,
    RESOURCE_STATUSES,
    type MaintenanceSchedule,
    type ResourceItem,
    type ResourceStatus,
  } from '$lib/resources/types';
  import { FORM_LIMITS } from '$lib/validation/limits';
  import {
    fieldError as getFieldError,
    globalErrors as getGlobalErrors,
  } from '$lib/validation/errors';

  interface ActionForm {
    action?: string;
    success?: boolean;
    errors?: Record<string, string> | string[];
    schedule?: MaintenanceSchedule;
  }

  interface Props {
    data: {
      resources: ResourceItem[];
      suppliers: Supplier[];
      resourceOptions: ResourceItem[];
      maintenances: MaintenanceSchedule[];
      meta: { page: number; pageSize: number; total: number; totalPages: number };
      maintenanceMeta: { page: number; pageSize: number; total: number; totalPages: number };
      filters: { page: number; search: string; category: string; status: string };
      maintenanceFilters: {
        page: number;
        resourceId: string;
        completed: string;
        dateFrom: string;
        dateTo: string;
      };
      locationId: string;
      permissions: string[];
      error?: string;
    };
    form?: ActionForm | null;
  }

  let { data, form }: Props = $props();
  let dialogOpen = $state(false);
  let maintenanceOpen = $state(false);
  let editingId = $state<string | null>(null);
  let resourceCode = $state('');
  let name = $state('');
  let category = $state<(typeof RESOURCE_CATEGORIES)[number]>('Equipment');
  let location = $state('');
  let status = $state<(typeof RESOURCE_STATUSES)[number]>('Operational');
  let purchaseDate = $state('');
  let cost = $state('');
  let supplierId = $state('');
  let notes = $state('');
  let active = $state(true);
  let maintenanceResourceId = $state('');
  let scheduledDate = $state('');
  let maintenanceDescription = $state('');
  let maintenanceNotes = $state('');
  let completeOpen = $state(false);
  let completeId = $state('');
  let completeNotes = $state('');

  const canManage = $derived(data.permissions.includes('resources.manage'));
  const supplierOptions = $derived(
    data.suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
  );
  const resourceFilterOptions = $derived(
    data.resourceOptions.map((resource) => ({
      value: resource.id,
      label: `${resource.resourceCode} · ${resource.name}`,
    })),
  );
  const statusVariant: Record<ResourceStatus, 'success' | 'warning' | 'danger' | 'secondary'> = {
    Operational: 'success',
    Maintenance: 'warning',
    Broken: 'danger',
    Retired: 'secondary',
  };

  /** Expone el error de validación de un campo del último envío del formulario. */
  function fieldError(field: string): string {
    return getFieldError(form?.errors, field);
  }

  /** Abre el diálogo de alta de recurso con estado operativo por defecto. */
  function startCreate() {
    editingId = null;
    resourceCode = '';
    name = '';
    category = 'Equipment';
    location = '';
    status = 'Operational';
    purchaseDate = '';
    cost = '';
    supplierId = '';
    notes = '';
    active = true;
    dialogOpen = true;
  }

  /** Precarga el formulario de edición con los datos del recurso seleccionado. */
  function startEdit(resource: ResourceItem) {
    editingId = resource.id;
    resourceCode = resource.resourceCode;
    name = resource.name;
    category = resource.category;
    location = resource.location ?? '';
    status = resource.status;
    purchaseDate = resource.purchaseDate?.slice(0, 10) ?? '';
    cost = resource.cost ?? '';
    supplierId = resource.supplierId ?? '';
    notes = resource.notes ?? '';
    active = resource.active;
    dialogOpen = true;
  }

  /** Abre el diálogo para programar mantenimiento sobre el recurso indicado. */
  function startMaintenance(resource: ResourceItem) {
    maintenanceResourceId = resource.id;
    scheduledDate = '';
    maintenanceDescription = '';
    maintenanceNotes = '';
    maintenanceOpen = true;
  }

  /** Abre el diálogo para registrar la finalización de un mantenimiento pendiente. */
  function startComplete(schedule: MaintenanceSchedule) {
    completeId = schedule.id;
    completeNotes = '';
    completeOpen = true;
  }

  /** Etiqueta legible del recurso asociado a una fila de mantenimiento. */
  function resourceLabel(schedule: MaintenanceSchedule): string {
    if (schedule.resourceCode && schedule.resourceName) {
      return `${schedule.resourceCode} · ${schedule.resourceName}`;
    }
    return (
      data.resourceOptions.find((resource) => resource.id === schedule.resourceId)?.name ??
      schedule.resourceId
    );
  }

  /** Arma la consulta GET conservando filtros de recursos y de mantenimientos. */
  function buildQuery(
    overrides: {
      page?: number;
      mPage?: number;
      resourceId?: string;
      completed?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {},
  ): string {
    const page = overrides.page ?? data.filters.page;
    const mPage = overrides.mPage ?? data.maintenanceFilters.page;
    const resourceId = overrides.resourceId ?? data.maintenanceFilters.resourceId;
    const completed = overrides.completed ?? data.maintenanceFilters.completed;
    const dateFrom = overrides.dateFrom ?? data.maintenanceFilters.dateFrom;
    const dateTo = overrides.dateTo ?? data.maintenanceFilters.dateTo;
    const params = new URLSearchParams();
    if (data.filters.search) params.set('search', data.filters.search);
    if (data.filters.category) params.set('category', data.filters.category);
    if (data.filters.status) params.set('status', data.filters.status);
    if (page > 1) params.set('page', String(page));
    if (resourceId) params.set('resourceId', resourceId);
    if (completed) params.set('completed', completed);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (mPage > 1) params.set('mPage', String(mPage));
    const query = params.toString();
    return query ? `?${query}` : '';
  }

  $effect(() => {
    if (form?.success && form.action === 'save') dialogOpen = false;
    if (form?.success && form.action === 'schedule') maintenanceOpen = false;
    if (form?.success && form.action === 'complete') completeOpen = false;
  });
</script>

<svelte:head><title>Recursos | Koffi-Soft Admin</title></svelte:head>

<section class="resources" aria-labelledby="resources-title">
  <header class="page-header">
    <div>
      <p class="page-header__eyebrow">Equipo y mobiliario</p>
      <h2 class="page-header__title" id="resources-title">Recursos</h2>
      <p class="page-header__description">
        Administra equipo, mobiliario e insumos no comestibles y programa sus mantenimientos.
      </p>
    </div>
    {#if canManage}
      <Button onclick={startCreate}><Plus class="size-4" aria-hidden="true" />Nuevo recurso</Button>
    {/if}
  </header>

  {#if data.error}<Alert variant="destructive"><p>{data.error}</p></Alert>{/if}
  {#if getGlobalErrors(form?.errors).length}
    <Alert variant="destructive">
      {#each getGlobalErrors(form?.errors) as message (message)}<p>{message}</p>{/each}
    </Alert>
  {/if}
  {#if form?.success && form.schedule}
    <Alert variant="success">
      <p>
        Mantenimiento programado para el {form.schedule.scheduledDate.slice(0, 10)}. Usa Completar
        cuando termine.
      </p>
      {#if canManage}
        <form method="POST" action="?/complete">
          <input type="hidden" name="id" value={form.schedule.id} />
          <FormField id="complete-notes" label="Notas de cierre">
            <input
              id="complete-notes"
              name="notes"
              maxlength={FORM_LIMITS.inventory.notesMaxLength}
              placeholder="Ej. Se reemplazó el filtro"
            />
          </FormField>
          <Button type="submit" size="sm">Completar mantenimiento</Button>
        </form>
      {/if}
    </Alert>
  {/if}

  <Card.Card>
    <Card.CardHeader>
      <Card.CardTitle>Inventario de recursos</Card.CardTitle>
      <Card.CardDescription>Filtra por categoría, estado o texto.</Card.CardDescription>
    </Card.CardHeader>
    <Card.CardContent>
      <form class="suppliers__toolbar" method="GET">
        <FormField id="resource-search" label="Buscar">
          <input
            id="resource-search"
            name="search"
            value={data.filters.search}
            maxlength={FORM_LIMITS.inventory.searchMaxLength}
            placeholder="Ej. código o nombre"
            autocomplete="off"
          />
        </FormField>
        <FormField id="resource-category-filter" label="Categoría">
          <select id="resource-category-filter" name="category" value={data.filters.category}>
            <option value="">Todas</option>
            {#each RESOURCE_CATEGORIES as option (option)}
              <option value={option}>{RESOURCE_CATEGORY_LABELS[option]}</option>
            {/each}
          </select>
        </FormField>
        <FormField id="resource-status-filter" label="Estado">
          <select id="resource-status-filter" name="status" value={data.filters.status}>
            <option value="">Todos</option>
            {#each RESOURCE_STATUSES as option (option)}
              <option value={option}>{RESOURCE_STATUS_LABELS[option]}</option>
            {/each}
          </select>
        </FormField>
        {#if data.maintenanceFilters.resourceId}
          <input type="hidden" name="resourceId" value={data.maintenanceFilters.resourceId} />
        {/if}
        {#if data.maintenanceFilters.completed}
          <input type="hidden" name="completed" value={data.maintenanceFilters.completed} />
        {/if}
        {#if data.maintenanceFilters.dateFrom}
          <input type="hidden" name="dateFrom" value={data.maintenanceFilters.dateFrom} />
        {/if}
        {#if data.maintenanceFilters.dateTo}
          <input type="hidden" name="dateTo" value={data.maintenanceFilters.dateTo} />
        {/if}
        <Button type="submit" variant="secondary">Filtrar</Button>
      </form>
      <div class="suppliers__table-wrap">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head class="suppliers__table-head">Código</Table.Head>
              <Table.Head class="suppliers__table-head">Recurso</Table.Head>
              <Table.Head class="suppliers__table-head">Categoría</Table.Head>
              <Table.Head class="suppliers__table-head">Estado</Table.Head>
              <Table.Head class="suppliers__table-head">Ubicación</Table.Head>
              <Table.Head class="suppliers__table-head">Acciones</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each data.resources as resource (resource.id)}
              <Table.Row>
                <Table.Cell><strong>{resource.resourceCode}</strong></Table.Cell>
                <Table.Cell>
                  <div class="suppliers__primary-cell">
                    <strong>{resource.name}</strong>
                    <span>{resource.supplierName ?? 'Sin proveedor'}</span>
                  </div>
                </Table.Cell>
                <Table.Cell>{RESOURCE_CATEGORY_LABELS[resource.category]}</Table.Cell>
                <Table.Cell>
                  <Badge variant={statusVariant[resource.status]}>
                    {RESOURCE_STATUS_LABELS[resource.status]}
                  </Badge>
                </Table.Cell>
                <Table.Cell>{resource.location ?? 'Sin ubicación'}</Table.Cell>
                <Table.Cell>
                  <div class="suppliers__actions">
                    <a
                      class="inventory__link"
                      href={resolve(
                        `/recursos${buildQuery({ resourceId: resource.id, mPage: 1 })}` as '/recursos',
                      )}>Historial</a
                    >
                    {#if canManage}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar ${resource.name}`}
                        onclick={() => startEdit(resource)}
                      >
                        <Pencil class="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Programar mantenimiento de ${resource.name}`}
                        onclick={() => startMaintenance(resource)}
                      >
                        <CalendarClock class="size-4" aria-hidden="true" />
                      </Button>
                    {/if}
                  </div>
                </Table.Cell>
              </Table.Row>
            {:else}
              <Table.Row>
                <Table.Cell colspan={6} class="suppliers__empty">
                  No hay recursos para mostrar.
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>
      <nav class="suppliers__pagination" aria-label="Paginación de recursos">
        <span>{data.meta.total} recurso{data.meta.total === 1 ? '' : 's'}</span>
        <div class="suppliers__pagination-actions">
          {#if data.meta.page > 1}
            <a
              class="suppliers__page-link"
              href={resolve(`/recursos${buildQuery({ page: data.meta.page - 1 })}` as '/recursos')}
              >Anterior</a
            >
          {/if}
          <span>Página {data.meta.page} de {data.meta.totalPages || 1}</span>
          {#if data.meta.page < data.meta.totalPages}
            <a
              class="suppliers__page-link"
              href={resolve(`/recursos${buildQuery({ page: data.meta.page + 1 })}` as '/recursos')}
              >Siguiente</a
            >
          {/if}
        </div>
      </nav>
    </Card.CardContent>
  </Card.Card>

  <Card.Card>
    <Card.CardHeader>
      <Card.CardTitle>Mantenimientos</Card.CardTitle>
      <Card.CardDescription>
        Historial global o de un recurso, con pendientes y completados.
      </Card.CardDescription>
    </Card.CardHeader>
    <Card.CardContent>
      <form class="suppliers__toolbar" method="GET">
        {#if data.filters.search}
          <input type="hidden" name="search" value={data.filters.search} />
        {/if}
        {#if data.filters.category}
          <input type="hidden" name="category" value={data.filters.category} />
        {/if}
        {#if data.filters.status}
          <input type="hidden" name="status" value={data.filters.status} />
        {/if}
        {#if data.filters.page > 1}
          <input type="hidden" name="page" value={String(data.filters.page)} />
        {/if}
        <FormField id="maintenance-resource-filter" label="Recurso">
          <SearchSelect
            id="maintenance-resource-filter"
            name="resourceId"
            value={data.maintenanceFilters.resourceId}
            options={resourceFilterOptions}
            placeholder="Todos los recursos"
            emptyLabel="Todos los recursos"
          />
        </FormField>
        <FormField id="maintenance-completed-filter" label="Estado">
          <select
            id="maintenance-completed-filter"
            name="completed"
            value={data.maintenanceFilters.completed}
          >
            <option value="">Todos</option>
            <option value="false">Pendientes</option>
            <option value="true">Completados</option>
          </select>
        </FormField>
        <FormField id="maintenance-from" label="Desde">
          <input
            id="maintenance-from"
            name="dateFrom"
            type="date"
            value={data.maintenanceFilters.dateFrom}
          />
        </FormField>
        <FormField id="maintenance-to" label="Hasta">
          <input
            id="maintenance-to"
            name="dateTo"
            type="date"
            value={data.maintenanceFilters.dateTo}
          />
        </FormField>
        <Button type="submit" variant="secondary">Filtrar</Button>
      </form>
      <div class="suppliers__table-wrap">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head class="suppliers__table-head">Recurso</Table.Head>
              <Table.Head class="suppliers__table-head">Fecha</Table.Head>
              <Table.Head class="suppliers__table-head">Descripción</Table.Head>
              <Table.Head class="suppliers__table-head">Estado</Table.Head>
              <Table.Head class="suppliers__table-head">Cierre</Table.Head>
              {#if canManage}<Table.Head class="suppliers__table-head">Acciones</Table.Head>{/if}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each data.maintenances as schedule (schedule.id)}
              <Table.Row>
                <Table.Cell>
                  <div class="suppliers__primary-cell">
                    <strong>{resourceLabel(schedule)}</strong>
                    {#if schedule.notes}<span>{schedule.notes}</span>{/if}
                  </div>
                </Table.Cell>
                <Table.Cell>{formatElSalvadorDate(schedule.scheduledDate)}</Table.Cell>
                <Table.Cell>{schedule.description}</Table.Cell>
                <Table.Cell>
                  <Badge variant={schedule.completed ? 'success' : 'warning'}>
                    {schedule.completed ? 'Completado' : 'Pendiente'}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  {schedule.completedAt
                    ? formatElSalvadorDateTime(schedule.completedAt)
                    : 'Sin cierre'}
                </Table.Cell>
                {#if canManage}
                  <Table.Cell>
                    {#if !schedule.completed}
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Completar mantenimiento de ${resourceLabel(schedule)}`}
                        onclick={() => startComplete(schedule)}
                      >
                        Completar
                      </Button>
                    {/if}
                  </Table.Cell>
                {/if}
              </Table.Row>
            {:else}
              <Table.Row>
                <Table.Cell colspan={canManage ? 6 : 5} class="suppliers__empty">
                  No hay mantenimientos para mostrar.
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>
      <nav class="suppliers__pagination" aria-label="Paginación de mantenimientos">
        <span
          >{data.maintenanceMeta.total} mantenimiento{data.maintenanceMeta.total === 1
            ? ''
            : 's'}</span
        >
        <div class="suppliers__pagination-actions">
          {#if data.maintenanceMeta.page > 1}
            <a
              class="suppliers__page-link"
              href={resolve(
                `/recursos${buildQuery({ mPage: data.maintenanceMeta.page - 1 })}` as '/recursos',
              )}>Anterior</a
            >
          {/if}
          <span>Página {data.maintenanceMeta.page} de {data.maintenanceMeta.totalPages || 1}</span>
          {#if data.maintenanceMeta.page < data.maintenanceMeta.totalPages}
            <a
              class="suppliers__page-link"
              href={resolve(
                `/recursos${buildQuery({ mPage: data.maintenanceMeta.page + 1 })}` as '/recursos',
              )}>Siguiente</a
            >
          {/if}
        </div>
      </nav>
    </Card.CardContent>
  </Card.Card>
</section>

<Dialog.Root bind:open={dialogOpen}>
  <Dialog.Content size="lg">
    <Dialog.Header>
      <Dialog.Title>{editingId ? 'Editar recurso' : 'Nuevo recurso'}</Dialog.Title>
      <Dialog.Description
        >Los campos siguen los límites de Prisma y el DTO de la API.</Dialog.Description
      >
    </Dialog.Header>
    <form class="suppliers__form" method="POST" action="?/save">
      <input type="hidden" name="id" value={editingId ?? ''} />
      <input type="hidden" name="locationId" value={data.locationId} />
      <Dialog.Body>
        <p class="form-legend">
          <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
        </p>
        <div class="suppliers__form-grid">
          <FormField
            id="resource-code"
            label="Código"
            required
            error={fieldError('resourceCode')}
            maxLength={FORM_LIMITS.inventory.resourceCodeMaxLength}
          >
            <input
              id="resource-code"
              name="resourceCode"
              bind:value={resourceCode}
              maxlength={FORM_LIMITS.inventory.resourceCodeMaxLength}
              placeholder="Ej. EQ-HORNO-01"
              autocomplete="off"
              required
            />
          </FormField>
          <FormField
            id="resource-name"
            label="Nombre"
            required
            error={fieldError('name')}
            maxLength={FORM_LIMITS.inventory.resourceNameMaxLength}
          >
            <input
              id="resource-name"
              name="name"
              bind:value={name}
              maxlength={FORM_LIMITS.inventory.resourceNameMaxLength}
              placeholder="Ej. Horno de convección"
              autocomplete="off"
              required
            />
          </FormField>
          <FormField
            id="resource-category"
            label="Categoría"
            required
            error={fieldError('category')}
          >
            <select id="resource-category" name="category" bind:value={category} required>
              {#each RESOURCE_CATEGORIES as option (option)}
                <option value={option}>{RESOURCE_CATEGORY_LABELS[option]}</option>
              {/each}
            </select>
          </FormField>
          <FormField id="resource-status" label="Estado" required error={fieldError('status')}>
            <select id="resource-status" name="status" bind:value={status} required>
              {#each RESOURCE_STATUSES as option (option)}
                <option value={option}>{RESOURCE_STATUS_LABELS[option]}</option>
              {/each}
            </select>
          </FormField>
          <FormField
            id="resource-location"
            label="Ubicación interna"
            error={fieldError('location')}
            maxLength={FORM_LIMITS.inventory.resourceLocationMaxLength}
          >
            <input
              id="resource-location"
              name="location"
              bind:value={location}
              maxlength={FORM_LIMITS.inventory.resourceLocationMaxLength}
              placeholder="Ej. Cocina caliente"
              autocomplete="off"
            />
          </FormField>
          <FormField id="resource-supplier" label="Proveedor" error={fieldError('supplierId')}>
            <SearchSelect
              id="resource-supplier"
              name="supplierId"
              bind:value={supplierId}
              options={supplierOptions}
              placeholder="Busca un proveedor"
              emptyLabel="Sin proveedor"
            />
          </FormField>
          <FormField
            id="resource-purchase-date"
            label="Fecha de compra"
            error={fieldError('purchaseDate')}
          >
            <input
              id="resource-purchase-date"
              name="purchaseDate"
              type="date"
              bind:value={purchaseDate}
            />
          </FormField>
          <FormField id="resource-cost" label="Costo" error={fieldError('cost')}>
            <input
              id="resource-cost"
              name="cost"
              type="number"
              inputmode="decimal"
              min="0"
              step="0.01"
              bind:value={cost}
              placeholder="Ej. 1250.00"
            />
          </FormField>
          <FormField
            id="resource-notes"
            label="Notas"
            error={fieldError('notes')}
            maxLength={FORM_LIMITS.inventory.notesMaxLength}
          >
            <textarea
              id="resource-notes"
              name="notes"
              bind:value={notes}
              maxlength={FORM_LIMITS.inventory.notesMaxLength}
              placeholder="Ej. Requiere calibración anual"
              rows="3"></textarea>
          </FormField>
        </div>
        <input type="hidden" name="active" value="false" />
        <label class="suppliers__checkbox">
          <input type="checkbox" name="active" value="true" bind:checked={active} /> Activo
        </label>
      </Dialog.Body>
      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => (dialogOpen = false)}
          >Cancelar</Button
        >
        <Button type="submit">Guardar recurso</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={maintenanceOpen}>
  <Dialog.Content size="md">
    <Dialog.Header>
      <Dialog.Title>Programar mantenimiento</Dialog.Title>
      <Dialog.Description
        >Queda en el historial del recurso y se puede completar cuando termine.</Dialog.Description
      >
    </Dialog.Header>
    <form class="suppliers__form" method="POST" action="?/schedule">
      <input type="hidden" name="resourceId" value={maintenanceResourceId} />
      <Dialog.Body>
        <p class="form-legend">
          <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
        </p>
        <FormField
          id="maintenance-date"
          label="Fecha programada"
          required
          error={fieldError('scheduledDate')}
        >
          <input
            id="maintenance-date"
            name="scheduledDate"
            type="date"
            bind:value={scheduledDate}
            required
          />
        </FormField>
        <FormField
          id="maintenance-description"
          label="Descripción"
          required
          error={fieldError('description')}
          maxLength={FORM_LIMITS.inventory.maintenanceDescriptionMaxLength}
        >
          <textarea
            id="maintenance-description"
            name="description"
            bind:value={maintenanceDescription}
            maxlength={FORM_LIMITS.inventory.maintenanceDescriptionMaxLength}
            placeholder="Ej. Limpieza profunda y revisión eléctrica"
            rows="3"
            required></textarea>
        </FormField>
        <FormField
          id="maintenance-notes"
          label="Notas"
          error={fieldError('notes')}
          maxLength={FORM_LIMITS.inventory.notesMaxLength}
        >
          <textarea
            id="maintenance-notes"
            name="notes"
            bind:value={maintenanceNotes}
            maxlength={FORM_LIMITS.inventory.notesMaxLength}
            placeholder="Ej. Coordinar con el proveedor"
            rows="2"></textarea>
        </FormField>
      </Dialog.Body>
      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => (maintenanceOpen = false)}
          >Cancelar</Button
        >
        <Button type="submit">Programar</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={completeOpen}>
  <Dialog.Content size="md">
    <Dialog.Header>
      <Dialog.Title>Completar mantenimiento</Dialog.Title>
      <Dialog.Description>Registra el cierre y las notas finales del trabajo.</Dialog.Description>
    </Dialog.Header>
    <form class="suppliers__form" method="POST" action="?/complete">
      <input type="hidden" name="id" value={completeId} />
      <Dialog.Body>
        <FormField
          id="complete-dialog-notes"
          label="Notas de cierre"
          error={fieldError('notes')}
          maxLength={FORM_LIMITS.inventory.notesMaxLength}
        >
          <textarea
            id="complete-dialog-notes"
            name="notes"
            bind:value={completeNotes}
            maxlength={FORM_LIMITS.inventory.notesMaxLength}
            placeholder="Ej. Se reemplazó el filtro"
            rows="3"></textarea>
        </FormField>
      </Dialog.Body>
      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => (completeOpen = false)}
          >Cancelar</Button
        >
        <Button type="submit">Completar</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
