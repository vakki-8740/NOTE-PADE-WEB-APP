import { useMemo } from 'react'
import { previewText } from '../utils/text.js'

/**
 * Pure selection logic shared by the note list: applies the active view
 * (all/favorites/pinned/archived/trash/folder/workspace), the active
 * folder/tag filters, the search query, and sorting — in that order.
 *
 * The heavy lifting lives in `filterAndSortNotes`, a plain function that
 * can be unit tested without rendering any React component. This hook is
 * just a `useMemo` wrapper around it for use inside components.
 */
export function useFilteredNotes(args) {
  const { notes, folders, activeView, activeFolderId, activeTagId, searchQuery, sortBy, sortDirection } = args
  return useMemo(
    () => filterAndSortNotes(args),
    [notes, folders, activeView, activeFolderId, activeTagId, searchQuery, sortBy, sortDirection],
  )
}

export function filterAndSortNotes({
  notes,
  folders,
  activeView,
  activeFolderId,
  activeTagId,
  searchQuery,
  sortBy,
  sortDirection,
}) {
  let list = notes

  switch (activeView) {
    case 'trash':
      list = list.filter((n) => n.trashed)
      break
    case 'archived':
      list = list.filter((n) => n.archived && !n.trashed)
      break
    case 'favorites':
      list = list.filter((n) => n.favorite && !n.trashed && !n.archived)
      break
    case 'pinned':
      list = list.filter((n) => n.pinned && !n.trashed && !n.archived)
      break
    case 'folder': {
      const descendantIds = collectDescendantFolderIds(folders, activeFolderId)
      list = list.filter((n) => !n.trashed && !n.archived && descendantIds.has(n.folderId))
      break
    }
    case 'recent':
      list = list.filter((n) => !n.trashed && !n.archived)
      break
    default:
      list = list.filter((n) => !n.trashed && !n.archived)
  }

  if (activeTagId) {
    list = list.filter((n) => n.tags?.includes(activeTagId))
  }

  const q = searchQuery.trim().toLowerCase()
  if (q) {
    list = list.filter((n) => {
      const title = (n.title || '').toLowerCase()
      const content = previewText(n.content, 5000).toLowerCase()
      return title.includes(q) || content.includes(q)
    })
  }

  const sorted = [...list].sort((a, b) => {
    let cmp = 0
    if (sortBy === 'title') {
      cmp = (a.title || '').localeCompare(b.title || '')
    } else if (sortBy === 'createdAt') {
      cmp = new Date(a.createdAt) - new Date(b.createdAt)
    } else {
      cmp = new Date(a.updatedAt) - new Date(b.updatedAt)
    }
    return sortDirection === 'asc' ? cmp : -cmp
  })

  if (activeView === 'recent') {
    return sorted.slice(0, 20)
  }

  // Pinned notes always float to the top, except in trash/archive views.
  if (activeView !== 'trash' && activeView !== 'archived') {
    const pinned = sorted.filter((n) => n.pinned)
    const rest = sorted.filter((n) => !n.pinned)
    return [...pinned, ...rest]
  }

  return sorted
}

function collectDescendantFolderIds(folders, rootId) {
  const ids = new Set([rootId])
  let grew = true
  while (grew) {
    grew = false
    folders.forEach((f) => {
      if (ids.has(f.parentId) && !ids.has(f.id)) {
        ids.add(f.id)
        grew = true
      }
    })
  }
  return ids
}
