import { createEnvironmentInjector, runInInjectionContext, type EnvironmentInjector } from '@angular/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog'
import { DownloadSizeDialogComponent } from './download-size-dialog.component'

describe('DownloadSizeDialogComponent', () => {
  let injector: EnvironmentInjector
  let component: DownloadSizeDialogComponent & {
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
            width: 1024,
            widthOptions: [
              { label: '800', value: 800 },
              { label: '1024', value: 1024 },
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
})
