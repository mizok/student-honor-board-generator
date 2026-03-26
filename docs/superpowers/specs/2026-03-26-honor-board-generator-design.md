# Student Honor Board Generator — Design Spec

**Date:** 2026-03-26
**Project:** student-honor-board-generator
**Status:** Approved

---

## Overview

A web tool for a cram school director (non-technical user) to generate printable honor boards from CSV/Excel data. The user uploads a file, AI parses it into structured data, a live preview is shown full-screen, and she can download the result as HTML, PDF, or PNG.

Two board types supported at launch, with an extensible template system for future additions.

---

## Board Types

### 1. 大考成績榜 (Exam Results Board)
Used after major external exams (e.g. 學測). Shows students by subject, with their junior high school and admitted senior high school.

Data per entry: `subject` + `juniorHighSchool` + `studentName` + `seniorHighSchool`

### 2. 班排榮譽榜 (Class Ranking Board)
Used after internal cram school tests. Shows school-wide rankings and per-class rankings.

Data per entry: `rank` + `classNumber` + `studentName`
Two sections: 校排 (school ranking) and 班排 (class ranking).
`rank` is explicitly stored per entry and not auto-calculated — it can be manually set in the editor.

---

## Architecture

### NX Monorepo (mirrors clessia structure)

```
student-honor-board-generator/
  apps/
    web/          # Angular 21 frontend → Cloudflare Pages
    worker/       # Hono API → Cloudflare Workers
  packages/
    shared-types/ # Shared TypeScript types, Zod schemas, template definitions
```

### Deployment
- **Frontend:** Cloudflare Pages
- **Backend:** Cloudflare Workers (Hono)
- **Gemini API key:** stored in Worker environment variables, never exposed to frontend
- **CORS:** Worker sets `Access-Control-Allow-Origin` headers to allow requests from the Pages domain

---

## Template System

Each template is a self-contained unit. Adding a new template requires no changes to existing code.

### Shared package structure (`packages/shared-types/templates/`)
```
registry.ts          ← master list of all templates
exam-result/
  schema.ts          ← Zod schema defining expected JSON structure
  prompt.ts          ← Gemini prompt instructing how to parse CSV/Excel into this schema
class-ranking/
  schema.ts
  prompt.ts
```

### Registry shape (`registry.ts`)
```ts
export interface TemplateDefinition {
  id: string
  label: string           // display name shown in dropdown
  schema: ZodSchema       // used by Worker to validate Gemini output
  prompt: string          // sent to Gemini with the CSV text
}

export const TEMPLATE_REGISTRY: Record<string, TemplateDefinition> = {
  'exam-result': { ... },
  'class-ranking': { ... },
}
```

The frontend imports `TEMPLATE_REGISTRY` to populate the `p-select` dropdown. The Worker imports it to look up the correct schema and prompt by `templateId`.

### Frontend structure (`apps/web/src/templates/`)
```
exam-result/
  component.ts       ← Angular component that renders the board
class-ranking/
  component.ts
```

### Adding a new template (checklist)
1. Add `schema.ts` + `prompt.ts` in `packages/shared-types/templates/<name>/`
2. Add `component.ts` in `apps/web/src/templates/<name>/`
3. Register in `packages/shared-types/templates/registry.ts`

---

## Data Flow

```
1. User selects template + uploads CSV/Excel (max 5 MB)
          ↓
2. [Frontend] validates file size & type, encodes as base64, sends to Worker
          ↓
3. [Worker] decodes base64 → converts to CSV text using SheetJS (xlsx)
           (CSV/Excel → plain text rows, so Gemini can process it as text)
          ↓
4. [Worker] builds Gemini prompt: template.prompt + CSV text
          ↓
5. [Gemini API] (low-tier model) returns JSON string
          ↓
6. [Worker] attempts to parse + validate Gemini output against template Zod schema
          ↓
   Validation passes → return { success: true, data: <typed, validated object> }
   Validation fails  → return { success: false, message: <Zod error summary as human-readable text> }
   Gemini signals failure (returns explanation instead of JSON) → { success: false, message: <Gemini's explanation> }
   Gemini API HTTP error → { success: false, message: "AI 服務暫時無法使用，請稍後再試" }
          ↓
7. [Frontend] renders template component full-screen (success)
   OR displays error message + "重新上傳" button (failure)
          ↓
8. User edits via Drawer (optional)
          ↓
9. User downloads (client-side generation)
```

---

## Worker: File Parsing Detail

- File arrives as base64-encoded binary (`fileContent`) with the original file name (`fileName`)
- Worker determines file type from `fileName` extension
- `.csv` → decode base64 → UTF-8 text directly
- `.xlsx` / `.xls` → decode base64 → parse with **SheetJS (`xlsx`)** → convert first sheet to CSV string
- The resulting CSV string is embedded in the Gemini prompt
- SheetJS is already a dependency in the clessia monorepo

---

## API Contract

### POST `/api/parse`

**Request:**
```ts
{
  templateId: string,   // e.g. "exam-result" | "class-ranking"
  fileContent: string,  // base64-encoded file content
  fileName: string      // used to determine file type (.csv / .xlsx / .xls)
}
```

**File size limit:** 5 MB enforced on both frontend (before upload) and Worker (guard at request entry).

**Response (success):**
```ts
{
  success: true,
  data: ExamResultData | ClassRankingData   // typed per template schema, validated by Zod
}
```

**Response (failure — any of three modes):**
```ts
{
  success: false,
  message: string   // human-readable, displayed directly to user
}
```

Failure modes:
1. **Gemini returns explanation text instead of JSON** — Worker detects non-JSON response, wraps as `message`
2. **Zod validation fails** — Worker formats Zod error into a plain-language `message`
3. **Gemini API HTTP error** — Worker catches and returns a generic `message`

---

## Frontend UI

### Tech Stack
- Angular 21 + Signals
- PrimeNG 21 (components: `p-fileUpload`, `p-drawer`, `p-select`, `p-toast`)
- RxJS
- SCSS + BEM conventions (same as clessia)

### UI State Machine (not a PrimeNG stepper)

The UI is modelled as a state machine with two states, not a linear stepper:

```
UPLOAD state → (on success) → PREVIEW state
PREVIEW state → (on "重新上傳") → UPLOAD state
PREVIEW state → (drawer toggle) → PREVIEW state with drawer open
```

**UPLOAD state**
- `p-select` dropdown to choose template type
- Large drag-and-drop upload area (`p-fileUpload`), accepts `.csv`, `.xlsx`, `.xls`
- Frontend validates: file type and file size ≤ 5 MB before sending
- "開始解析" button → triggers API call → shows loading spinner
- If API returns failure: show error message inline + "重試" button

**PREVIEW state**
- Honor board renders full-width, exactly as it will be exported
- Thin top toolbar:
  - Left: "← 重新上傳" button (returns to UPLOAD state)
  - Right: "✏️ 編輯" button + "下載 ▾" dropdown (HTML / PDF / PNG)

**Edit Drawer (overlays PREVIEW state)**
- `p-drawer` slides in from right
- When drawer opens, the main preview area shrinks horizontally (CSS grid: `preview | drawer` side by side), so the preview remains visible
- When drawer closes, preview returns to full width
- Drawer content differs by template:
  - **exam-result:** flat list of chips, one per student entry
  - **class-ranking:** two labeled sections ("校排" / "班排"), each with its own list of chips; rank value is shown on the chip and can be edited inline
- Chip interactions (both templates):
  - Click chip → inline edit (name, class, and rank where applicable)
  - ✕ on chip → delete entry
  - "＋ 新增" button at bottom of each section
- Preview re-renders in real-time as edits are made (Angular Signals)

---

## Export

All exports are client-side (no additional API calls).

| Format | Library | Notes |
|--------|---------|-------|
| HTML | Native DOM serialization | Inline CSS only. Warning tooltip on button: "下載的 HTML 檔案不含字型，在不同裝置上字型可能顯示不同" |
| PDF | `html2canvas` + `jsPDF` | Rasterized image embedded in PDF. Fonts preserved visually. Text not selectable. |
| PNG | `html2canvas` | `scale: 2` for 2x high-DPI output. Fonts preserved visually. |

Note: `html2pdf.js` is not used because it is unmaintained. `html2canvas` + `jsPDF` are used directly instead.

**Font handling:**
- Google Fonts load normally in the browser → captured correctly in PDF and PNG exports
- HTML export does NOT embed fonts. Warning shown as tooltip on the HTML download button.
- Before any canvas capture: `await document.fonts.ready` called inside `afterNextRender()` to ensure Angular has finished rendering and fonts are fully loaded before `html2canvas` runs

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| File type not supported | Frontend rejects before upload, shows inline message |
| File size > 5 MB | Frontend rejects before upload (measured as original file size before base64 encoding), shows inline message |
| Gemini cannot map data to schema | Worker returns `{ success: false, message }`, shown with "重新上傳" button (same file will likely fail again) |
| Gemini API HTTP error / network error | Worker returns `{ success: false, message }`, shown with "重試" button (transient error, retry same file) |
| Export failure | `p-toast` error notification |

**File size limit implementation detail:**
- Frontend validates against original file size (what the user sees in Finder) — limit is 5 MB
- Worker guard accepts up to 6.7 MB of request body (5 MB × 1.33 base64 expansion factor)

---

## Skills to Copy from Clessia

```bash
cp -r ../clessia/.claude/skills/angular .claude/skills/
cp -r ../clessia/.claude/skills/angular-best-practices .claude/skills/
cp -r ../clessia/.claude/skills/angular-scss-bem-standards .claude/skills/
cp -r ../clessia/.claude/skills/angular-state-management .claude/skills/
cp -r ../clessia/.claude/skills/angular-ui-patterns .claude/skills/
cp -r ../clessia/.claude/skills/frontend-design .claude/skills/
cp -r ../clessia/.claude/skills/add-icon .claude/skills/
```

---

## Out of Scope

- Authentication (no login required)
- Saving/history of past boards
- Server-side export (PDF/PNG generated client-side only)
- Embedding Google Fonts in HTML export
- Text-selectable PDF output
