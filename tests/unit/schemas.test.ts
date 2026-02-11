import { describe, it, expect } from 'vitest'
import {
  validateAgent,
  validateWalletInfo,
  validateDecision,
  validateEvolutionEvent,
} from '../../src/memory/schemas.js'
import { AgentRole, AgentStatus } from '../../src/types/agent.js'
import { DecisionType } from '../../src/types/decision.js'
import { EvolutionType } from '../../src/types/system.js'

describe('Schema Validation', () => {
  describe('validateAgent', () => {
    it('should validate correct agent data', () => {
      const agent = {
        id: 'agent_123',
        role: AgentRole.EXPLORER,
        mission: 'Test mission',
        walletAddress: 'abc123',
        createdAt: Date.now(),
        createdBy: 'genesis_root',
        status: AgentStatus.ACTIVE,
        metadata: {
          creationTx: 'tx123',
          missionProgress: 50,
          lastActive: Date.now(),
          successCount: 5,
          failureCount: 1,
        },
      }

      expect(validateAgent(agent)).toBe(true)
    })

    it('should reject invalid agent data', () => {
      const invalidAgent = {
        id: 'agent_123',
        role: 'INVALID_ROLE',
        mission: 'Test mission',
      }

      expect(validateAgent(invalidAgent)).toBe(false)
    })

    it('should reject null or non-object', () => {
      expect(validateAgent(null)).toBe(false)
      expect(validateAgent('string')).toBe(false)
      expect(validateAgent(123)).toBe(false)
    })
  })

  describe('validateWalletInfo', () => {
    it('should validate correct wallet data', () => {
      const wallet = {
        agentId: 'agent_123',
        publicKey: 'pubkey123',
        privateKey: 'encrypted_key',
        balance: 1000000000,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        transactionCount: 5,
        airdropCount: 1,
      }

      expect(validateWalletInfo(wallet)).toBe(true)
    })

    it('should reject invalid wallet data', () => {
      const invalidWallet = {
        agentId: 'agent_123',
        publicKey: 'pubkey123',
        // missing required fields
      }

      expect(validateWalletInfo(invalidWallet)).toBe(false)
    })
  })

  describe('validateDecision', () => {
    it('should validate correct decision data', () => {
      const decision = {
        id: 'decision_123',
        type: DecisionType.CREATE_AGENT,
        reasoning: 'Need more agents',
        parameters: { role: AgentRole.BUILDER },
        timestamp: Date.now(),
        confidence: 0.85,
        madeBy: 'genesis_root',
      }

      expect(validateDecision(decision)).toBe(true)
    })

    it('should reject invalid decision type', () => {
      const invalidDecision = {
        id: 'decision_123',
        type: 'INVALID_TYPE',
        reasoning: 'Test',
        parameters: {},
        timestamp: Date.now(),
        confidence: 0.5,
        madeBy: 'genesis_root',
      }

      expect(validateDecision(invalidDecision)).toBe(false)
    })
  })

  describe('validateEvolutionEvent', () => {
    it('should validate correct evolution event', () => {
      const event = {
        id: 'evolution_123',
        type: EvolutionType.STRATEGY_ADJUSTMENT,
        description: 'Adjusted weights',
        metrics: {
          before: { weight: 0.5 },
          after: { weight: 0.6 },
        },
        timestamp: Date.now(),
        triggeredBy: 'decision_123',
      }

      expect(validateEvolutionEvent(event)).toBe(true)
    })

    it('should reject invalid evolution type', () => {
      const invalidEvent = {
        id: 'evolution_123',
        type: 'INVALID_TYPE',
        description: 'Test',
        metrics: {},
        timestamp: Date.now(),
        triggeredBy: 'decision_123',
      }

      expect(validateEvolutionEvent(invalidEvent)).toBe(false)
    })
  })
})
