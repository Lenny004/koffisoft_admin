<script lang="ts">
  /**
   * Módulo de órdenes de compra: listado filtrado, detalle con flujo de estados,
   * edición de líneas en borrador y recepción en almacén con lote y vencimiento.
   */
  import { Plus, Trash2 } from '@lucide/svelte';
  import { resolve } from '$app/paths';

  import { Alert } from '$lib/components/ui/alert/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import FormField from '$lib/components/ui/form-field.svelte';
  import SearchSelect from '$lib/components/ui/search-select.svelte';
  import * as Table from '$lib/components/ui/table/index.js';
  import { todayInElSalvador } from '$lib/formatting/dates';
  import type { Ingredient, InventoryUnit, StorageLocation, Supplier } from '$lib/inventory/types';
  import {
    PURCHASE_ORDER_STATUS_LABELS,
    PURCHASE_ORDER_STATUSES,
    type PurchaseOrder,
    type PurchaseOrderStatus,
  } from '$lib/purchase-orders/types';
  import { FORM_LIMITS } from '$lib/validation/limits';
  import { globalErrors as getGlobalErrors } from '$lib/validation/errors';

  interface DraftLine {
    id?: string;
    ingredientId: string;
    unitId: string;
    quantityOrdered: string;
    unitCost: string;
  }

  interface ReceiveLine {
    lineId: string;
    quantityReceived: string;
    lotCode: string;
    expiresOn: string;
  }

  interface ActionForm {
    action?: string;
    success?: boolean;
    errors?: Record<string, string> | string[];
  }

  interface Props {
    data: {
      orders: PurchaseOrder[];
      selected: PurchaseOrder | null;
      suppliers: Supplier[];
      ingredients: Ingredient[];
      units: InventoryUnit[];
      storageLocations: StorageLocation[];
      meta: { page: number; perPage: number; total: number; totalPages: number };
      filters: { page: number; status: string; supplierId: string };
      locationId: string;
      permissions: string[];
      error?: string;
    };
    form?: ActionForm | null;
  }

  let { data, form }: Props = $props();
  let createOpen = $state(false);
  let receiveOpen = $state(false);
  let supplierId = $state('');
  let orderDate = $state(todayInElSalvador());
  let expectedDelivery = $state('');
  let notes = $state('');
  let lines = $state<DraftLine[]>([
    { ingredientId: '', unitId: '', quantityOrdered: '', unitCost: '' },
  ]);
  let draftLines = $state<DraftLine[]>([]);
  let draftLinesOrderId = $state('');
  let receiveStorageId = $state('');
  let receiveNotes = $state('');
  let receiveLines = $state<ReceiveLine[]>([]);

  const canManage = $derived(data.permissions.includes('purchase_orders.manage'));
  const supplierOptions = $derived(
    data.suppliers.map((supplier) => ({
      value: supplier.id,
      label: `${supplier.name} (${supplier.supplierCode})`,
    })),
  );
  const ingredientOptions = $derived(
    data.ingredients.map((item) => ({
      value: item.id,
      label: `${item.name} (${item.sku})`,
    })),
  );
  const unitOptions = $derived(
    data.units.map((unit) => ({ value: unit.id, label: `${unit.name} (${unit.code})` })),
  );
  const storageOptions = $derived(
    data.storageLocations.map((location) => ({
      value: location.id,
      label: `${location.name} (${location.code})`,
    })),
  );
  const statusVariant: Record<
    PurchaseOrderStatus,
    'secondary' | 'info' | 'warning' | 'success' | 'danger'
  > = {
    Draft: 'secondary',
    Submitted: 'info',
    Approved: 'warning',
    Received: 'success',
    Cancelled: 'danger',
  };

  /** Plantilla vacía para una línea de insumo en formularios de creación o borrador. */
  function emptyLine(): DraftLine {
    return { ingredientId: '', unitId: '', quantityOrdered: '', unitCost: '' };
  }

  /** Añade una línea al borrador de creación respetando el límite del contrato de inventario. */
  function addLine() {
    if (lines.length >= FORM_LIMITS.inventory.purchaseOrderLinesMaxSize) return;
    lines = [...lines, emptyLine()];
  }

  /** Elimina una línea del formulario de nueva orden por índice. */
  function removeLine(index: number) {
    lines = lines.filter((_, current) => current !== index);
  }

  /** Añade una línea editable al borrador de la orden seleccionada. */
  function addDraftLine() {
    if (draftLines.length >= FORM_LIMITS.inventory.purchaseOrderLinesMaxSize) return;
    draftLines = [...draftLines, emptyLine()];
  }

  /** Quita una línea del borrador en edición antes de serializarla en `replaceLines`. */
  function removeDraftLine(index: number) {
    draftLines = draftLines.filter((_, current) => current !== index);
  }

  /** Copia las líneas del servidor al estado editable local al abrir un borrador. */
  function syncDraftLines(order: PurchaseOrder) {
    draftLines = order.lines.map((line) => ({
      id: line.id,
      ingredientId: line.ingredientId,
      unitId: line.unitId,
      quantityOrdered: line.quantityOrdered,
      unitCost: line.unitCost,
    }));
    draftLinesOrderId = order.id;
  }

  /** Inicializa el diálogo de recepción con cantidades pedidas y ubicación por defecto. */
  function startReceive(order: PurchaseOrder) {
    receiveStorageId = data.storageLocations[0]?.id ?? '';
    receiveNotes = '';
    receiveLines = order.lines.map((line) => ({
      lineId: line.id,
      quantityReceived: line.quantityOrdered,
      lotCode: '',
      expiresOn: '',
    }));
    receiveOpen = true;
  }

  /** Arma la query del listado conservando filtros y la orden abierta en detalle. */
  function pageQuery(page: number, orderId?: string): string {
    const params = new URLSearchParams();
    if (data.filters.status) params.set('status', data.filters.status);
    if (data.filters.supplierId) params.set('supplierId', data.filters.supplierId);
    if (page > 1) params.set('page', String(page));
    if (orderId) params.set('orden', orderId);
    const query = params.toString();
    return query ? `?${query}` : '';
  }

  /** Delega confirmaciones destructivas al diálogo nativo del navegador. */
  function confirmAction(message: string): boolean {
    return window.confirm(message);
  }

  $effect(() => {
    if (form?.success) {
      createOpen = false;
      receiveOpen = false;
      if (form.action === 'replaceLines' || form.action === 'update') draftLinesOrderId = '';
    }
  });

  $effect(() => {
    const order = data.selected;
    if (!order || order.status !== 'Draft') {
      draftLinesOrderId = '';
      return;
    }
    if (draftLinesOrderId === order.id) return;
    syncDraftLines(order);
  });
</script>

<svelte:head><title>Órdenes de compra | Koffi-Soft Admin</title></svelte:head>

<section class="purchase-orders" aria-labelledby="orders-title">
  <header class="page-header">
    <div>
      <p class="page-header__eyebrow">Compras</p>
      <h2 class="page-header__title" id="orders-title">Órdenes de compra</h2>
      <p class="page-header__description">
        Crea borradores, edita sus líneas, envíalos a aprobación, cancélalos o recíbelos en almacén
        con lote y vencimiento.
      </p>
    </div>
    {#if canManage}
      <Button onclick={() => (createOpen = true)}>
        <Plus class="size-4" aria-hidden="true" />Nueva orden
      </Button>
    {/if}
  </header>

  {#if data.error}<Alert variant="destructive"><p>{data.error}</p></Alert>{/if}
  {#if getGlobalErrors(form?.errors).length}
    <Alert variant="destructive">
      {#each getGlobalErrors(form?.errors) as message (message)}<p>{message}</p>{/each}
    </Alert>
  {/if}

  <Card.Card>
    <Card.CardHeader>
      <Card.CardTitle>Listado</Card.CardTitle>
      <Card.CardDescription>Filtra por estado o proveedor.</Card.CardDescription>
    </Card.CardHeader>
    <Card.CardContent>
      <form class="suppliers__toolbar" method="GET">
        <FormField id="order-status-filter" label="Estado">
          <select id="order-status-filter" name="status" value={data.filters.status}>
            <option value="">Todos</option>
            {#each PURCHASE_ORDER_STATUSES as status (status)}
              <option value={status}>{PURCHASE_ORDER_STATUS_LABELS[status]}</option>
            {/each}
          </select>
        </FormField>
        <FormField id="order-supplier-filter" label="Proveedor">
          <SearchSelect
            id="order-supplier-filter"
            name="supplierId"
            value={data.filters.supplierId}
            options={supplierOptions}
            placeholder="Todos los proveedores"
            emptyLabel="Todos los proveedores"
          />
        </FormField>
        <Button type="submit" variant="secondary">Filtrar</Button>
      </form>
      <div class="suppliers__table-wrap">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head class="suppliers__table-head">Número</Table.Head>
              <Table.Head class="suppliers__table-head">Proveedor</Table.Head>
              <Table.Head class="suppliers__table-head">Fecha</Table.Head>
              <Table.Head class="suppliers__table-head">Estado</Table.Head>
              <Table.Head class="suppliers__table-head">Total</Table.Head>
              <Table.Head class="suppliers__table-head">Detalle</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each data.orders as order (order.id)}
              <Table.Row>
                <Table.Cell><strong>{order.orderNumber}</strong></Table.Cell>
                <Table.Cell>{order.supplierName}</Table.Cell>
                <Table.Cell>{order.orderDate.slice(0, 10)}</Table.Cell>
                <Table.Cell>
                  <Badge variant={statusVariant[order.status]}>
                    {PURCHASE_ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                </Table.Cell>
                <Table.Cell>{order.totalAmount}</Table.Cell>
                <Table.Cell>
                  <a
                    class="inventory__link"
                    href={resolve(
                      `/ordenes-compra${pageQuery(data.meta.page, order.id)}` as '/ordenes-compra',
                    )}>Ver</a
                  >
                </Table.Cell>
              </Table.Row>
            {:else}
              <Table.Row>
                <Table.Cell colspan={6} class="suppliers__empty"
                  >No hay órdenes para mostrar.</Table.Cell
                >
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>
      <nav class="suppliers__pagination" aria-label="Paginación de órdenes">
        <span>{data.meta.total} orden{data.meta.total === 1 ? '' : 'es'}</span>
        <div class="suppliers__pagination-actions">
          {#if data.meta.page > 1}
            <a
              class="suppliers__page-link"
              href={resolve(`/ordenes-compra${pageQuery(data.meta.page - 1)}` as '/ordenes-compra')}
              >Anterior</a
            >
          {/if}
          <span>Página {data.meta.page} de {data.meta.totalPages}</span>
          {#if data.meta.page < data.meta.totalPages}
            <a
              class="suppliers__page-link"
              href={resolve(`/ordenes-compra${pageQuery(data.meta.page + 1)}` as '/ordenes-compra')}
              >Siguiente</a
            >
          {/if}
        </div>
      </nav>
    </Card.CardContent>
  </Card.Card>

  {#if data.selected}
    {@const order = data.selected}
    <Card.Card>
      <Card.CardHeader>
        <Card.CardTitle>Orden {order.orderNumber}</Card.CardTitle>
        <Card.CardDescription>
          {order.supplierName} · {PURCHASE_ORDER_STATUS_LABELS[order.status]}
        </Card.CardDescription>
      </Card.CardHeader>
      <Card.CardContent>
        {#if canManage && (order.status === 'Draft' || order.status === 'Submitted')}
          <form class="suppliers__form" method="POST" action="?/update">
            <input type="hidden" name="id" value={order.id} />
            <div class="suppliers__form-grid">
              <FormField id="edit-delivery" label="Entrega esperada">
                <input
                  id="edit-delivery"
                  name="expectedDelivery"
                  type="date"
                  value={order.expectedDelivery?.slice(0, 10) ?? ''}
                />
              </FormField>
              <FormField
                id="edit-notes"
                label="Notas"
                maxLength={FORM_LIMITS.inventory.notesMaxLength}
              >
                <textarea
                  id="edit-notes"
                  name="notes"
                  maxlength={FORM_LIMITS.inventory.notesMaxLength}
                  placeholder="Ej. Entregar por la mañana"
                  rows="2">{order.notes ?? ''}</textarea
                >
              </FormField>
            </div>
            <Button type="submit" variant="secondary">Actualizar datos</Button>
          </form>
        {/if}

        {#if canManage && order.status === 'Draft'}
          <form class="suppliers__form" method="POST" action="?/replaceLines">
            <input type="hidden" name="id" value={order.id} />
            <input type="hidden" name="lines" value={JSON.stringify(draftLines)} />
            <p class="form-legend">
              <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
            </p>
            <div class="inventory__line-heading">
              <h3>Líneas del borrador</h3>
              <Button type="button" variant="outline" size="sm" onclick={addDraftLine}>
                <Plus class="size-4" aria-hidden="true" />Agregar línea
              </Button>
            </div>
            {#each draftLines as line, index (line.id ?? `new-${index}`)}
              <fieldset class="inventory__supplier-link">
                <legend>Línea {index + 1}</legend>
                <FormField id={`draft-ingredient-${index}`} label="Insumo" required>
                  <SearchSelect
                    id={`draft-ingredient-${index}`}
                    bind:value={line.ingredientId}
                    options={ingredientOptions}
                    placeholder="Busca un insumo"
                    required
                    allowEmpty={false}
                  />
                </FormField>
                <FormField id={`draft-unit-${index}`} label="Unidad" required>
                  <SearchSelect
                    id={`draft-unit-${index}`}
                    bind:value={line.unitId}
                    options={unitOptions}
                    placeholder="Busca una unidad"
                    required
                    allowEmpty={false}
                  />
                </FormField>
                <FormField id={`draft-qty-${index}`} label="Cantidad" required>
                  <input
                    id={`draft-qty-${index}`}
                    type="number"
                    min="0.000001"
                    max={FORM_LIMITS.inventory.decimalMax}
                    step="0.000001"
                    bind:value={line.quantityOrdered}
                    placeholder="Ej. 12"
                    required
                  />
                </FormField>
                <FormField id={`draft-cost-${index}`} label="Costo unitario" required>
                  <input
                    id={`draft-cost-${index}`}
                    type="number"
                    min="0.000001"
                    max={FORM_LIMITS.inventory.decimalMax}
                    step="0.000001"
                    bind:value={line.unitCost}
                    placeholder="Ej. 3.50"
                    required
                  />
                </FormField>
                {#if draftLines.length > 1}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onclick={() => removeDraftLine(index)}
                  >
                    <Trash2 class="size-4 text-destructive" aria-hidden="true" />
                  </Button>
                {/if}
              </fieldset>
            {/each}
            <Button type="submit" variant="secondary">Guardar líneas</Button>
          </form>
        {:else}
          <div class="suppliers__table-wrap">
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.Head class="suppliers__table-head">Insumo</Table.Head>
                  <Table.Head class="suppliers__table-head">Cantidad</Table.Head>
                  <Table.Head class="suppliers__table-head">Costo</Table.Head>
                  <Table.Head class="suppliers__table-head">Recibido</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {#each order.lines as line (line.id)}
                  <Table.Row>
                    <Table.Cell>{line.ingredientName}</Table.Cell>
                    <Table.Cell>{line.quantityOrdered} {line.unitCode}</Table.Cell>
                    <Table.Cell>{line.totalCost}</Table.Cell>
                    <Table.Cell>{line.quantityReceived ?? 'Pendiente'}</Table.Cell>
                  </Table.Row>
                {/each}
              </Table.Body>
            </Table.Root>
          </div>
        {/if}

        {#if canManage}
          <div class="suppliers__actions">
            {#if order.status === 'Draft'}
              <form method="POST" action="?/submit">
                <input type="hidden" name="id" value={order.id} />
                <Button type="submit">Enviar</Button>
              </form>
            {/if}
            {#if order.status === 'Submitted'}
              <form method="POST" action="?/approve">
                <input type="hidden" name="id" value={order.id} />
                <Button type="submit">Aprobar</Button>
              </form>
            {/if}
            {#if order.status === 'Approved'}
              <Button type="button" onclick={() => startReceive(order)}>Recibir</Button>
            {/if}
            {#if order.status !== 'Received' && order.status !== 'Cancelled'}
              <form
                method="POST"
                action="?/cancel"
                onsubmit={(event: SubmitEvent) => {
                  if (!confirmAction(`¿Cancelar la orden ${order.orderNumber}?`))
                    event.preventDefault();
                }}
              >
                <input type="hidden" name="id" value={order.id} />
                <Button type="submit" variant="destructive">Cancelar</Button>
              </form>
            {/if}
          </div>
        {/if}
      </Card.CardContent>
    </Card.Card>
  {/if}
</section>

<Dialog.Root bind:open={createOpen}>
  <Dialog.Content size="lg">
    <Dialog.Header>
      <Dialog.Title>Nueva orden de compra</Dialog.Title>
      <Dialog.Description
        >Se crea en estado borrador. Las líneas se pueden ajustar mientras no se envíe.</Dialog.Description
      >
    </Dialog.Header>
    <form class="suppliers__form" method="POST" action="?/create">
      <input type="hidden" name="locationId" value={data.locationId} />
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />
      <Dialog.Body>
        <p class="form-legend">
          <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
        </p>
        <div class="suppliers__form-grid">
          <FormField id="order-supplier" label="Proveedor" required>
            <SearchSelect
              id="order-supplier"
              name="supplierId"
              bind:value={supplierId}
              options={supplierOptions}
              placeholder="Busca un proveedor"
              required
              allowEmpty={false}
            />
          </FormField>
          <FormField id="order-date" label="Fecha de la orden" required>
            <input id="order-date" name="orderDate" type="date" bind:value={orderDate} required />
          </FormField>
          <FormField id="order-delivery" label="Entrega esperada">
            <input
              id="order-delivery"
              name="expectedDelivery"
              type="date"
              bind:value={expectedDelivery}
            />
          </FormField>
          <FormField
            id="order-notes"
            label="Notas"
            maxLength={FORM_LIMITS.inventory.notesMaxLength}
          >
            <textarea
              id="order-notes"
              name="notes"
              bind:value={notes}
              maxlength={FORM_LIMITS.inventory.notesMaxLength}
              placeholder="Ej. Pedido semanal de lácteos"
              rows="2"></textarea>
          </FormField>
        </div>
        <div class="inventory__line-heading">
          <h3>Líneas</h3>
          <Button type="button" variant="outline" size="sm" onclick={addLine}>
            <Plus class="size-4" aria-hidden="true" />Agregar línea
          </Button>
        </div>
        {#each lines as line, index (index)}
          <fieldset class="inventory__supplier-link">
            <legend>Línea {index + 1}</legend>
            <FormField id={`line-ingredient-${index}`} label="Insumo" required>
              <SearchSelect
                id={`line-ingredient-${index}`}
                bind:value={line.ingredientId}
                options={ingredientOptions}
                placeholder="Busca un insumo"
                required
                allowEmpty={false}
              />
            </FormField>
            <FormField id={`line-unit-${index}`} label="Unidad" required>
              <SearchSelect
                id={`line-unit-${index}`}
                bind:value={line.unitId}
                options={unitOptions}
                placeholder="Busca una unidad"
                required
                allowEmpty={false}
              />
            </FormField>
            <FormField id={`line-qty-${index}`} label="Cantidad" required>
              <input
                id={`line-qty-${index}`}
                type="number"
                min="0.000001"
                max={FORM_LIMITS.inventory.decimalMax}
                step="0.000001"
                bind:value={line.quantityOrdered}
                placeholder="Ej. 12"
                required
              />
            </FormField>
            <FormField id={`line-cost-${index}`} label="Costo unitario" required>
              <input
                id={`line-cost-${index}`}
                type="number"
                min="0.000001"
                max={FORM_LIMITS.inventory.decimalMax}
                step="0.000001"
                bind:value={line.unitCost}
                placeholder="Ej. 3.50"
                required
              />
            </FormField>
            {#if lines.length > 1}
              <Button type="button" variant="ghost" size="icon" onclick={() => removeLine(index)}>
                <Trash2 class="size-4 text-destructive" aria-hidden="true" />
              </Button>
            {/if}
          </fieldset>
        {/each}
      </Dialog.Body>
      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => (createOpen = false)}
          >Cancelar</Button
        >
        <Button type="submit">Crear borrador</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

{#if data.selected}
  <Dialog.Root bind:open={receiveOpen}>
    <Dialog.Content size="lg">
      <Dialog.Header>
        <Dialog.Title>Recibir orden {data.selected.orderNumber}</Dialog.Title>
        <Dialog.Description>
          Cada línea genera movimiento de inventario con lote y ubicación.
        </Dialog.Description>
      </Dialog.Header>
      <form class="suppliers__form" method="POST" action="?/receive">
        <input type="hidden" name="id" value={data.selected.id} />
        <input type="hidden" name="lines" value={JSON.stringify(receiveLines)} />
        <Dialog.Body>
          <p class="form-legend">
            <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
          </p>
          <FormField id="receive-storage" label="Ubicación de almacén" required>
            <SearchSelect
              id="receive-storage"
              name="storageLocationId"
              bind:value={receiveStorageId}
              options={storageOptions}
              placeholder="Busca una ubicación"
              required
              allowEmpty={false}
            />
          </FormField>
          <FormField
            id="receive-notes"
            label="Notas"
            maxLength={FORM_LIMITS.inventory.notesMaxLength}
          >
            <textarea
              id="receive-notes"
              name="notes"
              bind:value={receiveNotes}
              maxlength={FORM_LIMITS.inventory.notesMaxLength}
              placeholder="Ej. Recibido en buen estado"
              rows="2"></textarea>
          </FormField>
          {#each receiveLines as line, index (line.lineId)}
            <fieldset class="inventory__supplier-link">
              <legend>{data.selected.lines[index]?.ingredientName ?? `Línea ${index + 1}`}</legend>
              <FormField id={`receive-qty-${index}`} label="Cantidad recibida" required>
                <input
                  id={`receive-qty-${index}`}
                  type="number"
                  min="0.000001"
                  step="0.000001"
                  bind:value={line.quantityReceived}
                  placeholder="Ej. 12"
                  required
                />
              </FormField>
              <FormField id={`receive-lot-${index}`} label="Lote" required>
                <input
                  id={`receive-lot-${index}`}
                  bind:value={line.lotCode}
                  maxlength={FORM_LIMITS.inventory.lotCodeMaxLength}
                  placeholder="Ej. L-2026-041"
                  required
                />
              </FormField>
              <FormField id={`receive-exp-${index}`} label="Vencimiento">
                <input id={`receive-exp-${index}`} type="date" bind:value={line.expiresOn} />
              </FormField>
            </fieldset>
          {/each}
        </Dialog.Body>
        <Dialog.Footer>
          <Button type="button" variant="outline" onclick={() => (receiveOpen = false)}
            >Cancelar</Button
          >
          <Button type="submit">Registrar recepción</Button>
        </Dialog.Footer>
      </form>
    </Dialog.Content>
  </Dialog.Root>
{/if}
