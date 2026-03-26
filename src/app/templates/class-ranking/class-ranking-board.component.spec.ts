import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('ClassRankingBoardComponent badge styles', () => {
  it('renders section badges through the shared template badge component', () => {
    const html = readFileSync(resolve(__dirname, './class-ranking-board.component.html'), 'utf8')
    const ts = readFileSync(resolve(__dirname, './class-ranking-board.component.ts'), 'utf8')

    expect(html).toContain('<app-template-badge')
    expect(ts).toContain('TemplateBadgeComponent')
    expect(html).toContain('[ngStyle]="styleVars()"')
    expect(ts).toContain("readonly styleVars = input<Record<string, string | number>>({});")
  })

  it('does not rely on clip-path for section badges', () => {
    const scss = readFileSync(resolve(__dirname, './class-ranking-board.component.scss'), 'utf8')

    expect(scss).not.toContain('clip-path:')
  })

  it('does not keep the badge shape implementation inside the class-ranking stylesheet', () => {
    const scss = readFileSync(resolve(__dirname, './class-ranking-board.component.scss'), 'utf8')

    expect(scss).not.toContain('&__section-badge-start')
    expect(scss).not.toContain('&__section-badge-body')
    expect(scss).not.toContain('&__section-badge-end')
  })

  it('uses template css variables for board, badge, and card styling', () => {
    const scss = readFileSync(resolve(__dirname, './class-ranking-board.component.scss'), 'utf8')

    expect(scss).toContain('--template-board-surface-soft')
    expect(scss).toContain('--template-section-title-size')
    expect(scss).toContain('--template-primary-start')
    expect(scss).toContain('--template-secondary-start')
    expect(scss).toContain('--template-pill-start')
  })
})
