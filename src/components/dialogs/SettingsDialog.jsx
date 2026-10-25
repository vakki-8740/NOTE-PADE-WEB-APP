import { useRef, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Switch from '../ui/Switch.jsx'
import ConfirmDialog from '../ui/ConfirmDialog.jsx'
import { useToast } from '../ui/ToastProvider.jsx'
import { useData } from '../../context/DataContext.jsx'
import './SettingsDialog.css'

const SHORTCUTS = [
  { keys: ['Ctrl', 'N'], action: 'New note' },
  { keys: ['Ctrl', 'Shift', 'F'], action: 'New folder' },
  { keys: ['/'], action: 'Focus search' },
  { keys: ['Ctrl', 'B'], action: 'Bold' },
  { keys: ['Ctrl', 'I'], action: 'Italic' },
  { keys: ['Ctrl', 'U'], action: 'Underline' },
  { keys: ['Ctrl', 'Z'], action: 'Undo' },
  { keys: ['Ctrl', 'Shift', 'Z'], action: 'Redo' },
  { keys: ['Ctrl', 'D'], action: 'Duplicate note' },
  { keys: ['Esc'], action: 'Close dialog' },
]

export default function SettingsDialog({ open, onClose }) {
  const data = useData()
  const notify = useToast()
  const fileRef = useRef(null)
  const [pendingFile, setPendingFile] = useState(null)
  const [replaceConfirmOpen, setReplaceConfirmOpen] = useState(false)

  async function doImport(mode, file) {
    const result = await data.importBackup(file, { mode })
    if (!result.ok) {
      notify(result.errors.join(' '), { title: 'Import failed', variant: 'error', duration: 6000 })
    } else {
      notify(`Imported ${result.imported.notes} notes and ${result.imported.folders} folders.`, {
        title: 'Import complete',
        variant: 'success',
      })
    }
  }

  function handleFilePicked(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPendingFile(file)
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Settings" className="settings-modal">
        <>
          <div className="settings-section">
            <h4>Appearance</h4>
            <div className="settings-row">
              <div className="settings-row-label">
                <strong>Theme</strong>
                <span>Light, dark, or match your system.</span>
              </div>
              <div className="segmented">
                {['light', 'dark', 'system'].map((t) => (
                  <button
                    key={t}
                    className={data.settings.theme === t ? 'is-on' : ''}
                    onClick={() => data.updateSettings({ theme: t })}
                  >
                    {t[0].toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-row-label">
                <strong>Editor font size</strong>
                <span>Adjust text size inside the note editor.</span>
              </div>
              <div className="font-slider">
                <input
                  type="range"
                  min={13}
                  max={22}
                  value={data.settings.editorFontSize}
                  onChange={(e) => data.updateSettings({ editorFontSize: Number(e.target.value) })}
                />
                <output>{data.settings.editorFontSize}px</output>
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-row-label">
                <strong>Collapse sidebar</strong>
                <span>Show a compact icon-only sidebar.</span>
              </div>
              <Switch
                checked={data.settings.sidebarCollapsed}
                onChange={(v) => data.updateSettings({ sidebarCollapsed: v })}
              />
            </div>
          </div>

          <div className="settings-section">
            <h4>Backup &amp; restore</h4>
            <p className="settings-row-label">
              <span>
                Notes live only in this browser (IndexedDB) — nothing is sent to a server. Export a backup
                regularly, and keep the file somewhere safe.
              </span>
            </p>
            <div className="backup-actions" style={{ marginTop: 10 }}>
              <Button variant="primary" onClick={data.exportAll}>
                Export all (JSON)
              </Button>
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                Import JSON (merge)
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                style={{ display: 'none' }}
                onChange={handleFilePicked}
              />
            </div>
          </div>

          <div className="settings-section">
            <h4>Keyboard shortcuts</h4>
            <div className="shortcut-list">
              {SHORTCUTS.map((s) => (
                <div className="shortcut-row" key={s.action}>
                  <span>{s.action}</span>
                  <span>
                    {s.keys.map((k) => (
                      <span className="kbd" key={k}>
                        {k}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      </Modal>

      <ConfirmDialog
        open={!!pendingFile && !replaceConfirmOpen}
        onClose={() => setPendingFile(null)}
        title="Import this backup?"
        description="Choose how to bring this file's notes into your library."
        tone="accent"
        icon="upload"
        confirmLabel="Merge (safe)"
        onConfirm={async () => {
          await doImport('merge', pendingFile)
          setPendingFile(null)
        }}
      >
        <p>
          <strong>Merge (recommended)</strong> adds the file's notes/folders alongside what you already have,
          assigning them new IDs so nothing existing is overwritten.
        </p>
        <p style={{ marginTop: 10 }}>
          Need to fully restore from this file instead and replace everything currently stored?{' '}
          <Button variant="ghost" size="sm" onClick={() => setReplaceConfirmOpen(true)}>
            Replace everything instead
          </Button>
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={replaceConfirmOpen}
        onClose={() => setReplaceConfirmOpen(false)}
        title="Replace ALL data?"
        description="This cannot be undone."
        tone="danger"
        icon="alert-triangle"
        confirmLabel="Replace everything"
        onConfirm={async () => {
          await doImport('replace', pendingFile)
          setPendingFile(null)
        }}
      >
        <p>
          Every note, folder and tag currently stored in this browser will be <strong>permanently deleted</strong>{' '}
          and replaced with the contents of the imported file.
        </p>
      </ConfirmDialog>
    </>
  )
}
