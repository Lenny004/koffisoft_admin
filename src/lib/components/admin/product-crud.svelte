<script lang="ts">
  import {
    createColumnHelper,
    createTable,
    FlexRender,
    tableFeatures,
  } from '@tanstack/svelte-table';
  import { Pencil, Power, Plus, Trash2 } from '@lucide/svelte';

  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import type { CategoryRow, MenuAllergen, MenuPageMeta, MenuRow } from '$lib/menu/types';

  interface ProductPageData {
    products: MenuRow[];
    categories: CategoryRow[];
    allergens: MenuAllergen[];
    locationId: string;
    meta: MenuPageMeta;
    search: string;
    categoryId: string;
    permissions: string[];
    error?: string;
  }

  interface Props {
    data: ProductPageData;
    form?: { errors?: string[] } | null;
  }

  let { data, form }: Props = $props();
  let products = $derived(data.products);
  let open = $state(false);
  let editingProduct = $state<MenuRow | null>(null);
  let search = $state(data.search);
  let categoryId = $state(data.categoryId);
  let selectedVariantId = $state('');
  let sku = $state('');
  let slug = $state('');
  let itemType = $state('Food');
  let nameEs = $state('');
  let nameEn = $state('');
  let descriptionEs = $state('');
  let descriptionEn = $state('');
  let publicVisible = $state(true);
  let active = $state(true);
  let selectedAllergenIds = $state<string[]>([]);
  let allergenPresence = $state<Record<string, 'contains' | 'may_contain'>>({});

  const canManage = $derived(data.permissions.includes('catalog.manage'));
  const canManagePrices = $derived(data.permissions.includes('menu_prices.manage'));
  const canManageAvailability = $derived(data.permissions.includes('menu_availability.manage'));
  const itemTypes = [
    ['Food', 'Comida'],
    ['Beverage', 'Bebida'],
    ['Dessert', 'Postre'],
    ['Service', 'Servicio'],
  ] as const;
  const weekDays = [
    [1, 'Lunes'],
    [2, 'Martes'],
    [3, 'Miércoles'],
    [4, 'Jueves'],
    [5, 'Viernes'],
    [6, 'Sábado'],
    [7, 'Domingo'],
  ] as const;

  const features = tableFeatures({});
  const columnHelper = createColumnHelper<typeof features, MenuRow>();
  const columns = columnHelper.columns([
    columnHelper.accessor('name', { header: 'Producto' }),
    columnHelper.accessor('category', { header: 'Categoría' }),
    columnHelper.accessor('itemType', { header: 'Tipo' }),
    columnHelper.accessor('active', {
      header: 'Estado',
      cell: (info) => (info.getValue() ? 'Activo' : 'Inactivo'),
    }),
  ]);

  const table = createTable({
    features,
    columns,
    get data() {
      return products;
    },
  });

  function startCreate() {
    editingProduct = null;
    selectedVariantId = '';
    categoryId = data.categories[0]?.id ?? '';
    sku = '';
    slug = '';
    itemType = 'Food';
    nameEs = '';
    nameEn = '';
    descriptionEs = '';
    descriptionEn = '';
    publicVisible = true;
    active = true;
    open = true;
  }

  function startEdit(product: MenuRow) {
    editingProduct = product;
    selectedVariantId =
      product.variants.find((variant) => variant.isDefault)?.id ?? product.variants[0]?.id ?? '';
    categoryId = product.categoryId;
    sku = product.sku;
    slug = product.slug;
    itemType = itemTypes.some(([value]) => value.toLowerCase() === product.itemType.toLowerCase())
      ? (itemTypes.find(([value]) => value.toLowerCase() === product.itemType.toLowerCase())?.[0] ??
        'Food')
      : 'Food';
    nameEs = product.name;
    nameEn = product.nameEn;
    descriptionEs = product.descriptionEs ?? '';
    descriptionEn = product.descriptionEn ?? '';
    publicVisible = product.publicVisible;
    active = product.active;
    selectedAllergenIds = [];
    allergenPresence = {};
    open = true;
  }

  function itemTypeLabel(value: string): string {
    return itemTypes.find(([key]) => key.toLowerCase() === value.toLowerCase())?.[1] ?? value;
  }

  function updateAllergenSelection(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;
    selectedAllergenIds = Array.from(select.selectedOptions, (option) => option.value);
  }

  function allergenPayload(): string {
    return JSON.stringify(
      selectedAllergenIds.map((allergenId) => ({
        allergenId,
        presenceType: allergenPresence[allergenId] ?? 'contains',
        isReviewed: false,
      })),
    );
  }
</script>

<section class="products__card" aria-label="Tabla de productos">
  <div class="products__toolbar">
    <form class="products__filters" method="GET">
      <label class="products__filter-label" for="product-search">Buscar</label>
      <input
        class="products__search"
        id="product-search"
        name="search"
        bind:value={search}
        placeholder="SKU, nombre o slug"
      />
      <label class="products__filter-label" for="product-category">Categoría</label>
      <select
        class="products__select"
        id="product-category"
        name="categoryId"
        bind:value={categoryId}
      >
        <option value="">Todas</option>
        {#each data.categories as category (category.id)}<option value={category.id}
            >{category.nameEs}</option
          >{/each}
      </select>
      <Button type="submit" variant="secondary">Buscar</Button>
    </form>
    {#if canManage}<Button onclick={startCreate}
        ><Plus class="mr-2 size-4" aria-hidden="true" />Nuevo producto</Button
      >{/if}
  </div>

  {#if data.error}
    <p class="products__error" role="alert">{data.error}</p>
  {:else if form?.errors?.length}
    <div class="products__error" role="alert">
      {#each form.errors as message (message)}<p>{message}</p>{/each}
    </div>
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
            {#if canManage}<Table.Head class="products__table-head">Acciones</Table.Head>{/if}
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
                      <strong class="products__product-name">{row.original.name}</strong><span
                        class="products__product-slug"
                        >{row.original.slug} · {row.original.sku}</span
                      >
                    </div>
                  </div>
                {:else if cell.column.id === 'active'}
                  <span
                    class={row.original.active
                      ? 'admin-status admin-status--success'
                      : 'admin-status admin-status--danger'}><FlexRender {cell} /></span
                  >
                {:else if cell.column.id === 'itemType'}
                  {itemTypeLabel(row.original.itemType)}
                {:else}
                  <FlexRender {cell} />
                {/if}
              </Table.Cell>
            {/each}
            {#if canManage}
              <Table.Cell>
                <div class="products__actions">
                  <Button variant="ghost" size="sm" onclick={() => startEdit(row.original)}
                    ><Pencil class="mr-2 size-4" aria-hidden="true" />Editar</Button
                  >
                  <form
                    method="POST"
                    action="?/toggle"
                    onsubmit={(event: SubmitEvent) => {
                      if (
                        !window.confirm(
                          `${row.original.active ? '¿Desactivar' : 'Activar'} ${row.original.name}?`,
                        )
                      )
                        event.preventDefault();
                    }}
                  >
                    <input type="hidden" name="id" value={row.original.id} /><input
                      type="hidden"
                      name="active"
                      value={String(!row.original.active)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`${row.original.active ? 'Desactivar' : 'Activar'} ${row.original.name}`}
                      ><Power class="size-4" aria-hidden="true" /></Button
                    >
                  </form>
                  <form
                    method="POST"
                    action="?/delete"
                    onsubmit={(event: SubmitEvent) => {
                      if (
                        !window.confirm(
                          `El producto ${row.original.name} se desactivará. ¿Continuar?`,
                        )
                      )
                        event.preventDefault();
                    }}
                  >
                    <input type="hidden" name="id" value={row.original.id} />
                    <Button variant="ghost" size="icon" aria-label={`Eliminar ${row.original.name}`}
                      ><Trash2 class="size-4 text-destructive" aria-hidden="true" /></Button
                    >
                  </form>
                </div>
              </Table.Cell>
            {/if}
          </Table.Row>
        {:else}
          <Table.Row
            ><Table.Cell colspan={canManage ? 5 : 4} class="h-24 text-center text-muted-foreground"
              >No hay productos para mostrar.</Table.Cell
            ></Table.Row
          >
        {/each}
      </Table.Body>
    </Table.Root>
  </div>

  {#if data.meta.totalPages > 1}
    <nav class="products__pagination" aria-label="Paginación de productos">
      <span>Página {data.meta.page} de {data.meta.totalPages}</span>
      <div class="products__pagination-actions">
        {#if data.meta.page > 1}
          <form method="GET">
            <input type="hidden" name="search" value={search} /><input
              type="hidden"
              name="categoryId"
              value={categoryId}
            /><input type="hidden" name="page" value={data.meta.page - 1} /><Button
              class="products__page-link"
              type="submit"
              variant="outline"
              size="sm">Anterior</Button
            >
          </form>
        {/if}
        {#if data.meta.page < data.meta.totalPages}
          <form method="GET">
            <input type="hidden" name="search" value={search} /><input
              type="hidden"
              name="categoryId"
              value={categoryId}
            /><input type="hidden" name="page" value={data.meta.page + 1} /><Button
              class="products__page-link"
              type="submit"
              variant="outline"
              size="sm">Siguiente</Button
            >
          </form>
        {/if}
      </div>
    </nav>
  {/if}
</section>

<Dialog.Root bind:open>
  <Dialog.Content class="products__dialog">
    <Dialog.Header>
      <Dialog.Title>{editingProduct ? 'Editar producto' : 'Nuevo producto'}</Dialog.Title>
      <Dialog.Description
        >Los precios, alérgenos y horarios se guardan sobre una variante existente.</Dialog.Description
      >
    </Dialog.Header>
    <form class="products__form" method="POST" action="?/save">
      {#if editingProduct}<input type="hidden" name="id" value={editingProduct.id} />{/if}
      <div class="products__form-grid">
        <div class="products__field">
          <label for="product-category-form">Categoría</label><select
            id="product-category-form"
            name="categoryId"
            bind:value={categoryId}
            required
            ><option value="" disabled>Selecciona una categoría</option
            >{#each data.categories as category (category.id)}<option value={category.id}
                >{category.nameEs}</option
              >{/each}</select
          >
        </div>
        <div class="products__field">
          <label for="product-type">Tipo</label><select
            id="product-type"
            name="itemType"
            bind:value={itemType}
            >{#each itemTypes as option (option[0])}<option value={option[0]}>{option[1]}</option
              >{/each}</select
          >
        </div>
        <div class="products__field">
          <label for="product-sku">SKU</label><input
            id="product-sku"
            name="sku"
            bind:value={sku}
            required
          />
        </div>
        <div class="products__field">
          <label for="product-slug">Slug</label><input
            id="product-slug"
            name="slug"
            bind:value={slug}
            required
          />
        </div>
        <div class="products__field">
          <label for="product-name-es">Nombre en español</label><input
            id="product-name-es"
            name="nameEs"
            bind:value={nameEs}
            required
          />
        </div>
        <div class="products__field">
          <label for="product-name-en">Nombre en inglés</label><input
            id="product-name-en"
            name="nameEn"
            bind:value={nameEn}
            required
          />
        </div>
      </div>
      <div class="products__field">
        <label for="product-description-es">Descripción en español</label><textarea
          id="product-description-es"
          name="descriptionEs"
          bind:value={descriptionEs}></textarea>
      </div>
      <div class="products__field">
        <label for="product-description-en">Descripción en inglés</label><textarea
          id="product-description-en"
          name="descriptionEn"
          bind:value={descriptionEn}></textarea>
      </div>
      <input type="hidden" name="active" value={String(active)} /><input
        type="hidden"
        name="publicVisible"
        value={String(publicVisible)}
      />
      <div class="products__checkboxes">
        <label><input type="checkbox" bind:checked={active} /> Activo</label><label
          ><input type="checkbox" bind:checked={publicVisible} /> Visible en la carta web</label
        >
      </div>
      <Dialog.Footer
        ><Button type="button" variant="outline" onclick={() => (open = false)}>Cancelar</Button
        ><Button type="submit">Guardar producto</Button></Dialog.Footer
      >
    </form>

    {#if editingProduct && editingProduct.variants.length > 0}
      <section class="products__variant-panel" aria-label="Configuración de variante">
        <h3>Precios y disponibilidad</h3>
        <p class="products__helper">
          La API administra estos datos por variante. Selecciona una para habilitar las acciones.
        </p>
        <div class="products__field">
          <label for="variant-select">Variante</label><select
            id="variant-select"
            bind:value={selectedVariantId}
            >{#each editingProduct.variants as variant (variant.id)}<option value={variant.id}
                >{variant.nameEs} · {variant.sku}{variant.isDefault
                  ? ' · predeterminada'
                  : ''}</option
              >{/each}</select
          >
        </div>

        {#if canManagePrices}
          <form class="products__advanced-form" method="POST" action="?/price">
            <input type="hidden" name="variantId" value={selectedVariantId} /><input
              type="hidden"
              name="locationId"
              value={data.locationId}
            />
            <h4>Agregar precio vigente</h4>
            <div class="products__form-grid">
              <div class="products__field">
                <label for="price-channel">Canal</label><select id="price-channel" name="channel"
                  ><option value="Web">Web</option><option value="Pos">POS</option><option
                    value="Event">Evento</option
                  ><option value="Takeaway">Para llevar</option></select
                >
              </div>
              <div class="products__field">
                <label for="price-amount">Precio</label><input
                  id="price-amount"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div class="products__field">
                <label for="price-tax">UUID de tasa de impuesto</label><input
                  id="price-tax"
                  name="taxRateId"
                  required
                />
              </div>
              <div class="products__field">
                <label for="price-from">Vigente desde</label><input
                  id="price-from"
                  name="validFrom"
                  type="date"
                  required
                />
              </div>
              <div class="products__field">
                <label for="price-to">Vigente hasta</label><input
                  id="price-to"
                  name="validTo"
                  type="date"
                />
              </div>
            </div>
            <label
              ><input type="checkbox" name="includesTax" value="true" checked /> Precio con impuesto incluido</label
            ><Button type="submit" size="sm">Agregar precio</Button>
          </form>
        {/if}

        {#if canManage && data.allergens.length > 0}
          <form class="products__advanced-form" method="POST" action="?/allergens">
            <input type="hidden" name="variantId" value={selectedVariantId} /><input
              type="hidden"
              name="allergens"
              value={allergenPayload()}
            />
            <h4>Alérgenos declarados</h4>
            <label for="product-allergens"
              >Selecciona los alérgenos; la selección reemplaza las declaraciones de la variante.</label
            >
            <select id="product-allergens" multiple size="5" onchange={updateAllergenSelection}
              >{#each data.allergens as allergen (allergen.id)}<option
                  value={allergen.id}
                  selected={selectedAllergenIds.includes(allergen.id)}
                  >{allergen.nameEs} ({allergen.code})</option
                >{/each}</select
            >
            {#each selectedAllergenIds as allergenId (allergenId)}<label
                class="products__allergen-presence"
                for={`presence-${allergenId}`}
                >{data.allergens.find((allergen: MenuAllergen) => allergen.id === allergenId)
                  ?.nameEs ?? allergenId}<select
                  id={`presence-${allergenId}`}
                  value={allergenPresence[allergenId] ?? 'contains'}
                  onchange={(event) => {
                    allergenPresence[allergenId] = (event.currentTarget as HTMLSelectElement)
                      .value as 'contains' | 'may_contain';
                  }}
                  ><option value="contains">Contiene</option><option value="may_contain"
                    >Puede contener</option
                  ></select
                ></label
              >{/each}
            <Button type="submit" size="sm">Guardar alérgenos</Button>
          </form>
        {/if}

        {#if canManageAvailability}
          <form class="products__advanced-form" method="POST" action="?/availability">
            <input type="hidden" name="variantId" value={selectedVariantId} /><input
              type="hidden"
              name="locationId"
              value={data.locationId}
            />
            <h4>Agregar horario</h4>
            <div class="products__form-grid">
              <div class="products__field">
                <label for="availability-channel">Canal</label><select
                  id="availability-channel"
                  name="channel"
                  ><option value="Web">Web</option><option value="Pos">POS</option><option
                    value="Event">Evento</option
                  ><option value="Takeaway">Para llevar</option></select
                >
              </div>
              <div class="products__field">
                <label for="availability-day">Día</label><select
                  id="availability-day"
                  name="dayOfWeek"
                  >{#each weekDays as day (day[0])}<option value={day[0]}>{day[1]}</option
                    >{/each}</select
                >
              </div>
              <div class="products__field">
                <label for="availability-start">Inicio</label><input
                  id="availability-start"
                  name="startsAt"
                  type="time"
                  required
                />
              </div>
              <div class="products__field">
                <label for="availability-end">Fin</label><input
                  id="availability-end"
                  name="endsAt"
                  type="time"
                  required
                />
              </div>
            </div>
            <label
              ><input type="checkbox" name="crossesMidnight" value="true" /> Cruza medianoche</label
            ><Button type="submit" size="sm">Agregar horario</Button>
          </form>
        {/if}
      </section>
    {:else if editingProduct}
      <p class="products__helper">
        Este producto aún no tiene variantes. La API requiere una variante para administrar precios,
        alérgenos y disponibilidad.
      </p>
    {/if}
  </Dialog.Content>
</Dialog.Root>
