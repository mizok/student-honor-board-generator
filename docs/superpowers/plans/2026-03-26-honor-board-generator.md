# Honor Board Generator Implementation Plan

> **For agentic workers:** 實作時優先使用 **Codex MCP** (`mcp__codex-cli__codex`) 執行每個 Task，搭配 `fullAuto: true`、`sandbox: "workspace-write"`、`workingDirectory` 指向專案根目錄。每個 Task 委派一個 Codex session，完成後由 Claude 審查，再進下一個 Task。

**Goal:** Build a web tool for a non-technical cram school director to upload CSV/Excel data, have Gemini AI parse it into structured JSON, preview a full-screen honor board, lightly edit entries, and download as HTML/PDF/PNG.

**Architecture:** NX monorepo with Angular 21 frontend (Cloudflare Pages) and Hono Worker (Cloudflare Workers). Template system uses a registry pattern — each template is a self-contained unit (Zod schema + Gemini prompt + Angular component) so new templates can be added without touching existing code.

**Tech Stack:** Angular 21 + Signals, PrimeNG 21, Hono, Cloudflare Workers, SheetJS (xlsx), Gemini API (@google/generative-ai), html2canvas, jsPDF, Zod, NX, Vitest

**Spec:** `docs/superpowers/specs/2026-03-26-honor-board-generator-design.md`

---

## File Map

```
student-honor-board-generator/
├── package.json                                      # root NX workspace
├── nx.json
├── tsconfig.base.json                               # path aliases: @honor/shared-types
├── angular.json                                     # Angular project config (web app)
├── .gitignore
├── CLAUDE.md                                        # project coding conventions
│
├── packages/
│   └── shared-types/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts                             # barrel export
│           ├── api.ts                               # ParseRequest / ParseResponse types
│           └── templates/
│               ├── registry.ts                      # TEMPLATE_REGISTRY + TemplateDefinition
│               ├── exam-result/
│               │   ├── schema.ts                    # Zod schema + ExamResultData type
│               │   └── prompt.ts                    # Gemini prompt string
│               └── class-ranking/
│                   ├── schema.ts                    # Zod schema + ClassRankingData type
│                   └── prompt.ts
│
├── apps/
│   ├── worker/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── wrangler.toml
│   │   ├── .dev.vars.example                       # GEMINI_API_KEY=
│   │   └── src/
│   │       ├── index.ts                            # Hono app entry, CORS, routes
│   │       ├── routes/
│   │       │   └── parse.ts                        # POST /api/parse handler
│   │       └── lib/
│   │           ├── file-parser.ts                  # base64 → CSV (SheetJS)
│   │           └── gemini.ts                       # Gemini API call wrapper
│   │
│   └── web/
│       ├── tsconfig.json
│       ├── tsconfig.app.json
│       ├── tsconfig.spec.json
│       ├── project.json                            # NX project config
│       └── src/
│           ├── index.html
│           ├── main.ts
│           ├── styles.scss                         # Google Fonts + PrimeNG theme + global tokens
│           ├── environments/
│           │   ├── environment.ts                  # WORKER_URL = http://localhost:8787
│           │   └── environment.production.ts       # WORKER_URL = https://...workers.dev
│           └── app/
│               ├── app.config.ts                   # provideHttpClient, provideRouter, provideAnimations
│               ├── app.routes.ts                   # single route → AppComponent
│               ├── app.component.ts                # root shell (upload or preview state)
│               ├── app.component.html
│               ├── app.component.scss
│               │
│               ├── core/
│               │   ├── board.service.ts            # Signals state machine + API calls
│               │   └── export.service.ts           # downloadHtml / downloadPdf / downloadPng
│               │
│               ├── features/
│               │   ├── upload/
│               │   │   ├── upload.component.ts
│               │   │   ├── upload.component.html
│               │   │   └── upload.component.scss
│               │   └── preview/
│               │       ├── preview.component.ts    # toolbar + grid layout
│               │       ├── preview.component.html
│               │       ├── preview.component.scss
│               │       └── edit-drawer/
│               │           ├── edit-drawer.component.ts
│               │           ├── edit-drawer.component.html
│               │           └── edit-drawer.component.scss
│               │
│               └── templates/
│                   ├── template-outlet.component.ts  # @switch on templateId → load component
│                   ├── exam-result/
│                   │   ├── exam-result-board.component.ts
│                   │   ├── exam-result-board.component.html
│                   │   └── exam-result-board.component.scss
│                   └── class-ranking/
│                       ├── class-ranking-board.component.ts
│                       ├── class-ranking-board.component.html
│                       └── class-ranking-board.component.scss
```

---

## Task 1: Monorepo Scaffold

**Files:**
- Create: `package.json`
- Create: `nx.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`

- [ ] **Step 1: Create root `package.json`**

```json
{
  "name": "student-honor-board-generator",
  "version": "0.0.0",
  "private": true,
  "packageManager": "npm@10.9.3",
  "scripts": {
    "dev": "nx run-many -t serve -p web worker",
    "dev:web": "nx serve web",
    "dev:worker": "nx serve worker",
    "build": "nx run-many -t build",
    "test": "nx run-many -t test"
  },
  "prettier": {
    "printWidth": 100,
    "singleQuote": true,
    "overrides": [{ "files": "*.html", "options": { "parser": "angular" } }]
  },
  "dependencies": {
    "@angular/animations": "^21.1.3",
    "@angular/cdk": "^21.1.3",
    "@angular/common": "^21.1.0",
    "@angular/compiler": "^21.1.0",
    "@angular/core": "^21.1.0",
    "@angular/forms": "^21.1.0",
    "@angular/platform-browser": "^21.1.0",
    "@angular/router": "^21.1.0",
    "@google/generative-ai": "^0.24.0",
    "@hono/zod-validator": "^0.7.6",
    "@primeuix/themes": "^2.0.3",
    "hono": "^4.11.9",
    "html2canvas": "^1.4.1",
    "jspdf": "^2.5.2",
    "primeicons": "^7.0.0",
    "primeng": "^21.1.1",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "xlsx": "^0.18.5",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@angular-devkit/core": "^21.1.3",
    "@angular-devkit/schematics": "^21.1.3",
    "@angular/build": "^21.1.3",
    "@angular/cli": "^21.1.3",
    "@angular/compiler-cli": "^21.1.0",
    "@cloudflare/workers-types": "^4.20260213.0",
    "@nx/angular": "22.5.0",
    "@nx/workspace": "22.5.0",
    "@schematics/angular": "^21.1.3",
    "@types/html2canvas": "^1.0.0",
    "nx": "^22.5.0",
    "typescript": "~5.9.2",
    "vitest": "^4.0.8",
    "wrangler": "^4.65.0"
  }
}
```

- [ ] **Step 2: Create `nx.json`**

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "defaultBase": "main",
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "sharedGlobals": []
  },
  "targetDefaults": {
    "build": { "dependsOn": ["^build"], "inputs": ["default", "^default"], "cache": true },
    "test": { "inputs": ["default", "^default"], "cache": true }
  },
  "workspaceLayout": { "appsDir": "apps", "libsDir": "packages" }
}
```

- [ ] **Step 3: Create `tsconfig.base.json`**

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "importHelpers": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": {
      "@honor/shared-types": ["packages/shared-types/src/index.ts"]
    }
  }
}
```

- [ ] **Step 4: Create `.gitignore`**

```
node_modules/
dist/
.angular/
.wrangler/
*.env
.dev.vars
```

- [ ] **Step 5: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 6: Commit**

```bash
git add package.json nx.json tsconfig.base.json .gitignore
git commit -m "chore: init NX monorepo scaffold"
```

---

## Task 2: Shared Types Package

**Files:**
- Create: `packages/shared-types/package.json`
- Create: `packages/shared-types/tsconfig.json`
- Create: `packages/shared-types/src/index.ts`
- Create: `packages/shared-types/src/api.ts`
- Create: `packages/shared-types/src/templates/registry.ts`
- Create: `packages/shared-types/src/templates/exam-result/schema.ts`
- Create: `packages/shared-types/src/templates/exam-result/prompt.ts`
- Create: `packages/shared-types/src/templates/class-ranking/schema.ts`
- Create: `packages/shared-types/src/templates/class-ranking/prompt.ts`
- Test: `packages/shared-types/src/templates/exam-result/schema.spec.ts`

- [ ] **Step 1: Create `packages/shared-types/package.json`**

```json
{
  "name": "@honor/shared-types",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts"
}
```

- [ ] **Step 2: Create `packages/shared-types/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "../../dist/packages/shared-types" },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: Write failing tests for schemas**

Create `packages/shared-types/src/templates/exam-result/schema.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { examResultSchema } from './schema'

describe('examResultSchema', () => {
  it('parses valid data', () => {
    const input = {
      title: '學測15級分風華',
      subtitle: '輝煌傳奇',
      students: [
        { subject: '英文', juniorHighSchool: '淡江國中', studentName: '林○辰', seniorHighSchool: '北一女中' }
      ]
    }
    expect(() => examResultSchema.parse(input)).not.toThrow()
  })

  it('rejects missing required fields', () => {
    expect(() => examResultSchema.parse({ title: '測試' })).toThrow()
  })
})
```

- [ ] **Step 4: Run test — verify it fails**

```bash
npx vitest run packages/shared-types/src/templates/exam-result/schema.spec.ts
```

Expected: FAIL — `examResultSchema` not defined yet.

- [ ] **Step 5: Create exam-result schema**

Create `packages/shared-types/src/templates/exam-result/schema.ts`:

```ts
import { z } from 'zod'

export const examResultStudentSchema = z.object({
  subject: z.string(),
  juniorHighSchool: z.string(),
  studentName: z.string(),
  seniorHighSchool: z.string(),
})

export const examResultSchema = z.object({
  title: z.string(),
  subtitle: z.string().default(''),
  students: z.array(examResultStudentSchema),
})

export type ExamResultStudent = z.infer<typeof examResultStudentSchema>
export type ExamResultData = z.infer<typeof examResultSchema>
```

- [ ] **Step 6: Run test — verify it passes**

```bash
npx vitest run packages/shared-types/src/templates/exam-result/schema.spec.ts
```

Expected: PASS

- [ ] **Step 7: Create class-ranking schema**

Create `packages/shared-types/src/templates/class-ranking/schema.ts`:

```ts
import { z } from 'zod'

export const rankingEntrySchema = z.object({
  rank: z.number().int().positive(),
  classNumber: z.string(),
  studentName: z.string(),
})

export const classRankingSchema = z.object({
  title: z.string(),
  subtitle: z.string().default(''),
  schoolRankings: z.array(rankingEntrySchema),
  classRankings: z.array(rankingEntrySchema),
})

export type RankingEntry = z.infer<typeof rankingEntrySchema>
export type ClassRankingData = z.infer<typeof classRankingSchema>
```

- [ ] **Step 8: Create Gemini prompts**

Create `packages/shared-types/src/templates/exam-result/prompt.ts`:

```ts
export const examResultPrompt = `
你是一個資料轉換助手。請將以下 CSV 資料轉換為 JSON 格式。

目標 JSON 結構：
{
  "title": "榮譽榜標題（從資料推斷或使用預設'大考成績榜'）",
  "subtitle": "副標題（若無則留空字串）",
  "students": [
    {
      "subject": "科目（如英文、數學、社會、自然）",
      "juniorHighSchool": "國中名稱",
      "studentName": "學生姓名",
      "seniorHighSchool": "錄取高中名稱"
    }
  ]
}

規則：
- 若找不到對應欄位，請回傳純文字說明原因（不要回傳 JSON）
- 所有欄位值必須為字串
- students 陣列不可為空

CSV 資料如下：
`.trim()
```

Create `packages/shared-types/src/templates/class-ranking/prompt.ts`:

```ts
export const classRankingPrompt = `
你是一個資料轉換助手。請將以下 CSV 資料轉換為 JSON 格式。

目標 JSON 結構：
{
  "title": "榮譽榜標題（從資料推斷或使用預設'班榮譽榜'）",
  "subtitle": "副標題（若無則留空字串）",
  "schoolRankings": [
    { "rank": 名次數字, "classNumber": "班級（如801）", "studentName": "學生姓名" }
  ],
  "classRankings": [
    { "rank": 名次數字, "classNumber": "班級（如801）", "studentName": "學生姓名" }
  ]
}

規則：
- rank 必須為正整數
- 若找不到校排或班排欄位，請回傳純文字說明原因（不要回傳 JSON）
- classRankings 與 schoolRankings 可以其中一個為空陣列，但不可兩者都空

CSV 資料如下：
`.trim()
```

- [ ] **Step 9: Create template registry**

Create `packages/shared-types/src/templates/registry.ts`:

```ts
import { ZodSchema } from 'zod'
import { examResultSchema } from './exam-result/schema'
import { examResultPrompt } from './exam-result/prompt'
import { classRankingSchema } from './class-ranking/schema'
import { classRankingPrompt } from './class-ranking/prompt'

export interface TemplateDefinition {
  readonly id: string
  readonly label: string
  readonly schema: ZodSchema
  readonly prompt: string
}

export const TEMPLATE_REGISTRY: Readonly<Record<string, TemplateDefinition>> = {
  'exam-result': {
    id: 'exam-result',
    label: '大考成績榜',
    schema: examResultSchema,
    prompt: examResultPrompt,
  },
  'class-ranking': {
    id: 'class-ranking',
    label: '班排榮譽榜',
    schema: classRankingSchema,
    prompt: classRankingPrompt,
  },
}

export const TEMPLATE_IDS = Object.keys(TEMPLATE_REGISTRY) as (keyof typeof TEMPLATE_REGISTRY)[]
```

- [ ] **Step 10: Create API types**

Create `packages/shared-types/src/api.ts`:

```ts
import type { ExamResultData } from './templates/exam-result/schema'
import type { ClassRankingData } from './templates/class-ranking/schema'

export interface ParseRequest {
  readonly templateId: string
  readonly fileContent: string  // base64-encoded
  readonly fileName: string
}

export type ParseSuccessResponse = {
  readonly success: true
  readonly data: ExamResultData | ClassRankingData
}

export type ParseFailureResponse = {
  readonly success: false
  readonly message: string
}

export type ParseResponse = ParseSuccessResponse | ParseFailureResponse
```

- [ ] **Step 11: Create barrel export**

Create `packages/shared-types/src/index.ts`:

```ts
export * from './api'
export * from './templates/registry'
export * from './templates/exam-result/schema'
export * from './templates/class-ranking/schema'
```

- [ ] **Step 12: Commit**

```bash
git add packages/
git commit -m "feat(shared-types): add template registry, schemas, prompts, and API types"
```

---

## Task 3: Worker Scaffold

**Files:**
- Create: `apps/worker/package.json`
- Create: `apps/worker/tsconfig.json`
- Create: `apps/worker/wrangler.toml`
- Create: `apps/worker/.dev.vars.example`
- Create: `apps/worker/src/index.ts`

- [ ] **Step 1: Create `apps/worker/package.json`**

```json
{
  "name": "@honor/worker",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "serve": "wrangler dev --port 8787",
    "build": "wrangler deploy --dry-run",
    "deploy": "wrangler deploy"
  }
}
```

- [ ] **Step 2: Create `apps/worker/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: Create `apps/worker/wrangler.toml`**

```toml
name = "honor-board-worker"
main = "src/index.ts"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[vars]
ENVIRONMENT = "development"
WEB_URL = "http://localhost:4200"
```

- [ ] **Step 4: Create `apps/worker/project.json`** (required for NX `nx serve worker`)

```json
{
  "name": "worker",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "sourceRoot": "apps/worker/src",
  "tags": ["type:app", "scope:backend"],
  "targets": {
    "serve": {
      "executor": "nx:run-commands",
      "options": { "command": "wrangler dev --port 8787", "cwd": "apps/worker" }
    },
    "build": {
      "executor": "nx:run-commands",
      "options": { "command": "wrangler deploy --dry-run", "cwd": "apps/worker" }
    },
    "deploy": {
      "executor": "nx:run-commands",
      "options": { "command": "wrangler deploy", "cwd": "apps/worker" }
    }
  }
}
```

- [ ] **Step 5: Create `.dev.vars.example`**

```
GEMINI_API_KEY=your_gemini_api_key_here
```

- [ ] **Step 5: Copy `.dev.vars` and set API key before Task 4**

```bash
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
# Edit apps/worker/.dev.vars — set GEMINI_API_KEY to your actual key
# ⚠️ Missing key will cause silent failure in Task 4 smoke test
```

- [ ] **Step 6: Create `apps/worker/src/index.ts`**

```ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import parseRoute from './routes/parse'

export type Bindings = {
  ENVIRONMENT: string
  WEB_URL: string
  GEMINI_API_KEY: string
}

export type AppEnv = { Bindings: Bindings }

const app = new Hono<AppEnv>()

app.use('*', logger())
app.use('*', cors({
  origin: (origin, c) => {
    const webUrl = c.env?.WEB_URL ?? 'http://localhost:4200'
    const allowed = [webUrl, 'http://localhost:4200']
    return allowed.includes(origin) ? origin : null
  },
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}))

app.get('/health', (c) => c.json({ status: 'ok' }))
app.route('/api/parse', parseRoute)

app.onError((err, c) => {
  console.error(err)
  return c.json({ success: false, message: '伺服器發生錯誤，請稍後再試' }, 500)
})

export default app
```

- [ ] **Step 6: Start worker to verify it boots**

```bash
cd apps/worker && cp .dev.vars.example .dev.vars
# Edit .dev.vars and add your actual GEMINI_API_KEY
npx wrangler dev --port 8787
```

Expected: Worker starts on port 8787, `GET /health` returns `{"status":"ok"}`.

- [ ] **Step 7: Commit**

```bash
git add apps/worker/
git commit -m "feat(worker): scaffold Hono worker with CORS"
```

---

## Task 4: Worker Parse Route

**Files:**
- Create: `apps/worker/src/lib/file-parser.ts`
- Create: `apps/worker/src/lib/gemini.ts`
- Create: `apps/worker/src/routes/parse.ts`
- Test: `apps/worker/src/lib/file-parser.spec.ts`
- Test: `apps/worker/src/routes/parse.spec.ts`

- [ ] **Step 1: Write failing test for file-parser**

Create `apps/worker/src/lib/file-parser.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { parseFileToCsv } from './file-parser'

describe('parseFileToCsv', () => {
  it('decodes base64 CSV directly', () => {
    const csv = '姓名,班級\n張三,801\n'
    const base64 = Buffer.from(csv).toString('base64')
    const result = parseFileToCsv(base64, 'data.csv')
    expect(result).toBe(csv)
  })

  it('converts xlsx base64 to CSV string', () => {
    // This test uses a minimal valid xlsx (pre-generated base64)
    // The output should contain the header row
    const result = parseFileToCsv(MINIMAL_XLSX_BASE64, 'data.xlsx')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('throws on unsupported extension', () => {
    expect(() => parseFileToCsv('abc', 'data.pdf')).toThrow('不支援的檔案格式')
  })
})

// Minimal xlsx base64 (a real 1-cell xlsx encoded as base64)
// Generate with: Buffer.from(require('xlsx').write(wb, {type:'buffer', bookType:'xlsx'})).toString('base64')
const MINIMAL_XLSX_BASE64 = 'UEsDBBQAAAAIAA==' // placeholder — replace with real value in implementation
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx vitest run apps/worker/src/lib/file-parser.spec.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `file-parser.ts`**

Create `apps/worker/src/lib/file-parser.ts`:

```ts
import * as XLSX from 'xlsx'

/**
 * Converts a base64-encoded CSV or Excel file to a plain CSV string.
 * Throws if the file extension is not supported.
 */
export function parseFileToCsv(base64Content: string, fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()

  if (ext === 'csv') {
    return Buffer.from(base64Content, 'base64').toString('utf-8')
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const buffer = Buffer.from(base64Content, 'base64')
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    return XLSX.utils.sheet_to_csv(firstSheet)
  }

  throw new Error(`不支援的檔案格式：.${ext}`)
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npx vitest run apps/worker/src/lib/file-parser.spec.ts
```

Expected: PASS (the xlsx test may need a real base64 value — update it after verifying manually)

- [ ] **Step 5: Implement `gemini.ts`**

Create `apps/worker/src/lib/gemini.ts`:

```ts
import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * Sends a prompt to Gemini and returns the raw text response.
 * Throws on API errors.
 */
export async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const result = await model.generateContent(prompt)
  return result.response.text()
}
```

- [ ] **Step 6: Write failing test for parse route**

Create `apps/worker/src/routes/parse.spec.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import app from '../index'

// Mock gemini to avoid real API calls in tests
vi.mock('../lib/gemini', () => ({
  callGemini: vi.fn().mockResolvedValue(JSON.stringify({
    title: '測試榜',
    subtitle: '',
    students: [
      { subject: '英文', juniorHighSchool: '淡江國中', studentName: '林○辰', seniorHighSchool: '北一女中' }
    ]
  }))
}))

describe('POST /api/parse', () => {
  const mockEnv = { GEMINI_API_KEY: 'test-key', WEB_URL: 'http://localhost:4200', ENVIRONMENT: 'test' }

  it('returns success with parsed data for valid CSV', async () => {
    const csv = '姓名,科目,國中,高中\n林○辰,英文,淡江國中,北一女中\n'
    const base64 = Buffer.from(csv).toString('base64')

    const res = await app.request('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId: 'exam-result', fileContent: base64, fileName: 'test.csv' })
    }, mockEnv)

    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.success).toBe(true)
    expect(body.data.students).toHaveLength(1)
  })

  it('returns failure when file is too large', async () => {
    const largeContent = 'x'.repeat(7 * 1024 * 1024) // 7 MB base64 string
    const res = await app.request('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId: 'exam-result', fileContent: largeContent, fileName: 'big.csv' })
    }, mockEnv)

    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.success).toBe(false)
    expect(body.message).toContain('檔案')
  })

  it('returns failure when Gemini returns non-JSON', async () => {
    const { callGemini } = await import('../lib/gemini')
    vi.mocked(callGemini).mockResolvedValueOnce('找不到對應的欄位，請確認資料格式')

    const csv = '不相關,欄位\n值,值\n'
    const base64 = Buffer.from(csv).toString('base64')
    const res = await app.request('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId: 'exam-result', fileContent: base64, fileName: 'test.csv' })
    }, mockEnv)

    const body = await res.json() as any
    expect(body.success).toBe(false)
    expect(body.message).toBeTruthy()
  })
})
```

- [ ] **Step 7: Run test — verify it fails**

```bash
npx vitest run apps/worker/src/routes/parse.spec.ts
```

Expected: FAIL — parse route not implemented.

- [ ] **Step 8: Implement parse route**

Create `apps/worker/src/routes/parse.ts`:

```ts
import { Hono } from 'hono'
import type { AppEnv } from '../index'
import { TEMPLATE_REGISTRY } from '@honor/shared-types'
import { parseFileToCsv } from '../lib/file-parser'
import { callGemini } from '../lib/gemini'

const MAX_BODY_BYTES = 6.7 * 1024 * 1024 // 5 MB original × 1.33 base64 expansion

const route = new Hono<AppEnv>()

route.post('/', async (c) => {
  const body = await c.req.json<{ templateId?: string; fileContent?: string; fileName?: string }>()
  const { templateId, fileContent, fileName } = body

  // Validate input presence
  if (!templateId || !fileContent || !fileName) {
    return c.json({ success: false, message: '缺少必要欄位' }, 400)
  }

  // Validate template exists
  const template = TEMPLATE_REGISTRY[templateId]
  if (!template) {
    return c.json({ success: false, message: `未知的榮譽榜類型：${templateId}` }, 400)
  }

  // Guard: body size check (base64 is ~1.33x the original file)
  if (fileContent.length > MAX_BODY_BYTES) {
    return c.json({ success: false, message: '檔案太大，請上傳 5 MB 以內的檔案' })
  }

  // Convert file to CSV text
  let csvText: string
  try {
    csvText = parseFileToCsv(fileContent, fileName)
  } catch (err) {
    return c.json({ success: false, message: err instanceof Error ? err.message : '檔案解析失敗' })
  }

  // Call Gemini
  let geminiResponse: string
  try {
    geminiResponse = await callGemini(c.env.GEMINI_API_KEY, `${template.prompt}\n\n${csvText}`)
  } catch {
    return c.json({ success: false, message: 'AI 服務暫時無法使用，請稍後再試' })
  }

  // Try to parse Gemini response as JSON
  let parsed: unknown
  try {
    // Strip markdown code fences if present
    const cleaned = geminiResponse.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    // Gemini returned a text explanation instead of JSON
    return c.json({ success: false, message: geminiResponse.trim() })
  }

  // Validate against Zod schema
  const result = template.schema.safeParse(parsed)
  if (!result.success) {
    const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('；')
    return c.json({ success: false, message: `資料格式不符合預期：${issues}` })
  }

  return c.json({ success: true, data: result.data })
})

export default route
```

- [ ] **Step 9: Run tests — verify they pass**

```bash
npx vitest run apps/worker/src/routes/parse.spec.ts
```

Expected: PASS

- [ ] **Step 10: Manual smoke test with wrangler dev**

Start the worker (`npx wrangler dev`), then:

```bash
curl -X POST http://localhost:8787/api/parse \
  -H "Content-Type: application/json" \
  -d '{"templateId":"exam-result","fileContent":"<base64 of a csv>","fileName":"test.csv"}'
```

Expected: `{"success":true,"data":{...}}` or a meaningful failure message.

- [ ] **Step 11: Commit**

```bash
git add apps/worker/src/
git commit -m "feat(worker): implement parse route with Gemini + SheetJS + Zod validation"
```

---

## Task 5: Angular App Scaffold

**Files:**
- Create: `angular.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/tsconfig.app.json`
- Create: `apps/web/tsconfig.spec.json`
- Create: `apps/web/project.json`
- Create: `apps/web/src/index.html`
- Create: `apps/web/src/main.ts`
- Create: `apps/web/src/styles.scss`
- Create: `apps/web/src/environments/environment.ts`
- Create: `apps/web/src/environments/environment.production.ts`
- Create: `apps/web/src/app/app.config.ts`
- Create: `apps/web/src/app/app.routes.ts`
- Create: `apps/web/src/app/app.component.ts`

- [ ] **Step 1: Create `apps/web/project.json`** (required for NX targets)

```json
{
  "name": "web",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "prefix": "app",
  "sourceRoot": "apps/web/src",
  "tags": ["type:app", "scope:frontend"],
  "targets": {
    "build": {
      "executor": "@angular/build:application",
      "options": {
        "outputPath": "dist/apps/web",
        "browser": "apps/web/src/main.ts",
        "tsConfig": "apps/web/tsconfig.app.json",
        "inlineStyleLanguage": "scss",
        "assets": [{ "glob": "**/*", "input": "apps/web/public" }],
        "styles": ["node_modules/primeicons/primeicons.css", "apps/web/src/styles.scss"]
      },
      "configurations": {
        "production": {
          "outputHashing": "all",
          "fileReplacements": [{
            "replace": "apps/web/src/environments/environment.ts",
            "with": "apps/web/src/environments/environment.production.ts"
          }]
        },
        "development": { "optimization": false, "sourceMap": true }
      },
      "defaultConfiguration": "production"
    },
    "serve": {
      "executor": "@angular/build:dev-server",
      "configurations": {
        "production": { "buildTarget": "web:build:production" },
        "development": { "buildTarget": "web:build:development" }
      },
      "defaultConfiguration": "development"
    },
    "test": {
      "executor": "@angular/build:unit-test",
      "options": { "tsConfig": "apps/web/tsconfig.spec.json" }
    }
  }
}
```

- [ ] **Step 2: Create `angular.json`**

```json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "cli": { "packageManager": "npm" },
  "newProjectRoot": "projects",
  "projects": {
    "web": {
      "projectType": "application",
      "schematics": { "@schematics/angular:component": { "style": "scss" } },
      "root": "apps/web",
      "sourceRoot": "apps/web/src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular/build:application",
          "options": {
            "outputPath": "dist/apps/web",
            "browser": "apps/web/src/main.ts",
            "tsConfig": "apps/web/tsconfig.app.json",
            "inlineStyleLanguage": "scss",
            "assets": [{ "glob": "**/*", "input": "apps/web/public" }],
            "styles": [
              "node_modules/primeicons/primeicons.css",
              "apps/web/src/styles.scss"
            ]
          },
          "configurations": {
            "production": {
              "fileReplacements": [{
                "replace": "apps/web/src/environments/environment.ts",
                "with": "apps/web/src/environments/environment.production.ts"
              }],
              "outputHashing": "all"
            },
            "development": { "optimization": false, "sourceMap": true }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular/build:dev-server",
          "configurations": {
            "production": { "buildTarget": "web:build:production" },
            "development": { "buildTarget": "web:build:development" }
          },
          "defaultConfiguration": "development"
        },
        "test": {
          "builder": "@nx/angular:vitest",
          "options": { "tsConfig": "apps/web/tsconfig.spec.json" }
        }
      }
    }
  }
}
```

- [ ] **Step 2: Create tsconfig files**

`apps/web/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.spec.json" }
  ]
}
```

`apps/web/tsconfig.app.json`:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "outDir": "../../dist/out-tsc", "types": [] },
  "files": ["src/main.ts"],
  "include": ["src/**/*.d.ts"]
}
```

`apps/web/tsconfig.spec.json`:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "outDir": "../../dist/out-tsc", "types": ["vitest/globals"] },
  "include": ["src/**/*.spec.ts", "src/**/*.d.ts"]
}
```

- [ ] **Step 3: Create `apps/web/src/index.html`**

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <title>榮譽榜產生器</title>
  <base href="/" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet" />
</head>
<body>
  <app-root></app-root>
</body>
</html>
```

- [ ] **Step 4: Create `apps/web/src/styles.scss`**

```scss
// PrimeNG Aura theme
@use 'primeng/resources/themes/aura-light-amber/theme.css';

// Design tokens
:root {
  --bg: #f5efe5;
  --paper: #fcf8f1;
  --ink: #2f2418;
  --muted: #7d6a55;
  --gold-1: #e8be58;
  --gold-2: #c9962d;
  --gold-soft: #f6e7bf;
  --green-1: #b8cfbe;
  --green-2: #8faa94;
  --green-soft: #edf4ef;

  --font-serif: 'Noto Serif TC', 'PMingLiU', serif;
  --font-sans: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  font-family: var(--font-sans);
  color: var(--ink);
  background: linear-gradient(180deg, #f7f2ea 0%, #efe6d9 100%);
}
```

- [ ] **Step 5: Create environments**

`apps/web/src/environments/environment.ts`:
```ts
export const environment = {
  production: false,
  workerUrl: 'http://localhost:8787',
}
```

`apps/web/src/environments/environment.production.ts`:
```ts
export const environment = {
  production: true,
  workerUrl: 'https://honor-board-worker.YOUR_SUBDOMAIN.workers.dev',
}
```

> Replace `YOUR_SUBDOMAIN` with your Cloudflare Workers subdomain after first deploy.

- [ ] **Step 6: Create `apps/web/src/main.ts`**

```ts
import { bootstrapApplication } from '@angular/platform-browser'
import { AppComponent } from './app/app.component'
import { appConfig } from './app/app.config'

bootstrapApplication(AppComponent, appConfig).catch(console.error)
```

- [ ] **Step 7: Create `app.config.ts`**

```ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core'
import { provideRouter } from '@angular/router'
import { provideHttpClient } from '@angular/common/http'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import { routes } from './app.routes'

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
  ],
}
```

- [ ] **Step 8: Create `app.routes.ts`**

```ts
import { Routes } from '@angular/router'

export const routes: Routes = [
  { path: '', loadComponent: () => import('./app.component').then(m => m.AppComponent) }
]
```

- [ ] **Step 9: Create root `app.component.ts` (placeholder)**

```ts
import { Component } from '@angular/core'

@Component({
  selector: 'app-root',
  standalone: true,
  template: '<p>載入中…</p>',
})
export class AppComponent {}
```

- [ ] **Step 10: Verify Angular builds**

```bash
npx ng build web --configuration=development
```

Expected: Build succeeds with no errors.

- [ ] **Step 11: Commit**

```bash
git add apps/web/ angular.json
git commit -m "feat(web): scaffold Angular app with PrimeNG and environments"
```

---

## Task 6: Board Service (State Machine)

**Files:**
- Create: `apps/web/src/app/core/board.service.ts`
- Test: `apps/web/src/app/core/board.service.spec.ts`

The service owns all app state using Angular Signals. It is the single source of truth for which UI state is active and what data is loaded.

- [ ] **Step 1: Write failing test**

Create `apps/web/src/app/core/board.service.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing'
import { describe, it, expect, beforeEach } from 'vitest'
import { BoardService } from './board.service'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'

describe('BoardService', () => {
  let service: BoardService
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BoardService, provideHttpClient(), provideHttpClientTesting()]
    })
    service = TestBed.inject(BoardService)
    http = TestBed.inject(HttpTestingController)
  })

  it('starts in upload state', () => {
    expect(service.uiState()).toBe('upload')
  })

  it('transitions to preview on successful parse', async () => {
    const mockData = {
      title: '測試榜', subtitle: '', students: [
        { subject: '英文', juniorHighSchool: '淡江國中', studentName: '林○辰', seniorHighSchool: '北一女中' }
      ]
    }

    const promise = service.parse('exam-result', 'dGVzdA==', 'test.csv')
    http.expectOne('/api/parse').flush({ success: true, data: mockData })

    const result = await promise
    expect(result.success).toBe(true)
    expect(service.uiState()).toBe('preview')
    expect(service.parsedData()).toEqual(mockData)
  })

  it('stays in upload state on failure', async () => {
    const promise = service.parse('exam-result', 'dGVzdA==', 'test.csv')
    http.expectOne('/api/parse').flush({ success: false, message: '錯誤訊息' })

    const result = await promise
    expect(result.success).toBe(false)
    expect(service.uiState()).toBe('upload')
  })

  it('resets to upload state', () => {
    service.resetToUpload()
    expect(service.uiState()).toBe('upload')
    expect(service.parsedData()).toBeNull()
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx vitest run apps/web/src/app/core/board.service.spec.ts
```

Expected: FAIL — service not found.

- [ ] **Step 3: Implement `board.service.ts`**

```ts
import { Injectable, inject, signal, computed } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { environment } from '../../environments/environment'
import type { ParseRequest, ParseResponse } from '@honor/shared-types'
import type { ExamResultData } from '@honor/shared-types'
import type { ClassRankingData } from '@honor/shared-types'

export type UiState = 'upload' | 'preview'

@Injectable({ providedIn: 'root' })
export class BoardService {
  private readonly http = inject(HttpClient)

  readonly uiState = signal<UiState>('upload')
  readonly templateId = signal<string>('')
  readonly parsedData = signal<ExamResultData | ClassRankingData | null>(null)
  readonly drawerOpen = signal(false)
  readonly isLoading = signal(false)
  readonly errorMessage = signal<string | null>(null)

  readonly isInPreview = computed(() => this.uiState() === 'preview')

  async parse(templateId: string, fileContent: string, fileName: string): Promise<ParseResponse> {
    this.isLoading.set(true)
    this.errorMessage.set(null)

    const body: ParseRequest = { templateId, fileContent, fileName }

    try {
      const response = await firstValueFrom(
        this.http.post<ParseResponse>(`${environment.workerUrl}/api/parse`, body)
      )

      if (response.success) {
        this.templateId.set(templateId)
        this.parsedData.set(response.data)
        this.uiState.set('preview')
      } else {
        this.errorMessage.set(response.message)
      }

      return response
    } catch {
      const message = 'AI 服務暫時無法使用，請稍後再試'
      this.errorMessage.set(message)
      return { success: false, message }
    } finally {
      this.isLoading.set(false)
    }
  }

  resetToUpload(): void {
    this.uiState.set('upload')
    this.parsedData.set(null)
    this.templateId.set('')
    this.errorMessage.set(null)
    this.drawerOpen.set(false)
  }

  toggleDrawer(): void {
    this.drawerOpen.update(v => !v)
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run apps/web/src/app/core/board.service.spec.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/core/board.service.ts apps/web/src/app/core/board.service.spec.ts
git commit -m "feat(web): add BoardService state machine with Signals"
```

---

## Task 7: Upload Component

**Files:**
- Create: `apps/web/src/app/features/upload/upload.component.ts`
- Create: `apps/web/src/app/features/upload/upload.component.html`
- Create: `apps/web/src/app/features/upload/upload.component.scss`

- [ ] **Step 1: Create `upload.component.ts`**

```ts
import { Component, inject, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { SelectModule } from 'primeng/select'
import { FileUploadModule, FileUploadHandlerEvent } from 'primeng/fileupload'
import { ButtonModule } from 'primeng/button'
import { MessageModule } from 'primeng/message'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { BoardService } from '../../core/board.service'
import { TEMPLATE_IDS, TEMPLATE_REGISTRY } from '@honor/shared-types'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, FileUploadModule, ButtonModule, MessageModule, ProgressSpinnerModule],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss',
})
export class UploadComponent {
  protected readonly board = inject(BoardService)

  protected readonly templateOptions = TEMPLATE_IDS.map(id => ({
    label: TEMPLATE_REGISTRY[id].label,
    value: id,
  }))

  protected selectedTemplateId = signal<string>(TEMPLATE_IDS[0])
  protected validationError = signal<string | null>(null)
  protected pendingFile = signal<File | null>(null)

  protected onFileSelect(event: FileUploadHandlerEvent): void {
    const file = event.files[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(ext ?? '')) {
      this.validationError.set('請上傳 .csv、.xlsx 或 .xls 格式的檔案')
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.validationError.set('檔案大小不可超過 5 MB')
      return
    }

    this.validationError.set(null)
    this.pendingFile.set(file)
  }

  protected async onSubmit(): Promise<void> {
    const file = this.pendingFile()
    if (!file || !this.selectedTemplateId()) return

    const buffer = await file.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
    await this.board.parse(this.selectedTemplateId(), base64, file.name)
  }

  protected canSubmit = () =>
    !!this.pendingFile() && !!this.selectedTemplateId() && !this.board.isLoading()
}
```

- [ ] **Step 2: Create `upload.component.html`**

```html
<div class="upload">
  <div class="upload__hero">
    <h1 class="upload__title">榮譽榜產生器</h1>
    <p class="upload__subtitle">上傳成績資料，自動產生精美榮譽榜</p>
  </div>

  <div class="upload__card">
    <!-- Template selector -->
    <div class="upload__field">
      <label class="upload__label">榮譽榜類型</label>
      <p-select
        [options]="templateOptions"
        [(ngModel)]="selectedTemplateId"
        optionLabel="label"
        optionValue="value"
        placeholder="請選擇類型"
        styleClass="upload__select"
      />
    </div>

    <!-- File upload -->
    <div class="upload__field">
      <label class="upload__label">上傳資料檔案</label>
      <p-fileupload
        mode="advanced"
        accept=".csv,.xlsx,.xls"
        [maxFileSize]="5242880"
        chooseLabel="選擇檔案"
        [customUpload]="true"
        (uploadHandler)="onFileSelect($event)"
        [auto]="true"
        styleClass="upload__fileupload"
      />
    </div>

    <!-- Validation error -->
    @if (validationError()) {
      <p-message severity="error" [text]="validationError()!" />
    }

    <!-- API error -->
    @if (board.errorMessage()) {
      <div class="upload__error">
        <p-message severity="warn" [text]="board.errorMessage()!" />
        <p-button
          label="重試"
          severity="secondary"
          size="small"
          (onClick)="onSubmit()"
          [disabled]="board.isLoading()"
        />
      </div>
    }

    <!-- Submit -->
    <p-button
      label="開始解析"
      [disabled]="!canSubmit()"
      [loading]="board.isLoading()"
      (onClick)="onSubmit()"
      styleClass="upload__submit"
    />
  </div>
</div>
```

- [ ] **Step 3: Create `upload.component.scss`**

```scss
.upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 32px 16px;

  &__hero {
    text-align: center;
    margin-bottom: 40px;
  }

  &__title {
    margin: 0;
    font-family: var(--font-serif);
    font-size: clamp(28px, 5vw, 48px);
    font-weight: 700;
    color: var(--ink);
    letter-spacing: 0.06em;
  }

  &__subtitle {
    margin: 12px 0 0;
    color: var(--muted);
    font-size: 16px;
    letter-spacing: 0.08em;
  }

  &__card {
    width: min(520px, 100%);
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(132, 101, 62, 0.14);
    border-radius: 2px;
    padding: 32px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    box-shadow: 0 18px 42px rgba(68, 49, 27, 0.08);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__label {
    font-size: 14px;
    font-weight: 500;
    color: var(--muted);
    letter-spacing: 0.06em;
  }

  &__select { width: 100%; }

  &__error {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__submit { width: 100%; }
}
```

- [ ] **Step 4: Update `app.component.ts` to use upload component**

```ts
import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { UploadComponent } from './features/upload/upload.component'
import { BoardService } from './core/board.service'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, UploadComponent],
  template: `
    @if (board.uiState() === 'upload') {
      <app-upload />
    }
  `,
})
export class AppComponent {
  protected readonly board = inject(BoardService)
}
```

- [ ] **Step 5: Serve and manually test upload UI**

```bash
npx ng serve web --configuration=development
```

Open `http://localhost:4200`. Verify:
- Template dropdown shows two options
- File picker opens on click
- Files > 5 MB are rejected with an error message
- Non-CSV/XLSX files are rejected

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/features/upload/ apps/web/src/app/app.component.ts
git commit -m "feat(web): add upload component with file validation"
```

---

## Task 8: Preview Component + Layout

**Files:**
- Create: `apps/web/src/app/features/preview/preview.component.ts`
- Create: `apps/web/src/app/features/preview/preview.component.html`
- Create: `apps/web/src/app/features/preview/preview.component.scss`
- Create: `apps/web/src/app/templates/template-outlet.component.ts`

- [ ] **Step 1: Create `template-outlet.component.ts`**

Dynamically renders the correct board component based on `templateId`:

```ts
import { Component, input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ExamResultBoardComponent } from './exam-result/exam-result-board.component'
import { ClassRankingBoardComponent } from './class-ranking/class-ranking-board.component'
import type { ExamResultData, ClassRankingData } from '@honor/shared-types'

@Component({
  selector: 'app-template-outlet',
  standalone: true,
  imports: [CommonModule, ExamResultBoardComponent, ClassRankingBoardComponent],
  template: `
    @switch (templateId()) {
      @case ('exam-result') {
        <app-exam-result-board [data]="$any(data())" />
      }
      @case ('class-ranking') {
        <app-class-ranking-board [data]="$any(data())" />
      }
    }
  `,
})
export class TemplateOutletComponent {
  readonly templateId = input.required<string>()
  readonly data = input.required<ExamResultData | ClassRankingData>()
}
```

- [ ] **Step 2: Create `preview.component.ts`**

```ts
import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ButtonModule } from 'primeng/button'
import { SplitButtonModule } from 'primeng/splitbutton'
import { ToastModule } from 'primeng/toast'
import { MessageService } from 'primeng/api'
import { BoardService } from '../../core/board.service'
import { ExportService } from '../../core/export.service'
import { TemplateOutletComponent } from '../../templates/template-outlet.component'
import { EditDrawerComponent } from './edit-drawer/edit-drawer.component'

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule, ButtonModule, SplitButtonModule, ToastModule, TemplateOutletComponent, EditDrawerComponent],
  providers: [MessageService],
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.scss',
})
export class PreviewComponent {
  protected readonly board = inject(BoardService)
  protected readonly exportService = inject(ExportService)
  protected readonly messageService = inject(MessageService)

  protected readonly exportItems = [
    { label: '下載 PDF', icon: 'pi pi-file-pdf', command: () => this.download('pdf') },
    { label: '下載 PNG', icon: 'pi pi-image', command: () => this.download('png') },
    {
      label: '下載 HTML',
      icon: 'pi pi-code',
      tooltip: '下載的 HTML 檔案不含字型，在不同裝置上字型可能顯示不同',
      command: () => this.download('html')
    },
  ]

  protected async download(format: 'html' | 'pdf' | 'png'): Promise<void> {
    try {
      const el = document.getElementById('board-preview-target')!
      if (format === 'html') await this.exportService.downloadHtml(el)
      if (format === 'pdf') await this.exportService.downloadPdf(el)
      if (format === 'png') await this.exportService.downloadPng(el)
    } catch {
      this.messageService.add({ severity: 'error', summary: '下載失敗', detail: '請稍後再試' })
    }
  }
}
```

- [ ] **Step 3: Create `preview.component.html`**

```html
<p-toast />

<div class="preview" [class.preview--drawer-open]="board.drawerOpen()">
  <!-- Toolbar -->
  <div class="preview__toolbar">
    <p-button
      icon="pi pi-arrow-left"
      label="重新上傳"
      severity="secondary"
      size="small"
      (onClick)="board.resetToUpload()"
    />
    <div class="preview__toolbar-actions">
      <p-button
        icon="pi pi-pencil"
        label="編輯"
        severity="secondary"
        size="small"
        (onClick)="board.toggleDrawer()"
      />
      <p-splitbutton
        label="下載 PDF"
        icon="pi pi-download"
        [model]="exportItems"
        (onClick)="download('pdf')"
        size="small"
      />
    </div>
  </div>

  <!-- Board preview -->
  <div class="preview__canvas" id="board-preview-target">
    @if (board.parsedData(); as data) {
      <app-template-outlet
        [templateId]="board.templateId()"
        [data]="data"
      />
    }
  </div>

  <!-- Edit drawer -->
  <app-edit-drawer />
</div>
```

- [ ] **Step 4: Create `preview.component.scss`**

```scss
.preview {
  display: grid;
  grid-template-rows: 52px 1fr;
  grid-template-columns: 1fr;
  min-height: 100vh;
  transition: grid-template-columns 0.3s ease;

  &--drawer-open {
    grid-template-columns: 1fr 360px;
  }

  &__toolbar {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    background: rgba(255, 255, 255, 0.9);
    border-bottom: 1px solid rgba(132, 101, 62, 0.14);
    backdrop-filter: blur(8px);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  &__toolbar-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  &__canvas {
    overflow-y: auto;
    padding: 24px;
    display: flex;
    justify-content: center;
  }
}
```

- [ ] **Step 5: Update `app.component.ts` to show preview**

```ts
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, UploadComponent, PreviewComponent],
  template: `
    @if (board.uiState() === 'upload') {
      <app-upload />
    } @else {
      <app-preview />
    }
  `,
})
export class AppComponent {
  protected readonly board = inject(BoardService)
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/features/preview/ apps/web/src/app/templates/template-outlet.component.ts apps/web/src/app/app.component.ts
git commit -m "feat(web): add preview layout with toolbar and template outlet"
```

---

## Task 9: Edit Drawer

**Files:**
- Create: `apps/web/src/app/features/preview/edit-drawer/edit-drawer.component.ts`
- Create: `apps/web/src/app/features/preview/edit-drawer/edit-drawer.component.html`
- Create: `apps/web/src/app/features/preview/edit-drawer/edit-drawer.component.scss`

- [ ] **Step 1: Create `edit-drawer.component.ts`**

```ts
import { Component, inject, computed, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { DrawerModule } from 'primeng/drawer'
import { ChipModule } from 'primeng/chip'
import { ButtonModule } from 'primeng/button'
import { InputTextModule } from 'primeng/inputtext'
import { BoardService } from '../../../core/board.service'
import type { ExamResultData, ClassRankingData, ExamResultStudent, RankingEntry } from '@honor/shared-types'

@Component({
  selector: 'app-edit-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, DrawerModule, ChipModule, ButtonModule, InputTextModule],
  templateUrl: './edit-drawer.component.html',
  styleUrl: './edit-drawer.component.scss',
})
export class EditDrawerComponent {
  protected readonly board = inject(BoardService)

  protected readonly isExamResult = computed(() => this.board.templateId() === 'exam-result')
  protected readonly isClassRanking = computed(() => this.board.templateId() === 'class-ranking')

  protected readonly examData = computed(() =>
    this.isExamResult() ? (this.board.parsedData() as ExamResultData) : null
  )

  protected readonly rankingData = computed(() =>
    this.isClassRanking() ? (this.board.parsedData() as ClassRankingData) : null
  )

  protected editingIndex = signal<{ section: string; index: number } | null>(null)
  protected editBuffer = signal<Record<string, string>>({})

  protected startEdit(section: string, index: number, entry: Record<string, unknown>): void {
    this.editingIndex.set({ section, index })
    this.editBuffer.set(Object.fromEntries(Object.entries(entry).map(([k, v]) => [k, String(v)])))
  }

  protected saveEdit(): void {
    const pos = this.editingIndex()
    if (!pos) return

    const data = this.board.parsedData()
    if (!data) return

    if (this.isExamResult() && pos.section === 'students') {
      const updated = { ...(data as ExamResultData) }
      updated.students = [...updated.students]
      updated.students[pos.index] = this.editBuffer() as unknown as ExamResultStudent
      this.board.parsedData.set(updated)
    }

    if (this.isClassRanking()) {
      const updated = { ...(data as ClassRankingData) }
      const key = pos.section as 'schoolRankings' | 'classRankings'
      updated[key] = [...updated[key]]
      updated[key][pos.index] = {
        ...this.editBuffer(),
        rank: Number(this.editBuffer()['rank']),
      } as RankingEntry
      this.board.parsedData.set(updated)
    }

    this.editingIndex.set(null)
  }

  protected deleteEntry(section: string, index: number): void {
    const data = this.board.parsedData()
    if (!data) return

    if (this.isExamResult() && section === 'students') {
      const updated = { ...(data as ExamResultData) }
      updated.students = updated.students.filter((_, i) => i !== index)
      this.board.parsedData.set(updated)
    }

    if (this.isClassRanking()) {
      const updated = { ...(data as ClassRankingData) }
      const key = section as 'schoolRankings' | 'classRankings'
      updated[key] = updated[key].filter((_, i) => i !== index)
      this.board.parsedData.set(updated)
    }
  }

  protected addEntry(section: string): void {
    const data = this.board.parsedData()
    if (!data) return

    if (this.isExamResult()) {
      const updated = { ...(data as ExamResultData) }
      updated.students = [...updated.students, { subject: '', juniorHighSchool: '', studentName: '新學生', seniorHighSchool: '' }]
      this.board.parsedData.set(updated)
    }

    if (this.isClassRanking()) {
      const updated = { ...(data as ClassRankingData) }
      const key = section as 'schoolRankings' | 'classRankings'
      const nextRank = (updated[key].at(-1)?.rank ?? 0) + 1
      updated[key] = [...updated[key], { rank: nextRank, classNumber: '', studentName: '新學生' }]
      this.board.parsedData.set(updated)
    }
  }
}
```

- [ ] **Step 2: Create `edit-drawer.component.html`**

```html
<p-drawer
  [visible]="board.drawerOpen()"
  (visibleChange)="board.drawerOpen.set($event)"
  position="right"
  [modal]="false"
  [style]="{ width: '360px' }"
  header="編輯內容"
>
  <!-- Exam Result mode -->
  @if (isExamResult() && examData(); as data) {
    <div class="drawer__section">
      <div class="drawer__section-title">學生名單</div>
      @for (student of data.students; track $index) {
        <div class="drawer__chip-row">
          @if (editingIndex()?.section === 'students' && editingIndex()?.index === $index) {
            <div class="drawer__inline-edit">
              <input pInputText [(ngModel)]="editBuffer()['studentName']" placeholder="姓名" />
              <input pInputText [(ngModel)]="editBuffer()['subject']" placeholder="科目" />
              <input pInputText [(ngModel)]="editBuffer()['juniorHighSchool']" placeholder="國中" />
              <input pInputText [(ngModel)]="editBuffer()['seniorHighSchool']" placeholder="高中" />
              <p-button label="儲存" size="small" (onClick)="saveEdit()" />
            </div>
          } @else {
            <p-chip
              [label]="student.studentName + ' · ' + student.subject"
              [removable]="true"
              (onRemove)="deleteEntry('students', $index)"
              (onClick)="startEdit('students', $index, $any(student))"
              styleClass="drawer__chip"
            />
          }
        </div>
      }
      <p-button label="＋ 新增" size="small" severity="secondary" (onClick)="addEntry('students')" styleClass="drawer__add" />
    </div>
  }

  <!-- Class Ranking mode -->
  @if (isClassRanking() && rankingData(); as data) {
    @for (section of [{ key: 'schoolRankings', label: '校排' }, { key: 'classRankings', label: '班排' }]; track section.key) {
      <div class="drawer__section">
        <div class="drawer__section-title">{{ section.label }}</div>
        @for (entry of $any(data)[section.key]; track $index) {
          <div class="drawer__chip-row">
            @if (editingIndex()?.section === section.key && editingIndex()?.index === $index) {
              <div class="drawer__inline-edit">
                <input pInputText [(ngModel)]="editBuffer()['rank']" placeholder="名次" type="number" />
                <input pInputText [(ngModel)]="editBuffer()['classNumber']" placeholder="班級" />
                <input pInputText [(ngModel)]="editBuffer()['studentName']" placeholder="姓名" />
                <p-button label="儲存" size="small" (onClick)="saveEdit()" />
              </div>
            } @else {
              <p-chip
                [label]="'第' + entry.rank + '名 ' + entry.classNumber + ' ' + entry.studentName"
                [removable]="true"
                (onRemove)="deleteEntry(section.key, $index)"
                (onClick)="startEdit(section.key, $index, $any(entry))"
                styleClass="drawer__chip"
              />
            }
          </div>
        }
        <p-button label="＋ 新增" size="small" severity="secondary" (onClick)="addEntry(section.key)" styleClass="drawer__add" />
      </div>
    }
  }
</p-drawer>
```

- [ ] **Step 3: Create `edit-drawer.component.scss`**

```scss
.drawer {
  &__section {
    margin-bottom: 24px;
  }

  &__section-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(132, 101, 62, 0.12);
  }

  &__chip-row {
    margin-bottom: 8px;
  }

  &__chip {
    cursor: pointer;
    width: 100%;
    justify-content: flex-start;
  }

  &__inline-edit {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px;
    background: var(--gold-soft);
    border-radius: 4px;

    input { width: 100%; }
  }

  &__add {
    margin-top: 8px;
    width: 100%;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/features/preview/edit-drawer/
git commit -m "feat(web): add edit drawer with chip-based entry editing"
```

---

## Task 10: Exam Result Board Component

**Files:**
- Create: `apps/web/src/app/templates/exam-result/exam-result-board.component.ts`
- Create: `apps/web/src/app/templates/exam-result/exam-result-board.component.html`
- Create: `apps/web/src/app/templates/exam-result/exam-result-board.component.scss`

The design should mirror the style of the reference image (第一張圖): beige/cream background, grid of cards, each card showing subject + school + name + admitted school.

- [ ] **Step 1: Create `exam-result-board.component.ts`**

```ts
import { Component, input } from '@angular/core'
import { CommonModule } from '@angular/common'
import type { ExamResultData } from '@honor/shared-types'

@Component({
  selector: 'app-exam-result-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-result-board.component.html',
  styleUrl: './exam-result-board.component.scss',
})
export class ExamResultBoardComponent {
  readonly data = input.required<ExamResultData>()
}
```

- [ ] **Step 2: Create `exam-result-board.component.html`**

```html
<div class="board">
  <div class="board__inner">
    <header class="board__header">
      <h1 class="board__title">{{ data().title }}</h1>
      @if (data().subtitle) {
        <p class="board__subtitle">{{ data().subtitle }}</p>
      }
    </header>

    <div class="board__grid">
      @for (student of data().students; track $index) {
        <div class="card">
          <div class="card__subject">[ {{ student.subject }} ]</div>
          <div class="card__school">{{ student.juniorHighSchool }}</div>
          <div class="card__name">{{ student.studentName }}</div>
          <div class="card__admitted">{{ student.seniorHighSchool }}</div>
        </div>
      }
    </div>
  </div>
</div>
```

- [ ] **Step 3: Create `exam-result-board.component.scss`**

```scss
.board {
  width: min(1200px, 100%);
  margin: 0 auto;
  background: var(--paper);
  border: 1px solid rgba(101, 75, 43, 0.18);
  box-shadow: 0 18px 42px rgba(68, 49, 27, 0.08);

  &__inner {
    padding: 48px;
  }

  &__header {
    text-align: left;
    margin-bottom: 36px;
  }

  &__title {
    margin: 0;
    font-family: var(--font-serif);
    font-size: clamp(32px, 4vw, 56px);
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--ink);
  }

  &__subtitle {
    margin: 8px 0 0;
    color: var(--muted);
    font-size: 16px;
    letter-spacing: 0.12em;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
  }
}

.card {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(101, 75, 43, 0.12);
  padding: 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__subject {
    font-size: 12px;
    color: var(--muted);
    letter-spacing: 0.1em;
  }

  &__school {
    font-size: 13px;
    color: var(--muted);
  }

  &__name {
    font-family: var(--font-serif);
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--ink);
  }

  &__admitted {
    font-size: 13px;
    color: var(--muted);
    margin-top: 4px;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/templates/exam-result/
git commit -m "feat(web): add exam result board component"
```

---

## Task 11: Class Ranking Board Component

**Files:**
- Create: `apps/web/src/app/templates/class-ranking/class-ranking-board.component.ts`
- Create: `apps/web/src/app/templates/class-ranking/class-ranking-board.component.html`
- Create: `apps/web/src/app/templates/class-ranking/class-ranking-board.component.scss`

The design should mirror the existing HTML template from `/Users/mizokhuangmbp2023/Downloads/yingqiao_honor_board_corrected.html`: gold header for school rankings, green for class rankings, card grid layout with class badges.

- [ ] **Step 1: Create `class-ranking-board.component.ts`**

```ts
import { Component, input, computed } from '@angular/core'
import { CommonModule } from '@angular/common'
import type { ClassRankingData, RankingEntry } from '@honor/shared-types'

@Component({
  selector: 'app-class-ranking-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './class-ranking-board.component.html',
  styleUrl: './class-ranking-board.component.scss',
})
export class ClassRankingBoardComponent {
  readonly data = input.required<ClassRankingData>()

  /** Groups entries by rank so each rank gets its own card */
  readonly schoolByRank = computed(() => this.groupByRank(this.data().schoolRankings))
  readonly classByRank = computed(() => this.groupByRank(this.data().classRankings))

  private groupByRank(entries: RankingEntry[]): Map<number, RankingEntry[]> {
    const map = new Map<number, RankingEntry[]>()
    for (const entry of entries) {
      const arr = map.get(entry.rank) ?? []
      arr.push(entry)
      map.set(entry.rank, arr)
    }
    return map
  }

  protected rankLabel(rank: number): string {
    const labels: Record<number, string> = { 1: '第一名', 2: '第二名', 3: '第三名', 4: '第四名', 5: '第五名', 6: '第六名', 7: '第七名', 8: '第八名', 9: '第九名', 10: '第十名' }
    return labels[rank] ?? `第${rank}名`
  }
}
```

- [ ] **Step 2: Create `class-ranking-board.component.html`**

```html
<div class="board">
  <div class="board__inner">
    <header class="board__hero">
      <p class="board__eyebrow">{{ data().subtitle }}</p>
      <h1 class="board__title">{{ data().title }}</h1>
    </header>

    <!-- School rankings -->
    @if (schoolByRank().size > 0) {
      <section class="board__section">
        <div class="board__section-header">
          <div class="board__section-line"></div>
          <div class="board__section-title board__section-title--gold">校排榮譽</div>
          <div class="board__section-line"></div>
        </div>
        <div class="board__cards">
          @for (rank of schoolByRank().keys(); track rank) {
            <article class="card">
              <div class="card__head card__head--gold">校排{{ rankLabel(rank) }}</div>
              <div class="card__body">
                @for (entry of schoolByRank().get(rank)!; track $index) {
                  <div class="card__entry">
                    <span class="card__class">{{ entry.classNumber }}</span>
                    <span class="card__name">{{ entry.studentName }}</span>
                  </div>
                }
              </div>
            </article>
          }
        </div>
      </section>
    }

    <!-- Class rankings -->
    @if (classByRank().size > 0) {
      <section class="board__section">
        <div class="board__section-header">
          <div class="board__section-line"></div>
          <div class="board__section-title board__section-title--green">班排榮譽</div>
          <div class="board__section-line"></div>
        </div>
        <div class="board__cards">
          @for (rank of classByRank().keys(); track rank) {
            <article class="card">
              <div class="card__head card__head--green">班排{{ rankLabel(rank) }}</div>
              <div class="card__body">
                @for (entry of classByRank().get(rank)!; track $index) {
                  <div class="card__entry">
                    <span class="card__class">{{ entry.classNumber }}</span>
                    <span class="card__name">{{ entry.studentName }}</span>
                  </div>
                }
              </div>
            </article>
          }
        </div>
      </section>
    }

    <div class="board__footer">{{ data().title }}</div>
  </div>
</div>
```

- [ ] **Step 3: Create `class-ranking-board.component.scss`**

```scss
.board {
  width: min(1400px, 100%);
  margin: 0 auto;
  background: linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.82));
  border: 1px solid rgba(101, 75, 43, 0.18);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 18px;
    border: 1px solid rgba(180, 141, 84, 0.28);
    pointer-events: none;
  }

  &__inner { padding: 56px; position: relative; z-index: 1; }

  &__hero { text-align: center; margin-bottom: 36px; }

  &__eyebrow {
    margin: 0 0 8px;
    color: var(--muted);
    font-size: 15px;
    letter-spacing: 0.3em;
  }

  &__title {
    margin: 0;
    font-family: var(--font-serif);
    font-size: clamp(36px, 5vw, 64px);
    font-weight: 700;
    letter-spacing: 0.06em;
  }

  &__section { margin-top: 36px; }

  &__section-header {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 24px;
  }

  &__section-line {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(171, 132, 73, 0.55), transparent);
    flex: 1;
  }

  &__section-title {
    min-width: 200px;
    padding: 10px 24px;
    text-align: center;
    font-size: 24px;
    letter-spacing: 0.14em;
    font-weight: 700;
    clip-path: polygon(6% 0, 94% 0, 100% 50%, 94% 100%, 6% 100%, 0 50%);

    &--gold { color: #4c3208; background: linear-gradient(180deg, #efca74 0%, #d9ac46 100%); }
    &--green { color: #274235; background: linear-gradient(180deg, #c8dbcb 0%, #9cb59d 100%); }
  }

  &__cards {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 18px;

    @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
    @media (max-width: 500px) { grid-template-columns: 1fr; }
  }

  &__footer {
    margin-top: 36px;
    text-align: center;
    color: var(--muted);
    font-size: 15px;
    letter-spacing: 0.1em;
  }
}

.card {
  background: rgba(255,255,255,0.62);
  border: 1px solid rgba(132, 101, 62, 0.14);
  min-height: 180px;

  &__head {
    padding: 10px 14px;
    text-align: center;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.08em;

    &--gold {
      color: #513509;
      background: linear-gradient(180deg, rgba(240,205,122,0.95), rgba(223,177,74,0.92));
    }
    &--green {
      color: #2e493b;
      background: linear-gradient(180deg, rgba(202,220,203,0.95), rgba(167,190,168,0.92));
    }
  }

  &__body { padding: 14px; display: flex; flex-direction: column; gap: 10px; }

  &__entry {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: rgba(255, 251, 244, 0.88);
    border: 1px solid rgba(134, 104, 64, 0.1);
  }

  &__class {
    min-width: 52px;
    padding: 4px 6px;
    text-align: center;
    font-size: 14px;
    font-weight: 700;
    border-radius: 999px;
    color: #fff;
    background: linear-gradient(180deg, #b89a67, #99794a);
    flex-shrink: 0;
  }

  &__name {
    font-size: 24px;
    font-weight: 700;
    font-family: var(--font-serif);
    letter-spacing: 0.06em;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/templates/class-ranking/
git commit -m "feat(web): add class ranking board component"
```

---

## Task 12: Export Service

**Files:**
- Create: `apps/web/src/app/core/export.service.ts`
- Test: `apps/web/src/app/core/export.service.spec.ts`

- [ ] **Step 1: Write failing test**

Create `apps/web/src/app/core/export.service.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExportService } from './export.service'

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    toDataURL: vi.fn().mockReturnValue('data:image/png;base64,abc'),
    width: 800,
    height: 600,
  })
}))

describe('ExportService', () => {
  let service: ExportService

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ExportService] })
    service = TestBed.inject(ExportService)
  })

  it('downloadPng calls html2canvas and triggers download', async () => {
    const el = document.createElement('div')
    const clickSpy = vi.spyOn(HTMLElement.prototype, 'click').mockImplementation(() => {})
    await service.downloadPng(el)
    expect(clickSpy).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx vitest run apps/web/src/app/core/export.service.spec.ts
```

Expected: FAIL

- [ ] **Step 3: Implement `export.service.ts`**

```ts
import { Injectable } from '@angular/core'
import { afterNextRender } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class ExportService {

  async downloadPng(element: HTMLElement): Promise<void> {
    await document.fonts.ready
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(element, { scale: 2, useCORS: true })
    this.triggerDownload(canvas.toDataURL('image/png'), 'honor-board.png')
  }

  async downloadPdf(element: HTMLElement): Promise<void> {
    await document.fonts.ready
    const html2canvas = (await import('html2canvas')).default
    const { jsPDF } = await import('jspdf')

    const canvas = await html2canvas(element, { scale: 2, useCORS: true })
    const imgData = canvas.toDataURL('image/png')

    const orientation = canvas.width > canvas.height ? 'l' : 'p'
    const pdf = new jsPDF({ orientation, unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
    pdf.save('honor-board.pdf')
  }

  async downloadHtml(element: HTMLElement): Promise<void> {
    const styles = Array.from(document.styleSheets)
      .flatMap(sheet => {
        try { return Array.from(sheet.cssRules).map(r => r.cssText) }
        catch { return [] }
      })
      .join('\n')

    const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <title>榮譽榜</title>
  <style>${styles}</style>
</head>
<body>${element.outerHTML}</body>
</html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    this.triggerDownload(URL.createObjectURL(blob), 'honor-board.html')
  }

  private triggerDownload(href: string, filename: string): void {
    const a = document.createElement('a')
    a.href = href
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(href), 1000)
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run apps/web/src/app/core/export.service.spec.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/core/export.service.ts apps/web/src/app/core/export.service.spec.ts
git commit -m "feat(web): add export service for HTML, PDF, and PNG download"
```

---

## Task 13: Skills Setup + CLAUDE.md

**Files:**
- Create: `CLAUDE.md`
- Create: `.claude/settings.json`
- Copy: Skills from clessia

- [ ] **Step 1: Copy skills from clessia**

```bash
mkdir -p .claude/skills
cp -r ../clessia/.claude/skills/angular .claude/skills/
cp -r ../clessia/.claude/skills/angular-best-practices .claude/skills/
cp -r ../clessia/.claude/skills/angular-scss-bem-standards .claude/skills/
cp -r ../clessia/.claude/skills/angular-state-management .claude/skills/
cp -r ../clessia/.claude/skills/angular-ui-patterns .claude/skills/
cp -r ../clessia/.claude/skills/frontend-design .claude/skills/
cp -r ../clessia/.claude/skills/add-icon .claude/skills/
```

- [ ] **Step 2: Create `CLAUDE.md`**

```markdown
# Student Honor Board Generator

榮譽榜產生器 — 補習班考後榮譽榜自動化工具

## Tech Stack

| Layer    | Technology                                          |
|----------|-----------------------------------------------------|
| Frontend | Angular 21 (Standalone + Signals)                   |
| UI       | PrimeNG 21 + PrimeIcons + @primeuix/themes Aura     |
| Backend  | Hono on Cloudflare Workers                          |
| AI       | Gemini API (@google/generative-ai)                  |
| File     | SheetJS (xlsx) for Excel parsing                    |
| Export   | html2canvas + jsPDF (PDF/PNG), DOM serialization (HTML) |
| Deploy   | Cloudflare Pages (web) + Cloudflare Workers (worker)|
| Monorepo | NX                                                  |

## Coding Conventions

### Angular
- Standalone Components only — no NgModules
- Signals for reactive state (`signal`, `computed`, `effect`)
- `inject()` over constructor injection
- `input()` over @Input, `output()` over @Output
- Angular control flow: `@if`, `@for`, `@switch` (NOT *ngIf/*ngFor)
- Lazy load feature components via `loadComponent`

### TypeScript
- `strict: true`
- `readonly` for all non-reassigned properties
- Interface over type alias (except unions)
- `import type` for type-only imports

### CSS/SCSS
- BEM naming: `.block__element--modifier`
- Design tokens in `src/styles.scss`
- Component styles in `.component.scss`

### Naming
- `ng generate` for all Angular artifacts
- Files: `feature-name.component.ts/.html/.scss`

## Template System

To add a new board template:
1. Add schema + prompt to `packages/shared-types/src/templates/<name>/`
2. Add Angular component to `apps/web/src/app/templates/<name>/`
3. Register in `packages/shared-types/src/templates/registry.ts`
4. Add case to `apps/web/src/app/templates/template-outlet.component.ts`

## Commands

```bash
npm run dev          # Start web + worker
npm run dev:web      # Angular dev server (port 4200)
npm run dev:worker   # Wrangler dev (port 8787)
npm test             # Run all tests
```

## Environment

- Worker env: set `GEMINI_API_KEY` in `apps/worker/.dev.vars`
- Web env: `apps/web/src/environments/environment.ts` (dev) / `environment.production.ts` (prod)
```

- [ ] **Step 3: Create `.claude/settings.json`** (copy from clessia, remove unrelated settings)

```json
{
  "model": "claude-sonnet-4-6"
}
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md .claude/
git commit -m "chore: add CLAUDE.md, skills, and Claude settings"
```

---

## Task 14: End-to-End Smoke Test

- [ ] **Step 1: Start both services**

```bash
# Terminal 1
npm run dev:worker

# Terminal 2
npm run dev:web
```

- [ ] **Step 2: Upload a test CSV and verify full flow**

Prepare a CSV file:
```csv
姓名,科目,國中,高中
林○辰,英文,淡江國中,北一女中
張○偉,數學,永和國中,成功高中
```

Open `http://localhost:4200`:
1. Select "大考成績榜"
2. Upload the CSV
3. Click "開始解析"
4. Verify preview shows both students
5. Open edit drawer, modify a name, verify preview updates
6. Download PNG — verify file downloads
7. Download PDF — verify file downloads
8. Download HTML — verify file downloads and opens in browser
9. Click "重新上傳" — verify returns to upload screen

- [ ] **Step 3: Test class ranking CSV**

```csv
類型,名次,班級,姓名
校排,1,805,張耀文
校排,2,801,郭旆綺
班排,1,801,郭旆綺
班排,2,702,曾馷翎
```

Repeat steps 2-9 with "班排榮譽榜" template.

- [ ] **Step 4: Test error handling**

Upload a completely unrelated CSV (e.g., product inventory data). Verify:
- Gemini returns a meaningful error message
- "重試" or "重新上傳" button is shown
- User can upload a different file

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final smoke test verified, ready for deployment"
```

---

## Deployment Checklist (After Implementation)

- [ ] Run `npx wrangler deploy` from `apps/worker/` — note the Worker URL
- [ ] Update `apps/web/src/environments/environment.production.ts` with the Worker URL
- [ ] Connect GitHub repo to Cloudflare Pages, set build command: `npx ng build web --configuration=production`, output dir: `dist/apps/web`
- [ ] Set `GEMINI_API_KEY` as a secret in Cloudflare Workers dashboard (`wrangler secret put GEMINI_API_KEY`)
- [ ] Set `WEB_URL` in Worker vars to the Cloudflare Pages URL (for CORS)
