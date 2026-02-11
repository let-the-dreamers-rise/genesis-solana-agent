import { Decision, DecisionType, DecisionOption } from '../types/decision.js'
import { SystemState } from '../types/system.js'
import { getLogger } from '../utils/logger.js'
import { randomBytes } from 'crypto'

const logger = getLogger()

export class DecisionEngine {
  private decisionWeights: Record<DecisionType, number>

  constructor() {
    // Initialize base weights
    this.decisionWeights = {
      [DecisionType.CREATE_AGENT]: 0.3,
      [DecisionType.COORDINATE_AGENTS]: 0.15,
      [DecisionType.EVOLVE_STRATEGY]: 0.1,
      [DecisionType.WAIT_AND_OBSERVE]: 0.1,
      [DecisionType.DELEGATE_TASK]: 0.25,
      [DecisionType.ANALYZE_PERFORMANCE]: 0.1,
    }
  }

  /**
   * Generate decision options based on system state
   */
  generateOptions(state: SystemState): DecisionOption[] {
    const options: DecisionOption[] = []

    // CREATE_AGENT option
    options.push({
      type: DecisionType.CREATE_AGENT,
      weight: this.calculateCreateAgentWeight(state),
      reasoning: this.getCreateAgentReasoning(state),
      parameters: {},
    })

    // COORDINATE_AGENTS option
    options.push({
      type: DecisionType.COORDINATE_AGENTS,
      weight: this.calculateCoordinateWeight(state),
      reasoning: this.getCoordinateReasoning(state),
      parameters: { targetAgents: state.activeAgents.map((a) => a.id) },
    })

    // EVOLVE_STRATEGY option
    options.push({
      type: DecisionType.EVOLVE_STRATEGY,
      weight: this.calculateEvolveWeight(state),
      reasoning: this.getEvolveReasoning(state),
      parameters: {},
    })

    // WAIT_AND_OBSERVE option
    options.push({
      type: DecisionType.WAIT_AND_OBSERVE,
      weight: this.calculateWaitWeight(state),
      reasoning: this.getWaitReasoning(state),
      parameters: {},
    })

    // DELEGATE_TASK option
    options.push({
      type: DecisionType.DELEGATE_TASK,
      weight: this.calculateDelegateTaskWeight(state),
      reasoning: this.getDelegateTaskReasoning(state),
      parameters: { candidateAgents: state.activeAgents.filter((a) => a.id !== 'genesis_root').map((a) => a.id) },
    })

    // ANALYZE_PERFORMANCE option
    options.push({
      type: DecisionType.ANALYZE_PERFORMANCE,
      weight: this.calculateAnalyzeWeight(state),
      reasoning: this.getAnalyzeReasoning(state),
      parameters: {},
    })

    return options
  }

  /**
   * Select decision using weighted random selection with randomness
   */
  selectDecision(options: DecisionOption[]): DecisionOption {
    // Apply randomness (±20%)
    const randomizedOptions = options.map((option) => ({
      ...option,
      weight: this.applyRandomness(option.weight, 0.2),
    }))

    // Normalize weights
    const totalWeight = randomizedOptions.reduce((sum, opt) => sum + opt.weight, 0)
    const normalizedOptions = randomizedOptions.map((opt) => ({
      ...opt,
      weight: opt.weight / totalWeight,
    }))

    // Weighted random selection
    const random = Math.random()
    let cumulative = 0

    for (const option of normalizedOptions) {
      cumulative += option.weight
      if (random <= cumulative) {
        return option
      }
    }

    // Fallback to last option
    return normalizedOptions[normalizedOptions.length - 1]
  }

  /**
   * Create formal decision from option
   */
  createDecision(option: DecisionOption, madeBy: string): Decision {
    return {
      id: `decision_${randomBytes(8).toString('hex')}`,
      type: option.type,
      reasoning: option.reasoning,
      parameters: option.parameters || {},
      timestamp: Date.now(),
      confidence: option.weight,
      madeBy,
      agentId: madeBy,
    }
  }

  /**
   * Update decision weights based on outcomes
   */
  updateWeights(decisionType: DecisionType, success: boolean) {
    const adjustment = success ? 0.05 : -0.05
    this.decisionWeights[decisionType] = Math.max(
      0.05,
      Math.min(0.9, this.decisionWeights[decisionType] + adjustment)
    )

    logger.info(`Updated weight for ${decisionType}`, {
      newWeight: this.decisionWeights[decisionType],
    })
  }

  /**
   * Get current weights snapshot (for evolution tracking)
   */
  getWeightsSnapshot(): Record<string, number> {
    const snapshot: Record<string, number> = {}
    for (const [key, value] of Object.entries(this.decisionWeights)) {
      snapshot[key] = value
    }
    return snapshot
  }

  // Weight calculation methods
  private calculateCreateAgentWeight(state: SystemState): number {
    let weight = this.decisionWeights[DecisionType.CREATE_AGENT]

    if (state.agentCount < 3) {
      weight *= 1.75
    } else if (state.agentCount >= 5) {
      weight *= 0.25
    }

    return Math.max(0.05, Math.min(0.9, weight))
  }

  private calculateCoordinateWeight(state: SystemState): number {
    let weight = this.decisionWeights[DecisionType.COORDINATE_AGENTS]

    if (state.agentCount >= 3) {
      weight *= 2.0
    } else {
      weight *= 0.5
    }

    return Math.max(0.05, Math.min(0.9, weight))
  }

  private calculateEvolveWeight(state: SystemState): number {
    let weight = this.decisionWeights[DecisionType.EVOLVE_STRATEGY]

    if (state.evolutionMetrics.evolutionScore < 0.5) {
      weight *= 1.5
    }

    return Math.max(0.05, Math.min(0.9, weight))
  }

  private calculateWaitWeight(state: SystemState): number {
    let weight = this.decisionWeights[DecisionType.WAIT_AND_OBSERVE]

    if (state.recentDecisions.length < 5) {
      weight *= 0.7
    }

    return Math.max(0.05, Math.min(0.9, weight))
  }

  private calculateDelegateTaskWeight(state: SystemState): number {
    let weight = this.decisionWeights[DecisionType.DELEGATE_TASK]

    // High priority when we have agents that could be doing work
    const childAgents = state.activeAgents.filter((a) => a.id !== 'genesis_root')
    if (childAgents.length > 0) {
      weight *= 1.5
    } else {
      weight *= 0.1 // No agents to delegate to
    }

    // Boost when agents are idle
    const idleAgents = childAgents.filter((a) => !a.metadata.currentTask)
    if (idleAgents.length > childAgents.length / 2) {
      weight *= 1.3
    }

    return Math.max(0.05, Math.min(0.9, weight))
  }

  private calculateAnalyzeWeight(state: SystemState): number {
    let weight = this.decisionWeights[DecisionType.ANALYZE_PERFORMANCE]

    // More useful with more data
    if (state.recentDecisions.length >= 5) {
      weight *= 1.5
    }

    // More useful with more agents
    if (state.agentCount >= 3) {
      weight *= 1.3
    }

    return Math.max(0.05, Math.min(0.9, weight))
  }

  // Reasoning generation methods
  private getCreateAgentReasoning(state: SystemState): string {
    if (state.agentCount === 0) {
      return 'No agents exist yet. Creating first agent to bootstrap the ecosystem.'
    } else if (state.agentCount < 3) {
      return `Only ${state.agentCount} agents active. Need more agents to build robust ecosystem.`
    } else {
      return `System has ${state.agentCount} agents. Consider adding specialized agent for new capabilities.`
    }
  }

  private getCoordinateReasoning(state: SystemState): string {
    return `${state.agentCount} agents active. Coordination can optimize their collective performance.`
  }

  private getEvolveReasoning(state: SystemState): string {
    return `Evolution score: ${state.evolutionMetrics.evolutionScore.toFixed(2)}. Adjusting strategy based on performance.`
  }

  private getWaitReasoning(state: SystemState): string {
    return `System stable with ${state.agentCount} agents. Observing current state before next action.`
  }

  private getDelegateTaskReasoning(state: SystemState): string {
    const childAgents = state.activeAgents.filter((a) => a.id !== 'genesis_root')
    const idle = childAgents.filter((a) => !a.metadata.currentTask)
    if (idle.length > 0) {
      return `${idle.length} idle agents available. Delegating role-specific tasks to utilize the ecosystem.`
    }
    return `${childAgents.length} child agents active. Assigning new work to keep the ecosystem productive.`
  }

  private getAnalyzeReasoning(state: SystemState): string {
    return `System has ${state.recentDecisions.length} recent decisions. Analyzing performance to optimize strategy.`
  }

  /**
   * Apply randomness to weight
   */
  private applyRandomness(weight: number, variance: number): number {
    const randomFactor = 1 + (Math.random() * 2 - 1) * variance
    return weight * randomFactor
  }
}
