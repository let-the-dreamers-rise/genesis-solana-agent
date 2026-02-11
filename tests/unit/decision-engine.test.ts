import { describe, it, expect, beforeEach } from 'vitest'
import { DecisionEngine } from '../../src/core/decision-engine.js'
import { DecisionType } from '../../src/types/decision.js'
import { SystemState } from '../../src/types/system.js'
import { AgentStatus } from '../../src/types/agent.js'

describe('DecisionEngine', () => {
  let engine: DecisionEngine

  beforeEach(() => {
    engine = new DecisionEngine()
  })

  const createMockState = (agentCount: number): SystemState => ({
    agentCount,
    activeAgents: Array(agentCount).fill(null).map((_, i) => ({
      id: `agent_${i}`,
      role: 'EXPLORER' as any,
      mission: 'test',
      walletAddress: 'addr',
      createdAt: Date.now(),
      createdBy: 'genesis',
      status: AgentStatus.ACTIVE,
      metadata: {
        creationTx: '',
        missionProgress: 0,
        lastActive: Date.now(),
        successCount: 0,
        failureCount: 0,
        taskHistory: [],
      },
    })),
    recentDecisions: [],
    walletBalances: new Map(),
    evolutionMetrics: {
      evolutionScore: 0.5,
      totalEvolutions: 0,
      lastEvolutionTime: Date.now(),
    },
    timestamp: Date.now(),
  })

  describe('generateOptions', () => {
    it('should generate all decision options', () => {
      const state = createMockState(2)
      const options = engine.generateOptions(state)

      expect(options).toHaveLength(6)
      expect(options.map(o => o.type)).toContain(DecisionType.CREATE_AGENT)
      expect(options.map(o => o.type)).toContain(DecisionType.COORDINATE_AGENTS)
      expect(options.map(o => o.type)).toContain(DecisionType.EVOLVE_STRATEGY)
      expect(options.map(o => o.type)).toContain(DecisionType.WAIT_AND_OBSERVE)
      expect(options.map(o => o.type)).toContain(DecisionType.DELEGATE_TASK)
      expect(options.map(o => o.type)).toContain(DecisionType.ANALYZE_PERFORMANCE)
    })

    it('should have higher CREATE_AGENT weight with few agents', () => {
      const state = createMockState(1)
      const options = engine.generateOptions(state)

      const createOption = options.find(o => o.type === DecisionType.CREATE_AGENT)
      const coordinateOption = options.find(o => o.type === DecisionType.COORDINATE_AGENTS)

      expect(createOption!.weight).toBeGreaterThan(coordinateOption!.weight)
    })

    it('should have higher COORDINATE weight with many agents', () => {
      const state = createMockState(6)
      const options = engine.generateOptions(state)

      const createOption = options.find(o => o.type === DecisionType.CREATE_AGENT)
      const coordinateOption = options.find(o => o.type === DecisionType.COORDINATE_AGENTS)

      expect(coordinateOption!.weight).toBeGreaterThan(createOption!.weight)
    })
  })

  describe('selectDecision', () => {
    it('should select a decision from options', () => {
      const state = createMockState(2)
      const options = engine.generateOptions(state)
      const selected = engine.selectDecision(options)

      expect(selected).toBeDefined()
      expect(options.map(o => o.type)).toContain(selected.type)
    })

    it('should apply randomness to selection', () => {
      const state = createMockState(2)
      const options = engine.generateOptions(state)

      // Run multiple times to check for variation
      const selections = new Set()
      for (let i = 0; i < 20; i++) {
        const selected = engine.selectDecision(options)
        selections.add(selected.type)
      }

      // Should have some variation (not always same decision)
      // Note: This might occasionally fail due to randomness
      expect(selections.size).toBeGreaterThan(1)
    })
  })

  describe('createDecision', () => {
    it('should create decision with correct structure', () => {
      const state = createMockState(2)
      const options = engine.generateOptions(state)
      const selected = engine.selectDecision(options)
      const decision = engine.createDecision(selected, 'genesis_root')

      expect(decision.id).toMatch(/^decision_/)
      expect(decision.type).toBe(selected.type)
      expect(decision.reasoning).toBe(selected.reasoning)
      expect(decision.confidence).toBe(selected.weight)
      expect(decision.madeBy).toBe('genesis_root')
      expect(decision.timestamp).toBeGreaterThan(0)
    })
  })

  describe('updateWeights', () => {
    it('should increase weight on success', () => {
      const state = createMockState(2)
      const optionsBefore = engine.generateOptions(state)
      const createWeightBefore = optionsBefore.find(o => o.type === DecisionType.CREATE_AGENT)!.weight

      engine.updateWeights(DecisionType.CREATE_AGENT, true)

      const optionsAfter = engine.generateOptions(state)
      const createWeightAfter = optionsAfter.find(o => o.type === DecisionType.CREATE_AGENT)!.weight

      expect(createWeightAfter).toBeGreaterThan(createWeightBefore)
    })

    it('should decrease weight on failure', () => {
      const state = createMockState(2)
      const optionsBefore = engine.generateOptions(state)
      const createWeightBefore = optionsBefore.find(o => o.type === DecisionType.CREATE_AGENT)!.weight

      engine.updateWeights(DecisionType.CREATE_AGENT, false)

      const optionsAfter = engine.generateOptions(state)
      const createWeightAfter = optionsAfter.find(o => o.type === DecisionType.CREATE_AGENT)!.weight

      expect(createWeightAfter).toBeLessThan(createWeightBefore)
    })

    it('should keep weights within bounds', () => {
      // Try to push weight very high
      for (let i = 0; i < 20; i++) {
        engine.updateWeights(DecisionType.CREATE_AGENT, true)
      }

      const state = createMockState(2)
      const options = engine.generateOptions(state)
      const createWeight = options.find(o => o.type === DecisionType.CREATE_AGENT)!.weight

      expect(createWeight).toBeLessThanOrEqual(0.9)
      expect(createWeight).toBeGreaterThanOrEqual(0.05)
    })
  })
})
