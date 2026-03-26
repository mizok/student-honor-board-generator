import { HttpClient } from '@angular/common/http'
import { createEnvironmentInjector, runInInjectionContext, type EnvironmentInjector } from '@angular/core'
import { of } from 'rxjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BoardService } from './board.service'
import { environment } from '../../environments/environment'

describe('BoardService', () => {
  let service: BoardService
  let injector: EnvironmentInjector
  const postMock = vi.fn()

  beforeEach(() => {
    postMock.mockReset()
    injector = createEnvironmentInjector([{ provide: HttpClient, useValue: { post: postMock } }])
    service = runInInjectionContext(injector, () => new BoardService())
  })

  afterEach(() => {
    injector.destroy()
  })

  it('starts in upload state', () => {
    expect(service.uiState()).toBe('upload')
  })

  it('transitions to preview on successful parse', async () => {
    const mockData = {
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
    }

    postMock.mockReturnValueOnce(of({ success: true, data: mockData }))

    const promise = service.parse('exam-result', 'dGVzdA==', 'test.csv')

    const result = await promise
    expect(postMock).toHaveBeenCalledWith(`${environment.workerUrl}/api/parse`, {
      templateId: 'exam-result',
      fileContent: 'dGVzdA==',
      fileName: 'test.csv',
    })
    expect(result.success).toBe(true)
    expect(service.uiState()).toBe('preview')
    expect(service.parsedData()).toEqual(mockData)
  })

  it('stays in upload state on failure', async () => {
    postMock.mockReturnValueOnce(of({ success: false, message: '錯誤訊息' }))

    const promise = service.parse('exam-result', 'dGVzdA==', 'test.csv')

    const result = await promise
    expect(result.success).toBe(false)
    expect(service.uiState()).toBe('upload')
  })

  it('resets to upload state', () => {
    service.resetToUpload()
    expect(service.uiState()).toBe('upload')
    expect(service.parsedData()).toBeNull()
  })
})
