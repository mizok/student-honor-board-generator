import { Injectable, computed, signal } from '@angular/core';
import { TEMPLATE_REGISTRY } from './templates';
import type { ClassRankingData, ExamResultData } from './templates';
import { parseFileToRows } from './file-parser';
import {
  getTemplateStyleDefinition,
  type TemplateId,
  type TemplateStyleDefinition,
} from './template-style-registry';
import { TEMPLATE_IDS } from './templates/registry';

export type UiState = 'upload' | 'preview';
const RESPONSIVE_BASE = 10.24;

function isTemplateId(templateId: string): templateId is TemplateId {
  return (TEMPLATE_IDS as readonly string[]).includes(templateId);
}

function toResponsiveSize(value: number): string {
  return `calc(${value / RESPONSIVE_BASE} * var(--container-width))`;
}

@Injectable({ providedIn: 'root' })
export class BoardService {
  readonly uiState = signal<UiState>('upload');
  readonly templateId = signal<TemplateId | ''>('');
  readonly parsedData = signal<ExamResultData | ClassRankingData | null>(null);
  readonly columns = signal(4);
  readonly exportWidth = signal<number>(1024);
  readonly drawerOpen = signal(false);
  readonly maskNames = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly themeId = signal<string | null>(null);
  readonly fontSettings = signal<Record<string, number>>({});
  readonly templateStyleDefinition = computed<TemplateStyleDefinition | null>(() => {
    const templateId = this.templateId();
    return templateId ? getTemplateStyleDefinition(templateId) : null;
  });
  readonly templateStyleVars = computed<Record<string, string | number>>(() => {
    const definition = this.templateStyleDefinition();
    const selectedThemeId = this.themeId();

    if (!definition || !selectedThemeId) {
      return {};
    }

    const theme = definition.themes.find((item) => item.id === selectedThemeId);
    if (!theme) {
      return {};
    }

    const fontSettings = this.fontSettings();

    return {
      ...theme.tokens,
      ...Object.fromEntries(
        definition.fontRoles.map((role) => [
          role.cssVar,
          toResponsiveSize(fontSettings[role.id] ?? role.defaultValue),
        ]),
      ),
    };
  });

  readonly isInPreview = computed(() => this.uiState() === 'preview');

  async parse(templateId: string, file: File): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      if (!isTemplateId(templateId)) {
        throw new Error(`未知的榮譽榜類型：${templateId}`);
      }

      const template = TEMPLATE_REGISTRY[templateId];

      const rows = await parseFileToRows(file);
      const parsed = template.parseCsv(rows);
      const result = template.schema.safeParse(parsed);

      if (!result.success) {
        const issues = result.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('；');
        throw new Error(`資料格式不符合預期：${issues}`);
      }

      this.templateId.set(templateId);
      this.parsedData.set(result.data as ExamResultData | ClassRankingData);
      this.resetTemplateStyleSettings();
      this.uiState.set('preview');
    } catch (err) {
      this.clearPreviewState();
      this.errorMessage.set(err instanceof Error ? err.message : '解析失敗，請確認檔案格式正確');
    } finally {
      this.isLoading.set(false);
    }
  }

  loadDefault(templateId: string): void {
    if (!isTemplateId(templateId)) return;

    const template = TEMPLATE_REGISTRY[templateId];
    this.errorMessage.set(null);
    this.templateId.set(templateId);
    this.parsedData.set(template.defaultData as ExamResultData | ClassRankingData);
    this.resetTemplateStyleSettings();
    this.uiState.set('preview');
  }

  resetTemplateStyleSettings(): void {
    this.resetThemeSettings();
    this.resetFontSettings();
  }

  resetThemeSettings(): void {
    const definition = this.templateStyleDefinition();

    if (!definition) {
      this.themeId.set(null);
      return;
    }

    this.themeId.set(definition.defaultThemeId);
  }

  resetFontSettings(): void {
    const definition = this.templateStyleDefinition();

    if (!definition) {
      this.fontSettings.set({});
      return;
    }

    this.fontSettings.set(
      Object.fromEntries(definition.fontRoles.map((role) => [role.id, role.defaultValue])),
    );
  }

  updateFontRole(roleId: string, value: number): void {
    const definition = this.templateStyleDefinition();
    if (!definition || !definition.fontRoles.some((role) => role.id === roleId)) {
      return;
    }

    this.fontSettings.update((settings) => ({
      ...settings,
      [roleId]: value,
    }));
  }

  updateTheme(themeId: string): void {
    const definition = this.templateStyleDefinition();
    if (!definition) return;

    const theme = definition.themes.find((item) => item.id === themeId);
    if (!theme) return;

    this.themeId.set(theme.id);
  }

  resetToUpload(): void {
    this.clearPreviewState();
    this.columns.set(4);
    this.errorMessage.set(null);
    this.drawerOpen.set(false);
    this.maskNames.set(false);
  }

  toggleDrawer(): void {
    this.drawerOpen.update((v) => !v);
  }

  private clearPreviewState(): void {
    this.uiState.set('upload');
    this.parsedData.set(null);
    this.templateId.set('');
    this.resetTemplateStyleSettings();
  }
}
