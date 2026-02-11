import { Agent, AgentRole } from '../types/agent.js'
import { TaskAssignment } from '../types/system.js'
import { MemorySystem } from '../memory/memory-system.js'
import { AgentWallet } from '../wallet/agent-wallet.js'
import { SolanaTransactions, MemoData } from '../solana/transactions.js'
import { getLogger } from '../utils/logger.js'
import { randomBytes } from 'crypto'

const logger = getLogger()

/**
 * TaskExecutor gives child agents actual work to do based on their roles.
 * Each task produces an on-chain memo proving the work happened.
 */
export class TaskExecutor {
    private memory: MemorySystem
    private wallet: AgentWallet
    private solana: SolanaTransactions
    private activeTasks: Map<string, TaskAssignment> = new Map()

    constructor(memory: MemorySystem, wallet: AgentWallet, solana: SolanaTransactions) {
        this.memory = memory
        this.wallet = wallet
        this.solana = solana
    }

    /**
     * Execute a task for a specific agent based on its role
     */
    async executeTask(agent: Agent): Promise<TaskAssignment> {
        const taskId = `task_${randomBytes(8).toString('hex')}`
        const taskStart = Date.now()

        const task: TaskAssignment = {
            id: taskId,
            agentId: agent.id,
            type: `${agent.role}_TASK`,
            description: '',
            assignedAt: taskStart,
            status: 'IN_PROGRESS',
        }

        this.activeTasks.set(taskId, task)

        try {
            let result: string

            switch (agent.role) {
                case AgentRole.EXPLORER:
                    result = await this.executeExplorerTask(agent)
                    break
                case AgentRole.BUILDER:
                    result = await this.executeBuilderTask(agent)
                    break
                case AgentRole.ANALYST:
                    result = await this.executeAnalystTask(agent)
                    break
                case AgentRole.COORDINATOR:
                    result = await this.executeCoordinatorTask(agent)
                    break
                case AgentRole.GUARDIAN:
                    result = await this.executeGuardianTask(agent)
                    break
                default:
                    result = 'Unknown role — no task available'
            }

            // Mark completed
            task.status = 'COMPLETED'
            task.completedAt = Date.now()
            task.result = result
            task.description = `${agent.role} task: ${result.substring(0, 80)}`

            // Log on-chain
            const txSignature = await this.logTaskOnChain(agent, task)
            task.onChainTx = txSignature

            // Update agent metadata
            agent.metadata.successCount += 1
            agent.metadata.lastActive = Date.now()
            agent.metadata.currentTask = undefined
            agent.metadata.taskHistory.push(taskId)
            agent.metadata.missionProgress = Math.min(100, agent.metadata.missionProgress + 10)
            await this.memory.saveAgent(agent)

            await logger.info(`Task ${taskId} completed by ${agent.role} agent ${agent.id}`, { result })

            return task
        } catch (error) {
            task.status = 'FAILED'
            task.completedAt = Date.now()
            task.result = error instanceof Error ? error.message : String(error)

            agent.metadata.failureCount += 1
            agent.metadata.currentTask = undefined
            await this.memory.saveAgent(agent)

            await logger.error(`Task ${taskId} failed for agent ${agent.id}`, { error })

            return task
        } finally {
            this.activeTasks.delete(taskId)
        }
    }

    /**
     * Explorer: Scan Solana network state and log discoveries
     */
    private async executeExplorerTask(agent: Agent): Promise<string> {
        const walletInfo = await this.wallet.getWallet(agent.id)
        if (!walletInfo) return 'No wallet — cannot explore'

        // Get network info
        const balance = await this.wallet.getBalance(agent.id)
        const allAgents = await this.memory.getAllAgents()
        const metrics = await this.memory.getMetrics()

        // Generate discovery report
        const discoveries = []
        discoveries.push(`Network scan complete`)
        discoveries.push(`Wallet balance: ${(balance / 1e9).toFixed(4)} SOL`)
        discoveries.push(`Ecosystem size: ${allAgents.length} agents`)
        discoveries.push(`System uptime: ${metrics.uptime.toFixed(0)}s`)
        discoveries.push(`Evolution score: ${metrics.evolutionScore.toFixed(3)}`)

        // Check for underrepresented roles
        const roleCounts = new Map<string, number>()
        for (const a of allAgents) {
            roleCounts.set(a.role, (roleCounts.get(a.role) || 0) + 1)
        }
        const missingRoles = Object.values(AgentRole).filter((r) => !roleCounts.has(r))
        if (missingRoles.length > 0) {
            discoveries.push(`Missing roles: ${missingRoles.join(', ')}`)
        }

        return discoveries.join(' | ')
    }

    /**
     * Builder: Create monitoring structures and track infrastructure
     */
    private async executeBuilderTask(_agent: Agent): Promise<string> {
        const metrics = await this.memory.getMetrics()
        const allAgents = await this.memory.getAllAgents()

        // Build infrastructure health report
        const healthChecks = []
        healthChecks.push(`Infrastructure check @ ${new Date().toISOString()}`)
        healthChecks.push(`Total agents: ${allAgents.length}`)
        healthChecks.push(`Decisions made: ${metrics.totalDecisions}`)
        healthChecks.push(`Avg cycle time: ${metrics.averageCycleTime.toFixed(0)}ms`)

        // Check agent health
        const now = Date.now()
        let healthyAgents = 0
        let staleAgents = 0
        for (const a of allAgents) {
            if (now - a.metadata.lastActive < 120000) {
                healthyAgents++
            } else {
                staleAgents++
            }
        }
        healthChecks.push(`Healthy: ${healthyAgents}, Stale: ${staleAgents}`)

        // Update metrics
        await this.memory.updateMetrics({
            activeAgents: healthyAgents,
        })

        return healthChecks.join(' | ')
    }

    /**
     * Analyst: Compute agent success rates and performance trends
     */
    private async executeAnalystTask(_agent: Agent): Promise<string> {
        const allAgents = await this.memory.getAllAgents()
        const metrics = await this.memory.getMetrics()
        const decisions = await this.memory.getDecisions(20)

        // Compute analytics
        const totalTasks = allAgents.reduce((sum, a) => sum + a.metadata.successCount + a.metadata.failureCount, 0)
        const totalSuccess = allAgents.reduce((sum, a) => sum + a.metadata.successCount, 0)
        const overallSuccessRate = totalTasks > 0 ? (totalSuccess / totalTasks) * 100 : 0

        // Decision distribution
        const decisionCounts = new Map<string, number>()
        for (const d of decisions) {
            decisionCounts.set(d.decision.type, (decisionCounts.get(d.decision.type) || 0) + 1)
        }

        const analyses = []
        analyses.push(`Performance Report @ ${new Date().toISOString()}`)
        analyses.push(`Overall success rate: ${overallSuccessRate.toFixed(1)}%`)
        analyses.push(`Total tasks executed: ${totalTasks}`)
        analyses.push(`System evolution score: ${metrics.evolutionScore.toFixed(3)}`)

        const decisionBreakdown = Array.from(decisionCounts.entries())
            .map(([type, count]) => `${type}:${count}`)
            .join(', ')
        if (decisionBreakdown) {
            analyses.push(`Decision distribution: ${decisionBreakdown}`)
        }

        // Identify best and worst performing agents
        if (allAgents.length > 0) {
            const best = allAgents.reduce((a, b) => (a.metadata.successCount > b.metadata.successCount ? a : b))
            analyses.push(`Top performer: ${best.id} (${best.role}, ${best.metadata.successCount} successes)`)
        }

        return analyses.join(' | ')
    }

    /**
     * Coordinator: Redistribute tasks and resolve agent conflicts
     */
    private async executeCoordinatorTask(_agent: Agent): Promise<string> {
        const allAgents = await this.memory.getAllAgents()

        // Find idle agents (no recent activity)
        const now = Date.now()
        const idleAgents = allAgents.filter((a) => now - a.metadata.lastActive > 60000 && a.id !== 'genesis_root')
        const busyAgents = allAgents.filter((a) => a.metadata.currentTask !== undefined)

        const coordActions = []
        coordActions.push(`Coordination sweep @ ${new Date().toISOString()}`)
        coordActions.push(`Total agents: ${allAgents.length}`)
        coordActions.push(`Idle agents: ${idleAgents.length}`)
        coordActions.push(`Busy agents: ${busyAgents.length}`)

        // Reactivate idle agents by updating their lastActive
        for (const idle of idleAgents.slice(0, 3)) {
            idle.metadata.lastActive = now
            idle.metadata.missionProgress = Math.min(100, idle.metadata.missionProgress + 5)
            await this.memory.saveAgent(idle)
        }

        if (idleAgents.length > 0) {
            coordActions.push(`Reactivated ${Math.min(3, idleAgents.length)} idle agents`)
        }

        // Balance workload
        const roleCounts = new Map<string, number>()
        for (const a of allAgents) {
            roleCounts.set(a.role, (roleCounts.get(a.role) || 0) + 1)
        }
        const roleBreakdown = Array.from(roleCounts.entries())
            .map(([role, count]) => `${role}:${count}`)
            .join(', ')
        coordActions.push(`Role distribution: ${roleBreakdown}`)

        return coordActions.join(' | ')
    }

    /**
     * Guardian: Monitor wallet balances, detect anomalies, trigger refills
     */
    private async executeGuardianTask(_agent: Agent): Promise<string> {
        const allWallets = await this.wallet.getAllWallets()
        const metrics = await this.memory.getMetrics()

        const guardActions = []
        guardActions.push(`Security sweep @ ${new Date().toISOString()}`)
        guardActions.push(`Monitoring ${allWallets.length} wallets`)

        let lowBalanceCount = 0
        let totalBalance = 0

        for (const w of allWallets) {
            totalBalance += w.balance
            if (w.balance < 100000000) {
                // < 0.1 SOL
                lowBalanceCount++
                // Request refill
                try {
                    await this.wallet.checkAndRefillBalance(w.agentId)
                    guardActions.push(`Refilled wallet for ${w.agentId}`)
                } catch {
                    guardActions.push(`Failed to refill ${w.agentId}`)
                }
            }
        }

        guardActions.push(`Total balance: ${(totalBalance / 1e9).toFixed(4)} SOL`)
        guardActions.push(`Low balance wallets: ${lowBalanceCount}`)

        // Check system health
        const failRate =
            metrics.successfulActions + metrics.failedActions > 0
                ? metrics.failedActions / (metrics.successfulActions + metrics.failedActions)
                : 0

        if (failRate > 0.3) {
            guardActions.push(`⚠ High failure rate: ${(failRate * 100).toFixed(1)}%`)
        } else {
            guardActions.push(`System health: NOMINAL (fail rate: ${(failRate * 100).toFixed(1)}%)`)
        }

        return guardActions.join(' | ')
    }

    /**
     * Log task completion on-chain via memo transaction
     */
    private async logTaskOnChain(agent: Agent, task: TaskAssignment): Promise<string | undefined> {
        try {
            const genesisWallet = await this.wallet.getWallet('genesis_root')
            if (!genesisWallet) return undefined

            const keypair = this.wallet.getKeypair(genesisWallet)
            const memoData: MemoData = {
                type: 'TASK_COMPLETION',
                agentId: agent.id,
                role: agent.role,
                taskId: task.id,
                taskType: task.type,
                result: (task.result || '').substring(0, 200),
                duration: (task.completedAt || Date.now()) - task.assignedAt,
                timestamp: Date.now(),
                genesisId: 'genesis_root',
            }

            const transaction = await this.solana.buildMemoTransaction(memoData, keypair.publicKey)
            const signature = await this.solana.submitTransaction(transaction, [keypair])

            // Update transaction count
            const metrics = await this.memory.getMetrics()
            await this.memory.updateMetrics({ totalTransactions: metrics.totalTransactions + 1 })

            return signature
        } catch (error) {
            await logger.warn('Failed to log task on-chain', { error })
            return undefined
        }
    }

    /**
     * Get currently active tasks
     */
    getActiveTasks(): TaskAssignment[] {
        return Array.from(this.activeTasks.values())
    }
}
