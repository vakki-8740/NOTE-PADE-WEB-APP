/**
 * Local-first data schema for the Advanced Notepad app.
 *
 * Everything the app knows about is JSON-serializable and fits the shape
 * described below. This is the single source of truth for what a
 * "note", "folder", "tag" or the app "settings" look like, and it is used
 * both by the IndexedDB layer (src/data/db.js) and the JSON
 * import/export layer (src/data/importExport.js).
 *
 *   {
 *     version: 1,
 *     notes:   Note[],
 *     folders: Folder[],
 *     tags:    Tag[],
 *     settings: Settings
 *   }
 *
 * IMPORTANT: this app never talks to a backend or a packaged data.json
 * file. Persistence happens in the browser's IndexedDB (see src/data/db.js).
 * JSON is only used as a portable backup/restore format, not as the live
 * database.
 */

import { generateId } from '../utils/id.js'
import { nowIso } from '../utils/date.js'

export const SCHEMA_VERSION = 1

export const ROOT_FOLDER_ID = null // notes/folders with folderId === null live at the top level

/** @returns {Note} */
export function createNote(overrides = {}) {
  const now = nowIso()
  return {
    id: generateId(),
    title: '',
    content: '', // sanitized HTML produced by the rich text editor
    folderId: ROOT_FOLDER_ID,
    tags: [], // array of tag ids
    favorite: false,
    pinned: false,
    archived: false,
    trashed: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

/** @returns {Folder} */
export function createFolder(overrides = {}) {
  const now = nowIso()
  return {
    id: generateId(),
    name: 'New Folder',
    parentId: ROOT_FOLDER_ID, // supports nested folders/subfolders
    color: null,
    // 'notes' = regular folder shown under "Folders"; 'developer' = shown
    // under the dedicated "Developer Workspace" section. Subfolders are
    // considered part of whichever section their top-level ancestor is in.
    section: 'notes',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

/** @returns {Tag} */
export function createTag(overrides = {}) {
  return {
    id: generateId(),
    name: 'tag',
    color: null,
    createdAt: nowIso(),
    ...overrides,
  }
}

/** @returns {Settings} */
export function defaultSettings() {
  return {
    theme: 'light', // 'light' | 'dark' | 'system'
    editorFontSize: 16,
    sidebarCollapsed: false,
    sortBy: 'updatedAt', // 'updatedAt' | 'createdAt' | 'title'
    sortDirection: 'desc', // 'asc' | 'desc'
    lastOpenedNoteId: null,
    lastOpenedFolderId: ROOT_FOLDER_ID,
  }
}

export function emptyBackup() {
  return {
    version: SCHEMA_VERSION,
    exportedAt: nowIso(),
    notes: [],
    folders: [],
    tags: [],
    settings: defaultSettings(),
  }
}

/**
 * @typedef {Object} Note
 * @property {string} id
 * @property {string} title
 * @property {string} content
 * @property {string|null} folderId
 * @property {string[]} tags
 * @property {boolean} favorite
 * @property {boolean} pinned
 * @property {boolean} archived
 * @property {boolean} trashed
 * @property {string|null} deletedAt
 * @property {string} createdAt
 * @property {string} updatedAt
 *
 * @typedef {Object} Folder
 * @property {string} id
 * @property {string} name
 * @property {string|null} parentId
 * @property {string|null} color
 * @property {string} createdAt
 * @property {string} updatedAt
 *
 * @typedef {Object} Tag
 * @property {string} id
 * @property {string} name
 * @property {string|null} color
 * @property {string} createdAt
 *
 * @typedef {Object} Settings
 * @property {'light'|'dark'|'system'} theme
 * @property {number} editorFontSize
 * @property {boolean} sidebarCollapsed
 * @property {'updatedAt'|'createdAt'|'title'} sortBy
 * @property {'asc'|'desc'} sortDirection
 * @property {string|null} lastOpenedNoteId
 * @property {string|null} lastOpenedFolderId
 */
