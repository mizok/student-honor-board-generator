import { createEnvironmentInjector, runInInjectionContext, type EnvironmentInjector } from '@angular/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ExportService } from './export.service'

const html2canvasMock = vi.fn()
const jsPdfAddImageMock = vi.fn()
const jsPdfSaveMock = vi.fn()
const jsPdfCtorMock = vi.fn()
class JsPdfMock {
  constructor(options: unknown) {
    jsPdfCtorMock(options)
  }

  addImage(...args: unknown[]): void {
    jsPdfAddImageMock(...args)
  }

  save(filename: string): void {
    jsPdfSaveMock(filename)
  }
}

vi.mock('html2canvas', () => ({
  default: html2canvasMock,
}))

vi.mock('jspdf', () => ({
  jsPDF: JsPdfMock,
}))

describe('ExportService', () => {
  let service: ExportService
  let injector: EnvironmentInjector

  const anchorStub = { href: '', download: '', click: vi.fn() }
  const offscreenContainer = {
    style: { cssText: '' },
    appendChild: vi.fn(),
  }
  const bodyStub = {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  }
  const exportCanvasContextStub = {
    drawImage: vi.fn(),
  }
  const exportCanvasStub = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => exportCanvasContextStub),
    toDataURL: vi.fn(() => 'data:image/png;base64,resized'),
  }
  const canvasStub = {
    toDataURL: vi.fn(() => 'data:image/png;base64,abc'),
    width: 1600,
    height: 1200,
  }
  const computedStyleStub = {
    backgroundImage: 'none',
  }

  beforeEach(() => {
    injector = createEnvironmentInjector([ExportService])
    service = runInInjectionContext(injector, () => new ExportService())

    html2canvasMock.mockReset()
    html2canvasMock.mockResolvedValue(canvasStub)
    jsPdfAddImageMock.mockReset()
    jsPdfSaveMock.mockReset()
    jsPdfCtorMock.mockClear()

    anchorStub.click = vi.fn()
    offscreenContainer.appendChild.mockReset()
    bodyStub.appendChild.mockReset()
    bodyStub.removeChild.mockReset()
    exportCanvasContextStub.drawImage.mockReset()
    exportCanvasStub.width = 0
    exportCanvasStub.height = 0
    exportCanvasStub.getContext.mockClear()
    exportCanvasStub.toDataURL.mockClear()

    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 1
    })
    vi.stubGlobal('getComputedStyle', vi.fn(() => computedStyleStub))
    vi.stubGlobal('document', {
      fonts: { ready: Promise.resolve() },
      styleSheets: [],
      body: bodyStub,
      createElement: vi.fn((tag: string) => {
        if (tag === 'a') return anchorStub
        if (tag === 'div') return offscreenContainer
        if (tag === 'canvas') return exportCanvasStub
        return null
      }),
    })
  })

  afterEach(() => {
    injector.destroy()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('is instantiated', () => {
    expect(service).toBeTruthy()
  })

  it('downloadPng captures an offscreen clone at 2x scale', async () => {
    const clone = {
      style: {
        width: '',
        maxWidth: '',
        setProperty: vi.fn(),
      },
    }
    const element = {
      cloneNode: vi.fn(() => clone),
    } as unknown as HTMLElement

    await service.downloadPng(element, 1920)

    expect(bodyStub.appendChild).toHaveBeenCalledWith(offscreenContainer)
    expect(offscreenContainer.appendChild).toHaveBeenCalledWith(clone)
    expect(html2canvasMock).toHaveBeenCalledWith(
      clone,
      expect.objectContaining({
        scale: 2,
        useCORS: true,
        width: 1920,
        windowWidth: 1920,
      }),
    )
    expect(clone.style.width).toBe('1920px')
    expect(clone.style.maxWidth).toBe('none')
    expect(clone.style.setProperty).toHaveBeenCalledWith('--container-width', '19.2px')
    expect(bodyStub.removeChild).toHaveBeenCalledWith(offscreenContainer)
    expect(anchorStub.click).toHaveBeenCalled()
  })

  it('downloadPng normalizes the final PNG size back to the requested width', async () => {
    html2canvasMock.mockResolvedValueOnce({
      toDataURL: vi.fn(() => 'data:image/png;base64,hires'),
      width: 2048,
      height: 1536,
    })

    const clone = {
      style: {
        width: '',
        maxWidth: '',
        setProperty: vi.fn(),
      },
    }
    const element = {
      cloneNode: vi.fn(() => clone),
    } as unknown as HTMLElement

    await service.downloadPng(element, 1024)

    expect(exportCanvasStub.width).toBe(1024)
    expect(exportCanvasStub.height).toBe(768)
    expect(exportCanvasContextStub.drawImage).toHaveBeenCalled()
    expect(exportCanvasStub.toDataURL).toHaveBeenCalledWith('image/png')
  })

  it('downloadPdf keeps PDF page size in CSS pixels when canvas is 2x', async () => {
    const clone = {
      style: {
        width: '',
        maxWidth: '',
        setProperty: vi.fn(),
      },
    }
    const element = {
      cloneNode: vi.fn(() => clone),
    } as unknown as HTMLElement

    await service.downloadPdf(element, 800)

    expect(jsPdfCtorMock).toHaveBeenCalledWith({
      orientation: 'l',
      unit: 'px',
      format: [800, 600],
    })
    expect(jsPdfAddImageMock).toHaveBeenCalledWith(
      'data:image/png;base64,abc',
      'PNG',
      0,
      0,
      800,
      600,
    )
    expect(jsPdfSaveMock).toHaveBeenCalledWith('honor-board.pdf')
  })

  it('downloadHtml triggers anchor click', async () => {
    const el = { outerHTML: '<div></div>' } as HTMLElement
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:mock'), revokeObjectURL: vi.fn() })
    vi.stubGlobal('Blob', class { constructor() {} })

    await service.downloadHtml(el)

    expect(anchorStub.click).toHaveBeenCalled()
  })

  it('retries PNG capture after sanitizing subpixel background-image elements when html2canvas throws createPattern error', async () => {
    const invalidStateError = new DOMException(
      "Failed to execute 'createPattern' on 'CanvasRenderingContext2D': The image argument is a canvas element with a width or height of 0.",
      'InvalidStateError',
    )
    html2canvasMock.mockRejectedValueOnce(invalidStateError)
    html2canvasMock.mockResolvedValueOnce(canvasStub)

    const problematicChild = {
      style: {
        backgroundImage: '',
        minWidth: '',
        minHeight: '',
      },
      getBoundingClientRect: vi.fn(() => ({ width: 18, height: 0.78125 })),
    }
    const clone = {
      style: {
        width: '',
        maxWidth: '',
        setProperty: vi.fn(),
      },
      getBoundingClientRect: vi.fn(() => ({ width: 1024, height: 768 })),
      querySelectorAll: vi.fn(() => [problematicChild]),
    }
    const element = {
      cloneNode: vi.fn(() => clone),
    } as unknown as HTMLElement

    vi.mocked(getComputedStyle).mockImplementation((target: Element) => {
      if (target === problematicChild) {
        return { backgroundImage: 'linear-gradient(90deg, #000, transparent)' } as CSSStyleDeclaration
      }

      return computedStyleStub as CSSStyleDeclaration
    })

    await service.downloadPng(element, 1024)

    expect(problematicChild.style.minHeight).toBe('1px')
    expect(html2canvasMock).toHaveBeenCalledTimes(2)
    expect(anchorStub.click).toHaveBeenCalled()
  })
})
