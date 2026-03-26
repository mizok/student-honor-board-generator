import { describe, expect, it } from 'vitest'
import { TEMPLATE_IDS } from './templates/registry'
import { TEMPLATE_STYLE_REGISTRY, getTemplateStyleDefinition, type TemplateId } from './template-style-registry'

const EXPECTED_FONT_SIZE_OPTIONS = [12, 14, 16, 18, 20, 24, 28, 32]
const EXPECTED_LARGE_FONT_SIZE_OPTIONS = [16, 18, 20, 24, 28, 32]
const EXPECTED_THEME_TOKEN_KEYS = [
  '--template-board-bg',
  '--template-board-surface',
  '--template-board-surface-soft',
  '--template-board-border',
  '--template-board-border-strong',
  '--template-board-text',
  '--template-board-muted',
  '--template-board-subtitle',
  '--template-board-shadow',
  '--template-card-bg',
  '--template-card-border',
  '--template-card-shadow',
  '--template-card-surface',
  '--template-card-surface-border',
  '--template-card-divider',
  '--template-primary-start',
  '--template-primary-end',
  '--template-primary-text',
  '--template-primary-border',
  '--template-primary-soft',
  '--template-secondary-start',
  '--template-secondary-end',
  '--template-secondary-text',
  '--template-secondary-border',
  '--template-secondary-soft',
  '--template-pill-start',
  '--template-pill-end',
  '--template-pill-text',
] as const

const assertTemplateStyleDefinition = (
  templateId: TemplateId,
  expectedRoleIds: readonly string[],
  expectedThemeIds: readonly string[],
  expectedDefaultThemeId: string,
): void => {
  const definition = getTemplateStyleDefinition(templateId)

  expect(definition.id).toBe(templateId)
  expect(definition.defaultThemeId).toBe(expectedDefaultThemeId)
  expect(definition.fontRoles).toHaveLength(expectedRoleIds.length)
  expect(definition.themes).toHaveLength(expectedThemeIds.length)
  expect(definition.fontRoles.map((role) => role.id)).toEqual([...expectedRoleIds])
  expect(definition.themes.map((theme) => theme.id)).toEqual([...expectedThemeIds])
}

const assertThemeTokenContract = (templateId: TemplateId): void => {
  const definition = getTemplateStyleDefinition(templateId)

  definition.themes.forEach((theme) => {
    expect(theme.previewColors).toHaveLength(3)
    theme.previewColors.forEach((color) => {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/)
    })

    EXPECTED_THEME_TOKEN_KEYS.forEach((tokenKey) => {
      expect(theme.tokens).toHaveProperty(tokenKey)
      expect(theme.tokens[tokenKey]).toBeTruthy()
    })
  })
}

describe('template-style-registry', () => {
  it('defines the exact exam-result style contract', () => {
    assertTemplateStyleDefinition('exam-result', [
      'header-bracket',
      'board-title',
      'board-subtitle',
      'card-tag',
      'card-school',
      'card-name',
      'card-description',
    ], [
      'classic',
      'fresh',
      'blush',
      'midnight',
      'warm',
    ], 'warm')
    const definition = getTemplateStyleDefinition('exam-result')

    expect(definition.fontRoles[0].cssVar).toBe('--template-header-bracket-size')
    expect(definition.fontRoles[1].cssVar).toBe('--template-board-title-size')
    expect(definition.fontRoles[2].cssVar).toBe('--template-board-subtitle-size')
    expect(definition.fontRoles[3].cssVar).toBe('--template-card-tag-size')
    expect(definition.fontRoles[4].cssVar).toBe('--template-card-school-size')
    expect(definition.fontRoles[5].cssVar).toBe('--template-card-name-size')
    expect(definition.fontRoles[6].cssVar).toBe('--template-card-description-size')
    expect(definition.fontRoles[0].defaultValue).toBe(14)
    expect(definition.fontRoles[1].defaultValue).toBe(24)
    expect(definition.fontRoles[5].defaultValue).toBe(30)
    expect(definition.fontRoles[6].defaultValue).toBe(14)
    expect(definition.fontRoles[0].options).toEqual(EXPECTED_FONT_SIZE_OPTIONS)
    expect(definition.fontRoles[1].options).toEqual(EXPECTED_LARGE_FONT_SIZE_OPTIONS)
    expect(definition.fontRoles[2].options).toEqual(EXPECTED_FONT_SIZE_OPTIONS)
    expect(definition.fontRoles[5].options).toEqual(EXPECTED_LARGE_FONT_SIZE_OPTIONS)
    expect(definition.fontRoles[0].description).toBeTruthy()
    expect(definition.fontRoles[1].description).toBeTruthy()
    expect(definition.fontRoles[2].description).toBeTruthy()
    expect(definition.fontRoles[3].description).toBeTruthy()
    expect(definition.fontRoles[4].description).toBeTruthy()
    expect(definition.fontRoles[5].description).toBeTruthy()
    expect(definition.fontRoles[6].description).toBeTruthy()
    expect(definition.themes[0].description).toBeTruthy()
    expect(definition.themes[1].description).toBeTruthy()
    expect(definition.themes[2].description).toBeTruthy()
  })

  it('defines the exact class-ranking style contract', () => {
    assertTemplateStyleDefinition('class-ranking', [
      'board-eyebrow',
      'board-title',
      'badge-label',
      'section-subtitle',
      'card-head',
      'card-class',
      'card-name',
      'board-footer',
    ], [
      'academic',
      'mint',
      'apricot',
      'classic',
      'gold',
    ], 'classic')
    const definition = getTemplateStyleDefinition('class-ranking')

    expect(definition.fontRoles[0].cssVar).toBe('--template-board-eyebrow-size')
    expect(definition.fontRoles[1].cssVar).toBe('--template-board-title-size')
    expect(definition.fontRoles[2].cssVar).toBe('--template-badge-label-size')
    expect(definition.fontRoles[3].cssVar).toBe('--template-section-title-size')
    expect(definition.fontRoles[4].cssVar).toBe('--template-card-head-size')
    expect(definition.fontRoles[5].cssVar).toBe('--template-card-class-size')
    expect(definition.fontRoles[6].cssVar).toBe('--template-card-name-size')
    expect(definition.fontRoles[7].cssVar).toBe('--template-board-footer-size')
    expect(definition.fontRoles[0].defaultValue).toBe(16)
    expect(definition.fontRoles[1].defaultValue).toBe(24)
    expect(definition.fontRoles[2].defaultValue).toBe(26)
    expect(definition.fontRoles[7].defaultValue).toBe(16)
    expect(definition.fontRoles[0].options).toEqual(EXPECTED_FONT_SIZE_OPTIONS)
    expect(definition.fontRoles[1].options).toEqual(EXPECTED_LARGE_FONT_SIZE_OPTIONS)
    expect(definition.fontRoles[2].options).toEqual(EXPECTED_LARGE_FONT_SIZE_OPTIONS)
    expect(definition.fontRoles[4].options).toEqual(EXPECTED_LARGE_FONT_SIZE_OPTIONS)
    expect(definition.fontRoles[6].options).toEqual(EXPECTED_LARGE_FONT_SIZE_OPTIONS)
    expect(definition.fontRoles[0].description).toBeTruthy()
    expect(definition.fontRoles[1].description).toBeTruthy()
    expect(definition.fontRoles[2].description).toBeTruthy()
    expect(definition.fontRoles[3].description).toBeTruthy()
    expect(definition.fontRoles[4].description).toBeTruthy()
    expect(definition.fontRoles[5].description).toBeTruthy()
    expect(definition.fontRoles[6].description).toBeTruthy()
    expect(definition.fontRoles[7].description).toBeTruthy()
    expect(definition.themes[0].description).toBeTruthy()
    expect(definition.themes[1].description).toBeTruthy()
    expect(definition.themes[2].description).toBeTruthy()
  })

  it('registers both supported template ids', () => {
    expect(Object.keys(TEMPLATE_STYLE_REGISTRY).sort()).toEqual(['class-ranking', 'exam-result'])
  })

  it('defines theme token contracts for all supported templates', () => {
    TEMPLATE_IDS.forEach((templateId) => {
      assertThemeTokenContract(templateId)
    })
  })
})
