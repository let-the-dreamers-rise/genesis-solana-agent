import { describe, it, expect } from 'vitest'
import { getRoleTemplate, getAllRoles, ROLE_TEMPLATES } from '../../src/factory/role-templates.js'
import { AgentRole } from '../../src/types/agent.js'

describe('Role Templates', () => {
  describe('getRoleTemplate', () => {
    it('should return template for each role', () => {
      const roles = Object.values(AgentRole)

      roles.forEach(role => {
        const template = getRoleTemplate(role)
        expect(template).toBeDefined()
        expect(template.role).toBe(role)
        expect(template.capabilities).toBeInstanceOf(Array)
        expect(template.capabilities.length).toBeGreaterThan(0)
        expect(template.missionTemplates).toBeInstanceOf(Array)
        expect(template.missionTemplates.length).toBeGreaterThan(0)
        expect(template.codeTemplate).toBeDefined()
      })
    })

    it('should have unique capabilities for each role', () => {
      const explorerTemplate = getRoleTemplate(AgentRole.EXPLORER)
      const builderTemplate = getRoleTemplate(AgentRole.BUILDER)

      expect(explorerTemplate.capabilities).not.toEqual(builderTemplate.capabilities)
    })

    it('should have mission templates with placeholders', () => {
      const template = getRoleTemplate(AgentRole.EXPLORER)

      const hasPlaceholders = template.missionTemplates.some(mission =>
        mission.includes('{') && mission.includes('}')
      )

      expect(hasPlaceholders).toBe(true)
    })
  })

  describe('getAllRoles', () => {
    it('should return all 5 roles', () => {
      const roles = getAllRoles()

      expect(roles).toHaveLength(5)
      expect(roles).toContain(AgentRole.EXPLORER)
      expect(roles).toContain(AgentRole.BUILDER)
      expect(roles).toContain(AgentRole.ANALYST)
      expect(roles).toContain(AgentRole.COORDINATOR)
      expect(roles).toContain(AgentRole.GUARDIAN)
    })
  })

  describe('ROLE_TEMPLATES', () => {
    it('should have templates for all roles', () => {
      const roles = Object.values(AgentRole)

      roles.forEach(role => {
        expect(ROLE_TEMPLATES[role]).toBeDefined()
      })
    })

    it('should have at least 3 mission templates per role', () => {
      Object.values(ROLE_TEMPLATES).forEach(template => {
        expect(template.missionTemplates.length).toBeGreaterThanOrEqual(3)
      })
    })

    it('should have at least 3 capabilities per role', () => {
      Object.values(ROLE_TEMPLATES).forEach(template => {
        expect(template.capabilities.length).toBeGreaterThanOrEqual(3)
      })
    })

    it('should have role-specific mission templates', () => {
      const explorerTemplate = ROLE_TEMPLATES[AgentRole.EXPLORER]
      const guardianTemplate = ROLE_TEMPLATES[AgentRole.GUARDIAN]

      // Explorer missions should mention exploration/discovery
      const explorerMissions = explorerTemplate.missionTemplates.join(' ').toLowerCase()
      expect(explorerMissions).toMatch(/explore|discover|scout|analyze/)

      // Guardian missions should mention monitoring/security
      const guardianMissions = guardianTemplate.missionTemplates.join(' ').toLowerCase()
      expect(guardianMissions).toMatch(/monitor|guard|ensure|maintain|security/)
    })
  })
})
