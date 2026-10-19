<script lang="ts">
  /**
   * Layout raíz del panel: fuentes, tema y contenedor global de rutas.
   */
  import '../app.css';

  let { children } = $props();
</script>

{@render children?.()}
