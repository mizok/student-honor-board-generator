# Template Badge Seam Overlap Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 用中身偽元素的漸層 overlap 遮掉 `template-badge` 與頭尾 SVG 之間的匯出接縫。

**Architecture:** 保留 `template-badge` 目前的 DOM 與 API，只在 SCSS 增加一個 overlap 變數與 body pseudo 元件，讓同色漸層向兩側延伸微量覆蓋頭尾交界。

**Tech Stack:** Angular standalone components, SCSS, Vitest

---

### Task 1: Lock the overlap strategy with a failing test

**Files:**
- Modify: `src/app/templates/shared/template-badge/template-badge.component.spec.ts`
- Test: `src/app/templates/shared/template-badge/template-badge.component.spec.ts`

**Step 1: Write the failing test**

- 驗證樣式含 `--badge-seam-overlap`
- 驗證 `.template-badge__body` 使用 `::before` / `::after`

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/templates/shared/template-badge/template-badge.component.spec.ts`
Expected: FAIL because current SCSS 尚未有 seam overlap

**Step 3: Write minimal implementation**

- 在 SCSS 新增 overlap 變數
- 為 body 新增左右 pseudo 元件並套用同漸層

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/templates/shared/template-badge/template-badge.component.spec.ts`
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
