import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const basePath = resolve(__dirname, './template-badge.component')

describe('TemplateBadgeComponent', () => {
  it('exists as a generated standalone component', () => {
    expect(existsSync(`${basePath}.ts`)).toBe(true)
    expect(existsSync(`${basePath}.html`)).toBe(true)
    expect(existsSync(`${basePath}.scss`)).toBe(true)
  })

  it('uses a single svg background plus an html label', () => {
    const html = existsSync(`${basePath}.html`) ? readFileSync(`${basePath}.html`, 'utf8') : ''

    expect(html).toContain('template-badge__background')
    expect(html).toContain('template-badge__label')
    expect(html).not.toContain('template-badge__start')
    expect(html).not.toContain('template-badge__body')
    expect(html).not.toContain('template-badge__end')
  })

  it('uses a single badge height variable, svg gradients, and resize measurement', () => {
    const ts = existsSync(`${basePath}.ts`) ? readFileSync(`${basePath}.ts`, 'utf8') : ''
    const scss = existsSync(`${basePath}.scss`) ? readFileSync(`${basePath}.scss`, 'utf8') : ''
    const html = existsSync(`${basePath}.html`) ? readFileSync(`${basePath}.html`, 'utf8') : ''

    expect(scss).toContain('--badge-height')
    expect(scss).toContain('--template-badge-label-size')
    expect(html).toContain('<linearGradient')
    expect(ts).toContain('ResizeObserver')
    expect(html).toContain('[attr.viewBox]')
    expect(ts).toContain("var(--template-primary-start")
    expect(ts).toContain("var(--template-secondary-start")
  })

  it('does not rely on seam overlap pseudo elements anymore', () => {
    const scss = existsSync(`${basePath}.scss`) ? readFileSync(`${basePath}.scss`, 'utf8') : ''

    expect(scss).not.toContain('--badge-seam-overlap')
  })
})
