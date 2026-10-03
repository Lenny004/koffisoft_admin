<script lang="ts">
  import {
    createColumnHelper,
    createTable,
    FlexRender,
    tableFeatures,
  } from '@tanstack/svelte-table';
  import { Plus, Trash2 } from '@lucide/svelte';
  import { z } from 'zod';

  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import * as Table from '$lib/components/ui/table/index.js';

  type Product = {
    id: number;
    name: string;
    slug: string;
    active: boolean;
  };

  const productSchema = z.object({
    name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.'),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]+$/, 'Usa minúsculas, números y guiones en el slug.'),
  });

  const features = tableFeatures({});
  const columnHelper = createColumnHelper<typeof features, Product>();
  const columns = columnHelper.columns([
    columnHelper.accessor('name', {
      header: 'Nombre',
    }),
    columnHelper.accessor('slug', {
      header: 'Slug',
    }),
    columnHelper.accessor('active', {
      header: 'Estado',
      cell: (info) => (info.getValue() ? 'Activo' : 'Inactivo'),
    }),
  ]);

  let data = $state<Product[]>([
    { id: 1, name: 'Café de la casa', slug: 'cafe-de-la-casa', active: true },
    { id: 2, name: 'Té chai', slug: 'te-chai', active: true },
  ]);
  let search = $state('');
  let open = $state(false);
  let editingId = $state<number | null>(null);
  let name = $state('');
  let slug = $state('');
  let errors = $state<string[]>([]);

  const filteredData = $derived(
    data.filter((product) => product.name.toLowerCase().includes(search.toLowerCase().trim())),
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

  function removeProduct(id: number) {
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
      data = [...data, { id: Date.now(), ...result.data, active: true }];
    } else {
      data = data.map((product) =>
        product.id === editingId ? { ...product, ...result.data } : product,
      );
    }

    open = false;
  }
</script>

<section class="space-y-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <Input bind:value={search} class="sm:max-w-sm" placeholder="Filtrar por nombre..." />
    <Button onclick={startCreate}>
      <Plus class="mr-2 size-4" />
      Nuevo producto
    </Button>
  </div>

  <div class="overflow-hidden rounded-xl border border-border">
    <Table.Root>
      <Table.Header>
        {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
          <Table.Row>
            {#each headerGroup.headers as header (header.id)}
              <Table.Head>
                {#if !header.isPlaceholder}
                  <FlexRender {header} />
                {/if}
              </Table.Head>
            {/each}
            <Table.Head class="text-right">Acciones</Table.Head>
          </Table.Row>
        {/each}
      </Table.Header>
      <Table.Body>
        {#each table.getRowModel().rows as row (row.id)}
          <Table.Row>
            {#each row.getAllCells() as cell (cell.id)}
              <Table.Cell>
                <FlexRender {cell} />
              </Table.Cell>
            {/each}
            <Table.Cell class="space-x-2 text-right">
              <Button variant="ghost" size="sm" onclick={() => startEdit(row.original)}
                >Editar</Button
              >
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Eliminar ${row.original.name}`}
                onclick={() => removeProduct(row.original.id)}
              >
                <Trash2 class="size-4 text-destructive" />
              </Button>
            </Table.Cell>
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell colspan={4} class="h-24 text-center text-muted-foreground">
              No hay resultados locales.
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>
</section>

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{editingId === null ? 'Nuevo producto' : 'Editar producto'}</Dialog.Title>
      <Dialog.Description>
        Formulario local de ejemplo; todavía no guarda información en la API.
      </Dialog.Description>
    </Dialog.Header>
    <form class="space-y-4" onsubmit={handleSubmit}>
      <div class="space-y-2">
        <label class="text-sm font-medium" for="product-name">Nombre</label>
        <Input id="product-name" bind:value={name} autocomplete="off" />
      </div>
      <div class="space-y-2">
        <label class="text-sm font-medium" for="product-slug">Slug</label>
        <Input id="product-slug" bind:value={slug} autocomplete="off" />
      </div>
      {#if errors.length > 0}
        <ul class="space-y-1 text-sm text-destructive" aria-live="polite">
          {#each errors as message (message)}
            <li>{message}</li>
          {/each}
        </ul>
      {/if}
      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => (open = false)}>Cancelar</Button>
        <Button type="submit">Guardar</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
