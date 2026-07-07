import { InjectionToken } from '@angular/core';
import type NumberFlowLite from 'number-flow/lite';

export type RegisterWithGroup = (
	el: NumberFlowLite
) => {
	willUpdate: () => void;
	didUpdate: () => void;
} | void;

export const NUMBER_FLOW_GROUP = new InjectionToken<RegisterWithGroup | null>(
	'NUMBER_FLOW_GROUP'
);
