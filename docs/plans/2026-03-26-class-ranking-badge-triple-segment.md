# Class Ranking Badge Triple Segment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 將班排模板的章節徽章改成頭尾 SVG + 中段延展的三段式結構，提升匯出穩定性。

**Architecture:** 只修改班排模板的 badge DOM 與 SCSS，不碰資料模型與匯出 service。HTML 會新增左右固定 SVG 與中段標籤容器，SCSS 負責對齊與雙色主題。

**Tech Stack:** Angular standalone templates, SCSS, Vitest

---

### Task 1: Lock the triple-segment structure with a failing test

**Files:**
- Modify: `src/app/templates/class-ranking/class-ranking-board.component.spec.ts`
- Test: `src/app/templates/class-ranking/class-ranking-board.component.spec.ts`

**Step 1: Write the failing test**

- 驗證 template 含有 `badge__start / badge__body / badge__end`
- 驗證樣式檔不再出現 `clip-path`

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/templates/class-ranking/class-ranking-board.component.spec.ts`
Expected: FAIL because current badge 結構尚未拆段

**Step 3: Write minimal implementation**

- 更新 HTML 為三段式 badge
- 更新 SCSS 對齊與配色

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
git add src/app/templates/class-ranking/class-ranking-board.component.html src/app/templates/class-ranking/class-ranking-board.component.scss src/app/templates/class-ranking/class-ranking-board.component.spec.ts docs/plans/2026-03-26-class-ranking-badge-triple-segment-design.md docs/plans/2026-03-26-class-ranking-badge-triple-segment.md
git commit -m "fix: use triple segment badges for class ranking"
```
