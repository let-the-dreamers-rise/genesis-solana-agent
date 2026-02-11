import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AgentWallet } from '../../src/wallet/agent-wallet.js'
import { MemorySystem } from '../../src/memory/memory-system.js'
import { SolanaTransactions } from '../../src/solana/transactions.js'
import { Connection } from '@solana/web3.js'
import { AtomicStorage } from '../../src/memory/storage.js'
import { promises as fs } from 'fs'

describe('AgentWallet', () => {
  let agentWallet: AgentWallet
  let memory: MemorySystem
  let solana: SolanaTransactions
  const testDir = './test-wallet-data'

  beforeEach(async () => {
    const storage = new AtomicStorage(testDir)
    memory = new MemorySystem(storage)
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
    solana = new SolanaTransactions(connection)
    agentWallet = new AgentWallet(memory, solana, 1000000000, 100000000)
  })

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  describe('createWallet', () => {
    it('should create wallet with encrypted private key', async () => {
      const agentId = 'test_agent_1'
      const wallet = await agentWallet.createWallet(agentId, false)
      
      expect(wallet.agentId).toBe(agentId)
      expect(wallet.publicKey).toBeDefined()
      expect(wallet.privateKey).toBeDefined()
      expect(wallet.balance).toBeGreaterThan(0)
      expect(wallet.airdropCount).toBe(1)
    }, 30000)

    it('should create GENESIS wallet with higher balance', async () => {
      const wallet = await agentWallet.createWallet('genesis_root', true)
      
      expect(wallet.agentId).toBe('genesis_root')
      expect(wallet.balance).toBeGreaterThan(1000000000)
    }, 30000)

    it('should save wallet to memory', async () => {
      const agentId = 'test_agent_2'
      await agentWallet.createWallet(agentId, false)
      
      const savedWallet = await agentWallet.getWallet(agentId)
      expect(savedWallet).toBeDefined()
      expect(savedWallet?.agentId).toBe(agentId)
    }, 30000)
  })

  describe('getKeypair', () => {
    it('should decrypt and restore keypair', async () => {
      const agentId = 'test_agent_3'
      const wallet = await agentWallet.createWallet(agentId, false)
      
      const keypair = agentWallet.getKeypair(wallet)
      expect(keypair.publicKey.toBase58()).toBe(wallet.publicKey)
    }, 30000)
  })

  describe('getBalance', () => {
    it('should get current balance for agent', async () => {
      const agentId = 'test_agent_4'
      await agentWallet.createWallet(agentId, false)
      
      const balance = await agentWallet.getBalance(agentId)
      expect(balance).toBeGreaterThan(0)
    }, 30000)

    it('should throw error for non-existent wallet', async () => {
      await expect(agentWallet.getBalance('non_existent')).rejects.toThrow()
    })
  })

  describe('getAllWallets', () => {
    it('should return all created wallets', async () => {
      await agentWallet.createWallet('agent_1', false)
      await agentWallet.createWallet('agent_2', false)
      
      const wallets = await agentWallet.getAllWallets()
      expect(wallets.length).toBeGreaterThanOrEqual(2)
    }, 60000)
  })
})
