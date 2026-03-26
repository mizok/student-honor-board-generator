import { Component, input } from '@angular/core'
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
}
