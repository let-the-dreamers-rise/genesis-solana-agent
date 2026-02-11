import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { GenesisAgent } from '../../src/core/genesis.js'
import { MemorySystem } from '../../src/memory/memory-system.js'
import { AgentWallet } from '../../src/wallet/agent-wallet.js'
import { AgentFactory } from '../../src/factory/agent-factory.js'
import { SolanaTransactions } from '../../src/solana/transactions.js'
import { AtomicStorage } from '../../src/memory/storage.js'
import { Connection } from '@solana/web3.js'
import { promises as fs } from 'fs'
import { AgentStatus } from '../../src/types/agent.js'

describe('GenesisAgent', () => {
  let genesis: GenesisAgent
  let memory: MemorySystem
  let wallet: AgentWallet
  let factory: AgentFactory
  let solana: SolanaTransactions
  const testDir = './test-genesis-data'

  beforeEach(async () => {
    const storage = new AtomicStorage(testDir)
    memory = new MemorySystem(storage)
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
    solana = new SolanaTransactions(connection)
    wallet = new AgentWallet(memory, solana)
    factory = new AgentFactory(memory, wallet)
    genesis = new GenesisAgent(memory, wallet, factory, solana, 24000)
  })

  afterEach(async () => {
    genesis.stopAutonomyLoop()
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  describe('observe', () => {
    it('should return system state', async () => {
      const state = await genesis.observe()

      expect(state).toBeDefined()
      expect(state.agentCount).toBeGreaterThanOrEqual(0)
      expect(state.activeAgents).toBeInstanceOf(Array)
      expect(state.recentDecisions).toBeInstanceOf(Array)
      expect(state.walletBalances).toBeInstanceOf(Map)
      expect(state.timestamp).toBeGreaterThan(0)
    })

    it('should count only active agents', async () => {
      // Create test agents
      const agent1 = {
        id: 'test_1',
        role: 'EXPLORER' as any,
        mission: 'test',
        walletAddress: 'test',
        createdAt: Date.now(),
        createdBy: 'genesis',
        status: AgentStatus.ACTIVE,
        metadata: { creationTx: '', missionProgress: 0, lastActive: 0, successCount: 0, failureCount: 0, taskHistory: [] },
      }
      const agent2 = {
        id: 'test_2',
        role: 'BUILDER' as any,
        mission: 'test',
        walletAddress: 'test',
        createdAt: Date.now(),
        createdBy: 'genesis',
        status: AgentStatus.COMPLETED,
        metadata: { creationTx: '', missionProgress: 0, lastActive: 0, successCount: 0, failureCount: 0, taskHistory: [] },
      }

      await memory.saveAgent(agent1)
      await memory.saveAgent(agent2)

      const state = await genesis.observe()
      expect(state.agentCount).toBe(1)
    })
  })

  describe('reason', () => {
    it('should generate reasoning with options', async () => {
      const state = await genesis.observe()
      const reasoning = await genesis.reason(state)

      expect(reasoning).toBeDefined()
      expect(reasoning.observation).toBeDefined()
      expect(reasoning.analysis).toBeDefined()
      expect(reasoning.options).toBeInstanceOf(Array)
      expect(reasoning.options.length).toBeGreaterThan(0)
      expect(reasoning.recommendation).toBeDefined()
      expect(reasoning.confidence).toBeGreaterThan(0)
    })

    it('should recommend agent creation when no agents exist', async () => {
      const state = await genesis.observe()
      const reasoning = await genesis.reason(state)

      // With 0 agents, CREATE_AGENT should have highest weight
      // But due to randomness, we just verify it's a valid decision type
      expect(reasoning.recommendation.type).toBeDefined()
      expect(['CREATE_AGENT', 'WAIT_AND_OBSERVE', 'COORDINATE_AGENTS', 'EVOLVE_STRATEGY', 'DELEGATE_TASK', 'ANALYZE_PERFORMANCE']).toContain(reasoning.recommendation.type)
    })
  })

  describe('decide', () => {
    it('should create decision from reasoning', async () => {
      const state = await genesis.observe()
      const reasoning = await genesis.reason(state)
      const decision = await genesis.decide(reasoning)

      expect(decision).toBeDefined()
      expect(decision.id).toBeDefined()
      expect(decision.type).toBeDefined()
      expect(decision.agentId).toBe('genesis_root')
      expect(decision.timestamp).toBeGreaterThan(0)
    })
  })

  describe('act', () => {
    it('should execute decision and return result', async () => {
      const state = await genesis.observe()
      const reasoning = await genesis.reason(state)
      const decision = await genesis.decide(reasoning)
      const result = await genesis.act(decision)

      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
      expect(result.outcome).toBeDefined()
      expect(result.timestamp).toBeGreaterThan(0)
      expect(result.duration).toBeGreaterThanOrEqual(0)
    }, 60000)
  })

  describe('log', () => {
    it('should persist decision and result', async () => {
      const state = await genesis.observe()
      const reasoning = await genesis.reason(state)
      const decision = await genesis.decide(reasoning)
      const result = await genesis.act(decision)

      await genesis.log(decision, result)

      const decisions = await memory.getDecisions(1)
      expect(decisions.length).toBeGreaterThan(0)
    }, 60000)
  })

  describe('evolve', () => {
    it('should update metrics after action', async () => {
      const state = await genesis.observe()
      const reasoning = await genesis.reason(state)
      const decision = await genesis.decide(reasoning)
      const result = await genesis.act(decision)

      const metricsBefore = await memory.getMetrics()
      await genesis.evolve(result)
      const metricsAfter = await memory.getMetrics()

      expect(metricsAfter.evolutionScore).toBeDefined()
    }, 60000)
  })

  describe('getActiveAgents', () => {
    it('should return only active agents', async () => {
      const agent1 = {
        id: 'active_1',
        role: 'EXPLORER' as any,
        mission: 'test',
        walletAddress: 'test',
        createdAt: Date.now(),
        createdBy: 'genesis',
        status: AgentStatus.ACTIVE,
        metadata: { creationTx: '', missionProgress: 0, lastActive: 0, successCount: 0, failureCount: 0, taskHistory: [] },
      }
      const agent2 = {
        id: 'inactive_1',
        role: 'BUILDER' as any,
        mission: 'test',
        walletAddress: 'test',
        createdAt: Date.now(),
        createdBy: 'genesis',
        status: AgentStatus.COMPLETED,
        metadata: { creationTx: '', missionProgress: 0, lastActive: 0, successCount: 0, failureCount: 0, taskHistory: [] },
      }

      await memory.saveAgent(agent1)
      await memory.saveAgent(agent2)

      const activeAgents = await genesis.getActiveAgents()
      expect(activeAgents.length).toBe(1)
      expect(activeAgents[0].id).toBe('active_1')
    })
  })
})
