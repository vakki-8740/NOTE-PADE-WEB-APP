/**
 * Generates a RFC4122-ish unique id.
 * Uses crypto.randomUUID when available (all modern browsers),
 * falls back to a timestamp + random string for older environments.
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  const rand = Math.random().toString(16).slice(2)
  return `id-${Date.now().toString(16)}-${rand}`
}
