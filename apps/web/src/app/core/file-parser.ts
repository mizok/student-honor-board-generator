import * as XLSX from 'xlsx'

/**
 * Parses a File (xlsx / xls / csv) into a 2D array of strings.
 * Runs entirely in the browser — no server round-trip needed.
 */
export async function parseFileToRows(file: File): Promise<string[][]> {
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (!['csv', 'xlsx', 'xls'].includes(ext ?? '')) {
    throw new Error(`不支援的檔案格式：.${ext ?? 'unknown'}`)
  }

  const buffer = await file.arrayBuffer()

  if (ext === 'csv') {
    const text = new TextDecoder('utf-8').decode(buffer)
    const workbook = XLSX.read(text, { type: 'string' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]!]
    if (!sheet) throw new Error('CSV 內容為空')
    return XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' })
  }

  const workbook = XLSX.read(buffer, { type: 'array' })
  if (!workbook.SheetNames.length) throw new Error('Excel 檔案沒有可用的工作表')

  const sheet = workbook.SheetNames
    .map(name => workbook.Sheets[name])
    .find(s => s?.['!ref'])
  if (!sheet) throw new Error('Excel 工作表內容為空')

  return XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' })
}
