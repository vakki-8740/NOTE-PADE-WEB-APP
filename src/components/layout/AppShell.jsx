import { useEffect, useState } from 'react'
import { useData } from '../../context/DataContext.jsx'
import Sidebar from './Sidebar.jsx'
import NoteList from '../notes/NoteList.jsx'
import NoteEditor from '../editor/NoteEditor.jsx'
import IconButton from '../ui/IconButton.jsx'
import './AppShell.css'

export default function AppShell() {
  const data = useData()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobilePane, setMobilePane] = useState('list') // 'list' | 'editor'

  // Switch to the editor pane automatically on mobile once a note is chosen.
  useEffect(() => {
    if (data.selectedNoteId) setMobilePane('editor')
  }, [data.selectedNoteId])

  const selectedNote = data.notes.find((n) => n.id === data.selectedNoteId) ?? null

  return (
    <div
      className={`app-shell ${data.settings.sidebarCollapsed ? 'sidebar-collapsed' : ''} ${sidebarOpen ? 'sidebar-open' : ''}`}
      data-mobile-pane={mobilePane}
    >
      <div className="app-body">
        <div className="pane pane-sidebar">
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
        </div>
        <div className="sidebar-scrim" onClick={() => setSidebarOpen(false)} />

        <div className="pane pane-list">
          <div className="mobile-topbar">
            <IconButton icon="menu" label="Open menu" onClick={() => setSidebarOpen(true)} />
            <span className="mobile-title">Notes</span>
            <IconButton icon="plus" label="New note" onClick={() => data.addNote()} />
          </div>
          <NoteList />
        </div>

        <div className="pane pane-editor">
          <div className="mobile-topbar">
            <IconButton icon="arrow-left" label="Back to notes" onClick={() => setMobilePane('list')} />
            <span className="mobile-title">{selectedNote?.title || 'Note'}</span>
          </div>
          <NoteEditor />
        </div>
      </div>
    </div>
  )
}
