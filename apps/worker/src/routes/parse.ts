import { Hono } from 'hono'
import { TEMPLATE_REGISTRY } from '@honor/shared-types'
import type { ParseRequest, ParseResponse } from '@honor/shared-types'
import type { AppEnv } from '../index'
import { parseFileToCsv } from '../lib/file-parser'
import { callGemini } from '../lib/gemini'

const MAX_BODY_BYTES = 6.7 * 1024 * 1024

const route = new Hono<AppEnv>()

route.post('/', async (c) => {
  const body = await c.req.json<Partial<ParseRequest>>()
  const { templateId, fileContent, fileName } = body

  if (!templateId || !fileContent || !fileName) {
    const response: ParseResponse = { success: false, message: '缺少必要欄位' }
    return c.json(response, 400)
  }

  const template = TEMPLATE_REGISTRY[templateId]

  if (!template) {
    const response: ParseResponse = { success: false, message: `未知的榮譽榜類型：${templateId}` }
    return c.json(response, 400)
  }

  if (fileContent.length > MAX_BODY_BYTES) {
    const response: ParseResponse = { success: false, message: '檔案太大，請上傳 5 MB 以內的檔案' }
    return c.json(response)
  }

  let csvText: string

  try {
    csvText = parseFileToCsv(fileContent, fileName)
  } catch (error) {
    const response: ParseResponse = {
      success: false,
      message: error instanceof Error ? error.message : '檔案解析失敗',
    }
    return c.json(response)
  }

  let geminiResponse: string

  try {
    geminiResponse = await callGemini(c.env.GEMINI_API_KEY, `${template.prompt}\n\n${csvText}`)
  } catch {
    const response: ParseResponse = { success: false, message: 'AI 服務暫時無法使用，請稍後再試' }
    return c.json(response)
  }

  let parsed: unknown

  try {
    const cleaned = geminiResponse
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
      .trim()

    parsed = JSON.parse(cleaned)
  } catch {
    const response: ParseResponse = { success: false, message: geminiResponse.trim() }
    return c.json(response)
  }

  const result = template.schema.safeParse(parsed)

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('；')

    const response: ParseResponse = {
      success: false,
      message: `資料格式不符合預期：${issues}`,
    }

    return c.json(response)
  }

  const response: ParseResponse = { success: true, data: result.data }
  return c.json(response)
})

export default route
