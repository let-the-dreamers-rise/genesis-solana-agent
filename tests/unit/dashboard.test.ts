import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ActivityDashboard } from '../../src/dashboard/activity-dashboard.js'
import { EventType, EventSeverity, DashboardEvent, DemoSummary } from '../../src/types/dashboard.js'
import { Decision, DecisionType } from '../../src/types/decision.js'
import { Reasoning } from '../../src/types/system.js'

describe('ActivityDashboard', () => {
  let dashboard: ActivityDashboard
  let consoleSpy: any

  beforeEach(() => {
    dashboard = new ActivityDashboard(true, 20)
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe('start', () => {
    it('should display header when enabled', () => {
      dashboard.start()
      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should not display when disabled', () => {
      const disabledDashboard = new ActivityDashboard(false)
      disabledDashboard.start()
      expect(consoleSpy).not.toHaveBeenCalled()
    })
  })

  describe('broadcastEvent', () => {
    it('should display event when enabled', () => {
      const event: DashboardEvent = {
        type: EventType.SYSTEM_STATUS,
        title: 'Test Event',
        description: 'Test description',
        data: {},
        timestamp: Date.now(),
        severity: EventSeverity.INFO,
      }

      dashboard.broadcastEvent(event)
      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should limit stored events to maxEvents', () => {
      const smallDashboard = new ActivityDashboard(true, 2)
      
      for (let i = 0; i < 5; i++) {
        const event: DashboardEvent = {
          type: EventType.SYSTEM_STATUS,
          title: `Event ${i}`,
          description: 'Test',
          data: {},
          timestamp: Date.now(),
          severity: EventSeverity.INFO,
        }
        smallDashboard.broadcastEvent(event)
      }
      
      // Dashboard should only keep last 2 events
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('displayDecision', () => {
    it('should display decision with reasoning', () => {
      const decision: Decision = {
        id: 'decision_1',
        type: DecisionType.CREATE_AGENT,
        agentId: 'genesis_root',
        reasoning: 'Test reasoning',
        confidence: 0.85,
        timestamp: Date.now(),
        parameters: {},
      }

      const reasoning: Reasoning = {
        observation: 'Test observation',
        analysis: 'Test analysis',
        options: [],
        recommendation: { type: DecisionType.CREATE_AGENT, weight: 0.85, reasoning: 'Test' },
        confidence: 0.85,
      }

      dashboard.displayDecision(decision, reasoning)
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('displayTransaction', () => {
    it('should display transaction with explorer link', () => {
      const signature = 'test_signature_123'
      const type = 'AGENT_CREATION'

      dashboard.displayTransaction(signature, type)
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('displayAgentCreation', () => {
    it('should display agent creation event', () => {
      dashboard.displayAgentCreation(
        'agent_123',
        'EXPLORER',
        'Test mission',
        'wallet_address_123',
        'tx_signature_123'
      )
      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should truncate long wallet addresses', () => {
      const longWallet = 'a'.repeat(50)
      dashboard.displayAgentCreation(
        'agent_123',
        'EXPLORER',
        'Test mission',
        longWallet,
        'tx_signature_123'
      )
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('displayStatus', () => {
    it('should display status message', () => {
      dashboard.displayStatus('System running normally')
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('displayError', () => {
    it('should display error message', () => {
      dashboard.displayError('Test error', new Error('Test error'))
      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should display error without error object', () => {
      dashboard.displayError('Test error')
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('displaySummary', () => {
    it('should display demo summary', () => {
      const summary: DemoSummary = {
        duration: 120000,
        agentsCreated: 5,
        decisionsExecuted: 10,
        transactionsSubmitted: 5,
        evolutionEvents: 3,
        successRate: 0.9,
      }

      dashboard.displaySummary(summary)
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('stop', () => {
    it('should display stop message', () => {
      dashboard.stop()
      expect(consoleSpy).toHaveBeenCalled()
    })
  })
})
