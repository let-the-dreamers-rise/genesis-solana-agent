import { Agent, AgentStatus } from '../types/agent.js'
import { Decision, DecisionType, ActionResult } from '../types/decision.js'
import { SystemState, Reasoning, EvolutionEvent, EvolutionType } from '../types/system.js'
import { MemorySystem } from '../memory/memory-system.js'
import { AgentWallet } from '../wallet/agent-wallet.js'
import { AgentFactory } from '../factory/agent-factory.js'
import { SolanaTransactions, MemoData } from '../solana/transactions.js'
import { DecisionEngine } from './decision-engine.js'
import { TaskExecutor } from './task-executor.js'
import { AgentCoordinator } from './agent-coordinator.js'
import { getLogger } from '../utils/logger.js'
import { randomBytes } from 'crypto'

const logger = getLogger()

const GENESIS_ID = 'genesis_root'

export class GenesisAgent {
  private memory: MemorySystem
  private wallet: AgentWallet
  private factory: AgentFactory
  private solana: SolanaTransactions
  private decisionEngine: DecisionEngine
  private taskExecutor: TaskExecutor
  private coordinator: AgentCoordinator
  private running: boolean = false
  private loopInterval: number
  private startTime: number = 0

  constructor(
    memory: MemorySystem,
    wallet: AgentWallet,
    factory: AgentFactory,
    solana: SolanaTransactions,
    loopInterval: number = 24000
  ) {
    this.memory = memory
    this.wallet = wallet
    this.factory = factory
    this.solana = solana
    this.decisionEngine = new DecisionEngine()
    this.taskExecutor = new TaskExecutor(memory, wallet, solana)
    this.coordinator = new AgentCoordinator(memory, wallet, solana)
    this.loopInterval = loopInterval
  }

  /**
   * Start autonomy loop
   */
  async startAutonomyLoop(): Promise<void> {
    this.running = true
    this.startTime = Date.now()

    await logger.info('GENESIS autonomy loop started')

    while (this.running) {
      const cycleStart = Date.now()

      try {
        // Execute autonomy loop phases
        const state = await this.observe()
        const reasoning = await this.reason(state)
        const decision = await this.decide(reasoning)
        const result = await this.act(decision)
        await this.log(decision, result)
        await this.evolve(result)

        // Calculate cycle time
        const cycleTime = Date.now() - cycleStart

        // Update metrics
        await this.updateMetrics(cycleTime, result.success)

        await logger.info(`Autonomy loop cycle completed in ${cycleTime}ms`)

        // Wait for next cycle
        const waitTime = Math.max(0, this.loopInterval - cycleTime)
        if (waitTime > 0 && this.running) {
          await this.sleep(waitTime)
        }
      } catch (error) {
        await logger.error('Error in autonomy loop', { error })
        // Continue loop despite errors
        await this.sleep(5000)
      }
    }

    await logger.info('GENESIS autonomy loop stopped')
  }

  /**
   * Stop autonomy loop
   */
  stopAutonomyLoop(): void {
    this.running = false
  }

  /**
   * Observe phase: Query system state
   */
  async observe(): Promise<SystemState> {
    const agents = await this.memory.getAllAgents()
    const activeAgents = agents.filter((a) => a.status === AgentStatus.ACTIVE || a.status === AgentStatus.CREATED)
    const recentDecisions = await this.memory.getDecisions(10)
    const metrics = await this.memory.getMetrics()

    // Get wallet balances
    const wallets = await this.wallet.getAllWallets()
    const walletBalances = new Map<string, number>()
    for (const w of wallets) {
      walletBalances.set(w.agentId, w.balance)
    }

    const state: SystemState = {
      agentCount: activeAgents.length,
      activeAgents,
      recentDecisions: recentDecisions.map((d) => d.decision),
      walletBalances,
      evolutionMetrics: {
        evolutionScore: metrics.evolutionScore,
        totalEvolutions: 0,
        lastEvolutionTime: Date.now(),
      },
      timestamp: Date.now(),
    }

    await logger.info('Observed system state', {
      agentCount: state.agentCount,
      recentDecisions: state.recentDecisions.length,
    })

    return state
  }

  /**
   * Reason phase: Analyze state and generate options
   */
  async reason(state: SystemState): Promise<Reasoning> {
    const options = this.decisionEngine.generateOptions(state)
    const recommendation = this.decisionEngine.selectDecision(options)

    const reasoning: Reasoning = {
      observation: `System has ${state.agentCount} active agents, ${state.recentDecisions.length} recent decisions`,
      analysis: this.generateAnalysis(state),
      options,
      recommendation,
      confidence: recommendation.weight,
    }

    await logger.info('Reasoning completed', {
      recommendation: recommendation.type,
      confidence: recommendation.weight.toFixed(2),
    })

    return reasoning
  }

  /**
   * Decide phase: Formalize decision
   */
  async decide(reasoning: Reasoning): Promise<Decision> {
    const decision = this.decisionEngine.createDecision(reasoning.recommendation, GENESIS_ID)

    await logger.info('Decision made', {
      type: decision.type,
      confidence: decision.confidence.toFixed(2),
    })

    return decision
  }

  /**
   * Act phase: Execute decision
   */
  async act(decision: Decision): Promise<ActionResult> {
    const startTime = Date.now()

    try {
      let outcome: string
      let transactionSignature: string | undefined

      switch (decision.type) {
        case DecisionType.CREATE_AGENT: {
          const result = await this.actCreateAgent()
          outcome = result.outcome
          transactionSignature = result.transactionSignature
          break
        }

        case DecisionType.COORDINATE_AGENTS: {
          const result = await this.actCoordinateAgents()
          outcome = result.outcome
          transactionSignature = result.transactionSignature
          break
        }

        case DecisionType.EVOLVE_STRATEGY: {
          const result = await this.actEvolveStrategy()
          outcome = result.outcome
          transactionSignature = result.transactionSignature
          break
        }

        case DecisionType.DELEGATE_TASK: {
          const result = await this.actDelegateTask()
          outcome = result.outcome
          transactionSignature = result.transactionSignature
          break
        }

        case DecisionType.ANALYZE_PERFORMANCE: {
          const result = await this.actAnalyzePerformance()
          outcome = result.outcome
          transactionSignature = result.transactionSignature
          break
        }

        case DecisionType.WAIT_AND_OBSERVE:
          outcome = 'Observed system state, no action taken'
          break

        default:
          outcome = 'Unknown decision type'
      }

      const actionResult: ActionResult = {
        success: true,
        decision,
        outcome,
        transactionSignature,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      }

      await logger.info('Action completed', { outcome })

      return actionResult
    } catch (error) {
      await logger.error('Action failed', { error })

      return {
        success: false,
        decision,
        outcome: 'Action failed',
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      }
    }
  }

  /**
   * Log phase: Persist decision and broadcast
   */
  async log(decision: Decision, result: ActionResult): Promise<void> {
    // Log to memory
    await this.memory.logDecision(decision, result)

    // Log transaction signature if available
    if (result.transactionSignature) {
      await logger.info('Transaction logged', {
        signature: result.transactionSignature,
        explorer: `https://explorer.solana.com/tx/${result.transactionSignature}?cluster=devnet`,
      })
    }
  }

  /**
   * Evolve phase: Update weights and record evolution with real metric tracking
   */
  async evolve(result: ActionResult): Promise<void> {
    // Capture weights BEFORE update
    const weightsBefore = this.decisionEngine.getWeightsSnapshot()

    // Update decision weights
    this.decisionEngine.updateWeights(result.decision.type, result.success)

    // Capture weights AFTER update
    const weightsAfter = this.decisionEngine.getWeightsSnapshot()

    // Convert to numeric records for the EvolutionEvent
    const beforeMetrics: Record<string, number> = {}
    const afterMetrics: Record<string, number> = {}
    for (const key of Object.keys(weightsBefore)) {
      beforeMetrics[key] = weightsBefore[key]
      afterMetrics[key] = weightsAfter[key]
    }

    // Record evolution event (higher chance than before to show more activity)
    if (Math.random() < 0.5) {
      const event: EvolutionEvent = {
        id: `evolution_${randomBytes(8).toString('hex')}`,
        type: result.success ? EvolutionType.PERFORMANCE_IMPROVEMENT : EvolutionType.ERROR_LEARNING,
        description: `${result.decision.type}: weight ${result.success ? 'increased' : 'decreased'} from ${weightsBefore[result.decision.type]?.toFixed(3)} to ${weightsAfter[result.decision.type]?.toFixed(3)}`,
        metrics: {
          before: beforeMetrics,
          after: afterMetrics,
        },
        timestamp: Date.now(),
        triggeredBy: result.decision.id,
      }

      await this.memory.logEvolution(event)
    }

    // Update evolution score
    const metrics = await this.memory.getMetrics()
    const newScore = Math.min(1.0, metrics.evolutionScore + (result.success ? 0.01 : -0.005))
    await this.memory.updateMetrics({ evolutionScore: newScore })
  }

  // ==================== ACTION IMPLEMENTATIONS ====================

  /**
   * CREATE_AGENT: Spawn a new child agent with wallet and on-chain proof
   */
  private async actCreateAgent(): Promise<{ outcome: string; transactionSignature?: string }> {
    const state = await this.observe()
    const role = this.factory.selectRole(state)
    const agent = await this.factory.createAgent(role, state, GENESIS_ID)

    // Set agent to active
    agent.status = AgentStatus.ACTIVE
    await this.memory.saveAgent(agent)

    // Log on-chain
    const walletInfo = await this.wallet.getWallet(GENESIS_ID)
    if (walletInfo) {
      const keypair = this.wallet.getKeypair(walletInfo)
      const memoData: MemoData = {
        type: 'AGENT_CREATION',
        agentId: agent.id,
        role: agent.role,
        mission: agent.mission,
        timestamp: Date.now(),
        genesisId: GENESIS_ID,
      }

      const transaction = await this.solana.buildMemoTransaction(memoData, keypair.publicKey)
      const signature = await this.solana.submitTransaction(transaction, [keypair])

      // Update agent with transaction
      agent.metadata.creationTx = signature
      await this.memory.saveAgent(agent)

      // Update transaction count
      const metrics = await this.memory.getMetrics()
      await this.memory.updateMetrics({ totalTransactions: metrics.totalTransactions + 1 })

      return {
        outcome: `Created ${role} agent: ${agent.id} (wallet: ${agent.walletAddress.substring(0, 8)}...)`,
        transactionSignature: signature,
      }
    }

    return { outcome: `Created ${role} agent: ${agent.id}` }
  }

  /**
   * COORDINATE_AGENTS: Real coordination — health checks, task redistribution, messaging
   */
  private async actCoordinateAgents(): Promise<{ outcome: string; transactionSignature?: string }> {
    const state = await this.observe()
    const result = await this.coordinator.coordinateAgents(state)

    return {
      outcome: result.outcome,
      transactionSignature: result.txSignature,
    }
  }

  /**
   * EVOLVE_STRATEGY: Real strategy evolution with metric tracking and on-chain logging
   */
  private async actEvolveStrategy(): Promise<{ outcome: string; transactionSignature?: string }> {
    const metrics = await this.memory.getMetrics()

    // Calculate strategy adjustments based on performance data
    const successRate =
      metrics.successfulActions + metrics.failedActions > 0
        ? metrics.successfulActions / (metrics.successfulActions + metrics.failedActions)
        : 1.0

    const adjustments: string[] = []

    // If success rate is low, boost WAIT_AND_OBSERVE to be more cautious
    if (successRate < 0.5) {
      this.decisionEngine.updateWeights(DecisionType.WAIT_AND_OBSERVE, true)
      adjustments.push('Increased WAIT_AND_OBSERVE weight (low success rate)')
    }

    // If we have few agents, boost CREATE_AGENT
    const allAgents = await this.memory.getAllAgents()
    if (allAgents.length < 3) {
      this.decisionEngine.updateWeights(DecisionType.CREATE_AGENT, true)
      adjustments.push('Boosted CREATE_AGENT (ecosystem too small)')
    }

    // If we have agents but low activity, boost DELEGATE_TASK
    if (allAgents.length >= 3 && metrics.totalDecisions > 5) {
      this.decisionEngine.updateWeights(DecisionType.DELEGATE_TASK, true)
      adjustments.push('Boosted DELEGATE_TASK (agents available, need more activity)')
    }

    // Log evolution on-chain
    let txSignature: string | undefined
    try {
      const walletInfo = await this.wallet.getWallet(GENESIS_ID)
      if (walletInfo) {
        const keypair = this.wallet.getKeypair(walletInfo)
        const memoData: MemoData = {
          type: 'STRATEGY_EVOLUTION',
          agentId: GENESIS_ID,
          successRate: Math.round(successRate * 100),
          adjustments: adjustments.join('; ').substring(0, 200),
          weightsAfter: JSON.stringify(this.decisionEngine.getWeightsSnapshot()).substring(0, 200),
          timestamp: Date.now(),
          genesisId: GENESIS_ID,
        }

        const transaction = await this.solana.buildMemoTransaction(memoData, keypair.publicKey)
        txSignature = await this.solana.submitTransaction(transaction, [keypair])

        const m = await this.memory.getMetrics()
        await this.memory.updateMetrics({ totalTransactions: m.totalTransactions + 1 })
      }
    } catch (error) {
      await logger.warn('Failed to log evolution on-chain', { error })
    }

    const outcome = `Strategy evolution: ${adjustments.length} adjustments, success rate ${(successRate * 100).toFixed(1)}%`
    return { outcome, transactionSignature: txSignature }
  }

  /**
   * DELEGATE_TASK: Assign role-specific work to a child agent
   */
  private async actDelegateTask(): Promise<{ outcome: string; transactionSignature?: string }> {
    const agents = await this.memory.getAllAgents()
    const childAgents = agents.filter(
      (a) =>
        a.id !== GENESIS_ID &&
        (a.status === AgentStatus.ACTIVE || a.status === AgentStatus.CREATED) &&
        !a.metadata.currentTask
    )

    if (childAgents.length === 0) {
      return { outcome: 'No idle child agents available for task delegation' }
    }

    // Select an agent to delegate to (prefer least recently active)
    const selectedAgent = childAgents.sort((a, b) => a.metadata.lastActive - b.metadata.lastActive)[0]

    // Mark agent as busy
    selectedAgent.metadata.currentTask = `${selectedAgent.role}_TASK`
    await this.memory.saveAgent(selectedAgent)

    // Execute the task
    const taskResult = await this.taskExecutor.executeTask(selectedAgent)

    const outcome = `Delegated task to ${selectedAgent.role} agent ${selectedAgent.id}: ${taskResult.status} — ${(taskResult.result || '').substring(0, 120)}`
    return {
      outcome,
      transactionSignature: taskResult.onChainTx,
    }
  }

  /**
   * ANALYZE_PERFORMANCE: Generate comprehensive performance analysis
   */
  private async actAnalyzePerformance(): Promise<{ outcome: string; transactionSignature?: string }> {
    const state = await this.observe()
    const result = await this.coordinator.analyzePerformance(state)

    if (result.recommendations.length > 0) {
      await logger.info('Performance recommendations', { recommendations: result.recommendations })
    }

    return {
      outcome: result.outcome,
      transactionSignature: result.txSignature,
    }
  }

  // ==================== HELPERS ====================

  private generateAnalysis(state: SystemState): string {
    if (state.agentCount === 0) {
      return 'No agents exist. System needs bootstrap agent to begin operations.'
    } else if (state.agentCount < 3) {
      return 'Agent count below minimum threshold. Prioritizing agent creation.'
    } else if (state.agentCount >= 5) {
      return 'Sufficient agents exist. Focus on task delegation, coordination and optimization.'
    } else {
      return 'Agent ecosystem balanced. Evaluating best action — may delegate tasks or coordinate agents.'
    }
  }

  private async updateMetrics(cycleTime: number, success: boolean): Promise<void> {
    const metrics = await this.memory.getMetrics()
    const uptime = (Date.now() - this.startTime) / 1000

    await this.memory.updateMetrics({
      totalDecisions: metrics.totalDecisions + 1,
      successfulActions: metrics.successfulActions + (success ? 1 : 0),
      failedActions: metrics.failedActions + (success ? 0 : 1),
      averageCycleTime: (metrics.averageCycleTime * metrics.totalDecisions + cycleTime) / (metrics.totalDecisions + 1),
      uptime,
    })
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Get active agents
   */
  async getActiveAgents(): Promise<Agent[]> {
    const agents = await this.memory.getAllAgents()
    return agents.filter((a) => a.status === AgentStatus.ACTIVE || a.status === AgentStatus.CREATED)
  }
}
