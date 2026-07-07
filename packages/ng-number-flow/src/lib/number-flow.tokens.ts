import { InjectionToken } from '@angular/core';
import type NumberFlowLite from 'number-flow/lite';

export interface NumberFlowGroupCoordinator {
	register(el: NumberFlowLite): () => void;
	beginUpdate(): void;
	endUpdate(): void;
}

export const NUMBER_FLOW_GROUP = new InjectionToken<NumberFlowGroupCoordinator | null>(
	'NUMBER_FLOW_GROUP'
);
