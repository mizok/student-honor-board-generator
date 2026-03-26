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
Two sections: 校排 (school ranking) and 班排 (class ranking)

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
1. User selects template + uploads CSV/Excel
          ↓
2. [Worker] reads file content + loads template schema & prompt
          ↓
3. [Gemini API] (low-tier model) parses data
          ↓
4. Gemini returns:
   Success → { success: true, data: <validated JSON> }
   Failure → { success: false, message: "<human-readable explanation>" }
          ↓
5. [Frontend] renders template component (full-screen preview)
   OR displays error message with "re-upload" button
          ↓
6. User edits via Drawer (optional)
          ↓
7. User downloads (client-side generation)
```

---

## API Contract

### POST `/api/parse`

**Request:**
```ts
{
  templateId: string,   // e.g. "exam-result" | "class-ranking"
  fileContent: string,  // base64-encoded CSV/Excel content
  fileName: string      // used to determine file type
}
```

**Response (success):**
```ts
{
  success: true,
  data: object          // validated against template Zod schema
}
```

**Response (failure):**
```ts
{
  success: false,
  message: string       // human-readable explanation from Gemini
}
```

---

## Frontend UI

### Tech Stack
- Angular 21 + Signals
- PrimeNG 21 (components: `p-stepper`, `p-fileUpload`, `p-drawer`, `p-select`)
- RxJS
- SCSS + BEM conventions (same as clessia)

### Stepper Flow

**Step 1 — Select & Upload**
- `p-select` dropdown to choose template type
- Large drag-and-drop upload area (`p-fileUpload`), accepts `.csv`, `.xlsx`, `.xls`
- "開始解析" button → triggers API call → shows loading spinner

**Step 2 — Full-Screen Preview**
- Honor board renders full-width, exactly as it will be exported
- Thin top toolbar:
  - Left: "← 重新上傳" button
  - Right: "✏️ 編輯" button + "下載 ▾" dropdown (HTML / PDF / PNG)
- Error state: full-screen error message showing Gemini's explanation + "重新上傳" button

**Step 3 — Edit Drawer (optional)**
- Slides in from right, does not cover the preview
- Each student entry shown as a chip
- Click chip → edit name/class inline
- ✕ on chip → delete entry
- "＋ 新增" button at bottom
- Preview updates in real-time as edits are made

---

## Export

All exports are client-side (no additional API calls).

| Format | Library | Notes |
|--------|---------|-------|
| HTML | Native DOM serialization | Inline CSS only. Small note shown: "字型可能因瀏覽器環境而異，字型資訊可能會在部分裝置上無法完整顯示" |
| PDF | `html2pdf.js` | Rasterized (html2canvas internally). Fonts preserved visually. Text not selectable. |
| PNG | `html2canvas` | `scale: 2` for 2x high-DPI output. Fonts preserved (loaded in browser at capture time). |

**Font handling:**
- Google Fonts load normally in the browser → captured correctly in PDF and PNG
- HTML export does NOT embed fonts (file size concern). Warning note displayed in UI.
- Before capture: await `document.fonts.ready` to ensure fonts are loaded

---

## Error Handling

- **Gemini parse failure:** Display Gemini's `message` string directly in the UI. Provide "重新上傳" button.
- **File format not supported:** Frontend validation before upload — reject files that aren't `.csv`, `.xlsx`, `.xls`.
- **Network error:** Show generic retry message.
- **Export failure:** Show inline error toast (PrimeNG `p-toast`).

---

## Skills to Copy from Clessia

- `angular`
- `angular-best-practices`
- `angular-scss-bem-standards`
- `angular-state-management`
- `angular-ui-patterns`
- `frontend-design`
- `add-icon`

---

## Out of Scope

- Authentication (no login required)
- Saving/history of past boards
- Server-side export (PDF/PNG generated client-side only)
- Embedding Google Fonts in HTML export
