import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	NgZone,
	OnInit,
	PLATFORM_ID,
	computed,
	inject,
	input,
	output
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { formatToData, type Data, type Digits, type Format, type Plugin, type Trend, type Value } from 'number-flow/lite';
import { defineNumberFlowElement, NUMBER_FLOW_ELEMENT_NAME } from './number-flow.element';
import { getFormatter } from './formatter-cache';
import { NUMBER_FLOW_GROUP } from './number-flow.tokens';

defineNumberFlowElement();

@Component({
	selector: NUMBER_FLOW_ELEMENT_NAME,
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: '',
	host: { style: 'display: inline-block' }
})
export class NumberFlowComponent implements OnInit {
	private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
	private readonly zone = inject(NgZone);
	private readonly platformId = inject(PLATFORM_ID);
	private readonly register = inject(NUMBER_FLOW_GROUP, { optional: true });

	readonly value = input<Value | undefined>(undefined);
	readonly locales = input<Intl.LocalesArgument | undefined>(undefined);
	readonly format = input<Format | undefined>(undefined);
	readonly prefix = input<string | undefined>(undefined);
	readonly suffix = input<string | undefined>(undefined);
	readonly animated = input<boolean>(true);
	readonly respectMotionPreference = input<boolean>(true);
	readonly transformTiming = input<EffectTiming | undefined>(undefined);
	readonly spinTiming = input<EffectTiming | undefined>(undefined);
	readonly opacityTiming = input<EffectTiming | undefined>(undefined);
	readonly trend = input<Trend | undefined>(undefined);
	readonly plugins = input<Plugin[] | undefined>(undefined);
	readonly digits = input<Digits | undefined>(undefined);
	readonly isolate = input<boolean>(false);
	readonly willChange = input<boolean>(false);
	readonly nonce = input<string | undefined>(undefined);

	readonly animationsStart = output<void>();
	readonly animationsFinish = output<void>();

	private readonly data = computed<Data | undefined>(() => {
		const value = this.value();
		if (value == null) return undefined;
		return formatToData(
			value,
			getFormatter(this.locales(), this.format()),
			this.prefix(),
			this.suffix()
		);
	});

	ngOnInit(): void {
		if (!isPlatformBrowser(this.platformId)) return;
		this.registerGroup();
	}

	private registerGroup(): void {
		const el = this.host.nativeElement as unknown as import('number-flow/lite').default;
		this.register?.(el);
	}
}
