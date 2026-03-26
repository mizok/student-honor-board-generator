# Template Badge Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 建立可重用的 `template-badge` 元件，並以它取代班排模板內嵌的章節徽章實作。

**Architecture:** 以 `ng generate` 建立 standalone `template-badge` 元件，讓元件負責頭尾 SVG、中段延展區與色票變數。`class-ranking` 只保留版面佈局與文案，將徽章外觀完全交給共用元件處理。

**Tech Stack:** Angular standalone components, SCSS, Vitest

---

### Task 1: Lock the component strategy with failing tests

**Files:**
- Modify: `src/app/templates/class-ranking/class-ranking-board.component.spec.ts`
- Create: `src/app/templates/shared/template-badge/template-badge.component.spec.ts`

**Step 1: Write the failing tests**

- 驗證 `class-ranking` 改用 `<app-template-badge>`
- 驗證 `template-badge` 有 `start / body / end`
- 驗證元件樣式使用單一 `--badge-height`
- 驗證 SVG 採 `linearGradient`

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/app/templates/class-ranking/class-ranking-board.component.spec.ts src/app/templates/shared/template-badge/template-badge.component.spec.ts`
Expected: FAIL because component 尚未建立

**Step 3: Write minimal implementation**

- 用 `ng generate component` 建立 `template-badge`
- 實作元件 HTML / SCSS / API
- 將 `class-ranking` 改用新元件

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/app/templates/class-ranking/class-ranking-board.component.spec.ts src/app/templates/shared/template-badge/template-badge.component.spec.ts`
Expected: PASS

### Task 2: Verify no regressions

**Files:**
- Modify: none

**Step 1: Run full tests**

Run: `npx vitest run`
Expected: PASS

**Step 2: Run build**

Run: `npm run build`
Expected: PASS with only existing warnings

**Step 3: Commit**

```bash
git add src/app/templates/shared/template-badge src/app/templates/class-ranking/class-ranking-board.component.ts src/app/templates/class-ranking/class-ranking-board.component.html src/app/templates/class-ranking/class-ranking-board.component.scss src/app/templates/class-ranking/class-ranking-board.component.spec.ts docs/plans/2026-03-26-template-badge-design.md docs/plans/2026-03-26-template-badge.md
git commit -m "refactor: extract reusable template badge component"
```
