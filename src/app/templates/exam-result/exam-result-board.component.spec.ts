import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('ExamResultBoardComponent style variables', () => {
  it('binds styleVars onto the board root element', () => {
    const html = readFileSync(resolve(__dirname, './exam-result-board.component.html'), 'utf8')
    const ts = readFileSync(resolve(__dirname, './exam-result-board.component.ts'), 'utf8')

    expect(html).toContain('[ngStyle]="styleVars()"')
    expect(ts).toContain("readonly styleVars = input<Record<string, string | number>>({});")
  })

  it('uses template css variables for board and card typography/colors', () => {
    const scss = readFileSync(resolve(__dirname, './exam-result-board.component.scss'), 'utf8')

    expect(scss).toContain('--template-board-bg')
    expect(scss).toContain('--template-board-title-size')
    expect(scss).toContain('--template-card-name-size')
    expect(scss).toContain('--template-primary-start')
    expect(scss).toContain('--template-card-divider')
  })
})
