import { Injectable } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class ExportService {

  async downloadPng(element: HTMLElement): Promise<void> {
    await document.fonts.ready
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(element, { scale: 2, useCORS: true })
    this.triggerDownload(canvas.toDataURL('image/png'), 'honor-board.png')
  }

  async downloadPdf(element: HTMLElement): Promise<void> {
    await document.fonts.ready
    const html2canvas = (await import('html2canvas')).default
    const { jsPDF } = await import('jspdf')

    const canvas = await html2canvas(element, { scale: 2, useCORS: true })
    const imgData = canvas.toDataURL('image/png')

    const orientation = canvas.width > canvas.height ? 'l' : 'p'
    const pdf = new jsPDF({ orientation, unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
    pdf.save('honor-board.pdf')
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
