# Preview Drawer Overlay Design

**Date:** 2026-03-26

## Goal

讓編輯內容 drawer 在桌機與手機上都以右側覆蓋方式開啟，不再擠壓左側預覽內容。

## Current Problem

目前 [preview.component.scss](/Users/mizokhuangmbp2023/Desktop/Workspace/student-honor-board-generator/src/app/features/preview/preview.component.scss) 會在 `drawerOpen` 時把 `.preview` 從單欄 grid 切成 `1fr 360px`。雖然 `p-drawer` 本身已經是右側抽屜，但外層 grid 也一起變寬，導致左側畫布被擠壓、重排，和使用者預期不符。

## Chosen Approach

採用最小改動方案：

- 保留 PrimeNG `p-drawer`
- 移除 `.preview--drawer-open` 對 grid 欄位的影響
- 讓 drawer 單純作為 overlay 顯示在右側
- 桌機與手機行為統一，不再有「桌機推擠、手機覆蓋」的差異

## Why This Approach

- 改動面最小，不需要重寫 drawer 行為
- 不影響既有編輯表單、拖拉排序、對話框邏輯
- 版面穩定，預覽區尺寸不因 drawer 狀態而變化

## Impacted Files

- Modify: `src/app/features/preview/preview.component.html`
- Modify: `src/app/features/preview/preview.component.scss`
- Modify: `src/app/features/preview/preview.component.spec.ts`

## Validation

- 測試確認 preview root 不再依 `drawerOpen` 套用會造成 layout shift 的 class
- 既有下載 dialog / HTML 下載測試維持通過
- `npx vitest run`
- `npm run build`
