/** Serializa consultas administrativas omitiendo valores vacíos. */

/** Valores admitidos en parámetros de query string del panel. */
export type QueryValue = string | number | boolean | undefined;

/** Concatena path y query omitiendo claves con valor vacío o indefinido. */
export function withQuery(path: string, values: Record<string, QueryValue>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}
