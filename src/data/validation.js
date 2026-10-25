/**
 * Validation for JSON backup files produced by this app (or hand-crafted
 * ones). Used before anything from an imported file is written to
 * IndexedDB, so a corrupted or malicious file can never crash the app or
 * silently clobber existing data.
 */

function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isValidNote(n) {
  return (
    isPlainObject(n) &&
    typeof n.id === 'string' &&
    typeof n.title === 'string' &&
    typeof n.content === 'string' &&
    (n.folderId === null || typeof n.folderId === 'string') &&
    Array.isArray(n.tags) &&
    typeof n.createdAt === 'string' &&
    typeof n.updatedAt === 'string'
  )
}

function isValidFolder(f) {
  return (
    isPlainObject(f) &&
    typeof f.id === 'string' &&
    typeof f.name === 'string' &&
    (f.parentId === null || typeof f.parentId === 'string')
  )
}

function isValidTag(t) {
  return isPlainObject(t) && typeof t.id === 'string' && typeof t.name === 'string'
}

/**
 * Validates the shape of a parsed backup JSON object.
 * @returns {{ ok: true } | { ok: false, errors: string[] }}
 */
export function validateBackup(data) {
  const errors = []

  if (!isPlainObject(data)) {
    return { ok: false, errors: ['File does not contain a JSON object.'] }
  }
  if (typeof data.version !== 'number') {
    errors.push('Missing or invalid "version" field.')
  }
  if (!Array.isArray(data.notes)) {
    errors.push('Missing or invalid "notes" array.')
  } else {
    const badIndex = data.notes.findIndex((n) => !isValidNote(n))
    if (badIndex !== -1) errors.push(`Note at index ${badIndex} is missing required fields.`)
  }
  if (!Array.isArray(data.folders)) {
    errors.push('Missing or invalid "folders" array.')
  } else {
    const badIndex = data.folders.findIndex((f) => !isValidFolder(f))
    if (badIndex !== -1) errors.push(`Folder at index ${badIndex} is missing required fields.`)
  }
  if (data.tags !== undefined && !Array.isArray(data.tags)) {
    errors.push('Invalid "tags" field (expected an array).')
  } else if (Array.isArray(data.tags)) {
    const badIndex = data.tags.findIndex((t) => !isValidTag(t))
    if (badIndex !== -1) errors.push(`Tag at index ${badIndex} is missing required fields.`)
  }
  if (data.settings !== undefined && !isPlainObject(data.settings)) {
    errors.push('Invalid "settings" field (expected an object).')
  }

  return errors.length ? { ok: false, errors } : { ok: true, errors: [] }
}

/** Validates a single exported note file (used for single-note import, if ever added). */
export function validateSingleNote(data) {
  if (!isValidNote(data)) {
    return { ok: false, errors: ['File does not look like a valid note export.'] }
  }
  return { ok: true, errors: [] }
}
