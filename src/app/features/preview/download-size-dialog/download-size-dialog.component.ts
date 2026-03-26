import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SelectButtonModule } from 'primeng/selectbutton';

interface DownloadSizeDialogData {
  readonly action: 'download' | 'share';
  readonly format: 'pdf' | 'png';
  readonly width: number;
  readonly widthOptions: ReadonlyArray<{ label: string; value: number }>;
}

@Component({
  selector: 'app-download-size-dialog',
  standalone: true,
  imports: [FormsModule, ButtonModule, SelectButtonModule],
  templateUrl: './download-size-dialog.component.html',
  styleUrl: './download-size-dialog.component.scss',
})
export class DownloadSizeDialogComponent {
  private readonly dialogRef = inject(DynamicDialogRef);
  private readonly config = inject(DynamicDialogConfig<DownloadSizeDialogData>);

  protected readonly data = this.config.data ?? {
    action: 'download',
    format: 'pdf',
    width: 1024,
    widthOptions: [],
  };
  protected readonly selectedWidth = signal(this.data.width);
  protected readonly actionLabel = signal(this.data.action === 'share' ? '分享' : '下載');
  protected readonly actionCopy = signal(
    this.data.action === 'share'
      ? '請先選擇匯出尺寸，再開始分享。'
      : '請先選擇匯出尺寸，再開始下載。',
  );

  protected selectWidth(width: number): void {
    this.selectedWidth.set(width);
  }

  protected confirm(): void {
    this.dialogRef.close({ width: this.selectedWidth() });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
