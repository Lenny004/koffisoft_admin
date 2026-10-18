<script lang="ts">
  /**
   * Directorio de proveedores: tabla TanStack, búsqueda GET, CRUD en diálogo
   * e historial resumido de órdenes de compra cuando el permiso lo permite.
   */
  import { History, Pencil, Plus, Trash2 } from '@lucide/svelte';
  import { resolve } from '$app/paths';
  import { createColumnHelper, createTable, tableFeatures } from '@tanstack/svelte-table';

  import { Alert } from '$lib/components/ui/alert/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import FormField from '$lib/components/ui/form-field.svelte';
  import * as Table from '$lib/components/ui/table/index.js';
  import type { InventoryPageMeta, Supplier } from '$lib/inventory/types';
  import { FORM_LIMITS } from '$lib/validation/limits';
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
      suppliers: Supplier[];
      meta: InventoryPageMeta;
      search: string;
      locationId: string;
      permissions: string[];
      historySupplierId?: string;
      history?: {
        supplierName: string;
        totalOrders: number;
        totalAmount: string;
        orders: Array<{
          id: string;
          orderNumber: string;
          status: string;
          orderDate: string;
          totalAmount: string;
        }>;
      } | null;
      error?: string;
    };
    form?: ActionForm | null;
  }

  let { data, form }: Props = $props();
  let dialogOpen = $state(false);
  let editingId = $state<string | null>(null);
  let supplierCode = $state('');
  let name = $state('');
  let taxId = $state('');
  let phone = $state('');
  let email = $state('');
  let addressLine = $state('');
  let deliveryDays = $state('');
  let orderReminderDays = $state('');
  let notes = $state('');
  let active = $state(true);
  const canManage = $derived(data.permissions.includes('suppliers.manage'));
  const canReadOrders = $derived(data.permissions.includes('purchase_orders.read'));
  const features = tableFeatures({});
  const helper = createColumnHelper<typeof features, Supplier>();
  const columns = helper.columns([
    helper.accessor('supplierCode', { header: 'Código' }),
    helper.accessor('name', { header: 'Proveedor' }),
    helper.accessor('phone', { header: 'Contacto' }),
    helper.accessor('ingredientCount', { header: 'Insumos' }),
    helper.accessor('active', { header: 'Estado' }),
  ]);
  const table = createTable({
    features,
    columns,
    get data() {
      return data.suppliers;
    },
  });

  /** Expone el error de validación de un campo del último envío del formulario. */
  function fieldError(field: string): string {
    return getFieldError(form?.errors, field);
  }

  /** Agrupa los errores globales devueltos por las actions de proveedores. */
  function globalErrors(): string[] {
    return getGlobalErrors(form?.errors);
  }

  /** Abre el diálogo de alta con el proveedor activo por defecto. */
  function startCreate() {
    editingId = null;
    supplierCode = '';
    name = '';
    taxId = '';
    phone = '';
    email = '';
    addressLine = '';
    deliveryDays = '';
    orderReminderDays = '';
    notes = '';
    active = true;
    dialogOpen = true;
  }

  /** Precarga el formulario de edición con los datos del proveedor seleccionado. */
  function startEdit(supplier: Supplier) {
    editingId = supplier.id;
    supplierCode = supplier.supplierCode;
    name = supplier.name;
    taxId = supplier.taxId ?? '';
    phone = supplier.phone ?? '';
    email = supplier.email ?? '';
    addressLine = supplier.addressLine ?? '';
    deliveryDays = supplier.deliveryDays == null ? '' : String(supplier.deliveryDays);
    orderReminderDays =
      supplier.orderReminderDays == null ? '' : String(supplier.orderReminderDays);
    notes = supplier.notes ?? '';
    active = supplier.active;
    dialogOpen = true;
  }

  /** Solicita confirmación nativa antes de acciones destructivas o irreversibles. */
  function confirmAction(message: string): boolean {
    return window.confirm(message);
  }

  /** Conserva el término de búsqueda al navegar entre páginas del listado. */
  function pageQuery(page: number): string {
    const params = new URLSearchParams();
    if (data.search) params.set('search', data.search);
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    return query ? `?${query}` : '';
  }
  $effect(() => {
    if (form?.success) dialogOpen = false;
  });
</script>

<svelte:head><title>Proveedores | Koffi-Soft Admin</title></svelte:head>

<section class="suppliers" aria-labelledby="suppliers-title">
  <header class="page-header">
    <div>
      <p class="page-header__eyebrow">Compras y abastecimiento</p>
      <h2 class="page-header__title" id="suppliers-title">Proveedores</h2>
      <p class="page-header__description">
        Administra proveedores por sede y conserva las relaciones históricas con inventario.
      </p>
    </div>
    {#if canManage}<Button onclick={startCreate}
        ><Plus class="size-4" aria-hidden="true" />Nuevo proveedor</Button
      >{/if}
  </header>
  {#if data.error}<Alert variant="destructive"><p>{data.error}</p></Alert
    >{/if}{#if globalErrors().length}<Alert variant="destructive"
      >{#each globalErrors() as message (message)}<p>{message}</p>{/each}</Alert
    >{/if}
  <Card.Card
    ><Card.CardHeader
      ><Card.CardTitle>Directorio de proveedores</Card.CardTitle><Card.CardDescription
        >Busca en el servidor y revisa cuántos insumos están vinculados a cada proveedor.</Card.CardDescription
      ></Card.CardHeader
    ><Card.CardContent
      ><form class="suppliers__toolbar" method="GET">
        <FormField id="supplier-search" label="Buscar"
          ><input
            id="supplier-search"
            name="search"
            value={data.search}
            maxlength={FORM_LIMITS.inventory.searchMaxLength}
            placeholder="Ej. código, nombre o correo"
            autocomplete="off"
          /></FormField
        ><Button type="submit" variant="secondary">Buscar</Button>
      </form>
      <div class="suppliers__table-wrap">
        <Table.Root
          ><Table.Header
            >{#each table.getHeaderGroups() as group (group.id)}<Table.Row
                >{#each group.headers as header (header.id)}<Table.Head
                    class="suppliers__table-head"
                    >{header.column.columnDef.header as string}</Table.Head
                  >{/each}{#if canManage || canReadOrders}<Table.Head class="suppliers__table-head"
                    >Acciones</Table.Head
                  >{/if}</Table.Row
              >{/each}</Table.Header
          ><Table.Body
            >{#each table.getRowModel().rows as row (row.id)}<Table.Row
                ><Table.Cell><strong>{row.original.supplierCode}</strong></Table.Cell><Table.Cell
                  ><div class="suppliers__primary-cell">
                    <strong>{row.original.name}</strong><span
                      >{row.original.email ?? 'Sin correo'} · {row.original.addressLine ??
                        'Sin dirección'}</span
                    >
                  </div></Table.Cell
                ><Table.Cell>{row.original.phone ?? 'Sin teléfono'}</Table.Cell><Table.Cell
                  >{row.original.ingredientCount}</Table.Cell
                ><Table.Cell
                  ><Badge variant={row.original.active ? 'success' : 'secondary'}
                    >{row.original.active ? 'Activo' : 'Inactivo'}</Badge
                  ></Table.Cell
                >{#if canManage || canReadOrders}<Table.Cell
                    ><div class="suppliers__actions">
                      {#if canReadOrders}
                        <a
                          class="inventory__link"
                          href={resolve(
                            `/proveedores?${new URLSearchParams({
                              ...(data.search ? { search: data.search } : {}),
                              historial: row.original.id,
                            }).toString()}` as '/proveedores',
                          )}
                          aria-label={`Historial de ${row.original.name}`}
                          ><History class="size-4" aria-hidden="true" /></a
                        >
                      {/if}
                      {#if canManage}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar ${row.original.name}`}
                          onclick={() => startEdit(row.original)}
                          ><Pencil class="size-4" aria-hidden="true" /></Button
                        >{/if}{#if canManage && row.original.active}<form
                          method="POST"
                          action="?/delete"
                          onsubmit={(event: SubmitEvent) => {
                            if (
                              !confirmAction(
                                `El proveedor ${row.original.name} se desactivará. ¿Continuar?`,
                              )
                            )
                              event.preventDefault();
                          }}
                        >
                          <input type="hidden" name="id" value={row.original.id} /><Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Desactivar ${row.original.name}`}
                            ><Trash2 class="size-4 text-destructive" aria-hidden="true" /></Button
                          >
                        </form>{/if}
                    </div></Table.Cell
                  >{/if}</Table.Row
              >{:else}<Table.Row
                ><Table.Cell colspan={canManage || canReadOrders ? 6 : 5} class="suppliers__empty"
                  >No hay proveedores para mostrar.</Table.Cell
                ></Table.Row
              >{/each}</Table.Body
          ></Table.Root
        >
      </div>
      <nav class="suppliers__pagination" aria-label="Paginación de proveedores">
        <span>{data.meta.total} proveedor{data.meta.total === 1 ? '' : 'es'} en total</span>
        <div class="suppliers__pagination-actions">
          {#if data.meta.page > 1}<a
              class="suppliers__page-link"
              href={resolve(`/proveedores${pageQuery(data.meta.page - 1)}` as '/proveedores')}
              >Anterior</a
            >{/if}<span>Página {data.meta.page} de {data.meta.totalPages}</span
          >{#if data.meta.page < data.meta.totalPages}<a
              class="suppliers__page-link"
              href={resolve(`/proveedores${pageQuery(data.meta.page + 1)}` as '/proveedores')}
              >Siguiente</a
            >{/if}
        </div>
      </nav></Card.CardContent
    ></Card.Card
  >
  {#if data.history}
    <Card.Card>
      <Card.CardHeader>
        <Card.CardTitle>Historial de {data.history.supplierName}</Card.CardTitle>
        <Card.CardDescription>
          {data.history.totalOrders} orden{data.history.totalOrders === 1 ? '' : 'es'} · total
          {data.history.totalAmount}
        </Card.CardDescription>
      </Card.CardHeader>
      <Card.CardContent>
        {#if data.history.orders.length}
          <div class="suppliers__table-wrap">
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.Head class="suppliers__table-head">Orden</Table.Head>
                  <Table.Head class="suppliers__table-head">Fecha</Table.Head>
                  <Table.Head class="suppliers__table-head">Estado</Table.Head>
                  <Table.Head class="suppliers__table-head">Monto</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {#each data.history.orders as order (order.id)}
                  <Table.Row>
                    <Table.Cell>{order.orderNumber}</Table.Cell>
                    <Table.Cell>{order.orderDate.slice(0, 10)}</Table.Cell>
                    <Table.Cell>{order.status}</Table.Cell>
                    <Table.Cell>{order.totalAmount}</Table.Cell>
                  </Table.Row>
                {/each}
              </Table.Body>
            </Table.Root>
          </div>
        {:else}
          <p class="notifications__empty">Este proveedor aún no tiene órdenes recibidas.</p>
        {/if}
      </Card.CardContent>
    </Card.Card>
  {/if}
</section>

<Dialog.Root bind:open={dialogOpen}
  ><Dialog.Content size="md"
    ><Dialog.Header
      ><Dialog.Title>{editingId ? 'Editar proveedor' : 'Nuevo proveedor'}</Dialog.Title
      ><Dialog.Description
        >El borrado del proveedor es lógico para conservar el historial de compras.</Dialog.Description
      ></Dialog.Header
    >
    <form class="suppliers__form" method="POST" action="?/save">
      <input type="hidden" name="id" value={editingId ?? ''} /><input
        type="hidden"
        name="locationId"
        value={data.locationId}
      /><Dialog.Body
        ><p class="form-legend">
          <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
        </p>
        <div class="suppliers__form-grid">
          <FormField
            id="supplier-code"
            label="Código"
            required
            error={fieldError('supplierCode')}
            maxLength={FORM_LIMITS.inventory.supplierCodeMaxLength}
            ><input
              id="supplier-code"
              name="supplierCode"
              bind:value={supplierCode}
              maxlength={FORM_LIMITS.inventory.supplierCodeMaxLength}
              placeholder="Ej. SUP-COF"
              autocomplete="off"
              required
            /></FormField
          ><FormField
            id="supplier-name"
            label="Nombre"
            required
            error={fieldError('name')}
            maxLength={FORM_LIMITS.inventory.supplierNameMaxLength}
            ><input
              id="supplier-name"
              name="name"
              bind:value={name}
              maxlength={FORM_LIMITS.inventory.supplierNameMaxLength}
              placeholder="Ej. Tostadores Loma Verde"
              autocomplete="organization"
              required
            /></FormField
          ><FormField
            id="supplier-tax-id"
            label="Identificación tributaria"
            error={fieldError('taxId')}
            maxLength={FORM_LIMITS.inventory.supplierTaxIdMaxLength}
            ><input
              id="supplier-tax-id"
              name="taxId"
              bind:value={taxId}
              maxlength={FORM_LIMITS.inventory.supplierTaxIdMaxLength}
              placeholder="Ej. 0614-000000-000-0"
              autocomplete="off"
            /></FormField
          ><FormField
            id="supplier-phone"
            label="Teléfono"
            error={fieldError('phone')}
            maxLength={FORM_LIMITS.inventory.supplierPhoneMaxLength}
            ><input
              id="supplier-phone"
              name="phone"
              type="tel"
              inputmode="tel"
              bind:value={phone}
              maxlength={FORM_LIMITS.inventory.supplierPhoneMaxLength}
              placeholder="Ej. +503 7000 0000"
              autocomplete="tel"
            /></FormField
          ><FormField
            id="supplier-email"
            label="Correo"
            error={fieldError('email')}
            maxLength={FORM_LIMITS.inventory.supplierEmailMaxLength}
            ><input
              id="supplier-email"
              name="email"
              type="email"
              inputmode="email"
              bind:value={email}
              maxlength={FORM_LIMITS.inventory.supplierEmailMaxLength}
              placeholder="Ej. compras@proveedor.com"
              autocomplete="email"
            /></FormField
          ><FormField
            id="supplier-address"
            label="Dirección"
            error={fieldError('addressLine')}
            maxLength={FORM_LIMITS.inventory.supplierAddressMaxLength}
            ><textarea
              id="supplier-address"
              name="addressLine"
              bind:value={addressLine}
              maxlength={FORM_LIMITS.inventory.supplierAddressMaxLength}
              placeholder="Ej. Calle principal, local 4"
              rows="3"></textarea></FormField
          ><FormField
            id="supplier-delivery-days"
            label="Días de entrega"
            error={fieldError('deliveryDays')}
            ><input
              id="supplier-delivery-days"
              name="deliveryDays"
              type="number"
              inputmode="numeric"
              min={FORM_LIMITS.inventory.deliveryDaysMin}
              max={FORM_LIMITS.inventory.deliveryDaysMax}
              bind:value={deliveryDays}
              placeholder="Ej. 3"
            /></FormField
          ><FormField
            id="supplier-reminder-days"
            label="Días de recordatorio"
            error={fieldError('orderReminderDays')}
            ><input
              id="supplier-reminder-days"
              name="orderReminderDays"
              type="number"
              inputmode="numeric"
              min={FORM_LIMITS.inventory.orderReminderDaysMin}
              max={FORM_LIMITS.inventory.orderReminderDaysMax}
              bind:value={orderReminderDays}
              placeholder="Ej. 7"
            /></FormField
          ><FormField
            id="supplier-notes"
            label="Notas"
            error={fieldError('notes')}
            maxLength={FORM_LIMITS.inventory.notesMaxLength}
            ><textarea
              id="supplier-notes"
              name="notes"
              bind:value={notes}
              maxlength={FORM_LIMITS.inventory.notesMaxLength}
              placeholder="Ej. Pedir los lunes por la mañana"
              rows="3"></textarea></FormField
          >
        </div>
        <input type="hidden" name="active" value="false" /><label class="suppliers__checkbox"
          ><input type="checkbox" name="active" value="true" bind:checked={active} /> Activo</label
        ></Dialog.Body
      ><Dialog.Footer
        ><Button type="button" variant="outline" onclick={() => (dialogOpen = false)}
          >Cancelar</Button
        ><Button type="submit">Guardar proveedor</Button></Dialog.Footer
      >
    </form></Dialog.Content
  ></Dialog.Root
>
