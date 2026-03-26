# Template Badge Seam Overlap Design

**Date:** 2026-03-27

## Goal

消除 `template-badge` 在 `html2canvas` 匯出時頭身尾交界處出現的接縫。

## Problem

即使頭尾與中身的漸層方向一致，三個相鄰圖層在 `html2canvas` rasterize 後仍可能在邊界產生 1px 級別的淡線。這是元素交界 anti-aliasing 的典型現象。

## Chosen Approach

- 保留既有 `template-badge` 結構
- 在中身 `.template-badge__body` 加上左右 `::before` / `::after`
- 偽元素使用與中身相同的垂直漸層
- 偽元素以絕對定位向左右微幅凸出，蓋住與頭尾 SVG 的接縫

## Why This Approach

- 改動最小，不必重做成單一 SVG 背景
- 可快速驗證是否足以遮住 `html2canvas` 的接縫
- 失敗成本低，之後仍可升級到單一 SVG 方案

## Impacted Files

- Modify: `src/app/templates/shared/template-badge/template-badge.component.scss`
- Modify: `src/app/templates/shared/template-badge/template-badge.component.spec.ts`

## Validation

- 測試鎖住 `--badge-seam-overlap`
- 測試鎖住 `.template-badge__body::before` / `::after`
- `npx vitest run src/app/templates/shared/template-badge/template-badge.component.spec.ts`
- `npx vitest run`
- `npm run build`
