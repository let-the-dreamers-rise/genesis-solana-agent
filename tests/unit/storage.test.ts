import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AtomicStorage } from '../../src/memory/storage.js'
import { existsSync } from 'fs'
import { rm } from 'fs/promises'

describe('AtomicStorage', () => {
  const testDir = './test-storage'
  let storage: AtomicStorage

  beforeEach(() => {
    storage = new AtomicStorage(testDir)
  })

  afterEach(async () => {
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true })
    }
  })

  it('should write and read data atomically', async () => {
    const testData = { name: 'test', value: 123 }
    await storage.write('test.json', testData)

    const result = await storage.read<typeof testData>('test.json')
    expect(result).toEqual(testData)
  })

  it('should return null for non-existent file', async () => {
    const result = await storage.read('nonexistent.json')
    expect(result).toBeNull()
  })

  it('should check file existence', async () => {
    expect(storage.exists('test.json')).toBe(false)

    await storage.write('test.json', { data: 'test' })
    expect(storage.exists('test.json')).toBe(true)
  })

  it('should create backup and restore', async () => {
    const originalData = { version: 1 }
    await storage.write('data.json', originalData)

    await storage.backup('data.json')

    const modifiedData = { version: 2 }
    await storage.write('data.json', modifiedData)

    await storage.restore('data.json')

    const restored = await storage.read<typeof originalData>('data.json')
    expect(restored).toEqual(originalData)
  })

  it('should delete file', async () => {
    await storage.write('temp.json', { data: 'temp' })
    expect(storage.exists('temp.json')).toBe(true)

    await storage.delete('temp.json')
    expect(storage.exists('temp.json')).toBe(false)
  })
})
