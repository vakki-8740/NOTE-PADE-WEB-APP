# Advanced Notepad

A professional, local-first notepad web app — React + Vite, no backend, no
server database. See **[PLAN.md](./PLAN.md)** for the full architecture,
feature plan, and roadmap.

> **Status:** The data layer (IndexedDB persistence, folders, tags,
> search/filter, JSON backup/restore) is complete and tested. The visual
> UI is paused pending the UI component library ZIP — `src/App.jsx` is
> currently a plain, unstyled scaffold used only to verify the app logic
> end-to-end.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build
npm test         # run the automated test suite (Vitest)
```

## Project structure

```
src/
  data/            # schema, IndexedDB layer, import/export, validation (no UI)
  context/         # DataContext — app state wired to the data layer
  hooks/           # useFilteredNotes, useDebouncedCallback
  utils/           # id/date/text helpers, folder tree builder
  components/      # (reserved for the UI-kit-based components, next stage)
  App.jsx          # temporary scaffold UI
```

## Data & privacy

All notes, folders, tags and settings are stored locally in your browser's
IndexedDB — nothing is sent to a server, and there is no login. Use
"Export All (JSON)" to create a portable backup, and "Import JSON" to
restore it (existing data is never silently overwritten).
