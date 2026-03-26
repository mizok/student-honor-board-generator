# Class Ranking Badge Export Compatibility Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 讓班排模板的校排/班排徽章在匯出時不再因 `clip-path` 而缺角。

**Architecture:** 只調整 `class-ranking-board.component.scss` 的徽章實作，將 `clip-path` 改為中央主體搭配左右 pseudo 元件斜角。用一個小型檔案字串測試鎖住樣式策略，避免未來又回到 `clip-path`。

**Tech Stack:** Angular standalone components, SCSS, Vitest

---

### Task 1: Lock the styling strategy with a failing test

**Files:**
- Add: `src/app/templates/class-ranking/class-ranking-board.component.spec.ts`
- Test: `src/app/templates/class-ranking/class-ranking-board.component.spec.ts`

**Step 1: Write the failing test**

- 驗證樣式檔不再使用 `clip-path`
- 驗證 `.board__section-badge` 使用 `::before` / `::after`

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/templates/class-ranking/class-ranking-board.component.spec.ts`
Expected: FAIL because current SCSS still uses `clip-path`

**Step 3: Write minimal implementation**

在 `class-ranking-board.component.scss` 將 `clip-path` 替換成 pseudo 元件斜角，保留現有配色與尺寸感。

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/templates/class-ranking/class-ranking-board.component.spec.ts`
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
git add src/app/templates/class-ranking/class-ranking-board.component.scss src/app/templates/class-ranking/class-ranking-board.component.spec.ts docs/plans/2026-03-26-class-ranking-badge-export-compat-design.md docs/plans/2026-03-26-class-ranking-badge-export-compat.md
git commit -m "fix: avoid clip-path in class ranking badges"
```
