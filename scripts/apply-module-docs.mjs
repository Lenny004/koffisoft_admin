import fs from 'fs';
import path from 'path';

const root = process.cwd();

/** Comentario de módulo en español por ruta relativa a src/ (sin prefijo src/). */
const MODULE_DOCS = {
  'app.d.ts':
    'Tipos globales de SvelteKit: usuario en `locals`, roles, permisos y estado MFA tras el hook de auth.',
  'lib/analytics/types.ts':
    'Contratos de respuesta de analítica web (sedes, resumen, páginas, productos y referrers).',
  'lib/announcements/types.ts': 'Modelos de avisos importantes publicados en el sitio público.',
  'lib/backups/types.ts': 'Estados y metadatos de respaldos administrados vía API.',
  'lib/inventory/page-types.ts':
    'Props tipadas entre `inventario/+page.server.ts` y `inventory-module.svelte` (listas, filtros y formularios).',
  'lib/inventory/types.ts':
    'Entidades de inventario, movimientos, proveedores y recetas alineadas con la API.',
  'lib/menu/types.ts': 'Categorías, ítems, variantes y disponibilidad del menú digital.',
  'lib/publication/types.ts': 'Calendario editorial y entradas de publicación por sede.',
  'lib/seo/types.ts': 'Overrides SEO por ruta pública y metadatos editables desde el panel.',
  'lib/site/types.ts': 'Contenido institucional del sitio (horarios, equipo, datos de contacto).',
  'lib/users/types.ts':
    'Usuarios administrativos, roles y empleados expuestos al directorio del panel.',
  'lib/fixtures/dashboard.ts':
    'Datos de demostración del dashboard cuando la API aún no devuelve KPIs reales de la sede.',
  'lib/fixtures/products.ts': 'Fixture de productos para vistas de desarrollo sin backend de menú.',
  'lib/validation/analytics.ts': 'Esquemas Zod de filtros de fechas y sede en estadísticas.',
  'lib/validation/audit-logs.ts':
    'Validación de consultas paginadas de bitácora (fechas y actores).',
  'lib/validation/backups.ts': 'Reglas de formulario para crear o eliminar respaldos.',
  'lib/validation/contact.ts': 'Validación de actualización y conversión de mensajes de contacto.',
  'lib/validation/notifications.ts': 'Límites de acciones masivas sobre notificaciones in-app.',
  'lib/validation/publication.ts': 'Esquemas de entradas del calendario editorial y vista previa.',
  'lib/validation/seo.ts': 'Validación de overrides SEO (rutas, títulos y descripciones).',
  'routes/+layout.svelte': 'Layout raíz del panel: fuentes, tema y contenedor global de rutas.',
  'routes/(app)/+layout.svelte':
    'Layout autenticado: envuelve todas las rutas `(app)` con `AdminShell` y datos de `+layout.server.ts`.',
  'routes/(app)/bitacora/+page.svelte':
    'Ruta de bitácora: delega listado y filtros en `audit-log-browser` con datos del servidor.',
  'routes/(app)/contacto/+page.svelte':
    'Ruta de contacto: monta la bandeja comercial con permisos y form actions del servidor.',
  'routes/(app)/empleados/+page.svelte':
    'Ruta de empleados: conecta `employee-directory` con altas y bajas vía actions.',
  'routes/(app)/eventos/+page.svelte':
    'Ruta de eventos: orquesta el módulo de espacios, paquetes y cotizaciones.',
  'routes/(app)/inventario/+page.svelte':
    'Ruta de inventario: pasa `data` y `form` tipados al módulo de stock y recepciones.',
  'routes/(app)/notificaciones/+page.svelte':
    'Ruta de notificaciones: bandeja completa con las mismas acciones que la campana del shell.',
  'routes/(app)/ordenes-compra/+page.svelte':
    'Ruta de órdenes de compra: monta flujo de borrador, aprobación y recepción.',
  'routes/(app)/productos/+page.svelte':
    'Ruta de productos del menú: CRUD delegado en `product-crud` y acciones del servidor.',
  'routes/(app)/proveedores/+page.svelte':
    'Ruta de proveedores de inventario: directorio y formularios del servidor.',
  'routes/(app)/recursos/+page.svelte':
    'Ruta de recursos operativos (mantenimiento): calendario y estados del módulo admin.',
  'routes/(app)/reportes/+page.svelte':
    'Marcador de reportes avanzados; muestra estado “en construcción” hasta haber módulo dedicado.',
  'routes/(app)/reservaciones/+page.svelte':
    'Ruta de reservaciones: mesas, espacios y transiciones de estado en `reservation-module`.',
  'routes/(app)/usuarios/+page.svelte':
    'Ruta de usuarios y roles: directorio administrativo con MFA y restablecimiento.',
  'routes/(app)/perfil/+page.server.ts':
    'Servidor de perfil: expone el usuario en sesión y la action de cambio de contraseña propia.',
  'routes/restablecer/+page.server.ts':
    'Flujo público de restablecimiento: token por query y POST a `/auth/reset-password` sin sesión.',
  'lib/components/admin/admin-footer.svelte':
    'Pie del shell administrativo con versión y enlaces internos de soporte.',
  'lib/components/admin/admin-shell.svelte':
    'Estructura responsive del panel: sidebar, topbar, campana y área de contenido.',
  'lib/components/admin/under-construction.svelte':
    'Placeholder accesible para secciones del menú aún sin implementación.',
  'lib/components/ui/password-input.svelte':
    'Campo de contraseña con alternar visibilidad, ARIA y límites compartidos con auth.',
};

const SHADCN_SVELTE =
  'Primitivo shadcn-svelte del panel; apariencia vía tokens CSS del tema, sin lógica de negocio.';

const SHADCN_BARRELS = {
  'lib/components/ui/alert/index.ts':
    'Barrel del componente Alert y variantes semánticas del panel.',
  'lib/components/ui/badge/index.ts': 'Barrel de Badge para estados en tablas y fichas.',
  'lib/components/ui/button/index.ts': 'Barrel de Button (incluye estado `loading` del panel).',
  'lib/components/ui/card/index.ts': 'Barrel de Card para agrupar formularios y resúmenes.',
  'lib/components/ui/dialog/index.ts': 'Barrel de Dialog para modales y confirmaciones.',
  'lib/components/ui/dropdown-menu/index.ts': 'Barrel de menús desplegables en tablas y topbar.',
  'lib/components/ui/input/index.ts': 'Barrel del input de texto estándar.',
  'lib/components/ui/table/index.ts': 'Barrel de Table usado por TanStack y listados CRUD.',
};

const SHADCN_PATHS = [
  'lib/components/ui/card/card.svelte',
  'lib/components/ui/card/card-content.svelte',
  'lib/components/ui/card/card-description.svelte',
  'lib/components/ui/card/card-header.svelte',
  'lib/components/ui/card/card-title.svelte',
  'lib/components/ui/dialog/body.svelte',
  'lib/components/ui/dialog/close.svelte',
  'lib/components/ui/dialog/content.svelte',
  'lib/components/ui/dialog/description.svelte',
  'lib/components/ui/dialog/footer.svelte',
  'lib/components/ui/dialog/header.svelte',
  'lib/components/ui/dialog/root.svelte',
  'lib/components/ui/dialog/title.svelte',
  'lib/components/ui/dialog/trigger.svelte',
  'lib/components/ui/input/input.svelte',
  'lib/components/ui/table/body.svelte',
  'lib/components/ui/table/caption.svelte',
  'lib/components/ui/table/cell.svelte',
  'lib/components/ui/table/empty.svelte',
  'lib/components/ui/table/footer.svelte',
  'lib/components/ui/table/head.svelte',
  'lib/components/ui/table/header.svelte',
  'lib/components/ui/table/pagination.svelte',
  'lib/components/ui/table/root.svelte',
  'lib/components/ui/table/row.svelte',
];

for (const rel of SHADCN_PATHS) MODULE_DOCS[rel] = SHADCN_SVELTE;
for (const [rel, text] of Object.entries(SHADCN_BARRELS)) MODULE_DOCS[rel] = text;

function block(text) {
  return `/**\n * ${text}\n */\n`;
}

function hasDoc(content, isSvelte) {
  if (isSvelte) {
    const m = content.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    if (!m) return false;
    const script = m[1].trim();
    return script.startsWith('/**') || script.startsWith('//');
  }
  return content.trimStart().startsWith('/**');
}

function applyTs(filePath, text) {
  const rel = path.relative(path.join(root, 'src'), filePath).replace(/\\/g, '/');
  const doc = MODULE_DOCS[rel];
  if (!doc) {
    console.warn('skip (no doc):', rel);
    return false;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  if (hasDoc(content, false)) return false;
  fs.writeFileSync(filePath, block(doc) + content, 'utf8');
  return true;
}

function applySvelte(filePath, text) {
  const rel = path.relative(path.join(root, 'src'), filePath).replace(/\\/g, '/');
  const doc = MODULE_DOCS[rel];
  if (!doc) {
    console.warn('skip (no doc):', rel);
    return false;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  if (hasDoc(content, true)) return false;
  content = content.replace(/(<script[^>]*>)(\s*)/i, `$1\n${block(doc).trimEnd()}\n`);
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

const audit = JSON.parse(
  fs.readFileSync(path.join(root, 'scripts', 'audit-docs-result.json'), 'utf8'),
);
const targets = audit.report.filter((r) => r.status === 'sin-funciones');

let applied = 0;
for (const { rel } of targets) {
  const full = path.join(root, 'src', rel.replace(/^src\//, ''));
  if (!fs.existsSync(full)) {
    console.warn('missing', full);
    continue;
  }
  const ok = rel.endsWith('.svelte') ? applySvelte(full) : applyTs(full);
  if (ok) {
    applied++;
    console.log('applied', rel);
  }
}

console.log('Total applied:', applied);
