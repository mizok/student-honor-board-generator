import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('ClassRankingBoardComponent layout', () => {
  it('switches to compact cards when columns are 5 or more', () => {
    const ts = readFileSync(resolve(__dirname, './class-ranking-board.component.ts'), 'utf8')
    const html = readFileSync(resolve(__dirname, './class-ranking-board.component.html'), 'utf8')

    expect(ts).toContain('protected readonly isCompactColumns = computed(() => this.columns() >= 5);')
    expect(html).toContain('[class.board__cards--compact]="isCompactColumns()"')
  })

  it('allows class-ranking names to wrap in compact card mode', () => {
    const scss = readFileSync(resolve(__dirname, './class-ranking-board.component.scss'), 'utf8')

    expect(scss).toContain('&--compact')
    expect(scss).toContain('white-space: normal;')
    expect(scss).toContain('overflow-wrap: anywhere;')
  })
})
