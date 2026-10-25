import { describe, expect, it } from 'vitest'
import { validateBackup } from './validation.js'
import { createNote, createFolder, emptyBackup } from './schema.js'

describe('validateBackup', () => {
  it('accepts a well-formed empty backup', () => {
    expect(validateBackup(emptyBackup())).toEqual({ ok: true, errors: [] })
  })

  it('accepts a backup with valid notes/folders/tags', () => {
    const backup = emptyBackup()
    backup.notes.push(createNote({ title: 'A' }))
    backup.folders.push(createFolder({ name: 'B' }))
    expect(validateBackup(backup).ok).toBe(true)
  })

  it('rejects non-object input', () => {
    expect(validateBackup(null).ok).toBe(false)
    expect(validateBackup('oops').ok).toBe(false)
    expect(validateBackup([1, 2, 3]).ok).toBe(false)
  })

  it('rejects missing notes/folders arrays', () => {
    const result = validateBackup({ version: 1 })
    expect(result.ok).toBe(false)
    expect(result.errors.join(' ')).toMatch(/notes/)
    expect(result.errors.join(' ')).toMatch(/folders/)
  })

  it('rejects malformed note entries without crashing', () => {
    const backup = emptyBackup()
    backup.notes.push({ id: 'x' }) // missing required fields
    const result = validateBackup(backup)
    expect(result.ok).toBe(false)
    expect(result.errors[0]).toMatch(/Note at index 0/)
  })

  it('handles completely garbage input safely', () => {
    expect(() => validateBackup(undefined)).not.toThrow()
    expect(() => validateBackup(12345)).not.toThrow()
    expect(validateBackup(undefined).ok).toBe(false)
  })
})
