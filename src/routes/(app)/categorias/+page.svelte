<script lang="ts">
  import {
    createColumnHelper,
    createTable,
    FlexRender,
    tableFeatures,
  } from '@tanstack/svelte-table';
  import { ArrowDown, ArrowUp, Pencil, Plus, Power, Trash2 } from '@lucide/svelte';

  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import type { CategoryRow } from '$lib/menu/types';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();
  let categories = $state<CategoryRow[]>([...data.categories]);
  let open = $state(false);
  let editingId = $state<string | null>(null);
  let slug = $state('');
  let nameEs = $state('');
  let nameEn = $state('');
  let descriptionEs = $state('');
  let descriptionEn = $state('');
  let displayOrder = $state(0);
  let active = $state(true);
  let search = $state(data.search);

  const canManage = $derived(data.permissions.includes('catalog.manage'));
  const features = tableFeatures({});
  const columnHelper = createColumnHelper<typeof features, CategoryRow>();
  const columns = columnHelper.columns([
    columnHelper.accessor('nameEs', { header: 'Categoría' }),
    columnHelper.accessor('slug', { header: 'Slug' }),
    columnHelper.accessor('itemCount', { header: 'Productos' }),
    columnHelper.accessor('active', {
      header: 'Estado',
      cell: (info) => (info.getValue() ? 'Activa' : 'Inactiva'),
    }),
  ]);

  const table = createTable({
    features,
    columns,
    get data() {
      return categories;
    },
  });

  function startCreate() {
    editingId = null;
    slug = '';
    nameEs = '';
    nameEn = '';
    descriptionEs = '';
    descriptionEn = '';
    displayOrder = categories.length;
    active = true;
    open = true;
  }

  function startEdit(category: CategoryRow) {
    editingId = category.id;
    slug = category.slug;
    nameEs = category.nameEs;
    nameEn = category.nameEn;
    descriptionEs = category.descriptionEs ?? '';
    descriptionEn = category.descriptionEn ?? '';
    displayOrder = category.displayOrder;
    active = category.active;
    open = true;
  }

  function moveCategory(index: number, offset: number) {
    const target = index + offset;
    if (target < 0 || target >= categories.length) return;
    const next = [...categories];
    [next[index], next[target]] = [next[target], next[index]];
    categories = next.map((category, currentIndex) => ({
      ...category,
      displayOrder: currentIndex,
    }));
  }

  function confirmAction(message: string): boolean {
    return window.confirm(message);
  }
</script>

<svelte:head><title>Categorías | Koffi-Soft Admin</title></svelte:head>

<section class="categories" aria-labelledby="categories-title">
  <header class="page-header">
    <div>
      <p class="page-header__eyebrow">Catálogo</p>
      <h2 class="page-header__title" id="categories-title">Categorías del menú</h2>
      <p class="page-header__description">
        Organiza las categorías que pertenecen a la sede configurada y controla su publicación.
      </p>
    </div>
    {#if canManage}
      <Button onclick={startCreate}
        ><Plus class="mr-2 size-4" aria-hidden="true" />Nueva categoría</Button
      >
    {/if}
  </header>

  <section class="categories__card" aria-label="Tabla de categorías">
    <form class="categories__toolbar" method="GET">
      <label class="categories__search-label" for="category-search">Buscar</label>
      <input
        class="categories__search"
        id="category-search"
        name="search"
        bind:value={search}
        placeholder="Nombre o slug"
      />
      <Button type="submit" variant="secondary">Buscar</Button>
    </form>

    {#if data.error}
      <p class="categories__error" role="alert">{data.error}</p>
    {:else if form?.errors?.length}
      <div class="categories__error" role="alert">
        {#each form.errors as message (message)}<p>{message}</p>{/each}
      </div>
    {/if}

    {#if canManage && categories.length > 0}
      <form class="categories__reorder" method="POST" action="?/reorder">
        <input
          type="hidden"
          name="categories"
          value={JSON.stringify(
            categories.map((category) => ({
              id: category.id,
              displayOrder: category.displayOrder,
            })),
          )}
        />
        <span>Arrastra el orden con las flechas y guárdalo cuando termines.</span>
        <Button type="submit" variant="outline" size="sm">Guardar orden</Button>
      </form>
    {/if}

    <div class="categories__table-wrap">
      <Table.Root>
        <Table.Header>
          {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
            <Table.Row>
              {#each headerGroup.headers as header (header.id)}
                <Table.Head class="categories__table-head">
                  {#if !header.isPlaceholder}<FlexRender {header} />{/if}
                </Table.Head>
              {/each}
              {#if canManage}<Table.Head class="categories__table-head">Acciones</Table.Head>{/if}
            </Table.Row>
          {/each}
        </Table.Header>
        <Table.Body>
          {#each table.getRowModel().rows as row, index (row.id)}
            <Table.Row>
              {#each row.getAllCells() as cell (cell.id)}
                <Table.Cell>
                  {#if cell.column.id === 'nameEs'}
                    <div class="categories__name-cell">
                      <strong>{row.original.nameEs}</strong>
                      <span>{row.original.nameEn}</span>
                    </div>
                  {:else if cell.column.id === 'active'}
                    <span
                      class={row.original.active
                        ? 'admin-status admin-status--success'
                        : 'admin-status admin-status--danger'}
                    >
                      <FlexRender {cell} />
                    </span>
                  {:else}
                    <FlexRender {cell} />
                  {/if}
                </Table.Cell>
              {/each}
              {#if canManage}
                <Table.Cell>
                  <div class="categories__actions">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Subir ${row.original.nameEs}`}
                      onclick={() => moveCategory(index, -1)}
                      disabled={index === 0}
                    >
                      <ArrowUp class="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Bajar ${row.original.nameEs}`}
                      onclick={() => moveCategory(index, 1)}
                      disabled={index === categories.length - 1}
                    >
                      <ArrowDown class="size-4" aria-hidden="true" />
                    </Button>
                    <Button variant="ghost" size="sm" onclick={() => startEdit(row.original)}
                      ><Pencil class="mr-2 size-4" aria-hidden="true" />Editar</Button
                    >
                    <form
                      method="POST"
                      action="?/toggle"
                      onsubmit={(event: SubmitEvent) => {
                        if (
                          !confirmAction(
                            `${row.original.active ? '¿Desactivar' : 'Activar'} la categoría ${row.original.nameEs}?`,
                          )
                        )
                          event.preventDefault();
                      }}
                    >
                      <input type="hidden" name="id" value={row.original.id} />
                      <input type="hidden" name="active" value={String(!row.original.active)} />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`${row.original.active ? 'Desactivar' : 'Activar'} ${row.original.nameEs}`}
                      >
                        <Power class="size-4" aria-hidden="true" />
                      </Button>
                    </form>
                    <form
                      method="POST"
                      action="?/delete"
                      onsubmit={(event: SubmitEvent) => {
                        if (
                          !confirmAction(
                            `La categoría ${row.original.nameEs} se desactivará. ¿Continuar?`,
                          )
                        )
                          event.preventDefault();
                      }}
                    >
                      <input type="hidden" name="id" value={row.original.id} />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Desactivar ${row.original.nameEs}`}
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
              ><Table.Cell
                colspan={canManage ? 5 : 4}
                class="h-24 text-center text-muted-foreground"
                >No hay categorías para mostrar.</Table.Cell
              ></Table.Row
            >
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  </section>
</section>

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{editingId ? 'Editar categoría' : 'Nueva categoría'}</Dialog.Title>
      <Dialog.Description
        >Los campos se validan contra el contrato administrativo del menú.</Dialog.Description
      >
    </Dialog.Header>
    <form class="categories__form" method="POST" action="?/save">
      {#if editingId}<input type="hidden" name="id" value={editingId} />{/if}
      <div class="categories__field">
        <label for="category-slug">Slug</label><input
          id="category-slug"
          name="slug"
          bind:value={slug}
          required
        />
      </div>
      <div class="categories__field">
        <label for="category-name-es">Nombre en español</label><input
          id="category-name-es"
          name="nameEs"
          bind:value={nameEs}
          required
        />
      </div>
      <div class="categories__field">
        <label for="category-name-en">Nombre en inglés</label><input
          id="category-name-en"
          name="nameEn"
          bind:value={nameEn}
          required
        />
      </div>
      <div class="categories__field">
        <label for="category-description-es">Descripción en español</label><textarea
          id="category-description-es"
          name="descriptionEs"
          bind:value={descriptionEs}></textarea>
      </div>
      <div class="categories__field">
        <label for="category-description-en">Descripción en inglés</label><textarea
          id="category-description-en"
          name="descriptionEn"
          bind:value={descriptionEn}></textarea>
      </div>
      <div class="categories__field">
        <label for="category-order">Orden</label><input
          id="category-order"
          name="displayOrder"
          type="number"
          min="0"
          bind:value={displayOrder}
        />
      </div>
      <input type="hidden" name="active" value={String(active)} />
      <label class="categories__checkbox"
        ><input type="checkbox" bind:checked={active} /> Categoría activa</label
      >
      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => (open = false)}>Cancelar</Button>
        <Button type="submit">Guardar</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
