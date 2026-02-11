import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MemorySystem } from '../../src/memory/memory-system.js'
import { Agent, AgentRole, AgentStatus } from '../../src/types/agent.js'
import { Decision, DecisionType, ActionResult } from '../../src/types/decision.js'
import { EvolutionEvent, EvolutionType } from '../../src/types/system.js'
import { existsSync } from 'fs'
import { rm } from 'fs/promises'

describe('MemorySystem', () => {
  const testDir = './test-memory'
  let memory: MemorySystem

  beforeEach(async () => {
    memory = new MemorySystem(testDir)
    await memory.load()
  })

  afterEach(async () => {
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true })
    }
  })

  const createMockAgent = (id: string): Agent => ({
    id,
    role: AgentRole.EXPLORER,
    mission: 'Test mission',
    walletAddress: 'test_wallet',
    createdAt: Date.now(),
    createdBy: 'genesis_root',
    status: AgentStatus.ACTIVE,
    metadata: {
      creationTx: 'tx123',
      missionProgress: 0,
      lastActive: Date.now(),
      successCount: 0,
      failureCount: 0,
      taskHistory: [],
    },
  })

  describe('Agent operations', () => {
    it('should save and retrieve agent', async () => {
      const agent = createMockAgent('agent_1')
      await memory.saveAgent(agent)

      const retrieved = await memory.getAgent('agent_1')
      expect(retrieved).toEqual(agent)
    })

    it('should return null for non-existent agent', async () => {
      const retrieved = await memory.getAgent('nonexistent')
      expect(retrieved).toBeNull()
    })

    it('should get all agents', async () => {
      const agent1 = createMockAgent('agent_1')
      const agent2 = createMockAgent('agent_2')

      await memory.saveAgent(agent1)
      await memory.saveAgent(agent2)

      const all = await memory.getAllAgents()
      expect(all).toHaveLength(2)
      expect(all.map(a => a.id)).toContain('agent_1')
      expect(all.map(a => a.id)).toContain('agent_2')
    })

    it('should query agents by role', async () => {
      const explorer = createMockAgent('agent_1')
      explorer.role = AgentRole.EXPLORER

      const builder = createMockAgent('agent_2')
      builder.role = AgentRole.BUILDER

      await memory.saveAgent(explorer)
      await memory.saveAgent(builder)

      const explorers = await memory.queryAgents({ role: AgentRole.EXPLORER })
      expect(explorers).toHaveLength(1)
      expect(explorers[0].id).toBe('agent_1')
    })

    it('should query agents by status', async () => {
      const active = createMockAgent('agent_1')
      active.status = AgentStatus.ACTIVE

      const paused = createMockAgent('agent_2')
      paused.status = AgentStatus.PAUSED

      await memory.saveAgent(active)
      await memory.saveAgent(paused)

      const activeAgents = await memory.queryAgents({ status: AgentStatus.ACTIVE })
      expect(activeAgents).toHaveLength(1)
      expect(activeAgents[0].id).toBe('agent_1')
    })

    it('should query agents by creation time', async () => {
      const now = Date.now()
      const old = createMockAgent('agent_1')
      old.createdAt = now - 10000

      const recent = createMockAgent('agent_2')
      recent.createdAt = now

      await memory.saveAgent(old)
      await memory.saveAgent(recent)

      const recentAgents = await memory.queryAgents({ createdAfter: now - 5000 })
      expect(recentAgents).toHaveLength(1)
      expect(recentAgents[0].id).toBe('agent_2')
    })
  })

  describe('Decision operations', () => {
    it('should log and retrieve decisions', async () => {
      const decision: Decision = {
        id: 'decision_1',
        type: DecisionType.CREATE_AGENT,
        reasoning: 'Test reasoning',
        parameters: {},
        timestamp: Date.now(),
        confidence: 0.8,
        madeBy: 'genesis_root',
      }

      const result: ActionResult = {
        success: true,
        decision,
        outcome: 'Success',
        timestamp: Date.now(),
        duration: 1000,
      }

      await memory.logDecision(decision, result)

      const decisions = await memory.getDecisions()
      expect(decisions).toHaveLength(1)
      expect(decisions[0].decision.id).toBe('decision_1')
    })

    it('should limit decisions with limit parameter', async () => {
      for (let i = 0; i < 10; i++) {
        const decision: Decision = {
          id: `decision_${i}`,
          type: DecisionType.CREATE_AGENT,
          reasoning: 'Test',
          parameters: {},
          timestamp: Date.now(),
          confidence: 0.8,
          madeBy: 'genesis_root',
        }

        const result: ActionResult = {
          success: true,
          decision,
          outcome: 'Success',
          timestamp: Date.now(),
          duration: 1000,
        }

        await memory.logDecision(decision, result)
      }

      const limited = await memory.getDecisions(5)
      expect(limited).toHaveLength(5)
    })
  })

  describe('Evolution operations', () => {
    it('should log and retrieve evolution events', async () => {
      const event: EvolutionEvent = {
        id: 'evolution_1',
        type: EvolutionType.STRATEGY_ADJUSTMENT,
        description: 'Test evolution',
        metrics: {
          before: { weight: 0.5 },
          after: { weight: 0.6 },
        },
        timestamp: Date.now(),
        triggeredBy: 'decision_1',
      }

      await memory.logEvolution(event)

      const events = await memory.getEvolutionHistory()
      expect(events).toHaveLength(1)
      expect(events[0].id).toBe('evolution_1')
    })
  })

  describe('Metrics operations', () => {
    it('should get default metrics', async () => {
      const metrics = await memory.getMetrics()

      expect(metrics.totalAgentsCreated).toBe(0)
      expect(metrics.activeAgents).toBe(0)
      expect(metrics.totalDecisions).toBe(0)
    })

    it('should update metrics', async () => {
      await memory.updateMetrics({
        totalAgentsCreated: 5,
        activeAgents: 3,
        totalDecisions: 10,
      })

      const metrics = await memory.getMetrics()
      expect(metrics.totalAgentsCreated).toBe(5)
      expect(metrics.activeAgents).toBe(3)
      expect(metrics.totalDecisions).toBe(10)
    })

    it('should update lastUpdated timestamp', async () => {
      const before = Date.now()
      await memory.updateMetrics({ totalAgentsCreated: 1 })
      const after = Date.now()

      const metrics = await memory.getMetrics()
      expect(metrics.lastUpdated).toBeGreaterThanOrEqual(before)
      expect(metrics.lastUpdated).toBeLessThanOrEqual(after)
    })
  })

  describe('Persistence', () => {
    it('should persist and reload agents', async () => {
      const agent = createMockAgent('agent_1')
      await memory.saveAgent(agent)

      // Create new memory instance
      const memory2 = new MemorySystem(testDir)
      await memory2.load()

      const retrieved = await memory2.getAgent('agent_1')
      expect(retrieved).toEqual(agent)
    })
  })
})
