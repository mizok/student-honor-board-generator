import { TEMPLATE_IDS } from './templates/registry'

export type TemplateId = (typeof TEMPLATE_IDS)[number]

export interface TemplateFontRoleDefinition {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly cssVar: string
  readonly defaultValue: number
  readonly options: readonly number[]
}

export interface TemplateThemeTokens {
  readonly '--template-board-bg': string
  readonly '--template-board-surface': string
  readonly '--template-board-surface-soft': string
  readonly '--template-board-border': string
  readonly '--template-board-border-strong': string
  readonly '--template-board-text': string
  readonly '--template-board-muted': string
  readonly '--template-board-subtitle': string
  readonly '--template-board-shadow': string
  readonly '--template-card-bg': string
  readonly '--template-card-border': string
  readonly '--template-card-shadow': string
  readonly '--template-card-surface': string
  readonly '--template-card-surface-border': string
  readonly '--template-card-divider': string
  readonly '--template-primary-start': string
  readonly '--template-primary-end': string
  readonly '--template-primary-text': string
  readonly '--template-primary-border': string
  readonly '--template-primary-soft': string
  readonly '--template-secondary-start': string
  readonly '--template-secondary-end': string
  readonly '--template-secondary-text': string
  readonly '--template-secondary-border': string
  readonly '--template-secondary-soft': string
  readonly '--template-pill-start': string
  readonly '--template-pill-end': string
  readonly '--template-pill-text': string
}

export interface TemplateThemeDefinition {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly previewColors: readonly string[]
  readonly tokens: TemplateThemeTokens
}

export interface TemplateStyleDefinition {
  readonly id: TemplateId
  readonly label: string
  readonly defaultThemeId: string
  readonly fontRoles: readonly TemplateFontRoleDefinition[]
  readonly themes: readonly TemplateThemeDefinition[]
}

const FONT_SIZE_OPTIONS = [12, 14, 16, 18, 20, 24, 28, 32] as const
const LARGE_FONT_SIZE_OPTIONS = [16, 18, 20, 24, 28, 32] as const

const EXAM_RESULT_FONT_ROLES: readonly TemplateFontRoleDefinition[] = [
  {
    id: 'header-bracket',
    label: '裝飾文字',
    description: '頁首中括號內的短句或校訓感標語。',
    cssVar: '--template-header-bracket-size',
    defaultValue: 14,
    options: FONT_SIZE_OPTIONS,
  },
  {
    id: 'board-title',
    label: '主標題',
    description: '整張榮譽榜最主要的標題文字。',
    cssVar: '--template-board-title-size',
    defaultValue: 24,
    options: LARGE_FONT_SIZE_OPTIONS,
  },
  {
    id: 'board-subtitle',
    label: '副標題',
    description: '主標題下方的補充說明與祝賀文字。',
    cssVar: '--template-board-subtitle-size',
    defaultValue: 16,
    options: FONT_SIZE_OPTIONS,
  },
  {
    id: 'card-tag',
    label: '卡片標籤',
    description: '卡片頂端的小標籤，例如科目或分類。',
    cssVar: '--template-card-tag-size',
    defaultValue: 12,
    options: FONT_SIZE_OPTIONS,
  },
  {
    id: 'card-school',
    label: '卡片學校',
    description: '學生姓名上方的學校名稱。',
    cssVar: '--template-card-school-size',
    defaultValue: 12,
    options: FONT_SIZE_OPTIONS,
  },
  {
    id: 'card-name',
    label: '卡片姓名',
    description: '卡片中最醒目的學生姓名。',
    cssVar: '--template-card-name-size',
    defaultValue: 30,
    options: LARGE_FONT_SIZE_OPTIONS,
  },
  {
    id: 'card-description',
    label: '卡片描述',
    description: '卡片底部的錄取學校或補充資訊。',
    cssVar: '--template-card-description-size',
    defaultValue: 14,
    options: FONT_SIZE_OPTIONS,
  },
]

const CLASS_RANKING_FONT_ROLES: readonly TemplateFontRoleDefinition[] = [
  {
    id: 'board-eyebrow',
    label: '抬頭文字',
    description: '主標題上方的短句或抬頭說明。',
    cssVar: '--template-board-eyebrow-size',
    defaultValue: 16,
    options: FONT_SIZE_OPTIONS,
  },
  {
    id: 'board-title',
    label: '主標題',
    description: '整張榜單最主要的標題文字。',
    cssVar: '--template-board-title-size',
    defaultValue: 24,
    options: LARGE_FONT_SIZE_OPTIONS,
  },
  {
    id: 'badge-label',
    label: '章節徽章',
    description: '校排榮譽、班排榮譽這類章節徽章。',
    cssVar: '--template-badge-label-size',
    defaultValue: 26,
    options: LARGE_FONT_SIZE_OPTIONS,
  },
  {
    id: 'section-subtitle',
    label: '章節英文副標',
    description: '每個章節下方的英文副標題。',
    cssVar: '--template-section-title-size',
    defaultValue: 16,
    options: FONT_SIZE_OPTIONS,
  },
  {
    id: 'card-head',
    label: '卡片標題',
    description: '每張排名卡片頂部的第幾名標題。',
    cssVar: '--template-card-head-size',
    defaultValue: 22,
    options: LARGE_FONT_SIZE_OPTIONS,
  },
  {
    id: 'card-class',
    label: '班級膠囊',
    description: '卡片內圓角膠囊的班級號碼。',
    cssVar: '--template-card-class-size',
    defaultValue: 16,
    options: FONT_SIZE_OPTIONS,
  },
  {
    id: 'card-name',
    label: '卡片姓名',
    description: '每張卡片內最醒目的學生姓名。',
    cssVar: '--template-card-name-size',
    defaultValue: 26,
    options: LARGE_FONT_SIZE_OPTIONS,
  },
  {
    id: 'board-footer',
    label: '頁尾文字',
    description: '最底部重複顯示的榜單標題。',
    cssVar: '--template-board-footer-size',
    defaultValue: 16,
    options: FONT_SIZE_OPTIONS,
  },
]

const EXAM_RESULT_THEMES: readonly TemplateThemeDefinition[] = [
  {
    id: 'classic',
    label: '典藏金',
    description: '奶油紙色搭配沉穩金棕，保留最正式的金榜感。',
    previewColors: ['#fcf8f1', '#2f2418', '#c9962d'],
    tokens: {
      '--template-board-bg': '#fcf8f1',
      '--template-board-surface': '#ffffff',
      '--template-board-surface-soft': '#fffaf2',
      '--template-board-border': '#d6c7b5',
      '--template-board-border-strong': '#c8b59b',
      '--template-board-text': '#2f2418',
      '--template-board-muted': '#7d6a55',
      '--template-board-subtitle': '#9a7c52',
      '--template-board-shadow': 'rgba(68, 49, 27, 0.08)',
      '--template-card-bg': 'rgba(255, 255, 255, 0.55)',
      '--template-card-border': 'rgba(101, 75, 43, 0.12)',
      '--template-card-shadow': 'rgba(68, 49, 27, 0.1)',
      '--template-card-surface': 'rgba(255, 251, 244, 0.88)',
      '--template-card-surface-border': 'rgba(134, 104, 64, 0.1)',
      '--template-card-divider': 'rgba(171, 132, 73, 0.55)',
      '--template-primary-start': '#fffbe8',
      '--template-primary-end': '#f5d97a',
      '--template-primary-text': '#7a5200',
      '--template-primary-border': 'rgba(180, 141, 54, 0.5)',
      '--template-primary-soft': '#f6e7bf',
      '--template-secondary-start': '#f7efe2',
      '--template-secondary-end': '#e7d0aa',
      '--template-secondary-text': '#6c5537',
      '--template-secondary-border': '#d9c2a2',
      '--template-secondary-soft': '#f3e6d2',
      '--template-pill-start': '#b89a67',
      '--template-pill-end': '#99794a',
      '--template-pill-text': '#ffffff',
    },
  },
  {
    id: 'fresh',
    label: '青岑',
    description: '淡綠與灰藍交錯，讓長名單看起來更輕盈有呼吸感。',
    previewColors: ['#f7fbf7', '#243528', '#8faa94'],
    tokens: {
      '--template-board-bg': '#f7fbf7',
      '--template-board-surface': '#ffffff',
      '--template-board-surface-soft': '#f1f7f2',
      '--template-board-border': '#d4e0d7',
      '--template-board-border-strong': '#b9cdbf',
      '--template-board-text': '#243528',
      '--template-board-muted': '#64756b',
      '--template-board-subtitle': '#6f8c7b',
      '--template-board-shadow': 'rgba(39, 67, 53, 0.1)',
      '--template-card-bg': 'rgba(255, 255, 255, 0.72)',
      '--template-card-border': 'rgba(103, 130, 113, 0.18)',
      '--template-card-shadow': 'rgba(39, 67, 53, 0.14)',
      '--template-card-surface': 'rgba(244, 249, 245, 0.94)',
      '--template-card-surface-border': 'rgba(127, 154, 137, 0.16)',
      '--template-card-divider': 'rgba(123, 153, 137, 0.62)',
      '--template-primary-start': '#edf7ef',
      '--template-primary-end': '#8faa94',
      '--template-primary-text': '#315241',
      '--template-primary-border': 'rgba(103, 130, 113, 0.45)',
      '--template-primary-soft': '#edf4ef',
      '--template-secondary-start': '#e3eff5',
      '--template-secondary-end': '#9ab8c9',
      '--template-secondary-text': '#355266',
      '--template-secondary-border': '#a4becd',
      '--template-secondary-soft': '#e9f2f7',
      '--template-pill-start': '#8ea4bf',
      '--template-pill-end': '#6f88a8',
      '--template-pill-text': '#ffffff',
    },
  },
  {
    id: 'blush',
    label: '霞光粉',
    description: '帶一點慶賀感的粉霧色，適合想要柔和但不失亮點的版面。',
    previewColors: ['#fff4f5', '#4a2d33', '#e49ab0'],
    tokens: {
      '--template-board-bg': '#fff4f5',
      '--template-board-surface': '#ffffff',
      '--template-board-surface-soft': '#fff0f3',
      '--template-board-border': '#e5c8d1',
      '--template-board-border-strong': '#d8afbb',
      '--template-board-text': '#4a2d33',
      '--template-board-muted': '#866069',
      '--template-board-subtitle': '#b26b7f',
      '--template-board-shadow': 'rgba(91, 51, 61, 0.1)',
      '--template-card-bg': 'rgba(255, 255, 255, 0.74)',
      '--template-card-border': 'rgba(181, 116, 137, 0.18)',
      '--template-card-shadow': 'rgba(91, 51, 61, 0.14)',
      '--template-card-surface': 'rgba(255, 247, 249, 0.95)',
      '--template-card-surface-border': 'rgba(213, 150, 170, 0.16)',
      '--template-card-divider': 'rgba(220, 147, 169, 0.62)',
      '--template-primary-start': '#ffd8e2',
      '--template-primary-end': '#e49ab0',
      '--template-primary-text': '#6e3144',
      '--template-primary-border': 'rgba(181, 104, 128, 0.4)',
      '--template-primary-soft': '#ffe3ea',
      '--template-secondary-start': '#ffe7c6',
      '--template-secondary-end': '#f4c58f',
      '--template-secondary-text': '#7a4f24',
      '--template-secondary-border': '#e0b176',
      '--template-secondary-soft': '#ffefd8',
      '--template-pill-start': '#d391a7',
      '--template-pill-end': '#b96882',
      '--template-pill-text': '#ffffff',
    },
  },
  {
    id: 'midnight',
    label: '墨藍夜讀',
    description: '深藍灰底與冷金點綴，整體更安定也更像典藏紀念版。',
    previewColors: ['#f4f6fb', '#24324a', '#8ea4bf'],
    tokens: {
      '--template-board-bg': '#f4f6fb',
      '--template-board-surface': '#ffffff',
      '--template-board-surface-soft': '#eef2f8',
      '--template-board-border': '#d6dfeb',
      '--template-board-border-strong': '#bbc9dc',
      '--template-board-text': '#24324a',
      '--template-board-muted': '#66778f',
      '--template-board-subtitle': '#8d97b0',
      '--template-board-shadow': 'rgba(44, 62, 90, 0.1)',
      '--template-card-bg': 'rgba(255, 255, 255, 0.78)',
      '--template-card-border': 'rgba(118, 142, 178, 0.18)',
      '--template-card-shadow': 'rgba(44, 62, 90, 0.12)',
      '--template-card-surface': 'rgba(245, 248, 252, 0.96)',
      '--template-card-surface-border': 'rgba(153, 173, 204, 0.16)',
      '--template-card-divider': 'rgba(142, 164, 191, 0.62)',
      '--template-primary-start': '#d9e6f7',
      '--template-primary-end': '#8ea4bf',
      '--template-primary-text': '#28405d',
      '--template-primary-border': 'rgba(112, 136, 169, 0.36)',
      '--template-primary-soft': '#e7eef8',
      '--template-secondary-start': '#f7edd8',
      '--template-secondary-end': '#d7bf8d',
      '--template-secondary-text': '#6d5328',
      '--template-secondary-border': '#c6ab77',
      '--template-secondary-soft': '#f8efdd',
      '--template-pill-start': '#6f88a8',
      '--template-pill-end': '#526b8b',
      '--template-pill-text': '#ffffff',
    },
  },
  {
    id: 'warm',
    label: '暖金晨光',
    description: '偏暖的金色系，最接近典型大考榮譽榜的表揚氛圍。',
    previewColors: ['#fff8e9', '#3a2b18', '#e8be58'],
    tokens: {
      '--template-board-bg': '#fff8e9',
      '--template-board-surface': '#ffffff',
      '--template-board-surface-soft': '#fff4dc',
      '--template-board-border': '#dec8a2',
      '--template-board-border-strong': '#d3b47e',
      '--template-board-text': '#3a2b18',
      '--template-board-muted': '#8a6f4e',
      '--template-board-subtitle': '#ae8444',
      '--template-board-shadow': 'rgba(92, 63, 20, 0.12)',
      '--template-card-bg': 'rgba(255, 255, 255, 0.62)',
      '--template-card-border': 'rgba(149, 112, 45, 0.18)',
      '--template-card-shadow': 'rgba(92, 63, 20, 0.16)',
      '--template-card-surface': 'rgba(255, 247, 229, 0.94)',
      '--template-card-surface-border': 'rgba(181, 138, 63, 0.14)',
      '--template-card-divider': 'rgba(190, 145, 58, 0.68)',
      '--template-primary-start': '#fff4c7',
      '--template-primary-end': '#e8be58',
      '--template-primary-text': '#714c09',
      '--template-primary-border': 'rgba(193, 146, 53, 0.58)',
      '--template-primary-soft': '#fff0c8',
      '--template-secondary-start': '#ffe7d2',
      '--template-secondary-end': '#f1b67d',
      '--template-secondary-text': '#724123',
      '--template-secondary-border': '#dca66f',
      '--template-secondary-soft': '#ffe7d2',
      '--template-pill-start': '#c39a56',
      '--template-pill-end': '#a9782e',
      '--template-pill-text': '#ffffff',
    },
  },
]

const CLASS_RANKING_THEMES: readonly TemplateThemeDefinition[] = [
  {
    id: 'academic',
    label: '學院藍',
    description: '冷靜的藍灰與霧金搭配，適合資訊量多的班排名次。',
    previewColors: ['#f6f8fb', '#223040', '#8ea4bf'],
    tokens: {
      '--template-board-bg': '#f6f8fb',
      '--template-board-surface': '#ffffff',
      '--template-board-surface-soft': '#eef3f8',
      '--template-board-border': '#d6dee8',
      '--template-board-border-strong': '#bcc9d8',
      '--template-board-text': '#223040',
      '--template-board-muted': '#66788d',
      '--template-board-subtitle': '#8090a7',
      '--template-board-shadow': 'rgba(44, 64, 87, 0.08)',
      '--template-card-bg': 'rgba(255, 255, 255, 0.72)',
      '--template-card-border': 'rgba(120, 142, 170, 0.18)',
      '--template-card-shadow': 'rgba(44, 64, 87, 0.06)',
      '--template-card-surface': 'rgba(244, 247, 251, 0.92)',
      '--template-card-surface-border': 'rgba(142, 164, 191, 0.16)',
      '--template-card-divider': 'rgba(142, 164, 191, 0.62)',
      '--template-primary-start': '#a6bfd6',
      '--template-primary-end': '#7e9ab7',
      '--template-primary-text': '#243649',
      '--template-primary-border': 'rgba(95, 118, 146, 0.22)',
      '--template-primary-soft': '#e8eef5',
      '--template-secondary-start': '#d4dde7',
      '--template-secondary-end': '#adbdcf',
      '--template-secondary-text': '#395165',
      '--template-secondary-border': 'rgba(109, 133, 158, 0.18)',
      '--template-secondary-soft': '#eef3f8',
      '--template-pill-start': '#8ea4bf',
      '--template-pill-end': '#667f9d',
      '--template-pill-text': '#ffffff',
    },
  },
  {
    id: 'mint',
    label: '玉石綠',
    description: '柔和綠階讓榜單更清爽，適合班排與校排一起呈現。',
    previewColors: ['#f4faf7', '#254134', '#8fb8a1'],
    tokens: {
      '--template-board-bg': '#f4faf7',
      '--template-board-surface': '#ffffff',
      '--template-board-surface-soft': '#edf6f1',
      '--template-board-border': '#d0e0d6',
      '--template-board-border-strong': '#b5ccb8',
      '--template-board-text': '#254134',
      '--template-board-muted': '#647a6e',
      '--template-board-subtitle': '#7a9a86',
      '--template-board-shadow': 'rgba(41, 71, 56, 0.08)',
      '--template-card-bg': 'rgba(255, 255, 255, 0.74)',
      '--template-card-border': 'rgba(111, 148, 125, 0.16)',
      '--template-card-shadow': 'rgba(41, 71, 56, 0.06)',
      '--template-card-surface': 'rgba(244, 250, 246, 0.94)',
      '--template-card-surface-border': 'rgba(143, 184, 161, 0.16)',
      '--template-card-divider': 'rgba(138, 177, 156, 0.58)',
      '--template-primary-start': '#cde7d8',
      '--template-primary-end': '#8fb8a1',
      '--template-primary-text': '#27483a',
      '--template-primary-border': 'rgba(89, 130, 104, 0.2)',
      '--template-primary-soft': '#e5f1ea',
      '--template-secondary-start': '#dceade',
      '--template-secondary-end': '#b7cfbc',
      '--template-secondary-text': '#355442',
      '--template-secondary-border': 'rgba(91, 121, 103, 0.16)',
      '--template-secondary-soft': '#eef5ef',
      '--template-pill-start': '#8fb8a1',
      '--template-pill-end': '#6f977f',
      '--template-pill-text': '#ffffff',
    },
  },
  {
    id: 'apricot',
    label: '杏桃橙',
    description: '暖橘與奶白的對比更活潑，適合需要醒目感的展示用圖。',
    previewColors: ['#fff6ef', '#4b3020', '#e59d67'],
    tokens: {
      '--template-board-bg': '#fff6ef',
      '--template-board-surface': '#ffffff',
      '--template-board-surface-soft': '#fff0e4',
      '--template-board-border': '#e7d0bb',
      '--template-board-border-strong': '#d9b898',
      '--template-board-text': '#4b3020',
      '--template-board-muted': '#886752',
      '--template-board-subtitle': '#c18456',
      '--template-board-shadow': 'rgba(93, 60, 32, 0.08)',
      '--template-card-bg': 'rgba(255, 255, 255, 0.76)',
      '--template-card-border': 'rgba(190, 134, 88, 0.18)',
      '--template-card-shadow': 'rgba(93, 60, 32, 0.06)',
      '--template-card-surface': 'rgba(255, 248, 241, 0.95)',
      '--template-card-surface-border': 'rgba(229, 157, 103, 0.16)',
      '--template-card-divider': 'rgba(223, 150, 93, 0.58)',
      '--template-primary-start': '#ffd0ab',
      '--template-primary-end': '#e59d67',
      '--template-primary-text': '#6b4221',
      '--template-primary-border': 'rgba(179, 119, 70, 0.22)',
      '--template-primary-soft': '#ffe4d2',
      '--template-secondary-start': '#f7ead3',
      '--template-secondary-end': '#e5c18b',
      '--template-secondary-text': '#73562d',
      '--template-secondary-border': 'rgba(165, 128, 73, 0.16)',
      '--template-secondary-soft': '#fbf1df',
      '--template-pill-start': '#d5925d',
      '--template-pill-end': '#b8743d',
      '--template-pill-text': '#ffffff',
    },
  },
  {
    id: 'classic',
    label: '典雅米金',
    description: '紙張與金色點綴的平衡版本，延續最熟悉的正式公告感。',
    previewColors: ['#fcf8f1', '#2f2418', '#b89a67'],
    tokens: {
      '--template-board-bg': '#fcf8f1',
      '--template-board-surface': '#ffffff',
      '--template-board-surface-soft': '#faf3e8',
      '--template-board-border': '#d9cbb9',
      '--template-board-border-strong': '#cdb69a',
      '--template-board-text': '#2f2418',
      '--template-board-muted': '#7d6a55',
      '--template-board-subtitle': '#aa8450',
      '--template-board-shadow': 'rgba(65, 48, 26, 0.08)',
      '--template-card-bg': 'rgba(255, 255, 255, 0.62)',
      '--template-card-border': 'rgba(132, 101, 62, 0.14)',
      '--template-card-shadow': 'rgba(65, 48, 26, 0.05)',
      '--template-card-surface': 'rgba(255, 251, 244, 0.88)',
      '--template-card-surface-border': 'rgba(134, 104, 64, 0.1)',
      '--template-card-divider': 'rgba(171, 132, 73, 0.55)',
      '--template-primary-start': '#f0cd7a',
      '--template-primary-end': '#dfb14a',
      '--template-primary-text': '#513509',
      '--template-primary-border': 'rgba(123, 91, 39, 0.18)',
      '--template-primary-soft': '#f4e8d1',
      '--template-secondary-start': '#cadccb',
      '--template-secondary-end': '#a7bea8',
      '--template-secondary-text': '#2e493b',
      '--template-secondary-border': 'rgba(73, 100, 80, 0.16)',
      '--template-secondary-soft': '#edf4ef',
      '--template-pill-start': '#b89a67',
      '--template-pill-end': '#99794a',
      '--template-pill-text': '#ffffff',
    },
  },
  {
    id: 'gold',
    label: '榮耀金',
    description: '更強烈的金色層次，拉高榜單表揚感與焦點。',
    previewColors: ['#fff8e2', '#3c2b14', '#d9aa45'],
    tokens: {
      '--template-board-bg': '#fff8e2',
      '--template-board-surface': '#fffef8',
      '--template-board-surface-soft': '#fff2cb',
      '--template-board-border': '#e7d19b',
      '--template-board-border-strong': '#d7b86b',
      '--template-board-text': '#3c2b14',
      '--template-board-muted': '#8d6c41',
      '--template-board-subtitle': '#bb8f44',
      '--template-board-shadow': 'rgba(96, 67, 21, 0.1)',
      '--template-card-bg': 'rgba(255, 255, 255, 0.72)',
      '--template-card-border': 'rgba(161, 119, 34, 0.2)',
      '--template-card-shadow': 'rgba(96, 67, 21, 0.08)',
      '--template-card-surface': 'rgba(255, 249, 233, 0.94)',
      '--template-card-surface-border': 'rgba(170, 128, 49, 0.14)',
      '--template-card-divider': 'rgba(201, 151, 53, 0.68)',
      '--template-primary-start': '#f6d476',
      '--template-primary-end': '#d9aa45',
      '--template-primary-text': '#4f360d',
      '--template-primary-border': 'rgba(132, 93, 24, 0.22)',
      '--template-primary-soft': '#f9e5a8',
      '--template-secondary-start': '#f5dfb0',
      '--template-secondary-end': '#e5bf76',
      '--template-secondary-text': '#694a12',
      '--template-secondary-border': 'rgba(155, 116, 37, 0.18)',
      '--template-secondary-soft': '#faeac5',
      '--template-pill-start': '#d0a048',
      '--template-pill-end': '#ad7d22',
      '--template-pill-text': '#ffffff',
    },
  },
]

export const TEMPLATE_STYLE_REGISTRY: Readonly<Record<TemplateId, TemplateStyleDefinition>> = {
  'exam-result': {
    id: 'exam-result',
    label: '大考成績榜',
    defaultThemeId: 'warm',
    fontRoles: EXAM_RESULT_FONT_ROLES,
    themes: EXAM_RESULT_THEMES,
  },
  'class-ranking': {
    id: 'class-ranking',
    label: '班排榮譽榜',
    defaultThemeId: 'classic',
    fontRoles: CLASS_RANKING_FONT_ROLES,
    themes: CLASS_RANKING_THEMES,
  },
}

export function getTemplateStyleDefinition(templateId: TemplateId): TemplateStyleDefinition {
  return TEMPLATE_STYLE_REGISTRY[templateId]
}
