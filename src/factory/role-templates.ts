import { AgentRole, AgentTemplate } from '../types/agent.js'

export const ROLE_TEMPLATES: Record<AgentRole, AgentTemplate> = {
  [AgentRole.EXPLORER]: {
    role: AgentRole.EXPLORER,
    capabilities: [
      'Discover new opportunities',
      'Analyze external data',
      'Scout for resources',
      'Identify integration points',
    ],
    missionTemplates: [
      'Explore Solana ecosystem for integration opportunities at {timestamp}',
      'Discover trending agent patterns in the network (Agent #{agentCount})',
      'Scout for new blockchain protocols and tools',
      'Analyze DeFi opportunities on Solana devnet',
      'Investigate cross-chain bridge possibilities',
    ],
    codeTemplate: 'explorer-agent-v1',
  },

  [AgentRole.BUILDER]: {
    role: AgentRole.BUILDER,
    capabilities: [
      'Create and deploy resources',
      'Construct infrastructure',
      'Build monitoring systems',
      'Deploy smart contracts',
    ],
    missionTemplates: [
      'Build monitoring dashboard for agent health (ID: {uniqueId})',
      'Deploy transaction batching system for efficiency',
      'Construct data pipeline for agent metrics',
      'Create automated testing framework',
      'Build integration layer for new protocols',
    ],
    codeTemplate: 'builder-agent-v1',
  },

  [AgentRole.ANALYST]: {
    role: AgentRole.ANALYST,
    capabilities: [
      'Analyze system data',
      'Generate insights',
      'Evaluate performance',
      'Identify patterns',
    ],
    missionTemplates: [
      'Analyze agent success rates and identify patterns',
      'Evaluate transaction efficiency across {agentCount} agents',
      'Generate performance report for system optimization',
      'Identify bottlenecks in agent coordination',
      'Assess resource utilization and recommend improvements',
    ],
    codeTemplate: 'analyst-agent-v1',
  },

  [AgentRole.COORDINATOR]: {
    role: AgentRole.COORDINATOR,
    capabilities: [
      'Manage other agents',
      'Orchestrate activities',
      'Resolve conflicts',
      'Optimize workflows',
    ],
    missionTemplates: [
      'Coordinate Explorer and Builder agents for new feature development',
      'Manage agent workload distribution across {agentCount} active agents',
      'Orchestrate multi-agent collaboration for complex tasks',
      'Resolve resource conflicts between competing agents',
      'Optimize agent scheduling for maximum efficiency',
    ],
    codeTemplate: 'coordinator-agent-v1',
  },

  [AgentRole.GUARDIAN]: {
    role: AgentRole.GUARDIAN,
    capabilities: [
      'Monitor system health',
      'Ensure security',
      'Handle errors',
      'Maintain stability',
    ],
    missionTemplates: [
      'Monitor wallet balances and request airdrops when needed',
      'Guard against transaction failures and retry failed operations',
      'Ensure system stability across {agentCount} agents',
      'Detect and respond to anomalous agent behavior',
      'Maintain security protocols and access controls',
    ],
    codeTemplate: 'guardian-agent-v1',
  },
}

export function getRoleTemplate(role: AgentRole): AgentTemplate {
  return ROLE_TEMPLATES[role]
}

export function getAllRoles(): AgentRole[] {
  return Object.values(AgentRole)
}
