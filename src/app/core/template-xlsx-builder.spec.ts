import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { buildTemplateXlsx } from './template-xlsx-builder'
import { TEMPLATE_REGISTRY } from './templates/registry'

describe('buildTemplateXlsx', () => {
  it('includes a tagline row in the exam-result workbook template', async () => {
    const blob = buildTemplateXlsx(TEMPLATE_REGISTRY['exam-result'])
    const workbook = XLSX.read(await blob.arrayBuffer(), { type: 'array' })
    const worksheet = workbook.Sheets['填寫資料']

    expect(worksheet['A4']?.v).toBe('裝飾文字（選填）')
    expect(worksheet['B4']?.v).toBe('如：耀・煜・傳・會，可留空')
    expect(worksheet['A5']?.v).toBe('標籤\n如：英文、數學、藝術')
  })
})
