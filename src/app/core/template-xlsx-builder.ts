import * as XLSX from 'xlsx'
import type { TemplateDefinition } from '@honor/shared-types'

const COLOR = {
  instruction: 'D9E1F2', // 淡藍
  metaLabel:   'F2F2F2', // 淺灰
  header:      '2E4057', // 深藍（欄位標題列）
  hint:        'D6DCE4', // 淺藍灰（提示列）
  example:     'EBF5E8', // 淺綠（範例資料）
}

function cell(v: string, bold = false, bg?: string, fontColor = '000000', italic = false): XLSX.CellObject {
  const s: Record<string, unknown> = {
    font: { bold, color: { rgb: fontColor }, italic },
    alignment: { vertical: 'center', wrapText: true },
  }
  if (bg) s['fill'] = { fgColor: { rgb: bg }, patternType: 'solid' }
  return { v, t: 's', s }
}

/**
 * Generates a styled xlsx workbook for the given template.
 * The workbook has one sheet with:
 *   Row 1  – instruction banner
 *   Row 2  – title input row
 *   Row 3  – subtitle input row
 *   Row 4  – column headers (hint shown as second line within cell)
 *   Row 5+ – example data rows
 */
export function buildTemplateXlsx(template: TemplateDefinition): Blob {
  const wb = XLSX.utils.book_new()
  const ws: XLSX.WorkSheet = {}

  const colCount = template.columns.length
  const colKeys = template.columns.map(c => c.key)

  // --- Row 1: instruction banner ---
  ws['A1'] = cell('📋  填寫說明：請依格式填入資料，完成後儲存並上傳此檔案（請勿修改第 1～5 列的欄位結構）', true, COLOR.instruction, '1F3864')
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } }]

  // --- Row 2: title ---
  ws['A2'] = cell('榮譽榜標題', true, COLOR.metaLabel)
  ws['B2'] = cell('在此填入榮譽榜標題', false, 'FFFDE7', '999999', true)
  // merge B2 to last col
  if (colCount > 2) {
    ws['!merges'].push({ s: { r: 1, c: 1 }, e: { r: 1, c: colCount - 1 } })
  }

  // --- Row 3: subtitle ---
  ws['A3'] = cell('副標題（選填）', false, COLOR.metaLabel)
  ws['B3'] = cell('可留空', false, 'FFFDE7', '999999', true)
  if (colCount > 2) {
    ws['!merges'].push({ s: { r: 2, c: 1 }, e: { r: 2, c: colCount - 1 } })
  }

  // --- Row 4: column headers (with hint as second line) ---
  template.columns.forEach((col, i) => {
    const addr = XLSX.utils.encode_cell({ r: 3, c: i })
    ws[addr] = {
      v: `${col.label}\n${col.hint}`,
      t: 's',
      s: {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: COLOR.header }, patternType: 'solid' },
        alignment: { vertical: 'center', wrapText: true },
      },
    }
  })

  // --- Row 5+: example rows ---
  template.exampleRows.forEach((row, ri) => {
    colKeys.forEach((key, ci) => {
      const addr = XLSX.utils.encode_cell({ r: 4 + ri, c: ci })
      ws[addr] = cell(row[key] ?? '', false, COLOR.example)
    })
  })

  // --- Col widths ---
  ws['!cols'] = template.columns.map(col => ({ wch: Math.max(col.label.length * 2 + 4, 14) }))

  ws['!rows'] = [
    { hpt: 36 }, // row 1: instruction
    { hpt: 24 }, // row 2: title
    { hpt: 24 }, // row 3: subtitle
    { hpt: 40 }, // row 4: headers + hints (two lines)
  ]

  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: 3 + template.exampleRows.length, c: colCount - 1 },
  })

  XLSX.utils.book_append_sheet(wb, ws, '填寫資料')

  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx', cellStyles: true })
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
