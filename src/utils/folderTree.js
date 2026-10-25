/**
 * Builds a nested tree from the flat `folders` array (supports arbitrary
 * nesting depth for subfolders).
 */
export function buildFolderTree(folders) {
  const byId = new Map(folders.map((f) => [f.id, { ...f, children: [] }]))
  const roots = []
  byId.forEach((folder) => {
    if (folder.parentId && byId.has(folder.parentId)) {
      byId.get(folder.parentId).children.push(folder)
    } else {
      roots.push(folder)
    }
  })
  const sortByName = (list) => {
    list.sort((a, b) => a.name.localeCompare(b.name))
    list.forEach((f) => sortByName(f.children))
  }
  sortByName(roots)
  return roots
}

/** Sums a folder's own note count plus every descendant's, for sidebar badges. */
export function totalNoteCount(folder, countsMap) {
  const own = countsMap.get(folder.id) ?? 0
  const childSum = folder.children.reduce((sum, child) => sum + totalNoteCount(child, countsMap), 0)
  return own + childSum
}
