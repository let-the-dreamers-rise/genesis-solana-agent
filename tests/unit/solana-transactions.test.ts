import { describe, it, expect, beforeEach } from 'vitest'
import { SolanaTransactions, MemoData } from '../../src/solana/transactions.js'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'

describe('SolanaTransactions', () => {
  let solanaTransactions: SolanaTransactions
  let connection: Connection
  let testKeypair: Keypair

  beforeEach(() => {
    connection = new Connection('https://api.devnet.solana.com', 'confirmed')
    solanaTransactions = new SolanaTransactions(connection)
    testKeypair = Keypair.generate()
  })

  describe('createMemoInstruction', () => {
    it('should create memo instruction with correct program ID', () => {
      const memo = 'test memo'
      const instruction = solanaTransactions.createMemoInstruction(memo, testKeypair.publicKey)
      
      expect(instruction.programId.toBase58()).toBe('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')
      expect(instruction.keys).toHaveLength(1)
      expect(instruction.keys[0].pubkey.toBase58()).toBe(testKeypair.publicKey.toBase58())
    })

    it('should encode memo data as UTF-8 buffer', () => {
      const memo = 'test memo'
      const instruction = solanaTransactions.createMemoInstruction(memo, testKeypair.publicKey)
      
      expect(instruction.data).toBeInstanceOf(Buffer)
      expect(instruction.data.toString('utf-8')).toBe(memo)
    })
  })

  describe('buildMemoTransaction', () => {
    it('should build transaction with memo instruction', async () => {
      const memoData: MemoData = {
        type: 'TEST',
        agentId: 'test_agent',
        timestamp: Date.now(),
        genesisId: 'genesis_root',
      }

      const transaction = await solanaTransactions.buildMemoTransaction(memoData, testKeypair.publicKey)
      
      expect(transaction.instructions).toHaveLength(1)
      expect(transaction.feePayer?.toBase58()).toBe(testKeypair.publicKey.toBase58())
      expect(transaction.recentBlockhash).toBeDefined()
    })

    it('should serialize memo data as JSON', async () => {
      const memoData: MemoData = {
        type: 'AGENT_CREATION',
        agentId: 'agent_123',
        role: 'EXPLORER',
        mission: 'Test mission',
        timestamp: Date.now(),
        genesisId: 'genesis_root',
      }

      const transaction = await solanaTransactions.buildMemoTransaction(memoData, testKeypair.publicKey)
      const memoInstruction = transaction.instructions[0]
      const decodedMemo = memoInstruction.data.toString('utf-8')
      const parsedMemo = JSON.parse(decodedMemo)
      
      expect(parsedMemo.type).toBe('AGENT_CREATION')
      expect(parsedMemo.agentId).toBe('agent_123')
      expect(parsedMemo.role).toBe('EXPLORER')
    })
  })

  describe('getBalance', () => {
    it('should return balance for public key', async () => {
      const balance = await solanaTransactions.getBalance(testKeypair.publicKey)
      expect(typeof balance).toBe('number')
      expect(balance).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getTransactionStatus', () => {
    it('should handle non-existent transaction', async () => {
      const fakeSignature = 'invalid_signature_' + Date.now()
      
      try {
        await solanaTransactions.getTransactionStatus(fakeSignature)
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })
})
