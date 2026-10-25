/**
 * JSON backup / restore + single note export.
 *
 * This is the "portability" layer described in the project plan: it never
 * touches IndexedDB directly, it only produces/consumes plain JSON and
 * hands validated, ready-to-store records back to the caller (the
 * DataContext), which decides whether to merge or replace.
 */

import { SCHEMA_VERSION, createNote } from './schema.js'
import { validateBackup } from './validation.js'
import { generateId } from '../utils/id.js'
import { nowIso } from '../utils/date.js'

export function buildBackup({ notes, folders, tags, settings }) {
  return {
    version: SCHEMA_VERSION,
    exportedAt: nowIso(),
    notes,
    folders,
    tags,
    settings,
  }
}

export function buildSingleNoteExport(note) {
  return {
    version: SCHEMA_VERSION,
    exportedAt: nowIso(),
    kind: 'single-note',
    note,
  }
}

function slugifyFilename(name) {
  return (name || 'untitled')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60) || 'untitled'
}

/** Triggers a browser download of the given object as a .json file. */
export function downloadJson(filename, data) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function exportAllNotes({ notes, folders, tags, settings }) {
  const backup = buildBackup({ notes, folders, tags, settings })
  downloadJson(`notepad-backup-${new Date().toISOString().slice(0, 10)}.json`, backup)
}

export function exportNote(note) {
  const payload = buildSingleNoteExport(note)
  downloadJson(`note-${slugifyFilename(note.title)}`, payload)
}

/** Reads a File (from an <input type="file"> or drop event) as parsed JSON. */
export function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided.'))
    if (file.size > 25 * 1024 * 1024) {
      return reject(new Error('File is too large (max 25MB).'))
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the file.'))
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)))
      } catch {
        reject(new Error('File is not valid JSON.'))
      }
    }
    reader.readAsText(file)
  })
}

/**
 * Validates + normalizes an imported full backup.
 * Always generates FRESH ids for incoming records (remapping folderId/tags
 * references) so importing can never silently overwrite existing notes.
 * The caller decides whether to merge these alongside existing data or
 * replace everything (explicit, user-confirmed "Restore" action).
 *
 * @returns {{ ok: true, data: {notes, folders, tags, settings} } | { ok: false, errors: string[] }}
 */
export function prepareImportedBackup(raw, { remapIds = true } = {}) {
  const result = validateBackup(raw)
  if (!result.ok) return result

  if (!remapIds) {
    return {
      ok: true,
      data: {
        notes: raw.notes,
        folders: raw.folders,
        tags: raw.tags ?? [],
        settings: raw.settings,
      },
    }
  }

  const folderIdMap = new Map()
  const tagIdMap = new Map()

  const folders = (raw.folders ?? []).map((f) => {
    const newId = generateId()
    folderIdMap.set(f.id, newId)
    return { ...f, id: newId }
  })
  // second pass to remap parentId references now that all new ids exist
  folders.forEach((f) => {
    if (f.parentId && folderIdMap.has(f.parentId)) {
      f.parentId = folderIdMap.get(f.parentId)
    } else {
      f.parentId = null
    }
  })

  const tags = (raw.tags ?? []).map((t) => {
    const newId = generateId()
    tagIdMap.set(t.id, newId)
    return { ...t, id: newId }
  })

  const notes = (raw.notes ?? []).map((n) => {
    const newId = generateId()
    return {
      ...createNote(),
      ...n,
      id: newId,
      folderId: n.folderId && folderIdMap.has(n.folderId) ? folderIdMap.get(n.folderId) : null,
      tags: (n.tags ?? []).map((tagId) => tagIdMap.get(tagId)).filter(Boolean),
    }
  })

  return { ok: true, data: { notes, folders, tags, settings: raw.settings } }
}

/** Validates + prepares a single-note export file for import as a new note. */
export function prepareImportedNote(raw) {
  const payload = raw && raw.kind === 'single-note' ? raw.note : raw
  const check = validateBackup({ version: 1, notes: [payload], folders: [] })
  if (!check.ok) return { ok: false, errors: check.errors }
  const note = { ...createNote(), ...payload, id: generateId(), folderId: null }
  return { ok: true, data: note }
}
