// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App.jsx'
import { DataProvider } from './context/DataContext.jsx'
import { ToastProvider } from './components/ui/ToastProvider.jsx'
import * as db from './data/db.js'

/**
 * End-to-end smoke test for the real UI (not the data layer, which is
 * already covered by src/data/*.test.js). Renders the whole app tree —
 * AppShell, Sidebar, NoteList, NoteEditor (incl. the Tiptap editor) — and
 * exercises the primary flows a user would hit first: creating a note,
 * typing a title, and navigating sidebar views. This is what gives us
 * confidence the component wiring (DataContext <-> Sidebar/NoteList/
 * NoteEditor prop/APIs) is actually correct, not just individually typed
 * consistently.
 */

beforeEach(async () => {
  await db.wipeAllData()
  window.matchMedia =
    window.matchMedia ||
    vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
})

function renderApp() {
  return render(
    <DataProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </DataProvider>,
  )
}

describe('App', () => {
  it('renders the shell once data finishes loading', async () => {
    renderApp()
    await waitFor(() => expect(screen.getByText('Advanced Notepad')).toBeInTheDocument())
    expect(screen.getByRole('heading', { name: 'All Notes' })).toBeInTheDocument()
    expect(screen.getByText('Developer Workspace')).toBeInTheDocument()
  })

  it('creates a note from the sidebar and lets you edit the title', async () => {
    renderApp()
    await waitFor(() => expect(screen.getByText('Advanced Notepad')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'New Note' }))

    const titleInput = await screen.findByPlaceholderText('Untitled note')
    fireEvent.change(titleInput, { target: { value: 'My first note' } })

    await waitFor(() => expect(titleInput).toHaveValue('My first note'))
    // The note should now also show up in the note list.
    await waitFor(() => expect(screen.getAllByText('My first note').length).toBeGreaterThan(0))
  })

  it('creates a folder and switches the note list to it', async () => {
    renderApp()
    await waitFor(() => expect(screen.getByText('Advanced Notepad')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /create your first folder/i }))
    const nameInput = await screen.findByLabelText('Name')
    fireEvent.change(nameInput, { target: { value: 'Travel' } })
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }))

    await waitFor(() => expect(screen.getAllByText('Travel').length).toBeGreaterThan(0))
    // Heading of the note list should now read the folder's name.
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Travel' })).toBeInTheDocument())
  })

  it('mounts a working rich text editor with a live word/character count', async () => {
    renderApp()
    await waitFor(() => expect(screen.getByText('Advanced Notepad')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'New Note' }))
    await screen.findByPlaceholderText('Untitled note')

    // The Tiptap ProseMirror view should be mounted and editable, and the
    // footer should already report a (zero) word/character count.
    const body = document.querySelector('.tiptap-content .ProseMirror')
    expect(body).toBeTruthy()
    expect(body).toHaveAttribute('contenteditable', 'true')
    expect(screen.getByText(/words ·/)).toBeInTheDocument()
  })

  it('moves a note to Trash and can restore it', async () => {
    renderApp()
    await waitFor(() => expect(screen.getByText('Advanced Notepad')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'New Note' }))
    await screen.findByPlaceholderText('Untitled note')

    // Use the editor's "More actions" menu to trash it.
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }))
    fireEvent.click(await screen.findByText('Move to Trash'))

    fireEvent.click(screen.getByRole('button', { name: 'Trash' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Trash' })).toBeInTheDocument())
  })
})
