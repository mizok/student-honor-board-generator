import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SplitButtonModule } from 'primeng/splitbutton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BoardService } from '@core/board.service';
import { ExportService } from '@core/export.service';
import { TemplateOutletComponent } from '../../templates/template-outlet/template-outlet.component';
import { EditDrawerComponent } from './edit-drawer/edit-drawer.component';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SelectButtonModule,
    SplitButtonModule,
    ToastModule,
    TemplateOutletComponent,
    EditDrawerComponent,
  ],
  providers: [MessageService],
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.scss',
})
export class PreviewComponent {
  protected readonly board = inject(BoardService);
  protected readonly exportService = inject(ExportService);
  protected readonly messageService = inject(MessageService);
  protected readonly widthOptions = [
    { label: '800', value: 800 },
    { label: '1024', value: 1024 },
    { label: '1280', value: 1280 },
    { label: '1920', value: 1920 },
  ];

  protected readonly exportItems = [
    { label: '下載 PDF', icon: 'pi pi-file-pdf', command: () => this.download('pdf') },
    { label: '下載 PNG', icon: 'pi pi-image', command: () => this.download('png') },
    {
      label: '下載 HTML',
      icon: 'pi pi-code',
      command: () => this.download('html'),
    },
  ];

  protected async download(format: 'html' | 'pdf' | 'png'): Promise<void> {
    try {
      const el = document.querySelector('app-template-outlet') as HTMLElement;
      if (format === 'html') await this.exportService.downloadHtml(el);
      if (format === 'pdf') await this.exportService.downloadPdf(el, this.board.exportWidth());
      if (format === 'png') await this.exportService.downloadPng(el, this.board.exportWidth());
    } catch {
      this.messageService.add({ severity: 'error', summary: '下載失敗', detail: '請稍後再試' });
    }
  }
}
