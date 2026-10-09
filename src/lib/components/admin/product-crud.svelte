<script lang="ts">
  import {
    createColumnHelper,
    createTable,
    FlexRender,
    tableFeatures,
  } from '@tanstack/svelte-table';
  import { Pencil, Plus, Trash2 } from '@lucide/svelte';
  import { z } from 'zod';

  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import type { ProductFixture } from '$lib/fixtures/products';

  interface Props {
    data: ProductFixture[];
    source: 'api' | 'fixture';
  }

  type Product = ProductFixture;
  const productSchema = z.object({
    name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.'),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]+$/u, 'Usa minúsculas, números y guiones en el slug.'),
  });

  let { data: initialData, source }: Props = $props();
  let data = $derived<Product[]>([...initialData]);
  let search = $state('');
  let open = $state(false);
  let editingId = $state<string | null>(null);
  let name = $state('');
  let slug = $state('');
  let errors = $state<string[]>([]);

  const features = tableFeatures({});
  const columnHelper = createColumnHelper<typeof features, Product>();
  const columns = columnHelper.columns([
    columnHelper.accessor('name', { header: 'Producto' }),
    columnHelper.accessor('category', { header: 'Categoría' }),
    columnHelper.accessor('active', {
      header: 'Estado',
      cell: (info) => (info.getValue() ? 'Activo' : 'Inactivo'),
    }),
  ]);

  const filteredData = $derived(
    data.filter((product) =>
      `${product.name} ${product.category}`.toLowerCase().includes(search.toLowerCase().trim()),
    ),
  );

  const table = createTable({
    features,
    columns,
    get data() {
      return filteredData;
    },
  });

  function startCreate() {
    editingId = null;
    name = '';
    slug = '';
    errors = [];
    open = true;
  }

  function startEdit(product: Product) {
    editingId = product.id;
    name = product.name;
    slug = product.slug;
    errors = [];
    open = true;
  }

  function removeProduct(id: string) {
    data = data.filter((product) => product.id !== id);
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const result = productSchema.safeParse({ name, slug });
    if (!result.success) {
      errors = result.error.issues.map((issue) => issue.message);
      return;
    }

    if (editingId === null) {
      data = [
        ...data,
        {
          id: `local-${Date.now()}`,
          ...result.data,
          category: 'Sin categoría',
          active: true,
          image: '/fixtures/products/coffee-special.png',
        },
      ];
    } else {
      data = data.map((product) =>
        product.id === editingId ? { ...product, ...result.data } : product,
      );
    }
    open = false;
  }
</script>

<section class="products__card" aria-label="Tabla de productos">
  <div class="products__toolbar">
    <input
      class="products__search"
      bind:value={search}
      placeholder="Buscar por producto o categoría"
      aria-label="Buscar productos"
    />
    <Button onclick={startCreate}>
      <Plus class="mr-2 size-4" aria-hidden="true" />
      Nuevo producto
    </Button>
  </div>

  {#if source === 'fixture'}
    <p class="products__notice" role="status">
      Datos de prueba: la API aún no está configurada o no hay `DEFAULT_LOCATION_ID`.
    </p>
  {/if}

  <div class="products__table-wrap">
    <Table.Root>
      <Table.Header>
        {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
          <Table.Row>
            {#each headerGroup.headers as header (header.id)}
              <Table.Head class="products__table-head"
                >{#if !header.isPlaceholder}<FlexRender {header} />{/if}</Table.Head
              >
            {/each}
            <Table.Head class="products__table-head">Acciones</Table.Head>
          </Table.Row>
        {/each}
      </Table.Header>
      <Table.Body>
        {#each table.getRowModel().rows as row (row.id)}
          <Table.Row>
            {#each row.getAllCells() as cell (cell.id)}
              <Table.Cell>
                {#if cell.column.id === 'name'}
                  <div class="products__product-cell">
                    <img class="products__image" src={row.original.image} alt="" />
                    <div>
                      <div class="products__product-name">{row.original.name}</div>
                      <div class="products__product-slug">{row.original.slug}</div>
                    </div>
                  </div>
                {:else if cell.column.id === 'active'}
                  <span
                    class={row.original.active
                      ? 'admin-status admin-status--success'
                      : 'admin-status admin-status--danger'}><FlexRender {cell} /></span
                  >
                {:else}
                  <FlexRender {cell} />
                {/if}
              </Table.Cell>
            {/each}
            <Table.Cell>
              <div class="products__actions">
                <Button variant="ghost" size="sm" onclick={() => startEdit(row.original)}
                  ><Pencil class="mr-2 size-4" aria-hidden="true" />Editar</Button
                >
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Eliminar ${row.original.name}`}
                  onclick={() => removeProduct(row.original.id)}
                  ><Trash2 class="size-4 text-destructive" aria-hidden="true" /></Button
                >
              </div>
            </Table.Cell>
          </Table.Row>
        {:else}
          <Table.Row
            ><Table.Cell colspan={4} class="h-24 text-center text-muted-foreground"
              >No hay productos.</Table.Cell
            ></Table.Row
          >
        {/each}
      </Table.Body>
    </Table.Root>
  </div>
</section>

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{editingId === null ? 'Nuevo producto' : 'Editar producto'}</Dialog.Title>
      <Dialog.Description
        >Edición local de la tabla para validar la interfaz; las mutaciones de catálogo se
        conectarán al contrato aprobado.</Dialog.Description
      >
    </Dialog.Header>
    <form class="products__form" onsubmit={handleSubmit}>
      <div class="products__field">
        <label class="products__label" for="product-name">Nombre</label><input
          class="products__input"
          id="product-name"
          bind:value={name}
          autocomplete="off"
        />
      </div>
      <div class="products__field">
        <label class="products__label" for="product-slug">Slug</label><input
          class="products__input"
          id="product-slug"
          bind:value={slug}
          autocomplete="off"
        />
      </div>
      {#if errors.length}<ul class="products__error" aria-live="polite">
          {#each errors as message (message)}<li>{message}</li>{/each}
        </ul>{/if}
      <Dialog.Footer
        ><Button type="button" variant="outline" onclick={() => (open = false)}>Cancelar</Button
        ><Button type="submit">Guardar</Button></Dialog.Footer
      >
    </form>
  </Dialog.Content>
</Dialog.Root>
