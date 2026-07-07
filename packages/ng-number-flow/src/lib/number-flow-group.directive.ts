import { Directive } from '@angular/core';
import type NumberFlowLite from 'number-flow/lite';
import { NUMBER_FLOW_GROUP, type NumberFlowGroupCoordinator } from './number-flow.tokens';

class Coordinator implements NumberFlowGroupCoordinator {
	private readonly flows = new Set<NumberFlowLite>();
	private updating = false;
	private endScheduled = false;

	register(el: NumberFlowLite): () => void {
		this.flows.add(el);
		return () => {
			this.flows.delete(el);
		};
	}

	beginUpdate(): void {
		if (this.updating) return;
		this.updating = true;
		this.flows.forEach((f) => {
			if ((f as { created?: boolean }).created) f.willUpdate();
		});
	}

	endUpdate(): void {
		if (this.endScheduled) return;
		this.endScheduled = true;
		queueMicrotask(() => {
			this.endScheduled = false;
			if (!this.updating) return;
			this.flows.forEach((f) => {
				if ((f as { created?: boolean }).created) f.didUpdate();
			});
			this.updating = false;
		});
	}
}

@Directive({
	selector: '[numberFlowGroup]',
	standalone: true,
	providers: [{ provide: NUMBER_FLOW_GROUP, useFactory: () => new Coordinator() }]
})
export class NumberFlowGroupDirective {}
