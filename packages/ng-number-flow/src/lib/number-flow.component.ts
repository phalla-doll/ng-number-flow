import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	EventEmitter,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	Output,
	ViewChild,
	inject,
	PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import NumberFlowLite, {
	formatToData,
	type Digits,
	type Format,
	type Trend,
	type Value
} from 'number-flow/lite';
import type { Plugin } from 'number-flow/plugins';
import { getFormatter } from './formatter-cache';
import { NUMBER_FLOW_GROUP, type NumberFlowGroupCoordinator } from './number-flow.tokens';
import './number-flow.element';

const ELEMENT_NAME = 'number-flow-ng';

@Component({
	selector: 'number-flow',
	standalone: true,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `<number-flow-ng #flow></number-flow-ng>`,
	host: { style: 'display: contents' }
})
export class NumberFlowComponent implements OnInit, OnChanges, OnDestroy {
	@ViewChild('flow', { static: true })
	private flowRef!: ElementRef<NumberFlowLite>;

	@Input() value?: Value;
	@Input() locales?: Intl.LocalesArgument;
	@Input() format?: Format;
	@Input() prefix?: string;
	@Input() suffix?: string;
	@Input() animated?: boolean;
	@Input() respectMotionPreference?: boolean;
	@Input() transformTiming?: EffectTiming;
	@Input() spinTiming?: EffectTiming;
	@Input() opacityTiming?: EffectTiming;
	@Input() trend?: Trend;
	@Input() plugins?: Plugin[];
	@Input() digits?: Digits;
	@Input() isolate = false;
	@Input() willChange = false;
	@Input() nonce?: string;

	@Output() animationsStart = new EventEmitter<void>();
	@Output() animationsFinish = new EventEmitter<void>();

	private readonly platformId = inject(PLATFORM_ID);
	private readonly isBrowser = isPlatformBrowser(this.platformId);
	private readonly group = inject(NUMBER_FLOW_GROUP, { optional: true });

	private initialized = false;
	private listenersAttached = false;
	private unregister?: () => void;

	ngOnInit(): void {
		const el = this.el();
		if (!el || !this.isBrowser) return;

		this.attachListeners(el);

		if (this.group) {
			this.unregister = this.group.register(el);
		}

		this.applyProps(el);
		this.applyData(el);
		this.initialized = true;
	}

	ngOnChanges(): void {
		if (!this.initialized) return;
		const el = this.el();
		if (!el || !this.isBrowser) return;
		this.applyProps(el);
		this.applyData(el);
	}

	ngOnDestroy(): void {
		this.unregister?.();
	}

	private el(): NumberFlowLite | undefined {
		return this.flowRef?.nativeElement as NumberFlowLite | undefined;
	}

	private attachListeners(el: NumberFlowLite): void {
		if (this.listenersAttached) return;
		this.listenersAttached = true;
		el.addEventListener('animationsstart', () => this.animationsStart.emit());
		el.addEventListener('animationsfinish', () => this.animationsFinish.emit());
	}

	private applyProps(el: NumberFlowLite): void {
		const d = NumberFlowLite.defaultProps;
		el.animated = this.animated ?? d.animated;
		el.respectMotionPreference = this.respectMotionPreference ?? d.respectMotionPreference;
		el.transformTiming = this.transformTiming ?? d.transformTiming;
		el.spinTiming = this.spinTiming ?? d.spinTiming;
		el.opacityTiming = this.opacityTiming ?? d.opacityTiming;
		el.trend = this.trend ?? d.trend;
		el.plugins = this.plugins ?? d.plugins;
		el.digits = this.digits ?? d.digits;
		el.batched = !!this.group && !this.isolate;

		if (this.willChange) el.setAttribute('data-will-change', '');
		else el.removeAttribute('data-will-change');
	}

	private applyData(el: NumberFlowLite): void {
		if (this.value == null) return;

		const data = formatToData(
			this.value,
			getFormatter(this.locales, this.format),
			this.prefix,
			this.suffix
		);

		if (this.group && !this.isolate) {
			this.group.beginUpdate();
			el.data = data;
			this.group.endUpdate();
		} else {
			el.data = data;
		}
	}
}
