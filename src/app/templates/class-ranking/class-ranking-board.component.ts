import { Component, input, computed } from '@angular/core'
import { CommonModule } from '@angular/common'
import type { ClassRankingData, RankingEntry } from '@honor/shared-types'

@Component({
  selector: 'app-class-ranking-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './class-ranking-board.component.html',
  styleUrl: './class-ranking-board.component.scss',
})
export class ClassRankingBoardComponent {
  readonly data = input.required<ClassRankingData>()
  readonly columns = input<number>(4)
  readonly maskNames = input<boolean>(false)

  protected mask(name: string): string {
    if (!this.maskNames()) return name
    if (name.length <= 1) return name
    if (name.length === 2) return name[0] + '○'
    return name[0] + '○'.repeat(name.length - 2) + name[name.length - 1]
  }

  protected readonly cardsStyle = computed(() => ({
    'grid-template-columns': `repeat(${this.columns()}, 1fr)`,
  }))

  readonly schoolByRank = computed(() => this.groupByRank(this.data().schoolRankings))
  readonly classByRank = computed(() => this.groupByRank(this.data().classRankings))

  private groupByRank(entries: RankingEntry[]): Map<number, RankingEntry[]> {
    const map = new Map<number, RankingEntry[]>()
    for (const entry of entries) {
      const arr = map.get(entry.rank) ?? []
      arr.push(entry)
      map.set(entry.rank, arr)
    }
    return map
  }

  protected rankLabel(rank: number): string {
    const labels: Record<number, string> = { 1: '第一名', 2: '第二名', 3: '第三名', 4: '第四名', 5: '第五名', 6: '第六名', 7: '第七名', 8: '第八名', 9: '第九名', 10: '第十名' }
    return labels[rank] ?? `第${rank}名`
  }
}
