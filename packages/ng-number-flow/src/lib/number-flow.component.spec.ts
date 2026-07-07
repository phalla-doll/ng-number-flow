import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type NumberFlowLite from 'number-flow/lite';
import { NumberFlowComponent } from './number-flow.component';
import { NumberFlowGroupDirective } from './number-flow-group.directive';

function innerEl(fixture: ComponentFixture<unknown>): NumberFlowLite {
	return fixture.nativeElement.querySelector('number-flow-ng') as NumberFlowLite;
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
	fixture.detectChanges();
	await fixture.whenStable();
}

describe('NumberFlowComponent', () => {
	it('creates and renders the inner custom element', async () => {
		const fixture = TestBed.createComponent(NumberFlowComponent);
		fixture.componentRef.setInput('value', 42);
		await settle(fixture);
		expect(innerEl(fixture)).toBeTruthy();
	});

	it('passes props through to the underlying element', async () => {
		const fixture = TestBed.createComponent(NumberFlowComponent);
		fixture.componentRef.setInput('value', 10);
		fixture.componentRef.setInput('animated', false);
		fixture.componentRef.setInput('trend', 1);
		await settle(fixture);

		const el = innerEl(fixture);
		expect(el.animated).toBe(false);
		expect(el.trend).toBe(1);
	});

	it('reacts to input changes after the first render', async () => {
		const fixture = TestBed.createComponent(NumberFlowComponent);
		fixture.componentRef.setInput('value', 1);
		fixture.componentRef.setInput('animated', true);
		await settle(fixture);
		expect(innerEl(fixture).animated).toBe(true);

		fixture.componentRef.setInput('animated', false);
		await settle(fixture);
		expect(innerEl(fixture).animated).toBe(false);
	});

	it('emits animationsStart / animationsFinish from element events', async () => {
		const fixture = TestBed.createComponent(NumberFlowComponent);
		fixture.componentRef.setInput('value', 1);
		await settle(fixture);

		let started = 0;
		let finished = 0;
		fixture.componentInstance.animationsStart.subscribe(() => started++);
		fixture.componentInstance.animationsFinish.subscribe(() => finished++);

		const el = innerEl(fixture);
		el.dispatchEvent(new Event('animationsstart'));
		el.dispatchEvent(new Event('animationsfinish'));

		expect(started).toBe(1);
		expect(finished).toBe(1);
	});

	it('does not batch when used outside a group', async () => {
		const fixture = TestBed.createComponent(NumberFlowComponent);
		fixture.componentRef.setInput('value', 1);
		await settle(fixture);
		expect(innerEl(fixture).batched).toBe(false);
	});
});

@Component({
	standalone: true,
	imports: [NumberFlowComponent, NumberFlowGroupDirective],
	template: `<div numberFlowGroup>
		<number-flow [value]="value()" [isolate]="isolate()" />
	</div>`
})
class GroupHost {
	readonly value = signal(5);
	readonly isolate = signal(false);
}

describe('NumberFlowComponent inside a group', () => {
	it('enables batching when inside numberFlowGroup', async () => {
		const fixture = TestBed.createComponent(GroupHost);
		await settle(fixture);
		expect(innerEl(fixture).batched).toBe(true);
	});

	it('opts out of batching when isolate is set', async () => {
		const fixture = TestBed.createComponent(GroupHost);
		fixture.componentInstance.isolate.set(true);
		await settle(fixture);
		expect(innerEl(fixture).batched).toBe(false);
	});
});
