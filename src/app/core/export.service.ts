import { Injectable } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class ExportService {
  private async cloneOffscreen(
    element: HTMLElement,
    width: number,
  ): Promise<{ clone: HTMLElement; cleanup: () => void }> {
    const container = document.createElement('div');
    container.style.cssText =
      'position:fixed;top:-9999px;left:-9999px;pointer-events:none;overflow:visible;';

    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.width = `${width}px`;
    clone.style.maxWidth = 'none';
    clone.style.setProperty('--container-width', `${width / 100}px`);
    container.appendChild(clone);
    document.body.appendChild(container);

    await new Promise<void>(r => requestAnimationFrame(() => r()));

    return {
      clone,
      cleanup: () => document.body.removeChild(container),
    };
  }

  async downloadPng(element: HTMLElement, width: number): Promise<void> {
    await document.fonts.ready
    const html2canvas = (await import('html2canvas')).default
    const { clone, cleanup } = await this.cloneOffscreen(element, width)
    try {
      const canvas = await html2canvas(clone, { scale: 2, useCORS: true, width, windowWidth: width })
      this.triggerDownload(canvas.toDataURL('image/png'), 'honor-board.png')
    } finally {
      cleanup()
    }
  }

  async downloadPdf(element: HTMLElement, width: number): Promise<void> {
    await document.fonts.ready
    const html2canvas = (await import('html2canvas')).default
    const { jsPDF } = await import('jspdf')
    const { clone, cleanup } = await this.cloneOffscreen(element, width)
    try {
      const canvas = await html2canvas(clone, { scale: 2, useCORS: true, width, windowWidth: width })
      const imgData = canvas.toDataURL('image/png')

      const orientation = canvas.width > canvas.height ? 'l' : 'p'
      const pdf = new jsPDF({ orientation, unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
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
