import { Injectable } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class ExportService {
  private isCreatePatternZeroCanvasError(error: unknown): boolean {
    return error instanceof DOMException &&
      error.name === 'InvalidStateError' &&
      error.message.includes('createPattern') &&
      error.message.includes('width or height of 0')
  }

  private sanitizeProblematicBackgroundImages(root: HTMLElement): number {
    const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))]
    let sanitizedCount = 0

    for (const element of elements) {
      const bounds = element.getBoundingClientRect()
      const styles = getComputedStyle(element)
      if (styles.backgroundImage === 'none') continue

      if (bounds.width <= 0 || bounds.height <= 0) {
        element.style.backgroundImage = 'none'
        sanitizedCount += 1
        continue
      }

      let changed = false

      if (bounds.width < 1) {
        element.style.minWidth = '1px'
        changed = true
      }

      if (bounds.height < 1) {
        element.style.minHeight = '1px'
        changed = true
      }

      if (changed) sanitizedCount += 1
    }

    return sanitizedCount
  }

  private async captureCanvas(element: HTMLElement, width: number): Promise<HTMLCanvasElement> {
    const html2canvas = (await import('html2canvas')).default

    try {
      return await html2canvas(element, {
        scale: 2,
        useCORS: true,
        width,
        windowWidth: width,
      })
    } catch (error) {
      if (!this.isCreatePatternZeroCanvasError(error)) throw error

      const sanitizedCount = this.sanitizeProblematicBackgroundImages(element)
      if (sanitizedCount === 0) throw error

      return html2canvas(element, {
        scale: 2,
        useCORS: true,
        width,
        windowWidth: width,
      })
    }
  }

  private getExportHeight(canvas: HTMLCanvasElement, width: number): number {
    return Math.round((canvas.height / canvas.width) * width)
  }

  private normalizePngCanvas(canvas: HTMLCanvasElement, width: number): HTMLCanvasElement {
    if (canvas.width === width) return canvas

    const normalizedCanvas = document.createElement('canvas')
    normalizedCanvas.width = width
    normalizedCanvas.height = this.getExportHeight(canvas, width)

    const context = normalizedCanvas.getContext('2d')
    if (!context) throw new Error('無法建立 PNG 匯出畫布')

    context.drawImage(canvas, 0, 0, normalizedCanvas.width, normalizedCanvas.height)
    return normalizedCanvas
  }

  private async cloneOffscreen(
    element: HTMLElement,
    width: number,
  ): Promise<{ clone: HTMLElement; cleanup: () => void }> {
    const container = document.createElement('div')
    container.style.cssText =
      'position:fixed;top:-9999px;left:-9999px;pointer-events:none;overflow:visible;'

    const clone = element.cloneNode(true) as HTMLElement
    clone.style.width = `${width}px`
    clone.style.maxWidth = 'none'
    clone.style.setProperty('--container-width', `${width / 100}px`)
    container.appendChild(clone)
    document.body.appendChild(container)

    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

    return {
      clone,
      cleanup: () => document.body.removeChild(container),
    }
  }

  async downloadPng(element: HTMLElement, width: number): Promise<void> {
    await document.fonts.ready
    const { clone, cleanup } = await this.cloneOffscreen(element, width)

    try {
      const canvas = await this.captureCanvas(clone, width)
      const normalizedCanvas = this.normalizePngCanvas(canvas, width)
      this.triggerDownload(normalizedCanvas.toDataURL('image/png'), 'honor-board.png')
    } finally {
      cleanup()
    }
  }

  async downloadPdf(element: HTMLElement, width: number): Promise<void> {
    await document.fonts.ready
    const { jsPDF } = await import('jspdf')
    const { clone, cleanup } = await this.cloneOffscreen(element, width)

    try {
      const canvas = await this.captureCanvas(clone, width)
      const exportHeight = this.getExportHeight(canvas, width)
      const imgData = canvas.toDataURL('image/png')
      const orientation = width > exportHeight ? 'l' : 'p'
      const pdf = new jsPDF({
        orientation,
        unit: 'px',
        format: [width, exportHeight],
      })

      pdf.addImage(imgData, 'PNG', 0, 0, width, exportHeight)
      pdf.save('honor-board.pdf')
    } finally {
      cleanup()
    }
  }

  async downloadHtml(element: HTMLElement): Promise<void> {
    const styles = Array.from(document.styleSheets)
      .flatMap(sheet => {
        try { return Array.from(sheet.cssRules).map(r => r.cssText) }
        catch { return [] }
      })
      .join('\n')

    const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <title>榮譽榜</title>
  <style>${styles}</style>
</head>
<body>${element.outerHTML}</body>
</html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    this.triggerDownload(URL.createObjectURL(blob), 'honor-board.html')
  }

  private triggerDownload(href: string, filename: string): void {
    const a = document.createElement('a')
    a.href = href
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(href), 1000)
  }
}
