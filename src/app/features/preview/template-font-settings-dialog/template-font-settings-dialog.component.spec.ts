import { createEnvironmentInjector, runInInjectionContext, signal, type EnvironmentInjector } from '@angular/core'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DynamicDialogConfig } from 'primeng/dynamicdialog'
import { BoardService } from '@core/board.service'
import { TemplateFontSettingsDialogComponent } from './template-font-settings-dialog.component'

describe('TemplateFontSettingsDialogComponent', () => {
  let injector: EnvironmentInjector
  let component: TemplateFontSettingsDialogComponent & {
    templateLabel: () => string
    fontRoles: () => ReadonlyArray<{
      readonly id: string
      readonly label: string
      readonly description: string
      readonly defaultValue: number
      readonly options: readonly number[]
    }>
    fontSettings: () => Readonly<Record<string, number>>
    isSelected: (roleId: string, value: number) => boolean
    selectFontSize: (roleId: string, value: number) => void
    resetFontSettings: () => void
  }

  const boardStub = {
    templateStyleDefinition: signal<{
      readonly id: string
      readonly label: string
      readonly fontRoles: ReadonlyArray<{
        readonly id: string
        readonly label: string
        readonly description: string
        readonly defaultValue: number
        readonly options: readonly number[]
      }>
    } | null>({
      id: 'exam-result',
      label: '大考成績榜',
      fontRoles: [
        {
          id: 'board-title',
          label: '主標題',
          description: '控制整張榮譽榜最主要的視覺標題。',
          defaultValue: 24,
          options: [16, 18, 20, 24, 28, 32],
        },
        {
          id: 'card-name',
          label: '卡片姓名',
          description: '影響每張榜單卡片中的學生姓名大小。',
          defaultValue: 30,
          options: [16, 18, 20, 24, 28, 32],
        },
      ],
    }),
    fontSettings: signal<Record<string, number>>({
      'card-name': 28,
    }),
    updateFontRole: vi.fn(),
    resetFontSettings: vi.fn(),
  }

  beforeEach(() => {
    injector = createEnvironmentInjector([
      { provide: BoardService, useValue: boardStub },
      {
        provide: DynamicDialogConfig,
        useValue: {
          data: {
            fontSettings: {
              'board-title': 32,
              'card-name': 28,
            },
          },
        },
      },
    ])
    component = runInInjectionContext(
      injector,
      () => new TemplateFontSettingsDialogComponent(),
    ) as typeof component

    boardStub.updateFontRole.mockClear()
    boardStub.resetFontSettings.mockClear()
    boardStub.fontSettings.set({ 'card-name': 28 })
  })

  afterEach(() => {
    injector.destroy()
  })

  it('renders the new card-based structure with role descriptions and option pills', () => {
    const html = readFileSync(resolve(__dirname, './template-font-settings-dialog.component.html'), 'utf8')

    expect(html).toContain('data-font-role-row')
    expect(html).toContain('data-font-role-option')
    expect(html).toContain('role.description')
    expect(html).toContain('調整文字層級')
    expect(component.templateLabel()).toBe('大考成績榜')
    expect(component.fontRoles().map((role) => role.id)).toEqual(['board-title', 'card-name'])
  })

  it('uses defaults when a role has not been overridden and detects selected options', () => {
    expect(component.isSelected('board-title', 32)).toBe(true)
    expect(component.isSelected('board-title', 24)).toBe(false)
    expect(component.isSelected('card-name', 28)).toBe(true)
    expect(component.isSelected('card-name', 30)).toBe(false)
  })

  it('updates the board service when a size pill is clicked', () => {
    component.selectFontSize('board-title', 32)

    expect(boardStub.updateFontRole).toHaveBeenCalledWith('board-title', 32)
  })

  it('resets only font role overrides when reset is triggered', () => {
    component.resetFontSettings()

    expect(boardStub.resetFontSettings).toHaveBeenCalledTimes(1)
  })

  it('falls back to the empty state when the current template has no font roles', () => {
    boardStub.templateStyleDefinition.set({
      id: 'exam-result',
      label: '大考成績榜',
      fontRoles: [],
    })

    expect(component.fontRoles()).toEqual([])

    const html = readFileSync(resolve(__dirname, './template-font-settings-dialog.component.html'), 'utf8')
    expect(html).toContain('目前這個版型沒有可調整的字體設定。')
  })
})
