import { Connection, Commitment } from '@solana/web3.js'
import { getLogger } from '../utils/logger.js'

const logger = getLogger()

export class SolanaConnection {
  private connection: Connection | null = null
  private rpcUrl: string
  private commitment: Commitment

  constructor(rpcUrl: string, commitment: Commitment = 'confirmed') {
    this.rpcUrl = rpcUrl
    this.commitment = commitment
  }

  async connect(): Promise<Connection> {
    try {
      this.connection = new Connection(this.rpcUrl, this.commitment)
      
      // Validate connection
      const version = await this.connection.getVersion()
      await logger.info('Connected to Solana devnet', { version })
      
      return this.connection
    } catch (error) {
      await logger.error('Failed to connect to Solana', { error })
      throw error
    }
  }

  getConnection(): Connection {
    if (!this.connection) {
      throw new Error('Not connected to Solana. Call connect() first.')
    }
    return this.connection
  }

  async validateConnection(): Promise<boolean> {
    try {
      if (!this.connection) return false
      await this.connection.getVersion()
      return true
    } catch (error) {
      await logger.error('Connection validation failed', { error })
      return false
    }
  }

  async retryConnection(maxRetries: number = 3): Promise<Connection> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.connect()
      } catch (error) {
        if (attempt === maxRetries) {
          throw error
        }
        await logger.warn(`Connection attempt ${attempt} failed, retrying...`)
        await this.sleep(1000 * attempt)
      }
    }
    throw new Error('Failed to connect after retries')
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
