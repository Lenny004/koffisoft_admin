<script lang="ts">
  /**
   * Editor del contenido público de la sede: ubicación, hero, horarios, excepciones,
   * equipo y redes serializados en JSON oculto hacia la action `?/save`.
   */
  import { Save, Plus, Trash2 } from '@lucide/svelte';

  import { Button } from '$lib/components/ui/button/index.js';
  import FormField from '$lib/components/ui/form-field.svelte';
  import * as Card from '$lib/components/ui/card/index.js';
  import { FORM_LIMITS } from '$lib/validation/limits';
  import { fieldError as getFieldError, globalErrors } from '$lib/validation/errors';
  import type { PageProps } from './$types';
  import type { SiteHour, SiteOverride, SiteTeamMember } from '$lib/site/types';

  let { data, form }: PageProps = $props();
  const canManage = $derived(data.permissions.includes('site_content.manage'));
  /** Plantilla de horario cuando la API aún no devolvió filas para ese día. */
  const fallbackHour = (dayOfWeek: number): SiteHour => ({
    id: `new-${dayOfWeek}`,
    serviceType: 'public',
    dayOfWeek,
    opensAt: '08:00',
    closesAt: '18:00',
    crossesMidnight: false,
    active: true,
  });
  const site = data.site;
  let hours = $state<SiteHour[]>(
    site?.hours.length ? structuredClone(site.hours) : [1, 2, 3, 4, 5, 6, 7].map(fallbackHour),
  );
  let overrides = $state<SiteOverride[]>(site?.overrides ? structuredClone(site.overrides) : []);
  let team = $state<SiteTeamMember[]>(
    site?.profile?.aboutTeam ? structuredClone(site.profile.aboutTeam) : [],
  );

  const location = site?.location;
  const profile = site?.profile;
  let addressLine = $state(location?.addressLine ?? '');
  let municipality = $state(location?.municipality ?? '');
  let department = $state(location?.department ?? '');
  let phone = $state(location?.phone ?? '');
  let email = $state(location?.email ?? '');
  let latitude = $state(location?.latitude?.toString() ?? '');
  let longitude = $state(location?.longitude?.toString() ?? '');
  let heroEyebrow = $state(profile?.heroEyebrow ?? 'Café y montaña');
  let heroTitle = $state(profile?.heroTitle ?? 'Una pausa con vista');
  let heroDescription = $state(profile?.heroDescription ?? '');
  let heroImageUrl = $state(profile?.heroImageUrl ?? '');
  let aboutTitle = $state(profile?.aboutTitle ?? 'Nosotros');
  let aboutDescription = $state(profile?.aboutDescription ?? '');
  let aboutMission = $state(profile?.aboutMission ?? '');
  let aboutVision = $state(profile?.aboutVision ?? '');
  let socialFacebookUrl = $state(profile?.socialFacebookUrl ?? '');
  let socialInstagramUrl = $state(profile?.socialInstagramUrl ?? '');
  let socialTikTokUrl = $state(profile?.socialTikTokUrl ?? '');

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  /** Resuelve errores anidados (`location.*`, `profile.*`) tras un `fail()` de `?/save`. */
  const error = (name: string) => getFieldError(form?.errors, name);

  /** Añade una excepción editable en memoria hasta guardar el formulario completo. */
  function addOverride() {
    overrides.push({
      id: `new-${Date.now()}`,
      serviceDate: '',
      serviceType: 'public',
      opensAt: '08:00',
      closesAt: '18:00',
      isClosed: false,
      reason: '',
    });
  }

  /** Quita una excepción del estado local antes de serializar `overrides`. */
  function removeOverride(index: number) {
    overrides.splice(index, 1);
  }

  /** Respeta el tope `FORM_LIMITS.site.maxTeam` al ampliar la sección Nosotros. */
  function addTeamMember() {
    if (team.length < FORM_LIMITS.site.maxTeam) team.push({ name: '', role: '', description: '' });
  }

  /** Elimina un integrante del array que se envía como `aboutTeam`. */
  function removeTeamMember(index: number) {
    team.splice(index, 1);
  }
</script>

<svelte:head><title>Sitio | Koffi-Soft Admin</title></svelte:head>

<section class="site-editor" aria-labelledby="site-editor-title">
  <header class="page-header">
    <div>
      <p class="page-header__eyebrow">Contenido público</p>
      <h2 class="page-header__title" id="site-editor-title">Sitio</h2>
      <p class="page-header__description">
        Edita la información que aparece en la portada, Nosotros, contacto y ubicación.
      </p>
    </div>
    {#if canManage}<Button form="site-form" type="submit"
        ><Save class="size-4" aria-hidden="true" />Guardar cambios</Button
      >{/if}
  </header>

  {#if data.error}<p class="site-editor__alert" role="alert">{data.error}</p>{/if}
  {#if globalErrors(form?.errors).length}<div class="site-editor__alert" role="alert">
      {#each globalErrors(form?.errors) as message (message)}{message}{/each}
    </div>{/if}
  {#if !canManage}<p class="site-editor__notice">
      Tienes acceso de lectura. Las acciones de edición están ocultas por permisos.
    </p>{/if}

  <form id="site-form" method="POST" action="?/save" class="site-editor__form">
    <p class="form-legend">
      <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
    </p>

    <Card.Card>
      <Card.CardHeader
        ><Card.CardTitle>Datos de la sede</Card.CardTitle><Card.CardDescription
          >Esta información se muestra en contacto, ubicación y reservas.</Card.CardDescription
        ></Card.CardHeader
      >
      <Card.CardContent class="site-editor__grid">
        <FormField
          id="site-address"
          label="Dirección"
          required
          error={error('location.addressLine')}
          maxLength={FORM_LIMITS.site.addressMaxLength}
        >
          <input
            id="site-address"
            name="addressLine"
            bind:value={addressLine}
            maxlength={FORM_LIMITS.site.addressMaxLength}
            placeholder="Ej. Km 20, Ruta Panorámica"
            required
            disabled={!canManage}
          />
        </FormField>
        <FormField
          id="site-municipality"
          label="Municipio"
          required
          error={error('location.municipality')}
          maxLength={FORM_LIMITS.site.municipalityMaxLength}
        >
          <input
            id="site-municipality"
            name="municipality"
            bind:value={municipality}
            maxlength={FORM_LIMITS.site.municipalityMaxLength}
            placeholder="Ej. Comasagua"
            required
            disabled={!canManage}
          />
        </FormField>
        <FormField
          id="site-department"
          label="Departamento"
          required
          error={error('location.department')}
          maxLength={FORM_LIMITS.site.departmentMaxLength}
        >
          <input
            id="site-department"
            name="department"
            bind:value={department}
            maxlength={FORM_LIMITS.site.departmentMaxLength}
            placeholder="Ej. La Libertad"
            required
            disabled={!canManage}
          />
        </FormField>
        <FormField
          id="site-phone"
          label="Teléfono"
          error={error('location.phone')}
          maxLength={FORM_LIMITS.site.phoneMaxLength}
        >
          <input
            id="site-phone"
            name="phone"
            bind:value={phone}
            maxlength={FORM_LIMITS.site.phoneMaxLength}
            placeholder="Ej. +503 7000 0000"
            disabled={!canManage}
          />
        </FormField>
        <FormField
          id="site-email"
          label="Correo"
          error={error('location.email')}
          maxLength={FORM_LIMITS.site.emailMaxLength}
        >
          <input
            id="site-email"
            name="email"
            type="email"
            bind:value={email}
            maxlength={FORM_LIMITS.site.emailMaxLength}
            placeholder="Ej. hola@koffisoft.com"
            disabled={!canManage}
          />
        </FormField>
        <FormField id="site-latitude" label="Latitud" error={error('location.latitude')}>
          <input
            id="site-latitude"
            name="latitude"
            type="number"
            min="-90"
            max="90"
            step="0.000001"
            bind:value={latitude}
            placeholder="Ej. 13.700000"
            disabled={!canManage}
          />
        </FormField>
        <FormField id="site-longitude" label="Longitud" error={error('location.longitude')}>
          <input
            id="site-longitude"
            name="longitude"
            type="number"
            min="-180"
            max="180"
            step="0.000001"
            bind:value={longitude}
            placeholder="Ej. -89.250000"
            disabled={!canManage}
          />
        </FormField>
      </Card.CardContent>
    </Card.Card>

    <Card.Card>
      <Card.CardHeader
        ><Card.CardTitle>Hero y Nosotros</Card.CardTitle><Card.CardDescription
          >Textos editoriales y la imagen principal del sitio.</Card.CardDescription
        ></Card.CardHeader
      >
      <Card.CardContent class="site-editor__grid">
        <FormField
          id="hero-eyebrow"
          label="Rótulo del hero"
          required
          error={error('profile.heroEyebrow')}
          maxLength={FORM_LIMITS.site.heroEyebrowMaxLength}
        >
          <input
            id="hero-eyebrow"
            name="heroEyebrow"
            bind:value={heroEyebrow}
            maxlength={FORM_LIMITS.site.heroEyebrowMaxLength}
            placeholder="Ej. Carta de la casa"
            required
            disabled={!canManage}
          />
        </FormField>
        <FormField
          id="hero-title"
          label="Título del hero"
          required
          error={error('profile.heroTitle')}
          maxLength={FORM_LIMITS.site.heroTitleMaxLength}
        >
          <input
            id="hero-title"
            name="heroTitle"
            bind:value={heroTitle}
            maxlength={FORM_LIMITS.site.heroTitleMaxLength}
            placeholder="Ej. Descubre una pausa con vista"
            required
            disabled={!canManage}
          />
        </FormField>
        <FormField
          id="hero-description"
          label="Descripción del hero"
          required
          error={error('profile.heroDescription')}
          maxLength={FORM_LIMITS.site.editorialMaxLength}
          class="form-field--wide"
        >
          <textarea
            id="hero-description"
            name="heroDescription"
            bind:value={heroDescription}
            maxlength={FORM_LIMITS.site.editorialMaxLength}
            rows="4"
            placeholder="Describe la experiencia de la sede."
            required
            disabled={!canManage}></textarea>
        </FormField>
        <FormField
          id="hero-image"
          label="Imagen del hero"
          error={error('profile.heroImageUrl')}
          maxLength={FORM_LIMITS.site.imageUrlMaxLength}
          class="form-field--wide"
        >
          <input
            id="hero-image"
            name="heroImageUrl"
            type="url"
            bind:value={heroImageUrl}
            maxlength={FORM_LIMITS.site.imageUrlMaxLength}
            placeholder="https://ejemplo.com/hero.jpg"
            disabled={!canManage}
          />
        </FormField>
        <FormField
          id="about-title"
          label="Título de Nosotros"
          required
          error={error('profile.aboutTitle')}
          maxLength={FORM_LIMITS.site.heroTitleMaxLength}
        >
          <input
            id="about-title"
            name="aboutTitle"
            bind:value={aboutTitle}
            maxlength={FORM_LIMITS.site.heroTitleMaxLength}
            placeholder="Ej. Hecho para compartir"
            required
            disabled={!canManage}
          />
        </FormField>
        <FormField
          id="about-description"
          label="Descripción de Nosotros"
          required
          error={error('profile.aboutDescription')}
          maxLength={FORM_LIMITS.site.editorialMaxLength}
          class="form-field--wide"
        >
          <textarea
            id="about-description"
            name="aboutDescription"
            bind:value={aboutDescription}
            maxlength={FORM_LIMITS.site.editorialMaxLength}
            rows="4"
            placeholder="Presenta la historia y personalidad del negocio."
            required
            disabled={!canManage}></textarea>
        </FormField>
        <FormField
          id="about-mission"
          label="Misión"
          required
          error={error('profile.aboutMission')}
          maxLength={FORM_LIMITS.site.editorialMaxLength}
        >
          <textarea
            id="about-mission"
            name="aboutMission"
            bind:value={aboutMission}
            maxlength={FORM_LIMITS.site.editorialMaxLength}
            rows="4"
            placeholder="Ej. Crear pausas memorables."
            required
            disabled={!canManage}></textarea>
        </FormField>
        <FormField
          id="about-vision"
          label="Visión"
          required
          error={error('profile.aboutVision')}
          maxLength={FORM_LIMITS.site.editorialMaxLength}
        >
          <textarea
            id="about-vision"
            name="aboutVision"
            bind:value={aboutVision}
            maxlength={FORM_LIMITS.site.editorialMaxLength}
            rows="4"
            placeholder="Ej. Ser un punto de encuentro."
            required
            disabled={!canManage}></textarea>
        </FormField>
      </Card.CardContent>
    </Card.Card>

    <Card.Card>
      <Card.CardHeader
        ><Card.CardTitle>Horarios</Card.CardTitle><Card.CardDescription
          >Configura horarios por tipo de servicio y día.</Card.CardDescription
        ></Card.CardHeader
      >
      <Card.CardContent class="site-editor__schedule">
        {#each hours as hour, index (hour.id)}
          <div class="site-editor__schedule-row">
            <label for={`hour-service-${index}`}>{days[hour.dayOfWeek - 1]}</label>
            <input
              id={`hour-service-${index}`}
              value={hour.serviceType}
              maxlength={FORM_LIMITS.site.serviceTypeMaxLength}
              placeholder="public"
              disabled={!canManage}
              oninput={(event) => (hour.serviceType = event.currentTarget.value)}
            />
            <input
              type="time"
              aria-label={`Apertura ${days[hour.dayOfWeek - 1]}`}
              placeholder="08:00"
              value={hour.opensAt}
              disabled={!canManage}
              oninput={(event) => (hour.opensAt = event.currentTarget.value)}
            />
            <input
              type="time"
              aria-label={`Cierre ${days[hour.dayOfWeek - 1]}`}
              placeholder="18:00"
              value={hour.closesAt}
              disabled={!canManage}
              oninput={(event) => (hour.closesAt = event.currentTarget.value)}
            />
            <label class="site-editor__check"
              ><input
                type="checkbox"
                checked={hour.active}
                disabled={!canManage}
                onchange={(event) => (hour.active = event.currentTarget.checked)}
              /> Activo</label
            >
            <label class="site-editor__check"
              ><input
                type="checkbox"
                checked={hour.crossesMidnight}
                disabled={!canManage}
                onchange={(event) => (hour.crossesMidnight = event.currentTarget.checked)}
              /> Cruza medianoche</label
            >
          </div>
        {/each}
        <input type="hidden" name="hours" value={JSON.stringify(hours)} />
      </Card.CardContent>
    </Card.Card>

    <Card.Card>
      <Card.CardHeader
        ><Card.CardTitle>Excepciones de horario</Card.CardTitle><Card.CardDescription
          >Agrega cierres o cambios puntuales.</Card.CardDescription
        ></Card.CardHeader
      >
      <Card.CardContent class="site-editor__stack">
        {#each overrides as override, index (override.id)}
          <div class="site-editor__override">
            <input
              type="date"
              aria-label="Fecha de excepción"
              placeholder="2026-12-24"
              value={override.serviceDate}
              disabled={!canManage}
              onchange={(event) => (override.serviceDate = event.currentTarget.value)}
            />
            <input
              value={override.serviceType}
              maxlength={FORM_LIMITS.site.serviceTypeMaxLength}
              placeholder="public"
              disabled={!canManage}
              oninput={(event) => (override.serviceType = event.currentTarget.value)}
            />
            <input
              type="time"
              aria-label="Apertura excepcional"
              placeholder="08:00"
              value={override.opensAt ?? ''}
              disabled={!canManage || override.isClosed}
              onchange={(event) => (override.opensAt = event.currentTarget.value || null)}
            />
            <input
              type="time"
              aria-label="Cierre excepcional"
              placeholder="18:00"
              value={override.closesAt ?? ''}
              disabled={!canManage || override.isClosed}
              onchange={(event) => (override.closesAt = event.currentTarget.value || null)}
            />
            <input
              value={override.reason}
              maxlength={FORM_LIMITS.site.reasonMaxLength}
              placeholder="Ej. Feriado nacional"
              disabled={!canManage}
              oninput={(event) => (override.reason = event.currentTarget.value)}
            />
            <label class="site-editor__check"
              ><input
                type="checkbox"
                checked={override.isClosed}
                disabled={!canManage}
                onchange={(event) => (override.isClosed = event.currentTarget.checked)}
              /> Cerrado</label
            >
            {#if canManage}<Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Quitar excepción"
                onclick={() => removeOverride(index)}><Trash2 class="size-4" /></Button
              >{/if}
          </div>
        {/each}
        <input type="hidden" name="overrides" value={JSON.stringify(overrides)} />
        {#if canManage}<Button type="button" variant="outline" onclick={addOverride}
            ><Plus class="size-4" />Agregar excepción</Button
          >{/if}
      </Card.CardContent>
    </Card.Card>

    <Card.Card>
      <Card.CardHeader
        ><Card.CardTitle>Equipo y redes</Card.CardTitle><Card.CardDescription
          >Estos datos alimentan Nosotros y el pie de página público.</Card.CardDescription
        ></Card.CardHeader
      >
      <Card.CardContent class="site-editor__stack">
        {#each team as member, index (index)}
          <div class="site-editor__team-row">
            <input
              value={member.name}
              maxlength={FORM_LIMITS.site.teamNameMaxLength}
              placeholder="Nombre del equipo"
              disabled={!canManage}
              oninput={(event) => (member.name = event.currentTarget.value)}
            />
            <input
              value={member.role}
              maxlength={FORM_LIMITS.site.teamRoleMaxLength}
              placeholder="Rol o área"
              disabled={!canManage}
              oninput={(event) => (member.role = event.currentTarget.value)}
            />
            <textarea
              maxlength={FORM_LIMITS.site.teamDescriptionMaxLength}
              rows="2"
              placeholder="Descripción breve"
              disabled={!canManage}
              oninput={(event) => (member.description = event.currentTarget.value)}
              >{member.description}</textarea
            >
            {#if canManage}<Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Quitar integrante"
                onclick={() => removeTeamMember(index)}><Trash2 class="size-4" /></Button
              >{/if}
          </div>
        {/each}
        <input type="hidden" name="aboutTeam" value={JSON.stringify(team)} />
        {#if canManage}<Button
            type="button"
            variant="outline"
            onclick={addTeamMember}
            disabled={team.length >= FORM_LIMITS.site.maxTeam}
            ><Plus class="size-4" />Agregar integrante</Button
          >{/if}
        <div class="site-editor__grid">
          <FormField
            id="social-facebook"
            label="Facebook"
            error={error('profile.socialFacebookUrl')}
            maxLength={FORM_LIMITS.site.imageUrlMaxLength}
          >
            <input
              id="social-facebook"
              name="socialFacebookUrl"
              type="url"
              maxlength={FORM_LIMITS.site.imageUrlMaxLength}
              bind:value={socialFacebookUrl}
              placeholder="https://facebook.com/koffisoft"
              disabled={!canManage}
            />
          </FormField>
          <FormField
            id="social-instagram"
            label="Instagram"
            error={error('profile.socialInstagramUrl')}
            maxLength={FORM_LIMITS.site.imageUrlMaxLength}
          >
            <input
              id="social-instagram"
              name="socialInstagramUrl"
              type="url"
              maxlength={FORM_LIMITS.site.imageUrlMaxLength}
              bind:value={socialInstagramUrl}
              placeholder="https://instagram.com/koffisoft"
              disabled={!canManage}
            />
          </FormField>
          <FormField
            id="social-tiktok"
            label="TikTok"
            error={error('profile.socialTikTokUrl')}
            maxLength={FORM_LIMITS.site.imageUrlMaxLength}
          >
            <input
              id="social-tiktok"
              name="socialTikTokUrl"
              type="url"
              maxlength={FORM_LIMITS.site.imageUrlMaxLength}
              bind:value={socialTikTokUrl}
              placeholder="https://tiktok.com/@koffisoft"
              disabled={!canManage}
            />
          </FormField>
        </div>
      </Card.CardContent>
    </Card.Card>
  </form>
</section>

<style>
  .site-editor {
    display: grid;
    gap: var(--space-lg);
  }
  .site-editor__form,
  .site-editor__grid,
  .site-editor__stack {
    display: grid;
    gap: var(--space-md);
  }
  .site-editor__form {
    max-inline-size: 72rem;
  }
  .site-editor__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .site-editor__schedule,
  .site-editor__override,
  .site-editor__team-row {
    display: grid;
    gap: var(--space-sm);
    align-items: center;
  }
  .site-editor__schedule-row {
    display: grid;
    grid-template-columns: 1fr 1fr repeat(2, minmax(7rem, 0.7fr)) auto;
    gap: var(--space-sm);
    align-items: center;
  }
  .site-editor__override {
    grid-template-columns: repeat(5, minmax(0, 1fr)) auto auto;
  }
  .site-editor__team-row {
    grid-template-columns: 1fr 1fr 2fr auto;
  }
  .site-editor input,
  .site-editor textarea {
    min-inline-size: 0;
    padding: 0.65rem 0.75rem;
    border: 1px solid var(--input);
    border-radius: var(--radius-sm);
    background: var(--background);
  }
  .site-editor input:disabled,
  .site-editor textarea:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
  .site-editor__check {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    white-space: nowrap;
    font-size: var(--font-size-sm);
  }
  .site-editor__alert,
  .site-editor__notice {
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
  }
  .site-editor__alert {
    color: var(--destructive);
    background: color-mix(in oklab, var(--destructive) 10%, transparent);
  }
  .site-editor__notice {
    color: var(--accent-foreground);
    background: var(--accent);
  }
  @media (max-width: 52rem) {
    .site-editor__grid,
    .site-editor__schedule-row,
    .site-editor__override,
    .site-editor__team-row {
      grid-template-columns: 1fr;
    }
  }
</style>
