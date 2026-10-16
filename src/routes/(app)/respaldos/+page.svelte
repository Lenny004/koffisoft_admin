<script lang="ts">
  import { Archive, CheckCircle2, Download, LoaderCircle, Trash2 } from '@lucide/svelte';

  import { Alert } from '$lib/components/ui/alert/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import FormField from '$lib/components/ui/form-field.svelte';
  import { Input } from '$lib/components/ui/input/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { fieldError, globalErrors } from '$lib/validation/errors';
  import type { BackupStatus, BackupType } from '$lib/backups/types';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();

  const typeLabels: Record<BackupType, string> = {
    database: 'Base de datos',
    uploads: 'Uploads / imágenes',
    full: 'Completo',
  };

  const statusLabels: Record<BackupStatus, string> = {
    pending: 'Pendiente',
    running: 'En proceso',
    succeeded: 'Disponible',
    failed: 'Fallido',
    expired: 'Expirado',
  };

  function statusVariant(
    status: BackupStatus,
  ): 'info' | 'warning' | 'success' | 'danger' | 'secondary' {
    if (status === 'succeeded') return 'success';
    if (status === 'failed') return 'danger';
    if (status === 'running') return 'warning';
    if (status === 'expired') return 'secondary';
    return 'info';
  }

  function formatDate(value: string | null): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('es-SV', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  function formatBytes(value: string | null): string {
    if (!value) return '—';
    const bytes = Number(value);
    if (!Number.isSafeInteger(bytes)) return `${value} bytes`;
    if (bytes < 1024) return `${bytes} bytes`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    for (const unit of units) {
      size /= 1024;
      if (size < 1024 || unit === 'TB') return `${size.toFixed(size >= 10 ? 0 : 1)} ${unit}`;
    }
    return `${bytes} bytes`;
  }

  function checksumLabel(checksum: string | null): string {
    return checksum ? `${checksum.slice(0, 12)}…` : '—';
  }

  function isDownloadable(status: BackupStatus, checksum: string | null): boolean {
    return (
      status === 'succeeded' && Boolean(checksum) && data.permissions.includes('backups.download')
    );
  }
</script>

<svelte:head><title>Respaldos | Koffi-Soft Admin</title></svelte:head>

<section class="backups-page" aria-labelledby="backups-title">
  <header class="page-header backups-page__header">
    <div>
      <p class="page-header__eyebrow">Continuidad operativa</p>
      <h2 class="page-header__title" id="backups-title">Respaldos</h2>
      <p class="page-header__description">
        Genera y descarga respaldos de la base de datos y de los uploads desde un almacenamiento
        protegido del VPS.
      </p>
    </div>
    <Badge variant="info"><Archive size={15} aria-hidden="true" /> Acceso restringido</Badge>
  </header>

  {#if data.error}<Alert variant="destructive" class="backups-page__alert">{data.error}</Alert>{/if}
  {#if form?.success}<Alert variant="success" class="backups-page__alert"
      >La operación fue aceptada.</Alert
    >{/if}
  {#each globalErrors(form?.errors) as error (error)}<Alert
      variant="destructive"
      class="backups-page__alert">{error}</Alert
    >{/each}

  {#if data.permissions.includes('backups.create')}
    <Card.Card>
      <Card.CardHeader>
        <Card.CardTitle>Generar un respaldo</Card.CardTitle>
        <Card.CardDescription>
          El job se ejecuta en segundo plano; revisa el estado antes de descargarlo.
        </Card.CardDescription>
      </Card.CardHeader>
      <Card.CardContent>
        <form class="backups-page__create-form" method="POST" action="?/create">
          <p class="form-legend">
            <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
          </p>
          <FormField
            id="backup-type"
            label="Tipo de respaldo"
            required
            error={fieldError(form?.errors, 'type')}
          >
            <select
              class="backups-page__select"
              id="backup-type"
              name="type"
              required
              aria-describedby="backup-type-help"
            >
              <option value="" disabled selected>Selecciona el tipo de respaldo</option>
              <option value="database">Base de datos PostgreSQL</option>
              <option value="uploads">Uploads e imágenes</option>
              <option value="full">Completo: base de datos y uploads</option>
            </select>
            <span id="backup-type-help" class="backups-page__help">
              La retención y el almacenamiento se controlan en el entorno de la API.
            </span>
          </FormField>
          <Button type="submit"
            ><CheckCircle2 size={16} aria-hidden="true" /> Iniciar respaldo</Button
          >
        </form>
      </Card.CardContent>
    </Card.Card>
  {/if}

  <Card.Card>
    <Card.CardHeader>
      <Card.CardTitle>Historial de respaldos</Card.CardTitle>
      <Card.CardDescription>Se muestran los 100 jobs más recientes.</Card.CardDescription>
    </Card.CardHeader>
    <Card.CardContent>
      {#if data.backups.length === 0}
        <div class="backups-page__empty">
          <Archive size={28} aria-hidden="true" />
          <p>No hay respaldos registrados.</p>
        </div>
      {:else}
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>Tipo</Table.Head>
              <Table.Head>Fecha</Table.Head>
              <Table.Head>Tamaño</Table.Head>
              <Table.Head>Checksum</Table.Head>
              <Table.Head>Estado</Table.Head>
              <Table.Head><span class="sr-only">Acciones</span></Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each data.backups as backup (backup.id)}
              <Table.Row>
                <Table.Cell>
                  <strong>{typeLabels[backup.type]}</strong>
                  <span class="backups-page__meta">Expira: {formatDate(backup.expiresAt)}</span>
                </Table.Cell>
                <Table.Cell>{formatDate(backup.createdAt)}</Table.Cell>
                <Table.Cell>{formatBytes(backup.sizeBytes)}</Table.Cell>
                <Table.Cell
                  ><code title={backup.checksum ?? undefined}>{checksumLabel(backup.checksum)}</code
                  ></Table.Cell
                >
                <Table.Cell>
                  <Badge variant={statusVariant(backup.status)}>
                    {#if backup.status === 'running'}<LoaderCircle
                        class="backups-page__spin"
                        size={14}
                        aria-hidden="true"
                      />{/if}
                    {statusLabels[backup.status]}
                  </Badge>
                  {#if backup.errorMessage}<span class="backups-page__error"
                      >{backup.errorMessage}</span
                    >{/if}
                </Table.Cell>
                <Table.Cell>
                  <div class="backups-page__actions">
                    {#if isDownloadable(backup.status, backup.checksum)}
                      <Button
                        href={`/respaldos/descargar?id=${encodeURIComponent(backup.id)}`}
                        variant="outline"
                        size="sm"
                      >
                        <Download size={15} aria-hidden="true" /> Descargar
                      </Button>
                    {/if}
                    {#if data.permissions.includes('backups.delete') && backup.status !== 'pending' && backup.status !== 'running' && backup.status !== 'expired'}
                      <form
                        method="POST"
                        action="?/delete"
                        onsubmit={(event) => {
                          if (
                            !confirm(
                              '¿Eliminar este respaldo? La acción conserva el registro, pero borra el archivo.',
                            )
                          )
                            event.preventDefault();
                        }}
                      >
                        <Input type="hidden" name="id" value={backup.id} />
                        <Button type="submit" variant="destructive" size="sm"
                          ><Trash2 size={15} aria-hidden="true" /> Eliminar</Button
                        >
                      </form>
                    {/if}
                  </div>
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      {/if}
    </Card.CardContent>
  </Card.Card>
</section>

<style>
  /* Bloque de respaldos: composición responsive con tokens del panel y acciones por permiso. */
  .backups-page {
    display: grid;
    gap: var(--space-lg);
  }

  .backups-page__header,
  .backups-page__alert {
    margin-block-end: 0;
  }

  .backups-page__create-form {
    display: grid;
    gap: var(--space-md);
    align-items: end;
  }

  .backups-page__select {
    inline-size: 100%;
    min-block-size: 2.5rem;
    padding: var(--space-sm) var(--space-md);
    color: var(--foreground);
    background: var(--surface-panel);
    border: 1px solid var(--input);
    border-radius: var(--radius-md);
  }

  .backups-page__help,
  .backups-page__meta,
  .backups-page__error {
    display: block;
    color: var(--text-muted);
    font-size: var(--font-size-xs);
  }

  .backups-page__meta {
    margin-block-start: var(--space-xs);
  }

  .backups-page__error {
    max-inline-size: 16rem;
    margin-block-start: var(--space-xs);
    color: var(--status-danger);
  }

  .backups-page__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .backups-page__empty {
    display: grid;
    place-items: center;
    gap: var(--space-sm);
    min-block-size: 10rem;
    color: var(--text-muted);
    text-align: center;
  }

  .backups-page__empty p {
    margin: 0;
  }

  .backups-page__spin {
    animation: backups-page-spin 1s linear infinite;
  }

  @keyframes backups-page-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (width >= 48rem) {
    .backups-page__create-form {
      grid-template-columns: minmax(16rem, 1fr) auto;
    }

    .backups-page__create-form .form-legend {
      grid-column: 1 / -1;
    }

    .backups-page__create-form .form-field {
      min-inline-size: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .backups-page__spin {
      animation: none;
    }
  }
</style>
