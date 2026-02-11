import { appendFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
}

export class Logger {
  private logDir: string
  private logFile: string
  private consoleEnabled: boolean

  constructor(logDir: string = './logs', consoleEnabled: boolean = true) {
    this.logDir = logDir
    this.logFile = join(logDir, 'genesis.log')
    this.consoleEnabled = consoleEnabled
    this.ensureLogDir()
  }

  private async ensureLogDir() {
    try {
      if (!existsSync(this.logDir)) {
        await mkdir(this.logDir, { recursive: true })
      }
    } catch (error) {
      console.error('Failed to create log directory:', error)
    }
  }

  private formatTimestamp(): string {
    const now = new Date()
    return now.toISOString()
  }

  private formatLogEntry(level: LogLevel, message: string, context?: Record<string, unknown>): string {
    const timestamp = this.formatTimestamp()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level}] ${message}${contextStr}\n`
  }

  private async writeToFile(entry: string) {
    try {
      // Ensure directory exists before writing
      await this.ensureLogDir()
      await appendFile(this.logFile, entry, 'utf-8')
    } catch (error) {
      console.error('Failed to write to log file:', error)
    }
  }

  private logToConsole(level: LogLevel, message: string, context?: Record<string, unknown>) {
    if (!this.consoleEnabled) return

    const timestamp = this.formatTimestamp()
    const prefix = `[${timestamp}] [${level}]`

    switch (level) {
      case LogLevel.INFO:
        console.log(prefix, message, context || '')
        break
      case LogLevel.WARN:
        console.warn(prefix, message, context || '')
        break
      case LogLevel.ERROR:
        console.error(prefix, message, context || '')
        break
    }
  }

  async log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry = this.formatLogEntry(level, message, context)
    
    // Log to console
    this.logToConsole(level, message, context)
    
    // Write to file
    await this.writeToFile(entry)
  }

  async info(message: string, context?: Record<string, unknown>) {
    await this.log(LogLevel.INFO, message, context)
  }

  async warn(message: string, context?: Record<string, unknown>) {
    await this.log(LogLevel.WARN, message, context)
  }

  async error(message: string, context?: Record<string, unknown>) {
    await this.log(LogLevel.ERROR, message, context)
  }
}

// Singleton instance
let logger: Logger | null = null

export function getLogger(): Logger {
  if (!logger) {
    logger = new Logger()
  }
  return logger
}

export function initLogger(logDir?: string, consoleEnabled?: boolean): Logger {
  logger = new Logger(logDir, consoleEnabled)
  return logger
}
