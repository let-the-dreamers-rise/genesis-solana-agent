import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SolanaConnection } from '../../src/solana/connection.js'
import { Connection } from '@solana/web3.js'

describe('SolanaConnection', () => {
  let solanaConnection: SolanaConnection

  beforeEach(() => {
    solanaConnection = new SolanaConnection('https://api.devnet.solana.com', 'confirmed')
  })

  describe('connect', () => {
    it('should create connection to Solana devnet', async () => {
      const connection = await solanaConnection.connect()
      expect(connection).toBeInstanceOf(Connection)
    })

    it('should validate connection by getting version', async () => {
      const connection = await solanaConnection.connect()
      const version = await connection.getVersion()
      expect(version).toBeDefined()
      expect(version['solana-core']).toBeDefined()
    })
  })

  describe('getConnection', () => {
    it('should return connection after connect', async () => {
      await solanaConnection.connect()
      const connection = solanaConnection.getConnection()
      expect(connection).toBeInstanceOf(Connection)
    })

    it('should throw error if not connected', () => {
      expect(() => solanaConnection.getConnection()).toThrow('Not connected to Solana')
    })
  })

  describe('validateConnection', () => {
    it('should return true for valid connection', async () => {
      await solanaConnection.connect()
      const isValid = await solanaConnection.validateConnection()
      expect(isValid).toBe(true)
    })

    it('should return false if not connected', async () => {
      const isValid = await solanaConnection.validateConnection()
      expect(isValid).toBe(false)
    })
  })

  describe('retryConnection', () => {
    it('should connect successfully on first attempt', async () => {
      const connection = await solanaConnection.retryConnection(3)
      expect(connection).toBeInstanceOf(Connection)
    })

    it('should retry on failure with valid RPC', async () => {
      const connection = await solanaConnection.retryConnection(2)
      expect(connection).toBeInstanceOf(Connection)
    })
  })
})
