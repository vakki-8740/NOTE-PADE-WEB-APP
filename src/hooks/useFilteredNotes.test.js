import { describe, expect, it } from 'vitest'
import { filterAndSortNotes } from './useFilteredNotes.js'
import { createNote, createFolder } from '../data/schema.js'

function makeNotes() {
  const folderA = createFolder({ name: 'A' })
  const folderB = createFolder({ name: 'B', parentId: folderA.id })
  const notes = [
    createNote({ title: 'Alpha note', content: '<p>react hooks</p>', folderId: folderA.id, favorite: true }),
    createNote({ title: 'Beta note', content: '<p>vite config</p>', folderId: folderB.id, pinned: true }),
    createNote({ title: 'Gamma', content: '<p>archived content</p>', archived: true }),
    createNote({ title: 'Deleted', content: '<p>gone</p>', trashed: true }),
  ]
  return { notes, folders: [folderA, folderB] }
}

const baseArgs = {
  activeView: 'all',
  activeFolderId: null,
  activeTagId: null,
  searchQuery: '',
  sortBy: 'updatedAt',
  sortDirection: 'desc',
}

describe('filterAndSortNotes', () => {
  it('excludes archived and trashed notes from the "all" view', () => {
    const { notes, folders } = makeNotes()
    const result = filterAndSortNotes({ ...baseArgs, notes, folders })
    expect(result.map((n) => n.title).sort()).toEqual(['Alpha note', 'Beta note'])
  })

  it('filters by favorites', () => {
    const { notes, folders } = makeNotes()
    const result = filterAndSortNotes({ ...baseArgs, notes, folders, activeView: 'favorites' })
    expect(result.map((n) => n.title)).toEqual(['Alpha note'])
  })

  it('filters by archived view', () => {
    const { notes, folders } = makeNotes()
    const result = filterAndSortNotes({ ...baseArgs, notes, folders, activeView: 'archived' })
    expect(result.map((n) => n.title)).toEqual(['Gamma'])
  })

  it('filters by trash view', () => {
    const { notes, folders } = makeNotes()
    const result = filterAndSortNotes({ ...baseArgs, notes, folders, activeView: 'trash' })
    expect(result.map((n) => n.title)).toEqual(['Deleted'])
  })

  it('includes notes from nested subfolders when filtering by folder', () => {
    const { notes, folders } = makeNotes()
    const result = filterAndSortNotes({
      ...baseArgs,
      notes,
      folders,
      activeView: 'folder',
      activeFolderId: folders[0].id,
    })
    expect(result.map((n) => n.title).sort()).toEqual(['Alpha note', 'Beta note'])
  })

  it('searches title and content case-insensitively', () => {
    const { notes, folders } = makeNotes()
    const result = filterAndSortNotes({ ...baseArgs, notes, folders, searchQuery: 'VITE' })
    expect(result.map((n) => n.title)).toEqual(['Beta note'])
  })

  it('floats pinned notes to the top', () => {
    const { notes, folders } = makeNotes()
    const result = filterAndSortNotes({ ...baseArgs, notes, folders })
    expect(result[0].title).toBe('Beta note')
  })
})
