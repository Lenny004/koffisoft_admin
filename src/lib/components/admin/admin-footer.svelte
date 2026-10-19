<script lang="ts">
  /**
   * Pie del shell administrativo con versión y enlaces internos de soporte.
   */
  import { env } from '$env/dynamic/public';

  const publicSiteUrl = env.PUBLIC_SITE_URL || 'http://localhost:5173';
</script>

<footer class="admin-footer">
  <span>© 2026 Koffi-Soft. Panel privado.</span>
  <a class="admin-footer__link" href={publicSiteUrl} target="_blank" rel="external noreferrer">
    Ir al sitio público
  </a>
</footer>
