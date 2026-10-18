<script lang="ts">
  /**
   * Bandeja de contacto de la sede: listado con filtros, detalle del mensaje seleccionado
   * y acciones de gestión o conversión mediante form actions de la ruta padre.
   */
  import { resolve } from '$app/paths';
  import { Archive, Check, Eye, Mail, UserPlus } from '@lucide/svelte';

  import * as Card from '$lib/components/ui/card/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import FormField from '$lib/components/ui/form-field.svelte';
  import * as Table from '$lib/components/ui/table/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import * as Alert from '$lib/components/ui/alert/index.js';
  import * as Badge from '$lib/components/ui/badge/index.js';
  import { formatElSalvadorDateTime } from '$lib/formatting/dates';
  import {
    CONTACT_STATUS_LABELS,
    CONTACT_TOPIC_LABELS,
    contactStatusLabel,
  } from '$lib/contact/types';
  import type { ContactMessage, ContactStatus } from '$lib/contact/types';
  import { FORM_LIMITS } from '$lib/validation/limits';
  import {
    fieldError as getFieldError,
    globalErrors as getGlobalErrors,
  } from '$lib/validation/errors';
  import type { PageProps } from '../../../routes/(app)/contacto/$types';

  type Props = Pick<PageProps, 'data' | 'form'>;
  let { data, form }: Props = $props();
  let reservationOpen = $state(false);
  let eventOpen = $state(false);
  let conversionMessage = $state<ContactMessage | null>(null);
  let pendingAction = $state<string | null>(null);

  let reservationDate = $state('');
  let reservationTime = $state('');
  let reservationPhone = $state('');
  let reservationPartySize = $state('2');
  let reservationDuration = $state('120');
  let reservationSpaceId = $state('');
  let eventType = $state('Corporate');
  let eventTitle = $state('');
  let eventStartsAt = $state('');
  let eventEndsAt = $state('');
  let eventGuests = $state('10');
  let eventBudget = $state('');

  const canManage = $derived(data.permissions.includes('contact.manage'));
  const statuses = Object.keys(CONTACT_STATUS_LABELS) as ContactStatus[];

  /** Expone el error de validación de un campo del último envío del formulario. */
  function fieldError(name: string): string {
    return getFieldError(form?.errors, name);
  }

  /** Agrupa los errores globales devueltos por las actions de conversión o actualización. */
  function globalErrors(): string[] {
    return getGlobalErrors(form?.errors);
  }

  /** Asigna la variante visual del badge según el ciclo de vida del mensaje. */
  function statusVariant(status: ContactStatus): 'default' | 'success' | 'warning' | 'danger' {
    if (status === 'Replied') return 'success';
    if (status === 'Closed' || status === 'Spam') return 'danger';
    if (status === 'InProgress') return 'warning';
    return 'default';
  }

  /** Conserva filtros, paginación y selección al navegar entre páginas del listado. */
  function queryUrl(page: number): string {
    const query = new URLSearchParams();
    if (data.filters.search) query.set('search', data.filters.search);
    if (data.filters.status) query.set('status', data.filters.status);
    if (data.filters.includeArchived) query.set('includeArchived', 'true');
    if (page > 1) query.set('page', String(page));
    const selected = data.selectedMessage?.id;
    if (selected) query.set('selected', selected);
    const value = query.toString();
    return value ? `?${value}` : '';
  }

  /** Añade el identificador del mensaje a la consulta actual para abrir su detalle. */
  function selectUrl(message: ContactMessage): string {
    const query = new URLSearchParams(queryUrl(data.meta.page).replace(/^\?/, ''));
    query.set('selected', message.id);
    return `?${query.toString()}`;
  }

  /** Precarga el diálogo de reserva con datos del contacto y valores por defecto operativos. */
  function startReservation(message: ContactMessage) {
    conversionMessage = message;
    reservationDate = '';
    reservationTime = '';
    reservationPhone = message.phone ?? '';
    reservationPartySize = '2';
    reservationDuration = '120';
    reservationSpaceId = '';
    reservationOpen = true;
  }

  /** Precarga el diálogo de evento reutilizando el nombre del solicitante en el título. */
  function startEvent(message: ContactMessage) {
    conversionMessage = message;
    eventType = 'Corporate';
    eventTitle = `Solicitud de ${message.name}`;
    eventStartsAt = '';
    eventEndsAt = '';
    eventGuests = '10';
    eventBudget = '';
    eventOpen = true;
  }

  /** Evita envíos duplicados mientras una action POST sigue en curso. */
  function guardSubmit(action: string, event: SubmitEvent): void {
    if (pendingAction) {
      event.preventDefault();
      return;
    }
    pendingAction = action;
  }

  $effect(() => {
    if (form?.action) pendingAction = null;
    if (form?.success) {
      reservationOpen = false;
      eventOpen = false;
    }
  });
</script>

<section class="contact-inbox" aria-labelledby="contact-inbox-title">
  <header class="page-header">
    <div>
      <p class="page-header__eyebrow">Atención comercial</p>
      <h2 class="page-header__title" id="contact-inbox-title">Bandeja de contacto</h2>
      <p class="page-header__description">
        Revisa mensajes de la sede, registra seguimiento y conviértelos en clientes, reservas o
        eventos.
      </p>
    </div>
  </header>

  {#if data.error}<Alert.Alert variant="destructive"><p>{data.error}</p></Alert.Alert>{/if}
  {#if globalErrors().length}
    <Alert.Alert variant="destructive">
      {#each globalErrors() as message (message)}<p>{message}</p>{/each}
    </Alert.Alert>
  {/if}

  <Card.Card>
    <Card.CardHeader>
      <Card.CardTitle>Mensajes recibidos</Card.CardTitle>
      <Card.CardDescription
        >La consulta está limitada a la sede configurada en el panel.</Card.CardDescription
      >
    </Card.CardHeader>
    <Card.CardContent>
      <form class="contact-inbox__filters" method="GET">
        <FormField id="contact-search" label="Buscar">
          <input
            id="contact-search"
            name="search"
            value={data.filters.search}
            maxlength={FORM_LIMITS.contact.searchMaxLength}
            placeholder="Ej. nombre, correo o mensaje"
            autocomplete="off"
          />
        </FormField>
        <FormField id="contact-status" label="Estado">
          <select id="contact-status" name="status" class="contact-inbox__select">
            <option value="">Todos los estados</option>
            {#each statuses as status (status)}<option
                value={status}
                selected={data.filters.status === status}>{contactStatusLabel(status)}</option
              >{/each}
          </select>
        </FormField>
        <label class="contact-inbox__checkbox">
          <input
            type="checkbox"
            name="includeArchived"
            value="true"
            checked={data.filters.includeArchived}
          />
          Incluir archivados
        </label>
        <Button type="submit" variant="secondary">Filtrar</Button>
      </form>

      <div class="contact-inbox__table-wrap">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>Contacto</Table.Head>
              <Table.Head>Tema</Table.Head>
              <Table.Head>Recibido</Table.Head>
              <Table.Head>Estado</Table.Head>
              <Table.Head>Acciones</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each data.messages as message (message.id)}
              <Table.Row>
                <Table.Cell>
                  <div class="contact-inbox__primary-cell">
                    <strong>{message.name}</strong>
                    <span>{message.email}{message.phone ? ` · ${message.phone}` : ''}</span>
                  </div>
                </Table.Cell>
                <Table.Cell>{CONTACT_TOPIC_LABELS[message.topic] ?? message.topic}</Table.Cell>
                <Table.Cell>{formatElSalvadorDateTime(message.receivedAt)}</Table.Cell>
                <Table.Cell>
                  <Badge.Badge variant={statusVariant(message.status)}
                    >{contactStatusLabel(message.status)}</Badge.Badge
                  >
                </Table.Cell>
                <Table.Cell>
                  <div class="contact-inbox__actions">
                    <a
                      class="contact-inbox__link"
                      href={resolve(('/contacto' + selectUrl(message)) as '/contacto')}
                      aria-label={`Ver mensaje de ${message.name}`}
                    >
                      <Eye class="size-4" aria-hidden="true" />Ver
                    </a>
                    {#if canManage && message.status === 'New'}
                      <form
                        method="POST"
                        action="?/update"
                        onsubmit={(event: SubmitEvent) => guardSubmit(`read-${message.id}`, event)}
                      >
                        <input type="hidden" name="id" value={message.id} />
                        <input type="hidden" name="status" value="InProgress" />
                        <input
                          type="hidden"
                          name="assignedToUserId"
                          value={message.assignedToUserId ?? ''}
                        />
                        <input
                          type="hidden"
                          name="archived"
                          value={String(Boolean(message.archivedAt))}
                        />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          loading={pendingAction === `read-${message.id}`}
                          aria-label="Marcar como leído"
                        >
                          <Check class="size-4" aria-hidden="true" />
                        </Button>
                      </form>
                    {/if}
                    {#if canManage && !message.archivedAt}
                      <form
                        method="POST"
                        action="?/update"
                        onsubmit={(event: SubmitEvent) =>
                          guardSubmit(`archive-${message.id}`, event)}
                      >
                        <input type="hidden" name="id" value={message.id} />
                        <input type="hidden" name="status" value={message.status} />
                        <input
                          type="hidden"
                          name="assignedToUserId"
                          value={message.assignedToUserId ?? ''}
                        />
                        <input type="hidden" name="archived" value="true" />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          loading={pendingAction === `archive-${message.id}`}
                          aria-label="Archivar mensaje"
                        >
                          <Archive class="size-4" aria-hidden="true" />
                        </Button>
                      </form>
                    {/if}
                  </div>
                </Table.Cell>
              </Table.Row>
            {:else}
              <Table.Row
                ><Table.Cell colspan={5} class="contact-inbox__empty"
                  >No hay mensajes para estos filtros.</Table.Cell
                ></Table.Row
              >
            {/each}
          </Table.Body>
        </Table.Root>
      </div>
      <nav class="contact-inbox__pagination" aria-label="Paginación de mensajes">
        <span>{data.meta.total} mensaje{data.meta.total === 1 ? '' : 's'} en total</span>
        <div class="contact-inbox__pagination-actions">
          {#if data.meta.page > 1}<a
              class="contact-inbox__page-link"
              href={resolve(('/contacto' + queryUrl(data.meta.page - 1)) as '/contacto')}
              >Anterior</a
            >{/if}
          <span>Página {data.meta.page} de {Math.max(1, data.meta.totalPages)}</span>
          {#if data.meta.page < data.meta.totalPages}<a
              class="contact-inbox__page-link"
              href={resolve(('/contacto' + queryUrl(data.meta.page + 1)) as '/contacto')}
              >Siguiente</a
            >{/if}
        </div>
      </nav>
    </Card.CardContent>
  </Card.Card>

  {#if data.selectedMessage}
    {@const message = data.selectedMessage}
    <Card.Card class="contact-inbox__detail-card">
      <Card.CardHeader>
        <div class="contact-inbox__detail-heading">
          <div>
            <Card.CardTitle>{message.name}</Card.CardTitle>
            <Card.CardDescription
              >{message.email} · {formatElSalvadorDateTime(
                message.receivedAt,
              )}</Card.CardDescription
            >
          </div>
          <Badge.Badge variant={statusVariant(message.status)}
            >{contactStatusLabel(message.status)}</Badge.Badge
          >
        </div>
      </Card.CardHeader>
      <Card.CardContent>
        <div class="contact-inbox__detail-grid">
          <div>
            <span class="contact-inbox__detail-label">Tema</span><span
              >{CONTACT_TOPIC_LABELS[message.topic] ?? message.topic}</span
            >
          </div>
          <div>
            <span class="contact-inbox__detail-label">Teléfono</span><span
              >{message.phone ?? 'No indicado'}</span
            >
          </div>
          <div>
            <span class="contact-inbox__detail-label">Asignado a</span><span
              >{message.assignedToUsername ?? 'Sin asignar'}</span
            >
          </div>
        </div>
        <p class="contact-inbox__message">{message.message}</p>

        {#if canManage}
          <div class="contact-inbox__management">
            <form
              class="contact-inbox__update-form"
              method="POST"
              action="?/update"
              onsubmit={(event: SubmitEvent) => guardSubmit('update', event)}
            >
              <input type="hidden" name="id" value={message.id} />
              <FormField id="contact-detail-status" label="Estado">
                <select id="contact-detail-status" name="status" class="contact-inbox__select">
                  {#each statuses as status (status)}<option
                      value={status}
                      selected={message.status === status}>{contactStatusLabel(status)}</option
                    >{/each}
                </select>
              </FormField>
              <FormField
                id="contact-assignee"
                label="Usuario asignado"
                helpText="Usa el UUID de un usuario activo de esta sede/negocio."
              >
                <input
                  id="contact-assignee"
                  name="assignedToUserId"
                  value={message.assignedToUserId ?? ''}
                  maxlength="36"
                  placeholder="Ej. 00000000-0000-0000-0000-000000000000"
                  autocomplete="off"
                />
              </FormField>
              <label class="contact-inbox__checkbox"
                ><input
                  type="hidden"
                  name="archived"
                  value={String(Boolean(message.archivedAt))}
                /><input
                  type="checkbox"
                  checked={Boolean(message.archivedAt)}
                  onchange={(event) =>
                    ((
                      event.currentTarget.form?.elements.namedItem('archived') as HTMLInputElement
                    ).value = String(event.currentTarget.checked))}
                /> Archivado</label
              >
              <Button type="submit" loading={pendingAction === 'update'}>Guardar cambios</Button>
            </form>
          </div>

          <div class="contact-inbox__conversion-actions">
            <form
              method="POST"
              action="?/convertCustomer"
              onsubmit={(event: SubmitEvent) => guardSubmit('convertCustomer', event)}
            >
              <input type="hidden" name="id" value={message.id} />
              <Button
                type="submit"
                variant="secondary"
                loading={pendingAction === 'convertCustomer'}
                disabled={Boolean(message.customerId)}
              >
                <UserPlus class="size-4" aria-hidden="true" />{message.customerId
                  ? 'Cliente vinculado'
                  : 'Convertir en cliente'}
              </Button>
            </form>
            <Button
              variant="secondary"
              onclick={() => startReservation(message)}
              disabled={Boolean(message.reservationId)}
            >
              <Mail class="size-4" aria-hidden="true" />{message.reservationId
                ? 'Reserva vinculada'
                : 'Convertir en reserva'}
            </Button>
            <Button
              variant="secondary"
              onclick={() => startEvent(message)}
              disabled={Boolean(message.eventId)}
            >
              <Mail class="size-4" aria-hidden="true" />{message.eventId
                ? 'Evento vinculado'
                : 'Convertir en evento'}
            </Button>
          </div>
        {/if}

        <section class="contact-inbox__audit" aria-labelledby="contact-audit-title">
          <h3 id="contact-audit-title">Auditoría</h3>
          {#if message.audit.length}
            <ul>
              {#each message.audit as audit (audit.createdAt + audit.action)}
                <li>
                  <strong>{audit.action}</strong><span
                    >{audit.actorUsername ?? 'Sistema'} · {formatElSalvadorDateTime(
                      audit.createdAt,
                    )}</span
                  >
                </li>
              {/each}
            </ul>
          {:else}<p>No hay cambios auditados todavía.</p>{/if}
        </section>
      </Card.CardContent>
    </Card.Card>
  {/if}
</section>

<Dialog.Root bind:open={reservationOpen}>
  <Dialog.Content size="md">
    <Dialog.Header
      ><Dialog.Title>Convertir en reserva</Dialog.Title><Dialog.Description
        >La reserva reutiliza el contacto y mensaje de esta solicitud.</Dialog.Description
      ></Dialog.Header
    >
    <form
      class="contact-inbox__dialog-form"
      method="POST"
      action="?/convertReservation"
      onsubmit={(event: SubmitEvent) => guardSubmit('convertReservation', event)}
    >
      <input type="hidden" name="id" value={conversionMessage?.id ?? ''} />
      <p class="form-legend">
        <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
      </p>
      <div class="contact-inbox__form-grid">
        <FormField id="contact-reservation-date" label="Fecha" required error={fieldError('date')}
          ><input
            id="contact-reservation-date"
            name="date"
            type="date"
            bind:value={reservationDate}
            required
          /></FormField
        >
        <FormField id="contact-reservation-time" label="Hora" required error={fieldError('time')}
          ><input
            id="contact-reservation-time"
            name="time"
            type="time"
            bind:value={reservationTime}
            required
            step="900"
          /></FormField
        >
        <FormField
          id="contact-reservation-phone"
          label="Teléfono"
          required
          error={fieldError('contactPhone')}
          ><input
            id="contact-reservation-phone"
            name="contactPhone"
            type="tel"
            bind:value={reservationPhone}
            inputmode="tel"
            maxlength={FORM_LIMITS.reservation.contactPhoneMaxLength}
            placeholder="Ej. +503 7000 0000"
            required
          /></FormField
        >
        <FormField
          id="contact-reservation-party"
          label="Personas"
          required
          error={fieldError('partySize')}
          ><input
            id="contact-reservation-party"
            name="partySize"
            type="number"
            bind:value={reservationPartySize}
            min={FORM_LIMITS.reservation.partySizeMin}
            max={FORM_LIMITS.reservation.partySizeMax}
            step="1"
            placeholder="Ej. 4"
            required
          /></FormField
        >
        <FormField
          id="contact-reservation-duration"
          label="Duración (minutos)"
          required
          error={fieldError('durationMinutes')}
          ><input
            id="contact-reservation-duration"
            name="durationMinutes"
            type="number"
            bind:value={reservationDuration}
            min={FORM_LIMITS.reservation.durationMinutesMin}
            max={FORM_LIMITS.reservation.durationMinutesMax}
            step="30"
            placeholder="Ej. 120"
            required
          /></FormField
        >
        <FormField
          id="contact-reservation-space"
          label="Espacio preferido"
          error={fieldError('preferredSpaceId')}
          ><input
            id="contact-reservation-space"
            name="preferredSpaceId"
            bind:value={reservationSpaceId}
            maxlength="36"
            placeholder="UUID opcional del espacio"
            autocomplete="off"
          /></FormField
        >
      </div>
      <Dialog.Footer
        ><Button type="button" variant="outline" onclick={() => (reservationOpen = false)}
          >Cancelar</Button
        ><Button type="submit" loading={pendingAction === 'convertReservation'}
          >Crear reserva</Button
        ></Dialog.Footer
      >
    </form>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={eventOpen}>
  <Dialog.Content size="lg">
    <Dialog.Header
      ><Dialog.Title>Convertir en evento</Dialog.Title><Dialog.Description
        >El mensaje se conserva como requisito especial del evento.</Dialog.Description
      ></Dialog.Header
    >
    <form
      class="contact-inbox__dialog-form"
      method="POST"
      action="?/convertEvent"
      onsubmit={(event: SubmitEvent) => guardSubmit('convertEvent', event)}
    >
      <input type="hidden" name="id" value={conversionMessage?.id ?? ''} />
      <p class="form-legend">
        <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
      </p>
      <div class="contact-inbox__form-grid">
        <FormField id="contact-event-type" label="Tipo" required error={fieldError('eventType')}
          ><select
            id="contact-event-type"
            name="eventType"
            class="contact-inbox__select"
            bind:value={eventType}
            required
            ><option value="Corporate">Corporativo</option><option value="Wedding">Boda</option
            ><option value="Birthday">Cumpleaños</option><option value="Meeting">Reunión</option
            ><option value="Anniversary">Aniversario</option><option value="Other">Otro</option
            ></select
          ></FormField
        >
        <FormField
          id="contact-event-title"
          label="Título"
          required
          error={fieldError('title')}
          maxLength={FORM_LIMITS.event.titleMaxLength}
          ><input
            id="contact-event-title"
            name="title"
            bind:value={eventTitle}
            maxlength={FORM_LIMITS.event.titleMaxLength}
            placeholder="Ej. Reunión de equipo"
            required
          /></FormField
        >
        <FormField id="contact-event-start" label="Inicio" required error={fieldError('startsAt')}
          ><input
            id="contact-event-start"
            name="startsAt"
            type="datetime-local"
            bind:value={eventStartsAt}
            placeholder="2026-10-24T18:30"
            required
            step="900"
          /></FormField
        >
        <FormField id="contact-event-end" label="Fin" required error={fieldError('endsAt')}
          ><input
            id="contact-event-end"
            name="endsAt"
            type="datetime-local"
            bind:value={eventEndsAt}
            placeholder="2026-10-24T21:30"
            required
            step="900"
          /></FormField
        >
        <FormField
          id="contact-event-guests"
          label="Invitados"
          required
          error={fieldError('estimatedGuestCount')}
          ><input
            id="contact-event-guests"
            name="estimatedGuestCount"
            type="number"
            bind:value={eventGuests}
            min={FORM_LIMITS.event.estimatedGuestCountMin}
            max={FORM_LIMITS.event.estimatedGuestCountMax}
            step="1"
            placeholder="Ej. 20"
            required
          /></FormField
        >
        <FormField
          id="contact-event-budget"
          label="Presupuesto estimado"
          error={fieldError('budgetTarget')}
          ><input
            id="contact-event-budget"
            name="budgetTarget"
            bind:value={eventBudget}
            maxlength="20"
            placeholder="Ej. 500.00"
            inputmode="decimal"
          /></FormField
        >
      </div>
      <Dialog.Footer
        ><Button type="button" variant="outline" onclick={() => (eventOpen = false)}
          >Cancelar</Button
        ><Button type="submit" loading={pendingAction === 'convertEvent'}>Crear evento</Button
        ></Dialog.Footer
      >
    </form>
  </Dialog.Content>
</Dialog.Root>

<style>
  /* La bandeja mantiene un bloque propio y usa los tokens globales del panel. */
  .contact-inbox {
    display: grid;
    gap: var(--space-lg);
  }
  .contact-inbox__filters {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: var(--space-md);
    margin-block-end: var(--space-lg);
  }
  .contact-inbox__filters :global(.form-field) {
    min-inline-size: min(100%, 14rem);
  }
  .contact-inbox__select,
  .contact-inbox__filters input,
  .contact-inbox__update-form input {
    min-block-size: 2.5rem;
    inline-size: 100%;
    padding: var(--space-sm) var(--space-md);
    color: var(--foreground);
    border: 1px solid var(--input);
    border-radius: var(--radius-md);
    background: var(--surface-panel);
  }
  .contact-inbox__checkbox {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    min-block-size: 2.5rem;
    font-size: var(--font-size-sm);
  }
  .contact-inbox__table-wrap {
    overflow-x: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }
  .contact-inbox__primary-cell {
    display: grid;
    gap: var(--space-xs);
    min-inline-size: 14rem;
  }
  .contact-inbox__primary-cell span,
  .contact-inbox__detail-label,
  .contact-inbox__audit li span {
    color: var(--text-muted);
    font-size: var(--font-size-sm);
  }
  .contact-inbox__actions,
  .contact-inbox__conversion-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
  }
  .contact-inbox__link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    color: var(--primary);
    text-decoration: none;
  }
  .contact-inbox__link:hover,
  .contact-inbox__link:focus-visible {
    text-decoration: underline;
  }
  .contact-inbox__empty {
    padding-block: var(--space-xl);
    color: var(--text-muted);
    text-align: center;
  }
  .contact-inbox__pagination {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--space-md);
    margin-block-start: var(--space-lg);
    color: var(--text-muted);
    font-size: var(--font-size-sm);
  }
  .contact-inbox__pagination-actions {
    display: flex;
    gap: var(--space-sm);
  }
  .contact-inbox__page-link {
    color: var(--primary);
  }
  .contact-inbox__detail-card {
    padding-block-end: var(--space-lg);
  }
  .contact-inbox__detail-heading {
    display: flex;
    flex-wrap: wrap;
    align-items: start;
    justify-content: space-between;
    gap: var(--space-md);
  }
  .contact-inbox__detail-grid,
  .contact-inbox__form-grid {
    display: grid;
    gap: var(--space-md);
  }
  .contact-inbox__detail-grid {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
    padding-block-end: var(--space-lg);
    border-block-end: 1px solid var(--border);
  }
  .contact-inbox__detail-grid > div {
    display: grid;
    gap: var(--space-xs);
  }
  .contact-inbox__detail-label {
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
  }
  .contact-inbox__message {
    margin-block: var(--space-lg);
    padding: var(--space-md);
    border-inline-start: 0.25rem solid var(--primary);
    background: var(--secondary);
    white-space: pre-wrap;
  }
  .contact-inbox__management,
  .contact-inbox__audit {
    margin-block-start: var(--space-lg);
    padding-block-start: var(--space-lg);
    border-block-start: 1px solid var(--border);
  }
  .contact-inbox__update-form {
    display: grid;
    gap: var(--space-md);
    align-items: end;
  }
  .contact-inbox__conversion-actions {
    margin-block-start: var(--space-lg);
  }
  .contact-inbox__audit h3 {
    margin: 0 0 var(--space-md);
  }
  .contact-inbox__audit ul {
    display: grid;
    gap: var(--space-sm);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .contact-inbox__audit li {
    display: grid;
    gap: var(--space-xs);
    padding: var(--space-sm);
    border-block-end: 1px solid var(--border);
  }
  .contact-inbox__audit p {
    margin: 0;
    color: var(--text-muted);
  }
  .contact-inbox__dialog-form {
    display: grid;
    gap: var(--space-lg);
    padding-block-start: var(--space-lg);
  }
  @media (min-width: 48rem) {
    .contact-inbox__form-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .contact-inbox__update-form {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
</style>
