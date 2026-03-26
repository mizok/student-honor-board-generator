# Class Ranking Badge Export Compatibility Design

**Date:** 2026-03-26

## Goal

讓班排/校排區塊標籤在 `html2canvas` 匯出時能穩定呈現，不再依賴 `clip-path`。

## Problem

目前 [class-ranking-board.component.scss](/Users/mizokhuangmbp2023/Desktop/Workspace/student-honor-board-generator/src/app/templates/class-ranking/class-ranking-board.component.scss) 的 `.board__section-badge` 使用 `clip-path: polygon(...)` 做左右斜角徽章。瀏覽器預覽正常，但 `html2canvas` 對 `clip-path` 支援不完整，導致匯出 PNG/PDF 時左側斜角被錯誤渲染。

## Chosen Approach

- 移除 `clip-path`
- 保留 `.board__section-badge` 作為中央主體
- 使用 `::before` / `::after` 生成左右斜角延伸片
- 透過 modifier 保留金色/綠色兩種配色

## Why This Approach

- 改動只集中在班排模板 SCSS
- 不影響既有資料結構、template DOM、匯出流程
- 比 `clip-path` 更符合 `html2canvas` 能穩定處理的 CSS 範圍

## Impacted Files

- Modify: `src/app/templates/class-ranking/class-ranking-board.component.scss`
- Add: `src/app/templates/class-ranking/class-ranking-board.component.spec.ts`

## Validation

- 測試鎖住樣式檔不再出現 `clip-path`
- 測試鎖住改用 `::before` / `::after` 做斜角
- `npx vitest run src/app/templates/class-ranking/class-ranking-board.component.spec.ts`
- `npx vitest run`
- `npm run build`
