import { createEnvironmentInjector, runInInjectionContext, type EnvironmentInjector } from '@angular/core'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { ExportService } from './export.service'

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    toDataURL: vi.fn().mockReturnValue('data:image/png;base64,abc'),
    width: 800,
    height: 600,
  }),
}))

describe('ExportService', () => {
  let service: ExportService
  let injector: EnvironmentInjector

  // Minimal DOM stubs (no jsdom required)
  const anchorStub = { href: '', download: '', click: vi.fn() }
  const canvasStub = { toDataURL: vi.fn(() => 'data:image/png;base64,abc') }

  beforeEach(() => {
    injector = createEnvironmentInjector([ExportService])
    service = runInInjectionContext(injector, () => new ExportService())

    vi.stubGlobal('document', {
      fonts: { ready: Promise.resolve() },
      styleSheets: [],
      createElement: vi.fn((tag: string) => {
        if (tag === 'a') return anchorStub
        return canvasStub
      }),
    })
    anchorStub.click = vi.fn()
  })

  afterEach(() => {
    injector.destroy()
    vi.unstubAllGlobals()
  })

  it('is instantiated', () => {
    expect(service).toBeTruthy()
  })

  it('downloadPng triggers anchor click', async () => {
    const el = {} as HTMLElement
    await service.downloadPng(el)
    expect(anchorStub.click).toHaveBeenCalled()
  })

  it('downloadHtml triggers anchor click', async () => {
    const el = { outerHTML: '<div></div>' } as HTMLElement
    anchorStub.click = vi.fn()
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:mock'), revokeObjectURL: vi.fn() })
    vi.stubGlobal('Blob', class { constructor() {} })
    await service.downloadHtml(el)
    expect(anchorStub.click).toHaveBeenCalled()
  })
})
