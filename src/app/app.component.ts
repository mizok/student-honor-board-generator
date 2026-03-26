import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { BoardService } from './core/board.service'
import { UploadComponent } from './features/upload/upload.component'
import { PreviewComponent } from './features/preview/preview.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, UploadComponent, PreviewComponent],
  template: `
    @if (board.uiState() === 'upload') {
      <app-upload />
    } @else {
      <app-preview />
    }
  `,
})
export class AppComponent {
  protected readonly board = inject(BoardService)
}
