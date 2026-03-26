import type { ClassRankingData } from './schema'

export const classRankingCsvTemplate = `title,在此填入榮譽榜標題
subtitle,副標題（選填，可留空）
type,rank,classNumber,studentName
school,1,805,張耀文
school,2,901,陳映如
class,1,805,李小明
class,2,901,王大華
`.trimEnd()

/**
 * Parses a user-filled CSV (rows already split into string[][]) into ClassRankingData.
 * Expected format:
 *   Row: title,<value>
 *   Row: subtitle,<value>
 *   Header row: type,rank,classNumber,studentName
 *   Data rows: school|class,<rank>,<classNumber>,<studentName>
 */
export function parseClassRankingCsv(rows: string[][]): ClassRankingData {
  let title = ''
  let subtitle = ''
  const schoolRankings: ClassRankingData['schoolRankings'] = []
  const classRankings: ClassRankingData['classRankings'] = []

  for (const row of rows) {
    if (!row.length || row.every(c => c.trim() === '')) continue
    const key = row[0]?.trim().toLowerCase()

    if (key === 'title' || key === '榮譽榜標題') { title = row[1]?.trim() ?? ''; continue }
    if (key === 'subtitle' || key === '副標題（選填）') { subtitle = row[1]?.trim() ?? ''; continue }
    if (key === 'type' || key.startsWith('類型')) continue // header row

    if (key !== 'school' && key !== 'class') continue

    const rank = parseInt(row[1]?.trim() ?? '', 10)
    const classNumber = row[2]?.trim() ?? ''
    const studentName = row[3]?.trim() ?? ''
    if (!rank || !studentName) continue
    const entry = { rank, classNumber, studentName }
    if (key === 'school') schoolRankings.push(entry)
    else classRankings.push(entry)
  }

  return { title, subtitle, schoolRankings, classRankings }
}
