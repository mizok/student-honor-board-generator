import { Component, computed, inject, signal } from '@angular/core'
import { DynamicDialogConfig } from 'primeng/dynamicdialog'
import { BoardService } from '@core/board.service'
import type { TemplateStyleDialogData } from '../template-style-settings-dialog.types'

@Component({
  selector: 'app-template-theme-settings-dialog',
  standalone: true,
  imports: [],
  templateUrl: './template-theme-settings-dialog.component.html',
  styleUrl: './template-theme-settings-dialog.component.scss',
})
export class TemplateThemeSettingsDialogComponent {
  protected readonly board = inject(BoardService)
  private readonly dialogConfig = inject<DynamicDialogConfig<TemplateStyleDialogData>>(DynamicDialogConfig)
  protected readonly templateStyleDefinition = computed(() => this.board.templateStyleDefinition())
  protected readonly themes = computed(() => this.templateStyleDefinition()?.themes ?? [])
  private readonly draftThemeId = signal<string | null>(this.dialogConfig.data?.themeId ?? this.board.themeId())
  protected readonly selectedThemeId = this.draftThemeId.asReadonly()
  private readonly defaultThemeId = computed(() => this.templateStyleDefinition()?.defaultThemeId ?? null)

  protected selectTheme(themeId: string): void {
    this.draftThemeId.set(themeId)
    this.board.updateTheme(themeId)
  }

  protected resetTheme(): void {
    this.draftThemeId.set(this.defaultThemeId())
    this.board.resetThemeSettings()
  }
}
