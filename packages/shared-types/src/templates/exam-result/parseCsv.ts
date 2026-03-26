import type { ExamResultData } from './schema'

export const examResultCsvTemplate = `title,在此填入榮譽榜標題
subtitle,副標題（選填，可留空）
subject,juniorHighSchool,studentName,seniorHighSchool
英文,鶯歌國中,王小明,建中
數學,鶯歌國中,李小華,師大附中
`.trimEnd()

/**
 * Parses a user-filled CSV (rows already split into string[][]) into ExamResultData.
 * Expected format:
 *   Row: title,<value>
 *   Row: subtitle,<value>
 *   Header row: subject,juniorHighSchool,studentName,seniorHighSchool
 *   Data rows: <subject>,<juniorHighSchool>,<studentName>,<seniorHighSchool>
 */
export function parseExamResultCsv(rows: string[][]): ExamResultData {
  let title = ''
  let subtitle = ''
  const students: ExamResultData['students'] = []

  for (const row of rows) {
    if (!row.length || row.every(c => c.trim() === '')) continue
    const key = row[0]?.trim().toLowerCase()

    if (key === 'title' || key === '榮譽榜標題') { title = row[1]?.trim() ?? ''; continue }
    if (key === 'subtitle' || key === '副標題（選填）') { subtitle = row[1]?.trim() ?? ''; continue }
    if (key === 'subject' || key.startsWith('科目') || key === '學生姓名') continue // header row

    const subject = row[0]?.trim() ?? ''
    const juniorHighSchool = row[1]?.trim() ?? ''
    const studentName = row[2]?.trim() ?? ''
    const seniorHighSchool = row[3]?.trim() ?? ''
    if (!studentName) continue
    students.push({ subject, juniorHighSchool, studentName, seniorHighSchool })
  }

  return { title, subtitle, students }
}
