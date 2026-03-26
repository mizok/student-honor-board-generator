import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';
import { DialogModule } from 'primeng/dialog';
import { ChipModule } from 'primeng/chip';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { BoardService } from '../../../core/board.service';
import type {
  ExamResultData,
  ClassRankingData,
  ExamResultStudent,
  RankingEntry,
} from '@honor/shared-types';

@Component({
  selector: 'app-edit-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DrawerModule,
    DialogModule,
    ChipModule,
    ButtonModule,
    InputTextModule,
    SelectButtonModule,
    ToggleSwitchModule,
  ],
  templateUrl: './edit-drawer.component.html',
  styleUrl: './edit-drawer.component.scss',
})
export class EditDrawerComponent {
  protected readonly board = inject(BoardService);

  protected readonly isExamResult = computed(() => this.board.templateId() === 'exam-result');
  protected readonly isClassRanking = computed(() => this.board.templateId() === 'class-ranking');

  protected readonly examData = computed(() =>
    this.isExamResult() ? (this.board.parsedData() as ExamResultData) : null,
  );

  protected readonly rankingData = computed(() =>
    this.isClassRanking() ? (this.board.parsedData() as ClassRankingData) : null,
  );

  protected editingIndex = signal<{ section: string; index: number } | null>(null);
  protected editBuffer = signal<Record<string, string>>({});

  protected readonly dialogVisible = computed(() => this.editingIndex() !== null);

  protected readonly columnOptions = [2, 3, 4, 5, 6].map((n) => ({ label: String(n), value: n }));

  protected readonly title = computed(() => this.board.parsedData()?.title ?? '');
  protected readonly subtitle = computed(() => this.board.parsedData()?.subtitle ?? '');
  protected readonly tagline = computed(
    () => (this.board.parsedData() as ExamResultData)?.tagline ?? '',
  );

  protected updateTitle(value: string): void {
    const data = this.board.parsedData();
    if (data) this.board.parsedData.set({ ...data, title: value });
  }

  protected updateSubtitle(value: string): void {
    const data = this.board.parsedData();
    if (data) this.board.parsedData.set({ ...data, subtitle: value });
  }

  protected updateTagline(value: string): void {
    const data = this.board.parsedData();
    if (data) this.board.parsedData.set({ ...data, tagline: value });
  }

  protected updateBuffer(key: string, value: string): void {
    this.editBuffer.update((buf) => ({ ...buf, [key]: value }));
  }

  protected startEdit(section: string, index: number, entry: Record<string, unknown>): void {
    this.editBuffer.set(Object.fromEntries(Object.entries(entry).map(([k, v]) => [k, String(v)])));
    this.editingIndex.set({ section, index });
  }

  protected closeDialog(): void {
    this.editingIndex.set(null);
  }

  protected saveEdit(): void {
    const pos = this.editingIndex();
    if (!pos) return;

    const data = this.board.parsedData();
    if (!data) return;

    if (this.isExamResult() && pos.section === 'students') {
      const updated = { ...(data as ExamResultData) };
      updated.students = [...updated.students];
      updated.students[pos.index] = {
        ...this.editBuffer(),
        highlight: this.editBuffer()['highlight'] === 'true',
      } as unknown as ExamResultStudent;
      this.board.parsedData.set(updated);
    }

    if (this.isClassRanking()) {
      const updated = { ...(data as ClassRankingData) };
      const key = pos.section as 'schoolRankings' | 'classRankings';
      updated[key] = [...updated[key]];
      updated[key][pos.index] = {
        ...this.editBuffer(),
        rank: Number(this.editBuffer()['rank']),
      } as RankingEntry;
      this.board.parsedData.set(updated);
    }

    this.editingIndex.set(null);
  }

  protected deleteEntry(section: string, index: number): void {
    const data = this.board.parsedData();
    if (!data) return;

    if (this.isExamResult() && section === 'students') {
      const updated = { ...(data as ExamResultData) };
      updated.students = updated.students.filter((_, i) => i !== index);
      this.board.parsedData.set(updated);
    }

    if (this.isClassRanking()) {
      const updated = { ...(data as ClassRankingData) };
      const key = section as 'schoolRankings' | 'classRankings';
      updated[key] = updated[key].filter((_, i) => i !== index);
      this.board.parsedData.set(updated);
    }
  }

  protected addEntry(section: string): void {
    const data = this.board.parsedData();
    if (!data) return;

    if (this.isExamResult()) {
      const updated = { ...(data as ExamResultData) };
      updated.students = [
        ...updated.students,
        { tag: '', school: '', studentName: '新學生', description: '', highlight: false },
      ];
      this.board.parsedData.set(updated);
    }

    if (this.isClassRanking()) {
      const updated = { ...(data as ClassRankingData) };
      const key = section as 'schoolRankings' | 'classRankings';
      const nextRank = (updated[key].at(-1)?.rank ?? 0) + 1;
      updated[key] = [...updated[key], { rank: nextRank, classNumber: '', studentName: '新學生' }];
      this.board.parsedData.set(updated);
    }
  }
}
