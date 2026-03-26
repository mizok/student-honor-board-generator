import { Component, computed, inject, signal } from '@angular/core'
import { DynamicDialogConfig } from 'primeng/dynamicdialog'
import { BoardService } from '@core/board.service'
import type { TemplateStyleDialogData } from '../template-style-settings-dialog.types'

@Component({
  selector: 'app-template-font-settings-dialog',
  standalone: true,
  imports: [],
  templateUrl: './template-font-settings-dialog.component.html',
  styleUrl: './template-font-settings-dialog.component.scss',
})
export class TemplateFontSettingsDialogComponent {
  protected readonly board = inject(BoardService)
  private readonly dialogConfig = inject<DynamicDialogConfig<TemplateStyleDialogData>>(DynamicDialogConfig)
  protected readonly templateStyleDefinition = computed(() => this.board.templateStyleDefinition())
  protected readonly templateLabel = computed(() => this.templateStyleDefinition()?.label ?? '版型設定')
  protected readonly fontRoles = computed(() => this.templateStyleDefinition()?.fontRoles ?? [])
  private readonly draftFontSettings = signal<Record<string, number>>({
    ...(this.dialogConfig.data?.fontSettings ?? this.board.fontSettings()),
  })
  protected readonly fontSettings = this.draftFontSettings.asReadonly()
  private readonly defaultFontSettings = computed<Record<string, number>>(() =>
    Object.fromEntries(this.fontRoles().map((role) => [role.id, role.defaultValue])),
  )

  protected isSelected(roleId: string, value: number): boolean {
    const role = this.fontRoles().find((item) => item.id === roleId)
    if (!role) return false
    return (this.fontSettings()[roleId] ?? role.defaultValue) === value
  }

  protected selectFontSize(roleId: string, value: number): void {
    this.draftFontSettings.update((settings) => ({
      ...settings,
      [roleId]: value,
    }))
    this.board.updateFontRole(roleId, value)
  }

  protected resetFontSettings(): void {
    this.draftFontSettings.set(this.defaultFontSettings())
    this.board.resetFontSettings()
  }
}
