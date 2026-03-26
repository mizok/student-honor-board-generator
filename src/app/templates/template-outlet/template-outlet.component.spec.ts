import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('TemplateOutletComponent style var forwarding', () => {
  it('accepts styleVars input and forwards it to both template boards', () => {
    const ts = readFileSync(resolve(__dirname, './template-outlet.component.ts'), 'utf8')

    expect(ts).toContain("readonly styleVars = input<Record<string, string | number>>({});")
    expect(ts).toContain('[styleVars]="styleVars()"')
    expect(ts.match(/\[styleVars\]="styleVars\(\)"/g)?.length).toBe(2)
  })
})
