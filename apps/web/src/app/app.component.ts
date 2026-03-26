import { Component, inject } from '@angular/core'
import { BoardService } from './core/board.service'
import { UploadComponent } from './features/upload/upload.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [UploadComponent],
  template: `
    @if (board.uiState() === 'upload') {
      <app-upload />
    }
  `,
})
export class AppComponent {
  protected readonly board = inject(BoardService)
}
