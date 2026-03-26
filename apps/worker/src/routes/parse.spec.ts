import { describe, expect, it, vi } from 'vitest'
import app from '../index'

vi.mock('../lib/gemini', () => ({
  callGemini: vi.fn().mockResolvedValue(
    JSON.stringify({
      title: '測試榜',
      subtitle: '',
      students: [
        {
          subject: '英文',
          juniorHighSchool: '淡江國中',
          studentName: '林○辰',
          seniorHighSchool: '北一女中',
        },
      ],
    }),
  ),
}))

describe('POST /api/parse', () => {
  const mockEnv = {
    GEMINI_API_KEY: 'test-key',
    WEB_URL: 'http://localhost:4200',
    ENVIRONMENT: 'test',
  }

  it('returns success with parsed data for valid CSV', async () => {
    const csv = '姓名,科目,國中,高中\n林○辰,英文,淡江國中,北一女中\n'
    const base64 = Buffer.from(csv).toString('base64')

    const res = await app.request(
      '/api/parse',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: 'exam-result',
          fileContent: base64,
          fileName: 'test.csv',
        }),
      },
      mockEnv,
    )

    expect(res.status).toBe(200)

    const body = (await res.json()) as { success: boolean; data?: { students?: unknown[] } }

    expect(body.success).toBe(true)
    expect(body.data?.students).toHaveLength(1)
  })

  it('returns failure when file is too large', async () => {
    const largeContent = 'x'.repeat(7 * 1024 * 1024)

    const res = await app.request(
      '/api/parse',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: 'exam-result',
          fileContent: largeContent,
          fileName: 'big.csv',
        }),
      },
      mockEnv,
    )

    expect(res.status).toBe(200)

    const body = (await res.json()) as { success: boolean; message?: string }

    expect(body.success).toBe(false)
    expect(body.message).toContain('檔案')
  })

  it('returns failure when Gemini returns non-JSON', async () => {
    const { callGemini } = await import('../lib/gemini')
    vi.mocked(callGemini).mockResolvedValueOnce('找不到對應的欄位，請確認資料格式')

    const csv = '不相關,欄位\n值,值\n'
    const base64 = Buffer.from(csv).toString('base64')
    const res = await app.request(
      '/api/parse',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: 'exam-result',
          fileContent: base64,
          fileName: 'test.csv',
        }),
      },
      mockEnv,
    )

    const body = (await res.json()) as { success: boolean; message?: string }

    expect(body.success).toBe(false)
    expect(body.message).toBeTruthy()
  })
})
