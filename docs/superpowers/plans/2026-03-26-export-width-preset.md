# Export Width Preset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 PDF/PNG 下載時可從 800/1024/1280/1920 四個預設寬度選一個，輸出不依賴視窗大小，且不造成畫面閃爍。

**Architecture:** 在 `BoardService` 加 `exportWidth` signal。`PreviewComponent` toolbar 放 SelectButton 綁定此 signal。下載時 `ExportService` clone `app-template-outlet` DOM 到離屏容器，在 clone 上設 `--container-width: targetWidth/100 px`，截圖後移除 clone，原畫面不受影響。

**Tech Stack:** Angular 21 Signals、PrimeNG SelectButton、html2canvas、jsPDF

---

### Task 1: BoardService 加 exportWidth signal

**Files:**
- Modify: `src/app/core/board.service.ts`

- [ ] **Step 1: 讀取現有 board.service.ts**

確認目前已有的 signals（`templateId`, `parsedData`, `columns`, `drawerOpen`, `maskNames` 等）。

- [ ] **Step 2: 加入 exportWidth signal**

在 `board.service.ts` 的 signal 宣告區加入：

```ts
readonly exportWidth = signal<number>(1024);
```

不需要其他改動。

- [ ] **Step 3: Commit**

```bash
git add src/app/core/board.service.ts
git commit -m "feat(board): add exportWidth signal with default 1024"
```

---

### Task 2: ExportService 支援離屏截圖與指定寬度

**Files:**
- Modify: `src/app/core/export.service.ts`

- [ ] **Step 1: 讀取現有 export.service.ts**

確認 `downloadPng` 與 `downloadPdf` 目前的 signature 和 html2canvas 呼叫方式。

- [ ] **Step 2: 加入 private cloneOffscreen 方法**

此方法負責：clone 指定元素、放入離屏容器、設定 `--container-width`、回傳 clone 元素與 cleanup function。

```ts
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

  // 等一個 frame 讓瀏覽器完成 layout
  await new Promise<void>(r => requestAnimationFrame(() => r()));

  return {
    clone,
    cleanup: () => document.body.removeChild(container),
  };
}
```

- [ ] **Step 3: 更新 downloadPng signature，使用離屏 clone**

```ts
async downloadPng(element: HTMLElement, width: number): Promise<void> {
  await document.fonts.ready;
  const html2canvas = (await import('html2canvas')).default;
  const { clone, cleanup } = await this.cloneOffscreen(element, width);
  try {
    const canvas = await html2canvas(clone, { scale: 2, useCORS: true, width, windowWidth: width });
    this.triggerDownload(canvas.toDataURL('image/png'), 'honor-board.png');
  } finally {
    cleanup();
  }
}
```

- [ ] **Step 4: 更新 downloadPdf signature，使用離屏 clone**

```ts
async downloadPdf(element: HTMLElement, width: number): Promise<void> {
  await document.fonts.ready;
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');
  const { clone, cleanup } = await this.cloneOffscreen(element, width);
  try {
    const canvas = await html2canvas(clone, { scale: 2, useCORS: true, width, windowWidth: width });
    const imgData = canvas.toDataURL('image/png');
    const orientation = canvas.width > canvas.height ? 'l' : 'p';
    const pdf = new jsPDF({
      orientation,
      unit: 'px',
      format: [canvas.width / 2, canvas.height / 2],
    });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save('honor-board.pdf');
  } finally {
    cleanup();
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/core/export.service.ts
git commit -m "feat(export): offscreen clone for width-accurate PNG/PDF export"
```

---

### Task 3: PreviewComponent 加寬度 SelectButton 並傳遞 exportWidth

**Files:**
- Modify: `src/app/features/preview/preview.component.ts`
- Modify: `src/app/features/preview/preview.component.html`
- Modify: `src/app/features/preview/preview.component.scss`

- [ ] **Step 1: 更新 preview.component.ts**

加入 `SelectButtonModule` import 與 `widthOptions`，並把 `exportWidth` 傳給 download 方法：

```ts
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
```

在 `imports` 陣列加入 `SelectButtonModule, FormsModule`。

加入 widthOptions：
```ts
protected readonly widthOptions = [
  { label: '800', value: 800 },
  { label: '1024', value: 1024 },
  { label: '1280', value: 1280 },
  { label: '1920', value: 1920 },
];
```

更新 `download` 方法，HTML export 不需要寬度，PNG/PDF 傳入 `board.exportWidth()`。截圖目標改用 `app-template-outlet`（`--container-width` 是設在其 host element 上，clone 後才能覆蓋正確的值）：

```ts
protected async download(format: 'html' | 'pdf' | 'png'): Promise<void> {
  try {
    const el = document.querySelector('app-template-outlet') as HTMLElement;
    if (format === 'html') await this.exportService.downloadHtml(el);
    if (format === 'pdf') await this.exportService.downloadPdf(el, this.board.exportWidth());
    if (format === 'png') await this.exportService.downloadPng(el, this.board.exportWidth());
  } catch {
    this.messageService.add({ severity: 'error', summary: '下載失敗', detail: '請稍後再試' });
  }
}
```

- [ ] **Step 2: 更新 preview.component.html**

在 toolbar actions 的「編輯內容」按鈕後、下載按鈕前，加入 SelectButton：

```html
<p-select-button
  [options]="widthOptions"
  [ngModel]="board.exportWidth()"
  (ngModelChange)="board.exportWidth.set($event)"
  [allowEmpty]="false"
  optionLabel="label"
  optionValue="value"
  styleClass="preview__width-select"
/>
```

注意：`board.exportWidth` 是 `signal()`（非 `model()`），不能用 `[(ngModel)]` 直接綁定，需展開為 `[ngModel]` + `(ngModelChange)`。

- [ ] **Step 3: 更新 preview.component.scss，調整 SelectButton 大小**

在 `.preview__toolbar-actions` 區塊後加入：

```scss
:host ::ng-deep .preview__width-select {
  .p-selectbutton {
    .p-button {
      padding: 4px 10px;
      font-size: 12px;
    }
  }
}
```

- [ ] **Step 4: 確認畫面正常，手動測試**

1. `npm run dev` 啟動
2. 上傳任一 CSV 進入預覽畫面
3. 確認 toolbar 出現 `800 / 1024 / 1280 / 1920` 的切換按鈕
4. 選 1920，點「下載 PNG」，確認圖片寬度為 1920px（用系統資訊或圖片檢視器確認）
5. 選 800，點「下載 PDF」，確認 PDF 寬度約 800px
6. 確認切換寬度時預覽畫面不會閃爍或改變大小

- [ ] **Step 5: Commit**

```bash
git add src/app/features/preview/preview.component.ts \
        src/app/features/preview/preview.component.html \
        src/app/features/preview/preview.component.scss
git commit -m "feat(preview): add export width preset selector (800/1024/1280/1920)"
```
