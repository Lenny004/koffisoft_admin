<script lang="ts">
  /**
   * Calendario editorial unificado: programación y publicación de avisos, eventos y platos
   * según permisos de lectura, gestión del recurso y `content.publish`.
   */
  import { resolve } from '$app/paths';
  import { ExternalLink, Save } from '@lucide/svelte';

  import { formatElSalvadorDateTime, isoToElSalvadorDateTimeLocal } from '$lib/formatting/dates';
  import { Alert } from '$lib/components/ui/alert/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '$lib/components/ui/card/index.js';
  import FormField from '$lib/components/ui/form-field.svelte';
  import { Input } from '$lib/components/ui/input/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import type { PublicationEntry, PublicationResourceType } from '$lib/publication/types';
  import { globalErrors as getGlobalErrors } from '$lib/validation/errors';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();
  const canPublish = $derived(data.permissions.includes('content.publish'));
  const readPermissions: Record<PublicationResourceType, string> = {
    announcement: 'important_announcements.read',
    event: 'events.read',
    menu_item: 'catalog.read',
  };
  const managePermissions: Record<PublicationResourceType, string> = {
    announcement: 'important_announcements.manage',
    event: 'events.manage',
    menu_item: 'catalog.manage',
  };

  /** Comprueba permiso de lectura del tipo de recurso antes de mostrar la fila. */
  function canRead(resourceType: PublicationEntry['resourceType']): boolean {
    return data.permissions.includes(readPermissions[resourceType]);
  }

  /** Exige publicación editorial más lectura y gestión del recurso concreto. */
  function canManage(resourceType: PublicationEntry['resourceType']): boolean {
    return (
      canPublish &&
      canRead(resourceType) &&
      data.permissions.includes(managePermissions[resourceType])
    );
  }

  /** La vista previa solo requiere poder publicar y leer el recurso, no gestionarlo. */
  function canPreview(resourceType: PublicationEntry['resourceType']): boolean {
    return canPublish && canRead(resourceType);
  }

  const canShowActions = $derived(
    data.entries.some((entry) => canManage(entry.resourceType) || canPreview(entry.resourceType)),
  );

  /** Traduce el estado de publicación de la API a etiqueta en español. */
  function statusLabel(status: string): string {
    return { Draft: 'Borrador', Scheduled: 'Programado', Published: 'Publicado' }[status] ?? status;
  }

  /** Asocia cada estado editorial con la variante visual del badge. */
  function statusVariant(status: string): 'secondary' | 'warning' | 'success' {
    if (status === 'Published') return 'success';
    if (status === 'Scheduled') return 'warning';
    return 'secondary';
  }

  /** Adapta instantes ISO al valor esperado por inputs `datetime-local` de la sede. */
  function dateValue(value: string | null): string {
    return isoToElSalvadorDateTimeLocal(value);
  }

  /** Expone errores globales devueltos por las actions `save` o `preview`. */
  function globalErrors(): string[] {
    return getGlobalErrors(form?.errors);
  }
</script>

<svelte:head>
  <title>Publicación editorial | Koffi-Soft</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <p class="text-sm font-medium text-muted-foreground">Contenido del sitio</p>
    <h1 class="text-3xl font-semibold tracking-tight">Programar publicación</h1>
    <p class="mt-2 text-muted-foreground">
      Gestiona la vigencia de avisos, eventos y platos en {data.timezone}.
    </p>
  </div>

  {#if data.error}
    <Alert variant={canPublish ? 'warning' : 'destructive'}>{data.error}</Alert>
  {/if}
  {#each globalErrors() as error (error)}
    <Alert variant="destructive">{error}</Alert>
  {/each}
  {#if form?.previewPath}
    <Alert variant="success">
      <span>Vista previa disponible por 15 minutos.</span>
      <a
        class="ml-2 underline"
        href={resolve(form.previewPath as '/')}
        target="_blank"
        rel="noreferrer"
      >
        Abrir vista previa <ExternalLink class="inline size-4" aria-hidden="true" />
      </a>
    </Alert>
  {/if}

  <Card>
    <CardHeader>
      <CardTitle>Calendario editorial</CardTitle>
      <CardDescription>
        Los cambios se aplican en la API y se auditan. La web pública usa la hora de El Salvador.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p class="mb-4 text-sm text-muted-foreground">
        <span aria-hidden="true">*</span> Campo obligatorio. La fecha programada es obligatoria al elegir
        “Programar”. La expiración es opcional.
      </p>

      {#if data.entries.length === 0}
        <p class="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No hay contenido disponible para publicar con tus permisos actuales.
        </p>
      {:else}
        <div class="overflow-x-auto">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head>Contenido</Table.Head>
                <Table.Head>Estado</Table.Head>
                <Table.Head>Vigencia actual</Table.Head>
                {#if canShowActions}<Table.Head class="min-w-[22rem]">Acciones</Table.Head>{/if}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each data.entries as entry (entry.resourceType + entry.resourceId)}
                <Table.Row>
                  <Table.Cell>
                    <div class="font-medium">{entry.title}</div>
                    <div class="text-xs text-muted-foreground">{entry.kindLabel}</div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant={statusVariant(entry.publicationStatus)}>
                      {statusLabel(entry.publicationStatus)}
                    </Badge>
                    {#if !entry.active}
                      <div class="mt-1 text-xs text-muted-foreground">Contenido inactivo</div>
                    {/if}
                  </Table.Cell>
                  <Table.Cell class="text-xs text-muted-foreground">
                    {#if entry.scheduledAt}
                      <div>Programado: {formatElSalvadorDateTime(entry.scheduledAt)}</div>
                    {:else if entry.publishedAt}
                      <div>Publicado: {formatElSalvadorDateTime(entry.publishedAt)}</div>
                    {:else}
                      <div>Sin fecha de publicación</div>
                    {/if}
                    {#if entry.expiresAt}
                      <div>Expira: {formatElSalvadorDateTime(entry.expiresAt)}</div>
                    {/if}
                  </Table.Cell>
                  {#if canManage(entry.resourceType) || canPreview(entry.resourceType)}
                    <Table.Cell>
                      {#if canManage(entry.resourceType)}
                        <form
                          class="grid gap-3 md:grid-cols-[9rem_1fr_1fr_auto]"
                          method="POST"
                          action="?/save"
                        >
                          <input type="hidden" name="resourceType" value={entry.resourceType} />
                          <input type="hidden" name="resourceId" value={entry.resourceId} />
                          <FormField
                            id={`action-${entry.resourceType}-${entry.resourceId}`}
                            label="Acción"
                            required
                          >
                            <select
                              id={`action-${entry.resourceType}-${entry.resourceId}`}
                              name="action"
                              class="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                              required
                            >
                              <option value="draft">Borrador</option>
                              <option value="schedule">Programar</option>
                              <option value="publish">Publicar ahora</option>
                              <option value="unpublish">Despublicar</option>
                            </select>
                          </FormField>
                          <FormField
                            id={`scheduledAt-${entry.resourceType}-${entry.resourceId}`}
                            label="Publicar el"
                            helpText="Hora local de El Salvador"
                          >
                            <Input
                              id={`scheduledAt-${entry.resourceType}-${entry.resourceId}`}
                              name="scheduledAt"
                              type="datetime-local"
                              placeholder="AAAA-MM-DD HH:MM"
                              value={dateValue(entry.scheduledAt)}
                            />
                          </FormField>
                          <FormField
                            id={`expiresAt-${entry.resourceType}-${entry.resourceId}`}
                            label="Expirar el"
                            helpText="Opcional; posterior a publicar"
                          >
                            <Input
                              id={`expiresAt-${entry.resourceType}-${entry.resourceId}`}
                              name="expiresAt"
                              type="datetime-local"
                              placeholder="AAAA-MM-DD HH:MM"
                              value={dateValue(entry.expiresAt)}
                            />
                          </FormField>
                          <div class="flex items-end gap-2 pb-0.5">
                            <Button type="submit" size="sm">
                              <Save class="size-4" aria-hidden="true" />
                              Guardar
                            </Button>
                          </div>
                        </form>
                      {/if}
                      {#if canPreview(entry.resourceType)}
                        <form class="mt-2" method="POST" action="?/preview">
                          <input type="hidden" name="resourceType" value={entry.resourceType} />
                          <input type="hidden" name="resourceId" value={entry.resourceId} />
                          <Button type="submit" size="sm" variant="outline">
                            <ExternalLink class="size-4" aria-hidden="true" />
                            Previsualizar
                          </Button>
                        </form>
                      {/if}
                    </Table.Cell>
                  {/if}
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        </div>
      {/if}
    </CardContent>
  </Card>
</div>
