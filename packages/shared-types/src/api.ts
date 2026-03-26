import type { ExamResultData } from './templates/exam-result/schema'
import type { ClassRankingData } from './templates/class-ranking/schema'

export interface ParseRequest {
  readonly templateId: string
  readonly fileContent: string  // base64-encoded
  readonly fileName: string
}

export type ParseSuccessResponse = {
  readonly success: true
  readonly data: ExamResultData | ClassRankingData
}

export type ParseFailureResponse = {
  readonly success: false
  readonly message: string
}

export type ParseResponse = ParseSuccessResponse | ParseFailureResponse
