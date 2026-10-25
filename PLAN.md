# Advanced Notepad — Project Plan & Architecture

Status: **Stage 1 (foundation + data layer) and Stage 2 (full visual UI,
built from your UI component library) are both complete.** The app is a
working, local-first notepad: create/edit notes with a rich text editor,
nested folders (including a separate "Developer Workspace" section),
search/filter/sort, trash with restore, favorites/pins/archive, JSON
backup/restore, light/dark theme, and a responsive desktop/tablet/mobile
layout. See §4–§7 below for what's in place and how it was verified.

This document is the living plan required by the project's development
rules: it records what exists, why it was built this way, and what comes
next, so every later change can be reviewed against an agreed plan instead
of guessed at.

---

## 1. Repository state before this work

The repository contained only a `README.md` — no app code. Everything
described below is new.

## 2. Technology choices

| Requirement | Choice | Why |
|---|---|---|
| App framework | **React 19 + Vite** (JavaScript, no TypeScript) | Mandated. Vite gives fast dev/build. |
| Styling | Plain CSS, component-scoped files | Mandated (no CSS framework requested); will be aligned to your UI kit's design tokens once provided. |
| Local data | **IndexedDB** via the tiny `idb` wrapper, JSON-shaped records | A packaged `data.json` can't be written back to from the browser. IndexedDB is the standard, reliable, offline-capable browser database for this use case. `idb` just makes the native API promise-based — it adds no UI and no backend. |
| Backup format | JSON (hand-written import/export layer, no library) | Matches the requested "local JSON data structure" and gives a portable backup/restore file. |
| Testing | **Vitest** + `fake-indexeddb` (dev-only) | Lets the data layer (CRUD, import/export, validation, search/sort) be verified automatically. 30 tests currently pass — see §7. |
| Rich text editor engine | **Tiptap (ProseMirror)** | Approved and wired in. Used purely as the invisible editing engine; every visible control (toolbar buttons, menus, dialogs) is built from this app's own component library (§6), not Tiptap's UI. |

No backend, no server database, and no mandatory login have been
introduced anywhere, per the rules.

## 3. Data architecture (local-first)

`src/data/schema.js` defines the single JSON-compatible shape used
everywhere — in memory, in IndexedDB, and in backup files:

```js
{
  version: 1,
  notes:   Note[],
  folders: Folder[],
  tags:    Tag[],
  settings: Settings
}
```

- **Note**: `id, title, content, folderId, tags[], favorite, pinned,
  archived, trashed, deletedAt, createdAt, updatedAt`
- **Folder**: `id, name, parentId, color, createdAt, updatedAt` —
  `parentId` enables unlimited nested subfolders.
- **Tag**: `id, name, color, createdAt`
- **Settings**: theme, editor font size, sidebar state, sort preference,
  last opened note/folder.

### Storage layer (`src/data/db.js`)

The **only** file that touches IndexedDB directly. Object stores: `notes`,
`folders`, `tags`, `settings`, `meta`. Every other module (context, hooks,
components) calls functions exported from here, so the storage engine
could be swapped later (e.g. a future sync backend) without touching the
rest of the app — this satisfies the "keep the data layer modular" and
"ready for future storage migration" requirements.

### Import / export (`src/data/importExport.js` + `src/data/validation.js`)

- `validateBackup()` checks shape defensively (never throws on garbage
  input) before anything is written to IndexedDB.
- Imported records always get **fresh IDs** and have internal references
  (`folderId`, `tags`) remapped or safely dropped — so importing a backup
  can never silently collide with or overwrite existing notes. A
  "replace everything" restore mode also exists but is only ever invoked
  behind an explicit, user-confirmed action in the UI (never automatically).
- Single-note export/import is supported as its own small JSON shape.

### App state (`src/context/DataContext.jsx`)

A React context wraps the storage layer and exposes:
- CRUD for notes/folders/tags (create, rename, duplicate, move, delete).
- Soft-delete (Trash) for notes with restore / permanent delete / empty
  trash, and safe folder deletion (deleting a folder moves its notes to
  Trash instead of destroying them).
- Pin / favorite / archive toggles.
- Debounced autosave (500 ms after the last keystroke) with a
  `saveStatus` (`idle | saving | saved | error`) the UI can display.
- Backup export/import wired to the validation layer above.
- Shared navigation/filter state (active view, active folder, active tag,
  search query) used by `src/hooks/useFilteredNotes.js`, which implements
  search-by-title/content, filter by folder/tag/favorite/pinned/archived,
  and sort by title/created/updated — as a plain, independently unit
  tested function (`filterAndSortNotes`).

### Developer Workspace

Modeled as regular folders/notes rather than a separate data type, so it
reuses all the same editing, search, tagging and backup machinery. The
plan is to add a `section` marker (`'notes' | 'developer'`) on top-level
folders so the sidebar can show a distinct "Developer Workspace" area
(separate project folders, code-block-first notes, one-click copy) without
duplicating any logic. This keeps the schema and future features simple.

## 4. What's implemented right now

- Full Vite + React project scaffold.
- Complete local-first data layer: schema, IndexedDB persistence,
  JSON import/export with validation and safe ID remapping.
- Full app state/context (`src/context/DataContext.jsx`): notes, folders,
  tags, settings, trash, favorites/pins/archive, search/filter/sort,
  autosave with save-status.
- **A full visual UI**, built from the design tokens and patterns found in
  your "OWN Library" UI kit (`src/styles/tokens.css`: same color/spacing/
  radius scale, light + dark theme via `:root[data-theme]`) and a matching
  set of reusable primitives in `src/components/ui/`: `Button`,
  `IconButton`, `TextField`/`TextArea`/`SearchField`, `Checkbox`, `Switch`,
  `Modal`/`ConfirmDialog`/`PromptDialog`, `ToastProvider`, `MenuList`/
  `DropdownMenu`/`useContextMenu`, `EmptyState`, `Badge` — plus a shared
  inline-SVG icon set (`src/components/icons/Icon.jsx`, feather-style, no
  emojis anywhere).
- **Layout** (`src/components/layout/`): `AppShell` (responsive 3-pane
  grid: sidebar / note list / editor; tablet = slide-in drawer sidebar;
  mobile = one pane at a time) and `Sidebar` (primary views, nested folder
  trees for both "Folders" and "Developer Workspace", new/rename/delete
  folder flows, theme toggle, collapse-to-rail, save-status indicator).
- **Notes** (`src/components/notes/NoteList.jsx`): search, sort menu,
  per-note context menu (pin/favorite/archive/duplicate/copy/export/
  trash/restore/delete-forever), empty states.
- **Editor** (`src/components/editor/`): `NoteEditor` + `EditorToolbar`,
  built on **Tiptap** (approved — see rationale below) with headings,
  bold/italic/underline/strikethrough, bullet/numbered/check lists,
  blockquote, code blocks, tables, links, undo/redo, live word/character
  count, and a visible save-status indicator — all toolbar chrome is this
  app's own `IconButton`/`Modal` components, not Tiptap's UI.
- **Settings** (`src/components/dialogs/SettingsDialog.jsx`): theme
  (light/dark/system), editor font size, sidebar collapse, backup export/
  import (merge or explicit full-replace, never silent overwrite), and a
  keyboard shortcuts reference.
- 35 automated tests: the original 30 data-layer tests plus a new
  component-level smoke suite (`src/App.smoke.test.jsx`) that renders the
  real app tree end-to-end and exercises note creation/editing, folder
  creation, trash/restore, and the Tiptap editor mounting — see §7.

## 5. Rich text editor engine — resolved

The spec requires headings, bold/italic/underline/strikethrough, bullet &
numbered lists, checklists, links, quotes, tables, code blocks, undo/redo,
and reliable formatting persistence. **Tiptap** (ProseMirror, MIT-licensed,
no backend/account) was approved as the editing engine. It is used purely
for the hard, invisible text-editing logic; every visible control is this
app's own component (`IconButton` toolbar, `Modal`-based link/table
dialogs), so the UI kit stays the single visual source of truth.

## 6. UI implementation — what was built

1. Inspected the provided "OWN Library" UI kit (`ui-library-source/`,
   kept out of git — reference-only, not shipped) and extracted its design
   tokens and component patterns (buttons, inputs, switches, modals,
   menus, toasts, copy-button, tabs) into `src/styles/tokens.css` and the
   `src/components/ui/` primitives listed in §4.
2. Rebuilt the three-pane layout (sidebar → note list → editor) with those
   primitives, mobile-first, matching the kit's 6px-radius / soft-shadow /
   accent-color visual language.
3. Wired the existing context/hooks into the new components — no changes
   to the data layer were needed, confirming the separation from Stage 1
   paid off.
4. Added the editor toolbar, dialogs (new folder, rename, delete confirm,
   settings/import/export), theme toggle, sidebar collapse, and keyboard
   shortcuts (Ctrl+N new note, `/` focus search, plus the editor's native
   Ctrl+B/I/U/Z/Shift+Z).
5. Ran a full automated QA pass (§7) and a manual responsive check at
   desktop / tablet (≤1080px, drawer sidebar) / mobile (≤760px, one pane
   at a time) breakpoints.

No other component library was introduced, and nothing previously approved
was redesigned without being asked.

## 7. Testing

Automated (already passing — run with `npm test`):

```
✓ src/App.smoke.test.jsx             (5 tests)  — full app tree: renders shell, creates a
                                                   note + edits title, creates a folder and
                                                   filters to it, Tiptap editor mounts with
                                                   live word count, trash + restore
✓ src/data/db.test.js                (7 tests)  — IndexedDB CRUD, replace, merge, settings
✓ src/data/importExport.test.js      (7 tests)  — backup build/parse, id remap, dangling refs, nested folders
✓ src/data/validation.test.js        (6 tests)  — garbage/malformed input handling
✓ src/hooks/useFilteredNotes.test.js (7 tests)  — view/folder/tag/search filters, pin ordering
✓ src/utils/folderTree.test.js       (3 tests)  — nested folder tree + note-count rollups
Test Files  6 passed (6)
Tests       35 passed (35)
```

The smoke suite renders the *real* `AppShell`/`Sidebar`/`NoteList`/
`NoteEditor` components (not a mock), so it caught and fixed two genuine
bugs during this stage: a crash when the editor's "no note selected" state
tried to clear a Tiptap view that was never mounted, and a `TextField`
label not being programmatically associated with its input (missing
`id`/`htmlFor`, now auto-generated via `useId()`).

`npm run build` and `npx oxlint src` both pass clean (0 errors).

Manual QA checklist:

- [x] Create / edit / delete / duplicate a note
- [x] Autosave + reload persistence (IndexedDB survives page reload)
- [x] Folders: create, nest, move notes, note counts (incl. Developer Workspace section)
- [x] Search by title/content, filter by view/folder/tag, sort by title/created/updated
- [x] Trash: soft delete, restore, permanent delete, empty trash
- [x] Export all as JSON / export one note / import JSON (merge mode, and explicit full-replace)
- [x] Rich text editor: headings, bold/italic/underline/strike, lists, checklist, quote, code block, table, links, undo/redo, word/char count
- [x] Light/dark theme, editor font size, sidebar collapse
- [x] Responsive check at desktop / tablet (drawer sidebar) / mobile (single-pane) breakpoints

## 8. Future roadmap (documented only — not built now)

Per your instructions these are tracked for later, not implemented yet:

- Note linking / backlinks, graph view
- Templates
- Rich attachments / image support
- Markdown editing & preview
- Version history
- Advanced keyboard navigation
- Optional per-note encryption
- Optional cloud sync
- Optional AI-assisted organization

The schema already leaves room for these (e.g. `content` is just a string,
so a future `format: 'html' | 'markdown'` field or an `attachments[]`
array could be added without breaking existing data — any future schema
change will bump `SCHEMA_VERSION` and include a migration).

## 9. Status

Stages 1 and 2 are both complete and verified (§7). Nothing further is
required to use the app. Any additional feature work (e.g. finer
Developer-Workspace-specific niceties like a per-code-block copy button)
will only be added on request, per the "no unrequested features" rule —
see §8 for everything intentionally deferred.
