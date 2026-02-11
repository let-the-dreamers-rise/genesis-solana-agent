import { readFile } from 'fs/promises'
import { join } from 'path'

export interface Config {
  system: {
    name: string
    version: string
    mode: string
  }
  autonomy: {
    loopIntervalMs: number
    observeTimeoutMs: number
    reasonTimeoutMs: number
    decideTimeoutMs: number
    actTimeoutMs: number
    logTimeoutMs: number
    evolveTimeoutMs: number
  }
  agents: {
    maxAgents: number
    minAgentsForDemo: number
    roles: string[]
  }
  solana: {
    network: string
    rpcUrl: string
    commitment: string
    airdropAmount: number
    lowBalanceThreshold: number
  }
  memory: {
    storageDir: string
    backupEnabled: boolean
    maxBackups: number
  }
  dashboard: {
    enabled: boolean
    updateIntervalMs: number
    maxEventsDisplayed: number
  }
  demo: {
    enabled: boolean
    durationMinutes: number
    minCycles: number
    minTransactions: number
    minAgents: number
  }
}

const DEFAULT_CONFIG: Config = {
  system: {
    name: 'GENESIS',
    version: '1.0.0',
    mode: 'demo',
  },
  autonomy: {
    loopIntervalMs: 24000,
    observeTimeoutMs: 5000,
    reasonTimeoutMs: 3000,
    decideTimeoutMs: 1000,
    actTimeoutMs: 10000,
    logTimeoutMs: 3000,
    evolveTimeoutMs: 2000,
  },
  agents: {
    maxAgents: 10,
    minAgentsForDemo: 3,
    roles: ['EXPLORER', 'BUILDER', 'ANALYST', 'COORDINATOR', 'GUARDIAN'],
  },
  solana: {
    network: 'devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    commitment: 'confirmed',
    airdropAmount: 1000000000,
    lowBalanceThreshold: 100000000,
  },
  memory: {
    storageDir: './memory',
    backupEnabled: true,
    maxBackups: 5,
  },
  dashboard: {
    enabled: true,
    updateIntervalMs: 500,
    maxEventsDisplayed: 20,
  },
  demo: {
    enabled: true,
    durationMinutes: 5,
    minCycles: 10,
    minTransactions: 5,
    minAgents: 3,
  },
}

export class ConfigLoader {
  private config: Config = DEFAULT_CONFIG

  async load(configPath?: string): Promise<Config> {
    try {
      const path = configPath || join(process.cwd(), 'config', 'default.json')
      const data = await readFile(path, 'utf-8')
      const loaded = JSON.parse(data)

      // Merge with defaults
      this.config = this.mergeConfig(DEFAULT_CONFIG, loaded)

      // Apply environment variables
      this.applyEnvironmentVariables()

      // Validate configuration
      this.validate()

      return this.config
    } catch (error) {
      console.warn('Failed to load config, using defaults:', error)
      return DEFAULT_CONFIG
    }
  }

  private mergeConfig(defaults: Config, loaded: Partial<Config>): Config {
    return {
      system: { ...defaults.system, ...loaded.system },
      autonomy: { ...defaults.autonomy, ...loaded.autonomy },
      agents: { ...defaults.agents, ...loaded.agents },
      solana: { ...defaults.solana, ...loaded.solana },
      memory: { ...defaults.memory, ...loaded.memory },
      dashboard: { ...defaults.dashboard, ...loaded.dashboard },
      demo: { ...defaults.demo, ...loaded.demo },
    }
  }

  private applyEnvironmentVariables() {
    if (process.env.SOLANA_RPC_URL) {
      this.config.solana.rpcUrl = process.env.SOLANA_RPC_URL
    }
    if (process.env.SOLANA_NETWORK) {
      this.config.solana.network = process.env.SOLANA_NETWORK
    }
    if (process.env.GENESIS_MODE) {
      this.config.system.mode = process.env.GENESIS_MODE
    }
    if (process.env.MEMORY_DIR) {
      this.config.memory.storageDir = process.env.MEMORY_DIR
    }
  }

  private validate() {
    // Validate positive numbers
    if (this.config.autonomy.loopIntervalMs <= 0) {
      console.warn('Invalid loopIntervalMs, using default')
      this.config.autonomy.loopIntervalMs = DEFAULT_CONFIG.autonomy.loopIntervalMs
    }

    if (this.config.agents.maxAgents <= 0) {
      console.warn('Invalid maxAgents, using default')
      this.config.agents.maxAgents = DEFAULT_CONFIG.agents.maxAgents
    }

    if (this.config.solana.airdropAmount <= 0) {
      console.warn('Invalid airdropAmount, using default')
      this.config.solana.airdropAmount = DEFAULT_CONFIG.solana.airdropAmount
    }

    // Validate roles array
    if (!Array.isArray(this.config.agents.roles) || this.config.agents.roles.length === 0) {
      console.warn('Invalid roles array, using default')
      this.config.agents.roles = DEFAULT_CONFIG.agents.roles
    }
  }

  getConfig(): Config {
    return this.config
  }
}

// Singleton instance
let configLoader: ConfigLoader | null = null

export async function loadConfig(configPath?: string): Promise<Config> {
  if (!configLoader) {
    configLoader = new ConfigLoader()
  }
  return configLoader.load(configPath)
}

export function getConfig(): Config {
  if (!configLoader) {
    throw new Error('Config not loaded. Call loadConfig() first.')
  }
  return configLoader.getConfig()
}
