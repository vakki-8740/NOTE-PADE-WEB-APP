import { beforeEach, describe, expect, it } from 'vitest'
import * as db from './db.js'
import { createNote, createFolder, createTag, defaultSettings } from './schema.js'

beforeEach(async () => {
  // Reuse a single IndexedDB connection across tests (opening/deleting the
  // database repeatedly is flaky under fake-indexeddb) and just clear every
  // store so each test starts from a clean slate.
  await db.wipeAllData()
})

describe('IndexedDB persistence layer', () => {
  it('starts empty and uses default settings', async () => {
    const data = await db.loadAllData()
    expect(data.notes).toEqual([])
    expect(data.folders).toEqual([])
    expect(data.tags).toEqual([])
    expect(data.settings).toEqual(defaultSettings())
  })

  it('persists and reloads a note', async () => {
    const note = createNote({ title: 'Hello', content: '<p>World</p>' })
    await db.putNote(note)
    const data = await db.loadAllData()
    expect(data.notes).toHaveLength(1)
    expect(data.notes[0].title).toBe('Hello')
  })

  it('persists folders and tags', async () => {
    const folder = createFolder({ name: 'Work' })
    const tag = createTag({ name: 'urgent' })
    await db.putFolder(folder)
    await db.putTag(tag)
    const data = await db.loadAllData()
    expect(data.folders[0].name).toBe('Work')
    expect(data.tags[0].name).toBe('urgent')
  })

  it('hard deletes a note', async () => {
    const note = createNote({ title: 'Temp' })
    await db.putNote(note)
    await db.deleteNoteHard(note.id)
    const data = await db.loadAllData()
    expect(data.notes).toHaveLength(0)
  })

  it('replaceAllData wipes and restores a full backup', async () => {
    await db.putNote(createNote({ title: 'Old note' }))
    const fresh = {
      notes: [createNote({ title: 'Restored note' })],
      folders: [createFolder({ name: 'Restored folder' })],
      tags: [createTag({ name: 'restored' })],
      settings: defaultSettings(),
    }
    await db.replaceAllData(fresh)
    const data = await db.loadAllData()
    expect(data.notes).toHaveLength(1)
    expect(data.notes[0].title).toBe('Restored note')
    expect(data.folders[0].name).toBe('Restored folder')
  })

  it('mergeData adds to existing data without deleting it', async () => {
    await db.putNote(createNote({ title: 'Existing note' }))
    await db.mergeData({
      notes: [createNote({ title: 'Imported note' })],
      folders: [],
      tags: [],
    })
    const data = await db.loadAllData()
    expect(data.notes.map((n) => n.title).sort()).toEqual(['Existing note', 'Imported note'])
  })

  it('persists settings', async () => {
    await db.putSettings({ ...defaultSettings(), theme: 'dark', editorFontSize: 20 })
    const data = await db.loadAllData()
    expect(data.settings.theme).toBe('dark')
    expect(data.settings.editorFontSize).toBe(20)
  })
})
