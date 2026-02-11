import { loadConfig } from './config/config.js'
import { initLogger, getLogger } from './utils/logger.js'
import { MemorySystem } from './memory/memory-system.js'
import { SolanaConnection } from './solana/connection.js'
import { SolanaTransactions } from './solana/transactions.js'
import { AgentWallet } from './wallet/agent-wallet.js'
import { AgentFactory } from './factory/agent-factory.js'
import { GenesisAgent } from './core/genesis.js'
import { ActivityDashboard } from './dashboard/activity-dashboard.js'

const GENESIS_ID = 'genesis_root'

async function main() {
  try {
    // Load configuration
    const config = await loadConfig()
    console.log('✓ Configuration loaded')

    // Initialize logger
    initLogger(config.memory.storageDir + '/../logs', true)
    const logger = getLogger()
    await logger.info('GENESIS system starting...')

    // Display welcome message
    console.log('\n' + '='.repeat(80))
    console.log('🚀 GENESIS - Autonomous Agent That Creates Agents')
    console.log('='.repeat(80))
    console.log('Initializing autonomous agent system on Solana devnet...')
    console.log('')

    // Initialize memory system
    const memory = new MemorySystem(config.memory.storageDir)
    await memory.load()
    console.log('✓ Memory system initialized')

    // Connect to Solana
    const solanaConnection = new SolanaConnection(config.solana.rpcUrl, config.solana.commitment as any)
    const connection = await solanaConnection.retryConnection()
    console.log('✓ Connected to Solana devnet')

    // Initialize Solana transactions
    const solana = new SolanaTransactions(connection)

    // Initialize wallet system
    const wallet = new AgentWallet(
      memory,
      solana,
      config.solana.airdropAmount,
      config.solana.lowBalanceThreshold
    )
    console.log('✓ Wallet system initialized')

    // Create GENESIS wallet if it doesn't exist
    let genesisWallet = await wallet.getWallet(GENESIS_ID)
    if (!genesisWallet) {
      console.log('Creating GENESIS root wallet...')
      genesisWallet = await wallet.createWallet(GENESIS_ID, true)
      console.log(`✓ GENESIS wallet created: ${genesisWallet.publicKey}`)
    } else {
      console.log(`✓ GENESIS wallet loaded: ${genesisWallet.publicKey}`)
    }

    // Initialize agent factory
    const factory = new AgentFactory(memory, wallet)
    console.log('✓ Agent factory initialized')

    // Initialize GENESIS agent
    const genesis = new GenesisAgent(
      memory,
      wallet,
      factory,
      solana,
      config.autonomy.loopIntervalMs
    )
    console.log('✓ GENESIS agent initialized')

    // Initialize dashboard
    const dashboard = new ActivityDashboard(config.dashboard.enabled, config.dashboard.maxEventsDisplayed)
    dashboard.start()

    // Display system status
    const agents = await genesis.getActiveAgents()
    dashboard.displayStatus(`System ready. Active agents: ${agents.length}`)

    // Check if demo mode
    const isDemoMode = process.argv.includes('--demo') || config.demo.enabled

    if (isDemoMode) {
      console.log('\n🎬 Running in DEMO MODE')
      console.log(`Duration: ${config.demo.durationMinutes} minutes`)
      console.log(`Target: ${config.demo.minAgents} agents, ${config.demo.minCycles} cycles, ${config.demo.minTransactions} transactions\n`)

      const demoStart = Date.now()
      let cycleCount = 0
      let transactionCount = 0

      // Start autonomy loop
      const loopPromise = genesis.startAutonomyLoop()

      // Monitor demo progress
      const monitorInterval = setInterval(async () => {
        cycleCount++
        const metrics = await memory.getMetrics()
        transactionCount = metrics.totalTransactions

        const elapsed = (Date.now() - demoStart) / 1000
        const agents = await genesis.getActiveAgents()

        dashboard.displayStatus(
          `Demo progress: ${agents.length}/${config.demo.minAgents} agents, ` +
          `${cycleCount}/${config.demo.minCycles} cycles, ` +
          `${transactionCount}/${config.demo.minTransactions} transactions, ` +
          `${elapsed.toFixed(0)}s elapsed`
        )

        // Check completion criteria
        const timeLimit = config.demo.durationMinutes * 60 * 1000
        if (
          elapsed * 1000 >= timeLimit ||
          (agents.length >= config.demo.minAgents &&
            cycleCount >= config.demo.minCycles &&
            transactionCount >= config.demo.minTransactions)
        ) {
          clearInterval(monitorInterval)
          genesis.stopAutonomyLoop()

          // Display summary
          const metrics = await memory.getMetrics()
          const evolutionEvents = await memory.getEvolutionHistory()

          dashboard.displaySummary({
            duration: Date.now() - demoStart,
            agentsCreated: agents.length,
            decisionsExecuted: metrics.totalDecisions,
            transactionsSubmitted: metrics.totalTransactions,
            evolutionEvents: evolutionEvents.length,
            successRate: metrics.successfulActions / (metrics.successfulActions + metrics.failedActions),
          })

          dashboard.stop()
          process.exit(0)
        }
      }, 10000) // Check every 10 seconds

      await loopPromise
    } else {
      // Continuous mode
      console.log('\n🔄 Running in CONTINUOUS MODE')
      console.log('Press Ctrl+C to stop\n')

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n\nShutting down gracefully...')
        genesis.stopAutonomyLoop()
        dashboard.stop()
        process.exit(0)
      })

      await genesis.startAutonomyLoop()
    }
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

// Run main
main().catch((error) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
