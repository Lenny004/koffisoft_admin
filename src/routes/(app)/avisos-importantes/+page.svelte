<script lang="ts">
  import { Pencil, Plus, Power, Trash2 } from '@lucide/svelte';

  import { formatElSalvadorDateTime, isoToElSalvadorDateTimeLocal } from '$lib/formatting/dates';
  import type { ImportantAnnouncement } from '$lib/announcements/types';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import FormField from '$lib/components/ui/form-field.svelte';
  import * as Table from '$lib/components/ui/table/index.js';
  import { FORM_LIMITS } from '$lib/validation/limits';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();
  let open = $state(false);
  let editingId = $state<string | null>(null);
  let title = $state('');
  let message = $state('');
  let ctaLabel = $state('');
  let ctaUrl = $state('');
  let startsAt = $state('');
  let endsAt = $state('');
  let displayOrder = $state(0);
  let active = $state(true);
  let pendingAction = $state<string | null>(null);

  const canManage = $derived(data.permissions.includes('important_announcements.manage'));

  function fieldError(name: string): string {
    const errors = form?.errors;
    return errors && typeof errors === 'object' && !Array.isArray(errors)
      ? ((errors as Record<string, string>)[name] ?? '')
      : '';
  }

  function globalErrors(): string[] {
    const errors = form?.errors;
    return Array.isArray(errors) ? errors : [];
  }

  function startCreate() {
    editingId = null;
    title = '';
    message = '';
    ctaLabel = '';
    ctaUrl = '';
    startsAt = '';
    endsAt = '';
    displayOrder = data.announcements.length;
    active = true;
    open = true;
  }

  function startEdit(announcement: ImportantAnnouncement) {
    editingId = announcement.id;
    title = announcement.title;
    message = announcement.message;
    ctaLabel = announcement.ctaLabel ?? '';
    ctaUrl = announcement.ctaUrl ?? '';
    startsAt = isoToElSalvadorDateTimeLocal(announcement.startsAt);
    endsAt = isoToElSalvadorDateTimeLocal(announcement.endsAt);
    displayOrder = announcement.displayOrder;
    active = announcement.active;
    open = true;
  }

  function confirmAction(messageText: string): boolean {
    return window.confirm(messageText);
  }

  function guardSubmit(action: string, event: SubmitEvent, messageText?: string): void {
    if (pendingAction || (messageText && !confirmAction(messageText))) {
      event.preventDefault();
      return;
    }
    pendingAction = action;
  }

  $effect(() => {
    if (form?.action) pendingAction = null;
    if (form?.success) open = false;
  });
</script>

<svelte:head><title>Avisos importantes | Koffi-Soft Admin</title></svelte:head>

<section class="announcements" aria-labelledby="announcements-title">
  <header class="page-header">
    <div>
      <p class="page-header__eyebrow">Contenido público</p>
      <h2 class="page-header__title" id="announcements-title">Avisos importantes</h2>
      <p class="page-header__description">
        Publica avisos destacados en la portada y programa cuándo deben aparecer.
      </p>
    </div>
    {#if canManage}
      <Button onclick={startCreate}><Plus class="size-4" aria-hidden="true" />Nuevo aviso</Button>
    {/if}
  </header>

  {#if data.error}
    <p class="announcements__error" role="alert">{data.error}</p>
  {:else if globalErrors().length}
    <div class="announcements__error" role="alert">
      {#each globalErrors() as messageText (messageText)}<p>{messageText}</p>{/each}
    </div>
  {/if}

  <section class="announcements__card" aria-label="Tabla de avisos importantes">
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head>Aviso</Table.Head>
          <Table.Head>Vigencia</Table.Head>
          <Table.Head>Orden</Table.Head>
          <Table.Head>Estado</Table.Head>
          {#if canManage}<Table.Head>Acciones</Table.Head>{/if}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each data.announcements as announcement (announcement.id)}
          <Table.Row>
            <Table.Cell>
              <div class="announcements__name-cell">
                <strong>{announcement.title}</strong>
                <span>{announcement.message}</span>
              </div>
            </Table.Cell>
            <Table.Cell>
              <div class="announcements__date-cell">
                <span
                  >{announcement.startsAt
                    ? formatElSalvadorDateTime(announcement.startsAt)
                    : 'Desde ahora'}</span
                >
                <span
                  >{announcement.endsAt
                    ? formatElSalvadorDateTime(announcement.endsAt)
                    : 'Sin vencimiento'}</span
                >
              </div>
            </Table.Cell>
            <Table.Cell>{announcement.displayOrder}</Table.Cell>
            <Table.Cell>
              <span
                class={announcement.active
                  ? 'admin-status admin-status--success'
                  : 'admin-status admin-status--danger'}
              >
                {announcement.active ? 'Activo' : 'Inactivo'}
              </span>
            </Table.Cell>
            {#if canManage}
              <Table.Cell>
                <div class="announcements__actions">
                  <Button variant="ghost" size="sm" onclick={() => startEdit(announcement)}>
                    <Pencil class="size-4" aria-hidden="true" />Editar
                  </Button>
                  <form
                    method="POST"
                    action="?/toggle"
                    onsubmit={(event: SubmitEvent) =>
                      guardSubmit(
                        `toggle-${announcement.id}`,
                        event,
                        `${announcement.active ? '¿Desactivar' : 'Activar'} el aviso?`,
                      )}
                  >
                    <input type="hidden" name="id" value={announcement.id} />
                    <input type="hidden" name="active" value={String(!announcement.active)} />
                    <Button
                      variant="ghost"
                      size="icon"
                      loading={pendingAction === `toggle-${announcement.id}`}
                      aria-label={`${announcement.active ? 'Desactivar' : 'Activar'} aviso`}
                    >
                      <Power class="size-4" aria-hidden="true" />
                    </Button>
                  </form>
                  <form
                    method="POST"
                    action="?/delete"
                    onsubmit={(event: SubmitEvent) =>
                      guardSubmit(
                        `delete-${announcement.id}`,
                        event,
                        'El aviso se desactivará. ¿Continuar?',
                      )}
                  >
                    <input type="hidden" name="id" value={announcement.id} />
                    <Button
                      variant="ghost"
                      size="icon"
                      loading={pendingAction === `delete-${announcement.id}`}
                      aria-label="Desactivar aviso"
                    >
                      <Trash2 class="size-4 text-destructive" aria-hidden="true" />
                    </Button>
                  </form>
                </div>
              </Table.Cell>
            {/if}
          </Table.Row>
        {:else}
          <Table.Row
            ><Table.Cell colspan={canManage ? 5 : 4} class="h-24 text-center text-muted-foreground">
              No hay avisos registrados para esta sede.
            </Table.Cell></Table.Row
          >
        {/each}
      </Table.Body>
    </Table.Root>
  </section>
</section>

<Dialog.Root bind:open>
  <Dialog.Content size="lg">
    <Dialog.Header>
      <Dialog.Title>{editingId ? 'Editar aviso' : 'Nuevo aviso importante'}</Dialog.Title>
      <Dialog.Description
        >El aviso aparecerá en la landing cuando esté activo y vigente.</Dialog.Description
      >
    </Dialog.Header>
    <form
      class="announcements__form"
      method="POST"
      action="?/save"
      onsubmit={(event: SubmitEvent) => guardSubmit('save', event)}
    >
      <input type="hidden" name="id" value={editingId ?? ''} />

      <p class="form-legend">
        <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
      </p>

      <div class="announcements__form-grid">
        <FormField
          id="announcement-title"
          label="Título"
          required
          class="announcements__field"
          error={fieldError('title')}
          maxLength={FORM_LIMITS.announcement.titleMaxLength}
        >
          <input
            id="announcement-title"
            name="title"
            bind:value={title}
            maxlength={FORM_LIMITS.announcement.titleMaxLength}
            placeholder="Ej. Horario especial este fin de semana"
            required
            aria-invalid={Boolean(fieldError('title'))}
          />
        </FormField>
        <FormField
          id="announcement-order"
          label="Orden de aparición"
          class="announcements__field"
          error={fieldError('displayOrder')}
        >
          <input
            id="announcement-order"
            name="displayOrder"
            type="number"
            min="0"
            max={FORM_LIMITS.announcement.displayOrderMax}
            step="1"
            bind:value={displayOrder}
            placeholder="Ej. 0"
            inputmode="numeric"
          />
        </FormField>
        <div class="announcements__field--wide">
          <FormField
            id="announcement-message"
            label="Mensaje"
            required
            class="announcements__field"
            error={fieldError('message')}
            maxLength={FORM_LIMITS.announcement.messageMaxLength}
          >
            <textarea
              id="announcement-message"
              name="message"
              bind:value={message}
              maxlength={FORM_LIMITS.announcement.messageMaxLength}
              rows="5"
              placeholder="Ej. Este fin de semana tendremos horario especial."
              required
              aria-invalid={Boolean(fieldError('message'))}></textarea>
          </FormField>
        </div>
        <FormField
          id="announcement-cta-label"
          label="Texto del botón"
          class="announcements__field"
          error={fieldError('ctaLabel')}
          maxLength={FORM_LIMITS.announcement.ctaLabelMaxLength}
        >
          <input
            id="announcement-cta-label"
            name="ctaLabel"
            bind:value={ctaLabel}
            maxlength={FORM_LIMITS.announcement.ctaLabelMaxLength}
            placeholder="Ej. Ver reservas"
          />
        </FormField>
        <FormField
          id="announcement-cta-url"
          label="Enlace del botón"
          class="announcements__field"
          error={fieldError('ctaUrl')}
          maxLength={FORM_LIMITS.announcement.ctaUrlMaxLength}
        >
          <input
            id="announcement-cta-url"
            name="ctaUrl"
            bind:value={ctaUrl}
            type={ctaUrl.trimStart().startsWith('/') ? 'text' : 'url'}
            maxlength={FORM_LIMITS.announcement.ctaUrlMaxLength}
            placeholder="Ej. /reservas"
            inputmode="url"
          />
        </FormField>
        <FormField
          id="announcement-starts-at"
          label="Mostrar desde"
          class="announcements__field"
          error={fieldError('startsAt')}
        >
          <input
            id="announcement-starts-at"
            name="startsAt"
            type="datetime-local"
            bind:value={startsAt}
          />
        </FormField>
        <FormField
          id="announcement-ends-at"
          label="Mostrar hasta"
          class="announcements__field"
          error={fieldError('endsAt')}
        >
          <input
            id="announcement-ends-at"
            name="endsAt"
            type="datetime-local"
            bind:value={endsAt}
          />
        </FormField>
      </div>
      <label class="announcements__active-control">
        <input type="hidden" name="active" value={String(active)} />
        <input type="checkbox" bind:checked={active} /> Activo en la landing
      </label>
      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => (open = false)}>Cancelar</Button>
        <Button type="submit" loading={pendingAction === 'save'}>Guardar aviso</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

<style>
  /* Bloque administrativo del CRUD; la tabla reutiliza los componentes base del panel. */
  .announcements {
    display: grid;
    gap: var(--space-lg);
  }

  .announcements__card {
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--surface-panel);
  }

  .announcements__error {
    margin: 0;
    padding: var(--space-md);
    color: var(--status-danger);
    border: 1px solid var(--status-danger);
    border-radius: var(--radius-md);
  }

  .announcements__name-cell,
  .announcements__date-cell {
    display: grid;
    gap: var(--space-xs);
  }

  .announcements__name-cell span,
  .announcements__date-cell {
    color: var(--text-muted);
    font-size: var(--font-size-sm);
  }

  .announcements__name-cell span {
    max-inline-size: 32rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .announcements__actions {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .announcements__form {
    display: grid;
    gap: var(--space-lg);
    padding-block-start: var(--space-lg);
  }

  .announcements__form-grid {
    display: grid;
    gap: var(--space-md);
  }

  .announcements__field--wide {
    grid-column: 1 / -1;
  }

  .announcements__active-control {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }

  @media (min-width: 48rem) {
    .announcements__form-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
