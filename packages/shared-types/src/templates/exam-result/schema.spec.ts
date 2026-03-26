import { describe, it, expect } from 'vitest'
import { examResultSchema } from './schema'

describe('examResultSchema', () => {
  it('parses valid data', () => {
    const input = {
      title: '學測15級分風華',
      subtitle: '輝煌傳奇',
      students: [
        { subject: '英文', juniorHighSchool: '淡江國中', studentName: '林○辰', seniorHighSchool: '北一女中' }
      ]
    }
    expect(() => examResultSchema.parse(input)).not.toThrow()
  })

  it('rejects missing required fields', () => {
    expect(() => examResultSchema.parse({ title: '測試' })).toThrow()
  })
})
