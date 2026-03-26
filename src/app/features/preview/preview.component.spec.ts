import { createEnvironmentInjector, runInInjectionContext, signal, type EnvironmentInjector } from '@angular/core'
import { Subject } from 'rxjs'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MessageService } from 'primeng/api'
import { DialogService } from 'primeng/dynamicdialog'
import { BoardService } from '../../core/board.service'
import { ExportService } from '../../core/export.service'
import { DownloadSizeDialogComponent } from './download-size-dialog/download-size-dialog.component'
import { PreviewComponent } from './preview.component'

describe('PreviewComponent', () => {
  let injector: EnvironmentInjector
  let component: PreviewComponent & {
    exportItems: Array<{ label: string }>
    widthOptions: Array<{ label: string; value: number }>
    download: (format: 'html' | 'pdf' | 'png') => Promise<void>
  }
  let onClose$: Subject<{ width: number } | undefined>
  let dialogRefStub: { onClose: ReturnType<Subject<{ width: number } | undefined>['asObservable']> }

  const boardStub = {
    exportWidth: signal(1024),
    drawerOpen: signal(false),
    parsedData: signal(null),
    templateId: signal('exam-result'),
    columns: signal(4),
    maskNames: signal(false),
    resetToUpload: vi.fn(),
    toggleDrawer: vi.fn(),
  }

  const exportServiceStub = {
    downloadHtml: vi.fn().mockResolvedValue(undefined),
    downloadPdf: vi.fn().mockResolvedValue(undefined),
    downloadPng: vi.fn().mockResolvedValue(undefined),
    sharePng: vi.fn().mockResolvedValue(undefined),
  }

  const messageServiceStub = {
    add: vi.fn(),
  }

  const dialogServiceStub = {
    open: vi.fn(),
  }

  function stubViewport(isMobile: boolean): void {
    vi.stubGlobal('window', {
      matchMedia: vi.fn(() => ({
        matches: isMobile,
        media: '(max-width: 768px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
      navigator: {
        maxTouchPoints: isMobile ? 5 : 0,
        userAgent: isMobile ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)',
      },
    })
  }

  function createComponent(isMobile = false): void {
    stubViewport(isMobile)

    onClose$ = new Subject<{ width: number } | undefined>()
    dialogRefStub = {
      onClose: onClose$.asObservable(),
    }
    dialogServiceStub.open.mockImplementation(() => dialogRefStub)

    injector = createEnvironmentInjector([
      { provide: BoardService, useValue: boardStub },
      { provide: ExportService, useValue: exportServiceStub },
      { provide: MessageService, useValue: messageServiceStub },
      { provide: DialogService, useValue: dialogServiceStub },
    ])

    component = runInInjectionContext(injector, () => new PreviewComponent()) as typeof component

    boardStub.exportWidth.set(1024)
    exportServiceStub.downloadHtml.mockClear()
    exportServiceStub.downloadPdf.mockClear()
    exportServiceStub.downloadPng.mockClear()
    exportServiceStub.sharePng.mockClear()
    messageServiceStub.add.mockClear()
    dialogServiceStub.open.mockClear()

    vi.stubGlobal('document', {
      querySelector: vi.fn(() => ({}) as HTMLElement),
    })
  }

  beforeEach(() => {
    createComponent()
  })

  afterEach(() => {
    onClose$.unsubscribe()
    injector.destroy()
    vi.unstubAllGlobals()
  })

  it('opens dialog service for pdf instead of downloading immediately', async () => {
    await component.download('pdf')

    expect(dialogServiceStub.open).toHaveBeenCalledWith(
      DownloadSizeDialogComponent,
      expect.objectContaining({
        header: '下載 PDF',
        modal: true,
      }),
    )
    expect(exportServiceStub.downloadPdf).not.toHaveBeenCalled()
  })

  it('downloads html immediately without opening dialog service', async () => {
    await component.download('html')

    expect(dialogServiceStub.open).not.toHaveBeenCalled()
    expect(exportServiceStub.downloadHtml).toHaveBeenCalledTimes(1)
  })

  it('downloads pdf after dialog closes with a selected width', async () => {
    await component.download('pdf')
    boardStub.exportWidth.set(800)

    onClose$.next({ width: 800 })

    expect(boardStub.exportWidth()).toBe(800)
    expect(exportServiceStub.downloadPdf).toHaveBeenCalledWith(expect.anything(), 800)
  })

  it('does not download png when dialog closes without a result', async () => {
    await component.download('png')

    onClose$.next(undefined)

    expect(exportServiceStub.downloadPng).not.toHaveBeenCalled()
  })

  it('shares png on mobile after dialog closes with a selected width', async () => {
    injector.destroy()
    onClose$.unsubscribe()
    createComponent(true)

    await component.download('png')
    boardStub.exportWidth.set(1280)

    onClose$.next({ width: 1280 })

    expect(boardStub.exportWidth()).toBe(1280)
    expect(exportServiceStub.sharePng).toHaveBeenCalledWith(expect.anything(), 1280)
    expect(exportServiceStub.downloadPng).not.toHaveBeenCalled()
  })

  it('does not bind a drawer-open layout class on the preview root', () => {
    const template = readFileSync(resolve(__dirname, './preview.component.html'), 'utf8')

    expect(template).not.toContain('[class.preview--drawer-open]')
  })

  it('does not include the unstable 800 width option', () => {
    expect(component.widthOptions.map(option => option.value)).toEqual([1024, 1280, 1920])
  })

  it('keeps pdf, png, and html export options on desktop', () => {
    expect(component.exportItems.map(item => item.label)).toEqual(['下載 PDF', '下載 PNG', '下載 HTML'])
  })

  it('only exposes png export on mobile', () => {
    injector.destroy()
    onClose$.unsubscribe()
    createComponent(true)

    expect(component.exportItems.map(item => item.label)).toEqual(['下載 PNG'])
  })
})
