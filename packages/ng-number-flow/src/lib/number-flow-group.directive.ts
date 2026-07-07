import {
	ChangeDetectionStrategy,
	Directive,
	OnDestroy,
	InjectionToken,
	inject
} from '@angular/core';
import type NumberFlowLite from 'number-flow/lite';
import { NUMBER_FLOW_GROUP } from './number-flow.tokens';

type RegisteredFlow = NumberFlowLite;

@Directive({
	selector: '[numberFlowGroup]',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		{
			provide: NUMBER_FLOW_GROUP,
			useFactory: () => {
				const flows = new Set<RegisteredFlow>();
				let updating = false;

				const register = (el: NumberFlowLite) => {
					flows.add(el);
					return {
						willUpdate: () => {
							if (updating) return;
							updating = true;
							flows.forEach((f) => {
								if ((f as any).created) (f as any).willUpdate();
							});
						},
						didUpdate: () => {
							flows.forEach((f) => {
								if ((f as any).created) (f as any).didUpdate();
							});
							updating = false;
						}
					};
				};

				return register;
			}
		}
	]
})
export class NumberFlowGroupDirective implements OnDestroy {
	readonly token = inject(NUMBER_FLOW_GROUP);

	ngOnDestroy(): void {}
}
