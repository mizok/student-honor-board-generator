import { createEnvironmentInjector, runInInjectionContext, type EnvironmentInjector } from '@angular/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog'
import { DownloadSizeDialogComponent } from './download-size-dialog.component'

describe('DownloadSizeDialogComponent', () => {
  let injector: EnvironmentInjector
  let component: DownloadSizeDialogComponent & {
    actionLabel: () => string
    actionCopy: () => string
    selectWidth: (width: number) => void
    confirm: () => void
    cancel: () => void
  }

  const dialogRefStub = {
    close: vi.fn(),
  }

  beforeEach(() => {
    injector = createEnvironmentInjector([
      {
        provide: DynamicDialogConfig,
        useValue: {
          data: {
            format: 'pdf',
            action: 'download',
            width: 1024,
            widthOptions: [
              { label: '1024', value: 1024 },
              { label: '1280', value: 1280 },
            ],
          },
        },
      },
      { provide: DynamicDialogRef, useValue: dialogRefStub },
    ])

    component = runInInjectionContext(injector, () => new DownloadSizeDialogComponent()) as typeof component
    dialogRefStub.close.mockClear()
  })

  afterEach(() => {
    injector.destroy()
  })

  it('closes dialog with the selected width when confirmed', () => {
    component.selectWidth(800)
    component.confirm()

    expect(dialogRefStub.close).toHaveBeenCalledWith({ width: 800 })
  })

  it('closes dialog without payload when cancelled', () => {
    component.cancel()

    expect(dialogRefStub.close).toHaveBeenCalledWith()
  })

  it('uses download wording by default', () => {
    expect(component.actionLabel()).toBe('下載')
    expect(component.actionCopy()).toContain('開始下載')
  })

  it('switches wording to share when opened for mobile png share', () => {
    injector.destroy()
    injector = createEnvironmentInjector([
      {
        provide: DynamicDialogConfig,
        useValue: {
          data: {
            format: 'png',
            action: 'share',
            width: 1024,
            widthOptions: [
              { label: '1024', value: 1024 },
              { label: '1280', value: 1280 },
            ],
          },
        },
      },
      { provide: DynamicDialogRef, useValue: dialogRefStub },
    ])

    component = runInInjectionContext(injector, () => new DownloadSizeDialogComponent()) as typeof component

    expect(component.actionLabel()).toBe('分享')
    expect(component.actionCopy()).toContain('開始分享')
  })
})
