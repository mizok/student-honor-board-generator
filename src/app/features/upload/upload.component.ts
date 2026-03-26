import { Component, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ButtonModule } from 'primeng/button'
import { SelectModule } from 'primeng/select'
import { MessageModule } from 'primeng/message'
import { BoardService } from '../../core/board.service'
import { buildTemplateXlsx } from '../../core/template-xlsx-builder'
import { TEMPLATE_IDS, TEMPLATE_REGISTRY } from '../../core/templates'

const MAX_FILE_SIZE = 5 * 1024 * 1024

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [FormsModule, ButtonModule, SelectModule, MessageModule],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss',
})
export class UploadComponent {
  protected readonly board = inject(BoardService)

  protected readonly templateOptions = TEMPLATE_IDS.map((id) => ({
    label: TEMPLATE_REGISTRY[id].label,
    value: id,
  }))

  protected selectedTemplateId = signal<string>(TEMPLATE_IDS[0])
  protected validationError = signal<string | null>(null)
  protected pendingFile = signal<File | null>(null)
  protected isDragging = signal(false)


  protected onDragOver(e: DragEvent): void {
    e.preventDefault()
    this.isDragging.set(true)
  }

  protected onDragLeave(): void {
    this.isDragging.set(false)
  }

  protected onDrop(e: DragEvent): void {
    e.preventDefault()
    this.isDragging.set(false)
    const file = e.dataTransfer?.files[0]
    if (file) this.validateAndSet(file)
  }

  protected onFileInput(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) this.validateAndSet(file)
  }

  protected triggerFileInput(): void {
    document.getElementById('file-input')?.click()
  }

  protected downloadTemplate(): void {
    const template = TEMPLATE_REGISTRY[this.selectedTemplateId()]
    if (!template) return
    const blob = buildTemplateXlsx(template)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.label}-填寫範本.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  private validateAndSet(file: File): void {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(ext ?? '')) {
      this.validationError.set('請上傳 .csv、.xlsx 或 .xls 格式的檔案')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      this.validationError.set('檔案大小不可超過 5 MB')
      return
    }
    this.validationError.set(null)
    this.pendingFile.set(file)
    this.board.errorMessage.set(null)
  }

  protected useDefault(): void {
    this.board.loadDefault(this.selectedTemplateId())
  }

  protected async onSubmit(): Promise<void> {
    const file = this.pendingFile()
    if (!file) return
    await this.board.parse(this.selectedTemplateId(), file)
  }

  protected get canSubmit(): boolean {
    return !!this.pendingFile() && !this.board.isLoading()
  }
}
