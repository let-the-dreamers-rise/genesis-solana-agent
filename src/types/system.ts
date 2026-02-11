import { Agent } from './agent.js'
import { Decision } from './decision.js'

// System state for observation
export interface SystemState {
  agentCount: number
  activeAgents: Agent[]
  recentDecisions: Decision[]
  walletBalances: Map<string, number>
  evolutionMetrics: EvolutionMetrics
  timestamp: number
}

// Reasoning output
export interface Reasoning {
  observation: string
  analysis: string
  options: import('./decision.js').DecisionOption[]
  recommendation: import('./decision.js').DecisionOption
  confidence: number
}

// Evolution event types
export enum EvolutionType {
  STRATEGY_ADJUSTMENT = 'STRATEGY_ADJUSTMENT',
  PERFORMANCE_IMPROVEMENT = 'PERFORMANCE_IMPROVEMENT',
  NEW_CAPABILITY = 'NEW_CAPABILITY',
  ERROR_LEARNING = 'ERROR_LEARNING',
}

// Evolution event
export interface EvolutionEvent {
  id: string
  type: EvolutionType
  description: string
  metrics: {
    before: Record<string, number>
    after: Record<string, number>
  }
  timestamp: number
  triggeredBy: string
}

// Evolution metrics
export interface EvolutionMetrics {
  evolutionScore: number
  totalEvolutions: number
  lastEvolutionTime: number
}

// System metrics
export interface SystemMetrics {
  totalAgentsCreated: number
  activeAgents: number
  totalDecisions: number
  successfulActions: number
  failedActions: number
  totalTransactions: number
  averageCycleTime: number
  evolutionScore: number
  uptime: number
  lastUpdated: number
}

// Inter-agent message
export interface AgentMessage {
  id: string
  fromAgent: string
  toAgent: string
  type: 'TASK_ASSIGNMENT' | 'TASK_RESULT' | 'STATUS_REQUEST' | 'STATUS_RESPONSE' | 'COORDINATION'
  payload: Record<string, unknown>
  timestamp: number
}

// Task assignment for child agents
export interface TaskAssignment {
  id: string
  agentId: string
  type: string
  description: string
  assignedAt: number
  completedAt?: number
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  result?: string
  onChainTx?: string
}

// Agent performance report
export interface AgentReport {
  agentId: string
  role: string
  tasksCompleted: number
  tasksFailed: number
  successRate: number
  avgTaskDuration: number
  lastActive: number
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL'
}

