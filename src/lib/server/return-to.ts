const DEFAULT_RETURN_TO = '/dashboard';

/** Acepta únicamente rutas del panel para evitar redirecciones externas tras iniciar sesión. */
export function safeReturnTo(requested: string | null, origin: string): string {
  if (
    !requested ||
    !requested.startsWith('/') ||
    requested.startsWith('//') ||
    requested.includes('\\') ||
    /[\u0000-\u001f\u007f]/u.test(requested)
  ) {
    return DEFAULT_RETURN_TO;
  }

  try {
    const target = new URL(requested, origin);
    if (target.origin !== origin || target.pathname.includes('\\')) return DEFAULT_RETURN_TO;
    return `${target.pathname}${target.search}`;
  } catch {
    return DEFAULT_RETURN_TO;
  }
}
