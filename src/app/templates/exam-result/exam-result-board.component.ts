import { Component, computed, input } from '@angular/core'
import { CommonModule } from '@angular/common'
import type { ExamResultData } from '@honor/shared-types'

@Component({
  selector: 'app-exam-result-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-result-board.component.html',
  styleUrl: './exam-result-board.component.scss',
})
export class ExamResultBoardComponent {
  readonly data = input.required<ExamResultData>()
  readonly columns = input<number>(4)

  protected readonly gridStyle = computed(() => ({
    'grid-template-columns': `repeat(${this.columns()}, 1fr)`,
  }))
}
