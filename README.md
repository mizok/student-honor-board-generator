# 榮譽榜產生器

上傳填好的 Excel 資料，自動產生可匯出的精美榮譽榜。

**線上版本：** https://mizok.github.io/student-honor-board-generator/

---

## 使用方式

1. 選擇榮譽榜類型
2. 點「下載填寫範本」取得 `.xlsx` 範本
3. 照格式填入資料後存檔
4. 上傳填好的檔案（支援 `.xlsx`、`.xls`、`.csv`）
5. 預覽、編輯內容、調整欄數
6. 下載 PDF / PNG / HTML

---

## 目前支援的榜型

| ID | 名稱 | 說明 |
|----|------|------|
| `exam-result` | 大考成績榜 | 依科目列出學生與錄取學校 |
| `class-ranking` | 班排榮譽榜 | 依校排 / 班排名次分群列出學生 |

---

## 本地開發

```bash
npm install
npx nx serve web       # 前端 http://localhost:4200
```

> Worker（後端）已不再需要，所有解析在瀏覽器端完成。

---

## 新增 Template

使用內建的互動式 skill：

```
/add-template
```

Skill 會引導你完成需求收集、schema 定義、CSV 解析、Angular 元件、到 drawer 編輯支援的完整流程。

---

## 技術架構

| 層 | 技術 |
|----|------|
| 前端 | Angular 21（Zoneless Signals）+ PrimeNG |
| 樣式 | SCSS + BEM |
| 試算表解析 | SheetJS（瀏覽器端） |
| 型別共用 | `@honor/shared-types`（NX monorepo） |
| 部署 | GitHub Pages（GitHub Actions） |

---

## 專案結構

```
apps/
  web/                        # Angular 前端
    src/app/
      core/                   # BoardService、file-parser、template-xlsx-builder
      features/
        upload/               # 上傳頁面
        preview/              # 預覽 + 編輯 drawer
      templates/              # 各 template 的 board component
packages/
  shared-types/               # Zod schema、CSV 解析、template registry
.claude/skills/
  add-template/               # 新增 template 的互動式 skill
```
