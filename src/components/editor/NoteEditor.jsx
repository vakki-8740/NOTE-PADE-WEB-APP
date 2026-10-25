import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { TableKit } from '@tiptap/extension-table'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'

import { useData } from '../../context/DataContext.jsx'
import EditorToolbar from './EditorToolbar.jsx'
import Icon from '../icons/Icon.jsx'
import IconButton from '../ui/IconButton.jsx'
import { DropdownMenu } from '../ui/Menu.jsx'
import PromptDialog from '../ui/PromptDialog.jsx'
import ConfirmDialog from '../ui/ConfirmDialog.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import { useToast } from '../ui/ToastProvider.jsx'
import { formatDateTime } from '../../utils/date.js'
import { stripHtml } from '../../utils/text.js'
import './NoteEditor.css'

const EXTENSIONS = [
  StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
  TaskList,
  TaskItem.configure({ nested: true }),
  TableKit.configure({ table: { resizable: false } }),
  Placeholder.configure({ placeholder: 'Start writing…' }),
  CharacterCount,
]

export default function NoteEditor() {
  const data = useData()
  const notify = useToast()
  const note = data.notes.find((n) => n.id === data.selectedNoteId) ?? null
  const loadedNoteId = useRef(null)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const editor = useEditor({
    extensions: EXTENSIONS,
    content: '',
    onUpdate: ({ editor: ed }) => {
      if (!loadedNoteId.current) return
      data.updateNote(loadedNoteId.current, { content: ed.getHTML() })
    },
  })

  // Load the selected note's content into the editor whenever the selection
  // changes (not on every local edit — the editor itself owns that state
  // while typing, so we only resync on a genuine note switch).
  useEffect(() => {
    if (!editor) return
    if (!note) {
      // Nothing to show — <EditorContent> isn't even mounted in this case
      // (see the early return below), so there is no live view to clear.
      loadedNoteId.current = null
      return
    }
    if (loadedNoteId.current !== note.id) {
      loadedNoteId.current = note.id
      editor.commands.setContent(note.content || '', false)
    }
  }, [editor, note])

  if (!note) {
    return (
      <div className="note-editor">
        <EmptyState
          icon="note"
          title="No note selected"
          description="Choose a note from the list, or create a new one to start writing."
          actionLabel="New note"
          onAction={() => data.addNote()}
        />
      </div>
    )
  }

  const words = editor?.storage.characterCount.words() ?? 0
  const chars = editor?.storage.characterCount.characters() ?? 0

  return (
    <div className="note-editor" style={{ '--editor-font-size': `${data.settings.editorFontSize}px` }}>
      <div className="editor-head">
        <input
          className="title-input"
          value={note.title}
          placeholder="Untitled note"
          onChange={(e) => data.updateNote(note.id, { title: e.target.value })}
        />
      </div>

      <div className="editor-meta-row">
        <IconButton
          icon="pin"
          label={note.pinned ? 'Unpin' : 'Pin'}
          active={note.pinned}
          onClick={() => data.togglePinned(note.id)}
        />
        <IconButton
          icon="star"
          label={note.favorite ? 'Remove from favorites' : 'Add to favorites'}
          active={note.favorite}
          onClick={() => data.toggleFavorite(note.id)}
        />
        <IconButton
          icon="archive"
          label={note.archived ? 'Unarchive' : 'Archive'}
          active={note.archived}
          onClick={() => data.toggleArchived(note.id)}
        />
        <DropdownMenu
          trigger={(toggle) => <IconButton icon="more-horizontal" label="More actions" onClick={toggle} />}
          items={[
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
            note.trashed
              ? { label: 'Restore from Trash', icon: 'rotate-ccw', onClick: () => data.restoreNote(note.id) }
              : { label: 'Move to Trash', icon: 'trash', danger: true, onClick: () => data.trashNote(note.id) },
            ...(note.trashed
              ? [{ label: 'Delete forever', icon: 'trash', danger: true, onClick: () => setConfirmDeleteOpen(true) }]
              : []),
          ]}
        />
        <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--muted)' }}>
          Edited {formatDateTime(note.updatedAt)}
        </span>
      </div>

      <EditorToolbar editor={editor} onRequestLink={() => setLinkDialogOpen(true)} />

      <div className="editor-body">
        <EditorContent editor={editor} className="tiptap-content" />
      </div>

      <div className="editor-footer">
        <span>
          {words} words · {chars} characters
        </span>
        <span className={`status ${data.saveStatus}`}>
          <Icon name={data.saveStatus === 'error' ? 'alert-triangle' : 'cloud-check'} size={13} />
          {data.saveStatus === 'saving' && 'Saving…'}
          {data.saveStatus === 'saved' && 'Saved'}
          {data.saveStatus === 'error' && 'Save failed'}
          {data.saveStatus === 'idle' && 'Up to date'}
        </span>
      </div>

      <PromptDialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        title="Insert link"
        label="URL"
        placeholder="https://example.com"
        confirmLabel="Insert"
        icon="link"
        onSubmit={(url) => editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Delete this note forever?"
        description="This cannot be undone."
        confirmLabel="Delete forever"
        onConfirm={() => {
          data.permanentlyDeleteNote(note.id)
          data.setSelectedNoteId(null)
        }}
      />
    </div>
  )
}
