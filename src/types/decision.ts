// Decision types
export enum DecisionType {
  CREATE_AGENT = 'CREATE_AGENT',
  COORDINATE_AGENTS = 'COORDINATE_AGENTS',
  EVOLVE_STRATEGY = 'EVOLVE_STRATEGY',
  WAIT_AND_OBSERVE = 'WAIT_AND_OBSERVE',
  DELEGATE_TASK = 'DELEGATE_TASK',
  ANALYZE_PERFORMANCE = 'ANALYZE_PERFORMANCE',
}

// Decision interface
export interface Decision {
  id: string
  type: DecisionType
  reasoning: string
  parameters: Record<string, unknown>
  timestamp: number
  confidence: number
  madeBy: string
  agentId?: string
}

// Decision option for reasoning
export interface DecisionOption {
  type: DecisionType
  weight: number
  reasoning: string
  parameters?: Record<string, unknown>
}

// Action result
export interface ActionResult {
  success: boolean
  decision: Decision
  outcome: string
  transactionSignature?: string
  error?: string
  timestamp: number
  duration: number
}

// Decision log entry
export interface DecisionLog {
  decision: Decision
  result: ActionResult
  timestamp: number
}
