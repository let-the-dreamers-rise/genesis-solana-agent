// Event types for dashboard
export enum EventType {
  AGENT_CREATED = 'AGENT_CREATED',
  DECISION_MADE = 'DECISION_MADE',
  TRANSACTION_SUBMITTED = 'TRANSACTION_SUBMITTED',
  EVOLUTION_EVENT = 'EVOLUTION_EVENT',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  SYSTEM_STATUS = 'SYSTEM_STATUS',
  TASK_EXECUTED = 'TASK_EXECUTED',
  COORDINATION = 'COORDINATION',
}

// Event severity levels
export enum EventSeverity {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

// Dashboard event
export interface DashboardEvent {
  type: EventType
  title: string
  description: string
  data: Record<string, unknown>
  timestamp: number
  severity: EventSeverity
}

// Demo summary
export interface DemoSummary {
  duration: number
  agentsCreated: number
  decisionsExecuted: number
  transactionsSubmitted: number
  evolutionEvents: number
  successRate: number
}
