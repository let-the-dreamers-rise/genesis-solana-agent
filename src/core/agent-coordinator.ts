import { Agent, AgentRole } from '../types/agent.js'
import { AgentMessage, AgentReport, SystemState } from '../types/system.js'
import { MemorySystem } from '../memory/memory-system.js'
import { AgentWallet } from '../wallet/agent-wallet.js'
import { SolanaTransactions, MemoData } from '../solana/transactions.js'
import { getLogger } from '../utils/logger.js'
import { randomBytes } from 'crypto'

const logger = getLogger()

/**
 * AgentCoordinator manages inter-agent communication and task redistribution.
 */
export class AgentCoordinator {
    private memory: MemorySystem
    private wallet: AgentWallet
    private solana: SolanaTransactions
    private messageLog: AgentMessage[] = []

    constructor(memory: MemorySystem, wallet: AgentWallet, solana: SolanaTransactions) {
        this.memory = memory
        this.wallet = wallet
        this.solana = solana
    }

    /**
     * Coordinate all active agents — optimize task distribution and resolve conflicts
     */
    async coordinateAgents(state: SystemState): Promise<{
        outcome: string
        reports: AgentReport[]
        messagesExchanged: number
        txSignature?: string
    }> {
        const agents = state.activeAgents.filter((a) => a.id !== 'genesis_root')
        const reports: AgentReport[] = []
        let messagesExchanged = 0

        // 1. Generate health report for each agent
        for (const agent of agents) {
            const report = this.generateAgentReport(agent)
            reports.push(report)

            // Send status request message
            const statusMsg = this.createMessage('genesis_root', agent.id, 'STATUS_REQUEST', {
                requestedAt: Date.now(),
            })
            this.messageLog.push(statusMsg)
            messagesExchanged++
        }

        // 2. Identify issues and take corrective actions
        const criticalAgents = reports.filter((r) => r.healthStatus === 'CRITICAL')
        const degradedAgents = reports.filter((r) => r.healthStatus === 'DEGRADED')
        const healthyAgents = reports.filter((r) => r.healthStatus === 'HEALTHY')

        // 3. Redistribute work from critical agents to healthy ones
        for (const critical of criticalAgents) {
            const agent = agents.find((a) => a.id === critical.agentId)
            if (!agent) continue

            // Find a healthy agent with the same role to take over
            const backup = agents.find(
                (a) =>
                    a.role === agent.role &&
                    a.id !== agent.id &&
                    reports.find((r) => r.agentId === a.id)?.healthStatus === 'HEALTHY'
            )

            if (backup) {
                const coordMsg = this.createMessage('genesis_root', backup.id, 'COORDINATION', {
                    action: 'TAKE_OVER',
                    fromAgent: agent.id,
                    reason: 'Critical agent health',
                })
                this.messageLog.push(coordMsg)
                messagesExchanged++
            }
        }

        // 4. Log coordination event on-chain
        const txSignature = await this.logCoordinationOnChain(agents.length, reports)

        // 5. Build outcome message
        const outcome = [
            `Coordinated ${agents.length} agents`,
            `Healthy: ${healthyAgents.length}`,
            `Degraded: ${degradedAgents.length}`,
            `Critical: ${criticalAgents.length}`,
            `Messages: ${messagesExchanged}`,
        ].join(' | ')

        await logger.info('Coordination complete', {
            totalAgents: agents.length,
            healthy: healthyAgents.length,
            degraded: degradedAgents.length,
            critical: criticalAgents.length,
        })

        return { outcome, reports, messagesExchanged, txSignature }
    }

    /**
     * Generate performance report for an agent
     */
    private generateAgentReport(agent: Agent): AgentReport {
        const totalTasks = agent.metadata.successCount + agent.metadata.failureCount
        const successRate = totalTasks > 0 ? agent.metadata.successCount / totalTasks : 1.0
        const timeSinceActive = Date.now() - agent.metadata.lastActive

        let healthStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY'
        if (successRate < 0.3 || timeSinceActive > 300000) {
            healthStatus = 'CRITICAL'
        } else if (successRate < 0.6 || timeSinceActive > 120000) {
            healthStatus = 'DEGRADED'
        }

        return {
            agentId: agent.id,
            role: agent.role,
            tasksCompleted: agent.metadata.successCount,
            tasksFailed: agent.metadata.failureCount,
            successRate,
            avgTaskDuration: 0,
            lastActive: agent.metadata.lastActive,
            healthStatus,
        }
    }

    /**
     * Analyze performance trends and recommend strategy changes
     */
    async analyzePerformance(state: SystemState): Promise<{
        outcome: string
        recommendations: string[]
        txSignature?: string
    }> {
        const agents = state.activeAgents
        const metrics = await this.memory.getMetrics()
        const recommendations: string[] = []

        // Analyze role coverage
        const roleCounts = new Map<AgentRole, number>()
        for (const role of Object.values(AgentRole)) {
            roleCounts.set(role, 0)
        }
        for (const agent of agents) {
            roleCounts.set(agent.role, (roleCounts.get(agent.role) || 0) + 1)
        }

        // Check for missing roles
        for (const [role, count] of roleCounts) {
            if (count === 0) {
                recommendations.push(`Create ${role} agent — role is missing from ecosystem`)
            }
        }

        // Analyze success rate trends
        const overallSuccess =
            metrics.successfulActions + metrics.failedActions > 0
                ? metrics.successfulActions / (metrics.successfulActions + metrics.failedActions)
                : 1.0

        if (overallSuccess < 0.5) {
            recommendations.push('System success rate below 50% — consider EVOLVE_STRATEGY')
        }

        // Analyze agent density
        if (agents.length < 3) {
            recommendations.push('Ecosystem understaffed — prioritize CREATE_AGENT')
        } else if (agents.length > 8) {
            recommendations.push('Large ecosystem — focus on COORDINATE_AGENTS')
        }

        // Check evolution score
        if (metrics.evolutionScore < 0.3) {
            recommendations.push('Low evolution score — the system needs more successful actions')
        }

        // Log analysis on-chain
        const txSignature = await this.logAnalysisOnChain(recommendations)

        const outcome = [
            `Performance analysis complete`,
            `Agents: ${agents.length}`,
            `Success rate: ${(overallSuccess * 100).toFixed(1)}%`,
            `Evolution: ${metrics.evolutionScore.toFixed(3)}`,
            `Recommendations: ${recommendations.length}`,
        ].join(' | ')

        return { outcome, recommendations, txSignature }
    }

    /**
     * Create an inter-agent message
     */
    private createMessage(
        from: string,
        to: string,
        type: AgentMessage['type'],
        payload: Record<string, unknown>
    ): AgentMessage {
        return {
            id: `msg_${randomBytes(8).toString('hex')}`,
            fromAgent: from,
            toAgent: to,
            type,
            payload,
            timestamp: Date.now(),
        }
    }

    /**
     * Log coordination event on Solana
     */
    private async logCoordinationOnChain(
        agentCount: number,
        reports: AgentReport[]
    ): Promise<string | undefined> {
        try {
            const genesisWallet = await this.wallet.getWallet('genesis_root')
            if (!genesisWallet) return undefined

            const keypair = this.wallet.getKeypair(genesisWallet)
            const healthy = reports.filter((r) => r.healthStatus === 'HEALTHY').length
            const memoData: MemoData = {
                type: 'COORDINATION',
                agentId: 'genesis_root',
                agentCount,
                healthyAgents: healthy,
                degradedAgents: reports.filter((r) => r.healthStatus === 'DEGRADED').length,
                criticalAgents: reports.filter((r) => r.healthStatus === 'CRITICAL').length,
                timestamp: Date.now(),
                genesisId: 'genesis_root',
            }

            const transaction = await this.solana.buildMemoTransaction(memoData, keypair.publicKey)
            const signature = await this.solana.submitTransaction(transaction, [keypair])

            const metrics = await this.memory.getMetrics()
            await this.memory.updateMetrics({ totalTransactions: metrics.totalTransactions + 1 })

            return signature
        } catch (error) {
            await logger.warn('Failed to log coordination on-chain', { error })
            return undefined
        }
    }

    /**
     * Log analysis on Solana
     */
    private async logAnalysisOnChain(recommendations: string[]): Promise<string | undefined> {
        try {
            const genesisWallet = await this.wallet.getWallet('genesis_root')
            if (!genesisWallet) return undefined

            const keypair = this.wallet.getKeypair(genesisWallet)
            const memoData: MemoData = {
                type: 'PERFORMANCE_ANALYSIS',
                agentId: 'genesis_root',
                recommendationCount: recommendations.length,
                topRecommendation: recommendations[0] || 'None',
                timestamp: Date.now(),
                genesisId: 'genesis_root',
            }

            const transaction = await this.solana.buildMemoTransaction(memoData, keypair.publicKey)
            const signature = await this.solana.submitTransaction(transaction, [keypair])

            const metrics = await this.memory.getMetrics()
            await this.memory.updateMetrics({ totalTransactions: metrics.totalTransactions + 1 })

            return signature
        } catch (error) {
            await logger.warn('Failed to log analysis on-chain', { error })
            return undefined
        }
    }

    /**
     * Get message log
     */
    getMessageLog(): AgentMessage[] {
        return this.messageLog
    }
}
