# Template Style Settings Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 為 `exam-result` 與 `class-ranking` 提供可在編輯面板開啟的字體設定 dialog 與主題設定 dialog，並讓所有設定即時反映到預覽模板。

**Architecture:** 以 template 設定 registry 描述每個模板的字角色與主題 token，將使用者選擇存進 `BoardService` signals，再由 template 根元素輸出 CSS variables 覆寫既有 SCSS。UI 層只在 `EditDrawerComponent` 放兩個入口，實際編輯收斂到共用 dialog component。

**Tech Stack:** Angular standalone components, signals, PrimeNG dialog/button/select, Vitest, SCSS with CSS custom properties

---

### Task 1: 建立 Template Style Registry

**Files:**
- Create: `src/app/core/template-style-registry.ts`
- Test: `src/app/core/template-style-registry.spec.ts`

**Step 1: Write the failing test**

在 `src/app/core/template-style-registry.spec.ts` 建立測試，驗證：

- `exam-result` 有完整 `fontRoles`
- `class-ranking` 有完整 `fontRoles`
- 兩個 template 都有至少 3 個主題
- 每個 `fontRole` 都有 `cssVar`、`defaultValue`、`options`

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/core/template-style-registry.spec.ts`
Expected: FAIL with module not found or exported registry missing

**Step 3: Write minimal implementation**

在 `src/app/core/template-style-registry.ts` 定義：

- `TemplateFontRoleDefinition`
- `TemplateThemeDefinition`
- `TemplateStyleDefinition`
- `TEMPLATE_STYLE_REGISTRY`
- `getTemplateStyleDefinition(templateId)`

先填入 `exam-result` 與 `class-ranking` 的最小可用定義。

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/core/template-style-registry.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/core/template-style-registry.ts src/app/core/template-style-registry.spec.ts
git commit -m "feat: add template style registry"
```

### Task 2: 擴充 BoardService 的樣式設定狀態

**Files:**
- Modify: `src/app/core/board.service.ts`
- Test: `src/app/core/board.service.spec.ts`

**Step 1: Write the failing test**

在 `src/app/core/board.service.spec.ts` 增加測試，驗證：

- 初始化時會套用目前 template 的預設 `themeId`
- 初始化時會建立所有 `fontRoles` 的預設值
- 切換 template 時會重置到新 template 的預設樣式
- 可更新單一 font role 與 `themeId`

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/core/board.service.spec.ts`
Expected: FAIL with missing signals or wrong default behavior

**Step 3: Write minimal implementation**

在 `src/app/core/board.service.ts` 新增：

- `themeId`
- `fontSettings`
- `templateStyleDefinition`
- `resetTemplateStyleSettings()`
- `updateFontRole(roleId, value)`
- `updateTheme(themeId)`
- `templateStyleVars`

並在 template 切換流程內同步重設樣式設定。

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/core/board.service.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/core/board.service.ts src/app/core/board.service.spec.ts
git commit -m "feat: store template style settings in board service"
```

### Task 3: 建立字體設定 Dialog

**Files:**
- Create: `src/app/features/preview/template-font-settings-dialog/template-font-settings-dialog.component.ts`
- Create: `src/app/features/preview/template-font-settings-dialog/template-font-settings-dialog.component.html`
- Create: `src/app/features/preview/template-font-settings-dialog/template-font-settings-dialog.component.scss`
- Test: `src/app/features/preview/template-font-settings-dialog/template-font-settings-dialog.component.spec.ts`

**Step 1: Write the failing test**

在 spec 驗證：

- 會渲染目前 template 的所有 `fontRoles`
- 每個 role 都顯示數值 `select`
- 變更 select 會呼叫 `board.updateFontRole`
- 點擊重設會呼叫 `board.resetTemplateStyleSettings`

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/features/preview/template-font-settings-dialog/template-font-settings-dialog.component.spec.ts`
Expected: FAIL with component not found

**Step 3: Write minimal implementation**

使用 Angular CLI 建立 standalone component：

```bash
ng g c src/app/features/preview/template-font-settings-dialog --type component --standalone --skip-tests
```

在 component 內讀取 `BoardService` 的 `templateStyleDefinition` 與 `fontSettings`，渲染每個角色的數值選單。

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/features/preview/template-font-settings-dialog/template-font-settings-dialog.component.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/features/preview/template-font-settings-dialog
git commit -m "feat: add template font settings dialog"
```

### Task 4: 建立主題設定 Dialog

**Files:**
- Create: `src/app/features/preview/template-theme-settings-dialog/template-theme-settings-dialog.component.ts`
- Create: `src/app/features/preview/template-theme-settings-dialog/template-theme-settings-dialog.component.html`
- Create: `src/app/features/preview/template-theme-settings-dialog/template-theme-settings-dialog.component.scss`
- Test: `src/app/features/preview/template-theme-settings-dialog/template-theme-settings-dialog.component.spec.ts`

**Step 1: Write the failing test**

在 spec 驗證：

- 會渲染目前 template 的主題列表
- 每個主題有色票、名稱與描述
- 點擊主題會呼叫 `board.updateTheme`
- 點擊重設會回到 template 預設主題

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/features/preview/template-theme-settings-dialog/template-theme-settings-dialog.component.spec.ts`
Expected: FAIL with component not found

**Step 3: Write minimal implementation**

使用 Angular CLI 建立 standalone component：

```bash
ng g c src/app/features/preview/template-theme-settings-dialog --type component --standalone --skip-tests
```

用色票圓鈕呈現 template 專屬主題，選取時即時更新 `BoardService`。

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/features/preview/template-theme-settings-dialog/template-theme-settings-dialog.component.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/features/preview/template-theme-settings-dialog
git commit -m "feat: add template theme settings dialog"
```

### Task 5: 將兩個設定入口接到 Edit Drawer

**Files:**
- Modify: `src/app/features/preview/edit-drawer/edit-drawer.component.ts`
- Modify: `src/app/features/preview/edit-drawer/edit-drawer.component.html`
- Modify: `src/app/features/preview/edit-drawer/edit-drawer.component.scss`
- Test: `src/app/features/preview/edit-drawer/edit-drawer.component.spec.ts`

**Step 1: Write the failing test**

在 `edit-drawer` spec 驗證：

- 若目前 template 有 style registry，顯示「字體設定」與「主題設定」入口
- 點擊入口會呼叫 `DialogService.open`
- dialog data 含目前 template 所需資訊

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/features/preview/edit-drawer/edit-drawer.component.spec.ts`
Expected: FAIL with missing buttons or missing dialog calls

**Step 3: Write minimal implementation**

在 drawer 基本資訊區塊加入兩個設定按鈕，透過 `DialogService` 開啟對應 dialog component。

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/features/preview/edit-drawer/edit-drawer.component.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/features/preview/edit-drawer
git commit -m "feat: add style setting entry points to edit drawer"
```

### Task 6: 套用 Exam Result 的字級與主題變數

**Files:**
- Modify: `src/app/templates/exam-result/exam-result-board.component.ts`
- Modify: `src/app/templates/exam-result/exam-result-board.component.html`
- Modify: `src/app/templates/exam-result/exam-result-board.component.scss`
- Test: `src/app/templates/exam-result/exam-result-board.component.spec.ts`

**Step 1: Write the failing test**

在 spec 驗證：

- 根元素會輸出 `board.templateStyleVars` 對應的 CSS variables
- 主標、裝飾文字、卡片姓名等使用對應變數
- 主題切換時關鍵 token 有改變

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/templates/exam-result/exam-result-board.component.spec.ts`
Expected: FAIL with missing style bindings or unchanged variables

**Step 3: Write minimal implementation**

在 root element 綁定 style map，將現有硬編字級與色彩改成對應 `var(--template-...)`。

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/templates/exam-result/exam-result-board.component.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/templates/exam-result
git commit -m "feat: theme and font settings for exam result template"
```

### Task 7: 套用 Class Ranking 的字級與主題變數

**Files:**
- Modify: `src/app/templates/class-ranking/class-ranking-board.component.ts`
- Modify: `src/app/templates/class-ranking/class-ranking-board.component.html`
- Modify: `src/app/templates/class-ranking/class-ranking-board.component.scss`
- Modify: `src/app/templates/shared/template-badge/template-badge.component.ts`
- Modify: `src/app/templates/shared/template-badge/template-badge.component.html`
- Modify: `src/app/templates/shared/template-badge/template-badge.component.scss`
- Test: `src/app/templates/class-ranking/class-ranking-board.component.spec.ts`
- Test: `src/app/templates/shared/template-badge/template-badge.component.spec.ts`

**Step 1: Write the failing test**

在 spec 驗證：

- `class-ranking` 根元素會輸出 CSS variables
- 區塊線條、卡片 head、卡片 class pill、badge 都會跟著主題改變
- 區塊標題、英文字副標、卡片姓名等會跟著字級設定改變

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/templates/class-ranking/class-ranking-board.component.spec.ts src/app/templates/shared/template-badge/template-badge.component.spec.ts`
Expected: FAIL with missing style bindings or unchanged badge tokens

**Step 3: Write minimal implementation**

將 `class-ranking` 與 `template-badge` 的關鍵色彩與字級改為 CSS variables，確保 badge 也能吃 template 主題 token。

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/templates/class-ranking/class-ranking-board.component.spec.ts src/app/templates/shared/template-badge/template-badge.component.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/templates/class-ranking src/app/templates/shared/template-badge
git commit -m "feat: theme and font settings for class ranking template"
```

### Task 8: 整合驗證

**Files:**
- Modify: `src/app/features/preview/preview.component.spec.ts`
- Modify: `src/app/features/preview/edit-drawer/edit-drawer.component.spec.ts`

**Step 1: Write the failing test**

補整合測試，驗證：

- 使用者從 drawer 開啟設定 dialog
- 改字級 / 主題後 preview state 更新
- 關閉 dialog 後設定仍保留

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/features/preview/preview.component.spec.ts src/app/features/preview/edit-drawer/edit-drawer.component.spec.ts`
Expected: FAIL with missing integration behavior

**Step 3: Write minimal implementation**

補齊 dialog open data、state sync 與必要 template binding，使整條互動鏈完成。

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/features/preview/preview.component.spec.ts src/app/features/preview/edit-drawer/edit-drawer.component.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/features/preview
git commit -m "test: cover template style settings flow"
```

### Task 9: 全量驗證

**Files:**
- Modify: `docs/plans/2026-03-27-template-style-settings.md`

**Step 1: Run focused test suite**

Run:

```bash
npx vitest run \
  src/app/core/template-style-registry.spec.ts \
  src/app/core/board.service.spec.ts \
  src/app/features/preview/template-font-settings-dialog/template-font-settings-dialog.component.spec.ts \
  src/app/features/preview/template-theme-settings-dialog/template-theme-settings-dialog.component.spec.ts \
  src/app/features/preview/edit-drawer/edit-drawer.component.spec.ts \
  src/app/templates/exam-result/exam-result-board.component.spec.ts \
  src/app/templates/class-ranking/class-ranking-board.component.spec.ts \
  src/app/templates/shared/template-badge/template-badge.component.spec.ts
```

Expected: PASS

**Step 2: Run full verification**

Run:

```bash
npx vitest run
npm run build
```

Expected: PASS with only pre-existing warnings

**Step 3: Commit**

```bash
git add docs/plans/2026-03-27-template-style-settings.md
git commit -m "docs: finalize template style settings plan"
```
