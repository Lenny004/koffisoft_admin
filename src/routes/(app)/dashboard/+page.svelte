<script lang="ts">
  import { ArrowUpRight, CalendarCheck, CircleDollarSign, ShoppingBag } from '@lucide/svelte';
  import { resolve } from '$app/paths';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const statusLabels: Record<string, string> = {
    requested: 'Solicitada',
    pending_confirmation: 'Pendiente',
    confirmed: 'Confirmada',
    seated: 'En mesa',
    completed: 'Completada',
    cancelled: 'Cancelada',
    no_show: 'No llegó',
  };

  function statusClass(status: string): string {
    if (['confirmed', 'seated', 'completed'].includes(status))
      return 'admin-status admin-status--success';
    if (['cancelled', 'no_show'].includes(status)) return 'admin-status admin-status--danger';
    return 'admin-status admin-status--warning';
  }
</script>

<svelte:head><title>Área personal | Koffi-Soft Admin</title></svelte:head>

<section class="dashboard" aria-labelledby="dashboard-title">
  <header class="dashboard__header">
    <p class="page-header__eyebrow">Resumen operativo</p>
    <h2 class="dashboard__title" id="dashboard-title">Buenos días, revisemos la operación.</h2>
    <p class="dashboard__intro">
      Un vistazo rápido a las reservas y accesos principales del panel privado.
    </p>
  </header>

  <div class="dashboard__kpis">
    {#each data.kpis as kpi, index (kpi.label)}
      <article class="dashboard__kpi">
        {#if index === 0}
          <CalendarCheck class="dashboard__kpi-icon" aria-hidden="true" />
        {:else if index === 1}
          <CircleDollarSign class="dashboard__kpi-icon" aria-hidden="true" />
        {:else}
          <ShoppingBag class="dashboard__kpi-icon" aria-hidden="true" />
        {/if}
        <p class="dashboard__kpi-heading">{kpi.label}</p>
        <p class="dashboard__kpi-value">{kpi.value}</p>
        <p class="dashboard__kpi-note">{kpi.note}</p>
      </article>
    {/each}
  </div>

  <div class="dashboard__body">
    <section class="dashboard__panel" aria-labelledby="reservations-title">
      <div class="dashboard__panel-heading">
        <h3 class="dashboard__panel-title" id="reservations-title">Reservas de hoy</h3>
        {#if data.reservationSource === 'fixture'}
          <span class="admin-status admin-status--warning">Fixture</span>
        {:else}
          <span class="admin-status admin-status--success">API</span>
        {/if}
      </div>
      <ul class="dashboard__reservation-list">
        {#each data.reservations as reservation (reservation.id)}
          <li class="dashboard__reservation">
            <div>
              <p class="dashboard__reservation-name">{reservation.guest}</p>
              <p class="dashboard__reservation-meta">
                {reservation.time} · {reservation.partySize} personas
              </p>
            </div>
            <span class={statusClass(reservation.status)}
              >{statusLabels[reservation.status] ?? reservation.status}</span
            >
          </li>
        {:else}
          <li class="dashboard__reservation-meta">No hay reservas para hoy.</li>
        {/each}
      </ul>
    </section>

    <aside class="dashboard__panel" aria-labelledby="quick-access-title">
      <div class="dashboard__panel-heading">
        <h3 class="dashboard__panel-title" id="quick-access-title">Accesos rápidos</h3>
        <ArrowUpRight aria-hidden="true" />
      </div>
      <nav aria-label="Accesos rápidos">
        <ul class="dashboard__quick-list">
          <li>
            <a class="dashboard__quick-link" href={resolve('/productos')}
              >Revisar menú <ArrowUpRight aria-hidden="true" /></a
            >
          </li>
          <li>
            <a class="dashboard__quick-link" href={resolve('/reservaciones')}
              >Gestionar reservas <ArrowUpRight aria-hidden="true" /></a
            >
          </li>
          <li>
            <a class="dashboard__quick-link" href={resolve('/reportes')}
              >Ver reportes <ArrowUpRight aria-hidden="true" /></a
            >
          </li>
        </ul>
      </nav>
    </aside>
  </div>
</section>
