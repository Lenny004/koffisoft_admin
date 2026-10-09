<script lang="ts">
  import {
    createColumnHelper,
    createTable,
    FlexRender,
    tableFeatures,
  } from '@tanstack/svelte-table';
  import {
    CalendarDays,
    Check,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Plus,
    Search,
    Table2,
    X,
  } from '@lucide/svelte';

  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { formatElSalvadorDateTime } from '$lib/formatting/dates';
  import {
    reservationActionsFor,
    reservationStatusLabel,
    RESERVATION_ACTION_LABELS,
    SPACE_TYPES,
    TABLE_SHAPES,
  } from '$lib/reservations/types';
  import type { DiningTable, Reservation, VenueSpace } from '$lib/reservations/types';
  import type { PageProps } from '../../../routes/(app)/reservaciones/$types';
  import { resolve } from '$app/paths';

  type Section = 'create' | 'list' | 'spaces';

  type Props = Pick<PageProps, 'data' | 'form'>;
  let { data, form }: Props = $props();
  let section = $state<Section>('list');
  let view = $state<'table' | 'day'>('table');
  let detailOpen = $state(false);
  let spaceOpen = $state(false);
  let tableOpen = $state(false);
  let editingSpace = $state<VenueSpace | null>(null);
  let editingTable = $state<DiningTable | null>(null);
  let selectedTableIds = $state<string[]>([]);

  let spaceId = $state('');
  let spaceCode = $state('');
  let spaceNameEs = $state('');
  let spaceNameEn = $state('');
  let spaceType = $state('indoor');
  let seatedCapacity = $state('');
  let standingCapacity = $state('');
  let allowsTableReservation = $state(true);
  let allowsPrivateEvent = $state(false);
  let activeSpace = $state(true);

  let tableId = $state('');
  let selectedSpaceId = $state('');
  let tableCode = $state('');
  let tableName = $state('');
  let seatCount = $state('');
  let shape = $state('round');
  let activeTable = $state(true);

  const canManage = $derived(data.permissions.includes('reservations.manage'));
  const features = tableFeatures({});
  const columnHelper = createColumnHelper<typeof features, Reservation>();
  const columns = columnHelper.columns([
    columnHelper.accessor('reservationCode', { header: 'Código' }),
    columnHelper.accessor('contactNameSnapshot', { header: 'Cliente' }),
    columnHelper.accessor('startsAt', { header: 'Fecha y hora' }),
    columnHelper.accessor('partySize', { header: 'Personas' }),
    columnHelper.accessor('status', { header: 'Estado' }),
  ]);
  const reservationTable = createTable({
    features,
    columns,
    get data() {
      return data.reservations;
    },
  });

  $effect(() => {
    view = data.view as 'table' | 'day';
    detailOpen = Boolean(data.selectedReservation);
    selectedTableIds = data.selectedReservation?.tables.map((table) => table.id) ?? [];
  });

  function queryUrl(values: Record<string, string | number | undefined>): string {
    const query = new URLSearchParams();
    if (data.filters.dateFrom) query.set('dateFrom', data.filters.dateFrom);
    if (data.filters.dateTo) query.set('dateTo', data.filters.dateTo);
    if (data.filters.status) query.set('status', data.filters.status);
    if (data.filters.spaceId) query.set('spaceId', data.filters.spaceId);
    if (data.search) query.set('search', data.search);
    if (view === 'day') query.set('view', 'day');
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined && value !== '') query.set(key, String(value));
    }
    return `?${query.toString()}`;
  }

  function spaceName(id: string | null): string {
    return data.spaces.find((space) => space.id === id)?.nameEs ?? 'Sin espacio';
  }

  function startSpace(space?: VenueSpace) {
    editingSpace = space ?? null;
    spaceId = space?.id ?? '';
    spaceCode = space?.code ?? '';
    spaceNameEs = space?.nameEs ?? '';
    spaceNameEn = space?.nameEn ?? '';
    spaceType = space?.spaceType ?? 'indoor';
    seatedCapacity = space ? String(space.seatedCapacity) : '';
    standingCapacity = space?.standingCapacity ? String(space.standingCapacity) : '';
    allowsTableReservation = space?.allowsTableReservation ?? true;
    allowsPrivateEvent = space?.allowsPrivateEvent ?? false;
    activeSpace = space?.active ?? true;
    spaceOpen = true;
  }

  function startTable(table?: DiningTable) {
    editingTable = table ?? null;
    tableId = table?.id ?? '';
    selectedSpaceId = table?.spaceId ?? data.spaces[0]?.id ?? '';
    tableCode = table?.tableCode ?? '';
    tableName = table?.name ?? '';
    seatCount = table ? String(table.seatCount) : '';
    shape = table?.shape ?? 'round';
    activeTable = table?.active ?? true;
    tableOpen = true;
  }

  function toggleTable(event: Event, id: string) {
    const checked = (event.currentTarget as HTMLInputElement).checked;
    selectedTableIds = checked
      ? [...selectedTableIds, id]
      : selectedTableIds.filter((tableId) => tableId !== id);
  }

  function statusClass(status: string): string {
    if (['Confirmed', 'Seated', 'Completed'].includes(status))
      return 'admin-status admin-status--success';
    if (['Cancelled', 'NoShow', 'Expired'].includes(status))
      return 'admin-status admin-status--danger';
    return 'admin-status admin-status--warning';
  }
</script>

<section class="reservations" aria-labelledby="reservations-title">
  <header class="page-header">
    <div>
      <p class="page-header__eyebrow">Operación</p>
      <h2 class="page-header__title" id="reservations-title">Reservaciones</h2>
      <p class="page-header__description">
        Consulta la agenda, cambia estados y asigna mesas desde el contrato administrativo de la
        API.
      </p>
    </div>
    <span class="reservations__timezone">America/El_Salvador</span>
  </header>

  <div class="reservations__tabs" aria-label="Secciones de reservaciones" role="tablist">
    <button
      class={section === 'create'
        ? 'reservations__tab reservations__tab--active'
        : 'reservations__tab'}
      type="button"
      role="tab"
      aria-selected={section === 'create'}
      onclick={() => (section = 'create')}
    >
      <Plus aria-hidden="true" /> Crear reservación
    </button>
    <button
      class={section === 'list'
        ? 'reservations__tab reservations__tab--active'
        : 'reservations__tab'}
      type="button"
      role="tab"
      aria-selected={section === 'list'}
      onclick={() => (section = 'list')}
    >
      <CalendarDays aria-hidden="true" /> Ver reservaciones
    </button>
    <button
      class={section === 'spaces'
        ? 'reservations__tab reservations__tab--active'
        : 'reservations__tab'}
      type="button"
      role="tab"
      aria-selected={section === 'spaces'}
      onclick={() => (section = 'spaces')}
    >
      <Table2 aria-hidden="true" /> Espacios y mesas
    </button>
  </div>

  {#if form?.errors?.length}
    <div class="reservations__error" role="alert">
      {#each form.errors as message (message)}<p>{message}</p>{/each}
    </div>
  {/if}

  {#if data.error}
    <div class="reservations__error" role="alert">{data.error}</div>
  {:else if section === 'create'}
    <section class="reservations__notice" role="note" aria-labelledby="reservation-create-title">
      <h3 id="reservation-create-title">Creación interna pendiente de contrato</h3>
      <p>
        La API actual no expone <code>POST /reservations/admin</code>. La pantalla no usará el
        endpoint público porque crearía una reserva con origen web y sin los campos internos. Cuando
        el contrato administrativo lo agregue, este tab podrá incorporar el formulario sin cambiar
        el flujo de sesión.
      </p>
    </section>
  {:else if section === 'list'}
    <section class="reservations__card" aria-label="Listado de reservaciones">
      <div class="reservations__toolbar">
        <form class="reservations__filters" method="GET">
          <input type="hidden" name="view" value={view} />
          <label class="reservations__label" for="reservation-search">Buscar</label>
          <input
            class="reservations__input"
            id="reservation-search"
            type="search"
            name="search"
            value={data.search}
            placeholder="Código, cliente o teléfono"
          />
          <label class="reservations__label" for="reservation-date-from">Desde</label>
          <input
            class="reservations__input"
            id="reservation-date-from"
            type="date"
            name="dateFrom"
            value={data.filters.dateFrom}
          />
          <label class="reservations__label" for="reservation-date-to">Hasta</label>
          <input
            class="reservations__input"
            id="reservation-date-to"
            type="date"
            name="dateTo"
            value={data.filters.dateTo}
          />
          <label class="reservations__label" for="reservation-status">Estado</label>
          <select
            class="reservations__input"
            id="reservation-status"
            name="status"
            value={data.filters.status}
          >
            <option value="">Todos</option>
            <option value="Requested">Solicitada</option>
            <option value="PendingConfirmation">Pendiente</option>
            <option value="Confirmed">Confirmada</option>
            <option value="Seated">Sentada</option>
            <option value="Completed">Completada</option>
            <option value="Cancelled">Cancelada</option>
            <option value="NoShow">No-show</option>
          </select>
          <label class="reservations__label" for="reservation-space">Espacio</label>
          <select
            class="reservations__input"
            id="reservation-space"
            name="spaceId"
            value={data.filters.spaceId}
          >
            <option value="">Todos</option>
            {#each data.spaces as space (space.id)}<option value={space.id}>{space.nameEs}</option
              >{/each}
          </select>
          <Button type="submit" variant="secondary"><Search aria-hidden="true" /> Filtrar</Button>
        </form>
        <div class="reservations__view-switcher" aria-label="Vista del listado">
          <Button
            variant={view === 'table' ? 'default' : 'outline'}
            size="sm"
            onclick={() => (view = 'table')}><Table2 aria-hidden="true" /> Tabla</Button
          >
          <Button
            variant={view === 'day' ? 'default' : 'outline'}
            size="sm"
            onclick={() => (view = 'day')}><CalendarDays aria-hidden="true" /> Agenda</Button
          >
        </div>
      </div>

      {#if !data.reservations.length}
        <p class="reservations__empty">No hay reservaciones para los filtros seleccionados.</p>
      {:else if view === 'table'}
        <div class="reservations__table-wrap">
          <Table.Root>
            <Table.Header>
              {#each reservationTable.getHeaderGroups() as headerGroup (headerGroup.id)}
                <Table.Row>
                  {#each headerGroup.headers as header (header.id)}<Table.Head
                      class="reservations__table-head"
                      >{#if !header.isPlaceholder}<FlexRender {header} />{/if}</Table.Head
                    >{/each}
                  <Table.Head class="reservations__table-head">Acciones</Table.Head>
                </Table.Row>
              {/each}
            </Table.Header>
            <Table.Body>
              {#each reservationTable.getRowModel().rows as row (row.id)}
                <Table.Row>
                  {#each row.getAllCells() as cell (cell.id)}
                    <Table.Cell>
                      {#if cell.column.id === 'startsAt'}
                        <span class="reservations__date"
                          >{formatElSalvadorDateTime(row.original.startsAt)}</span
                        >
                      {:else if cell.column.id === 'status'}
                        <span class={statusClass(row.original.status)}
                          >{reservationStatusLabel(row.original.status)}</span
                        >
                      {:else}<FlexRender {cell} />{/if}
                    </Table.Cell>
                  {/each}
                  <Table.Cell
                    ><a
                      class="reservations__link"
                      href={resolve(
                        ('/reservaciones' +
                          queryUrl({ selected: row.original.id })) as '/reservaciones',
                      )}>Ver detalle</a
                    ></Table.Cell
                  >
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        </div>
      {:else}
        <div class="reservations__agenda" aria-label="Agenda diaria">
          {#each data.reservations as reservation (reservation.id)}
            <article class="reservations__agenda-item">
              <time class="reservations__agenda-time" datetime={reservation.startsAt}
                >{formatElSalvadorDateTime(reservation.startsAt)}</time
              >
              <div class="reservations__agenda-content">
                <strong>{reservation.contactNameSnapshot}</strong>
                <span
                  >{reservation.partySize} personas · {spaceName(
                    reservation.preferredSpaceId,
                  )}</span
                >
                <span class={statusClass(reservation.status)}
                  >{reservationStatusLabel(reservation.status)}</span
                >
              </div>
              <a
                class="reservations__link"
                href={resolve(
                  ('/reservaciones' + queryUrl({ selected: reservation.id })) as '/reservaciones',
                )}>Ver</a
              >
            </article>
          {/each}
        </div>
      {/if}

      <div class="reservations__pagination">
        <span>Página {data.meta.page} de {data.meta.totalPages} · {data.meta.total} registros</span>
        <div class="reservations__pagination-actions">
          {#if data.meta.page > 1}<a
              class="reservations__page-link"
              href={resolve(
                ('/reservaciones' + queryUrl({ page: data.meta.page - 1 })) as '/reservaciones',
              )}><ChevronLeft aria-hidden="true" /> Anterior</a
            >{/if}
          {#if data.meta.page < data.meta.totalPages}<a
              class="reservations__page-link"
              href={resolve(
                ('/reservaciones' + queryUrl({ page: data.meta.page + 1 })) as '/reservaciones',
              )}>Siguiente <ChevronRight aria-hidden="true" /></a
            >{/if}
        </div>
      </div>
    </section>
  {:else}
    <section class="reservations__card" aria-label="Mantenimiento de espacios y mesas">
      <div class="reservations__toolbar">
        <div>
          <h3 class="reservations__section-title">Espacios</h3>
          <p class="reservations__helper">Capacidad y disponibilidad física de la sede.</p>
        </div>
        {#if canManage}<Button onclick={() => startSpace()}
            ><Plus aria-hidden="true" /> Nuevo espacio</Button
          >{/if}
      </div>
      {#if !data.spaces.length}<p class="reservations__empty">
          No hay espacios registrados.
        </p>{:else}<div class="reservations__table-wrap">
          <Table.Root
            ><Table.Header
              ><Table.Row
                ><Table.Head class="reservations__table-head">Espacio</Table.Head><Table.Head
                  class="reservations__table-head">Tipo</Table.Head
                ><Table.Head class="reservations__table-head">Capacidad</Table.Head><Table.Head
                  class="reservations__table-head">Mesas</Table.Head
                ><Table.Head class="reservations__table-head">Estado</Table.Head
                >{#if canManage}<Table.Head class="reservations__table-head">Acciones</Table.Head
                  >{/if}</Table.Row
              ></Table.Header
            ><Table.Body
              >{#each data.spaces as space (space.id)}<Table.Row
                  ><Table.Cell
                    ><strong>{space.nameEs}</strong><span class="reservations__subtext"
                      >{space.code} · {space.nameEn}</span
                    ></Table.Cell
                  ><Table.Cell
                    >{SPACE_TYPES.find(([value]) => value === space.spaceType)?.[1] ??
                      space.spaceType}</Table.Cell
                  ><Table.Cell
                    >{space.seatedCapacity} sentados{space.standingCapacity
                      ? ` · ${space.standingCapacity} de pie`
                      : ''}</Table.Cell
                  ><Table.Cell>{space.tableCount}</Table.Cell><Table.Cell
                    ><span
                      class={space.active
                        ? 'admin-status admin-status--success'
                        : 'admin-status admin-status--danger'}
                      >{space.active ? 'Activo' : 'Inactivo'}</span
                    ></Table.Cell
                  >{#if canManage}<Table.Cell
                      ><div class="reservations__actions">
                        <Button variant="ghost" size="sm" onclick={() => startSpace(space)}
                          ><Pencil aria-hidden="true" /> Editar</Button
                        >
                        <form
                          method="POST"
                          action="?/deleteSpace"
                          onsubmit={(event: SubmitEvent) => {
                            if (!window.confirm('¿Desactivar este espacio?'))
                              event.preventDefault();
                          }}
                        >
                          <input type="hidden" name="id" value={space.id} /><Button
                            variant="ghost"
                            size="sm"
                            type="submit"><X aria-hidden="true" /> Desactivar</Button
                          >
                        </form>
                      </div></Table.Cell
                    >{/if}</Table.Row
                >{/each}</Table.Body
            ></Table.Root
          >
        </div>{/if}

      <div class="reservations__subsection">
        <div class="reservations__toolbar">
          <div>
            <h3 class="reservations__section-title">Mesas</h3>
            <p class="reservations__helper">
              Las mesas se pueden asignar desde el detalle de una reserva.
            </p>
          </div>
          {#if canManage}<Button onclick={() => startTable()}
              ><Plus aria-hidden="true" /> Nueva mesa</Button
            >{/if}
        </div>
        {#if !data.tables.length}<p class="reservations__empty">
            No hay mesas registradas.
          </p>{:else}<div class="reservations__table-wrap">
            <Table.Root
              ><Table.Header
                ><Table.Row
                  ><Table.Head class="reservations__table-head">Mesa</Table.Head><Table.Head
                    class="reservations__table-head">Espacio</Table.Head
                  ><Table.Head class="reservations__table-head">Asientos</Table.Head><Table.Head
                    class="reservations__table-head">Forma</Table.Head
                  ><Table.Head class="reservations__table-head">Estado</Table.Head
                  >{#if canManage}<Table.Head class="reservations__table-head">Acciones</Table.Head
                    >{/if}</Table.Row
                ></Table.Header
              ><Table.Body
                >{#each data.tables as table (table.id)}<Table.Row
                    ><Table.Cell
                      ><strong>{table.name}</strong><span class="reservations__subtext"
                        >{table.tableCode}</span
                      ></Table.Cell
                    ><Table.Cell>{spaceName(table.spaceId)}</Table.Cell><Table.Cell
                      >{table.seatCount}</Table.Cell
                    ><Table.Cell
                      >{TABLE_SHAPES.find(([value]) => value === table.shape)?.[1] ??
                        table.shape}</Table.Cell
                    ><Table.Cell
                      ><span
                        class={table.active
                          ? 'admin-status admin-status--success'
                          : 'admin-status admin-status--danger'}
                        >{table.active ? 'Activa' : 'Inactiva'}</span
                      ></Table.Cell
                    >{#if canManage}<Table.Cell
                        ><div class="reservations__actions">
                          <Button variant="ghost" size="sm" onclick={() => startTable(table)}
                            ><Pencil aria-hidden="true" /> Editar</Button
                          >
                          <form
                            method="POST"
                            action="?/deleteTable"
                            onsubmit={(event: SubmitEvent) => {
                              if (!window.confirm('¿Desactivar esta mesa?')) event.preventDefault();
                            }}
                          >
                            <input type="hidden" name="id" value={table.id} /><Button
                              variant="ghost"
                              size="sm"
                              type="submit"><X aria-hidden="true" /> Desactivar</Button
                            >
                          </form>
                        </div></Table.Cell
                      >{/if}</Table.Row
                  >{/each}</Table.Body
              ></Table.Root
            >
          </div>{/if}
      </div>
    </section>
  {/if}
</section>

{#if data.selectedReservation}
  <Dialog.Root bind:open={detailOpen}>
    <Dialog.Content class="reservations__dialog">
      <Dialog.Header
        ><Dialog.Title>{data.selectedReservation.reservationCode}</Dialog.Title><Dialog.Description
          >Detalle de la reserva en hora local de El Salvador.</Dialog.Description
        ></Dialog.Header
      >
      <div class="reservations__detail">
        <div class="reservations__detail-grid">
          <div>
            <span class="reservations__detail-label">Cliente</span><strong
              >{data.selectedReservation.contactNameSnapshot}</strong
            ><span>{data.selectedReservation.contactPhoneSnapshot}</span
            >{#if data.selectedReservation.contactEmailSnapshot}<span
                >{data.selectedReservation.contactEmailSnapshot}</span
              >{/if}
          </div>
          <div>
            <span class="reservations__detail-label">Horario</span><strong
              >{formatElSalvadorDateTime(data.selectedReservation.startsAt)}</strong
            ><span>Hasta {formatElSalvadorDateTime(data.selectedReservation.endsAt)}</span>
          </div>
          <div>
            <span class="reservations__detail-label">Estado</span><span
              class={statusClass(data.selectedReservation.status)}
              >{reservationStatusLabel(data.selectedReservation.status)}</span
            >
          </div>
          <div>
            <span class="reservations__detail-label">Grupo</span><strong
              >{data.selectedReservation.partySize} personas</strong
            ><span>{spaceName(data.selectedReservation.preferredSpaceId)}</span>
          </div>
        </div>
        {#if data.selectedReservation.specialRequests}<p class="reservations__detail-note">
            <strong>Solicitud especial:</strong>
            {data.selectedReservation.specialRequests}
          </p>{/if}
        {#if data.selectedReservation.internalNotes}<p class="reservations__detail-note">
            <strong>Nota interna:</strong>
            {data.selectedReservation.internalNotes}
          </p>{/if}
        {#if canManage}<div class="reservations__detail-section">
            <h3>Acciones de estado</h3>
            <div class="reservations__actions">
              {#each reservationActionsFor(data.selectedReservation.status) as action (action)}<form
                  method="POST"
                  action="?/transition"
                >
                  <input type="hidden" name="id" value={data.selectedReservation.id} /><input
                    type="hidden"
                    name="transition"
                    value={action}
                  /><Button
                    variant={action === 'cancel' || action === 'no-show'
                      ? 'destructive'
                      : 'secondary'}
                    size="sm"
                    type="submit">{RESERVATION_ACTION_LABELS[action]}</Button
                  >
                </form>{/each}
            </div>
          </div>{/if}
        <div class="reservations__detail-section">
          <h3>Mesas asignadas</h3>
          {#if canManage}<form method="POST" action="?/assignTables">
              <input type="hidden" name="reservationId" value={data.selectedReservation.id} /><input
                type="hidden"
                name="tableIds"
                value={JSON.stringify(selectedTableIds)}
              />
              <div class="reservations__table-picker">
                {#each data.tables.filter((table) => table.active) as table (table.id)}<label
                    class="reservations__checkbox"
                    ><input
                      type="checkbox"
                      checked={selectedTableIds.includes(table.id)}
                      onchange={(event) => toggleTable(event, table.id)}
                    /><span>{table.tableCode} · {table.name} · {table.seatCount} asientos</span
                    ><small>{spaceName(table.spaceId)}</small></label
                  >{/each}
              </div>
              <Button type="submit"><Check aria-hidden="true" /> Guardar mesas</Button>
            </form>{:else}<p class="reservations__helper">
              {data.selectedReservation.tables.map((table) => table.tableCode).join(', ') ||
                'Sin mesas asignadas.'}
            </p>{/if}
        </div>
      </div>
      <Dialog.Footer
        ><Dialog.Close asChild
          ><Button variant="outline" onclick={() => (detailOpen = false)}>Cerrar</Button
          ></Dialog.Close
        ></Dialog.Footer
      >
    </Dialog.Content>
  </Dialog.Root>
{/if}

{#if spaceOpen}
  <Dialog.Root bind:open={spaceOpen}
    ><Dialog.Content class="reservations__dialog"
      ><Dialog.Header
        ><Dialog.Title>{editingSpace ? 'Editar espacio' : 'Nuevo espacio'}</Dialog.Title
        ><Dialog.Description
          >Los campos siguen el contrato de espacios administrativos.</Dialog.Description
        ></Dialog.Header
      >
      <form class="reservations__form" method="POST" action="?/saveSpace">
        <input type="hidden" name="id" value={spaceId} /><input
          type="hidden"
          name="locationId"
          value={data.locationId}
        />
        <div class="reservations__form-grid">
          <label class="reservations__field"
            ><span>Código</span><input
              class="reservations__input"
              name="code"
              bind:value={spaceCode}
              required
            /></label
          ><label class="reservations__field"
            ><span>Nombre en español</span><input
              class="reservations__input"
              name="nameEs"
              bind:value={spaceNameEs}
              required
            /></label
          ><label class="reservations__field"
            ><span>Nombre en inglés</span><input
              class="reservations__input"
              name="nameEn"
              bind:value={spaceNameEn}
              required
            /></label
          ><label class="reservations__field"
            ><span>Tipo</span><select
              class="reservations__input"
              name="spaceType"
              bind:value={spaceType}
              >{#each SPACE_TYPES as [value, label] (value)}<option {value}>{label}</option
                >{/each}</select
            ></label
          ><label class="reservations__field"
            ><span>Capacidad sentada</span><input
              class="reservations__input"
              type="number"
              min="1"
              name="seatedCapacity"
              bind:value={seatedCapacity}
              required
            /></label
          ><label class="reservations__field"
            ><span>Capacidad de pie</span><input
              class="reservations__input"
              type="number"
              min="1"
              name="standingCapacity"
              bind:value={standingCapacity}
            /></label
          >
        </div>
        <input type="hidden" name="allowsTableReservation" value="false" /><label
          class="reservations__checkbox"
          ><input
            type="checkbox"
            name="allowsTableReservation"
            value="true"
            checked={allowsTableReservation}
            onchange={(event) =>
              (allowsTableReservation = (event.currentTarget as HTMLInputElement).checked)}
          /> Admite reservaciones de mesa</label
        ><input type="hidden" name="allowsPrivateEvent" value="false" /><label
          class="reservations__checkbox"
          ><input
            type="checkbox"
            name="allowsPrivateEvent"
            value="true"
            checked={allowsPrivateEvent}
            onchange={(event) =>
              (allowsPrivateEvent = (event.currentTarget as HTMLInputElement).checked)}
          /> Admite eventos privados</label
        ><input type="hidden" name="active" value="false" /><label class="reservations__checkbox"
          ><input
            type="checkbox"
            name="active"
            value="true"
            checked={activeSpace}
            onchange={(event) => (activeSpace = (event.currentTarget as HTMLInputElement).checked)}
          /> Activo</label
        ><Dialog.Footer><Button type="submit">Guardar espacio</Button></Dialog.Footer>
      </form></Dialog.Content
    ></Dialog.Root
  >
{/if}

{#if tableOpen}
  <Dialog.Root bind:open={tableOpen}
    ><Dialog.Content class="reservations__dialog"
      ><Dialog.Header
        ><Dialog.Title>{editingTable ? 'Editar mesa' : 'Nueva mesa'}</Dialog.Title
        ><Dialog.Description>Una mesa pertenece a un espacio de la sede.</Dialog.Description
        ></Dialog.Header
      >
      <form class="reservations__form" method="POST" action="?/saveTable">
        <input type="hidden" name="id" value={tableId} />
        <div class="reservations__form-grid">
          <label class="reservations__field"
            ><span>Espacio</span><select
              class="reservations__input"
              name="spaceId"
              bind:value={selectedSpaceId}
              required
              >{#each data.spaces as space (space.id)}<option value={space.id}
                  >{space.nameEs}</option
                >{/each}</select
            ></label
          ><label class="reservations__field"
            ><span>Código</span><input
              class="reservations__input"
              name="tableCode"
              bind:value={tableCode}
              required
            /></label
          ><label class="reservations__field"
            ><span>Nombre</span><input
              class="reservations__input"
              name="name"
              bind:value={tableName}
              required
            /></label
          ><label class="reservations__field"
            ><span>Asientos</span><input
              class="reservations__input"
              type="number"
              min="1"
              name="seatCount"
              bind:value={seatCount}
              required
            /></label
          ><label class="reservations__field"
            ><span>Forma</span><select class="reservations__input" name="shape" bind:value={shape}
              >{#each TABLE_SHAPES as [value, label] (value)}<option {value}>{label}</option
                >{/each}</select
            ></label
          >
        </div>
        <input type="hidden" name="active" value="false" /><label class="reservations__checkbox"
          ><input
            type="checkbox"
            name="active"
            value="true"
            checked={activeTable}
            onchange={(event) => (activeTable = (event.currentTarget as HTMLInputElement).checked)}
          /> Activa</label
        ><Dialog.Footer><Button type="submit">Guardar mesa</Button></Dialog.Footer>
      </form></Dialog.Content
    ></Dialog.Root
  >
{/if}
