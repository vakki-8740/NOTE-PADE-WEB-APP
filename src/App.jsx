import { useMemo, useRef } from 'react'
import { useData } from './context/DataContext.jsx'
import { useFilteredNotes } from './hooks/useFilteredNotes.js'
import { previewText, wordCount, charCount } from './utils/text.js'
import { formatRelative } from './utils/date.js'
import './App.css'

/**
 * TEMPORARY SCAFFOLD UI
 * ---------------------
 * This is a plain, unstyled wiring layer used only to exercise the data
 * layer (IndexedDB persistence, CRUD, search/filter, import/export) end
 * to end while we wait for the provided UI component library ZIP.
 *
 * Nothing here represents the final iOS-inspired visual design — once the
 * UI kit is available, these elements will be rebuilt using its
 * components, per the approved project plan (see PLAN.md).
 */
export default function App() {
  const data = useData()
  const fileInputRef = useRef(null)

  const filtered = useFilteredNotes({
    notes: data.notes,
    folders: data.folders,
    activeView: data.activeView,
    activeFolderId: data.activeFolderId,
    activeTagId: data.activeTagId,
    searchQuery: data.searchQuery,
    sortBy: data.settings.sortBy,
    sortDirection: data.settings.sortDirection,
  })

  const selectedNote = useMemo(
    () => data.notes.find((n) => n.id === data.selectedNoteId) ?? null,
    [data.notes, data.selectedNoteId],
  )

  if (data.loading) {
    return <div className="scaffold-loading">Loading your notes…</div>
  }

  const views = [
    { id: 'all', label: 'All Notes' },
    { id: 'recent', label: 'Recent' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'pinned', label: 'Pinned' },
    { id: 'archived', label: 'Archived' },
    { id: 'trash', label: 'Trash' },
  ]

  async function handleImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const result = await data.importBackup(file, { mode: 'merge' })
    if (!result.ok) {
      alert(`Import failed:\n${result.errors.join('\n')}`)
    } else {
      alert(`Imported ${result.imported.notes} notes and ${result.imported.folders} folders.`)
    }
  }

  return (
    <div className="scaffold-app">
      <div className="scaffold-banner">
        Temporary scaffold UI — functional only. Final iOS-style design pending UI kit. Save status:{' '}
        <strong>{data.saveStatus}</strong>
      </div>
      <div className="scaffold-layout">
        <aside className="scaffold-sidebar">
          <button onClick={() => data.addNote()}>+ New Note</button>
          <nav>
            {views.map((v) => (
              <button
                key={v.id}
                className={data.activeView === v.id ? 'active' : ''}
                onClick={() => {
                  data.setActiveView(v.id)
                  data.setActiveFolderId(null)
                }}
              >
                {v.label}
              </button>
            ))}
          </nav>
          <h4>Folders</h4>
          <button onClick={() => data.addFolder({ name: 'New Folder' })}>+ New Folder</button>
          <ul>
            {data.folders.map((f) => (
              <li key={f.id}>
                <button
                  className={data.activeView === 'folder' && data.activeFolderId === f.id ? 'active' : ''}
                  onClick={() => {
                    data.setActiveView('folder')
                    data.setActiveFolderId(f.id)
                  }}
                >
                  {f.name} ({data.folderNoteCounts.get(f.id) ?? 0})
                </button>
              </li>
            ))}
          </ul>
          <h4>Backup</h4>
          <button onClick={data.exportAll}>Export All (JSON)</button>
          <button onClick={() => fileInputRef.current?.click()}>Import JSON</button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
        </aside>

        <section className="scaffold-list">
          <input
            type="search"
            placeholder="Search notes…"
            value={data.searchQuery}
            onChange={(e) => data.setSearchQuery(e.target.value)}
          />
          <ul>
            {filtered.map((n) => (
              <li key={n.id}>
                <button
                  className={n.id === data.selectedNoteId ? 'active' : ''}
                  onClick={() => data.setSelectedNoteId(n.id)}
                >
                  <strong>{n.title || 'Untitled'}</strong>
                  {n.pinned ? ' 📌' : ''}
                  {n.favorite ? ' ★' : ''}
                  <div>{previewText(n.content, 80)}</div>
                  <small>{formatRelative(n.updatedAt)}</small>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="empty">No notes here.</li>}
          </ul>
        </section>

        <section className="scaffold-editor">
          {!selectedNote && <div className="empty">Select or create a note.</div>}
          {selectedNote && (
            <>
              <input
                className="title-input"
                value={selectedNote.title}
                placeholder="Title"
                onChange={(e) => data.updateNote(selectedNote.id, { title: e.target.value })}
              />
              <div className="toolbar">
                <button onClick={() => data.togglePinned(selectedNote.id)}>
                  {selectedNote.pinned ? 'Unpin' : 'Pin'}
                </button>
                <button onClick={() => data.toggleFavorite(selectedNote.id)}>
                  {selectedNote.favorite ? 'Unfavorite' : 'Favorite'}
                </button>
                <button onClick={() => data.toggleArchived(selectedNote.id)}>
                  {selectedNote.archived ? 'Unarchive' : 'Archive'}
                </button>
                <button onClick={() => data.duplicateNote(selectedNote.id)}>Duplicate</button>
                <button onClick={() => data.exportOneNote(selectedNote.id)}>Export</button>
                {!selectedNote.trashed && (
                  <button onClick={() => data.trashNote(selectedNote.id)}>Delete</button>
                )}
                {selectedNote.trashed && (
                  <>
                    <button onClick={() => data.restoreNote(selectedNote.id)}>Restore</button>
                    <button onClick={() => data.permanentlyDeleteNote(selectedNote.id)}>
                      Delete Forever
                    </button>
                  </>
                )}
              </div>
              <textarea
                className="content-input"
                value={selectedNote.content}
                placeholder="Start writing…"
                onChange={(e) => data.updateNote(selectedNote.id, { content: e.target.value })}
              />
              <div className="status-bar">
                {wordCount(selectedNote.content)} words · {charCount(selectedNote.content)} characters
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
