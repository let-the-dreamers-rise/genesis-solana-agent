import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Logger, LogLevel } from '../../src/utils/logger.js'
import { existsSync } from 'fs'
import { rm, readFile } from 'fs/promises'

describe('Logger', () => {
  const testLogDir = './test-logs'
  let logger: Logger

  beforeEach(() => {
    logger = new Logger(testLogDir, false) // Disable console for tests
  })

  afterEach(async () => {
    if (existsSync(testLogDir)) {
      await rm(testLogDir, { recursive: true, force: true })
    }
  })

  it('should create log directory', async () => {
    await logger.info('Test message')
    expect(existsSync(testLogDir)).toBe(true)
  })

  it('should write info log', async () => {
    await logger.info('Info message')

    const logFile = `${testLogDir}/genesis.log`
    const content = await readFile(logFile, 'utf-8')

    expect(content).toContain('[INFO]')
    expect(content).toContain('Info message')
  })

  it('should write warn log', async () => {
    await logger.warn('Warning message')

    const logFile = `${testLogDir}/genesis.log`
    const content = await readFile(logFile, 'utf-8')

    expect(content).toContain('[WARN]')
    expect(content).toContain('Warning message')
  })

  it('should write error log', async () => {
    await logger.error('Error message')

    const logFile = `${testLogDir}/genesis.log`
    const content = await readFile(logFile, 'utf-8')

    expect(content).toContain('[ERROR]')
    expect(content).toContain('Error message')
  })

  it('should include timestamp in logs', async () => {
    await logger.info('Test message')

    const logFile = `${testLogDir}/genesis.log`
    const content = await readFile(logFile, 'utf-8')

    // Should have ISO timestamp format
    expect(content).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  it('should include context in logs', async () => {
    await logger.info('Test message', { userId: '123', action: 'test' })

    const logFile = `${testLogDir}/genesis.log`
    const content = await readFile(logFile, 'utf-8')

    expect(content).toContain('userId')
    expect(content).toContain('123')
    expect(content).toContain('action')
    expect(content).toContain('test')
  })

  it('should append multiple log entries', async () => {
    await logger.info('First message')
    await logger.warn('Second message')
    await logger.error('Third message')

    const logFile = `${testLogDir}/genesis.log`
    const content = await readFile(logFile, 'utf-8')

    expect(content).toContain('First message')
    expect(content).toContain('Second message')
    expect(content).toContain('Third message')
  })
})
