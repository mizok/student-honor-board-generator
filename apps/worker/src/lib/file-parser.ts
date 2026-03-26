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
    const firstSheetName = workbook.SheetNames[0]

    if (!firstSheetName) {
      throw new Error('Excel 檔案沒有可用的工作表')
    }

    const firstSheet = workbook.Sheets[firstSheetName]

    if (!firstSheet) {
      throw new Error('Excel 工作表內容為空')
    }

    return XLSX.utils.sheet_to_csv(firstSheet)
  }

  throw new Error(`不支援的檔案格式：.${ext ?? 'unknown'}`)
}
