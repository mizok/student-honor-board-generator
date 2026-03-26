import { ZodSchema } from 'zod'
import { examResultSchema } from './exam-result/schema'
import { examResultCsvTemplate, parseExamResultCsv } from './exam-result/parseCsv'
import { classRankingSchema } from './class-ranking/schema'
import { classRankingCsvTemplate, parseClassRankingCsv } from './class-ranking/parseCsv'

export interface TemplateColumn {
  /** Internal key used in CSV parsing */
  readonly key: string
  /** Chinese label shown in the xlsx header row */
  readonly label: string
  /** Short hint shown below the header */
  readonly hint: string
  /** Example value shown in the example row */
  readonly example: string
}

export interface TemplateDefinition {
  readonly id: string
  readonly label: string
  readonly schema: ZodSchema
  /** CSV template content for users to download and fill in */
  readonly csvTemplate: string
  /** Converts pre-split CSV rows directly into schema-compatible data (no LLM) */
  readonly parseCsv: (rows: string[][]) => unknown
  /** Column definitions used to generate the xlsx template */
  readonly columns: TemplateColumn[]
  /** Multiple example rows shown in the xlsx template */
  readonly exampleRows: Record<string, string>[]
  /** Pre-filled sample data; lets users skip file upload and start editing immediately */
  readonly defaultData: unknown
}

export const TEMPLATE_REGISTRY: Readonly<Record<string, TemplateDefinition>> = {
  'exam-result': {
    id: 'exam-result',
    label: '大考成績榜',
    schema: examResultSchema,
    csvTemplate: examResultCsvTemplate,
    parseCsv: parseExamResultCsv,
    columns: [
      { key: 'subject',          label: '科目',     hint: '如：英文、數學',          example: '英文' },
      { key: 'juniorHighSchool', label: '國中名稱', hint: '學生就讀的國中',           example: '鶯歌國中' },
      { key: 'studentName',      label: '學生姓名', hint: '學生全名',                 example: '王小明' },
      { key: 'seniorHighSchool', label: '錄取學校', hint: '錄取的高中或大學名稱',     example: '建國高中' },
    ],
    exampleRows: [
      { subject: '英文', juniorHighSchool: '鶯歌國中', studentName: '王小明', seniorHighSchool: '建國高中' },
      { subject: '數學', juniorHighSchool: '三峽國中', studentName: '李小華', seniorHighSchool: '師大附中' },
    ],
    defaultData: {
      title: '113學年度大考成績榜',
      subtitle: '恭賀同學金榜題名',
      students: [
        { subject: '英文', juniorHighSchool: '鶯歌國中', studentName: '王○明', seniorHighSchool: '建國高中' },
        { subject: '英文', juniorHighSchool: '三峽國中', studentName: '李○華', seniorHighSchool: '北一女中' },
        { subject: '英文', juniorHighSchool: '鶯歌國中', studentName: '陳○文', seniorHighSchool: '師大附中' },
        { subject: '數學', juniorHighSchool: '鶯歌國中', studentName: '張○雯', seniorHighSchool: '中山女高' },
        { subject: '數學', juniorHighSchool: '三峽國中', studentName: '林○宏', seniorHighSchool: '成功高中' },
        { subject: '數學', juniorHighSchool: '鶯歌國中', studentName: '吳○佳', seniorHighSchool: '景美女中' },
        { subject: '自然', juniorHighSchool: '三峽國中', studentName: '黃○勝', seniorHighSchool: '武陵高中' },
        { subject: '自然', juniorHighSchool: '鶯歌國中', studentName: '劉○芳', seniorHighSchool: '台中一中' },
      ],
    },
  },
  'class-ranking': {
    id: 'class-ranking',
    label: '班排榮譽榜',
    schema: classRankingSchema,
    csvTemplate: classRankingCsvTemplate,
    parseCsv: parseClassRankingCsv,
    columns: [
      { key: 'type',        label: '類型', hint: '填 school（校排）或 class（班排）', example: 'school' },
      { key: 'rank',        label: '名次', hint: '數字，如：1、2、3',                 example: '1' },
      { key: 'classNumber', label: '班級', hint: '班級號碼，如：805',                 example: '805' },
      { key: 'studentName', label: '姓名', hint: '學生全名',                           example: '張耀文' },
    ],
    exampleRows: [
      { type: 'school', rank: '1', classNumber: '805', studentName: '張耀文' },
      { type: 'school', rank: '2', classNumber: '901', studentName: '陳映如' },
      { type: 'class',  rank: '1', classNumber: '805', studentName: '李小明' },
      { type: 'class',  rank: '2', classNumber: '901', studentName: '王大華' },
    ],
    defaultData: {
      title: '113學年度第一學期班排榮譽榜',
      subtitle: '恭賀同學努力有成',
      schoolRankings: [
        { rank: 1,  classNumber: '805', studentName: '張○文' },
        { rank: 2,  classNumber: '901', studentName: '陳○如' },
        { rank: 3,  classNumber: '803', studentName: '林○宏' },
        { rank: 4,  classNumber: '902', studentName: '吳○佳' },
        { rank: 5,  classNumber: '805', studentName: '黃○勝' },
        { rank: 6,  classNumber: '801', studentName: '劉○芳' },
      ],
      classRankings: [
        { rank: 1, classNumber: '805', studentName: '張○文' },
        { rank: 2, classNumber: '805', studentName: '王○明' },
        { rank: 1, classNumber: '901', studentName: '陳○如' },
        { rank: 2, classNumber: '901', studentName: '李○華' },
        { rank: 1, classNumber: '803', studentName: '林○宏' },
        { rank: 2, classNumber: '803', studentName: '周○雯' },
      ],
    },
  },
}

export const TEMPLATE_IDS = Object.keys(TEMPLATE_REGISTRY) as (keyof typeof TEMPLATE_REGISTRY)[]
