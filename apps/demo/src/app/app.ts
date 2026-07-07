import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { NumberFlowComponent, NumberFlowGroupDirective } from 'ng-number-flow';

interface ExampleLink {
  readonly id: string;
  readonly label: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NumberFlowComponent, NumberFlowGroupDirective],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly examples: readonly ExampleLink[] = [
    { id: 'input', label: 'Input' },
    { id: 'activity', label: 'Activity' },
    { id: 'currency', label: 'Currency' },
    { id: 'countdown', label: 'Countdown' },
    { id: 'scoreboard', label: 'Scoreboard' },
  ];

  /** Which section is currently in view — drives the sidebar highlight. */
  protected readonly activeId = signal<string>(this.examples[0].id);

  // Input — a plain, user-driven counter.
  protected readonly count = signal(0);

  // Activity — a live metric that random-walks up and down so the trend shows.
  protected readonly activeUsers = signal(1284);
  protected readonly usersDelta = signal(0);

  // Currency — a running total the visitor can add to or refund.
  protected readonly balance = signal(1499.99);

  // Countdown — ticks down to zero, then loops.
  protected readonly countdown = signal(90);

  // Scoreboard — two values inside a synchronized group.
  protected readonly home = signal(2);
  protected readonly away = signal(1);

  constructor() {
    // Intervals and observers are DOM/browser concerns, so wire them in an
    // `afterNextRender` (client-only, zoneless-safe) and tear them down via
    // `DestroyRef` — no `ngOnInit`/`ngOnDestroy` needed.
    afterNextRender(() => {
      this.startLiveTicker();
      this.observeSections();
    });
  }

  protected inc(): void {
    this.count.update((v) => v + 1);
  }

  protected dec(): void {
    this.count.update((v) => v - 1);
  }

  protected addFunds(): void {
    this.balance.update((v) => +(v + 19.99).toFixed(2));
  }

  protected refund(): void {
    this.balance.update((v) => +Math.max(0, v - 49.5).toFixed(2));
  }

  protected scoreHome(): void {
    this.home.update((v) => v + 1);
  }

  protected scoreAway(): void {
    this.away.update((v) => v + 1);
  }

  protected resetScore(): void {
    this.home.set(0);
    this.away.set(0);
  }

  private startLiveTicker(): void {
    const id = setInterval(() => {
      const step = Math.floor(Math.random() * 61) - 24;
      this.usersDelta.set(step);
      this.activeUsers.update((v) => Math.max(0, v + step));
      this.countdown.update((v) => (v <= 0 ? 90 : v - 1));
    }, 1600);
    this.destroyRef.onDestroy(() => clearInterval(id));
  }

  private observeSections(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) this.activeId.set(entry.target.id);
        }
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    );

    for (const { id } of this.examples) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    this.destroyRef.onDestroy(() => observer.disconnect());
  }
}
