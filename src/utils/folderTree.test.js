import { describe, expect, it } from 'vitest'
import { buildFolderTree, totalNoteCount } from './folderTree.js'
import { createFolder } from '../data/schema.js'

describe('buildFolderTree', () => {
  it('nests subfolders under their parent', () => {
    const root = createFolder({ name: 'Projects' })
    const child = createFolder({ name: 'Client A', parentId: root.id })
    const grandchild = createFolder({ name: 'Backend', parentId: child.id })
    const tree = buildFolderTree([root, child, grandchild])

    expect(tree).toHaveLength(1)
    expect(tree[0].name).toBe('Projects')
    expect(tree[0].children[0].name).toBe('Client A')
    expect(tree[0].children[0].children[0].name).toBe('Backend')
  })

  it('treats folders with a missing/invalid parentId as roots', () => {
    const a = createFolder({ name: 'A' })
    const orphan = createFolder({ name: 'Orphan', parentId: 'does-not-exist' })
    const tree = buildFolderTree([a, orphan])
    expect(tree.map((f) => f.name).sort()).toEqual(['A', 'Orphan'])
  })
})

describe('totalNoteCount', () => {
  it('sums a folder note count with all descendants', () => {
    const root = createFolder({ name: 'Projects' })
    const child = createFolder({ name: 'Client A', parentId: root.id })
    const tree = buildFolderTree([root, child])
    const counts = new Map([
      [root.id, 2],
      [child.id, 3],
    ])
    expect(totalNoteCount(tree[0], counts)).toBe(5)
  })
})
