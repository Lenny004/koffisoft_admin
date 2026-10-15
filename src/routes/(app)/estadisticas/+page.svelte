<script lang="ts">
  import { BarChart3, ExternalLink, Globe2, MapPin, Package, Route } from '@lucide/svelte';

  import { resolve } from '$app/paths';
  import { Alert } from '$lib/components/ui/alert/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import FormField from '$lib/components/ui/form-field.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const maxDailyVisits = $derived(Math.max(...data.summary.daily.map((point) => point.visits), 1));
  const maxPageVisits = $derived(Math.max(...data.pages.map((row) => row.visits), 1));
  const maxProductVisits = $derived(Math.max(...data.products.map((row) => row.visits), 1));
  const maxReferrerVisits = $derived(Math.max(...data.referrers.map((row) => row.visits), 1));

  const resourceLabels: Record<'menu_item' | 'event', string> = {
    menu_item: 'Plato',
    event: 'Evento',
  };

  function barLabel(value: number, max: number): string {
    return `${Math.round((value / max) * 100)}% del máximo del rango`;
  }
</script>

<svelte:head><title>Estadísticas | Koffi-Soft Admin</title></svelte:head>

<section class="analytics-page" aria-labelledby="analytics-title">
  <header class="page-header analytics-page__header">
    <div>
      <p class="page-header__eyebrow">Lectura anónima del sitio</p>
      <h2 class="page-header__title" id="analytics-title">Estadísticas de visitas</h2>
      <p class="page-header__description">
        Consulta tendencias por sede, páginas, platos, eventos y dominios de referencia sin cookies
        ni datos personales.
      </p>
    </div>
    <Badge variant="info"><BarChart3 size={15} aria-hidden="true" /> Solo lectura</Badge>
  </header>

  {#if data.error}<Alert variant="destructive" class="analytics-page__alert">{data.error}</Alert
    >{/if}

  <Card.Card>
    <Card.CardHeader>
      <Card.CardTitle>Filtros del reporte</Card.CardTitle>
      <Card.CardDescription>El rango máximo permitido es de 366 días.</Card.CardDescription>
    </Card.CardHeader>
    <Card.CardContent>
      <form class="analytics-page__filters" method="GET">
        <p class="form-legend">
          <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
        </p>
        <FormField id="analytics-location" label="Sede" required>
          <select class="analytics-page__select" id="analytics-location" name="locationId" required>
            <option value="" disabled>Selecciona una sede</option>
            {#each data.locations as location (location.id)}
              <option value={location.id} selected={location.id === data.filters.locationId}>
                {location.name} ({location.code})
              </option>
            {/each}
          </select>
        </FormField>
        <FormField id="analytics-from" label="Desde">
          <Input
            id="analytics-from"
            name="from"
            type="date"
            value={data.filters.from}
            placeholder="AAAA-MM-DD"
            min={data.filters.minDate}
            max={data.filters.maxDate}
          />
        </FormField>
        <FormField id="analytics-to" label="Hasta">
          <Input
            id="analytics-to"
            name="to"
            type="date"
            value={data.filters.to}
            placeholder="AAAA-MM-DD"
            min={data.filters.minDate}
            max={data.filters.maxDate}
          />
        </FormField>
        <Button class="analytics-page__submit" type="submit">Actualizar reporte</Button>
      </form>
    </Card.CardContent>
  </Card.Card>

  <div class="analytics-page__summary" aria-label="Resumen de visitas">
    <Card.Card>
      <Card.CardHeader>
        <Card.CardTitle><BarChart3 size={18} aria-hidden="true" /> Visitas totales</Card.CardTitle>
      </Card.CardHeader>
      <Card.CardContent
        ><p class="analytics-page__metric">{data.summary.totalVisits}</p></Card.CardContent
      >
    </Card.Card>
    <Card.Card>
      <Card.CardHeader>
        <Card.CardTitle><Route size={18} aria-hidden="true" /> Días consultados</Card.CardTitle>
      </Card.CardHeader>
      <Card.CardContent
        ><p class="analytics-page__metric">{data.summary.daily.length}</p></Card.CardContent
      >
    </Card.Card>
    <Card.Card>
      <Card.CardHeader>
        <Card.CardTitle><MapPin size={18} aria-hidden="true" /> Sede</Card.CardTitle>
      </Card.CardHeader>
      <Card.CardContent>
        <p class="analytics-page__metric analytics-page__metric--text">
          {data.locations.find((location) => location.id === data.filters.locationId)?.name ??
            'Sin sede'}
        </p>
      </Card.CardContent>
    </Card.Card>
  </div>

  <Card.Card>
    <Card.CardHeader>
      <Card.CardTitle>Tendencia diaria</Card.CardTitle>
      <Card.CardDescription>Visitas agregadas por día local de la sede.</Card.CardDescription>
    </Card.CardHeader>
    <Card.CardContent>
      <div class="analytics-page__daily" aria-label="Gráfica de tendencia diaria">
        {#each data.summary.daily as point (point.date)}
          <div class="analytics-page__daily-row">
            <span>{point.date}</span>
            <progress
              class="analytics-page__progress"
              max={maxDailyVisits}
              value={point.visits}
              aria-label={`${point.date}: ${point.visits} visitas`}
            ></progress>
            <strong class="analytics-page__daily-value">{point.visits}</strong>
          </div>
        {:else}
          <p class="analytics-page__empty">No hay visitas en este rango.</p>
        {/each}
      </div>
    </Card.CardContent>
  </Card.Card>

  <div class="analytics-page__columns">
    <Card.Card>
      <Card.CardHeader>
        <Card.CardTitle><Route size={18} aria-hidden="true" /> Páginas más visitadas</Card.CardTitle
        >
      </Card.CardHeader>
      <Card.CardContent>
        <ul class="analytics-page__ranking">
          {#each data.pages as row (row.path)}
            <li>
              <div class="analytics-page__ranking-label">
                <code class="analytics-page__ranking-name">{row.path}</code><strong
                  class="analytics-page__ranking-value">{row.visits}</strong
                >
              </div>
              <progress
                class="analytics-page__progress"
                max={maxPageVisits}
                value={row.visits}
                aria-label={`${row.path}: ${row.visits} visitas`}
              ></progress>
              <span class="analytics-page__sr-hint">{barLabel(row.visits, maxPageVisits)}</span>
            </li>
          {:else}<li class="analytics-page__empty">No hay páginas registradas.</li>{/each}
        </ul>
      </Card.CardContent>
    </Card.Card>

    <Card.Card>
      <Card.CardHeader>
        <Card.CardTitle><Package size={18} aria-hidden="true" /> Platos y eventos</Card.CardTitle>
      </Card.CardHeader>
      <Card.CardContent>
        <ul class="analytics-page__ranking">
          {#each data.products as row (`${row.resourceType}-${row.resourceKey}`)}
            <li>
              <div class="analytics-page__ranking-label">
                <span class="analytics-page__ranking-name"
                  >{resourceLabels[row.resourceType]} · {row.resourceKey}</span
                ><strong class="analytics-page__ranking-value">{row.visits}</strong>
              </div>
              <progress
                class="analytics-page__progress"
                max={maxProductVisits}
                value={row.visits}
                aria-label={`${row.resourceKey}: ${row.visits} visitas`}
              ></progress>
              <span class="analytics-page__sr-hint">{barLabel(row.visits, maxProductVisits)}</span>
            </li>
          {:else}<li class="analytics-page__empty">No hay platos o eventos registrados.</li>{/each}
        </ul>
      </Card.CardContent>
    </Card.Card>

    <Card.Card>
      <Card.CardHeader>
        <Card.CardTitle><Globe2 size={18} aria-hidden="true" /> Fuentes</Card.CardTitle>
      </Card.CardHeader>
      <Card.CardContent>
        <ul class="analytics-page__ranking">
          {#each data.referrers as row (row.host)}
            <li>
              <div class="analytics-page__ranking-label">
                <span class="analytics-page__ranking-name">{row.host}</span><strong
                  class="analytics-page__ranking-value">{row.visits}</strong
                >
              </div>
              <progress
                class="analytics-page__progress"
                max={maxReferrerVisits}
                value={row.visits}
                aria-label={`${row.host}: ${row.visits} visitas`}
              ></progress>
              <span class="analytics-page__sr-hint">{barLabel(row.visits, maxReferrerVisits)}</span>
            </li>
          {:else}<li class="analytics-page__empty">No hay fuentes registradas.</li>{/each}
        </ul>
      </Card.CardContent>
    </Card.Card>
  </div>

  <p class="analytics-page__privacy">
    <ExternalLink size={15} aria-hidden="true" /> Los datos son agregados diarios y se conservan durante
    395 días.
    <a class="analytics-page__privacy-link" href={resolve('/dashboard')}>Volver al inicio</a>
  </p>
</section>

<style>
  /* Bloque de estadisticas: usa tokens del panel y mantiene los reportes solo de lectura. */
  .analytics-page {
    display: grid;
    gap: var(--space-lg);
  }

  .analytics-page__header {
    align-items: start;
  }

  .analytics-page__alert {
    margin: 0;
  }

  .analytics-page__filters {
    display: grid;
    gap: var(--space-md);
  }

  .analytics-page__select {
    inline-size: 100%;
    min-block-size: 2.5rem;
    padding: var(--space-sm) var(--space-md);
    color: var(--foreground);
    background: var(--surface-panel);
    border: 1px solid var(--input);
    border-radius: var(--radius-md);
  }

  :global(.analytics-page__submit) {
    min-block-size: 2.5rem;
    padding-inline: var(--space-md);
    color: var(--primary-foreground);
    background: var(--primary);
    border: 1px solid var(--primary);
    border-radius: var(--radius-md);
    cursor: pointer;
    font-weight: var(--font-weight-semibold);
  }

  :global(.analytics-page__submit:hover) {
    background: var(--mountain-900);
  }

  .analytics-page__summary,
  .analytics-page__columns {
    display: grid;
    gap: var(--space-lg);
  }

  .analytics-page__summary {
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  }

  .analytics-page__columns {
    grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
  }

  .analytics-page__metric {
    margin: 0;
    color: var(--primary);
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
  }

  .analytics-page__metric--text {
    color: var(--foreground);
    font-family: var(--font-family-display);
    font-size: var(--font-size-xl);
  }

  .analytics-page__daily,
  .analytics-page__ranking {
    display: grid;
    gap: var(--space-sm);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .analytics-page__daily-row,
  .analytics-page__ranking-label {
    display: grid;
    grid-template-columns: minmax(5rem, 1fr) minmax(8rem, 3fr) auto;
    align-items: center;
    gap: var(--space-sm);
    color: var(--text-muted);
    font-size: var(--font-size-sm);
  }

  .analytics-page__ranking li {
    display: grid;
    gap: var(--space-xs);
  }

  .analytics-page__ranking-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .analytics-page__ranking-value,
  .analytics-page__daily-value {
    color: var(--foreground);
  }

  .analytics-page__progress {
    inline-size: 100%;
    block-size: 0.65rem;
    accent-color: var(--primary);
  }

  .analytics-page__sr-hint {
    color: var(--text-muted);
    font-size: var(--font-size-xs);
  }

  .analytics-page__empty {
    margin: 0;
    color: var(--text-muted);
  }

  .analytics-page__privacy {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    margin: 0;
    color: var(--text-muted);
    font-size: var(--font-size-sm);
  }

  .analytics-page__privacy-link {
    color: var(--primary);
    font-weight: var(--font-weight-semibold);
  }

  @media (min-width: 48rem) {
    .analytics-page__filters {
      grid-template-columns: 2fr 1fr 1fr auto;
      align-items: end;
    }

    .analytics-page__filters .form-legend {
      grid-column: 1 / -1;
    }

    :global(.analytics-page__submit) {
      min-inline-size: 10rem;
    }
  }
</style>
