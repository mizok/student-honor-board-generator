import { Component, input, ElementRef, inject, afterNextRender, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExamResultBoardComponent } from '../exam-result/exam-result-board.component';
import { ClassRankingBoardComponent } from '../class-ranking/class-ranking-board.component';
import type { ExamResultData, ClassRankingData } from '@core/templates';

@Component({
  selector: 'app-template-outlet',
  standalone: true,
  imports: [CommonModule, ExamResultBoardComponent, ClassRankingBoardComponent],
  styleUrls: ['template-outlet.component.scss'],
  template: `
    @switch (templateId()) {
      @case ('exam-result') {
        <app-exam-result-board
          [data]="$any(data())"
          [columns]="columns()"
          [maskNames]="maskNames()"
          [styleVars]="styleVars()"
        />
      }
      @case ('class-ranking') {
        <app-class-ranking-board
          [data]="$any(data())"
          [columns]="columns()"
          [maskNames]="maskNames()"
          [styleVars]="styleVars()"
        />
      }
    }
  `,
})
export class TemplateOutletComponent implements OnDestroy {
  readonly templateId = input.required<string>();
  readonly data = input.required<ExamResultData | ClassRankingData>();
  readonly columns = input<number>(4);
  readonly maskNames = input<boolean>(false);
  readonly styleVars = input<Record<string, string | number>>({});

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly onResize = () => this.updateContainerWidth();

  constructor() {
    afterNextRender(() => {
      this.updateContainerWidth();
      window.addEventListener('resize', this.onResize);
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
  }

  private updateContainerWidth(): void {
    const width = Math.min(window.innerWidth, 1024);
    this.el.nativeElement.style.setProperty('--container-width', `${width / 100}px`);
  }
}
