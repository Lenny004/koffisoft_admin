<script lang="ts">
  /**
   * Consola de inventario: insumos, movimientos, recepciones y recetas con pestañas,
   * diálogos de CRUD, recepción en almacén y ajustes con control de envíos duplicados.
   */
  import { Eye, PackagePlus, Pencil, Plus, SlidersHorizontal, Trash2, X } from '@lucide/svelte';
  import { resolve } from '$app/paths';
  import { createColumnHelper, createTable, tableFeatures } from '@tanstack/svelte-table';

  import { Alert } from '$lib/components/ui/alert/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import FormField from '$lib/components/ui/form-field.svelte';
  import SearchSelect from '$lib/components/ui/search-select.svelte';
  import * as Table from '$lib/components/ui/table/index.js';
  import {
    formatElSalvadorDate,
    formatElSalvadorDateTime,
    todayInElSalvador,
  } from '$lib/formatting/dates';
  import type {
    Ingredient,
    IngredientCategory,
    InventoryAlerts,
    InventoryMovement,
    InventoryPageMeta,
    InventoryUnit,
    Recipe,
    StorageLocation,
    Supplier,
    SupplierLink,
  } from '$lib/inventory/types';
  import { FORM_LIMITS, FORM_PATTERNS } from '$lib/validation/limits';
  import {
    fieldError as getFieldError,
    globalErrors as getGlobalErrors,
  } from '$lib/validation/errors';

  interface ActionForm {
    action?: string;
    success?: boolean;
    errors?: Record<string, string> | string[];
  }

  interface Props {
    data: {
      items: Ingredient[];
      filterItems: Ingredient[];
      selectedItem: Ingredient | null;
      movements: InventoryMovement[];
      receipts: Array<{
        id: string;
        supplierName: string;
        receiptNumber: string;
        receivedAt: string;
        lineCount: number;
      }>;
      recipes: Recipe[];
      units: InventoryUnit[];
      categories: IngredientCategory[];
      storageLocations: StorageLocation[];
      suppliers: Supplier[];
      alerts: InventoryAlerts | null;
      itemMeta: InventoryPageMeta;
      movementMeta: InventoryPageMeta;
      receiptMeta: InventoryPageMeta;
      recipeMeta: InventoryPageMeta;
      filters: {
        page: number;
        search: string;
        storageLocationId: string;
        movementPage: number;
        ingredientId: string;
        movementType: string;
        dateFrom: string;
        dateTo: string;
        expiryDays: number;
      };
      locationId: string;
      permissions: string[];
      error?: string;
    };
    form?: ActionForm | null;
  }

  type ReceiptLineForm = {
    ingredientId: string;
    unitId: string;
    lotCode: string;
    receivedOn: string;
    expiresOn: string;
    quantityReceived: string;
    unitCost: string;
  };

  type SupplierLinkForm = Omit<SupplierLink, 'supplierName' | 'packUnitCode'>;

  let { data, form }: Props = $props();
  let activeTab = $state<'items' | 'movements' | 'receipts' | 'recipes'>('items');
  let itemDialogOpen = $state(false);
  let receiveDialogOpen = $state(false);
  let adjustmentDialogOpen = $state(false);
  let editingItemId = $state<string | null>(null);
  let itemCategoryId = $state('');
  let itemBaseUnitId = $state('');
  let itemSku = $state('');
  let itemName = $state('');
  let itemDescription = $state('');
  let itemReorderLevel = $state('0');
  let itemTrackLots = $state(true);
  let itemActive = $state(true);
  let itemSupplierLinks = $state<SupplierLinkForm[]>([]);
  let receiptSupplierId = $state('');
  let receiptNumber = $state('');
  let receiptReceivedAt = $state('');
  let receiptStorageLocationId = $state('');
  let receiptNotes = $state('');
  let receiptLines = $state<ReceiptLineForm[]>([]);
  let adjustmentStorageLocationId = $state('');
  let adjustmentIngredientId = $state('');
  let adjustmentLotId = $state('');
  let adjustmentType = $state<'adjustment_in' | 'adjustment_out' | 'waste'>('adjustment_in');
  let adjustmentQuantity = $state('');
  let adjustmentUnitCost = $state('0');
  let adjustmentReason = $state('');
  let adjustmentOperationId = $state('');
  let pendingAction = $state<string | null>(null);

  const canManage = $derived(data.permissions.includes('inventory.manage'));
  const canReceive = $derived(data.permissions.includes('inventory.receive'));
  const canAdjust = $derived(data.permissions.includes('inventory.adjust'));
  const canRead = $derived(data.permissions.includes('inventory.read'));
  const categoryOptions = $derived(
    data.categories.map((category) => ({ value: category.id, label: category.name })),
  );
  const unitOptions = $derived(
    data.units.map((unit) => ({ value: unit.id, label: `${unit.name} (${unit.code})` })),
  );
  const supplierOptions = $derived(
    data.suppliers.map((supplier) => ({
      value: supplier.id,
      label: `${supplier.name} (${supplier.supplierCode})`,
    })),
  );
  const ingredientOptions = $derived(
    data.filterItems.map((item) => ({ value: item.id, label: `${item.name} (${item.sku})` })),
  );
  const storageOptions = $derived(
    data.storageLocations.map((location) => ({
      value: location.id,
      label: `${location.name} (${location.code})`,
    })),
  );
  const adjustmentLotRequired = $derived(
    data.filterItems.find((item) => item.id === adjustmentIngredientId)?.trackLots === true &&
      adjustmentType !== 'adjustment_in',
  );
  const features = tableFeatures({});
  const itemColumnHelper = createColumnHelper<typeof features, Ingredient>();
  const movementColumnHelper = createColumnHelper<typeof features, InventoryMovement>();
  const itemColumns = itemColumnHelper.columns([
    itemColumnHelper.accessor('sku', { header: 'SKU' }),
    itemColumnHelper.accessor('name', { header: 'Insumo' }),
    itemColumnHelper.accessor('currentStock', { header: 'Stock actual' }),
    itemColumnHelper.accessor('reorderLevel', { header: 'Mínimo' }),
  ]);
  const movementColumns = movementColumnHelper.columns([
    movementColumnHelper.accessor('createdAt', { header: 'Fecha' }),
    movementColumnHelper.accessor('ingredientName', { header: 'Insumo' }),
    movementColumnHelper.accessor('movementType', { header: 'Tipo' }),
    movementColumnHelper.accessor('quantityDelta', { header: 'Variación' }),
  ]);
  const itemTable = createTable({
    features,
    columns: itemColumns,
    get data() {
      return data.items;
    },
  });
  const movementTable = createTable({
    features,
    columns: movementColumns,
    get data() {
      return data.movements;
    },
  });

  /** Expone el error de validación de un campo del último envío del formulario. */
  function fieldError(name: string): string {
    return getFieldError(form?.errors, name);
  }

  /** Agrupa los errores globales devueltos por las actions del módulo. */
  function globalErrors(): string[] {
    return getGlobalErrors(form?.errors);
  }

  /** Abre el diálogo de alta de insumo con categoría y unidad por defecto de la sede. */
  function startCreateItem() {
    editingItemId = null;
    itemCategoryId = data.categories[0]?.id ?? '';
    itemBaseUnitId = data.units[0]?.id ?? '';
    itemSku = '';
    itemName = '';
    itemDescription = '';
    itemReorderLevel = '0';
    itemTrackLots = true;
    itemActive = true;
    itemSupplierLinks = [];
    itemDialogOpen = true;
  }

  /** Precarga el formulario de insumo incluyendo vínculos con proveedores. */
  function startEditItem(item: Ingredient) {
    editingItemId = item.id;
    itemCategoryId = item.categoryId;
    itemBaseUnitId = item.baseUnitId;
    itemSku = item.sku;
    itemName = item.name;
    itemDescription = item.description ?? '';
    itemReorderLevel = item.reorderLevel;
    itemTrackLots = item.trackLots;
    itemActive = item.active;
    itemSupplierLinks = item.supplierLinks.map((supplierLink) => ({
      supplierId: supplierLink.supplierId,
      supplierSku: supplierLink.supplierSku,
      packQuantity: supplierLink.packQuantity,
      packUnitId: supplierLink.packUnitId,
      unitCost: supplierLink.unitCost,
      isPreferred: supplierLink.isPreferred,
    }));
    itemDialogOpen = true;
  }

  /** Inicializa el diálogo de recepción con una línea vacía y fecha operativa local. */
  function startReceive() {
    receiptSupplierId = data.suppliers[0]?.id ?? '';
    receiptNumber = '';
    receiptReceivedAt = `${todayInElSalvador()}T08:00`;
    receiptStorageLocationId = data.storageLocations[0]?.id ?? '';
    receiptNotes = '';
    receiptLines = [emptyReceiptLine()];
    receiveDialogOpen = true;
  }

  /** Construye una línea de recepción con insumo y unidad base predeterminados. */
  function emptyReceiptLine(): ReceiptLineForm {
    return {
      ingredientId: data.filterItems[0]?.id ?? '',
      unitId: data.filterItems[0]?.baseUnitId ?? '',
      lotCode: '',
      receivedOn: todayInElSalvador(),
      expiresOn: '',
      quantityReceived: '',
      unitCost: '0',
    };
  }

  /** Sincroniza la unidad de medida de la línea al cambiar el insumo seleccionado. */
  function setReceiptIngredient(line: ReceiptLineForm, ingredientId: string): void {
    line.ingredientId = ingredientId;
    line.unitId = data.filterItems.find((item) => item.id === ingredientId)?.baseUnitId ?? '';
  }

  /** Abre el diálogo de ajuste con identificador de operación único para idempotencia. */
  function startAdjustment() {
    adjustmentStorageLocationId = data.storageLocations[0]?.id ?? '';
    adjustmentIngredientId = data.filterItems[0]?.id ?? '';
    adjustmentLotId = '';
    adjustmentType = 'adjustment_in';
    adjustmentQuantity = '';
    adjustmentUnitCost = '0';
    adjustmentReason = '';
    adjustmentOperationId = globalThis.crypto.randomUUID();
    pendingAction = null;
    adjustmentDialogOpen = true;
  }

  /** Añade un vínculo proveedor-insumo respetando el límite configurado del formulario. */
  function addSupplierLink(): void {
    if (itemSupplierLinks.length >= FORM_LIMITS.inventory.supplierLinksMaxSize) return;
    itemSupplierLinks = [
      ...itemSupplierLinks,
      {
        supplierId: data.suppliers[0]?.id ?? '',
        supplierSku: null,
        packQuantity: '1',
        packUnitId: data.units[0]?.id ?? '',
        unitCost: '0',
        isPreferred: itemSupplierLinks.length === 0,
      },
    ];
  }

  /** Elimina un vínculo proveedor-insumo del borrador en edición. */
  function removeSupplierLink(index: number): void {
    itemSupplierLinks = itemSupplierLinks.filter((_, currentIndex) => currentIndex !== index);
  }

  /** Evita envíos duplicados mientras una action POST sigue en curso. */
  function guardSubmit(action: string, event: SubmitEvent): void {
    if (pendingAction) {
      event.preventDefault();
      return;
    }
    pendingAction = action;
  }

  /** Traduce tipos de movimiento de inventario a etiquetas en español. */
  function movementLabel(value: string): string {
    return (
      {
        receipt: 'Recepción',
        sale_consumption: 'Consumo por venta',
        waste: 'Merma',
        adjustment_in: 'Ajuste positivo',
        adjustment_out: 'Ajuste negativo',
      }[value] ?? value
    );
  }

  /** Conserva filtros activos al paginar insumos o movimientos según la pestaña. */
  function pageQuery(page: number, movement = false): string {
    const params = new URLSearchParams();
    if (data.filters.search) params.set('search', data.filters.search);
    if (data.filters.storageLocationId)
      params.set('storageLocationId', data.filters.storageLocationId);
    if (data.filters.ingredientId) params.set('ingredientId', data.filters.ingredientId);
    if (data.filters.movementType) params.set('movementType', data.filters.movementType);
    if (data.filters.dateFrom) params.set('dateFrom', data.filters.dateFrom);
    if (data.filters.dateTo) params.set('dateTo', data.filters.dateTo);
    if (data.filters.expiryDays !== 30) params.set('expiryDays', String(data.filters.expiryDays));
    params.set(movement ? 'movementPage' : 'page', String(page));
    return `?${params.toString()}`;
  }

  /** Formatea cantidad y unidad para celdas y resúmenes del módulo. */
  function formatQuantity(value: string, unit = ''): string {
    return `${value} ${unit}`.trim();
  }

  /** Solicita confirmación nativa antes de acciones destructivas o irreversibles. */
  function confirmAction(message: string): boolean {
    return window.confirm(message);
  }

  $effect(() => {
    if (form?.action) pendingAction = null;
    if (form?.success) {
      itemDialogOpen = false;
      receiveDialogOpen = false;
      adjustmentDialogOpen = false;
      pendingAction = null;
    }
  });
</script>

<svelte:head><title>Inventario | Koffi-Soft Admin</title></svelte:head>

<section class="inventory" aria-labelledby="inventory-title">
  <header class="page-header">
    <div>
      <p class="page-header__eyebrow">Compras y existencias</p>
      <h2 class="page-header__title" id="inventory-title">Inventario</h2>
      <p class="page-header__description">
        Consulta saldos calculados por movimientos, recepciones, lotes y alertas de la sede.
      </p>
    </div>
    <div class="inventory__header-actions">
      {#if canManage}<Button onclick={startCreateItem}
          ><Plus class="size-4" aria-hidden="true" />Nuevo insumo</Button
        >{/if}
      {#if canReceive}<Button variant="secondary" onclick={startReceive}
          ><PackagePlus class="size-4" aria-hidden="true" />Registrar recepción</Button
        >{/if}
      {#if canAdjust}<Button variant="outline" onclick={startAdjustment}
          ><SlidersHorizontal class="size-4" aria-hidden="true" />Ajuste o merma</Button
        >{/if}
    </div>
  </header>

  {#if data.error}<Alert variant="destructive"><p>{data.error}</p></Alert>{/if}
  {#if globalErrors().length}<Alert variant="destructive"
      >{#each globalErrors() as message (message)}<p>{message}</p>{/each}</Alert
    >{/if}

  {#if data.alerts}
    <div class="inventory__alerts" aria-label="Alertas de inventario">
      <Card.Card>
        <Card.CardHeader
          ><Card.CardTitle>Stock bajo</Card.CardTitle><Card.CardDescription
            >{data.alerts.lowStock.length} insumo(s) requieren revisión.</Card.CardDescription
          ></Card.CardHeader
        >
        <Card.CardContent>
          {#if data.alerts.lowStock.length}<ul class="inventory__alert-list">
              {#each data.alerts.lowStock as alert (alert.ingredientId)}<li>
                  <span>{alert.name}</span><Badge variant="warning"
                    >{formatQuantity(alert.currentStock, alert.baseUnitCode)} / mín. {alert.reorderLevel}</Badge
                  >
                </li>{/each}
            </ul>{:else}<p class="inventory__empty">No hay alertas de stock bajo.</p>{/if}
        </Card.CardContent>
      </Card.Card>
      <Card.Card>
        <Card.CardHeader
          ><Card.CardTitle>Próximos vencimientos</Card.CardTitle><Card.CardDescription
            >Ventana de {data.filters.expiryDays} días.</Card.CardDescription
          ></Card.CardHeader
        >
        <Card.CardContent>
          {#if data.alerts.expiringLots.length}<ul class="inventory__alert-list">
              {#each data.alerts.expiringLots as alert (alert.inventoryLotId)}<li>
                  <span>{alert.ingredientName} · lote {alert.lotCode}</span><Badge variant="danger"
                    >{formatElSalvadorDate(alert.expiresOn)}</Badge
                  >
                </li>{/each}
            </ul>{:else}<p class="inventory__empty">No hay lotes próximos a vencer.</p>{/if}
        </Card.CardContent>
      </Card.Card>
    </div>
  {/if}

  <Card.Card>
    <Card.CardHeader>
      <div class="inventory__card-heading">
        <div>
          <Card.CardTitle>Control de inventario</Card.CardTitle><Card.CardDescription
            >Los filtros se aplican en el servidor y conservan la paginación.</Card.CardDescription
          >
        </div>
        <Badge variant={canRead ? 'success' : 'secondary'}
          >{canRead ? 'API conectada' : 'Sin permiso de lectura'}</Badge
        >
      </div>
      <nav class="inventory__tabs" aria-label="Secciones de inventario">
        <button
          class:inventory__tab--active={activeTab === 'items'}
          class="inventory__tab"
          type="button"
          onclick={() => (activeTab = 'items')}>Existencias</button
        >
        <button
          class:inventory__tab--active={activeTab === 'movements'}
          class="inventory__tab"
          type="button"
          onclick={() => (activeTab = 'movements')}>Movimientos</button
        >
        <button
          class:inventory__tab--active={activeTab === 'receipts'}
          class="inventory__tab"
          type="button"
          onclick={() => (activeTab = 'receipts')}>Recepciones</button
        >
        <button
          class:inventory__tab--active={activeTab === 'recipes'}
          class="inventory__tab"
          type="button"
          onclick={() => (activeTab = 'recipes')}>Recetas</button
        >
      </nav>
    </Card.CardHeader>
    <Card.CardContent>
      {#if activeTab === 'items'}
        <form class="inventory__toolbar" method="GET">
          <FormField id="inventory-search" label="Buscar insumo"
            ><input
              id="inventory-search"
              name="search"
              value={data.filters.search}
              maxlength={FORM_LIMITS.inventory.searchMaxLength}
              placeholder="Ej. café, leche o SKU"
              autocomplete="off"
            /></FormField
          >
          <FormField id="inventory-storage-filter" label="Bodega"
            ><SearchSelect
              id="inventory-storage-filter"
              name="storageLocationId"
              value={data.filters.storageLocationId}
              options={storageOptions}
              placeholder="Todas las bodegas"
              emptyLabel="Todas las bodegas"
            /></FormField
          >
          <Button type="submit" variant="secondary">Buscar</Button>
        </form>
        <div class="inventory__table-wrap">
          <Table.Root
            ><Table.Header
              >{#each itemTable.getHeaderGroups() as group (group.id)}<Table.Row
                  >{#each group.headers as header (header.id)}<Table.Head
                      class="inventory__table-head"
                      >{header.column.columnDef.header as string}</Table.Head
                    >{/each}<Table.Head class="inventory__table-head">Acciones</Table.Head
                  ></Table.Row
                >{/each}</Table.Header
            ><Table.Body
              >{#each itemTable.getRowModel().rows as row (row.id)}<Table.Row
                  ><Table.Cell><strong>{row.original.sku}</strong></Table.Cell><Table.Cell
                    ><div class="inventory__primary-cell">
                      <strong>{row.original.name}</strong><span
                        >{row.original.categoryName} · {row.original.baseUnitName}</span
                      >
                    </div></Table.Cell
                  ><Table.Cell
                    ><span
                      >{formatQuantity(row.original.currentStock, row.original.baseUnitCode)}</span
                    >{#if row.original.lowStock}<Badge variant="warning">Stock bajo</Badge
                      >{/if}</Table.Cell
                  ><Table.Cell
                    >{formatQuantity(
                      row.original.reorderLevel,
                      row.original.baseUnitCode,
                    )}</Table.Cell
                  ><Table.Cell
                    ><div class="inventory__actions">
                      <a
                        class="inventory__link"
                        href={resolve(
                          `/inventario?selected=${row.original.id}&ingredientId=${row.original.id}` as '/inventario',
                        )}><Eye class="size-4" aria-hidden="true" />Historial</a
                      >{#if canManage}<Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar ${row.original.name}`}
                          onclick={() => startEditItem(row.original)}
                          ><Pencil class="size-4" aria-hidden="true" /></Button
                        >{#if row.original.active}<form
                            method="POST"
                            action="?/deleteItem"
                            onsubmit={(event: SubmitEvent) => {
                              if (
                                !confirmAction(
                                  `El insumo ${row.original.name} se desactivará. ¿Continuar?`,
                                )
                              )
                                event.preventDefault();
                            }}
                          >
                            <input type="hidden" name="id" value={row.original.id} /><input
                              type="hidden"
                              name="locationId"
                              value={data.locationId}
                            /><Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Desactivar ${row.original.name}`}
                              ><Trash2 class="size-4 text-destructive" aria-hidden="true" /></Button
                            >
                          </form>{/if}{/if}
                    </div></Table.Cell
                  ></Table.Row
                >{:else}<Table.Row
                  ><Table.Cell colspan={5} class="inventory__empty"
                    >No hay insumos para mostrar.</Table.Cell
                  ></Table.Row
                >{/each}</Table.Body
            ></Table.Root
          >
        </div>
        {@render Pagination(data.itemMeta, (page: number) => pageQuery(page), 'insumos')}
        {#if data.selectedItem}<section
            class="inventory__detail"
            aria-labelledby="inventory-detail-title"
          >
            <div class="inventory__detail-heading">
              <div>
                <h3 id="inventory-detail-title">Detalle: {data.selectedItem.name}</h3>
                <p>{data.selectedItem.sku} · {data.selectedItem.categoryName}</p>
              </div>
              <a class="inventory__link" href={resolve('/inventario')}
                ><X class="size-4" aria-hidden="true" />Cerrar</a
              >
            </div>
            <div class="inventory__detail-grid">
              <div>
                <span>Stock actual</span><strong
                  >{formatQuantity(
                    data.selectedItem.currentStock,
                    data.selectedItem.baseUnitCode,
                  )}</strong
                >
              </div>
              <div>
                <span>Stock mínimo</span><strong
                  >{formatQuantity(
                    data.selectedItem.reorderLevel,
                    data.selectedItem.baseUnitCode,
                  )}</strong
                >
              </div>
              <div><span>Unidad base</span><strong>{data.selectedItem.baseUnitName}</strong></div>
              <div>
                <span>Lotes</span><strong
                  >{data.selectedItem.trackLots ? 'Controlados' : 'No controlados'}</strong
                >
              </div>
            </div>
            <div class="inventory__detail-history">
              <h4>Historial de movimientos</h4>
              <div class="inventory__table-wrap">
                <Table.Root>
                  <Table.Header
                    ><Table.Row
                      ><Table.Head class="inventory__table-head">Fecha</Table.Head><Table.Head
                        class="inventory__table-head">Tipo</Table.Head
                      ><Table.Head class="inventory__table-head">Variación</Table.Head><Table.Head
                        class="inventory__table-head">Motivo</Table.Head
                      ></Table.Row
                    ></Table.Header
                  >
                  <Table.Body>
                    {#each data.movements as movement (movement.id)}
                      <Table.Row
                        ><Table.Cell>{formatElSalvadorDateTime(movement.createdAt)}</Table.Cell
                        ><Table.Cell>{movementLabel(movement.movementType)}</Table.Cell><Table.Cell
                          >{movement.quantityDelta} {data.selectedItem.baseUnitCode}</Table.Cell
                        ><Table.Cell>{movement.reason ?? '—'}</Table.Cell></Table.Row
                      >
                    {:else}
                      <Table.Row
                        ><Table.Cell colspan={4} class="inventory__empty"
                          >No hay movimientos para este insumo.</Table.Cell
                        ></Table.Row
                      >
                    {/each}
                  </Table.Body>
                </Table.Root>
              </div>
              {@render Pagination(
                data.movementMeta,
                (page: number) => pageQuery(page, true),
                'movimientos',
              )}
            </div>
          </section>{/if}
      {:else if activeTab === 'movements'}
        <form class="inventory__toolbar inventory__toolbar--wide" method="GET">
          <input type="hidden" name="movementPage" value="1" /><FormField
            id="movement-ingredient-filter"
            label="Insumo"
            ><SearchSelect
              id="movement-ingredient-filter"
              name="ingredientId"
              value={data.filters.ingredientId}
              options={ingredientOptions}
              placeholder="Todos los insumos"
              emptyLabel="Todos los insumos"
            /></FormField
          ><FormField id="movement-type-filter" label="Tipo"
            ><select id="movement-type-filter" name="movementType" value={data.filters.movementType}
              ><option value="">Todos los tipos</option><option value="receipt">Recepciones</option
              ><option value="adjustment_in">Ajustes positivos</option><option
                value="adjustment_out">Ajustes negativos</option
              ><option value="waste">Mermas</option><option value="sale_consumption"
                >Consumos</option
              ></select
            ></FormField
          ><FormField id="movement-from-filter" label="Desde"
            ><input
              id="movement-from-filter"
              type="date"
              name="dateFrom"
              value={data.filters.dateFrom}
              placeholder="AAAA-MM-DD"
            /></FormField
          ><FormField id="movement-to-filter" label="Hasta"
            ><input
              id="movement-to-filter"
              type="date"
              name="dateTo"
              value={data.filters.dateTo}
              placeholder="AAAA-MM-DD"
            /></FormField
          ><Button type="submit" variant="secondary">Filtrar historial</Button>
        </form>
        <div class="inventory__table-wrap">
          <Table.Root
            ><Table.Header
              >{#each movementTable.getHeaderGroups() as group (group.id)}<Table.Row
                  >{#each group.headers as header (header.id)}<Table.Head
                      class="inventory__table-head"
                      >{header.column.columnDef.header as string}</Table.Head
                    >{/each}<Table.Head class="inventory__table-head">Motivo</Table.Head></Table.Row
                >{/each}</Table.Header
            ><Table.Body
              >{#each movementTable.getRowModel().rows as row (row.id)}<Table.Row
                  ><Table.Cell>{formatElSalvadorDateTime(row.original.createdAt)}</Table.Cell
                  ><Table.Cell
                    ><div class="inventory__primary-cell">
                      <strong>{row.original.ingredientName}</strong><span
                        >{row.original.storageLocationCode}{#if row.original.lotCode}
                          · lote {row.original.lotCode}{/if}</span
                      >
                    </div></Table.Cell
                  ><Table.Cell
                    ><Badge
                      variant={row.original.movementType === 'waste' ||
                      row.original.movementType === 'adjustment_out'
                        ? 'danger'
                        : 'info'}>{movementLabel(row.original.movementType)}</Badge
                    ></Table.Cell
                  ><Table.Cell>{row.original.quantityDelta}</Table.Cell><Table.Cell
                    >{row.original.reason ?? '—'}</Table.Cell
                  ></Table.Row
                >{:else}<Table.Row
                  ><Table.Cell colspan={5} class="inventory__empty"
                    >No hay movimientos para mostrar.</Table.Cell
                  ></Table.Row
                >{/each}</Table.Body
            ></Table.Root
          >
        </div>
        {@render Pagination(
          data.movementMeta,
          (page: number) => pageQuery(page, true),
          'movimientos',
        )}
      {:else if activeTab === 'receipts'}
        <div class="inventory__table-wrap">
          <Table.Root
            ><Table.Header
              ><Table.Row
                ><Table.Head class="inventory__table-head">Número</Table.Head><Table.Head
                  class="inventory__table-head">Proveedor</Table.Head
                ><Table.Head class="inventory__table-head">Recibida</Table.Head><Table.Head
                  class="inventory__table-head">Líneas</Table.Head
                ></Table.Row
              ></Table.Header
            ><Table.Body
              >{#each data.receipts as receipt (receipt.id)}<Table.Row
                  ><Table.Cell><strong>{receipt.receiptNumber}</strong></Table.Cell><Table.Cell
                    >{receipt.supplierName}</Table.Cell
                  ><Table.Cell>{formatElSalvadorDateTime(receipt.receivedAt)}</Table.Cell
                  ><Table.Cell>{receipt.lineCount}</Table.Cell></Table.Row
                >{:else}<Table.Row
                  ><Table.Cell colspan={4} class="inventory__empty"
                    >No hay recepciones para mostrar.</Table.Cell
                  ></Table.Row
                >{/each}</Table.Body
            ></Table.Root
          >
        </div>
      {:else}
        {#if data.recipes.length}<div class="inventory__recipe-list">
            {#each data.recipes as recipe (recipe.id)}<details class="inventory__recipe">
                <summary
                  ><span><strong>{recipe.menuItemName}</strong> · {recipe.variantName}</span><Badge
                    variant={recipe.active ? 'success' : 'secondary'}>v{recipe.versionNo}</Badge
                  ></summary
                >
                <p>
                  Rinde {recipe.yieldQuantity}
                  {recipe.yieldUnitCode} desde {formatElSalvadorDate(recipe.effectiveFrom)}.
                </p>
                <ul>
                  {#each recipe.lines as line (line.id)}<li>
                      {line.ingredientName}: {line.quantity}
                      {line.unitCode}
                    </li>{/each}
                </ul>
              </details>{/each}
          </div>{:else}<p class="inventory__empty">
            La API no devolvió recetas para esta sede.
          </p>{/if}
      {/if}
    </Card.CardContent>
  </Card.Card>
</section>

<Dialog.Root bind:open={itemDialogOpen}
  ><Dialog.Content size="lg"
    ><Dialog.Header
      ><Dialog.Title>{editingItemId ? 'Editar insumo' : 'Nuevo insumo'}</Dialog.Title
      ><Dialog.Description
        >El stock se modifica únicamente por recepciones, ajustes o mermas.</Dialog.Description
      ></Dialog.Header
    >
    <form
      class="inventory__form"
      method="POST"
      action="?/saveItem"
      onsubmit={(event: SubmitEvent) => guardSubmit('saveItem', event)}
    >
      <input type="hidden" name="id" value={editingItemId ?? ''} /><input
        type="hidden"
        name="locationId"
        value={data.locationId}
      /><input
        type="hidden"
        name="supplierLinks"
        value={JSON.stringify(itemSupplierLinks)}
      /><Dialog.Body
        ><p class="form-legend">
          <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
        </p>
        <div class="inventory__form-grid">
          <FormField
            id="item-sku"
            label="SKU"
            required
            error={fieldError('sku')}
            maxLength={FORM_LIMITS.inventory.ingredientSkuMaxLength}
            ><input
              id="item-sku"
              name="sku"
              bind:value={itemSku}
              maxlength={FORM_LIMITS.inventory.ingredientSkuMaxLength}
              placeholder="Ej. CAF-001"
              autocomplete="off"
              required
            /></FormField
          ><FormField
            id="item-name"
            label="Nombre"
            required
            error={fieldError('name')}
            maxLength={FORM_LIMITS.inventory.ingredientNameMaxLength}
            ><input
              id="item-name"
              name="name"
              bind:value={itemName}
              maxlength={FORM_LIMITS.inventory.ingredientNameMaxLength}
              placeholder="Ej. Café molido"
              autocomplete="off"
              required
            /></FormField
          ><FormField id="item-category" label="Categoría" required error={fieldError('categoryId')}
            ><SearchSelect
              id="item-category"
              name="categoryId"
              bind:value={itemCategoryId}
              options={categoryOptions}
              placeholder="Busca una categoría"
              required
              allowEmpty={false}
            /></FormField
          ><FormField id="item-unit" label="Unidad base" required error={fieldError('baseUnitId')}
            ><SearchSelect
              id="item-unit"
              name="baseUnitId"
              bind:value={itemBaseUnitId}
              options={unitOptions}
              placeholder="Busca una unidad"
              required
              allowEmpty={false}
            /></FormField
          ><FormField
            id="item-reorder"
            label="Stock mínimo"
            required
            error={fieldError('reorderLevel')}
            ><input
              id="item-reorder"
              name="reorderLevel"
              type="number"
              inputmode="decimal"
              bind:value={itemReorderLevel}
              min="0"
              max={FORM_LIMITS.inventory.decimalMax}
              step="0.000001"
              pattern={FORM_PATTERNS.decimal6.source}
              placeholder="Ej. 1000"
              required
            /></FormField
          ><FormField
            id="item-description"
            label="Descripción"
            error={fieldError('description')}
            maxLength={FORM_LIMITS.inventory.ingredientDescriptionMaxLength}
            ><textarea
              id="item-description"
              name="description"
              bind:value={itemDescription}
              maxlength={FORM_LIMITS.inventory.ingredientDescriptionMaxLength}
              placeholder="Ej. Insumo para bebidas calientes"
              rows="3"></textarea></FormField
          >
        </div>
        <section class="inventory__supplier-links" aria-labelledby="supplier-links-title">
          <div class="inventory__line-heading">
            <div>
              <h3 id="supplier-links-title">Proveedores asociados</h3>
              <p class="inventory__helper">
                Opcional. Define presentaciones y costos para este insumo.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onclick={addSupplierLink}
              disabled={itemSupplierLinks.length >= FORM_LIMITS.inventory.supplierLinksMaxSize}
              ><Plus class="size-4" aria-hidden="true" />Agregar proveedor</Button
            >
          </div>
          <div class="inventory__supplier-links-list">
            {#each itemSupplierLinks as link, index (index)}
              <fieldset class="inventory__supplier-link">
                <legend>Proveedor {index + 1}</legend>
                <FormField id={`item-supplier-${index}`} label="Proveedor" required>
                  <SearchSelect
                    id={`item-supplier-${index}`}
                    bind:value={link.supplierId}
                    options={supplierOptions}
                    placeholder="Busca un proveedor"
                    required
                    allowEmpty={false}
                  />
                </FormField>
                <FormField id={`item-supplier-sku-${index}`} label="SKU del proveedor">
                  <input
                    id={`item-supplier-sku-${index}`}
                    bind:value={link.supplierSku}
                    maxlength={FORM_LIMITS.inventory.supplierSkuMaxLength}
                    placeholder="Ej. PROV-001"
                  />
                </FormField>
                <FormField id={`item-pack-quantity-${index}`} label="Cantidad por empaque" required>
                  <input
                    id={`item-pack-quantity-${index}`}
                    type="number"
                    bind:value={link.packQuantity}
                    min="0.000001"
                    max={FORM_LIMITS.inventory.decimalMax}
                    step="0.000001"
                    placeholder="Ej. 1"
                    required
                  />
                </FormField>
                <FormField id={`item-pack-unit-${index}`} label="Unidad de empaque" required>
                  <SearchSelect
                    id={`item-pack-unit-${index}`}
                    bind:value={link.packUnitId}
                    options={unitOptions}
                    placeholder="Busca una unidad"
                    required
                    allowEmpty={false}
                  />
                </FormField>
                <FormField id={`item-unit-cost-${index}`} label="Costo unitario" required>
                  <input
                    id={`item-unit-cost-${index}`}
                    type="number"
                    bind:value={link.unitCost}
                    min="0"
                    max={FORM_LIMITS.inventory.decimalMax}
                    step="0.000001"
                    placeholder="Ej. 0.50"
                    required
                  />
                </FormField>
                <div class="inventory__supplier-link-actions">
                  <label class="inventory__checkbox">
                    <input type="checkbox" bind:checked={link.isPreferred} /> Preferido
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Quitar proveedor ${index + 1}`}
                    onclick={() => removeSupplierLink(index)}
                    ><Trash2 class="size-4 text-destructive" aria-hidden="true" /></Button
                  >
                </div>
              </fieldset>
            {:else}
              <p class="inventory__empty">No hay proveedores asociados.</p>
            {/each}
          </div>
        </section>
        <input type="hidden" name="trackLots" value="false" /><label class="inventory__checkbox"
          ><input type="checkbox" name="trackLots" value="true" bind:checked={itemTrackLots} /> Controlar
          lotes y vencimientos</label
        ><input type="hidden" name="active" value="false" /><label class="inventory__checkbox"
          ><input type="checkbox" name="active" value="true" bind:checked={itemActive} /> Activo</label
        ></Dialog.Body
      ><Dialog.Footer
        ><Button type="button" variant="outline" onclick={() => (itemDialogOpen = false)}
          >Cancelar</Button
        ><Button type="submit" loading={pendingAction === 'saveItem'}>Guardar insumo</Button
        ></Dialog.Footer
      >
    </form></Dialog.Content
  ></Dialog.Root
>

<Dialog.Root bind:open={receiveDialogOpen}
  ><Dialog.Content size="lg"
    ><Dialog.Header
      ><Dialog.Title>Registrar recepción</Dialog.Title><Dialog.Description
        >La recepción crea lotes y movimientos de entrada de forma idempotente.</Dialog.Description
      ></Dialog.Header
    >
    <form
      class="inventory__form"
      method="POST"
      action="?/receive"
      onsubmit={(event: SubmitEvent) => guardSubmit('receive', event)}
    >
      <input type="hidden" name="locationId" value={data.locationId} /><input
        type="hidden"
        name="lines"
        value={JSON.stringify(receiptLines)}
      /><Dialog.Body
        ><p class="form-legend">
          <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
        </p>
        <div class="inventory__form-grid">
          <FormField
            id="receipt-supplier"
            label="Proveedor"
            required
            error={fieldError('supplierId')}
            ><SearchSelect
              id="receipt-supplier"
              name="supplierId"
              bind:value={receiptSupplierId}
              options={supplierOptions}
              placeholder="Busca un proveedor"
              required
              allowEmpty={false}
            /></FormField
          ><FormField
            id="receipt-number"
            label="Número de recepción"
            required
            error={fieldError('receiptNumber')}
            maxLength={FORM_LIMITS.inventory.receiptNumberMaxLength}
            ><input
              id="receipt-number"
              name="receiptNumber"
              bind:value={receiptNumber}
              maxlength={FORM_LIMITS.inventory.receiptNumberMaxLength}
              placeholder="Ej. GR-2026-001"
              autocomplete="off"
              required
            /></FormField
          ><FormField
            id="receipt-date"
            label="Fecha y hora"
            required
            error={fieldError('receivedAt')}
            ><input
              id="receipt-date"
              name="receivedAt"
              type="datetime-local"
              bind:value={receiptReceivedAt}
              placeholder="AAAA-MM-DD HH:MM"
              required
            /></FormField
          ><FormField
            id="receipt-storage"
            label="Bodega"
            required
            error={fieldError('storageLocationId')}
            ><SearchSelect
              id="receipt-storage"
              name="storageLocationId"
              bind:value={receiptStorageLocationId}
              options={storageOptions}
              placeholder="Busca una bodega"
              required
              allowEmpty={false}
            /></FormField
          ><FormField
            id="receipt-notes"
            label="Notas"
            error={fieldError('notes')}
            maxLength={FORM_LIMITS.inventory.notesMaxLength}
            ><textarea
              id="receipt-notes"
              name="notes"
              bind:value={receiptNotes}
              maxlength={FORM_LIMITS.inventory.notesMaxLength}
              placeholder="Ej. Factura y condiciones de entrega"
              rows="2"></textarea></FormField
          >
        </div>
        <div class="inventory__line-heading">
          <h3>Líneas recibidas</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onclick={() => (receiptLines = [...receiptLines, emptyReceiptLine()])}
            disabled={receiptLines.length >= FORM_LIMITS.inventory.receiptLinesMaxSize}
            ><Plus class="size-4" aria-hidden="true" />Agregar línea</Button
          >
        </div>
        <div class="inventory__lines">
          {#each receiptLines as line, index (index)}<fieldset class="inventory__line">
              <legend>Línea {index + 1}</legend><FormField
                id={`receipt-line-${index}-ingredient`}
                label="Insumo"
                required
                error={fieldError(`lines.${index}.ingredientId`)}
                ><SearchSelect
                  id={`receipt-line-${index}-ingredient`}
                  bind:value={line.ingredientId}
                  options={ingredientOptions}
                  placeholder="Busca un insumo"
                  required
                  allowEmpty={false}
                  onSelect={(value) => setReceiptIngredient(line, value)}
                /></FormField
              ><FormField
                id={`receipt-line-${index}-lot`}
                label="Lote"
                required
                error={fieldError(`lines.${index}.lotCode`)}
                maxLength={FORM_LIMITS.inventory.lotCodeMaxLength}
                ><input
                  id={`receipt-line-${index}-lot`}
                  bind:value={line.lotCode}
                  maxlength={FORM_LIMITS.inventory.lotCodeMaxLength}
                  placeholder="Ej. LOTE-001"
                  required
                /></FormField
              ><FormField
                id={`receipt-line-${index}-quantity`}
                label="Cantidad"
                required
                error={fieldError(`lines.${index}.quantityReceived`)}
                ><input
                  id={`receipt-line-${index}-quantity`}
                  type="number"
                  inputmode="decimal"
                  bind:value={line.quantityReceived}
                  min="0.000001"
                  max={FORM_LIMITS.inventory.decimalMax}
                  step="0.000001"
                  placeholder="Ej. 1000"
                  required
                /></FormField
              ><FormField
                id={`receipt-line-${index}-cost`}
                label="Costo unitario"
                required
                error={fieldError(`lines.${index}.unitCost`)}
                ><input
                  id={`receipt-line-${index}-cost`}
                  type="number"
                  inputmode="decimal"
                  bind:value={line.unitCost}
                  min="0"
                  max={FORM_LIMITS.inventory.decimalMax}
                  step="0.000001"
                  placeholder="Ej. 0.028"
                  required
                /></FormField
              ><FormField
                id={`receipt-line-${index}-received`}
                label="Recibido el"
                required
                error={fieldError(`lines.${index}.receivedOn`)}
                ><input
                  id={`receipt-line-${index}-received`}
                  type="date"
                  bind:value={line.receivedOn}
                  placeholder="AAAA-MM-DD"
                  required
                /></FormField
              ><FormField
                id={`receipt-line-${index}-expires`}
                label="Vence el"
                error={fieldError(`lines.${index}.expiresOn`)}
                ><input
                  id={`receipt-line-${index}-expires`}
                  type="date"
                  bind:value={line.expiresOn}
                  placeholder="AAAA-MM-DD"
                /></FormField
              >{#if receiptLines.length > 1}<Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Quitar línea ${index + 1}`}
                  onclick={() =>
                    (receiptLines = receiptLines.filter((_, current) => current !== index))}
                  ><Trash2 class="size-4 text-destructive" aria-hidden="true" /></Button
                >{/if}
            </fieldset>{/each}
        </div></Dialog.Body
      ><Dialog.Footer
        ><Button type="button" variant="outline" onclick={() => (receiveDialogOpen = false)}
          >Cancelar</Button
        ><Button type="submit" loading={pendingAction === 'receive'}>Registrar recepción</Button
        ></Dialog.Footer
      >
    </form></Dialog.Content
  ></Dialog.Root
>

<Dialog.Root bind:open={adjustmentDialogOpen}
  ><Dialog.Content size="md"
    ><Dialog.Header
      ><Dialog.Title>Registrar ajuste o merma</Dialog.Title><Dialog.Description
        >Los movimientos son append-only y toda salida requiere un motivo.</Dialog.Description
      ></Dialog.Header
    >
    <form
      class="inventory__form"
      method="POST"
      action="?/adjust"
      onsubmit={(event: SubmitEvent) => guardSubmit('adjust', event)}
    >
      <input type="hidden" name="locationId" value={data.locationId} /><input
        type="hidden"
        name="operationId"
        value={adjustmentOperationId}
      /><Dialog.Body
        ><p class="form-legend">
          <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
        </p>
        <div class="inventory__form-grid">
          <FormField
            id="adjust-storage"
            label="Bodega"
            required
            error={fieldError('storageLocationId')}
            ><SearchSelect
              id="adjust-storage"
              name="storageLocationId"
              bind:value={adjustmentStorageLocationId}
              options={storageOptions}
              placeholder="Busca una bodega"
              required
              allowEmpty={false}
            /></FormField
          ><FormField
            id="adjust-ingredient"
            label="Insumo"
            required
            error={fieldError('ingredientId')}
            ><SearchSelect
              id="adjust-ingredient"
              name="ingredientId"
              bind:value={adjustmentIngredientId}
              options={ingredientOptions}
              placeholder="Busca un insumo"
              required
              allowEmpty={false}
            /></FormField
          ><FormField id="adjust-type" label="Operación" required error={fieldError('movementType')}
            ><select id="adjust-type" name="movementType" bind:value={adjustmentType} required
              ><option value="adjustment_in">Ajuste positivo</option><option value="adjustment_out"
                >Ajuste negativo</option
              ><option value="waste">Merma</option></select
            ></FormField
          ><FormField
            id="adjust-lot"
            label={adjustmentLotRequired ? 'Lote (obligatorio para salidas)' : 'Lote (opcional)'}
            required={adjustmentLotRequired}
            error={fieldError('inventoryLotId')}
            ><input
              id="adjust-lot"
              name="inventoryLotId"
              bind:value={adjustmentLotId}
              placeholder="UUID del lote, si aplica"
              autocomplete="off"
              required={adjustmentLotRequired}
            /></FormField
          ><FormField id="adjust-quantity" label="Cantidad" required error={fieldError('quantity')}
            ><input
              id="adjust-quantity"
              name="quantity"
              type="number"
              inputmode="decimal"
              bind:value={adjustmentQuantity}
              min="0.000001"
              max={FORM_LIMITS.inventory.decimalMax}
              step="0.000001"
              placeholder="Ej. 2.5"
              required
            /></FormField
          ><FormField
            id="adjust-cost"
            label="Costo unitario"
            required
            error={fieldError('unitCost')}
            ><input
              id="adjust-cost"
              name="unitCost"
              type="number"
              inputmode="decimal"
              bind:value={adjustmentUnitCost}
              min="0"
              max={FORM_LIMITS.inventory.decimalMax}
              step="0.000001"
              placeholder="Ej. 0.50"
              required
            /></FormField
          ><FormField
            id="adjust-reason"
            label="Motivo"
            required
            error={fieldError('reason')}
            maxLength={FORM_LIMITS.inventory.reasonMaxLength}
            ><textarea
              id="adjust-reason"
              name="reason"
              bind:value={adjustmentReason}
              minlength={FORM_LIMITS.inventory.reasonMinLength}
              maxlength={FORM_LIMITS.inventory.reasonMaxLength}
              placeholder="Ej. Producto dañado durante almacenamiento"
              rows="3"
              required></textarea></FormField
          >
        </div></Dialog.Body
      ><Dialog.Footer
        ><Button type="button" variant="outline" onclick={() => (adjustmentDialogOpen = false)}
          >Cancelar</Button
        ><Button type="submit" variant="destructive" loading={pendingAction === 'adjust'}
          >Registrar movimiento</Button
        ></Dialog.Footer
      >
    </form></Dialog.Content
  ></Dialog.Root
>

{#snippet Pagination(meta: InventoryPageMeta, hrefFor: (page: number) => string, label: string)}<nav
    class="inventory__pagination"
    aria-label={`Paginación de ${label}`}
  >
    <span>{meta.total} {label} en total</span>
    <div class="inventory__pagination-actions">
      {#if meta.page > 1}<a
          class="inventory__page-link"
          href={resolve(`/inventario${hrefFor(meta.page - 1)}` as '/inventario')}>Anterior</a
        >{/if}<span>Página {meta.page} de {meta.totalPages}</span
      >{#if meta.page < meta.totalPages}<a
          class="inventory__page-link"
          href={resolve(`/inventario${hrefFor(meta.page + 1)}` as '/inventario')}>Siguiente</a
        >{/if}
    </div>
  </nav>{/snippet}
