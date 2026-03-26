import type { ExamResultData } from './schema';

export const examResultCsvTemplate = `title,在此填入榮譽榜標題
subtitle,副標題（選填，可留空）
tagline,裝飾文字（選填，可留空）
tag,school,studentName,description,highlight
英文,鶯歌國中,王小明,建中,
數學,鶯歌國中,李小華,師大附中,是
`.trimEnd();

/**
 * Parses a user-filled CSV (rows already split into string[][]) into ExamResultData.
 * Expected format:
 *   Row: title,<value>
 *   Row: subtitle,<value>
 *   Row: tagline,<value>
 *   Header row: tag,school,studentName,description
 *   Data rows: <tag>,<school>,<studentName>,<description>
 */
export function parseExamResultCsv(rows: string[][]): ExamResultData {
  let title = '';
  let subtitle = '';
  let tagline = '';
  const students: ExamResultData['students'] = [];

  for (const row of rows) {
    if (!row.length || row.every((c) => c.trim() === '')) continue;
    const key = row[0]?.trim().toLowerCase();

    if (key === 'title' || key === '榮譽榜標題') {
      title = row[1]?.trim() ?? '';
      continue;
    }
    if (key === 'subtitle' || key === '副標題（選填）') {
      subtitle = row[1]?.trim() ?? '';
      continue;
    }
    if (key === 'tagline' || key === '裝飾文字') {
      tagline = row[1]?.trim() ?? '';
      continue;
    }
    if (key === 'tag' || key.startsWith('標籤') || key === '學生姓名') continue; // header row

    const tag = row[0]?.trim() ?? '';
    const school = row[1]?.trim() ?? '';
    const studentName = row[2]?.trim() ?? '';
    const description = row[3]?.trim() ?? '';
    const highlightRaw = row[4]?.trim().toLowerCase() ?? '';
    const highlight = highlightRaw === '是' || highlightRaw === 'true' || highlightRaw === '1';
    if (!studentName) continue;
    students.push({ tag, school, studentName, description, highlight });
  }

  return { title, subtitle, tagline, students };
}
