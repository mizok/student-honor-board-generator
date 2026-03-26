import { createEnvironmentInjector, runInInjectionContext, signal, type EnvironmentInjector } from '@angular/core'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DynamicDialogConfig } from 'primeng/dynamicdialog'
import { BoardService } from '@core/board.service'
import { TemplateThemeSettingsDialogComponent } from './template-theme-settings-dialog.component'

describe('TemplateThemeSettingsDialogComponent', () => {
  let injector: EnvironmentInjector
  let component: TemplateThemeSettingsDialogComponent & {
    themes: () => ReadonlyArray<{
      readonly id: string
      readonly label: string
      readonly description: string
      readonly previewColors: ReadonlyArray<string>
    }>
    selectedThemeId: () => string | null
    selectTheme: (themeId: string) => void
    resetTheme: () => void
  }

  const boardStub = {
    templateStyleDefinition: signal<{
      readonly id: string
      readonly label: string
      readonly defaultThemeId: string
      readonly themes: ReadonlyArray<{
        readonly id: string
        readonly label: string
        readonly description: string
        readonly previewColors: ReadonlyArray<string>
      }>
    } | null>({
      id: 'exam-result',
      label: '大考成績榜',
      defaultThemeId: 'warm',
      themes: [
        {
          id: 'classic',
          label: '經典',
          description: '傳統金榜底色，保留正式與穩重感。',
          previewColors: ['#fcf8f1', '#2f2418', '#c9962d'],
        },
        {
          id: 'warm',
          label: '暖金',
          description: '偏暖的金色系，適合大考榮譽與表揚感。',
          previewColors: ['#fff8e9', '#3a2b18', '#e8be58'],
        },
        {
          id: 'fresh',
          label: '清新',
          description: '偏淡雅的清爽色階，讓大量名單仍保有層次。',
          previewColors: ['#f7fbf7', '#243528', '#8faa94'],
        },
      ],
    }),
    themeId: signal<string | null>('warm'),
    updateTheme: vi.fn(),
    resetThemeSettings: vi.fn(),
  }

  beforeEach(() => {
    injector = createEnvironmentInjector([
      { provide: BoardService, useValue: boardStub },
      {
        provide: DynamicDialogConfig,
        useValue: {
          data: {
            themeId: 'fresh',
          },
        },
      },
    ])
    component = runInInjectionContext(
      injector,
      () => new TemplateThemeSettingsDialogComponent(),
    ) as typeof component

    boardStub.updateTheme.mockClear()
    boardStub.resetThemeSettings.mockClear()
  })

  afterEach(() => {
    injector.destroy()
  })

  it('renders the current template theme list structure with swatches, names, and descriptions', () => {
    const html = readFileSync(resolve(__dirname, './template-theme-settings-dialog.component.html'), 'utf8')

    expect(html).toContain('data-theme-card')
    expect(html).toContain('data-theme-swatch')
    expect(html).toContain('theme.label')
    expect(html).toContain('theme.description')
    expect(html).toContain('切換整體主題')
    expect(component.themes().map((theme) => theme.id)).toEqual(['classic', 'warm', 'fresh'])
    expect(component.selectedThemeId()).toBe('fresh')
  })

  it('calls board.updateTheme when a theme is selected', () => {
    component.selectTheme('fresh')

    expect(boardStub.updateTheme).toHaveBeenCalledWith('fresh')
  })

  it('returns to the template default theme when reset is triggered', () => {
    component.resetTheme()

    expect(boardStub.resetThemeSettings).toHaveBeenCalledTimes(1)
  })
})
