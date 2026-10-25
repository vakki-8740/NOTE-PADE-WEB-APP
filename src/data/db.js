/**
 * Browser persistence layer, built on IndexedDB (via the tiny `idb` wrapper).
 *
 * This is the ONLY place in the app that talks to IndexedDB directly.
 * Everything else (context/hooks/components) goes through the functions
 * exported here, so the storage engine can be swapped later (see the
 * "future storage migration" note in the project plan) without touching
 * the rest of the app.
 *
 * Object stores:
 *   - notes    (keyPath: id)
 *   - folders  (keyPath: id)
 *   - tags     (keyPath: id)
 *   - settings (keyPath: key) -> single record keyed "app"
 *   - meta     (keyPath: key) -> schema version bookkeeping
 */

import { openDB } from 'idb'
import { SCHEMA_VERSION, defaultSettings } from './schema.js'

const DB_NAME = 'advanced-notepad'
const DB_VERSION = 1
const SETTINGS_KEY = 'app'

let dbPromise = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('notes')) {
          const notes = db.createObjectStore('notes', { keyPath: 'id' })
          notes.createIndex('folderId', 'folderId')
          notes.createIndex('updatedAt', 'updatedAt')
          notes.createIndex('trashed', 'trashed')
        }
        if (!db.objectStoreNames.contains('folders')) {
          db.createObjectStore('folders', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('tags')) {
          db.createObjectStore('tags', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' })
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

/* ----------------------------- bulk loading ----------------------------- */

export async function loadAllData() {
  const db = await getDb()
  const [notes, folders, tags, settingsRow] = await Promise.all([
    db.getAll('notes'),
    db.getAll('folders'),
    db.getAll('tags'),
    db.get('settings', SETTINGS_KEY),
  ])
  return {
    notes,
    folders,
    tags,
    settings: settingsRow ? settingsRow.value : defaultSettings(),
  }
}

/* --------------------------------- notes --------------------------------- */

export async function putNote(note) {
  const db = await getDb()
  await db.put('notes', note)
  return note
}

export async function deleteNoteHard(id) {
  const db = await getDb()
  await db.delete('notes', id)
}

/* -------------------------------- folders -------------------------------- */

export async function putFolder(folder) {
  const db = await getDb()
  await db.put('folders', folder)
  return folder
}

export async function deleteFolderHard(id) {
  const db = await getDb()
  await db.delete('folders', id)
}

/* ---------------------------------- tags ---------------------------------- */

export async function putTag(tag) {
  const db = await getDb()
  await db.put('tags', tag)
  return tag
}

export async function deleteTagHard(id) {
  const db = await getDb()
  await db.delete('tags', id)
}

/* -------------------------------- settings -------------------------------- */

export async function putSettings(settings) {
  const db = await getDb()
  await db.put('settings', { key: SETTINGS_KEY, value: settings })
  return settings
}

/* ------------------------------ backup/restore ----------------------------- */

/** Replace ALL data atomically. Used by "Restore from backup". */
export async function replaceAllData({ notes, folders, tags, settings }) {
  const db = await getDb()
  const tx = db.transaction(['notes', 'folders', 'tags', 'settings', 'meta'], 'readwrite')
  await Promise.all([
    tx.objectStore('notes').clear(),
    tx.objectStore('folders').clear(),
    tx.objectStore('tags').clear(),
  ])
  await Promise.all([
    ...notes.map((n) => tx.objectStore('notes').put(n)),
    ...folders.map((f) => tx.objectStore('folders').put(f)),
    ...tags.map((t) => tx.objectStore('tags').put(t)),
    tx.objectStore('settings').put({ key: SETTINGS_KEY, value: settings ?? defaultSettings() }),
    tx.objectStore('meta').put({ key: 'schemaVersion', value: SCHEMA_VERSION }),
  ])
  await tx.done
}

/** Merge imported data into the existing store without deleting anything,
 *  giving imported records fresh ids to avoid silent overwrites. */
export async function mergeData({ notes, folders, tags }) {
  const db = await getDb()
  const tx = db.transaction(['notes', 'folders', 'tags'], 'readwrite')
  await Promise.all([
    ...notes.map((n) => tx.objectStore('notes').put(n)),
    ...folders.map((f) => tx.objectStore('folders').put(f)),
    ...tags.map((t) => tx.objectStore('tags').put(t)),
  ])
  await tx.done
}

export async function wipeAllData() {
  const db = await getDb()
  const tx = db.transaction(['notes', 'folders', 'tags', 'settings', 'meta'], 'readwrite')
  await Promise.all([
    tx.objectStore('notes').clear(),
    tx.objectStore('folders').clear(),
    tx.objectStore('tags').clear(),
    tx.objectStore('settings').clear(),
    tx.objectStore('meta').clear(),
  ])
  await tx.done
}

/** Exposed for tests / advanced tooling. Not used by the app at runtime. */
export function _resetDbHandleForTests() {
  dbPromise = null
}
