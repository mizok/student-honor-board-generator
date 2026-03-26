# Preview Drawer Overlay Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 讓預覽頁右側編輯 drawer 開啟時只覆蓋內容，不再擠壓左側畫布。

**Architecture:** 保留 PrimeNG `p-drawer` 作為右側抽屜，刪除 preview 容器因 `drawerOpen` 切換而造成的 grid 重排。用 component 測試鎖住 template 不再綁定 `preview--drawer-open` 這個 layout class。

**Tech Stack:** Angular standalone components, PrimeNG Drawer, Vitest

---

### Task 1: Lock the behavior with a failing test

**Files:**
- Modify: `src/app/features/preview/preview.component.spec.ts`
- Test: `src/app/features/preview/preview.component.spec.ts`

**Step 1: Write the failing test**

新增測試，驗證 `PreviewComponent` template 不再綁定 `preview--drawer-open`，避免 drawer 開啟時讓外層 layout 重排。

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/features/preview/preview.component.spec.ts`
Expected: FAIL because current template still contains the class binding.

**Step 3: Write minimal implementation**

從 `preview.component.html` 移除 `preview--drawer-open` class binding，並清理 `preview.component.scss` 對該 modifier 的規則。

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/features/preview/preview.component.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/features/preview/preview.component.html src/app/features/preview/preview.component.scss src/app/features/preview/preview.component.spec.ts docs/plans/2026-03-26-preview-drawer-overlay-design.md docs/plans/2026-03-26-preview-drawer-overlay.md
git commit -m "fix: keep preview layout stable when drawer opens"
```

### Task 2: Verify no regressions

**Files:**
- Modify: none
- Test: `src/app/features/preview/preview.component.spec.ts`

**Step 1: Run focused tests**

Run: `npx vitest run src/app/features/preview/preview.component.spec.ts`
Expected: PASS

**Step 2: Run full tests**

Run: `npx vitest run`
Expected: PASS

**Step 3: Run build**

Run: `npm run build`
Expected: PASS with only existing warnings

**Step 4: Commit if needed**

如果驗證過程沒有額外修正，沿用上一個 commit；若有補修，另開一個最小 commit。
