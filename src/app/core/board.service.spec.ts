import { describe, expect, it, vi } from 'vitest'
import { BoardService } from './board.service'
import { TEMPLATE_STYLE_REGISTRY } from './template-style-registry'
import { parseFileToRows } from './file-parser'

vi.mock('./file-parser', () => ({
  parseFileToRows: vi.fn(),
}))

const mockedParseFileToRows = vi.mocked(parseFileToRows)

function createBoardService(): BoardService {
  return new BoardService()
}

function getTemplateDefaultThemeId(templateId: keyof typeof TEMPLATE_STYLE_REGISTRY): string {
  return TEMPLATE_STYLE_REGISTRY[templateId].defaultThemeId
}

function getTemplateDefaultFontSettings(templateId: keyof typeof TEMPLATE_STYLE_REGISTRY): Record<string, number> {
  return Object.fromEntries(
    TEMPLATE_STYLE_REGISTRY[templateId].fontRoles.map((role) => [role.id, role.defaultValue]),
  )
}

function getTemplateDefaultStyleVars(templateId: keyof typeof TEMPLATE_STYLE_REGISTRY): Record<string, string | number> {
  const definition = TEMPLATE_STYLE_REGISTRY[templateId]
  const theme = definition.themes.find((item) => item.id === definition.defaultThemeId)!
  const responsiveSize = (value: number): string => `calc(${value / 10.24} * var(--container-width))`

  return {
    ...theme.tokens,
    ...Object.fromEntries(
      definition.fontRoles.map((role) => [role.cssVar, responsiveSize(role.defaultValue)]),
    ),
  }
}

describe('BoardService', () => {
  it('starts with empty style state before any template is selected', () => {
    const board = createBoardService()

    expect(board.templateId()).toBe('')
    expect(board.themeId()).toBeNull()
    expect(board.fontSettings()).toEqual({})
    expect(board.templateStyleDefinition()).toBeNull()
    expect(board.templateStyleVars()).toEqual({})
  })

  it('applies the default style settings when loading a template and resets them when switching templates', () => {
    const board = createBoardService()

    board.loadDefault('exam-result')

    expect(board.templateId()).toBe('exam-result')
    expect(board.templateStyleDefinition()?.id).toBe('exam-result')
    expect(board.themeId()).toBe(getTemplateDefaultThemeId('exam-result'))
    expect(board.fontSettings()).toEqual(getTemplateDefaultFontSettings('exam-result'))
    expect(board.templateStyleVars()).toEqual(getTemplateDefaultStyleVars('exam-result'))

    board.updateTheme('warm')
    board.updateFontRole('card-name', 32)

    expect(board.themeId()).toBe('warm')
    expect(board.fontSettings()).toEqual({
      'header-bracket': 14,
      'board-title': 24,
      'board-subtitle': 16,
      'card-tag': 12,
      'card-school': 12,
      'card-name': 32,
      'card-description': 14,
    })

    board.loadDefault('class-ranking')

    expect(board.templateId()).toBe('class-ranking')
    expect(board.templateStyleDefinition()?.id).toBe('class-ranking')
    expect(board.themeId()).toBe(getTemplateDefaultThemeId('class-ranking'))
    expect(board.fontSettings()).toEqual(getTemplateDefaultFontSettings('class-ranking'))
    expect(board.templateStyleVars()).toEqual(getTemplateDefaultStyleVars('class-ranking'))
  })

  it('applies the template default style settings after a successful parse', async () => {
    const board = createBoardService()
    mockedParseFileToRows.mockResolvedValueOnce([
      ['title', '113學年度大考成績榜'],
      ['subtitle', '恭賀同學金榜題名'],
      ['tagline', '耀・煜・傳・會'],
      ['tag', 'school', 'studentName', 'description', 'highlight'],
      ['英文', '鶯歌國中', '王小明', '建國高中', ''],
    ])

    await board.parse('exam-result', { name: 'exam.csv' } as File)

    expect(board.templateId()).toBe('exam-result')
    expect(board.templateStyleDefinition()?.id).toBe('exam-result')
    expect(board.themeId()).toBe(getTemplateDefaultThemeId('exam-result'))
    expect(board.fontSettings()).toEqual(getTemplateDefaultFontSettings('exam-result'))
  })

  it('clears stale preview state when parse fails after a previous successful load', async () => {
    const board = createBoardService()

    board.loadDefault('exam-result')
    mockedParseFileToRows.mockRejectedValueOnce(new Error('boom'))

    await board.parse('class-ranking', { name: 'broken.csv' } as File)

    expect(board.uiState()).toBe('upload')
    expect(board.templateId()).toBe('')
    expect(board.parsedData()).toBeNull()
    expect(board.themeId()).toBeNull()
    expect(board.fontSettings()).toEqual({})
    expect(board.templateStyleDefinition()).toBeNull()
    expect(board.templateStyleVars()).toEqual({})
    expect(board.errorMessage()).toBe('boom')
  })

  it('updates a single font role and theme independently', () => {
    const board = createBoardService()

    board.loadDefault('exam-result')
    board.updateFontRole('card-name', 32)
    board.updateTheme('fresh')

    expect(board.fontSettings()).toEqual({
      'header-bracket': 14,
      'board-title': 24,
      'board-subtitle': 16,
      'card-tag': 12,
      'card-school': 12,
      'card-name': 32,
      'card-description': 14,
    })
    expect(board.themeId()).toBe('fresh')
    expect(board.templateStyleVars()).toEqual({
      ...TEMPLATE_STYLE_REGISTRY['exam-result'].themes.find((theme) => theme.id === 'fresh')!.tokens,
      '--template-header-bracket-size': 'calc(1.3671875 * var(--container-width))',
      '--template-board-title-size': 'calc(2.34375 * var(--container-width))',
      '--template-board-subtitle-size': 'calc(1.5625 * var(--container-width))',
      '--template-card-tag-size': 'calc(1.171875 * var(--container-width))',
      '--template-card-school-size': 'calc(1.171875 * var(--container-width))',
      '--template-card-name-size': 'calc(3.125 * var(--container-width))',
      '--template-card-description-size': 'calc(1.3671875 * var(--container-width))',
    })
  })

  it('clears previous errors on loadDefault and ignores unknown font roles', () => {
    const board = createBoardService()

    board.errorMessage.set('上一個錯誤')
    board.loadDefault('exam-result')
    board.updateFontRole('unknown-role', 99)

    expect(board.errorMessage()).toBeNull()
    expect(board.fontSettings()).toEqual({
      'header-bracket': 14,
      'board-title': 24,
      'board-subtitle': 16,
      'card-tag': 12,
      'card-school': 12,
      'card-name': 30,
      'card-description': 14,
    })
  })

  it('resets theme and font settings independently', () => {
    const board = createBoardService()

    board.loadDefault('exam-result')
    board.updateTheme('fresh')
    board.updateFontRole('card-name', 32)

    board.resetThemeSettings()

    expect(board.themeId()).toBe(getTemplateDefaultThemeId('exam-result'))
    expect(board.fontSettings()['card-name']).toBe(32)

    board.resetFontSettings()

    expect(board.fontSettings()).toEqual(getTemplateDefaultFontSettings('exam-result'))
  })
})
