import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ExamResultData } from '@core/templates';

@Component({
  selector: 'app-exam-result-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-result-board.component.html',
  styleUrl: './exam-result-board.component.scss',
})
export class ExamResultBoardComponent {
  readonly data = input.required<ExamResultData>();
  readonly columns = input<number>(4);
  readonly maskNames = input<boolean>(false);
  readonly styleVars = input<Record<string, string | number>>({});

  protected readonly gridStyle = computed(() => ({
    'grid-template-columns': `repeat(${this.columns()}, 1fr)`,
  }));

  protected mask(name: string): string {
    if (!this.maskNames()) return name;
    if (name.length <= 1) return name;
    if (name.length === 2) return name[0] + '○';
    return name[0] + '○'.repeat(name.length - 2) + name[name.length - 1];
  }
}
