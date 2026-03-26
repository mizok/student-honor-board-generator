import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExamResultBoardComponent } from './exam-result/exam-result-board.component';
import { ClassRankingBoardComponent } from './class-ranking/class-ranking-board.component';
import type { ExamResultData, ClassRankingData } from '@core/templates';

@Component({
  selector: 'app-template-outlet',
  standalone: true,
  imports: [CommonModule, ExamResultBoardComponent, ClassRankingBoardComponent],
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
    `,
  ],
  template: `
    @switch (templateId()) {
      @case ('exam-result') {
        <app-exam-result-board
          [data]="$any(data())"
          [columns]="columns()"
          [maskNames]="maskNames()"
        />
      }
      @case ('class-ranking') {
        <app-class-ranking-board
          [data]="$any(data())"
          [columns]="columns()"
          [maskNames]="maskNames()"
        />
      }
    }
  `,
})
export class TemplateOutletComponent {
  readonly templateId = input.required<string>();
  readonly data = input.required<ExamResultData | ClassRankingData>();
  readonly columns = input<number>(4);
  readonly maskNames = input<boolean>(false);
}
