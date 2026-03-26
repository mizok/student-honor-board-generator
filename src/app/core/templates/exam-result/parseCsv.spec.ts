import { describe, expect, it } from 'vitest'
import { examResultCsvTemplate } from './parseCsv'

describe('examResultCsvTemplate', () => {
  it('includes a tagline row before student headers', () => {
    expect(examResultCsvTemplate).toContain('tagline,裝飾文字（選填，可留空）')
    expect(examResultCsvTemplate).toContain(
      'title,在此填入榮譽榜標題\nsubtitle,副標題（選填，可留空）\ntagline,裝飾文字（選填，可留空）\ntag,school,studentName,description,highlight',
    )
  })
})
