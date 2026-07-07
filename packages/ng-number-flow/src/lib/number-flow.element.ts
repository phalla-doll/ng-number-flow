import NumberFlowLite, { define } from 'number-flow/lite';

export const NUMBER_FLOW_ELEMENT_NAME = 'number-flow-ng';

export function defineNumberFlowElement(): void {
	define(NUMBER_FLOW_ELEMENT_NAME, NumberFlowLite);
}
