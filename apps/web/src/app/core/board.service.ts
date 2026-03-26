import { HttpClient } from '@angular/common/http'
import { computed, inject, Injectable, signal } from '@angular/core'
import { firstValueFrom } from 'rxjs'

import type { ClassRankingData, ExamResultData, ParseRequest, ParseResponse } from '@honor/shared-types'

import { environment } from '../../environments/environment'

export type UiState = 'upload' | 'preview'

@Injectable({ providedIn: 'root' })
export class BoardService {
  private readonly http = inject(HttpClient)

  readonly uiState = signal<UiState>('upload')
  readonly templateId = signal<string>('')
  readonly parsedData = signal<ExamResultData | ClassRankingData | null>(null)
  readonly drawerOpen = signal(false)
  readonly isLoading = signal(false)
  readonly errorMessage = signal<string | null>(null)

  readonly isInPreview = computed(() => this.uiState() === 'preview')

  async parse(templateId: string, fileContent: string, fileName: string): Promise<ParseResponse> {
    this.isLoading.set(true)
    this.errorMessage.set(null)

    const body: ParseRequest = { templateId, fileContent, fileName }

    try {
      const response = await firstValueFrom(
        this.http.post<ParseResponse>(`${environment.workerUrl}/api/parse`, body),
      )

      if (response.success) {
        this.templateId.set(templateId)
        this.parsedData.set(response.data)
        this.uiState.set('preview')
      } else {
        this.errorMessage.set(response.message)
      }

      return response
    } catch {
      const message = 'AI 服務暫時無法使用，請稍後再試'
      this.errorMessage.set(message)
      return { success: false, message }
    } finally {
      this.isLoading.set(false)
    }
  }

  resetToUpload(): void {
    this.uiState.set('upload')
    this.parsedData.set(null)
    this.templateId.set('')
    this.errorMessage.set(null)
    this.drawerOpen.set(false)
  }

  toggleDrawer(): void {
    this.drawerOpen.update((value) => !value)
  }
}
