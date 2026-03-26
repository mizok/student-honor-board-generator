# Template Style Settings Design

## Goal

為每個 template 提供兩類可編輯的視覺設定：

- 所有文字角色都可個別調整字體大小
- 每個 template 都有自己的完整主題色系可切換

設定入口保留在編輯內容 drawer 內，但實際操作收斂成獨立 dialog，避免編輯面板過度膨脹。

## Scope

本次先涵蓋：

- `exam-result`
- `class-ranking`

不包含：

- 自由輸入任意字級
- 跨 template 共用主題命名
- 匯入 / 匯出設定檔

## Requirements

### Font Settings

- 同一個 template 內，每個文字角色都可單獨調整
- UI 使用 `select`，不是 slider，也不是自由輸入
- 字級採固定數值級距，範圍以 `12` 到 `32` 為主
- 每個角色可以有自己的可選範圍，避免把小字撐壞版面
- 設定入口放在 drawer，但編輯本體在 dialog 內

### Theme Settings

- 每個 template 都有自己的主題集合
- 切換主題時，整套視覺一起改變
- 主題影響至少包含：
  - 背景
  - 邊框
  - 裝飾線
  - badge
  - 卡片底色
  - 文字色
  - 次要文字色
  - 強調卡片 / 強調區塊
- UI 採色票圓鈕 + 主題名稱 / 簡述

## Recommended Approach

採用「template 設定 registry + 共用 dialog + CSS variables 覆寫」。

原因：

- 各 template 的字角色與主題差異很大，不適合寫死在單一 component
- 把設定描述抽成 metadata 後，新 template 可以按同一套結構擴充
- 現有 template 多數樣式都集中在 SCSS，改成 CSS variables 的成本可控
- 共用 dialog 可以維持操作一致，同時避免 drawer 爆量

## Architecture

### 1. Template Settings Registry

新增一層 template 視覺設定描述，提供：

- `fontRoles`
  - 角色 id
  - 顯示名稱
  - 對應 CSS variable 名稱
  - 預設值
  - 可選數值列表
- `themes`
  - 主題 id
  - 名稱
  - 簡述
  - 色票預覽色
  - 對應 token map

這層 registry 讓 `edit-drawer`、dialog、template component 都能讀取相同定義，避免多份硬編。

### 2. Board Service State

`BoardService` 新增：

- 目前 template 的 `themeId`
- 目前 template 的 `fontSettings`
- 依 `templateId` 計算出的有效 registry
- 產生 template CSS variables 的 helper

切換 template 時，應自動套用該 template 的預設主題與預設字級。

### 3. Dialog-Based Editing

`EditDrawerComponent` 只保留兩個新入口：

- `字體設定`
- `主題設定`

兩者透過既有 `DialogService` 開啟：

- `template-font-settings-dialog`
- `template-theme-settings-dialog`

這樣 drawer 仍專注在資料內容，版型設定改在彈窗完成。

### 4. CSS Variable Application

每個 template 根元素計算一組 inline CSS variables，例如：

- `--template-board-title-size`
- `--template-card-name-size`
- `--template-section-line-color`
- `--template-card-head-bg`

SCSS 內原本寫死的字級與顏色改成 `var(...)`，保留 `rw(...)` 包裝方式或直接寫入最終 responsive 值，視現有結構選擇最小侵入方案。

## UI Design

### Font Settings Dialog

- 列表式呈現所有文字角色
- 每列顯示角色名稱與一個 `select`
- `select` 顯示數值級距，例如 `12 / 14 / 16 / 18 / 20 / 24 / 28 / 32`
- 不同角色可有不同選項集合
- 支援「重設此模板字級」
- 改值後即時套用 preview

### Theme Settings Dialog

- 以色票圓鈕呈現主題
- 每顆色票顯示主色 / 輔色視覺
- 旁邊顯示主題名稱與一句簡述
- 點選後即時套用 preview
- 支援「重設為預設主題」

## Template-Specific Theme Direction

### Exam Result

建議主題方向：

- `典雅金`
- `墨彩堂`
- `晨霧青`
- `珊瑚曦`

### Class Ranking

建議主題方向：

- `榮耀金`
- `玉石綠`
- `遠山藍`
- `杏桃橙`

命名可在實作前再微調，但結構上保留 template 專屬主題集合。

## Data Flow

1. 使用者在 drawer 點擊字體設定或主題設定
2. dialog 讀取目前 template 的 registry
3. 使用者變更選項
4. dialog 呼叫 `BoardService` 更新 `fontSettings` 或 `themeId`
5. template 根元素重新計算 CSS variables
6. preview 立即反映

## Error Handling

- 若某 template 尚未定義 registry，UI 不顯示設定入口
- 若 `themeId` 或 `fontRole` 資料不合法，回退到 template 預設值
- 若某角色缺少 CSS variable mapping，測試應直接失敗，不在 runtime 靜默吞掉

## Testing Strategy

### Unit Tests

- registry 預設值與完整性
- `BoardService` 在 template 切換時正確重設 / 套用設定
- dialog 互動後正確更新 service state

### Component Tests

- `EditDrawerComponent` 能依 template 顯示正確入口
- 字體設定 dialog 渲染所有角色與對應選項
- 主題設定 dialog 渲染色票並反映選中狀態

### Template Tests

- `exam-result` 根元素有吃到字級 / 主題 CSS variables
- `class-ranking` 根元素有吃到字級 / 主題 CSS variables

## Risks

- 現有 template 多數色彩與字級寫死在 SCSS，改 token 化時容易漏項
- 若角色切太細，dialog 項目數會變多，需做好分組與命名
- 主題數量過多時，必須控制色票與描述密度，避免 dialog 過於擁擠

## Rollout Order

1. 先建立 registry 與 service state
2. 再做兩個 dialog 與 drawer 入口
3. 最後逐一改 `exam-result`、`class-ranking` 的 CSS variable 套用
