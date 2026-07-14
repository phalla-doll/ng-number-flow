import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NumberFlowComponent, NumberFlowGroupDirective } from 'ng-number-flow';

interface ExampleLink {
  readonly id: string;
  readonly label: string;
}

interface OpenCode {
  readonly label: string;
  /** Raw source, used for the copy button. */
  readonly code: string;
  /** Syntax-highlighted HTML, bound into the dialog body. */
  readonly html: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, NumberFlowComponent, NumberFlowGroupDirective],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: { '[attr.data-theme]': 'theme()' },
})
export class App {
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Explicit light/dark override. `null` means "follow the OS" — the attribute
   * is then absent, so the `prefers-color-scheme` media queries govern. Resolved
   * from localStorage (or the OS) after first render, in `afterNextRender`.
   */
  protected readonly theme = signal<'light' | 'dark' | null>(null);

  private static readonly THEME_KEY = 'ng-number-flow-theme';

  protected readonly examples: readonly ExampleLink[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'input', label: 'Input' },
    { id: 'activity', label: 'Activity' },
    { id: 'currency', label: 'Currency' },
    { id: 'countdown', label: 'Countdown' },
    { id: 'scoreboard', label: 'Scoreboard' },
  ];

  /** Which section is currently in view — drives the sidebar highlight. */
  protected readonly activeId = signal<string>(this.examples[0].id);

  /** The `<dialog>` that shows an example's source. */
  private readonly codeDialog = viewChild.required<ElementRef<HTMLDialogElement>>('codeDialog');

  /** The example whose wire-up is currently shown, or `null` when closed. */
  protected readonly openCode = signal<OpenCode | null>(null);

  /** Brief "Copied" state for the dialog's copy button. */
  protected readonly copied = signal(false);

  /** Wire-up snippet for each example, keyed by section id. */
  private readonly source: Record<string, string> = {
    dashboard: `// component
revenue = signal(48290);
users = signal(12400);
conversion = signal(0.038);

// template — one group, three formats, all on the same frame
<div numberFlowGroup>
  <number-flow
    [value]="revenue()"
    [format]="{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }" />
  <number-flow
    [value]="users()"
    [format]="{ notation: 'compact', maximumFractionDigits: 1 }" />
  <number-flow
    [value]="conversion()"
    [format]="{ style: 'percent', minimumFractionDigits: 1 }" />
</div>`,
    input: `// component
count = signal(0);

// template
<button (click)="count.set(count() - 1)">−</button>
<number-flow [value]="count()" />
<button (click)="count.set(count() + 1)">+</button>`,
    activity: `// component
activeUsers = signal(1284);
usersDelta = signal(0);

setInterval(() => {
  const step = Math.floor(Math.random() * 61) - 24;
  usersDelta.set(step);
  activeUsers.update((v) => Math.max(0, v + step));
}, 1600);

// template
<number-flow [value]="activeUsers()" />
<number-flow
  [value]="usersDelta()"
  [format]="{ signDisplay: 'never' }"
  suffix=" in the last tick" />`,
    currency: `// component
balance = signal(1499.99);
addFunds() { balance.update((v) => +(v + 19.99).toFixed(2)); }
refund()   { balance.update((v) => +Math.max(0, v - 49.5).toFixed(2)); }

// template
<number-flow
  [value]="balance()"
  prefix="$"
  suffix=" USD"
  [format]="{ minimumFractionDigits: 2, maximumFractionDigits: 2 }" />`,
    countdown: `// component
countdown = signal(90);

setInterval(() => {
  countdown.update((v) => (v <= 0 ? 90 : v - 1));
}, 1600);

// template
<number-flow [value]="countdown()" suffix="s" />`,
    scoreboard: `// component
home = signal(2);
away = signal(1);

// template — numberFlowGroup batches both onto the same frame
<div numberFlowGroup>
  <number-flow [value]="home()" />
  <span class="sep">:</span>
  <number-flow [value]="away()" />
</div>`,
  };

  // Dashboard — live KPIs that random-walk every tick. Values feed different
  // Intl formats (currency / compact / percent); deltas are stored as
  // fractions so the percent formatter renders them directly.
  protected readonly dashRevenue = signal(48290);
  protected readonly dashRevenueDelta = signal(0.042);
  protected readonly dashUsers = signal(12400);
  protected readonly dashUsersDelta = signal(312);
  protected readonly dashConversion = signal(0.038);
  protected readonly dashConversionDelta = signal(-0.003);

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
      this.restoreTheme();
      this.startLiveTicker();
      this.observeSections();
    });
  }

  /** Load the saved theme, or fall back to the OS preference. Client-only. */
  private restoreTheme(): void {
    const saved = localStorage.getItem(App.THEME_KEY);
    if (saved === 'light' || saved === 'dark') {
      this.applyTheme(saved);
      return;
    }
    const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
    this.applyTheme(prefersDark ? 'dark' : 'light');
  }

  /** Flip between light and dark, persisting the choice. */
  protected toggleTheme(): void {
    this.applyTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private applyTheme(next: 'light' | 'dark'): void {
    this.theme.set(next);
    localStorage.setItem(App.THEME_KEY, next);
    // Mirror onto <html> so the global body/overscroll background (styles.css)
    // tracks the override too, not just the OS preference.
    document.documentElement.dataset['theme'] = next;
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

  /** Open the source dialog for the example with the given id. */
  protected showCode(id: string): void {
    const example = this.examples.find((e) => e.id === id);
    const code = this.source[id];
    if (!example || !code) return;
    this.copied.set(false);
    this.openCode.set({ label: example.label, code, html: this.highlight(code) });
    this.codeDialog().nativeElement.showModal();
  }

  protected closeCode(): void {
    this.codeDialog().nativeElement.close();
  }

  /** Native `<dialog>` close (button, Escape, or backdrop) — clear the state. */
  protected onDialogClose(): void {
    this.openCode.set(null);
    this.copied.set(false);
  }

  /** Close when the click lands on the backdrop rather than the dialog card. */
  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.codeDialog().nativeElement) this.closeCode();
  }

  protected async copyCode(code: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1500);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — ignore.
    }
  }

  /**
   * Tiny tokenizer that wraps the snippet in colored `<span>`s. Purpose-built
   * for these mixed TS + Angular-template samples — not a general highlighter.
   * Scans left-to-right so tokens never overlap, and escapes every emitted
   * character (the wrapped output is bound with `[innerHTML]`).
   */
  private highlight(code: string): string {
    const escape = (s: string): string =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Sticky patterns, tried in priority order at each cursor position.
    const patterns: readonly [string, RegExp][] = [
      ['tok-comment', /\/\/[^\n]*/y],
      ['tok-string', /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/y],
      ['tok-tag', /<\/?[a-zA-Z][\w-]*|\/?>/y],
      ['tok-attr', /\[[a-zA-Z][\w.-]*\]|\([a-zA-Z][\w.-]*\)/y],
      ['tok-number', /\b\d+(?:\.\d+)?\b/y],
      ['tok-keyword', /\b(?:const|let|signal|update|set|new|return|Math)\b/y],
    ];

    let out = '';
    let i = 0;
    while (i < code.length) {
      let matched = false;
      for (const [cls, re] of patterns) {
        re.lastIndex = i;
        const m = re.exec(code);
        if (m) {
          out += `<span class="${cls}">${escape(m[0])}</span>`;
          i += m[0].length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        out += escape(code[i]);
        i++;
      }
    }
    return out;
  }

  private startLiveTicker(): void {
    const id = setInterval(() => {
      const step = Math.floor(Math.random() * 61) - 24;
      this.usersDelta.set(step);
      this.activeUsers.update((v) => Math.max(0, v + step));
      this.countdown.update((v) => (v <= 0 ? 90 : v - 1));
      this.tickDashboard();
    }, 1600);
    this.destroyRef.onDestroy(() => clearInterval(id));
  }

  /** Random-walk each KPI and record the change as this tick's delta. */
  private tickDashboard(): void {
    const rev = this.dashRevenue();
    const revStep = Math.floor(Math.random() * 3400) - 1200;
    this.dashRevenue.set(Math.max(0, rev + revStep));
    this.dashRevenueDelta.set(rev ? revStep / rev : 0);

    const usrStep = Math.floor(Math.random() * 900) - 340;
    this.dashUsersDelta.set(usrStep);
    this.dashUsers.update((v) => Math.max(0, v + usrStep));

    const convStep = Math.random() * 0.008 - 0.0035;
    this.dashConversionDelta.set(convStep);
    this.dashConversion.update((v) => Math.max(0, v + convStep));
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
