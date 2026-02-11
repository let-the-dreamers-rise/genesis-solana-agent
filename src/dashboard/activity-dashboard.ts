import { DashboardEvent, EventType, EventSeverity, DemoSummary } from '../types/dashboard.js'
import { Decision } from '../types/decision.js'
import { Reasoning } from '../types/system.js'

export class ActivityDashboard {
  private enabled: boolean
  private events: DashboardEvent[] = []
  private maxEvents: number

  constructor(enabled: boolean = true, maxEvents: number = 20) {
    this.enabled = enabled
    this.maxEvents = maxEvents
  }

  start(): void {
    if (!this.enabled) return

    console.clear()
    this.displayHeader()
  }

  stop(): void {
    if (!this.enabled) return
    console.log('\n' + '='.repeat(80))
    console.log('Dashboard stopped')
  }

  broadcastEvent(event: DashboardEvent): void {
    if (!this.enabled) return

    this.events.push(event)
    if (this.events.length > this.maxEvents) {
      this.events.shift()
    }

    this.displayEvent(event)
  }

  updateAgentCount(_count: number): void {
    if (!this.enabled) return
    // Agent count is displayed in events
  }

  displayDecision(decision: Decision, reasoning: Reasoning): void {
    if (!this.enabled) return

    const event: DashboardEvent = {
      type: EventType.DECISION_MADE,
      title: '🧠 DECISION MADE',
      description: `Type: ${decision.type}`,
      data: {
        observation: reasoning.observation,
        reasoning: decision.reasoning,
        confidence: decision.confidence.toFixed(2),
      },
      timestamp: Date.now(),
      severity: EventSeverity.INFO,
    }

    this.broadcastEvent(event)
  }

  displayTransaction(signature: string, type: string): void {
    if (!this.enabled) return

    const event: DashboardEvent = {
      type: EventType.TRANSACTION_SUBMITTED,
      title: '⛓️  TRANSACTION SUBMITTED',
      description: `Type: ${type}`,
      data: {
        signature,
        explorer: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
      },
      timestamp: Date.now(),
      severity: EventSeverity.SUCCESS,
    }

    this.broadcastEvent(event)
  }

  displaySummary(summary: DemoSummary): void {
    if (!this.enabled) return

    console.log('\n' + '='.repeat(80))
    console.log('📊 DEMO SUMMARY')
    console.log('='.repeat(80))
    console.log(`Duration: ${(summary.duration / 1000).toFixed(0)}s`)
    console.log(`Agents Created: ${summary.agentsCreated}`)
    console.log(`Decisions Executed: ${summary.decisionsExecuted}`)
    console.log(`Transactions Submitted: ${summary.transactionsSubmitted}`)
    console.log(`Evolution Events: ${summary.evolutionEvents}`)
    console.log(`Success Rate: ${(summary.successRate * 100).toFixed(1)}%`)
    console.log('='.repeat(80))
  }

  private displayHeader(): void {
    console.log('╔' + '═'.repeat(78) + '╗')
    console.log('║' + ' '.repeat(20) + 'GENESIS AUTONOMOUS AGENT SYSTEM' + ' '.repeat(26) + '║')
    console.log('║' + ' '.repeat(22) + 'Autonomous Agent Ecosystem' + ' '.repeat(29) + '║')
    console.log('╚' + '═'.repeat(78) + '╝')
    console.log('')
  }

  private displayEvent(event: DashboardEvent): void {
    const timestamp = new Date(event.timestamp).toLocaleTimeString()
    const icon = this.getEventIcon(event.type)

    console.log(`\n[${timestamp}] ${icon} ${event.title}`)
    console.log(`  ${event.description}`)

    if (Object.keys(event.data).length > 0) {
      for (const [key, value] of Object.entries(event.data)) {
        if (typeof value === 'string' && value.length > 100) {
          console.log(`  ${key}: ${value.substring(0, 100)}...`)
        } else {
          console.log(`  ${key}: ${value}`)
        }
      }
    }
  }

  private getEventIcon(type: EventType): string {
    switch (type) {
      case EventType.AGENT_CREATED:
        return '🤖'
      case EventType.DECISION_MADE:
        return '🧠'
      case EventType.TRANSACTION_SUBMITTED:
        return '⛓️ '
      case EventType.EVOLUTION_EVENT:
        return '📈'
      case EventType.ERROR_OCCURRED:
        return '❌'
      case EventType.SYSTEM_STATUS:
        return 'ℹ️ '
      case EventType.TASK_EXECUTED:
        return '⚡'
      case EventType.COORDINATION:
        return '🔄'
      default:
        return '•'
    }
  }

  displayAgentCreation(agentId: string, role: string, mission: string, wallet: string, txSignature?: string): void {
    if (!this.enabled) return

    const event: DashboardEvent = {
      type: EventType.AGENT_CREATED,
      title: '🤖 AGENT CREATED',
      description: `Role: ${role}`,
      data: {
        agentId,
        mission,
        wallet: wallet.substring(0, 8) + '...' + wallet.substring(wallet.length - 4),
        tx: txSignature
          ? `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`
          : 'pending',
      },
      timestamp: Date.now(),
      severity: EventSeverity.SUCCESS,
    }

    this.broadcastEvent(event)
  }

  displayTaskExecution(agentId: string, role: string, taskResult: string, txSignature?: string): void {
    if (!this.enabled) return

    const event: DashboardEvent = {
      type: EventType.TASK_EXECUTED,
      title: '⚡ TASK EXECUTED',
      description: `Agent: ${agentId} (${role})`,
      data: {
        result: taskResult,
        tx: txSignature
          ? `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`
          : 'N/A',
      },
      timestamp: Date.now(),
      severity: EventSeverity.SUCCESS,
    }

    this.broadcastEvent(event)
  }

  displayCoordination(agentCount: number, healthy: number, degraded: number, critical: number, txSignature?: string): void {
    if (!this.enabled) return

    const event: DashboardEvent = {
      type: EventType.COORDINATION,
      title: '🔄 COORDINATION EVENT',
      description: `Ecosystem sweep across ${agentCount} agents`,
      data: {
        healthy,
        degraded,
        critical,
        tx: txSignature
          ? `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`
          : 'N/A',
      },
      timestamp: Date.now(),
      severity: critical > 0 ? EventSeverity.WARNING : EventSeverity.INFO,
    }

    this.broadcastEvent(event)
  }

  displayStatus(message: string): void {
    if (!this.enabled) return

    const event: DashboardEvent = {
      type: EventType.SYSTEM_STATUS,
      title: 'ℹ️  SYSTEM STATUS',
      description: message,
      data: {},
      timestamp: Date.now(),
      severity: EventSeverity.INFO,
    }

    this.broadcastEvent(event)
  }

  displayError(message: string, error?: unknown): void {
    if (!this.enabled) return

    const event: DashboardEvent = {
      type: EventType.ERROR_OCCURRED,
      title: '❌ ERROR',
      description: message,
      data: error ? { error: String(error) } : {},
      timestamp: Date.now(),
      severity: EventSeverity.ERROR,
    }

    this.broadcastEvent(event)
  }
}
