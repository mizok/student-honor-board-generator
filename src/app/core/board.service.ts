import { Injectable, computed, signal } from '@angular/core'
import { TEMPLATE_REGISTRY } from '@honor/shared-types'
import type { ClassRankingData, ExamResultData } from '@honor/shared-types'
import { parseFileToRows } from './file-parser'

export type UiState = 'upload' | 'preview'

@Injectable({ providedIn: 'root' })
export class BoardService {
  readonly uiState = signal<UiState>('upload')
  readonly templateId = signal<string>('')
  readonly parsedData = signal<ExamResultData | ClassRankingData | null>(null)
  readonly columns = signal(4)
  readonly drawerOpen = signal(false)
  readonly maskNames = signal(false)
  readonly fixedWidth = signal(false)
  readonly isLoading = signal(false)
  readonly errorMessage = signal<string | null>(null)

  readonly isInPreview = computed(() => this.uiState() === 'preview')

  async parse(templateId: string, file: File): Promise<void> {
    this.isLoading.set(true)
    this.errorMessage.set(null)

    try {
      const template = TEMPLATE_REGISTRY[templateId]
      if (!template) throw new Error(`未知的榮譽榜類型：${templateId}`)

      const rows = await parseFileToRows(file)
      const parsed = template.parseCsv(rows)
      const result = template.schema.safeParse(parsed)

      if (!result.success) {
        const issues = result.error.issues
          .map(i => `${i.path.join('.')}: ${i.message}`)
          .join('；')
        throw new Error(`資料格式不符合預期：${issues}`)
      }

      this.templateId.set(templateId)
      this.parsedData.set(result.data as ExamResultData | ClassRankingData)
      this.uiState.set('preview')
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : '解析失敗，請確認檔案格式正確')
    } finally {
      this.isLoading.set(false)
    }
  }

  loadDefault(templateId: string): void {
    const template = TEMPLATE_REGISTRY[templateId]
    if (!template) return
    this.templateId.set(templateId)
    this.parsedData.set(template.defaultData as ExamResultData | ClassRankingData)
    this.uiState.set('preview')
  }

  resetToUpload(): void {
    this.uiState.set('upload')
    this.parsedData.set(null)
    this.templateId.set('')
    this.columns.set(4)
    this.errorMessage.set(null)
    this.drawerOpen.set(false)
    this.maskNames.set(false)
    this.fixedWidth.set(false)
  }

  toggleDrawer(): void {
    this.drawerOpen.update(v => !v)
  }
}
