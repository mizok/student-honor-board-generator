# Mobile PNG Share Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 手機端只提供 PNG 匯出，並透過系統分享 sheet 協助使用者直接儲存到照片。

**Architecture:** 在 `PreviewComponent` 判斷是否為手機端，手機只顯示單一 PNG 匯出按鈕並仍使用尺寸選擇 dialog。`ExportService` 抽出可重用的 PNG Blob 產生流程，提供分享與下載兩種輸出路徑，分享不可用時自動 fallback。

**Tech Stack:** Angular standalone components, PrimeNG, Web Share API, Vitest

---

### Task 1: Lock mobile UI behavior with failing tests

**Files:**
- Modify: `src/app/features/preview/preview.component.spec.ts`
- Modify: `src/app/features/preview/download-size-dialog/download-size-dialog.component.spec.ts`

**Step 1: Write the failing tests**

- 驗證手機端匯出選項只剩 PNG
- 驗證桌機端仍保留 `PDF / PNG / HTML`
- 驗證尺寸選項不再包含 `800`

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/app/features/preview/preview.component.spec.ts src/app/features/preview/download-size-dialog/download-size-dialog.component.spec.ts`
Expected: FAIL because current component still提供三種格式且含 `800`

**Step 3: Write minimal implementation**

- 調整 `PreviewComponent` 的尺寸 preset
- 新增手機端判斷與 export item 分流

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/app/features/preview/preview.component.spec.ts src/app/features/preview/download-size-dialog/download-size-dialog.component.spec.ts`
Expected: PASS

### Task 2: Lock mobile share behavior with failing tests

**Files:**
- Modify: `src/app/core/export.service.spec.ts`
- Modify: `src/app/features/preview/preview.component.spec.ts`

**Step 1: Write the failing tests**

- 驗證手機端 PNG 完成尺寸選擇後走分享流程
- 驗證分享不可用時 fallback 下載

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/app/core/export.service.spec.ts src/app/features/preview/preview.component.spec.ts`
Expected: FAIL because current service only支援下載

**Step 3: Write minimal implementation**

- 在 `ExportService` 抽出 PNG Blob 產生
- 新增分享方法，支援 share / fallback download
- `PreviewComponent` 在手機端下載 PNG 時呼叫分享路徑

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/app/core/export.service.spec.ts src/app/features/preview/preview.component.spec.ts`
Expected: PASS

### Task 3: Full verification

**Files:**
- Modify: none

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: PASS

**Step 2: Run build**

Run: `npm run build`
Expected: PASS with only existing warnings

**Step 3: Commit**

```bash
git add src/app/features/preview/preview.component.ts src/app/features/preview/preview.component.html src/app/features/preview/preview.component.spec.ts src/app/features/preview/download-size-dialog/download-size-dialog.component.spec.ts src/app/core/export.service.ts src/app/core/export.service.spec.ts docs/plans/2026-03-26-mobile-png-share-design.md docs/plans/2026-03-26-mobile-png-share.md
git commit -m "feat: share png exports on mobile"
```
