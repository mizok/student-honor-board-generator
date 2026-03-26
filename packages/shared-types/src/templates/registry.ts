import { ZodSchema } from 'zod'
import { examResultSchema } from './exam-result/schema'
import { examResultPrompt } from './exam-result/prompt'
import { classRankingSchema } from './class-ranking/schema'
import { classRankingPrompt } from './class-ranking/prompt'

export interface TemplateDefinition {
  readonly id: string
  readonly label: string
  readonly schema: ZodSchema
  readonly prompt: string
}

export const TEMPLATE_REGISTRY: Readonly<Record<string, TemplateDefinition>> = {
  'exam-result': {
    id: 'exam-result',
    label: '大考成績榜',
    schema: examResultSchema,
    prompt: examResultPrompt,
  },
  'class-ranking': {
    id: 'class-ranking',
    label: '班排榮譽榜',
    schema: classRankingSchema,
    prompt: classRankingPrompt,
  },
}

export const TEMPLATE_IDS = Object.keys(TEMPLATE_REGISTRY) as (keyof typeof TEMPLATE_REGISTRY)[]
