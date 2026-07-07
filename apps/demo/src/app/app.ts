import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { NumberFlowComponent, NumberFlowGroupDirective } from 'ng-number-flow';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [NumberFlowComponent, NumberFlowGroupDirective],
	template: `
		<main>
			<h1>ng-number-flow</h1>

			<section>
				<h2>Auto counter</h2>
				<number-flow class="big" [value]="count()" />
			</section>

			<section>
				<h2>Currency + prefix/suffix</h2>
				<number-flow
					class="big"
					[value]="price()"
					prefix="$"
					[format]="{ minimumFractionDigits: 2, maximumFractionDigits: 2 }"
					suffix=" USD"
				/>
			</section>

			<section>
				<h2>Grouped (synchronized)</h2>
				<div numberFlowGroup class="group">
					<number-flow [value]="a()" />
					<span class="sep">/</span>
					<number-flow [value]="b()" />
				</div>
			</section>

			<section>
				<h2>Manual</h2>
				<number-flow class="big" [value]="manual()" />
				<div class="controls">
					<button type="button" (click)="dec()">-10</button>
					<button type="button" (click)="inc()">+10</button>
					<button type="button" (click)="random()">random</button>
				</div>
			</section>
		</main>
	`,
	styles: [
		`
			:host {
				display: block;
				font-family:
					system-ui,
					-apple-system,
					sans-serif;
				color: #eee;
				background: #0b1020;
				min-height: 100vh;
			}
			main {
				max-width: 720px;
				margin: 0 auto;
				padding: 2.5rem 1.5rem;
			}
			h1 {
				font-size: 1.5rem;
				margin: 0 0 1.5rem;
			}
			h2 {
				font-size: 0.8rem;
				text-transform: uppercase;
				letter-spacing: 0.08em;
				color: #8b93a7;
				margin: 2rem 0 0.5rem;
				font-weight: 600;
			}
			section {
				border-top: 1px solid #1e2436;
				padding-top: 0.25rem;
			}
			.big {
				font-size: 3.5rem;
				font-weight: 700;
				font-variant-numeric: tabular-nums;
			}
			.group {
				display: flex;
				align-items: baseline;
				gap: 0.25rem;
				font-size: 3rem;
				font-weight: 700;
				font-variant-numeric: tabular-nums;
			}
			.sep {
				opacity: 0.4;
			}
			.controls {
				margin-top: 1rem;
				display: flex;
				gap: 0.5rem;
			}
			button {
				background: #1e2436;
				color: #eee;
				border: 1px solid #2c3550;
				padding: 0.5rem 0.9rem;
				border-radius: 8px;
				cursor: pointer;
				font-size: 0.95rem;
			}
			button:hover {
				background: #283154;
			}
		`,
	],
})
export class App implements OnInit, OnDestroy {
	protected readonly count = signal(0);
	protected readonly price = signal(12.34);
	protected readonly a = signal(120);
	protected readonly b = signal(480);
	protected readonly manual = signal(500);

	private intervalId?: ReturnType<typeof setInterval>;

	ngOnInit(): void {
		this.intervalId = setInterval(() => {
			this.count.update((v) => v + 1);
			this.price.update((v) => +(v + 0.37).toFixed(2));
			this.a.update((v) => v + Math.floor(Math.random() * 3) - 1);
			this.b.update((v) => v + Math.floor(Math.random() * 5) - 2);
		}, 1500);
	}

	ngOnDestroy(): void {
		if (this.intervalId) clearInterval(this.intervalId);
	}

	protected inc(): void {
		this.manual.update((v) => v + 10);
	}
	protected dec(): void {
		this.manual.update((v) => v - 10);
	}
	protected random(): void {
		this.manual.set(Math.floor(Math.random() * 10000));
	}
}
