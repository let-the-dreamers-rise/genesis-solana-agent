// Agent role types
export enum AgentRole {
  EXPLORER = 'EXPLORER',
  BUILDER = 'BUILDER',
  ANALYST = 'ANALYST',
  COORDINATOR = 'COORDINATOR',
  GUARDIAN = 'GUARDIAN',
}

// Agent status types
export enum AgentStatus {
  CREATED = 'CREATED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
}

// Agent interface
export interface Agent {
  id: string
  role: AgentRole
  mission: string
  walletAddress: string
  createdAt: number
  createdBy: string
  status: AgentStatus
  metadata: {
    creationTx: string
    missionProgress: number
    lastActive: number
    successCount: number
    failureCount: number
    currentTask?: string
    taskHistory: string[]
  }
}

// Agent template for factory
export interface AgentTemplate {
  role: AgentRole
  capabilities: string[]
  missionTemplates: string[]
  codeTemplate: string
}

// Agent filter for querying
export interface AgentFilter {
  role?: AgentRole
  status?: AgentStatus
  createdAfter?: number
  createdBefore?: number
}
