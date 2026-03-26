---
name: add-template
description: 互動式新增榮譽榜 template 的完整流程。從需求收集到所有檔案產出，確保每個 template 都有完整的 schema、CSV 解析、Angular 展示元件、與 drawer 編輯支援。
---

# 新增榮譽榜 Template

你是這個專案的 template 工程師。每次新增 template，必須完成以下七個模組，缺一不可。

---

## Phase 0 — 需求收集（互動，勿跳過）

在動工之前，**先向使用者收集以下資料**：

### 0-A 必問
1. **榜名** — 這個 template 叫什麼？（例：「個人操行榜」、「閱讀榮譽榜」）
2. **資料欄位** — 每筆資料有哪些欄位？（例：姓名、班級、書名、頁數）
3. **分組方式** — 資料要怎麼分群顯示？（例：依科目、依名次、依班級、不分群）

### 0-B 選問（若有就問，沒有也可以繼續）
4. **視覺參考** — 請使用者提供截圖、手繪草稿、或任何參考圖片
5. **配色偏好** — 有沒有指定顏色？（例：紅色系、學校校色）
6. **現有 template 參考** — 比較像 `exam-result`（卡片格狀）還是 `class-ranking`（依名次分群）？

### 0-C 歸納確認
收集完畢後，輸出一份摘要讓使用者確認，格式如下：

```
Template ID   : <kebab-case>
標題          : <中文名稱>
資料欄位      : <欄位1>、<欄位2>...
分組邏輯      : <說明>
視覺風格      : <說明或「參考 exam-result / class-ranking」>
```

**等使用者確認後再進入 Phase 1。**

---

## Phase 1 — Schema（`src/app/core/templates`）

### 1-A 建立 schema 檔

路徑：`src/app/core/templates/<id>/schema.ts`

規則：
- 頂層物件**必須**包含 `title: z.string()` 和 `subtitle: z.string().default('')`
- 資料陣列欄位命名用複數，例如 `students`、`entries`、`rankings`
- 數字欄位（如名次）用 `z.number().int().positive()`，其餘用 `z.string()`
- 匯出 `Zod infer` 型別供 TypeScript 使用

範例結構：
```ts
import { z } from 'zod'

export const <camel>ItemSchema = z.object({
  // 每筆資料的欄位
})

export const <camel>Schema = z.object({
  title: z.string(),
  subtitle: z.string().default(''),
  <items>: z.array(<camel>ItemSchema),
})

export type <Camel>Item = z.infer<typeof <camel>ItemSchema>
export type <Camel>Data = z.infer<typeof <camel>Schema>
```

### 1-B 更新 `src/app/core/templates/index.ts`

在最後加一行：
```ts
export * from './<id>/schema'
```

---

## Phase 2 — CSV 範本與解析（`src/app/core/templates`）

路徑：`src/app/core/templates/<id>/parseCsv.ts`

### 2-A CSV 格式設計原則
- 前兩列固定為 metadata：
  ```
  title,在此填入榮譽榜標題
  subtitle,副標題（選填，可留空）
  ```
- 第三列為欄位標題（用英文 key，和 schema 欄位名稱一致）
- 第四列起為資料

### 2-B parseCsv 解析邏輯
```ts
export function parse<Camel>Csv(rows: string[][]): <Camel>Data {
  let title = ''
  let subtitle = ''
  const items: <Camel>Data['<items>'] = []

  for (const row of rows) {
    if (!row.length || row.every(c => c.trim() === '')) continue
    const key = row[0]?.trim().toLowerCase()

    if (key === 'title' || key === '榮譽榜標題') { title = row[1]?.trim() ?? ''; continue }
    if (key === 'subtitle' || key === '副標題（選填）') { subtitle = row[1]?.trim() ?? ''; continue }
    // 跳過標題列：key 為欄位名稱或以欄位名稱開頭（因 xlsx 範本會在同一格加 hint）
    if (key === '<firstColKey>' || key.startsWith('<firstColLabel>')) continue

    // 取各欄位值
    const <field1> = row[0]?.trim() ?? ''
    const <field2> = row[1]?.trim() ?? ''
    // ...
    if (!<requiredField>) continue   // 跳過空白列
    items.push({ <field1>, <field2>, ... })
  }

  return { title, subtitle, <items>: items }
}
```

### 2-C csvTemplate 字串
作為範本下載備用，與 parseCsv 格式一致。

---

## Phase 3 — 註冊至 Registry（`src/app/core/templates`）

路徑：`src/app/core/templates/registry.ts`

### 3-A import 新 template
```ts
import { <camel>Schema } from './<id>/schema'
import { <camel>CsvTemplate, parse<Camel>Csv } from './<id>/parseCsv'
```

### 3-B 加入 TEMPLATE_REGISTRY
```ts
'<id>': {
  id: '<id>',
  label: '<中文名稱>',
  schema: <camel>Schema,
  csvTemplate: <camel>CsvTemplate,
  parseCsv: parse<Camel>Csv,
  columns: [
    { key: '<key>', label: '<中文>', hint: '<說明>', example: '<範例值>' },
    // 每個資料欄位都要有一筆
  ],
  exampleRows: [
    { <key1>: '<val>', <key2>: '<val>', ... },
    // 至少 2 筆範例資料
  ],
},
```

> `columns` 用於 `buildTemplateXlsx()` 自動產生 xlsx 範本，**必須完整填寫**。

---

## Phase 4 — Angular Board Component（`src/app/templates`）

路徑：`src/app/templates/<id>/`

### 4-A TypeScript（`<id>-board.component.ts`）

固定模板：
```ts
import { Component, computed, input } from '@angular/core'
import { CommonModule } from '@angular/common'
import type { <Camel>Data } from '@honor/shared-types'

@Component({
  selector: 'app-<id>-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './<id>-board.component.html',
  styleUrl: './<id>-board.component.scss',
})
export class <Camel>BoardComponent {
  readonly data = input.required<<Camel>Data>()
  readonly columns = input<number>(4)

  protected readonly gridStyle = computed(() => ({
    'grid-template-columns': `repeat(${this.columns()}, 1fr)`,
  }))

  // 加入任何需要的 computed（例如分組邏輯）
}
```

### 4-B HTML（`<id>-board.component.html`）

必須包含的區塊：
1. **Header**：顯示 `data().title` 和 `data().subtitle`
2. **主要內容區**：帶有 `[ngStyle]="gridStyle()"` 的 grid 容器
3. **Footer**（選用）：通常重複標題

HTML 風格參考 `exam-result`（卡片格狀）或 `class-ranking`（名次分群），視 0-B 的答案決定。

### 4-C SCSS（`<id>-board.component.scss`）

必須定義：
- `.board` 根容器：固定寬度、背景色、padding
- `.board__header`：標題區
- `.board__grid` 或 `.board__cards`：**不可**在 SCSS 寫死 `grid-template-columns`，交由 `[ngStyle]` 控制
- `.card`：單一資料卡片樣式

---

## Phase 5 — 接入 Template Outlet

路徑：`src/app/templates/template-outlet.component.ts`

### 5-A import
```ts
import { <Camel>BoardComponent } from './<id>/<id>-board.component'
```

### 5-B 加入 imports 陣列
在 `imports: [...]` 加入 `<Camel>BoardComponent`

### 5-C 加入 template switch case
```html
@case ('<id>') {
  <app-<id>-board [data]="$any(data())" [columns]="columns()" />
}
```

---

## Phase 6 — Edit Drawer 支援

路徑：`src/app/features/preview/edit-drawer/`

### 6-A `edit-drawer.component.ts`

加入：
1. `is<Camel>` computed：
   ```ts
   protected readonly is<Camel> = computed(() => this.board.templateId() === '<id>')
   ```
2. `<camel>Data` computed：
   ```ts
   protected readonly <camel>Data = computed(() =>
     this.is<Camel>() ? (this.board.parsedData() as <Camel>Data) : null
   )
   ```
3. `saveEdit` 方法中加入對應 template 的 update 邏輯
4. `deleteEntry` 方法中加入對應的 filter 邏輯
5. `addEntry` 方法中加入對應的空白項目 push 邏輯

### 6-B `edit-drawer.component.html`

在現有 template block 後加入新的 `@if` 區段：

```html
<!-- <中文名稱> mode -->
@if (is<Camel>() && <camel>Data(); as data) {
  <div class="drawer__section">
    <div class="drawer__section-title"><資料陣列中文名></div>
    @for (item of data.<items>; track $index) {
      <div class="drawer__chip-row">
        @if (editingIndex()?.section === '<items>' && editingIndex()?.index === $index) {
          <div class="drawer__inline-edit">
            <!-- 每個可編輯欄位一個 input -->
            <input pInputText [(ngModel)]="editBuffer()['<field>']" placeholder="<中文>" />
            <p-button label="儲存" size="small" (onClick)="saveEdit()" />
          </div>
        } @else {
          <p-chip
            [label]="<顯示邏輯，如 item.name + ' · ' + item.field>"
            [removable]="true"
            (onRemove)="deleteEntry('<items>', $index)"
            (onClick)="startEdit('<items>', $index, $any(item))"
            styleClass="drawer__chip"
          />
        }
      </div>
    }
    <p-button
      label="＋ 新增"
      size="small"
      severity="secondary"
      (onClick)="addEntry('<items>')"
      styleClass="drawer__add"
    />
  </div>
}
```

---

## Phase 7 — 驗收清單

完成所有 phase 後，逐一確認：

- [ ] `schema.ts`：`title`、`subtitle` 存在；型別都有 export
- [ ] `parseCsv.ts`：空白列、title/subtitle 列、header 列都有跳過；必填欄位有 guard
- [ ] `registry.ts`：`columns` 每個欄位都有 `key`、`label`、`hint`、`example`；`exampleRows` 至少 2 筆
- [ ] `index.ts`：已 export 新 schema
- [ ] Board component：`columns` input 存在；grid 容器使用 `[ngStyle]`，不寫死欄數
- [ ] Template outlet：import 正確；switch case 已加入
- [ ] Edit drawer：三個方法（`saveEdit`、`deleteEntry`、`addEntry`）都有處理新 template；HTML 有對應 section

全部打勾後，告知使用者：**「新 template 已完成，可執行 `npm run dev` 確認。」**

---

## 附錄 A — 檔案位置速查

| 用途 | 路徑 |
|------|------|
| Schema | `src/app/core/templates/<id>/schema.ts` |
| CSV 解析 | `src/app/core/templates/<id>/parseCsv.ts` |
| Registry | `src/app/core/templates/registry.ts` |
| Shared index | `src/app/core/templates/index.ts` |
| Board TS | `src/app/templates/<id>/<id>-board.component.ts` |
| Board HTML | `src/app/templates/<id>/<id>-board.component.html` |
| Board SCSS | `src/app/templates/<id>/<id>-board.component.scss` |
| Template outlet | `src/app/templates/template-outlet.component.ts` |
| Edit drawer TS | `src/app/features/preview/edit-drawer/edit-drawer.component.ts` |
| Edit drawer HTML | `src/app/features/preview/edit-drawer/edit-drawer.component.html` |

## 附錄 B — 重要設計約束

1. **不使用 LLM 解析** — 所有解析在瀏覽器端完成，不呼叫任何 AI API
2. **欄數由外部控制** — board component 不寫死 grid 欄數，全靠 `columns` input + `[ngStyle]`
3. **parseCsv 同時相容 CSV 和 xlsx 輸入** — xlsx 的 header cell 會附帶 hint（`科目\n如：英文`），用 `key.startsWith('<label>')` 跳過
4. **Angular 21 Zoneless** — 使用 Signals（`input()`、`computed()`、`signal()`），勿使用 `ngOnChanges` 或 `@Input()` decorator
