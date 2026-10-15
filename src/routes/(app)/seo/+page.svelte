<script lang="ts">
  import { Globe2, Pencil, Plus, Save, Trash2 } from '@lucide/svelte';

  import { Button } from '$lib/components/ui/button/index.js';
  import { Alert } from '$lib/components/ui/alert/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import FormField from '$lib/components/ui/form-field.svelte';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { FORM_LIMITS } from '$lib/validation/limits';
  import { fieldError as getFieldError, globalErrors } from '$lib/validation/errors';
  import type { PageProps } from './$types';
  import type { SeoMetadata, SeoResourceType } from '$lib/seo/types';

  let { data, form }: PageProps = $props();
  const canManage = $derived(data.permissions.includes('seo.manage'));
  const error = (name: string) => getFieldError(form?.errors, name);
  const resourceLabels: Record<SeoResourceType, string> = {
    menu_item: 'Plato',
    event: 'Evento',
    announcement: 'Aviso',
    page: 'Pagina',
  };
  const defaultResourceType: SeoResourceType = 'page';
  let filterType = $state<SeoResourceType | 'all'>('all');
  const visibleSeo = $derived(
    filterType === 'all' ? data.seo : data.seo.filter((row) => row.resourceType === filterType),
  );
  let editing = $state<SeoMetadata | null>(null);
  let showForm = $state(false);

  function edit(row: SeoMetadata) {
    editing = row;
    showForm = true;
  }

  function createNew() {
    editing = null;
    showForm = true;
  }

  function closeForm() {
    showForm = false;
    editing = null;
  }
</script>

<svelte:head><title>SEO | Koffi-Soft Admin</title></svelte:head>

<section class="seo-page" aria-labelledby="seo-title">
  <header class="page-header">
    <div>
      <p class="page-header__eyebrow">Descubrimiento publico</p>
      <h2 class="page-header__title" id="seo-title">SEO editorial</h2>
      <p class="page-header__description">
        Personaliza metatitulos, descripciones, imagen OG y canonical de platos, eventos, avisos y
        paginas.
      </p>
    </div>
    {#if canManage}
      <Button type="button" onclick={createNew}
        ><Plus size={16} aria-hidden="true" /> Nuevo SEO</Button
      >
    {/if}
  </header>

  {#if data.error}<Alert variant="destructive" class="seo-page__alert">{data.error}</Alert>{/if}
  {#if globalErrors(form?.errors).length}<Alert variant="destructive" class="seo-page__alert">
      {#each globalErrors(form?.errors) as message (message)}{message}{/each}
    </Alert>{/if}
  {#if !canManage}<Alert variant="info" class="seo-page__notice">
      Tienes acceso de lectura. Las acciones de edicion estan ocultas por permisos.
    </Alert>{/if}

  <Card.Card>
    <Card.CardHeader>
      <Card.CardTitle><Globe2 size={20} aria-hidden="true" /> Overrides publicados</Card.CardTitle>
      <Card.CardDescription
        >Si no existe un override, la web usa defaults del contenido vigente.</Card.CardDescription
      >
      <label class="seo-page__filter" for="seo-filter">
        Filtrar tipo
        <select id="seo-filter" bind:value={filterType}>
          <option value="all">Todos</option>
          {#each Object.entries(resourceLabels) as [value, label] (value)}
            <option {value}>{label}</option>
          {/each}
        </select>
      </label>
    </Card.CardHeader>
    <Card.CardContent class="seo-page__table-wrap">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Tipo</Table.Head>
            <Table.Head>Clave</Table.Head>
            <Table.Head>Meta titulo</Table.Head>
            <Table.Head>Indexacion</Table.Head>
            {#if canManage}<Table.Head>Acciones</Table.Head>{/if}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each visibleSeo as row (row.id ?? `${row.resourceType}-${row.resourceKey}`)}
            <Table.Row>
              <Table.Cell
                ><Badge variant="secondary">{resourceLabels[row.resourceType]}</Badge></Table.Cell
              >
              <Table.Cell><code>{row.resourceKey}</code></Table.Cell>
              <Table.Cell>{row.metaTitle}</Table.Cell>
              <Table.Cell>
                <Badge variant={row.noindex ? 'danger' : 'outline'}
                  >{row.noindex ? 'No indexar' : 'Indexable'}</Badge
                >
              </Table.Cell>
              {#if canManage}
                <Table.Cell>
                  <div class="seo-page__actions">
                    <Button type="button" variant="outline" size="sm" onclick={() => edit(row)}>
                      <Pencil size={15} aria-hidden="true" /> Editar
                    </Button>
                    {#if row.id}
                      <form method="POST" action="?/delete">
                        <input type="hidden" name="id" value={row.id} />
                        <Button type="submit" variant="destructive" size="sm">
                          <Trash2 size={15} aria-hidden="true" /> Eliminar
                        </Button>
                      </form>
                    {/if}
                  </div>
                </Table.Cell>
              {/if}
            </Table.Row>
          {:else}
            <Table.Row
              ><Table.Cell colspan={canManage ? 5 : 4}>No hay overrides SEO guardados.</Table.Cell
              ></Table.Row
            >
          {/each}
        </Table.Body>
      </Table.Root>
    </Card.CardContent>
  </Card.Card>

  {#if showForm}
    <Card.Card class="seo-page__editor">
      <Card.CardHeader>
        <Card.CardTitle>{editing ? 'Editar SEO' : 'Nuevo metadato SEO'}</Card.CardTitle>
        <Card.CardDescription
          >Los campos obligatorios se guardan con los límites del contrato de la API.</Card.CardDescription
        >
      </Card.CardHeader>
      <Card.CardContent>
        <form id="seo-form" method="POST" action="?/save" class="seo-page__form">
          <p class="form-legend">
            <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
          </p>
          {#if editing}<input type="hidden" name="id" value={editing.id ?? ''} />{/if}
          {#if editing}
            <input type="hidden" name="resourceType" value={editing.resourceType} />
            <input type="hidden" name="resourceKey" value={editing.resourceKey} />
          {/if}
          <div class="seo-page__grid">
            <FormField
              id="seo-resource-type"
              label="Tipo de recurso"
              required
              error={error('resourceType')}
            >
              <select
                id="seo-resource-type"
                name="resourceType"
                disabled={Boolean(editing) || !canManage}
                required
              >
                {#each Object.entries(resourceLabels) as [value, label] (value)}
                  <option
                    {value}
                    selected={(editing?.resourceType ?? defaultResourceType) === value}
                    >{label}</option
                  >
                {/each}
              </select>
            </FormField>
            <FormField
              id="seo-resource-key"
              label="Clave del recurso"
              required
              error={error('resourceKey')}
              maxLength={FORM_LIMITS.seo.resourceKeyMaxLength}
            >
              <Input
                id="seo-resource-key"
                name="resourceKey"
                value={editing?.resourceKey ?? ''}
                placeholder="Ej. home, cafe-de-la-casa o UUID"
                minlength="1"
                maxlength={FORM_LIMITS.seo.resourceKeyMaxLength}
                required
                disabled={Boolean(editing) || !canManage}
              />
            </FormField>
            <FormField
              id="seo-meta-title"
              label="Meta titulo"
              required
              error={error('metaTitle')}
              maxLength={FORM_LIMITS.seo.metaTitleMaxLength}
            >
              <Input
                id="seo-meta-title"
                name="metaTitle"
                value={editing?.metaTitle ?? ''}
                placeholder="Ej. Cafe de la casa | Koffi-Soft"
                minlength="1"
                maxlength={FORM_LIMITS.seo.metaTitleMaxLength}
                required
                disabled={!canManage}
              />
            </FormField>
            <FormField
              id="seo-meta-description"
              label="Meta descripcion"
              required
              error={error('metaDescription')}
              maxLength={FORM_LIMITS.seo.metaDescriptionMaxLength}
            >
              <textarea
                id="seo-meta-description"
                name="metaDescription"
                placeholder="Ej. Descubre nuestro cafe de especialidad con vista a la montana."
                minlength="1"
                maxlength={FORM_LIMITS.seo.metaDescriptionMaxLength}
                required
                disabled={!canManage}>{editing?.metaDescription ?? ''}</textarea
              >
            </FormField>
            <FormField
              id="seo-og-image"
              label="Imagen Open Graph"
              error={error('ogImageUrl')}
              maxLength={FORM_LIMITS.seo.urlMaxLength}
              helpText="URL HTTPS de una imagen compartible."
            >
              <Input
                id="seo-og-image"
                name="ogImageUrl"
                value={editing?.ogImageUrl ?? ''}
                placeholder="Ej. https://sitio.example/imagenes/cafe.jpg"
                maxlength={FORM_LIMITS.seo.urlMaxLength}
                type="url"
                disabled={!canManage}
              />
            </FormField>
            <FormField
              id="seo-canonical"
              label="URL canonica"
              error={error('canonicalUrl')}
              maxLength={FORM_LIMITS.seo.urlMaxLength}
            >
              <Input
                id="seo-canonical"
                name="canonicalUrl"
                value={editing?.canonicalUrl ?? ''}
                placeholder="Ej. https://sitio.example/carta/cafe-de-la-casa"
                maxlength={FORM_LIMITS.seo.urlMaxLength}
                type="url"
                disabled={!canManage}
              />
            </FormField>
          </div>
          <label class="seo-page__checkbox">
            <input
              type="checkbox"
              name="noindex"
              value="true"
              checked={editing?.noindex ?? false}
              disabled={!canManage}
            />
            No indexar esta URL
          </label>
          {#if canManage}
            <div class="seo-page__form-actions">
              <Button type="button" variant="outline" onclick={closeForm}>Cancelar</Button>
              <Button type="submit" form="seo-form"
                ><Save size={16} aria-hidden="true" /> Guardar SEO</Button
              >
            </div>
          {/if}
        </form>
      </Card.CardContent>
    </Card.Card>

    <Card.Card class="seo-page__preview">
      <Card.CardHeader>
        <Card.CardTitle>Vista previa del snippet</Card.CardTitle>
        <Card.CardDescription
          >Referencia aproximada de como aparecera en buscadores.</Card.CardDescription
        >
      </Card.CardHeader>
      <Card.CardContent>
        <p class="seo-page__preview-title">{editing?.metaTitle ?? 'Meta titulo del recurso'}</p>
        <p class="seo-page__preview-url">
          {editing?.canonicalUrl ?? 'https://sitio.example/recurso'}
        </p>
        <p class="seo-page__preview-description">
          {editing?.metaDescription ?? 'Descripcion del recurso publicada para buscadores.'}
        </p>
      </Card.CardContent>
    </Card.Card>
  {/if}
</section>

<style>
  .seo-page {
    display: grid;
    gap: var(--space-lg);
  }
  .seo-page__alert,
  .seo-page__notice {
    margin: 0;
  }
  .seo-page__table-wrap {
    overflow-x: auto;
  }
  .seo-page__actions,
  .seo-page__form-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-sm);
  }
  .seo-page__editor {
    margin-block-end: var(--space-xl);
  }
  .seo-page__filter {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    color: var(--foreground);
    font-size: var(--font-size-sm);
  }
  .seo-page__filter select {
    min-block-size: 2.5rem;
    padding: var(--space-xs) var(--space-sm);
    color: var(--foreground);
    background: var(--surface-panel);
    border: 1px solid var(--input);
    border-radius: var(--radius-md);
  }
  .seo-page__form {
    display: grid;
    gap: var(--space-md);
  }
  .seo-page__grid {
    display: grid;
    gap: var(--space-md);
  }
  .seo-page__grid input,
  .seo-page__grid textarea,
  .seo-page__grid select {
    inline-size: 100%;
    min-block-size: 2.75rem;
    padding: var(--space-sm) var(--space-md);
    color: var(--foreground);
    background: var(--surface-panel);
    border: 1px solid var(--input);
    border-radius: var(--radius-md);
  }
  .seo-page__grid textarea {
    min-block-size: 7rem;
    resize: vertical;
  }
  .seo-page__checkbox {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    color: var(--foreground);
    font-size: var(--font-size-sm);
  }
  .seo-page__form-actions {
    justify-content: end;
  }
  .seo-page__preview-title {
    margin: 0;
    color: #1a0dab;
    font-size: 1.15rem;
  }
  .seo-page__preview-url {
    margin: var(--space-xs) 0;
    color: var(--status-success);
    font-size: var(--font-size-sm);
  }
  .seo-page__preview-description {
    max-inline-size: 42rem;
    margin: 0;
    color: var(--muted-foreground);
  }
  @media (min-width: 48rem) {
    .seo-page__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .seo-page__grid :global(.form-field:nth-child(4)) {
      grid-column: span 2;
    }
  }
</style>
