import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AgentFactory } from '../../src/factory/agent-factory.js'
import { MemorySystem } from '../../src/memory/memory-system.js'
import { AgentWallet } from '../../src/wallet/agent-wallet.js'
import { SolanaTransactions } from '../../src/solana/transactions.js'
import { AtomicStorage } from '../../src/memory/storage.js'
import { AgentRole, AgentStatus } from '../../src/types/agent.js'
import { SystemState } from '../../src/types/system.js'
import { Connection } from '@solana/web3.js'
import { promises as fs } from 'fs'

describe('AgentFactory', () => {
  let factory: AgentFactory
  let memory: MemorySystem
  let wallet: AgentWallet
  const testDir = './test-factory-data'

  beforeEach(async () => {
    const storage = new AtomicStorage(testDir)
    memory = new MemorySystem(storage)
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
    const solana = new SolanaTransactions(connection)
    wallet = new AgentWallet(memory, solana)
    factory = new AgentFactory(memory, wallet)
  })

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  describe('createAgent', () => {
    it('should create agent with specified role', async () => {
      const context: SystemState = {
        agentCount: 0,
        activeAgents: [],
        recentDecisions: [],
        walletBalances: new Map(),
        evolutionMetrics: {
          evolutionScore: 0.5,
          totalEvolutions: 0,
          lastEvolutionTime: Date.now(),
        },
        timestamp: Date.now(),
      }

      const agent = await factory.createAgent(AgentRole.EXPLORER, context, 'genesis_root')

      expect(agent.id).toBeDefined()
      expect(agent.role).toBe(AgentRole.EXPLORER)
      expect(agent.mission).toBeDefined()
      expect(agent.walletAddress).toBeDefined()
      expect(agent.status).toBe(AgentStatus.CREATED)
    }, 30000)

    it('should generate unique agent IDs', async () => {
      const context: SystemState = {
        agentCount: 0,
        activeAgents: [],
        recentDecisions: [],
        walletBalances: new Map(),
        evolutionMetrics: {
          evolutionScore: 0.5,
          totalEvolutions: 0,
          lastEvolutionTime: Date.now(),
        },
        timestamp: Date.now(),
      }

      const agent1 = await factory.createAgent(AgentRole.BUILDER, context, 'genesis_root')
      const agent2 = await factory.createAgent(AgentRole.ANALYST, context, 'genesis_root')

      expect(agent1.id).not.toBe(agent2.id)
    }, 60000)
  })

  describe('generateMission', () => {
    it('should generate mission for role', () => {
      const context: SystemState = {
        agentCount: 2,
        activeAgents: [],
        recentDecisions: [],
        walletBalances: new Map(),
        evolutionMetrics: {
          evolutionScore: 0.5,
          totalEvolutions: 0,
          lastEvolutionTime: Date.now(),
        },
        timestamp: Date.now(),
      }

      const mission = factory.generateMission(AgentRole.EXPLORER, context)

      expect(mission).toBeDefined()
      expect(typeof mission).toBe('string')
      expect(mission.length).toBeGreaterThan(0)
    })

    it('should inject context variables into mission', () => {
      const context: SystemState = {
        agentCount: 5,
        activeAgents: [],
        recentDecisions: [],
        walletBalances: new Map(),
        evolutionMetrics: {
          evolutionScore: 0.5,
          totalEvolutions: 0,
          lastEvolutionTime: Date.now(),
        },
        timestamp: Date.now(),
      }

      const mission = factory.generateMission(AgentRole.COORDINATOR, context)

      // Mission should not contain template variables
      expect(mission).not.toContain('{agentCount}')
      expect(mission).not.toContain('{timestamp}')
      expect(mission).not.toContain('{uniqueId}')
    })
  })

  describe('getSupportedRoles', () => {
    it('should return all agent roles', () => {
      const roles = factory.getSupportedRoles()

      expect(roles).toContain(AgentRole.EXPLORER)
      expect(roles).toContain(AgentRole.BUILDER)
      expect(roles).toContain(AgentRole.ANALYST)
      expect(roles).toContain(AgentRole.COORDINATOR)
      expect(roles).toContain(AgentRole.GUARDIAN)
    })
  })

  describe('selectRole', () => {
    it('should select underrepresented role', () => {
      const context: SystemState = {
        agentCount: 3,
        activeAgents: [
          { id: '1', role: AgentRole.EXPLORER, mission: '', walletAddress: '', createdAt: 0, createdBy: '', status: AgentStatus.ACTIVE, metadata: { creationTx: '', missionProgress: 0, lastActive: 0, successCount: 0, failureCount: 0, taskHistory: [] } },
          { id: '2', role: AgentRole.EXPLORER, mission: '', walletAddress: '', createdAt: 0, createdBy: '', status: AgentStatus.ACTIVE, metadata: { creationTx: '', missionProgress: 0, lastActive: 0, successCount: 0, failureCount: 0, taskHistory: [] } },
          { id: '3', role: AgentRole.BUILDER, mission: '', walletAddress: '', createdAt: 0, createdBy: '', status: AgentStatus.ACTIVE, metadata: { creationTx: '', missionProgress: 0, lastActive: 0, successCount: 0, failureCount: 0, taskHistory: [] } },
        ],
        recentDecisions: [],
        walletBalances: new Map(),
        evolutionMetrics: {
          evolutionScore: 0.5,
          totalEvolutions: 0,
          lastEvolutionTime: Date.now(),
        },
        timestamp: Date.now(),
      }

      const role = factory.selectRole(context)

      // Should select ANALYST, COORDINATOR, or GUARDIAN (roles with 0 count)
      expect([AgentRole.ANALYST, AgentRole.COORDINATOR, AgentRole.GUARDIAN]).toContain(role)
    })
  })
})
