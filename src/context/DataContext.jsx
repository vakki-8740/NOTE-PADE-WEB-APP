import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as db from '../data/db.js'
import { createNote, createFolder, createTag, defaultSettings, ROOT_FOLDER_ID } from '../data/schema.js'
import {
  exportAllNotes,
  exportNote as exportNoteFile,
  prepareImportedBackup,
  readJsonFile,
} from '../data/importExport.js'
import { nowIso } from '../utils/date.js'
import { useDebouncedCallback } from '../hooks/useDebouncedCallback.js'

const DataContext = createContext(null)

const AUTOSAVE_DELAY_MS = 500

export function DataProvider({ children }) {
  const [notes, setNotes] = useState([])
  const [folders, setFolders] = useState([])
  const [tags, setTags] = useState([])
  const [settings, setSettings] = useState(defaultSettings())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved | error

  // Ephemeral UI/navigation state shared across Sidebar / NoteList / Editor.
  const [activeView, setActiveView] = useState('all') // all | favorites | pinned | archived | trash | folder | workspace
  const [activeFolderId, setActiveFolderId] = useState(null)
  const [activeTagId, setActiveTagId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNoteId, setSelectedNoteId] = useState(null)

  const pendingWrites = useRef(new Map()) // noteId -> latest note object awaiting persistence

  useEffect(() => {
    let cancelled = false
    db.loadAllData()
      .then((data) => {
        if (cancelled) return
        setNotes(data.notes)
        setFolders(data.folders)
        setTags(data.tags)
        setSettings({ ...defaultSettings(), ...data.settings })
      })
      .catch((err) => {
        console.error('Failed to load data from IndexedDB', err)
        if (!cancelled) setError('Could not load your notes from local storage.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  /* ------------------------------- settings ------------------------------- */

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      db.putSettings(next).catch((err) => console.error('Failed saving settings', err))
      return next
    })
  }, [])

  /* --------------------------------- notes --------------------------------- */

  const flushNote = useCallback(async (note) => {
    setSaveStatus('saving')
    try {
      await db.putNote(note)
      setSaveStatus('saved')
    } catch (err) {
      console.error('Failed to save note', err)
      setSaveStatus('error')
    }
  }, [])

  const debouncedFlush = useDebouncedCallback((noteId) => {
    const note = pendingWrites.current.get(noteId)
    if (note) flushNote(note)
  }, AUTOSAVE_DELAY_MS)

  const addNote = useCallback(
    (overrides = {}) => {
      const note = createNote({ folderId: activeFolderId, ...overrides })
      setNotes((prev) => [note, ...prev])
      flushNote(note)
      setSelectedNoteId(note.id)
      return note
    },
    [activeFolderId, flushNote],
  )

  /** Immediate local update + debounced persistence (used while typing). */
  const updateNote = useCallback(
    (id, patch) => {
      setNotes((prev) =>
        prev.map((n) => {
          if (n.id !== id) return n
          const updated = { ...n, ...patch, updatedAt: nowIso() }
          pendingWrites.current.set(id, updated)
          return updated
        }),
      )
      debouncedFlush(id)
    },
    [debouncedFlush],
  )

  /** Persist immediately, skipping the debounce (used for toggles, moves, etc). */
  const updateNoteImmediate = useCallback((id, patch) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n
        const updated = { ...n, ...patch, updatedAt: nowIso() }
        flushNoteRef.current(updated)
        return updated
      }),
    )
  }, [])
  const flushNoteRef = useRef(flushNote)
  useEffect(() => {
    flushNoteRef.current = flushNote
  }, [flushNote])

  const duplicateNote = useCallback(
    (id) => {
      const original = notes.find((n) => n.id === id)
      if (!original) return
      const copy = createNote({
        ...original,
        id: undefined,
        title: original.title ? `${original.title} (copy)` : '',
        pinned: false,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      })
      setNotes((prev) => [copy, ...prev])
      flushNote(copy)
      return copy
    },
    [notes, flushNote],
  )

  const trashNote = useCallback(
    (id) => updateNoteImmediate(id, { trashed: true, deletedAt: nowIso(), pinned: false }),
    [updateNoteImmediate],
  )

  const restoreNote = useCallback(
    (id) => updateNoteImmediate(id, { trashed: false, deletedAt: null }),
    [updateNoteImmediate],
  )

  const permanentlyDeleteNote = useCallback((id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    db.deleteNoteHard(id).catch((err) => console.error('Failed to delete note', err))
  }, [])

  const emptyTrash = useCallback(() => {
    setNotes((prev) => {
      const toDelete = prev.filter((n) => n.trashed)
      toDelete.forEach((n) => db.deleteNoteHard(n.id).catch((err) => console.error(err)))
      return prev.filter((n) => !n.trashed)
    })
  }, [])

  const toggleFavorite = useCallback(
    (id) => {
      const note = notes.find((n) => n.id === id)
      if (note) updateNoteImmediate(id, { favorite: !note.favorite })
    },
    [notes, updateNoteImmediate],
  )

  const togglePinned = useCallback(
    (id) => {
      const note = notes.find((n) => n.id === id)
      if (note) updateNoteImmediate(id, { pinned: !note.pinned })
    },
    [notes, updateNoteImmediate],
  )

  const toggleArchived = useCallback(
    (id) => {
      const note = notes.find((n) => n.id === id)
      if (note) updateNoteImmediate(id, { archived: !note.archived, pinned: false })
    },
    [notes, updateNoteImmediate],
  )

  const moveNoteToFolder = useCallback(
    (id, folderId) => updateNoteImmediate(id, { folderId }),
    [updateNoteImmediate],
  )

  const setNoteTags = useCallback(
    (id, tagIds) => updateNoteImmediate(id, { tags: tagIds }),
    [updateNoteImmediate],
  )

  /* -------------------------------- folders -------------------------------- */

  const addFolder = useCallback((overrides = {}) => {
    const folder = createFolder(overrides)
    setFolders((prev) => [...prev, folder])
    db.putFolder(folder).catch((err) => console.error('Failed to save folder', err))
    return folder
  }, [])

  const renameFolder = useCallback((id, name) => {
    setFolders((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f
        const updated = { ...f, name, updatedAt: nowIso() }
        db.putFolder(updated).catch((err) => console.error(err))
        return updated
      }),
    )
  }, [])

  const moveFolder = useCallback((id, parentId) => {
    setFolders((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f
        const updated = { ...f, parentId, updatedAt: nowIso() }
        db.putFolder(updated).catch((err) => console.error(err))
        return updated
      }),
    )
  }, [])

  /** Deletes a folder (and its nested subfolders), safely moving contained
   *  notes to Trash instead of destroying them outright. */
  const deleteFolder = useCallback(
    (id) => {
      setFolders((prevFolders) => {
        const idsToDelete = new Set([id])
        let grew = true
        while (grew) {
          grew = false
          prevFolders.forEach((f) => {
            if (f.parentId && idsToDelete.has(f.parentId) && !idsToDelete.has(f.id)) {
              idsToDelete.add(f.id)
              grew = true
            }
          })
        }
        idsToDelete.forEach((folderId) => db.deleteFolderHard(folderId).catch((err) => console.error(err)))

        setNotes((prevNotes) =>
          prevNotes.map((n) => {
            if (n.folderId && idsToDelete.has(n.folderId)) {
              const updated = { ...n, folderId: null, trashed: true, deletedAt: nowIso() }
              db.putNote(updated).catch((err) => console.error(err))
              return updated
            }
            return n
          }),
        )

        return prevFolders.filter((f) => !idsToDelete.has(f.id))
      })
    },
    [],
  )

  const folderNoteCounts = useMemo(() => {
    const counts = new Map()
    notes.forEach((n) => {
      if (n.trashed || n.archived || !n.folderId) return
      counts.set(n.folderId, (counts.get(n.folderId) ?? 0) + 1)
    })
    return counts
  }, [notes])

  /* ---------------------------------- tags ---------------------------------- */

  const addTag = useCallback((name, color = null) => {
    const tag = createTag({ name, color })
    setTags((prev) => [...prev, tag])
    db.putTag(tag).catch((err) => console.error(err))
    return tag
  }, [])

  const renameTag = useCallback((id, name) => {
    setTags((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const updated = { ...t, name }
        db.putTag(updated).catch((err) => console.error(err))
        return updated
      }),
    )
  }, [])

  const deleteTag = useCallback((id) => {
    setTags((prev) => prev.filter((t) => t.id !== id))
    db.deleteTagHard(id).catch((err) => console.error(err))
    setNotes((prev) =>
      prev.map((n) => {
        if (!n.tags.includes(id)) return n
        const updated = { ...n, tags: n.tags.filter((t) => t !== id) }
        db.putNote(updated).catch((err) => console.error(err))
        return updated
      }),
    )
  }, [])

  /* ---------------------------- import / export ------------------------------ */

  const exportAll = useCallback(() => {
    exportAllNotes({ notes, folders, tags, settings })
  }, [notes, folders, tags, settings])

  const exportOneNote = useCallback(
    (id) => {
      const note = notes.find((n) => n.id === id)
      if (note) exportNoteFile(note)
    },
    [notes],
  )

  /**
   * Imports a backup file. mode: 'merge' (default, safe) keeps everything
   * that already exists and adds the imported records with fresh ids;
   * 'replace' wipes local data first (requires explicit user confirmation
   * in the UI layer — this function never does it implicitly).
   */
  const importBackup = useCallback(async (file, { mode = 'merge' } = {}) => {
    const raw = await readJsonFile(file)
    const prepared = prepareImportedBackup(raw, { remapIds: mode === 'merge' })
    if (!prepared.ok) {
      return { ok: false, errors: prepared.errors }
    }
    const { data } = prepared
    if (mode === 'replace') {
      await db.replaceAllData(data)
      setNotes(data.notes)
      setFolders(data.folders)
      setTags(data.tags ?? [])
      setSettings({ ...defaultSettings(), ...(data.settings ?? {}) })
    } else {
      await db.mergeData(data)
      setNotes((prev) => [...data.notes, ...prev])
      setFolders((prev) => [...prev, ...data.folders])
      setTags((prev) => [...prev, ...(data.tags ?? [])])
    }
    return { ok: true, imported: { notes: data.notes.length, folders: data.folders.length } }
  }, [])

  const value = useMemo(
    () => ({
      notes,
      folders,
      tags,
      settings,
      loading,
      error,
      saveStatus,
      activeView,
      activeFolderId,
      activeTagId,
      searchQuery,
      selectedNoteId,
      setActiveView,
      setActiveFolderId,
      setActiveTagId,
      setSearchQuery,
      setSelectedNoteId,
      folderNoteCounts,
      addNote,
      updateNote,
      updateNoteImmediate,
      duplicateNote,
      trashNote,
      restoreNote,
      permanentlyDeleteNote,
      emptyTrash,
      toggleFavorite,
      togglePinned,
      toggleArchived,
      moveNoteToFolder,
      setNoteTags,
      addFolder,
      renameFolder,
      moveFolder,
      deleteFolder,
      addTag,
      renameTag,
      deleteTag,
      updateSettings,
      exportAll,
      exportOneNote,
      importBackup,
    }),
    [
      notes,
      folders,
      tags,
      settings,
      loading,
      error,
      saveStatus,
      activeView,
      activeFolderId,
      activeTagId,
      searchQuery,
      selectedNoteId,
      folderNoteCounts,
      addNote,
      updateNote,
      updateNoteImmediate,
      duplicateNote,
      trashNote,
      restoreNote,
      permanentlyDeleteNote,
      emptyTrash,
      toggleFavorite,
      togglePinned,
      toggleArchived,
      moveNoteToFolder,
      setNoteTags,
      addFolder,
      renameFolder,
      moveFolder,
      deleteFolder,
      addTag,
      renameTag,
      deleteTag,
      updateSettings,
      exportAll,
      exportOneNote,
      importBackup,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within a <DataProvider>')
  return ctx
}

export { ROOT_FOLDER_ID }
