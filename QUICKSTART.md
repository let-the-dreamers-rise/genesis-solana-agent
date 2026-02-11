# GENESIS Quick Start Guide

## Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build the project**:
   ```bash
   npm run build
   ```

3. **Run demo mode** (recommended for first time):
   ```bash
   npm run demo
   ```

## What to Expect

### Demo Mode (5 minutes)
- Creates GENESIS root wallet on Solana devnet
- Spawns at least 3 autonomous child agents
- Each agent gets its own wallet and mission
- All activities logged on-chain via memo transactions
- Live dashboard shows real-time autonomous behavior

### Sample Output

```
🚀 GENESIS - Autonomous Agent That Creates Agents
================================================================================
Initializing autonomous agent system on Solana devnet...

✓ Configuration loaded
✓ Memory system initialized
✓ Connected to Solana devnet
✓ Wallet system initialized
Creating GENESIS root wallet...
✓ GENESIS wallet created: 7xK9mN2p...
✓ Agent factory initialized
✓ GENESIS agent initialized

╔══════════════════════════════════════════════════════════════════════════════╗
║                      GENESIS AUTONOMOUS AGENT SYSTEM                          ║
║                          Live Activity Dashboard                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

[12:34:56] ℹ️  SYSTEM STATUS
  System ready. Active agents: 0

[12:35:10] 🧠 DECISION MADE
  Type: CREATE_AGENT
  observation: System has 0 active agents, 0 recent decisions
  reasoning: No agents exist yet. Creating first agent to bootstrap the ecosystem.
  confidence: 0.85

[12:35:25] 🤖 AGENT CREATED
  Role: EXPLORER
  agentId: agent_a1b2c3d4
  mission: Explore Solana ecosystem for integration opportunities at 2024-02-11T12:35:25.000Z
  wallet: 9xH8...kL3m
  tx: https://explorer.solana.com/tx/abc123...?cluster=devnet

[12:35:42] ⛓️  TRANSACTION SUBMITTED
  Type: MEMO (Agent creation log)
  signature: def456...
  explorer: https://explorer.solana.com/tx/def456...?cluster=devnet
```

## Continuous Mode

For long-running operation:

```bash
npm start
```

Press `Ctrl+C` to stop gracefully.

## Viewing On-Chain Transactions

All agent creations are logged on Solana devnet. View them at:
https://explorer.solana.com/address/YOUR_GENESIS_WALLET?cluster=devnet

## Troubleshooting

### "Failed to connect to Solana"
- Check internet connection
- Devnet might be experiencing issues, try again in a few minutes

### "Airdrop failed"
- Devnet rate limiting - system will automatically retry
- Wait 30 seconds and try again

### Build errors
- Ensure Node.js 18+ is installed: `node --version`
- Delete `node_modules` and `dist` folders, then reinstall:
  ```bash
  rm -rf node_modules dist
  npm install
  npm run build
  ```

## Next Steps

1. Check the `memory/` folder to see persisted agent data
2. View logs in `logs/genesis.log`
3. Customize behavior in `config/default.json`
4. Explore the codebase in `src/`

## Key Files

- `src/core/genesis.ts` - Main autonomous agent
- `src/factory/agent-factory.ts` - Agent creation logic
- `src/wallet/agent-wallet.ts` - Wallet management
- `src/solana/transactions.ts` - Blockchain integration
- `config/default.json` - System configuration

## Support

For issues or questions:
1. Check `logs/genesis.log` for detailed error messages
2. Review the main README.md for comprehensive documentation
3. Ensure all dependencies are installed correctly

Happy hacking! 🚀
