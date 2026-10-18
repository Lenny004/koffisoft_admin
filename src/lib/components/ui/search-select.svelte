<script lang="ts">
  /**
   * Combobox buscable reutilizable: filtra opciones en cliente, admite valor vacío
   * opcional y expone el valor seleccionado mediante enlace bidireccional.
   */
  import { Check, ChevronsUpDown } from '@lucide/svelte';
  import { Combobox } from 'bits-ui';

  export interface SearchSelectOption {
    value: string;
    label: string;
    keywords?: string;
  }

  let {
    id,
    name,
    value = $bindable(''),
    options,
    placeholder = 'Escribe para buscar',
    emptyText = 'No hay coincidencias',
    emptyLabel = 'Sin selección',
    required = false,
    disabled = false,
    allowEmpty = true,
    onSelect,
  }: {
    id: string;
    name?: string;
    value?: string;
    options: SearchSelectOption[];
    placeholder?: string;
    emptyText?: string;
    emptyLabel?: string;
    required?: boolean;
    disabled?: boolean;
    allowEmpty?: boolean;
    onSelect?: (value: string) => void;
  } = $props();

  let open = $state(false);
  let search = $state('');

  const items = $derived(allowEmpty ? [{ value: '', label: emptyLabel }, ...options] : options);
  const selectedLabel = $derived(
    items.find((item) => item.value === value)?.label ?? (value ? value : placeholder),
  );
  const visibleItems = $derived.by(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => {
      const haystack = `${item.label} ${item.keywords ?? ''} ${item.value}`.toLowerCase();
      return haystack.includes(query);
    });
  });

  /** Restablece el texto de búsqueda al cerrar el desplegable del combobox. */
  function handleOpenChange(nextOpen: boolean) {
    open = nextOpen;
    if (!nextOpen) search = '';
  }
</script>

<div class="search-select">
  <Combobox.Root
    type="single"
    {name}
    {required}
    {disabled}
    {items}
    bind:value
    bind:open
    allowDeselect={allowEmpty && !required}
    onOpenChange={handleOpenChange}
    onValueChange={(next) => onSelect?.(next)}
  >
    <Combobox.Trigger {id} class="search-select__trigger" aria-label={placeholder}>
      <span class="search-select__value" data-empty={!value || undefined}>
        {selectedLabel}
      </span>
      <ChevronsUpDown class="search-select__icon" aria-hidden="true" />
    </Combobox.Trigger>
    <Combobox.Portal>
      <Combobox.Content class="search-select__content" sideOffset={6}>
        <Combobox.Input
          class="search-select__input"
          {placeholder}
          autocomplete="off"
          oninput={(event) => {
            search = event.currentTarget.value;
          }}
        />
        <Combobox.Viewport class="search-select__list">
          {#if visibleItems.length === 0}
            <p class="search-select__empty">{emptyText}</p>
          {:else}
            {#each visibleItems as item (item.value || 'empty')}
              <Combobox.Item class="search-select__item" value={item.value} label={item.label}>
                {#snippet children({ selected })}
                  <Check
                    class={selected ? 'search-select__check' : 'search-select__check is-hidden'}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                {/snippet}
              </Combobox.Item>
            {/each}
          {/if}
        </Combobox.Viewport>
      </Combobox.Content>
    </Combobox.Portal>
  </Combobox.Root>
</div>
