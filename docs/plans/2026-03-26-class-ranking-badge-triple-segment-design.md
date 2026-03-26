# Class Ranking Badge Triple Segment Design

**Date:** 2026-03-26

## Goal

把班排模板的校排/班排徽章改成三段式結構，避免 `html2canvas` 在匯出時對斜角形狀產生缺角或接縫。

## Problem

`clip-path` 版本在匯出時缺角，改成 pseudo 元件斜角後又在底部出現接縫。問題核心是複雜 CSS 形狀在 `html2canvas` 上不穩定。

## Chosen Approach

- 徽章拆成三段：
  - 左頭：固定寬度 inline SVG
  - 中身：可延展的 CSS 背景區塊
  - 右尾：固定寬度 inline SVG
- 文字維持正常 HTML，讓寬度自然由內容決定
- 金色/綠色兩種配色仍由 modifier 控制

## Why This Approach

- 頭尾形狀固定，不會因拉伸而變形
- 中間只負責延展，內容越長徽章自然越長
- 對 `html2canvas` 比 `clip-path` 與 skew pseudo 元件更穩
- DOM 與樣式責任清楚，後續維護成本低

## Impacted Files

- Modify: `src/app/templates/class-ranking/class-ranking-board.component.html`
- Modify: `src/app/templates/class-ranking/class-ranking-board.component.scss`
- Modify: `src/app/templates/class-ranking/class-ranking-board.component.spec.ts`

## Validation

- 測試鎖住 badge 結構包含 `start / body / end`
- 測試鎖住樣式檔不再使用 `clip-path`
- `npx vitest run src/app/templates/class-ranking/class-ranking-board.component.spec.ts`
- `npx vitest run`
- `npm run build`
