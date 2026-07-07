# ng-number-flow

An Angular (17+ standalone) wrapper around [number-flow](https://github.com/barvian/number-flow) — an accessible, animated number component.

> **Status:** Scaffold + design phase. The animation engine is the framework-agnostic
> `number-flow/lite` web component; this repo is a thin Angular wrapper, mirroring the
> existing `@number-flow/react`, `@number-flow/vue`, and `@number-flow/svelte` packages.

## Why

`number-flow` ships a core Web Component plus thin framework wrappers. There is no Angular
wrapper yet. This project adds one, targeting Angular 17+ standalone components.

See [`docs/feasibility-and-implementation-plan.md`](./docs/feasibility-and-implementation-plan.md)
for the full investigation and implementation plan.

## Planned API (subject to change during implementation)

```ts
import { NumberFlowComponent } from 'ng-number-flow';

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [NumberFlowComponent],
  template: `<number-flow [value]="count" />`,
})
export class DemoComponent {
  count = 3500;
}
```

Grouping (coordinated animations across multiple flows):

```ts
import { NumberFlowComponent, NumberFlowGroupDirective } from 'ng-number-flow';

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [NumberFlowComponent, NumberFlowGroupDirective],
  template: `
    <div numberFlowGroup>
      <number-flow [value]="a" />
      <number-flow [value]="b" />
    </div>
  `,
})
export class GroupComponent {}
```

## Repository layout

```
ng-number-flow/
├── docs/                          # feasibility + implementation plan
└── packages/
    └── ng-number-flow/            # the publishable Angular library (ng-packagr)
```

## License

MIT
