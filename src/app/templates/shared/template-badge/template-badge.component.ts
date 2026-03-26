import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

interface BadgePalette {
  readonly gradientTop: string;
  readonly gradientBottom: string;
  readonly textColor: string;
}

@Component({
  selector: 'app-template-badge',
  imports: [],
  templateUrl: './template-badge.component.html',
  styleUrl: './template-badge.component.scss',
})
export class TemplateBadgeComponent {
  readonly label = input.required<string>();
  readonly tone = input<'gold' | 'green'>('gold');
  readonly minWidth = input<string>('');

  private readonly destroyRef = inject(DestroyRef);
  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');

  private static nextId = 0;
  private readonly badgeId = `template-badge-${TemplateBadgeComponent.nextId++}`;

  protected readonly gradientId = `${this.badgeId}-gradient`;
  protected readonly svgWidth = signal(260);
  protected readonly svgHeight = signal(64);
  protected readonly backgroundViewBox = computed(
    () => `0 0 ${this.svgWidth()} ${this.svgHeight()}`,
  );
  protected readonly edgeWidth = computed(() => Math.round(this.svgHeight() * 0.5));
  protected readonly joinInset = computed(() => Math.round(this.svgHeight() * 0.21875));
  protected readonly bodyX = computed(() => this.joinInset());
  protected readonly bodyWidth = computed(() =>
    Math.max(this.svgWidth() - this.joinInset() * 2, 1),
  );
  protected readonly startPoints = computed(() => {
    const edgeWidth = this.edgeWidth();
    const joinInset = this.joinInset();
    const height = this.svgHeight();
    const midY = Math.round(height / 2);

    return `${edgeWidth},0 ${joinInset},0 0,${midY} ${joinInset},${height} ${edgeWidth},${height}`;
  });
  protected readonly endPoints = computed(() => {
    const width = this.svgWidth();
    const edgeWidth = this.edgeWidth();
    const joinInset = this.joinInset();
    const height = this.svgHeight();
    const midY = Math.round(height / 2);

    return `${width - edgeWidth},0 ${width - joinInset},0 ${width},${midY} ${width - joinInset},${height} ${width - edgeWidth},${height}`;
  });

  protected readonly palette = computed<BadgePalette>(() => {
    if (this.tone() === 'green') {
      return {
        gradientTop: '#c8dbcb',
        gradientBottom: '#9cb59d',
        textColor: '#274235',
      };
    }

    return {
      gradientTop: '#efca74',
      gradientBottom: '#d9ac46',
      textColor: '#4c3208',
    };
  });

  constructor() {
    afterNextRender(() => {
      const rootElement = this.root().nativeElement;
      const updateSize = (width: number, height: number) => {
        this.svgWidth.set(Math.max(Math.round(width), 1));
        this.svgHeight.set(Math.max(Math.round(height), 1));
      };

      updateSize(rootElement.getBoundingClientRect().width, rootElement.getBoundingClientRect().height);

      const observer = new ResizeObserver(entries => {
        const entry = entries[0];
        if (!entry) return;
        updateSize(entry.contentRect.width, entry.contentRect.height);
      });

      observer.observe(rootElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
