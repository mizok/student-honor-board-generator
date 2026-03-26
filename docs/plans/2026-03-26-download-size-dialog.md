# Download Size Dialog Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 把預覽頁的匯出尺寸選擇改成下載前 dialog，並保留 PDF / PNG 的尺寸控制與 HTML 直接下載流程。

**Architecture:** 只修改 `PreviewComponent`。header 移除常駐尺寸選擇，改由 `PreviewComponent` 維護 `pendingDownloadFormat` 與 dialog 顯示狀態；確認下載時再依 format 呼叫 `ExportService`。既有 `BoardService.exportWidth` 繼續作為尺寸來源。

**Tech Stack:** Angular 21 standalone components、Signals、PrimeNG Dialog / SelectButton / SplitButton、Vitest

---

### Task 1: 為下載 dialog 行為補 PreviewComponent 測試

**Files:**
- Create: `src/app/features/preview/preview.component.spec.ts`
- Reference: `src/app/features/preview/preview.component.ts`

**Step 1: 寫失敗測試，驗證 PDF / PNG 先開 dialog**

測試 `download('pdf')` 或對外對應行為時，不應立刻呼叫 `ExportService.downloadPdf()`，而是把 dialog state 設為開啟。

**Step 2: 跑單檔測試確認紅燈**

Run: `npx vitest run src/app/features/preview/preview.component.spec.ts`

**Step 3: 補失敗測試，驗證 HTML 直接下載**

測試 `download('html')` 仍直接呼叫 `ExportService.downloadHtml()`。

**Step 4: 補失敗測試，驗證 dialog 確認後帶入 exportWidth**

先設定 `board.exportWidth`，再確認 dialog，驗證 `downloadPdf` / `downloadPng` 收到目前尺寸。

**Step 5: 再跑一次單檔測試確認仍是預期失敗**

Run: `npx vitest run src/app/features/preview/preview.component.spec.ts`

### Task 2: 實作 PreviewComponent dialog 狀態與下載流程

**Files:**
- Modify: `src/app/features/preview/preview.component.ts`

**Step 1: 新增 DialogModule import 與 dialog 狀態**

加入 PrimeNG `DialogModule`，新增：

- `pendingDownloadFormat = signal<'pdf' | 'png' | null>(null)`
- `downloadDialogVisible = computed(() => this.pendingDownloadFormat() !== null)`

**Step 2: 將下載邏輯拆成「開 dialog」與「執行下載」**

- 新增 `openDownloadDialog(format)`
- 新增 `closeDownloadDialog()`
- 新增 `confirmDownload()`
- 既有 `download(format)` 改成內部真正執行下載的方法，例如 `performDownload(format)`

**Step 3: 保留 HTML 直接下載**

若 format 是 `html`，直接走 `performDownload('html')`，不進 dialog。

**Step 4: 跑 PreviewComponent 測試**

Run: `npx vitest run src/app/features/preview/preview.component.spec.ts`

### Task 3: 更新 PreviewComponent template 與樣式

**Files:**
- Modify: `src/app/features/preview/preview.component.html`
- Modify: `src/app/features/preview/preview.component.scss`

**Step 1: 從 header 移除尺寸 SelectButton**

保留 `SplitButton`，但主按鈕與 menu item 改成開 dialog。

**Step 2: 在 template 加入下載設定 dialog**

dialog 內容包含：

- 標題 `下載 PDF` / `下載 PNG`
- 尺寸 `SelectButton`
- `取消` / `下載` 按鈕

**Step 3: 補上 dialog 樣式**

新增簡潔的說明文字、選擇區塊與 footer 對齊樣式，延續目前預覽頁視覺。

**Step 4: 跑 PreviewComponent 測試**

Run: `npx vitest run src/app/features/preview/preview.component.spec.ts`

### Task 4: 全域驗證

**Files:**
- Modify: `src/app/features/preview/preview.component.ts`
- Modify: `src/app/features/preview/preview.component.html`
- Modify: `src/app/features/preview/preview.component.scss`
- Create: `src/app/features/preview/preview.component.spec.ts`

**Step 1: 跑全部測試**

Run: `npx vitest run`

**Step 2: 手動檢查**

1. 點 `下載 PDF`，確認先出現 dialog
2. 在 dialog 選 `800` 後下載，確認流程正常
3. 點 `下載 PNG`，確認先出現 dialog
4. 點 `下載 HTML`，確認直接下載，不出 dialog
5. 確認 header 已沒有尺寸切換控制
