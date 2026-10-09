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
  import FormField from '$lib/components/ui/form-field.svelte';
  import * as Table from '$lib/components/ui/table/index.js';
  import { FORM_LIMITS, FORM_PATTERNS } from '$lib/validation/limits';
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
    form?: { errors?: Record<string, string> | string[]; values?: Record<string, string> } | null;
  }

  let { data, form }: Props = $props();

  function fieldError(name: string): string {
    return form?.errors && !Array.isArray(form.errors) ? (form.errors[name] ?? '') : '';
  }

  function globalErrors(): string[] {
    if (!form?.errors) return [];
    return Array.isArray(form.errors) ? form.errors : form.errors._form ? [form.errors._form] : [];
  }
  let products = $derived(data.products);
  let open = $state(false);
  let editingProduct = $state<MenuRow | null>(null);
  let search = $state('');
  let categoryId = $state('');
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

  $effect(() => {
    search = data.search;
    categoryId = data.categoryId;
  });

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
  {:else if globalErrors().length}
    <div class="products__error" role="alert">
      {#each globalErrors() as message (message)}<p>{message}</p>{/each}
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
      <p class="form-legend">
        <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
      </p>
      {#if editingProduct}<input type="hidden" name="id" value={editingProduct.id} />{/if}
      <div class="products__form-grid">
        <FormField
          id="product-category-form"
          label="Categoría"
          required
          class="products__field"
          error={fieldError('categoryId')}
        >
          <select
            id="product-category-form"
            name="categoryId"
            bind:value={categoryId}
            required
            aria-invalid={Boolean(fieldError('categoryId'))}
            aria-describedby={fieldError('categoryId') ? 'product-category-form-error' : undefined}
            ><option value="" disabled>Selecciona una categoría</option
            >{#each data.categories as category (category.id)}<option value={category.id}
                >{category.nameEs}</option
              >{/each}</select
          >
        </FormField>
        <FormField
          id="product-type"
          label="Tipo"
          required
          class="products__field"
          error={fieldError('itemType')}
        >
          <select
            id="product-type"
            name="itemType"
            bind:value={itemType}
            aria-invalid={Boolean(fieldError('itemType'))}
            aria-describedby={fieldError('itemType') ? 'product-type-error' : undefined}
            >{#each itemTypes as option (option[0])}<option value={option[0]}>{option[1]}</option
              >{/each}</select
          >
        </FormField>
        <FormField
          id="product-sku"
          label="SKU"
          required
          class="products__field"
          error={fieldError('sku')}
        >
          <input
            id="product-sku"
            name="sku"
            bind:value={sku}
            maxlength={FORM_LIMITS.menu.productSkuMaxLength}
            placeholder="Ej. DRINK-COFFEE-001"
            required
            aria-invalid={Boolean(fieldError('sku'))}
            aria-describedby={fieldError('sku') ? 'product-sku-error' : undefined}
          />
        </FormField>
        <FormField
          id="product-slug"
          label="Slug"
          required
          class="products__field"
          error={fieldError('slug')}
        >
          <input
            id="product-slug"
            name="slug"
            bind:value={slug}
            maxlength={FORM_LIMITS.menu.productSlugMaxLength}
            pattern={FORM_PATTERNS.slug.source}
            placeholder="Ej. latte"
            required
            aria-invalid={Boolean(fieldError('slug'))}
            aria-describedby={fieldError('slug') ? 'product-slug-error' : undefined}
          />
        </FormField>
        <FormField
          id="product-name-es"
          label="Nombre en español"
          required
          class="products__field"
          error={fieldError('nameEs')}
        >
          <input
            id="product-name-es"
            name="nameEs"
            bind:value={nameEs}
            maxlength={FORM_LIMITS.menu.productNameMaxLength}
            placeholder="Ej. Latte de la casa"
            required
            aria-invalid={Boolean(fieldError('nameEs'))}
            aria-describedby={fieldError('nameEs') ? 'product-name-es-error' : undefined}
          />
        </FormField>
        <FormField
          id="product-name-en"
          label="Nombre en inglés"
          required
          class="products__field"
          error={fieldError('nameEn')}
        >
          <input
            id="product-name-en"
            name="nameEn"
            bind:value={nameEn}
            maxlength={FORM_LIMITS.menu.productNameMaxLength}
            placeholder="Ej. House latte"
            required
            aria-invalid={Boolean(fieldError('nameEn'))}
            aria-describedby={fieldError('nameEn') ? 'product-name-en-error' : undefined}
          />
        </FormField>
      </div>
      <FormField
        id="product-description-es"
        label="Descripción en español"
        class="products__field"
        error={fieldError('descriptionEs')}
        maxLength={FORM_LIMITS.menu.productDescriptionMaxLength}
      >
        <textarea
          id="product-description-es"
          name="descriptionEs"
          bind:value={descriptionEs}
          maxlength={FORM_LIMITS.menu.productDescriptionMaxLength}
          placeholder="Ej. Espresso con leche vaporizada y espuma suave."
          aria-invalid={Boolean(fieldError('descriptionEs'))}
          aria-describedby={fieldError('descriptionEs')
            ? 'product-description-es-error'
            : undefined}></textarea>
      </FormField>
      <FormField
        id="product-description-en"
        label="Descripción en inglés"
        class="products__field"
        error={fieldError('descriptionEn')}
        maxLength={FORM_LIMITS.menu.productDescriptionMaxLength}
      >
        <textarea
          id="product-description-en"
          name="descriptionEn"
          bind:value={descriptionEn}
          maxlength={FORM_LIMITS.menu.productDescriptionMaxLength}
          placeholder="Ej. Espresso with steamed milk and soft foam."
          aria-invalid={Boolean(fieldError('descriptionEn'))}
          aria-describedby={fieldError('descriptionEn')
            ? 'product-description-en-error'
            : undefined}></textarea>
      </FormField>
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
        <FormField
          id="variant-select"
          label="Variante"
          required
          class="products__field"
          error={fieldError('variantId')}
        >
          <select id="variant-select" bind:value={selectedVariantId}
            >{#each editingProduct.variants as variant (variant.id)}<option value={variant.id}
                >{variant.nameEs} · {variant.sku}{variant.isDefault
                  ? ' · predeterminada'
                  : ''}</option
              >{/each}</select
          >
        </FormField>

        {#if canManagePrices}
          <form class="products__advanced-form" method="POST" action="?/price">
            <p class="form-legend">
              <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
            </p>
            <input type="hidden" name="variantId" value={selectedVariantId} /><input
              type="hidden"
              name="locationId"
              value={data.locationId}
            />
            <h4>Agregar precio vigente</h4>
            <div class="products__form-grid">
              <FormField
                id="price-channel"
                label="Canal"
                required
                class="products__field"
                error={fieldError('channel')}
              >
                <select id="price-channel" name="channel"
                  ><option value="Web">Web</option><option value="Pos">POS</option><option
                    value="Event">Evento</option
                  ><option value="Takeaway">Para llevar</option></select
                >
              </FormField>
              <FormField
                id="price-amount"
                label="Precio"
                required
                class="products__field"
                error={fieldError('price')}
              >
                <input
                  id="price-amount"
                  name="price"
                  type="number"
                  min="0"
                  max={FORM_LIMITS.menu.priceMax}
                  step="0.01"
                  inputmode="decimal"
                  placeholder="Ej. 8.95"
                  required
                  aria-invalid={Boolean(fieldError('price'))}
                  aria-describedby={fieldError('price') ? 'price-amount-error' : undefined}
                />
              </FormField>
              <FormField
                id="price-tax"
                label="UUID de tasa de impuesto"
                required
                class="products__field"
                error={fieldError('taxRateId')}
              >
                <input
                  id="price-tax"
                  name="taxRateId"
                  inputmode="text"
                  placeholder="UUID de la tasa"
                  required
                  aria-invalid={Boolean(fieldError('taxRateId'))}
                  aria-describedby={fieldError('taxRateId') ? 'price-tax-error' : undefined}
                />
              </FormField>
              <FormField
                id="price-from"
                label="Vigente desde"
                required
                class="products__field"
                error={fieldError('validFrom')}
              >
                <input
                  id="price-from"
                  name="validFrom"
                  type="date"
                  required
                  aria-invalid={Boolean(fieldError('validFrom'))}
                  aria-describedby={fieldError('validFrom') ? 'price-from-error' : undefined}
                />
              </FormField>
              <FormField
                id="price-to"
                label="Vigente hasta"
                class="products__field"
                error={fieldError('validTo')}
              >
                <input
                  id="price-to"
                  name="validTo"
                  type="date"
                  aria-invalid={Boolean(fieldError('validTo'))}
                  aria-describedby={fieldError('validTo') ? 'price-to-error' : undefined}
                />
              </FormField>
            </div>
            <label
              ><input type="checkbox" name="includesTax" value="true" checked /> Precio con impuesto incluido</label
            ><Button type="submit" size="sm">Agregar precio</Button>
          </form>
        {/if}

        {#if canManage && data.allergens.length > 0}
          <form class="products__advanced-form" method="POST" action="?/allergens">
            <p class="form-legend">
              <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
            </p>
            <input type="hidden" name="variantId" value={selectedVariantId} /><input
              type="hidden"
              name="allergens"
              value={allergenPayload()}
            />
            <h4>Alérgenos declarados</h4>
            <FormField
              id="product-allergens"
              label="Alérgenos declarados"
              required
              class="products__field"
              helpText="La selección reemplaza las declaraciones de la variante."
              error={fieldError('allergens')}
            >
              <select
                id="product-allergens"
                multiple
                size="5"
                onchange={updateAllergenSelection}
                aria-invalid={Boolean(fieldError('allergens'))}
                aria-describedby={fieldError('allergens') ? 'product-allergens-error' : undefined}
                >{#each data.allergens as allergen (allergen.id)}<option
                    value={allergen.id}
                    selected={selectedAllergenIds.includes(allergen.id)}
                    >{allergen.nameEs} ({allergen.code})</option
                  >{/each}</select
              >
            </FormField>
            {#each selectedAllergenIds as allergenId (allergenId)}<FormField
                class="products__allergen-presence"
                id={`presence-${allergenId}`}
                label={data.allergens.find((allergen: MenuAllergen) => allergen.id === allergenId)
                  ?.nameEs ?? allergenId}
                required
                ><select
                  id={`presence-${allergenId}`}
                  value={allergenPresence[allergenId] ?? 'contains'}
                  onchange={(event) => {
                    allergenPresence[allergenId] = (event.currentTarget as HTMLSelectElement)
                      .value as 'contains' | 'may_contain';
                  }}
                  ><option value="contains">Contiene</option><option value="may_contain"
                    >Puede contener</option
                  ></select
                ></FormField
              >
              >{/each}
            <Button type="submit" size="sm">Guardar alérgenos</Button>
          </form>
        {/if}

        {#if canManageAvailability}
          <form class="products__advanced-form" method="POST" action="?/availability">
            <p class="form-legend">
              <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
            </p>
            <input type="hidden" name="variantId" value={selectedVariantId} /><input
              type="hidden"
              name="locationId"
              value={data.locationId}
            />
            <h4>Agregar horario</h4>
            <div class="products__form-grid">
              <FormField
                id="availability-channel"
                label="Canal"
                required
                class="products__field"
                error={fieldError('channel')}
              >
                <select id="availability-channel" name="channel"
                  ><option value="Web">Web</option><option value="Pos">POS</option><option
                    value="Event">Evento</option
                  ><option value="Takeaway">Para llevar</option></select
                >
              </FormField>
              <FormField
                id="availability-day"
                label="Día"
                required
                class="products__field"
                error={fieldError('dayOfWeek')}
              >
                <select id="availability-day" name="dayOfWeek"
                  >{#each weekDays as day (day[0])}<option value={day[0]}>{day[1]}</option
                    >{/each}</select
                >
              </FormField>
              <FormField
                id="availability-start"
                label="Inicio"
                required
                class="products__field"
                error={fieldError('startsAt')}
              >
                <input
                  id="availability-start"
                  name="startsAt"
                  type="time"
                  step="60"
                  placeholder="07:30"
                  required
                  aria-invalid={Boolean(fieldError('startsAt'))}
                  aria-describedby={fieldError('startsAt') ? 'availability-start-error' : undefined}
                />
              </FormField>
              <FormField
                id="availability-end"
                label="Fin"
                required
                class="products__field"
                error={fieldError('endsAt')}
              >
                <input
                  id="availability-end"
                  name="endsAt"
                  type="time"
                  step="60"
                  placeholder="11:00"
                  required
                  aria-invalid={Boolean(fieldError('endsAt'))}
                  aria-describedby={fieldError('endsAt') ? 'availability-end-error' : undefined}
                />
              </FormField>
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
