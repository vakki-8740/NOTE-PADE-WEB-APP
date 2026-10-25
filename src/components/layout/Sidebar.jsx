import { useMemo, useState } from 'react'
import { useData } from '../../context/DataContext.jsx'
import { buildFolderTree, totalNoteCount } from '../../utils/folderTree.js'
import Icon from '../icons/Icon.jsx'
import Button from '../ui/Button.jsx'
import IconButton from '../ui/IconButton.jsx'
import { DropdownMenu } from '../ui/Menu.jsx'
import PromptDialog from '../ui/PromptDialog.jsx'
import ConfirmDialog from '../ui/ConfirmDialog.jsx'
import { useToast } from '../ui/ToastProvider.jsx'
import SettingsDialog from '../dialogs/SettingsDialog.jsx'
import './Sidebar.css'

const PRIMARY_VIEWS = [
  { id: 'all', label: 'All Notes', icon: 'note' },
  { id: 'recent', label: 'Recent', icon: 'file-text' },
  { id: 'favorites', label: 'Favorites', icon: 'star' },
  { id: 'pinned', label: 'Pinned', icon: 'pin' },
  { id: 'archived', label: 'Archived', icon: 'archive' },
  { id: 'trash', label: 'Trash', icon: 'trash' },
]

export default function Sidebar({ onNavigate }) {
  const data = useData()
  const notify = useToast()
  const collapsed = data.settings.sidebarCollapsed

  const [dialog, setDialog] = useState(null)
  const [expanded, setExpanded] = useState(() => new Set())
  const [settingsOpen, setSettingsOpen] = useState(false)

  const notesFolders = useMemo(() => data.folders.filter((f) => (f.section ?? 'notes') === 'notes'), [data.folders])
  const devFolders = useMemo(() => data.folders.filter((f) => f.section === 'developer'), [data.folders])
  const notesTree = useMemo(() => buildFolderTree(notesFolders), [notesFolders])
  const devTree = useMemo(() => buildFolderTree(devFolders), [devFolders])

  const counts = data.folderNoteCounts

  function selectView(view, folderId = null) {
    data.setActiveView(view)
    data.setActiveFolderId(folderId)
    onNavigate?.()
  }

  function toggleExpand(id) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleNewFolder(section, parentId = null) {
    setDialog({ type: 'new-folder', section, parentId })
  }

  function handleRenameFolder(folder) {
    setDialog({ type: 'rename-folder', id: folder.id, name: folder.name })
  }

  function handleDeleteFolder(folder) {
    setDialog({ type: 'delete-folder', id: folder.id, name: folder.name })
  }

  function renderFolder(folder, depth, section) {
    const isActive = data.activeView === 'folder' && data.activeFolderId === folder.id
    const hasChildren = folder.children.length > 0
    const isOpen = expanded.has(folder.id)
    return (
      <div key={folder.id}>
        <div className="folder-row" style={{ paddingLeft: depth * 14 }}>
          {hasChildren ? (
            <button className="folder-toggle" onClick={() => toggleExpand(folder.id)} aria-label="Toggle subfolders">
              <Icon name={isOpen ? 'chevron-down' : 'chevron-right'} size={13} />
            </button>
          ) : (
            <span className="folder-toggle" />
          )}
          <button className={`side-link ${isActive ? 'active' : ''}`} onClick={() => selectView('folder', folder.id)}>
            <Icon name={isOpen ? 'folder-open' : 'folder'} size={17} />
            <span>{folder.name}</span>
            <span className="count">{totalNoteCount(folder, counts)}</span>
          </button>
          <DropdownMenu
            align="right"
            trigger={(toggle) => (
              <IconButton
                icon="more-horizontal"
                label="Folder options"
                size="sm"
                className="row-menu-btn"
                onClick={toggle}
              />
            )}
            items={[
              { label: 'New subfolder', icon: 'folder-plus', onClick: () => handleNewFolder(section, folder.id) },
              { label: 'Rename', icon: 'edit', onClick: () => handleRenameFolder(folder) },
              { separator: true },
              { label: 'Delete folder', icon: 'trash', danger: true, onClick: () => handleDeleteFolder(folder) },
            ]}
          />
        </div>
        {hasChildren && isOpen && (
          <div className="folder-children">
            {folder.children.map((child) => renderFolder(child, depth + 1, section))}
          </div>
        )}
      </div>
    )
  }

  return (
    <nav className={`sidebar ${collapsed ? 'collapsed' : ''}`} aria-label="Primary">
      <div className="sidebar-brand">
        <span className="mark">
          <Icon name="note" size={16} />
        </span>
        <span className="brand-text">Advanced Notepad</span>
      </div>

      <div className="sidebar-primary">
        <Button variant="primary" icon={<Icon name="plus" size={16} />} full onClick={() => { data.addNote(); onNavigate?.() }}>
          New Note
        </Button>
      </div>

      <div className="side-nav">
        {PRIMARY_VIEWS.map((v) => (
          <button
            key={v.id}
            className={`side-link ${data.activeView === v.id ? 'active' : ''}`}
            onClick={() => selectView(v.id)}
          >
            <Icon name={v.icon} size={17} />
            <span>{v.label}</span>
          </button>
        ))}
      </div>

      <div className="side-nav">
        <div className="side-label">
          <span>Folders</span>
          <span className="side-label-actions">
            <IconButton icon="folder-plus" label="New folder" size="sm" onClick={() => handleNewFolder('notes')} />
          </span>
        </div>
        {notesTree.length === 0 && (
          <button className="side-link" onClick={() => handleNewFolder('notes')}>
            <Icon name="folder-plus" size={17} />
            <span>Create your first folder</span>
          </button>
        )}
        {notesTree.map((f) => renderFolder(f, 0, 'notes'))}
      </div>

      <div className="side-nav">
        <div className="side-label">
          <span>Developer Workspace</span>
          <span className="side-label-actions">
            <IconButton
              icon="folder-plus"
              label="New project"
              size="sm"
              onClick={() => handleNewFolder('developer')}
            />
          </span>
        </div>
        {devTree.length === 0 && (
          <button className="side-link" onClick={() => handleNewFolder('developer')}>
            <Icon name="code" size={17} />
            <span>Create a project</span>
          </button>
        )}
        {devTree.map((f) => renderFolder(f, 0, 'developer'))}
      </div>

      <div className="sidebar-footer">
        <div className={`save-status ${data.saveStatus}`}>
          <Icon name={data.saveStatus === 'error' ? 'alert-triangle' : 'cloud-check'} size={14} />
          <span>
            {data.saveStatus === 'saving' && 'Saving…'}
            {data.saveStatus === 'saved' && 'All changes saved'}
            {data.saveStatus === 'error' && 'Save failed'}
            {data.saveStatus === 'idle' && 'Up to date'}
          </span>
        </div>
        <div className="sidebar-footer-row">
          <IconButton
            icon={data.settings.theme === 'dark' ? 'sun' : 'moon'}
            label="Toggle theme"
            variant="outline"
            onClick={() => data.updateSettings({ theme: data.settings.theme === 'dark' ? 'light' : 'dark' })}
          />
          <IconButton
            icon={collapsed ? 'chevron-right' : 'chevron-left'}
            label="Collapse sidebar"
            variant="outline"
            onClick={() => data.updateSettings({ sidebarCollapsed: !collapsed })}
          />
          <IconButton icon="settings" label="Settings" variant="outline" onClick={() => setSettingsOpen(true)} />
        </div>
      </div>

      <PromptDialog
        open={dialog?.type === 'new-folder'}
        onClose={() => setDialog(null)}
        title={dialog?.section === 'developer' ? 'New project' : 'New folder'}
        label="Name"
        placeholder={dialog?.section === 'developer' ? 'e.g. Checkout Service' : 'e.g. Travel plans'}
        confirmLabel="Create"
        icon="folder-plus"
        onSubmit={(name) => {
          const folder = data.addFolder({ name, parentId: dialog?.parentId ?? null, section: dialog?.section })
          selectView('folder', folder.id)
          notify(`"${name}" created`, { variant: 'success' })
        }}
      />

      <PromptDialog
        open={dialog?.type === 'rename-folder'}
        onClose={() => setDialog(null)}
        title="Rename folder"
        label="Name"
        initialValue={dialog?.name}
        confirmLabel="Save"
        icon="edit"
        onSubmit={(name) => data.renameFolder(dialog.id, name)}
      />

      <ConfirmDialog
        open={dialog?.type === 'delete-folder'}
        onClose={() => setDialog(null)}
        title="Delete folder?"
        description="Subfolders are removed too."
        icon="trash"
        confirmLabel="Delete"
        onConfirm={() => {
          data.deleteFolder(dialog.id)
          if (data.activeFolderId === dialog.id) selectView('all')
          notify('Folder deleted, its notes were moved to Trash', { variant: 'info' })
        }}
      >
        <p>
          <strong>{dialog?.name}</strong> and any subfolders will be removed. Notes inside will be moved to{' '}
          <strong>Trash</strong>, not deleted permanently.
        </p>
      </ConfirmDialog>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </nav>
  )
}
