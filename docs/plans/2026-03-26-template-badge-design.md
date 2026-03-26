# Template Badge Design

**Date:** 2026-03-26

## Goal

建立可重用的 `template-badge` 元件，提供頭尾 SVG + 中段延展的徽章結構，並修正目前班排模板 badge 的 subpixel 高度誤差與頭尾缺少漸層問題。

## Problem

目前班排模板直接在自身 HTML / SCSS 內實作三段式徽章，但仍有兩個問題：

- 頭尾與中身是獨立盒子，尺寸來自多個 `rw(...)`，容易在匯出與某些寬度下出現 subpixel rounding 誤差
- 頭尾 SVG 使用單色 fill，中身使用 CSS gradient，視覺無法完全接續

## Chosen Approach

- 新增 `src/app/templates/shared/template-badge/` 共用元件
- 元件 API 先收：
  - `label`
  - `tone: 'gold' | 'green'`
  - `minWidth`
- 元件內部採單一高度變數 `--badge-height`
- 左右 SVG 與中身都使用同一組色票變數，SVG 內建 `linearGradient`
- 文字仍維持 HTML，讓徽章寬度自然跟內容延展

## Why This Approach

- 先解決目前渲染正確性問題，再抽出共用能力
- API 保持小而穩，不做過度泛化
- 後續其他模板若要用，只需重用元件與 tone

## Impacted Files

- Create: `src/app/templates/shared/template-badge/template-badge.component.ts`
- Create: `src/app/templates/shared/template-badge/template-badge.component.html`
- Create: `src/app/templates/shared/template-badge/template-badge.component.scss`
- Create: `src/app/templates/shared/template-badge/template-badge.component.spec.ts`
- Modify: `src/app/templates/class-ranking/class-ranking-board.component.ts`
- Modify: `src/app/templates/class-ranking/class-ranking-board.component.html`
- Modify: `src/app/templates/class-ranking/class-ranking-board.component.scss`
- Modify: `src/app/templates/class-ranking/class-ranking-board.component.spec.ts`

## Validation

- 測試鎖住 `template-badge` 結構與 tone
- 測試鎖住單一高度變數與 SVG gradient 設計
- 測試鎖住 `class-ranking` 改為使用共用元件
- `npx vitest run`
- `npm run build`
