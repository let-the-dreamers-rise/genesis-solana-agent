# GENESIS - Autonomous Agent That Creates Agents

GENESIS is an autonomous AI agent system for the Colosseum Solana Agent Hackathon. The system demonstrates true autonomy through a root agent (GENESIS) that creates, deploys, and manages child agents on the Solana blockchain.

## 🌟 Features

- **True Autonomy**: GENESIS makes non-scripted decisions using observe → reason → decide → act → log → evolve loop
- **On-Chain Proof**: All agent activities logged on Solana devnet via memo transactions
- **Agent Ecosystem**: Creates diverse agents with roles (Explorer, Builder, Analyst, Coordinator, Guardian)
- **Live Dashboard**: Real-time visualization of autonomous behavior
- **Persistent Memory**: Maintains state across sessions for evolution over time
- **Self-Evolving**: Adjusts decision-making weights based on outcomes

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- Internet connectivity for Solana devnet

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### Running Demo Mode

Demo mode runs for 5 minutes and creates at least 3 agents:

```bash
npm run demo
```

### Running Continuous Mode

Runs indefinitely until stopped with Ctrl+C:

```bash
npm start
```

## 📁 Project Structure

```
genesis-autonomous-agent/
├── src/
│   ├── core/              # GENESIS agent and decision engine
│   ├── factory/           # Agent creation and role templates
│   ├── wallet/            # Wallet management and encryption
│   ├── memory/            # Persistent storage system
│   ├── solana/            # Blockchain integration
│   ├── dashboard/         # Activity visualization
│   ├── types/             # TypeScript interfaces
│   ├── config/            # Configuration system
│   └── utils/             # Utilities (logger, etc.)
├── tests/                 # Test files
├── config/                # Configuration files
├── memory/                # Data storage (created at runtime)
└── logs/                  # Log files (created at runtime)
```

## 🎯 How It Works

### Autonomy Loop

GENESIS operates in a continuous loop:

1. **Observe**: Query system state (agents, decisions, balances)
2. **Reason**: Analyze state and generate decision options
3. **Decide**: Select best action using weighted randomness
4. **Act**: Execute decision (create agent, coordinate, evolve)
5. **Log**: Record decision and submit on-chain transaction
6. **Evolve**: Update decision weights based on outcomes

### Agent Roles

- **Explorer**: Discovers opportunities and analyzes external data
- **Builder**: Creates and deploys resources and infrastructure
- **Analyst**: Analyzes system data and generates insights
- **Coordinator**: Manages other agents and orchestrates activities
- **Guardian**: Monitors system health and ensures security

### On-Chain Logging

Every agent creation is logged on Solana devnet via memo transactions:

```json
{
  "type": "AGENT_CREATION",
  "agentId": "agent_abc123",
  "role": "EXPLORER",
  "mission": "Explore Solana ecosystem...",
  "timestamp": 1234567890,
  "genesisId": "genesis_root"
}
```

## ⚙️ Configuration

Edit `config/default.json` to customize:

- Autonomy loop timing
- Agent creation limits
- Solana RPC endpoint
- Memory storage location
- Dashboard settings
- Demo mode parameters

### Environment Variables

```bash
# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet

# System Configuration
GENESIS_MODE=demo
MEMORY_DIR=./memory

# Security
GENESIS_ENCRYPTION_KEY=your-secure-key-here
```

## 📊 Demo Mode Output

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                      GENESIS AUTONOMOUS AGENT SYSTEM                          ║
║                          Live Activity Dashboard                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

[12:34:56] 🤖 AGENT CREATED
  Role: EXPLORER
  Mission: Explore Solana ecosystem for integration opportunities
  Wallet: 7xK9...mN2p
  TX: https://explorer.solana.com/tx/abc123...?cluster=devnet

[12:35:18] 🧠 DECISION MADE
  Type: CREATE_AGENT
  Reasoning: Only 1 agents active. Need more agents to build robust ecosystem.
  Confidence: 0.85

[12:35:42] ⛓️  TRANSACTION SUBMITTED
  Type: MEMO (Agent creation log)
  Signature: def456...
  Status: ✓ Confirmed
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linter
npm run lint

# Format code
npm run format
```

## 🔒 Security

- Private keys encrypted at rest using AES-256-GCM
- Keys never logged or displayed in dashboard
- Devnet-only operations (no mainnet risk)
- Atomic writes prevent data corruption

## 🐛 Troubleshooting

### Solana RPC Connection Fails

- Check network connectivity
- Try alternative RPC endpoint: `https://api.devnet.solana.com`
- Verify firewall settings

### Airdrop Requests Fail

- Devnet rate limiting - wait and retry
- System automatically retries with exponential backoff

### Memory Corruption

- System automatically recovers from backups
- Check `memory/*.backup` files

## 📝 License

MIT

## 🏆 Hackathon Submission

This project demonstrates:

- ✅ True autonomous decision-making
- ✅ Real Solana blockchain integration
- ✅ Self-evolving agent ecosystem
- ✅ On-chain proof of all activities
- ✅ Clean, modular architecture
- ✅ Comprehensive error handling
- ✅ Live activity visualization

Built for the Colosseum Solana Agent Hackathon 🚀

