# Advanced Notepad — Project Plan & Architecture

Status: **Stage 1 complete (foundation + data layer). Stage 2 (visual UI) is
paused, waiting for the UI component library ZIP you mentioned.**

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
| Rich text editor engine | **Proposed: Tiptap (ProseMirror)** — not yet installed | Explained in §5; this needs your sign-off since it's a new dependency, separate from the UI kit. |

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
- Full app state/context: notes, folders, tags, settings, trash,
  favorites/pins/archive, search/filter/sort, autosave with save-status.
- 30 automated tests covering persistence, validation, import/export edge
  cases (bad files, id collisions, nested folders) and search/sort/filter
  behavior.
- A **temporary, intentionally unstyled scaffold UI** (`src/App.jsx`) that
  wires all of the above together end-to-end (create/edit/delete notes,
  folders, search, pin/favorite/archive, trash/restore, export/import) —
  purely to prove the logic works. It is explicitly labeled in the app and
  is not the visual design; it will be rebuilt with your UI kit's
  components next.

## 5. Open decision needed: rich text editor engine

The spec requires headings, bold/italic/underline/strikethrough, bullet &
numbered lists, checklists, links, quotes, tables, code blocks, undo/redo,
and reliable formatting persistence. Implementing all of that reliably by
hand on a plain `contentEditable` is error-prone (especially
undo/redo + tables + checklists together).

**Proposal:** use **Tiptap** (built on ProseMirror, MIT-licensed, no
backend/account needed) purely as the editing *engine*. All of its visible
chrome — toolbar buttons, menus, dialogs — would be built with **your UI
kit's components**, not Tiptap's own UI. This keeps your component library
as the single visual source of truth while outsourcing only the hard,
invisible text-editing logic. This is a new dependency outside the UI kit,
so I'm flagging it for your explicit go-ahead before installing it; if you
'd rather I hand-build the editor instead, I can, but undo/redo and tables
will take longer and carry more risk of bugs.

## 6. UI implementation plan (next stage — paused)

Once you share the UI component library ZIP, the plan is:

1. Unzip and inspect it: list components, read any docs/Storybook, note
   available primitives (buttons, inputs, dialogs/modals, menus, tabs,
   switches, icons) and design tokens (spacing, color, radius, type scale).
2. Write a short "component mapping" note (which kit component maps to
   which part of the app: sidebar nav item, note list row, dialog, etc.)
   before writing any UI code, so you can review it before I build.
3. Rebuild the three-pane layout (sidebar → note list → editor) using the
   kit's components, mobile-first, with the iOS-inspired spacing/radius
   already implied by the kit.
4. Wire the existing context/hooks into the new components (no changes to
   the data layer should be needed — that's the point of keeping it
   separate).
5. Add the editor toolbar, dialogs (new folder, rename, delete confirm,
   import/export, settings), theme toggle, and keyboard shortcuts.
6. Full manual QA pass per §7 and mobile responsiveness check.

I will not introduce another component library, and will not restyle
anything you've approved, without checking with you first.

## 7. Testing

Automated (already passing — run with `npm test`):

```
✓ src/data/db.test.js            (7 tests)  — IndexedDB CRUD, replace, merge, settings
✓ src/data/importExport.test.js  (7 tests)  — backup build/parse, id remap, dangling refs, nested folders
✓ src/data/validation.test.js    (6 tests)  — garbage/malformed input handling
✓ src/hooks/useFilteredNotes.test.js (7 tests) — view/folder/tag/search filters, pin ordering
✓ src/utils/folderTree.test.js   (3 tests)  — nested folder tree + note-count rollups
Test Files  5 passed (5)
Tests       30 passed (30)
```

Manual QA checklist (to run again fully once the real UI is built, and
already spot-checked against the scaffold UI):

- [x] Create / edit / delete / duplicate a note
- [x] Autosave + reload persistence (IndexedDB survives page reload)
- [x] Folders: create, nest, move notes, note counts
- [x] Search by title/content, filter by view/folder/tag
- [x] Trash: soft delete, restore, permanent delete, empty trash
- [x] Export all as JSON / export one note / import JSON (merge mode)
- [ ] Full visual/responsive QA — pending the real UI (mobile/tablet/desktop)

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

## 9. What I need from you to continue

1. The UI component library ZIP (upload it in chat).
2. A decision on §5 (Tiptap as the editor engine vs. a hand-built editor).

Everything else (data layer, state management, tests) is already in place
and won't need to change when the visual layer is built.
