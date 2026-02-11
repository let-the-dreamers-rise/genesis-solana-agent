import { Agent, AgentRole, AgentStatus } from '../types/agent.js'
import { SystemState } from '../types/system.js'
import { MemorySystem } from '../memory/memory-system.js'
import { AgentWallet } from '../wallet/agent-wallet.js'
import { getRoleTemplate } from './role-templates.js'
import { getLogger } from '../utils/logger.js'
import { randomBytes } from 'crypto'

const logger = getLogger()

export class AgentFactory {
  private memory: MemorySystem
  private wallet: AgentWallet
  private createdAgents: Set<string> = new Set()

  constructor(memory: MemorySystem, wallet: AgentWallet) {
    this.memory = memory
    this.wallet = wallet
  }

  /**
   * Create a new agent with specified role
   */
  async createAgent(role: AgentRole, context: SystemState, creatorId: string): Promise<Agent> {
    try {
      // Generate unique agent ID
      const agentId = this.generateAgentId()

      // Generate mission
      const mission = this.generateMission(role, context)

      // Ensure uniqueness
      await this.ensureUniqueness(agentId, role, mission)

      // Create wallet for agent
      const walletInfo = await this.wallet.createWallet(agentId, false)

      // Create agent object
      const agent: Agent = {
        id: agentId,
        role,
        mission,
        walletAddress: walletInfo.publicKey,
        createdAt: Date.now(),
        createdBy: creatorId,
        status: AgentStatus.CREATED,
        metadata: {
          creationTx: '', // Will be filled after on-chain logging
          missionProgress: 0,
          lastActive: Date.now(),
          successCount: 0,
          failureCount: 0,
          taskHistory: [],
        },
      }

      // Save to memory
      await this.memory.saveAgent(agent)

      // Track created agent
      this.createdAgents.add(agentId)

      await logger.info(`Created agent ${agentId} with role ${role}`)

      return agent
    } catch (error) {
      await logger.error(`Failed to create agent with role ${role}`, { error })
      throw error
    }
  }

  /**
   * Generate unique agent ID
   */
  private generateAgentId(): string {
    const randomId = randomBytes(8).toString('hex')
    return `agent_${randomId}`
  }

  /**
   * Generate mission for agent based on role and context
   */
  generateMission(role: AgentRole, context: SystemState): string {
    const template = getRoleTemplate(role)
    const templates = template.missionTemplates

    // Select random template
    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)]

    // Inject context variables
    const mission = selectedTemplate
      .replace('{agentCount}', context.agentCount.toString())
      .replace('{timestamp}', new Date().toISOString())
      .replace('{uniqueId}', randomBytes(4).toString('hex'))

    return mission
  }

  /**
   * Ensure agent uniqueness
   */
  private async ensureUniqueness(agentId: string, role: AgentRole, mission: string): Promise<void> {
    // Check if agent ID already exists
    const existingAgent = await this.memory.getAgent(agentId)
    if (existingAgent) {
      throw new Error(`Agent with ID ${agentId} already exists`)
    }

    // Check for identical role-mission combination
    const allAgents = await this.memory.getAllAgents()
    const duplicate = allAgents.find((a) => a.role === role && a.mission === mission)
    if (duplicate) {
      throw new Error(`Agent with identical role-mission combination already exists`)
    }
  }

  /**
   * Get supported roles
   */
  getSupportedRoles(): AgentRole[] {
    return Object.values(AgentRole)
  }

  /**
   * Get agent template for role
   */
  getAgentTemplate(role: AgentRole) {
    return getRoleTemplate(role)
  }

  /**
   * Select role based on system state (balance roles)
   */
  selectRole(context: SystemState): AgentRole {
    const agents = context.activeAgents
    const roleCounts = new Map<AgentRole, number>()

    // Count agents by role
    for (const role of Object.values(AgentRole)) {
      roleCounts.set(role, 0)
    }

    for (const agent of agents) {
      const count = roleCounts.get(agent.role) || 0
      roleCounts.set(agent.role, count + 1)
    }

    // Find underrepresented roles
    const minCount = Math.min(...Array.from(roleCounts.values()))
    const underrepresentedRoles = Array.from(roleCounts.entries())
      .filter(([_, count]) => count === minCount)
      .map(([role, _]) => role)

    // Select random underrepresented role
    return underrepresentedRoles[Math.floor(Math.random() * underrepresentedRoles.length)]
  }
}
