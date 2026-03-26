import { createEnvironmentInjector, runInInjectionContext, signal, type EnvironmentInjector } from '@angular/core'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DialogService } from 'primeng/dynamicdialog'
import { BoardService } from '@core/board.service'
import { EditDrawerComponent } from './edit-drawer.component'
import { TemplateFontSettingsDialogComponent } from '../template-font-settings-dialog/template-font-settings-dialog.component'
import { TemplateThemeSettingsDialogComponent } from '../template-theme-settings-dialog/template-theme-settings-dialog.component'

describe('EditDrawerComponent style settings entry points', () => {
  let injector: EnvironmentInjector
  let component: EditDrawerComponent & {
    hasStyleSettings: () => boolean
    openFontSettings: () => void
    openThemeSettings: () => void
  }

  const boardStub = {
    templateId: signal('exam-result'),
    parsedData: signal({
      title: '113學年度大考成績榜',
      subtitle: '恭賀同學金榜題名',
      tagline: '耀・煜・傳・會',
      students: [],
    }),
    columns: signal(4),
    maskNames: signal(false),
    themeId: signal('warm'),
    fontSettings: signal({
      'board-title': 24,
    }),
    templateStyleDefinition: signal({
      id: 'exam-result',
      label: '大考成績榜',
      defaultThemeId: 'warm',
      fontRoles: [],
      themes: [],
    }),
  }

  const dialogServiceStub = {
    open: vi.fn(),
  }

  beforeEach(() => {
    injector = createEnvironmentInjector([
      { provide: BoardService, useValue: boardStub },
      { provide: DialogService, useValue: dialogServiceStub },
    ])
    component = runInInjectionContext(injector, () => new EditDrawerComponent()) as typeof component

    dialogServiceStub.open.mockClear()
    boardStub.templateStyleDefinition.set({
      id: 'exam-result',
      label: '大考成績榜',
      defaultThemeId: 'warm',
      fontRoles: [],
      themes: [],
    })
  })

  afterEach(() => {
    injector.destroy()
  })

  it('renders font and theme setting entry buttons in the template', () => {
    const html = readFileSync(resolve(__dirname, './edit-drawer.component.html'), 'utf8')

    expect(html).toContain('data-open-font-settings')
    expect(html).toContain('data-open-theme-settings')
    expect(html).toContain('字體設定')
    expect(html).toContain('主題設定')
  })

  it('opens the font settings dialog when requested', () => {
    component.openFontSettings()

    expect(dialogServiceStub.open).toHaveBeenCalledWith(
      TemplateFontSettingsDialogComponent,
      expect.objectContaining({
        header: '字體設定',
        modal: true,
        data: expect.objectContaining({
          fontSettings: expect.any(Object),
          themeId: expect.any(String),
        }),
      }),
    )
  })

  it('opens the theme settings dialog when requested', () => {
    component.openThemeSettings()

    expect(dialogServiceStub.open).toHaveBeenCalledWith(
      TemplateThemeSettingsDialogComponent,
      expect.objectContaining({
        header: '主題設定',
        modal: true,
        data: expect.objectContaining({
          fontSettings: expect.any(Object),
          themeId: expect.any(String),
        }),
      }),
    )
  })

  it('does not open style dialogs when the current template has no style definition', () => {
    boardStub.templateStyleDefinition.set(null)

    expect(component.hasStyleSettings()).toBe(false)

    component.openFontSettings()
    component.openThemeSettings()

    expect(dialogServiceStub.open).not.toHaveBeenCalled()
  })
})
