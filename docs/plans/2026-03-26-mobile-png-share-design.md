# Mobile PNG Share Design

**Date:** 2026-03-26

## Goal

手機端只提供 PNG 匯出，並優先透過系統分享 sheet 讓使用者儲存到照片；同時移除 `800` 匯出寬度，避免手機上容易失敗的 preset。

## Current Problems

- 手機端目前沿用桌機下載流程，提供 `PDF / PNG / HTML`
- `800` 匯出寬度在手機上容易失敗
- `<a download>` 在手機瀏覽器上的體驗不穩定，對圖片而言也不如系統分享自然

## Chosen Approach

- 桌機維持現有 `PDF / PNG / HTML`
- 手機端 toolbar 只保留單一 `PNG` 匯出入口
- 手機端點擊後仍先選尺寸，但尺寸僅提供 `1024 / 1280 / 1920`
- 產出 PNG 檔後，若瀏覽器支援 `navigator.canShare()` / `navigator.share()` 的檔案分享，則開系統分享 sheet
- 若不支援檔案分享，fallback 回既有下載流程

## Why This Approach

- 最符合「存到照片」的使用者目標
- 避免手機端顯示不必要的 `PDF / HTML`
- 不破壞桌機既有匯出行為
- `800` 移除後，直接避開已知不穩定尺寸

## Impacted Files

- Modify: `src/app/features/preview/preview.component.ts`
- Modify: `src/app/features/preview/preview.component.html`
- Modify: `src/app/features/preview/preview.component.spec.ts`
- Modify: `src/app/features/preview/download-size-dialog/download-size-dialog.component.spec.ts`
- Modify: `src/app/core/export.service.ts`
- Modify: `src/app/core/export.service.spec.ts`

## Validation

- 測試手機端只保留 PNG 入口
- 測試尺寸選項不再包含 `800`
- 測試手機端 PNG 優先走 share，失敗時 fallback 下載
- `npx vitest run`
- `npm run build`
