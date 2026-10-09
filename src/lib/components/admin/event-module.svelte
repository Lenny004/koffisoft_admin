<script lang="ts">
  import {
    createColumnHelper,
    createTable,
    FlexRender,
    tableFeatures,
  } from '@tanstack/svelte-table';
  import { CalendarDays, Check, Pencil, Plus, Quote, Search, X } from '@lucide/svelte';

  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { formatElSalvadorDateTime, isoToElSalvadorDateTimeLocal } from '$lib/formatting/dates';
  import {
    EVENT_STATUS_LABELS,
    EVENT_TYPE_LABELS,
    eventStatusLabel,
    eventTypeLabel,
    quoteStatusLabel,
  } from '$lib/events/types';
  import type { Event, EventPackage } from '$lib/events/types';
  import type { PageProps } from '../../../routes/(app)/eventos/$types';
  import { resolve } from '$app/paths';

  type Section = 'events' | 'packages';

  type Props = Pick<PageProps, 'data' | 'form'>;
  let { data, form }: Props = $props();
  let section = $state<Section>('events');
  let eventOpen = $state(false);
  let packageOpen = $state(false);
  let editingEvent = $state<Event | null>(null);
  let editingPackage = $state<EventPackage | null>(null);

  let eventId = $state('');
  let eventType = $state('Other');
  let title = $state('');
  let contactName = $state('');
  let contactPhone = $state('');
  let contactEmail = $state('');
  let startsAt = $state('');
  let endsAt = $state('');
  let setupStartsAt = $state('');
  let estimatedGuestCount = $state('');
  let confirmedGuestCount = $state('');
  let budgetTarget = $state('');
  let eventStatus = $state('Inquiry');
  let specialRequirements = $state('');
  let internalNotes = $state('');

  let packageId = $state('');
  let packageCode = $state('');
  let packageNameEs = $state('');
  let packageNameEn = $state('');
  let packageDescriptionEs = $state('');
  let packageDescriptionEn = $state('');
  let pricingModel = $state('per_person');
  let basePrice = $state('');
  let minGuestCount = $state('');
  let maxGuestCount = $state('');
  let packageActive = $state(true);
  let packageLines = $state('[]');

  const canManage = $derived(data.permissions.includes('events.manage'));
  const canManageQuotes = $derived(data.permissions.includes('event_quotes.manage'));
  const features = tableFeatures({});
  const columnHelper = createColumnHelper<typeof features, Event>();
  const columns = columnHelper.columns([
    columnHelper.accessor('eventCode', { header: 'Código' }),
    columnHelper.accessor('title', { header: 'Evento' }),
    columnHelper.accessor('startsAt', { header: 'Fecha y hora' }),
    columnHelper.accessor('estimatedGuestCount', { header: 'Invitados' }),
    columnHelper.accessor('status', { header: 'Estado' }),
  ]);
  const eventTable = createTable({
    features,
    columns,
    get data() {
      return data.events;
    },
  });

  function queryUrl(values: Record<string, string | number | undefined>): string {
    const query = new URLSearchParams();
    if (data.filters.status) query.set('status', data.filters.status);
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined && value !== '') query.set(key, String(value));
    }
    return `?${query.toString()}`;
  }

  function startEvent(event?: Event) {
    editingEvent = event ?? null;
    eventId = event?.id ?? '';
    eventType = event?.eventType ?? 'Other';
    title = event?.title ?? '';
    contactName = event?.contactNameSnapshot ?? '';
    contactPhone = event?.contactPhoneSnapshot ?? '';
    contactEmail = event?.contactEmailSnapshot ?? '';
    startsAt = isoToElSalvadorDateTimeLocal(event?.startsAt ?? null);
    endsAt = isoToElSalvadorDateTimeLocal(event?.endsAt ?? null);
    setupStartsAt = isoToElSalvadorDateTimeLocal(event?.setupStartsAt ?? null);
    estimatedGuestCount = event ? String(event.estimatedGuestCount) : '';
    confirmedGuestCount = event?.confirmedGuestCount ? String(event.confirmedGuestCount) : '';
    budgetTarget = event?.budgetTarget ?? '';
    eventStatus = event?.status ?? 'Inquiry';
    specialRequirements = event?.specialRequirements ?? '';
    internalNotes = event?.internalNotes ?? '';
    eventOpen = true;
  }

  function startPackage(packageItem?: EventPackage) {
    editingPackage = packageItem ?? null;
    packageId = packageItem?.id ?? '';
    packageCode = packageItem?.packageCode ?? '';
    packageNameEs = packageItem?.nameEs ?? '';
    packageNameEn = packageItem?.nameEn ?? '';
    packageDescriptionEs = packageItem?.descriptionEs ?? '';
    packageDescriptionEn = packageItem?.descriptionEn ?? '';
    pricingModel = packageItem?.pricingModel ?? 'per_person';
    basePrice = packageItem?.basePrice ?? '';
    minGuestCount = packageItem?.minGuestCount ? String(packageItem.minGuestCount) : '';
    maxGuestCount = packageItem?.maxGuestCount ? String(packageItem.maxGuestCount) : '';
    packageActive = packageItem?.active ?? true;
    packageLines = JSON.stringify(
      packageItem?.lines.map(({ id: _id, menuItemVariantId, ...line }) => ({
        ...line,
        ...(menuItemVariantId ? { menuItemVariantId } : {}),
      })) ?? [],
      null,
      2,
    );
    packageOpen = true;
  }

  function statusClass(status: string): string {
    if (['Confirmed', 'InProgress', 'Completed', 'Accepted'].includes(status))
      return 'admin-status admin-status--success';
    if (['Cancelled', 'Lost', 'Rejected', 'Expired'].includes(status))
      return 'admin-status admin-status--danger';
    return 'admin-status admin-status--warning';
  }

  function spaceName(id: string): string {
    return data.spaces.find((space) => space.id === id)?.nameEs ?? 'Espacio no disponible';
  }

  function quoteLineExample(): string {
    return JSON.stringify(
      [
        {
          lineType: 'Service',
          labelEs: 'Servicio de evento',
          labelEn: 'Event service',
          quantity: '1',
          unit: 'servicio',
          unitPrice: '0.00',
          discountAmount: '0',
          taxRate: '0',
          sortOrder: 0,
        },
      ],
      null,
      2,
    );
  }
</script>

<section class="events" aria-labelledby="events-title">
  <header class="page-header">
    <div>
      <p class="page-header__eyebrow">Operación</p>
      <h2 class="page-header__title" id="events-title">Eventos privados</h2>
      <p class="page-header__description">
        Gestiona solicitudes, espacios, paquetes, cotizaciones y requerimientos sin recalcular
        importes en el navegador.
      </p>
    </div>
    <span class="events__timezone">America/El_Salvador</span>
  </header>

  <div class="events__tabs" aria-label="Secciones de eventos" role="tablist">
    <button
      class={section === 'events' ? 'events__tab events__tab--active' : 'events__tab'}
      type="button"
      role="tab"
      aria-selected={section === 'events'}
      onclick={() => (section = 'events')}><CalendarDays aria-hidden="true" /> Eventos</button
    >
    <button
      class={section === 'packages' ? 'events__tab events__tab--active' : 'events__tab'}
      type="button"
      role="tab"
      aria-selected={section === 'packages'}
      onclick={() => (section = 'packages')}><Quote aria-hidden="true" /> Paquetes</button
    >
  </div>

  {#if form?.errors?.length}<div class="events__error" role="alert">
      {#each form.errors as message (message)}<p>{message}</p>{/each}
    </div>{/if}
  {#if data.error}<div class="events__error" role="alert">
      {data.error}
    </div>{:else if section === 'events'}
    <section class="events__card" aria-label="Listado de eventos">
      <div class="events__toolbar">
        <form class="events__filters" method="GET">
          <label class="events__label" for="event-status">Estado</label><select
            class="events__input"
            id="event-status"
            name="status"
            value={data.filters.status}
            ><option value="">Todos</option
            >{#each Object.entries(EVENT_STATUS_LABELS) as [value, label] (value)}<option {value}
                >{label}</option
              >{/each}</select
          ><Button type="submit" variant="secondary"><Search aria-hidden="true" /> Filtrar</Button>
        </form>
        {#if canManage}<Button onclick={() => startEvent()}
            ><Plus aria-hidden="true" /> Nuevo evento</Button
          >{/if}
      </div>
      {#if !data.events.length}<p class="events__empty">
          No hay eventos para los filtros seleccionados.
        </p>{:else}<div class="events__table-wrap">
          <Table.Root
            ><Table.Header
              >{#each eventTable.getHeaderGroups() as headerGroup (headerGroup.id)}<Table.Row
                  >{#each headerGroup.headers as header (header.id)}<Table.Head
                      class="events__table-head"
                      >{#if !header.isPlaceholder}<FlexRender {header} />{/if}</Table.Head
                    >{/each}<Table.Head class="events__table-head">Acciones</Table.Head></Table.Row
                >{/each}</Table.Header
            ><Table.Body
              >{#each eventTable.getRowModel().rows as row (row.id)}<Table.Row
                  >{#each row.getAllCells() as cell (cell.id)}<Table.Cell
                      >{#if cell.column.id === 'startsAt'}{formatElSalvadorDateTime(
                          row.original.startsAt,
                        )}{:else if cell.column.id === 'status'}<span
                          class={statusClass(row.original.status)}
                          >{eventStatusLabel(row.original.status)}</span
                        >{:else}{#if cell.column.id === 'eventType'}{eventTypeLabel(
                            row.original.eventType,
                          )}{:else}<FlexRender {cell} />{/if}{/if}</Table.Cell
                    >{/each}<Table.Cell
                    ><a
                      class="events__link"
                      href={resolve(
                        ('/eventos' + queryUrl({ selected: row.original.id })) as '/eventos',
                      )}>Ver detalle</a
                    ></Table.Cell
                  ></Table.Row
                >{/each}</Table.Body
            ></Table.Root
          >
        </div>{/if}
      <div class="events__pagination">
        <span>Página {data.meta.page} de {data.meta.totalPages} · {data.meta.total} registros</span>
        <div class="events__pagination-actions">
          {#if data.meta.page > 1}<a
              class="events__page-link"
              href={resolve(('/eventos' + queryUrl({ page: data.meta.page - 1 })) as '/eventos')}
              >Anterior</a
            >{/if}{#if data.meta.page < data.meta.totalPages}<a
              class="events__page-link"
              href={resolve(('/eventos' + queryUrl({ page: data.meta.page + 1 })) as '/eventos')}
              >Siguiente</a
            >{/if}
        </div>
      </div>
    </section>

    {#if data.selectedEvent}
      <section class="events__detail-card" aria-labelledby="event-detail-title">
        <div class="events__detail-heading">
          <div>
            <p class="page-header__eyebrow">{data.selectedEvent.eventCode}</p>
            <h3 id="event-detail-title">{data.selectedEvent.title}</h3>
            <p>
              {eventTypeLabel(data.selectedEvent.eventType)} · {formatElSalvadorDateTime(
                data.selectedEvent.startsAt,
              )} a {formatElSalvadorDateTime(data.selectedEvent.endsAt)}
            </p>
          </div>
          <div class="events__actions">
            {#if canManage}<Button variant="outline" onclick={() => startEvent(data.selectedEvent!)}
                ><Pencil aria-hidden="true" /> Editar</Button
              >
              <form
                method="POST"
                action="?/deleteEvent"
                onsubmit={(event: SubmitEvent) => {
                  if (!window.confirm('¿Cancelar este evento?')) event.preventDefault();
                }}
              >
                <input type="hidden" name="id" value={data.selectedEvent.id} /><Button
                  variant="destructive"
                  type="submit">Cancelar</Button
                >
              </form>{/if}
          </div>
        </div>
        <div class="events__detail-grid">
          <div>
            <span class="events__detail-label">Contacto</span><strong
              >{data.selectedEvent.contactNameSnapshot}</strong
            ><span>{data.selectedEvent.contactPhoneSnapshot}</span
            >{#if data.selectedEvent.contactEmailSnapshot}<span
                >{data.selectedEvent.contactEmailSnapshot}</span
              >{/if}
          </div>
          <div>
            <span class="events__detail-label">Invitados</span><strong
              >{data.selectedEvent.confirmedGuestCount ??
                data.selectedEvent.estimatedGuestCount}</strong
            ><span>estimados {data.selectedEvent.estimatedGuestCount}</span>
          </div>
          <div>
            <span class="events__detail-label">Estado</span><span
              class={statusClass(data.selectedEvent.status)}
              >{eventStatusLabel(data.selectedEvent.status)}</span
            >
          </div>
          <div>
            <span class="events__detail-label">Presupuesto objetivo</span><strong
              >{data.selectedEvent.budgetTarget ?? 'No indicado'}</strong
            >
          </div>
        </div>
        {#if data.selectedEvent.specialRequirements}<p class="events__detail-note">
            <strong>Requerimientos especiales:</strong>
            {data.selectedEvent.specialRequirements}
          </p>{/if}{#if data.selectedEvent.internalNotes}<p class="events__detail-note">
            <strong>Nota interna:</strong>
            {data.selectedEvent.internalNotes}
          </p>{/if}
        <div class="events__detail-section">
          <div class="events__section-heading">
            <div>
              <h3>Espacios reservados</h3>
              <p class="events__helper">La API rechaza automáticamente los solapamientos.</p>
            </div>
          </div>
          {#if data.selectedEvent.spaceBookings.length}<div class="events__booking-list">
              {#each data.selectedEvent.spaceBookings as booking (booking.id)}<article
                  class="events__booking"
                >
                  <div>
                    <strong>{spaceName(booking.venueSpaceId)}</strong><span
                      >{formatElSalvadorDateTime(booking.startsAt)} — {formatElSalvadorDateTime(
                        booking.endsAt,
                      )}</span
                    ><span>{booking.capacityReserved} personas · {booking.bookingStatus}</span>
                  </div>
                  {#if canManage && booking.bookingStatus !== 'Released'}<form
                      method="POST"
                      action="?/releaseSpace"
                    >
                      <input type="hidden" name="id" value={booking.id} /><Button
                        variant="ghost"
                        size="sm"
                        type="submit"><X aria-hidden="true" /> Liberar</Button
                      >
                    </form>{/if}
                </article>{/each}
            </div>{:else}<p class="events__empty">
              Este evento todavía no tiene un espacio reservado.
            </p>{/if}{#if canManage}<form
              class="events__inline-form"
              method="POST"
              action="?/bookSpace"
            >
              <input type="hidden" name="eventId" value={data.selectedEvent.id} /><label
                class="events__field"
                ><span>Espacio</span><select class="events__input" name="venueSpaceId" required
                  >{#each data.spaces as space (space.id)}<option value={space.id}
                      >{space.nameEs} · {space.seatedCapacity} sentados</option
                    >{/each}</select
                ></label
              ><label class="events__field"
                ><span>Inicio</span><input
                  class="events__input"
                  type="datetime-local"
                  name="startsAt"
                  required
                /></label
              ><label class="events__field"
                ><span>Fin</span><input
                  class="events__input"
                  type="datetime-local"
                  name="endsAt"
                  required
                /></label
              ><label class="events__field"
                ><span>Capacidad</span><input
                  class="events__input"
                  type="number"
                  min="1"
                  name="capacityReserved"
                  required
                /></label
              ><label class="events__field"
                ><span>Estado</span><select class="events__input" name="bookingStatus"
                  ><option value="Held">Retenido</option><option value="Confirmed"
                    >Confirmado</option
                  ></select
                ></label
              ><Button type="submit"><Plus aria-hidden="true" /> Reservar espacio</Button>
            </form>{/if}
        </div>
        <div class="events__detail-section">
          <div class="events__section-heading">
            <div>
              <h3>Requerimientos</h3>
              <p class="events__helper">Se registran como requisitos operativos del evento.</p>
            </div>
          </div>
          {#if data.selectedEvent.requirements.length}{#each data.selectedEvent.requirements as requirement (requirement.id)}<form
                class="events__requirement"
                method="POST"
                action="?/updateRequirement"
              >
                <input type="hidden" name="requirementId" value={requirement.id} /><label
                  class="events__field"
                  ><span>{requirement.requirementType}</span><textarea
                    class="events__input"
                    name="description"
                    required>{requirement.description}</textarea
                  ></label
                ><label class="events__field"
                  ><span>Estado</span><select class="events__input" name="status"
                    ><option value="open" selected={requirement.status === 'open'}>Abierto</option
                    ><option value="acknowledged" selected={requirement.status === 'acknowledged'}
                      >Reconocido</option
                    ><option value="resolved" selected={requirement.status === 'resolved'}
                      >Resuelto</option
                    ></select
                  ></label
                ><input type="hidden" name="severity" value={requirement.severity} /><Button
                  variant="secondary"
                  size="sm"
                  type="submit"><Check aria-hidden="true" /> Guardar requisito</Button
                >
              </form>{/each}{:else}<p class="events__empty">
              No hay requisitos registrados.
            </p>{/if}{#if canManage}<form
              class="events__inline-form"
              method="POST"
              action="?/saveRequirement"
            >
              <input type="hidden" name="eventId" value={data.selectedEvent.id} /><label
                class="events__field"
                ><span>Tipo</span><select class="events__input" name="requirementType"
                  ><option value="allergy">Alergia</option><option value="diet">Dieta</option
                  ><option value="accessibility">Accesibilidad</option><option value="equipment"
                    >Equipo</option
                  ><option value="schedule">Horario</option><option value="other">Otro</option
                  ></select
                ></label
              ><label class="events__field"
                ><span>Descripción</span><input
                  class="events__input"
                  name="description"
                  required
                /></label
              ><label class="events__field"
                ><span>Severidad</span><select class="events__input" name="severity"
                  ><option value="important">Importante</option><option value="critical"
                    >Crítica</option
                  ><option value="informational">Informativa</option></select
                ></label
              ><input type="hidden" name="status" value="open" /><Button type="submit"
                ><Plus aria-hidden="true" /> Agregar</Button
              >
            </form>{/if}
        </div>
        <div class="events__detail-section">
          <div class="events__section-heading">
            <div>
              <h3>Cotizaciones</h3>
              <p class="events__helper">
                Los totales y los impuestos mostrados vienen calculados por la API.
              </p>
            </div>
          </div>
          {#if data.quotes.length}<div class="events__quote-list">
              {#each data.quotes as quote (quote.id)}<article class="events__quote">
                  <div class="events__quote-heading">
                    <strong>Versión {quote.versionNo}</strong><span
                      class={statusClass(quote.status)}>{quoteStatusLabel(quote.status)}</span
                    >
                  </div>
                  <div class="events__quote-totals">
                    <span>Subtotal {quote.subtotalAmount} {quote.currency}</span><span
                      >Impuesto {quote.taxAmount} {quote.currency}</span
                    ><strong>Total {quote.totalAmount} {quote.currency}</strong>
                  </div>
                  <ul class="events__quote-lines">
                    {#each quote.lines as line (line.id)}
                      <li>
                        <span>{line.labelEs}</span><span
                          >{line.quantity} {line.unit} · {line.lineTotal} {quote.currency}</span
                        >
                      </li>
                    {/each}
                  </ul>
                  <p>{quote.lines.length} líneas · válida hasta {quote.validUntil}</p>
                  {#if canManageQuotes}<form
                      class="events__quote-status"
                      method="POST"
                      action="?/updateQuoteStatus"
                    >
                      <input type="hidden" name="quoteId" value={quote.id} /><select
                        class="events__input"
                        name="status"
                        ><option value="Draft" selected={quote.status === 'Draft'}>Borrador</option
                        ><option value="Sent" selected={quote.status === 'Sent'}>Enviada</option
                        ><option value="Accepted" selected={quote.status === 'Accepted'}
                          >Aceptada</option
                        ><option value="Rejected" selected={quote.status === 'Rejected'}
                          >Rechazada</option
                        ><option value="Cancelled" selected={quote.status === 'Cancelled'}
                          >Cancelada</option
                        ></select
                      ><Button variant="secondary" size="sm" type="submit">Actualizar estado</Button
                      >
                    </form>{/if}
                </article>{/each}
            </div>{:else}<p class="events__empty">
              No hay cotizaciones para este evento.
            </p>{/if}{#if canManageQuotes}<form
              class="events__inline-form events__inline-form--wide"
              method="POST"
              action="?/createQuote"
            >
              <input type="hidden" name="eventId" value={data.selectedEvent.id} /><label
                class="events__field"
                ><span>Paquete opcional</span><select class="events__input" name="eventPackageId"
                  ><option value="">Sin paquete</option
                  >{#each data.packages.filter((item) => item.active) as packageItem (packageItem.id)}<option
                      value={packageItem.id}>{packageItem.nameEs}</option
                    >{/each}</select
                ></label
              ><label class="events__field"
                ><span>Válida hasta</span><input
                  class="events__input"
                  type="date"
                  name="validUntil"
                  required
                /></label
              ><label class="events__field events__field--wide"
                ><span>Líneas JSON</span><textarea
                  class="events__input events__textarea"
                  name="lines"
                  rows="6"
                  required
                  placeholder={quoteLineExample()}>{quoteLineExample()}</textarea
                ></label
              ><Button type="submit"><Plus aria-hidden="true" /> Crear cotización</Button>
            </form>{/if}
        </div>
      </section>
    {/if}
  {:else}
    <section class="events__card" aria-label="Paquetes de eventos">
      <div class="events__toolbar">
        <div>
          <h3 class="events__section-title">Paquetes</h3>
          <p class="events__helper">
            Cada paquete conserva sus líneas; el precio mostrado es el base del contrato.
          </p>
        </div>
        {#if canManage}<Button onclick={() => startPackage()}
            ><Plus aria-hidden="true" /> Nuevo paquete</Button
          >{/if}
      </div>
      {#if !data.packages.length}<p class="events__empty">
          No hay paquetes registrados.
        </p>{:else}<div class="events__table-wrap">
          <Table.Root
            ><Table.Header
              ><Table.Row
                ><Table.Head class="events__table-head">Paquete</Table.Head><Table.Head
                  class="events__table-head">Modelo</Table.Head
                ><Table.Head class="events__table-head">Precio base</Table.Head><Table.Head
                  class="events__table-head">Líneas</Table.Head
                ><Table.Head class="events__table-head">Estado</Table.Head
                >{#if canManage}<Table.Head class="events__table-head">Acciones</Table.Head
                  >{/if}</Table.Row
              ></Table.Header
            ><Table.Body
              >{#each data.packages as packageItem (packageItem.id)}<Table.Row
                  ><Table.Cell
                    ><strong>{packageItem.nameEs}</strong><span class="events__subtext"
                      >{packageItem.packageCode} · {packageItem.nameEn}</span
                    ></Table.Cell
                  ><Table.Cell>{packageItem.pricingModel}</Table.Cell><Table.Cell
                    >{packageItem.basePrice}</Table.Cell
                  ><Table.Cell
                    ><details class="events__line-details">
                      <summary>{packageItem.lines.length} líneas</summary>
                      <ul class="events__package-lines">
                        {#each packageItem.lines as line (line.id)}<li>
                            <span>{line.labelEs}</span><span
                              >{line.quantity} {line.unit} · {line.unitPrice}</span
                            >
                          </li>{/each}
                      </ul>
                    </details></Table.Cell
                  ><Table.Cell
                    ><span
                      class={packageItem.active
                        ? 'admin-status admin-status--success'
                        : 'admin-status admin-status--danger'}
                      >{packageItem.active ? 'Activo' : 'Inactivo'}</span
                    ></Table.Cell
                  >{#if canManage}<Table.Cell
                      ><div class="events__actions">
                        <Button variant="ghost" size="sm" onclick={() => startPackage(packageItem)}
                          ><Pencil aria-hidden="true" /> Editar</Button
                        >
                        <form method="POST" action="?/deletePackage">
                          <input type="hidden" name="id" value={packageItem.id} /><Button
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
    </section>
  {/if}
</section>

{#if eventOpen}<Dialog.Root bind:open={eventOpen}
    ><Dialog.Content class="events__dialog"
      ><Dialog.Header
        ><Dialog.Title>{editingEvent ? 'Editar evento' : 'Nuevo evento'}</Dialog.Title
        ><Dialog.Description
          >Las fechas se envían a la API con el offset de America/El_Salvador.</Dialog.Description
        ></Dialog.Header
      >
      <form class="events__form" method="POST" action="?/saveEvent">
        <input type="hidden" name="id" value={eventId} /><input
          type="hidden"
          name="locationId"
          value={data.locationId}
        />
        <div class="events__form-grid">
          <label class="events__field"
            ><span>Tipo</span><select class="events__input" name="eventType" bind:value={eventType}
              >{#each Object.entries(EVENT_TYPE_LABELS) as [value, label] (value)}<option {value}
                  >{label}</option
                >{/each}</select
            ></label
          ><label class="events__field"
            ><span>Estado</span><select class="events__input" name="status" bind:value={eventStatus}
              >{#each Object.entries(EVENT_STATUS_LABELS) as [value, label] (value)}<option {value}
                  >{label}</option
                >{/each}</select
            ></label
          ><label class="events__field events__field--wide"
            ><span>Título</span><input
              class="events__input"
              name="title"
              bind:value={title}
              required
            /></label
          ><label class="events__field"
            ><span>Contacto</span><input
              class="events__input"
              name="contactName"
              bind:value={contactName}
              required
            /></label
          ><label class="events__field"
            ><span>Teléfono</span><input
              class="events__input"
              name="contactPhone"
              bind:value={contactPhone}
              required
            /></label
          ><label class="events__field"
            ><span>Correo</span><input
              class="events__input"
              type="email"
              name="contactEmail"
              bind:value={contactEmail}
            /></label
          ><label class="events__field"
            ><span>Inicio</span><input
              class="events__input"
              type="datetime-local"
              name="startsAt"
              bind:value={startsAt}
              required
            /></label
          ><label class="events__field"
            ><span>Fin</span><input
              class="events__input"
              type="datetime-local"
              name="endsAt"
              bind:value={endsAt}
              required
            /></label
          ><label class="events__field"
            ><span>Inicio de montaje</span><input
              class="events__input"
              type="datetime-local"
              name="setupStartsAt"
              bind:value={setupStartsAt}
            /></label
          ><label class="events__field"
            ><span>Invitados estimados</span><input
              class="events__input"
              type="number"
              min="1"
              name="estimatedGuestCount"
              bind:value={estimatedGuestCount}
              required
            /></label
          ><label class="events__field"
            ><span>Invitados confirmados</span><input
              class="events__input"
              type="number"
              min="1"
              name="confirmedGuestCount"
              bind:value={confirmedGuestCount}
            /></label
          ><label class="events__field"
            ><span>Presupuesto</span><input
              class="events__input"
              inputmode="decimal"
              name="budgetTarget"
              bind:value={budgetTarget}
            /></label
          ><label class="events__field events__field--wide"
            ><span>Requerimientos especiales</span><textarea
              class="events__input"
              name="specialRequirements"
              bind:value={specialRequirements}></textarea></label
          ><label class="events__field events__field--wide"
            ><span>Notas internas</span><textarea
              class="events__input"
              name="internalNotes"
              bind:value={internalNotes}></textarea></label
          >
        </div>
        <input type="hidden" name="preferredLanguage" value="es" /><Dialog.Footer
          ><Button type="submit">Guardar evento</Button></Dialog.Footer
        >
      </form></Dialog.Content
    ></Dialog.Root
  >{/if}

{#if packageOpen}<Dialog.Root bind:open={packageOpen}
    ><Dialog.Content class="events__dialog"
      ><Dialog.Header
        ><Dialog.Title>{editingPackage ? 'Editar paquete' : 'Nuevo paquete'}</Dialog.Title
        ><Dialog.Description
          >Las líneas se envían a la API en una escritura transaccional.</Dialog.Description
        ></Dialog.Header
      >
      <form class="events__form" method="POST" action="?/savePackage">
        <input type="hidden" name="id" value={packageId} /><input
          type="hidden"
          name="locationId"
          value={data.locationId}
        />
        <div class="events__form-grid">
          <label class="events__field"
            ><span>Código</span><input
              class="events__input"
              name="packageCode"
              bind:value={packageCode}
              required
            /></label
          ><label class="events__field"
            ><span>Modelo</span><select
              class="events__input"
              name="pricingModel"
              bind:value={pricingModel}
              ><option value="per_person">Por persona</option><option value="flat"
                >Precio fijo</option
              ><option value="hourly">Por hora</option></select
            ></label
          ><label class="events__field"
            ><span>Nombre en español</span><input
              class="events__input"
              name="nameEs"
              bind:value={packageNameEs}
              required
            /></label
          ><label class="events__field"
            ><span>Nombre en inglés</span><input
              class="events__input"
              name="nameEn"
              bind:value={packageNameEn}
              required
            /></label
          ><label class="events__field"
            ><span>Precio base</span><input
              class="events__input"
              name="basePrice"
              inputmode="decimal"
              bind:value={basePrice}
              required
            /></label
          ><label class="events__field"
            ><span>Mínimo de invitados</span><input
              class="events__input"
              type="number"
              min="1"
              name="minGuestCount"
              bind:value={minGuestCount}
            /></label
          ><label class="events__field"
            ><span>Máximo de invitados</span><input
              class="events__input"
              type="number"
              min="1"
              name="maxGuestCount"
              bind:value={maxGuestCount}
            /></label
          ><label class="events__field events__field--wide"
            ><span>Descripción en español</span><textarea
              class="events__input"
              name="descriptionEs"
              bind:value={packageDescriptionEs}></textarea></label
          ><label class="events__field events__field--wide"
            ><span>Descripción en inglés</span><textarea
              class="events__input"
              name="descriptionEn"
              bind:value={packageDescriptionEn}></textarea></label
          ><label class="events__field events__field--wide"
            ><span>Líneas JSON</span><textarea
              class="events__input events__textarea"
              name="lines"
              bind:value={packageLines}
              rows="10"
              required></textarea><small class="events__helper"
              >Usa `lineType`, `labelEs`, `labelEn`, `quantity`, `unit`, `unitPrice`, `sortOrder` y
              `active`.</small
            ></label
          >
        </div>
        <input type="hidden" name="active" value="false" /><label class="events__checkbox"
          ><input
            type="checkbox"
            name="active"
            value="true"
            checked={packageActive}
            onchange={(event) =>
              (packageActive = (event.currentTarget as HTMLInputElement).checked)}
          /> Activo</label
        ><Dialog.Footer><Button type="submit">Guardar paquete</Button></Dialog.Footer>
      </form></Dialog.Content
    ></Dialog.Root
  >{/if}
