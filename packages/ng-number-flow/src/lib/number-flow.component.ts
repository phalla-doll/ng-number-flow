import {
	afterNextRender,
	afterRenderEffect,
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	DestroyRef,
	ElementRef,
	inject,
	input,
	output,
	viewChild
} from '@angular/core';
import NumberFlowLite, {
	formatToData,
	type Digits,
	type Format,
	type Trend,
	type Value
} from 'number-flow/lite';
import type { Plugin } from 'number-flow/plugins';
import { getFormatter } from './formatter-cache';
import { NUMBER_FLOW_GROUP } from './number-flow.tokens';
import './number-flow.element';

@Component({
	selector: 'number-flow',
	standalone: true,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `<number-flow-ng #flow></number-flow-ng>`,
	host: { style: 'display: contents' }
})
export class NumberFlowComponent {
	private readonly flowRef = viewChild.required<ElementRef<NumberFlowLite>>('flow');

	readonly value = input<Value>();
	readonly locales = input<Intl.LocalesArgument>();
	readonly format = input<Format>();
	readonly prefix = input<string>();
	readonly suffix = input<string>();
	readonly animated = input<boolean>();
	readonly respectMotionPreference = input<boolean>();
	readonly transformTiming = input<EffectTiming>();
	readonly spinTiming = input<EffectTiming>();
	readonly opacityTiming = input<EffectTiming>();
	readonly trend = input<Trend>();
	readonly plugins = input<Plugin[]>();
	readonly digits = input<Digits>();
	readonly isolate = input(false);
	readonly willChange = input(false);
	readonly nonce = input<string>();

	readonly animationsStart = output<void>();
	readonly animationsFinish = output<void>();

	private readonly group = inject(NUMBER_FLOW_GROUP, { optional: true });
	private readonly destroyRef = inject(DestroyRef);

	constructor() {
		// One-time setup: wire events and register with the group. `afterNextRender`
		// runs on the client only (never during SSR) and after the view exists, so the
		// view child is guaranteed resolved.
		afterNextRender(() => {
			const el = this.flowRef().nativeElement;

			const onStart = () => this.animationsStart.emit();
			const onFinish = () => this.animationsFinish.emit();
			el.addEventListener('animationsstart', onStart);
			el.addEventListener('animationsfinish', onFinish);

			const unregister = this.group?.register(el);

			this.destroyRef.onDestroy(() => {
				el.removeEventListener('animationsstart', onStart);
				el.removeEventListener('animationsfinish', onFinish);
				unregister?.();
			});
		});

		// Reactive sync: push the current inputs onto the custom element whenever any of
		// them change. Custom-element property assignment is DOM work, so it belongs in
		// `afterRenderEffect` (client-only) rather than a plain `effect`.
		afterRenderEffect({
			write: () => {
				const el = this.flowRef().nativeElement;
				this.applyProps(el);
				this.applyData(el);
			}
		});
	}

	private applyProps(el: NumberFlowLite): void {
		const d = NumberFlowLite.defaultProps;
		el.animated = this.animated() ?? d.animated;
		el.respectMotionPreference = this.respectMotionPreference() ?? d.respectMotionPreference;
		el.transformTiming = this.transformTiming() ?? d.transformTiming;
		el.spinTiming = this.spinTiming() ?? d.spinTiming;
		el.opacityTiming = this.opacityTiming() ?? d.opacityTiming;
		el.trend = this.trend() ?? d.trend;
		el.plugins = this.plugins() ?? d.plugins;
		el.digits = this.digits() ?? d.digits;
		el.batched = !!this.group && !this.isolate();

		if (this.willChange()) el.setAttribute('data-will-change', '');
		else el.removeAttribute('data-will-change');
	}

	private applyData(el: NumberFlowLite): void {
		const value = this.value();
		if (value == null) return;

		const data = formatToData(
			value,
			getFormatter(this.locales(), this.format()),
			this.prefix(),
			this.suffix()
		);

		if (this.group && !this.isolate()) {
			this.group.beginUpdate();
			el.data = data;
			this.group.endUpdate();
		} else {
			el.data = data;
		}
	}
}
