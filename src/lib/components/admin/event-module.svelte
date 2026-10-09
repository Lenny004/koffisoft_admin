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
  import FormField from '$lib/components/ui/form-field.svelte';
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
  import { FORM_LIMITS, FORM_PATTERNS } from '$lib/validation/limits';
  import type { PageProps } from '../../../routes/(app)/eventos/$types';
  import { resolve } from '$app/paths';

  type Section = 'events' | 'packages';

  type Props = Pick<PageProps, 'data' | 'form'>;
  let { data, form }: Props = $props();

  function fieldError(name: string): string {
    const errors = form?.errors;
    return errors && typeof errors === 'object' && !Array.isArray(errors)
      ? ((errors as Record<string, string>)[name] ?? '')
      : '';
  }

  function globalErrors(): string[] {
    const errors = form?.errors;
    if (!errors) return [];
    return Array.isArray(errors) ? errors : [];
  }
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

  function packageLineExample(): string {
    return JSON.stringify([
      {
        lineType: 'Menu',
        labelEs: 'Bocadillos',
        labelEn: 'Snacks',
        quantity: '1',
        unit: 'persona',
        unitPrice: '5.00',
      },
    ]);
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

  {#if globalErrors().length}<div class="events__error" role="alert">
      {#each globalErrors() as message (message)}<p>{message}</p>{/each}
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
              <p class="form-legend">
                <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
              </p>
              <input type="hidden" name="eventId" value={data.selectedEvent.id} /><label
                class="events__field"
                ><span>Espacio</span><select class="events__input" name="venueSpaceId" required
                  >{#each data.spaces as space (space.id)}<option value={space.id}
                      >{space.nameEs} · {space.seatedCapacity} sentados</option
                    >{/each}</select
                ></label
              ><FormField
                id="event-startsAt-1"
                label="Inicio"
                required
                class="events__field"
                error={fieldError('startsAt')}
              >
                <input
                  aria-invalid={Boolean(fieldError('startsAt'))}
                  aria-describedby={fieldError('startsAt') ? 'event-startsAt-1-error' : undefined}
                  id="event-startsAt-1"
                  class="events__input"
                  type="datetime-local"
                  name="startsAt"
                  required
                /></FormField
              >
              <FormField
                id="event-endsAt-2"
                label="Fin"
                required
                class="events__field"
                error={fieldError('endsAt')}
              >
                <input
                  aria-invalid={Boolean(fieldError('endsAt'))}
                  aria-describedby={fieldError('endsAt') ? 'event-endsAt-2-error' : undefined}
                  id="event-endsAt-2"
                  class="events__input"
                  type="datetime-local"
                  name="endsAt"
                  required
                /></FormField
              >
              <FormField
                id="event-capacityReserved-3"
                label="Capacidad"
                required
                class="events__field"
                error={fieldError('capacityReserved')}
              >
                <input
                  aria-invalid={Boolean(fieldError('capacityReserved'))}
                  aria-describedby={fieldError('capacityReserved')
                    ? 'event-capacityReserved-3-error'
                    : undefined}
                  id="event-capacityReserved-3"
                  class="events__input"
                  type="number"
                  min="1"
                  max={FORM_LIMITS.venue.smallIntMax}
                  step="1"
                  inputmode="numeric"
                  placeholder="Ej. 80"
                  name="capacityReserved"
                  required
                /></FormField
              >
              <FormField
                id="event-bookingStatus-4"
                label="Estado"
                class="events__field"
                error={fieldError('bookingStatus')}
              >
                <select
                  aria-invalid={Boolean(fieldError('bookingStatus'))}
                  aria-describedby={fieldError('bookingStatus')
                    ? 'event-bookingStatus-4-error'
                    : undefined}
                  id="event-bookingStatus-4"
                  class="events__input"
                  name="bookingStatus"
                  ><option value="Held">Retenido</option><option value="Confirmed"
                    >Confirmado</option
                  ></select
                ></FormField
              >
              <Button type="submit"><Plus aria-hidden="true" /> Reservar espacio</Button>
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
                <p class="form-legend">
                  <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
                </p>
                <input type="hidden" name="requirementId" value={requirement.id} /><label
                  class="events__field"
                  ><span>{requirement.requirementType}</span><textarea
                    class="events__input"
                    name="description"
                    maxlength={FORM_LIMITS.event.descriptionMaxLength}
                    required>{requirement.description}</textarea
                  ></label
                ><FormField
                  id="event-status-5"
                  label="Estado"
                  class="events__field"
                  error={fieldError('status')}
                >
                  <select
                    aria-invalid={Boolean(fieldError('status'))}
                    aria-describedby={fieldError('status') ? 'event-status-5-error' : undefined}
                    id="event-status-5"
                    class="events__input"
                    name="status"
                    ><option value="open" selected={requirement.status === 'open'}>Abierto</option
                    ><option value="acknowledged" selected={requirement.status === 'acknowledged'}
                      >Reconocido</option
                    ><option value="resolved" selected={requirement.status === 'resolved'}
                      >Resuelto</option
                    ></select
                  ></FormField
                >
                <input type="hidden" name="severity" value={requirement.severity} /><Button
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
              <p class="form-legend">
                <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
              </p>
              <input type="hidden" name="eventId" value={data.selectedEvent.id} /><label
                class="events__field"
                ><span>Tipo</span><select class="events__input" name="requirementType"
                  ><option value="allergy">Alergia</option><option value="diet">Dieta</option
                  ><option value="accessibility">Accesibilidad</option><option value="equipment"
                    >Equipo</option
                  ><option value="schedule">Horario</option><option value="other">Otro</option
                  ></select
                ></label
              ><FormField
                id="event-description-6"
                label="Descripción"
                required
                class="events__field"
                error={fieldError('description')}
              >
                <input
                  aria-invalid={Boolean(fieldError('description'))}
                  aria-describedby={fieldError('description')
                    ? 'event-description-6-error'
                    : undefined}
                  id="event-description-6"
                  class="events__input"
                  name="description"
                  maxlength={FORM_LIMITS.event.descriptionMaxLength}
                  placeholder="Ej. Menú sin nueces para 12 personas."
                  required
                /></FormField
              >
              <FormField
                id="event-severity-7"
                label="Severidad"
                class="events__field"
                error={fieldError('severity')}
              >
                <select
                  aria-invalid={Boolean(fieldError('severity'))}
                  aria-describedby={fieldError('severity') ? 'event-severity-7-error' : undefined}
                  id="event-severity-7"
                  class="events__input"
                  name="severity"
                  ><option value="important">Importante</option><option value="critical"
                    >Crítica</option
                  ><option value="informational">Informativa</option></select
                ></FormField
              >
              <input type="hidden" name="status" value="open" /><Button type="submit"
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
                      <p class="form-legend">Actualización de estado</p>
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
              <p class="form-legend">
                <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
              </p>
              <input type="hidden" name="eventId" value={data.selectedEvent.id} /><label
                class="events__field"
                ><span>Paquete opcional</span><select class="events__input" name="eventPackageId"
                  ><option value="">Sin paquete</option
                  >{#each data.packages.filter((item) => item.active) as packageItem (packageItem.id)}<option
                      value={packageItem.id}>{packageItem.nameEs}</option
                    >{/each}</select
                ></label
              ><FormField
                id="event-validUntil-8"
                label="Válida hasta"
                required
                class="events__field"
                error={fieldError('validUntil')}
              >
                <input
                  aria-invalid={Boolean(fieldError('validUntil'))}
                  aria-describedby={fieldError('validUntil')
                    ? 'event-validUntil-8-error'
                    : undefined}
                  id="event-validUntil-8"
                  class="events__input"
                  type="date"
                  name="validUntil"
                  required
                /></FormField
              >
              <FormField
                id="event-lines-9"
                label="Líneas JSON"
                required
                class="events__field events__field--wide"
                error={fieldError('lines')}
              >
                <textarea
                  aria-invalid={Boolean(fieldError('lines'))}
                  aria-describedby={fieldError('lines') ? 'event-lines-9-error' : undefined}
                  id="event-lines-9"
                  class="events__input events__textarea"
                  name="lines"
                  rows="6"
                  required
                  placeholder={quoteLineExample()}>{quoteLineExample()}</textarea
                ></FormField
              >
              <Button type="submit"><Plus aria-hidden="true" /> Crear cotización</Button>
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
        <p class="form-legend">
          <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
        </p>
        <input type="hidden" name="id" value={eventId} /><input
          type="hidden"
          name="locationId"
          value={data.locationId}
        />
        <div class="events__form-grid">
          <FormField
            id="event-eventType-10"
            label="Tipo"
            class="events__field"
            error={fieldError('eventType')}
          >
            <select
              aria-invalid={Boolean(fieldError('eventType'))}
              aria-describedby={fieldError('eventType') ? 'event-eventType-10-error' : undefined}
              id="event-eventType-10"
              class="events__input"
              name="eventType"
              bind:value={eventType}
              >{#each Object.entries(EVENT_TYPE_LABELS) as [value, label] (value)}<option {value}
                  >{label}</option
                >{/each}</select
            ></FormField
          >
          <FormField
            id="event-status-11"
            label="Estado"
            class="events__field"
            error={fieldError('status')}
          >
            <select
              aria-invalid={Boolean(fieldError('status'))}
              aria-describedby={fieldError('status') ? 'event-status-11-error' : undefined}
              id="event-status-11"
              class="events__input"
              name="status"
              bind:value={eventStatus}
              >{#each Object.entries(EVENT_STATUS_LABELS) as [value, label] (value)}<option {value}
                  >{label}</option
                >{/each}</select
            ></FormField
          >
          <FormField
            id="event-title-12"
            label="Título"
            required
            class="events__field events__field--wide"
            error={fieldError('title')}
          >
            <input
              aria-invalid={Boolean(fieldError('title'))}
              aria-describedby={fieldError('title') ? 'event-title-12-error' : undefined}
              id="event-title-12"
              class="events__input"
              name="title"
              bind:value={title}
              maxlength={FORM_LIMITS.event.titleMaxLength}
              placeholder="Ej. Boda de Ana y Luis"
              required
            /></FormField
          >
          <FormField
            id="event-contactName-13"
            label="Contacto"
            required
            class="events__field"
            error={fieldError('contactName')}
          >
            <input
              aria-invalid={Boolean(fieldError('contactName'))}
              aria-describedby={fieldError('contactName')
                ? 'event-contactName-13-error'
                : undefined}
              id="event-contactName-13"
              class="events__input"
              name="contactName"
              bind:value={contactName}
              maxlength={FORM_LIMITS.event.contactNameMaxLength}
              placeholder="Ej. Ana Martínez"
              required
            /></FormField
          >
          <FormField
            id="event-contactPhone-14"
            label="Teléfono"
            required
            class="events__field"
            error={fieldError('contactPhone')}
          >
            <input
              aria-invalid={Boolean(fieldError('contactPhone'))}
              aria-describedby={fieldError('contactPhone')
                ? 'event-contactPhone-14-error'
                : undefined}
              id="event-contactPhone-14"
              class="events__input"
              name="contactPhone"
              bind:value={contactPhone}
              inputmode="tel"
              maxlength={FORM_LIMITS.event.contactPhoneMaxLength}
              placeholder="Ej. +503 7000 0000"
              required
            /></FormField
          >
          <FormField
            id="event-contactEmail-15"
            label="Correo"
            class="events__field"
            error={fieldError('contactEmail')}
          >
            <input
              aria-invalid={Boolean(fieldError('contactEmail'))}
              aria-describedby={fieldError('contactEmail')
                ? 'event-contactEmail-15-error'
                : undefined}
              id="event-contactEmail-15"
              class="events__input"
              type="email"
              name="contactEmail"
              bind:value={contactEmail}
              maxlength={FORM_LIMITS.event.contactEmailMaxLength}
              placeholder="Ej. ana@correo.com"
            /></FormField
          >
          <FormField
            id="event-startsAt-16"
            label="Inicio"
            required
            class="events__field"
            error={fieldError('startsAt')}
          >
            <input
              aria-invalid={Boolean(fieldError('startsAt'))}
              aria-describedby={fieldError('startsAt') ? 'event-startsAt-16-error' : undefined}
              id="event-startsAt-16"
              class="events__input"
              type="datetime-local"
              name="startsAt"
              bind:value={startsAt}
              required
            /></FormField
          >
          <FormField
            id="event-endsAt-17"
            label="Fin"
            required
            class="events__field"
            error={fieldError('endsAt')}
          >
            <input
              aria-invalid={Boolean(fieldError('endsAt'))}
              aria-describedby={fieldError('endsAt') ? 'event-endsAt-17-error' : undefined}
              id="event-endsAt-17"
              class="events__input"
              type="datetime-local"
              name="endsAt"
              bind:value={endsAt}
              required
            /></FormField
          >
          <FormField
            id="event-setupStartsAt-18"
            label="Inicio de montaje"
            class="events__field"
            error={fieldError('setupStartsAt')}
          >
            <input
              aria-invalid={Boolean(fieldError('setupStartsAt'))}
              aria-describedby={fieldError('setupStartsAt')
                ? 'event-setupStartsAt-18-error'
                : undefined}
              id="event-setupStartsAt-18"
              class="events__input"
              type="datetime-local"
              name="setupStartsAt"
              bind:value={setupStartsAt}
            /></FormField
          >
          <FormField
            id="event-estimatedGuestCount-19"
            label="Invitados estimados"
            required
            class="events__field"
            error={fieldError('estimatedGuestCount')}
          >
            <input
              aria-invalid={Boolean(fieldError('estimatedGuestCount'))}
              aria-describedby={fieldError('estimatedGuestCount')
                ? 'event-estimatedGuestCount-19-error'
                : undefined}
              id="event-estimatedGuestCount-19"
              class="events__input"
              type="number"
              min="1"
              max={FORM_LIMITS.event.estimatedGuestCountMax}
              step="1"
              inputmode="numeric"
              placeholder="Ej. 80"
              name="estimatedGuestCount"
              bind:value={estimatedGuestCount}
              required
            /></FormField
          >
          <FormField
            id="event-confirmedGuestCount-20"
            label="Invitados confirmados"
            class="events__field"
            error={fieldError('confirmedGuestCount')}
          >
            <input
              aria-invalid={Boolean(fieldError('confirmedGuestCount'))}
              aria-describedby={fieldError('confirmedGuestCount')
                ? 'event-confirmedGuestCount-20-error'
                : undefined}
              id="event-confirmedGuestCount-20"
              class="events__input"
              type="number"
              min="1"
              max={FORM_LIMITS.event.estimatedGuestCountMax}
              step="1"
              inputmode="numeric"
              placeholder="Ej. 80"
              name="confirmedGuestCount"
              bind:value={confirmedGuestCount}
            /></FormField
          >
          <FormField
            id="event-budgetTarget-21"
            label="Presupuesto"
            class="events__field"
            error={fieldError('budgetTarget')}
          >
            <input
              aria-invalid={Boolean(fieldError('budgetTarget'))}
              aria-describedby={fieldError('budgetTarget')
                ? 'event-budgetTarget-21-error'
                : undefined}
              id="event-budgetTarget-21"
              class="events__input"
              inputmode="decimal"
              name="budgetTarget"
              type="number"
              min="0"
              max={FORM_LIMITS.event.budgetMax}
              step="0.01"
              pattern={FORM_PATTERNS.decimal2.source}
              placeholder="Ej. 2500.00"
              bind:value={budgetTarget}
            /></FormField
          >
          <FormField
            id="event-specialRequirements-22"
            label="Requerimientos especiales"
            class="events__field events__field--wide"
            error={fieldError('specialRequirements')}
          >
            <textarea
              aria-invalid={Boolean(fieldError('specialRequirements'))}
              aria-describedby={fieldError('specialRequirements')
                ? 'event-specialRequirements-22-error'
                : undefined}
              id="event-specialRequirements-22"
              class="events__input"
              name="specialRequirements"
              maxlength={FORM_LIMITS.event.specialRequirementsMaxLength}
              placeholder="Ej. Menú vegetariano y espacio para fotografías."
              bind:value={specialRequirements}></textarea></FormField
          >
          <FormField
            id="event-internalNotes-23"
            label="Notas internas"
            class="events__field events__field--wide"
            error={fieldError('internalNotes')}
          >
            <textarea
              aria-invalid={Boolean(fieldError('internalNotes'))}
              aria-describedby={fieldError('internalNotes')
                ? 'event-internalNotes-23-error'
                : undefined}
              id="event-internalNotes-23"
              class="events__input"
              name="internalNotes"
              maxlength={FORM_LIMITS.event.internalNotesMaxLength}
              placeholder="Ej. Confirmar montaje con coordinación."
              bind:value={internalNotes}></textarea></FormField
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
        <p class="form-legend">
          <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
        </p>
        <input type="hidden" name="id" value={packageId} /><input
          type="hidden"
          name="locationId"
          value={data.locationId}
        />
        <div class="events__form-grid">
          <FormField
            id="event-packageCode-24"
            label="Código"
            required
            class="events__field"
            error={fieldError('packageCode')}
          >
            <input
              aria-invalid={Boolean(fieldError('packageCode'))}
              aria-describedby={fieldError('packageCode')
                ? 'event-packageCode-24-error'
                : undefined}
              id="event-packageCode-24"
              class="events__input"
              name="packageCode"
              bind:value={packageCode}
              maxlength={FORM_LIMITS.event.packageCodeMaxLength}
              placeholder="Ej. BODA-CAFE-01"
              required
            /></FormField
          >
          <FormField
            id="event-pricingModel-25"
            label="Modelo"
            class="events__field"
            error={fieldError('pricingModel')}
          >
            <select
              aria-invalid={Boolean(fieldError('pricingModel'))}
              aria-describedby={fieldError('pricingModel')
                ? 'event-pricingModel-25-error'
                : undefined}
              id="event-pricingModel-25"
              class="events__input"
              name="pricingModel"
              bind:value={pricingModel}
              ><option value="per_person">Por persona</option><option value="flat"
                >Precio fijo</option
              ><option value="hourly">Por hora</option></select
            ></FormField
          >
          <FormField
            id="event-nameEs-26"
            label="Nombre en español"
            required
            class="events__field"
            error={fieldError('nameEs')}
          >
            <input
              aria-invalid={Boolean(fieldError('nameEs'))}
              aria-describedby={fieldError('nameEs') ? 'event-nameEs-26-error' : undefined}
              id="event-nameEs-26"
              class="events__input"
              name="nameEs"
              bind:value={packageNameEs}
              maxlength={FORM_LIMITS.event.packageNameMaxLength}
              placeholder="Ej. Paquete celebración"
              required
            /></FormField
          >
          <FormField
            id="event-nameEn-27"
            label="Nombre en inglés"
            required
            class="events__field"
            error={fieldError('nameEn')}
          >
            <input
              aria-invalid={Boolean(fieldError('nameEn'))}
              aria-describedby={fieldError('nameEn') ? 'event-nameEn-27-error' : undefined}
              id="event-nameEn-27"
              class="events__input"
              name="nameEn"
              bind:value={packageNameEn}
              maxlength={FORM_LIMITS.event.packageNameMaxLength}
              placeholder="Ej. Celebration package"
              required
            /></FormField
          >
          <FormField
            id="event-basePrice-28"
            label="Precio base"
            required
            class="events__field"
            error={fieldError('basePrice')}
          >
            <input
              aria-invalid={Boolean(fieldError('basePrice'))}
              aria-describedby={fieldError('basePrice') ? 'event-basePrice-28-error' : undefined}
              id="event-basePrice-28"
              class="events__input"
              name="basePrice"
              type="number"
              inputmode="decimal"
              min="0"
              max={FORM_LIMITS.event.packagePriceMax}
              step="0.01"
              pattern={FORM_PATTERNS.decimal2.source}
              placeholder="Ej. 35.00"
              bind:value={basePrice}
              required
            /></FormField
          >
          <FormField
            id="event-minGuestCount-29"
            label="Mínimo de invitados"
            class="events__field"
            error={fieldError('minGuestCount')}
          >
            <input
              aria-invalid={Boolean(fieldError('minGuestCount'))}
              aria-describedby={fieldError('minGuestCount')
                ? 'event-minGuestCount-29-error'
                : undefined}
              id="event-minGuestCount-29"
              class="events__input"
              type="number"
              min="1"
              max={FORM_LIMITS.event.estimatedGuestCountMax}
              step="1"
              inputmode="numeric"
              placeholder="Ej. 20"
              name="minGuestCount"
              bind:value={minGuestCount}
            /></FormField
          >
          <FormField
            id="event-maxGuestCount-30"
            label="Máximo de invitados"
            class="events__field"
            error={fieldError('maxGuestCount')}
          >
            <input
              aria-invalid={Boolean(fieldError('maxGuestCount'))}
              aria-describedby={fieldError('maxGuestCount')
                ? 'event-maxGuestCount-30-error'
                : undefined}
              id="event-maxGuestCount-30"
              class="events__input"
              type="number"
              min="1"
              max={FORM_LIMITS.event.estimatedGuestCountMax}
              step="1"
              inputmode="numeric"
              placeholder="Ej. 100"
              name="maxGuestCount"
              bind:value={maxGuestCount}
            /></FormField
          >
          <FormField
            id="event-descriptionEs-31"
            label="Descripción en español"
            class="events__field events__field--wide"
            error={fieldError('descriptionEs')}
          >
            <textarea
              aria-invalid={Boolean(fieldError('descriptionEs'))}
              aria-describedby={fieldError('descriptionEs')
                ? 'event-descriptionEs-31-error'
                : undefined}
              id="event-descriptionEs-31"
              class="events__input"
              name="descriptionEs"
              maxlength={FORM_LIMITS.event.packageDescriptionMaxLength}
              placeholder="Ej. Incluye café, alimentos y montaje básico."
              bind:value={packageDescriptionEs}></textarea></FormField
          >
          <FormField
            id="event-descriptionEn-32"
            label="Descripción en inglés"
            class="events__field events__field--wide"
            error={fieldError('descriptionEn')}
          >
            <textarea
              aria-invalid={Boolean(fieldError('descriptionEn'))}
              aria-describedby={fieldError('descriptionEn')
                ? 'event-descriptionEn-32-error'
                : undefined}
              id="event-descriptionEn-32"
              class="events__input"
              name="descriptionEn"
              maxlength={FORM_LIMITS.event.packageDescriptionMaxLength}
              placeholder="Ej. Includes coffee, food and basic setup."
              bind:value={packageDescriptionEn}></textarea></FormField
          >
          <FormField
            id="event-lines-33"
            label="Líneas JSON"
            required
            class="events__field events__field--wide"
            error={fieldError('lines')}
          >
            <textarea
              aria-invalid={Boolean(fieldError('lines'))}
              aria-describedby={fieldError('lines') ? 'event-lines-33-error' : undefined}
              id="event-lines-33"
              class="events__input events__textarea"
              name="lines"
              bind:value={packageLines}
              rows="10"
              placeholder={packageLineExample()}
              required></textarea><small class="events__helper"
              >Usa `lineType`, `labelEs`, `labelEn`, `quantity`, `unit`, `unitPrice`, `sortOrder` y
              `active`.</small
            ></FormField
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
