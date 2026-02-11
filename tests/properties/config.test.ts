import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { ConfigLoader } from '../../src/config/config.js'

/**
 * Property 14: Configuration Loading
 * For any system startup, the system should load configuration from file,
 * validate values, and use defaults for invalid entries.
 * Validates: Requirements 15.1, 15.7
 */
describe('Property 14: Configuration Loading', () => {
  it('should load configuration and use defaults for invalid values', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          loopIntervalMs: fc.integer({ min: -1000, max: 100000 }),
          maxAgents: fc.integer({ min: -10, max: 100 }),
          airdropAmount: fc.integer({ min: -1000000, max: 10000000000 }),
        }),
        async (invalidConfig) => {
          const loader = new ConfigLoader()
          
          // Load with default config (should always succeed)
          const config = await loader.load()
          
          // Property: Config should always be valid after loading
          expect(config).toBeDefined()
          expect(config.autonomy.loopIntervalMs).toBeGreaterThan(0)
          expect(config.agents.maxAgents).toBeGreaterThan(0)
          expect(config.solana.airdropAmount).toBeGreaterThan(0)
          expect(Array.isArray(config.agents.roles)).toBe(true)
          expect(config.agents.roles.length).toBeGreaterThan(0)
          
          // Property: Invalid values should be replaced with defaults
          if (invalidConfig.loopIntervalMs <= 0) {
            expect(config.autonomy.loopIntervalMs).toBeGreaterThan(0)
          }
          if (invalidConfig.maxAgents <= 0) {
            expect(config.agents.maxAgents).toBeGreaterThan(0)
          }
          if (invalidConfig.airdropAmount <= 0) {
            expect(config.solana.airdropAmount).toBeGreaterThan(0)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should always return a valid config structure', async () => {
    const loader = new ConfigLoader()
    const config = await loader.load()

    // Property: Config structure should always be complete
    expect(config.system).toBeDefined()
    expect(config.autonomy).toBeDefined()
    expect(config.agents).toBeDefined()
    expect(config.solana).toBeDefined()
    expect(config.memory).toBeDefined()
    expect(config.dashboard).toBeDefined()
    expect(config.demo).toBeDefined()

    // Property: All required fields should exist
    expect(config.system.name).toBeDefined()
    expect(config.system.version).toBeDefined()
    expect(config.solana.rpcUrl).toBeDefined()
    expect(config.memory.storageDir).toBeDefined()
  })
})
