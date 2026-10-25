import { describe, expect, it } from 'vitest'
import { prepareImportedBackup, prepareImportedNote, buildBackup } from './importExport.js'
import { createNote, createFolder, createTag, defaultSettings } from './schema.js'

describe('prepareImportedBackup', () => {
  it('rejects invalid files with human readable errors', () => {
    const result = prepareImportedBackup({ foo: 'bar' })
    expect(result.ok).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('remaps ids so importing never collides with existing records', () => {
    const folder = createFolder({ name: 'Project X' })
    const note = createNote({ title: 'Spec', folderId: folder.id })
    const backup = buildBackup({ notes: [note], folders: [folder], tags: [], settings: defaultSettings() })

    const result = prepareImportedBackup(backup)
    expect(result.ok).toBe(true)
    expect(result.data.folders[0].id).not.toBe(folder.id)
    expect(result.data.notes[0].id).not.toBe(note.id)
    // folderId reference should be remapped to the new folder id, not left dangling
    expect(result.data.notes[0].folderId).toBe(result.data.folders[0].id)
  })

  it('drops references to folders/tags that do not exist in the file', () => {
    const note = createNote({ title: 'Orphan', folderId: 'missing-folder', tags: ['missing-tag'] })
    const backup = buildBackup({ notes: [note], folders: [], tags: [], settings: defaultSettings() })
    const result = prepareImportedBackup(backup)
    expect(result.ok).toBe(true)
    expect(result.data.notes[0].folderId).toBeNull()
    expect(result.data.notes[0].tags).toEqual([])
  })

  it('preserves nested folder parent/child relationships after remapping', () => {
    const parent = createFolder({ name: 'Parent' })
    const child = createFolder({ name: 'Child', parentId: parent.id })
    const backup = buildBackup({ notes: [], folders: [parent, child], tags: [], settings: defaultSettings() })
    const result = prepareImportedBackup(backup)
    const newParent = result.data.folders.find((f) => f.name === 'Parent')
    const newChild = result.data.folders.find((f) => f.name === 'Child')
    expect(newChild.parentId).toBe(newParent.id)
  })
})

describe('prepareImportedNote', () => {
  it('accepts a single exported note and assigns a fresh id', () => {
    const note = createNote({ title: 'Snippet' })
    const result = prepareImportedNote({ version: 1, kind: 'single-note', note })
    expect(result.ok).toBe(true)
    expect(result.data.id).not.toBe(note.id)
    expect(result.data.title).toBe('Snippet')
  })

  it('rejects garbage JSON safely', () => {
    const result = prepareImportedNote({ not: 'a note' })
    expect(result.ok).toBe(false)
  })
})

describe('createTag / createFolder / createNote defaults', () => {
  it('produce stable, well-shaped defaults', () => {
    expect(createTag().name).toBe('tag')
    expect(createFolder().parentId).toBeNull()
    const note = createNote()
    expect(note.trashed).toBe(false)
    expect(note.tags).toEqual([])
  })
})
