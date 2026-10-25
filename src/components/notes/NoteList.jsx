import { useMemo, useState } from 'react'
import { useData } from '../../context/DataContext.jsx'
import { useFilteredNotes } from '../../hooks/useFilteredNotes.js'
import { previewText } from '../../utils/text.js'
import { formatRelative } from '../../utils/date.js'
import { stripHtml } from '../../utils/text.js'
import Icon from '../icons/Icon.jsx'
import IconButton from '../ui/IconButton.jsx'
import { SearchField } from '../ui/TextField.jsx'
import { DropdownMenu, useContextMenu } from '../ui/Menu.jsx'
import ConfirmDialog from '../ui/ConfirmDialog.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import { useToast } from '../ui/ToastProvider.jsx'
import './NoteList.css'

const VIEW_TITLES = {
  all: 'All Notes',
  recent: 'Recent',
  favorites: 'Favorites',
  pinned: 'Pinned',
  archived: 'Archived',
  trash: 'Trash',
}

const SORT_LABELS = {
  updatedAt: 'Last modified',
  createdAt: 'Date created',
  title: 'Title',
}

export default function NoteList() {
  const data = useData()
  const notify = useToast()
  const { openMenu, menu } = useContextMenu()
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false)

  const foldersById = useMemo(() => new Map(data.folders.map((f) => [f.id, f])), [data.folders])

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

  const title =
    data.activeView === 'folder'
      ? (foldersById.get(data.activeFolderId)?.name ?? 'Folder')
      : (VIEW_TITLES[data.activeView] ?? 'Notes')

  function noteMenuItems(note) {
    const items = [
      {
        label: note.pinned ? 'Unpin' : 'Pin',
        icon: 'pin',
        onClick: () => data.togglePinned(note.id),
      },
      {
        label: note.favorite ? 'Remove from favorites' : 'Add to favorites',
        icon: 'star',
        onClick: () => data.toggleFavorite(note.id),
      },
      { label: 'Duplicate', icon: 'copy', onClick: () => data.duplicateNote(note.id) },
      {
        label: 'Copy content',
        icon: 'copy',
        onClick: () => {
          navigator.clipboard?.writeText(stripHtml(note.content))
          notify('Note content copied to clipboard', { variant: 'success' })
        },
      },
      { label: 'Export note (JSON)', icon: 'download', onClick: () => data.exportOneNote(note.id) },
      { separator: true },
    ]
    if (note.trashed) {
      items.push(
        { label: 'Restore', icon: 'rotate-ccw', onClick: () => data.restoreNote(note.id) },
        { label: 'Delete forever', icon: 'trash', danger: true, onClick: () => setConfirmDeleteId(note.id) },
      )
    } else {
      items.push(
        {
          label: note.archived ? 'Unarchive' : 'Archive',
          icon: 'archive',
          onClick: () => data.toggleArchived(note.id),
        },
        { label: 'Move to Trash', icon: 'trash', danger: true, onClick: () => data.trashNote(note.id) },
      )
    }
    return items
  }

  return (
    <div className="note-list">
      <div className="note-list-header">
        <div className="note-list-title-row">
          <h2>{title}</h2>
          <div className="note-list-controls">
            {data.activeView === 'trash' && filtered.length > 0 && (
              <IconButton icon="trash" label="Empty trash" variant="danger" onClick={() => setConfirmEmptyTrash(true)} />
            )}
            <DropdownMenu
              align="right"
              trigger={(toggle) => <IconButton icon="more-horizontal" label="Sort notes" onClick={toggle} />}
              items={[
                ...Object.entries(SORT_LABELS).map(([key, label]) => ({
                  key,
                  label,
                  icon: data.settings.sortBy === key ? 'check' : undefined,
                  onClick: () => data.updateSettings({ sortBy: key }),
                })),
                { separator: true },
                {
                  label: data.settings.sortDirection === 'asc' ? 'Descending' : 'Ascending',
                  icon: data.settings.sortDirection === 'asc' ? 'chevron-down' : 'chevron-right',
                  onClick: () =>
                    data.updateSettings({ sortDirection: data.settings.sortDirection === 'asc' ? 'desc' : 'asc' }),
                },
              ]}
            />
          </div>
        </div>
        <SearchField
          value={data.searchQuery}
          onChange={(e) => data.setSearchQuery(e.target.value)}
          placeholder="Search by title or content…"
        />
      </div>

      <div className="note-list-items">
        {filtered.length === 0 && (
          <EmptyState
            icon={data.activeView === 'trash' ? 'trash' : 'file-text'}
            title={data.searchQuery ? 'No matches' : 'No notes here yet'}
            description={
              data.searchQuery
                ? 'Try a different search term.'
                : 'Create a note to get started, or pick another view from the sidebar.'
            }
            actionLabel={!data.searchQuery && data.activeView !== 'trash' ? 'New note' : undefined}
            onAction={() => data.addNote()}
          />
        )}
        {filtered.map((note) => {
          const folder = note.folderId ? foldersById.get(note.folderId) : null
          return (
            <button
              key={note.id}
              className={`note-item ${note.id === data.selectedNoteId ? 'active' : ''}`}
              onClick={() => data.setSelectedNoteId(note.id)}
              onContextMenu={(e) => openMenu(e, noteMenuItems(note))}
            >
              <div className="note-item-top">
                <span className={`note-item-title ${note.title ? '' : 'untitled'}`}>{note.title || 'Untitled'}</span>
                <span className="note-item-icons">
                  {note.pinned && <Icon name="pin" size={13} />}
                  {note.favorite && <Icon name="star" size={13} />}
                </span>
              </div>
              <span className="note-item-preview">{previewText(note.content, 90) || 'No additional text'}</span>
              <span className="note-item-meta">
                <span>{formatRelative(note.updatedAt)}</span>
                {folder && (
                  <span className="folder-chip">
                    <Icon name="folder" size={11} />
                    {folder.name}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {menu}

      <ConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete this note forever?"
        description="This cannot be undone."
        confirmLabel="Delete forever"
        onConfirm={() => {
          data.permanentlyDeleteNote(confirmDeleteId)
          if (data.selectedNoteId === confirmDeleteId) data.setSelectedNoteId(null)
        }}
      />

      <ConfirmDialog
        open={confirmEmptyTrash}
        onClose={() => setConfirmEmptyTrash(false)}
        title="Empty Trash?"
        description="All notes in Trash will be permanently deleted."
        confirmLabel="Empty Trash"
        onConfirm={() => {
          data.emptyTrash()
          data.setSelectedNoteId(null)
        }}
      />
    </div>
  )
}
