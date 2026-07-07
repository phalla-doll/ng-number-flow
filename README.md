# ng-number-flow

An Angular (17+ standalone) wrapper around [number-flow](https://github.com/barvian/number-flow) —
an accessible, animated number component. Smooth rolling-digit transitions, locale-aware
formatting, and synchronized groups, built on the same framework-agnostic engine as the official
React, Vue, and Svelte packages.

- 🎞️ Rolling-digit transitions (Web Animations API)
- ♿ Accessible (`role="img"` + `aria-label`)
- 🌍 `Intl.NumberFormat` formatting (cached)
- 🧩 Group directive for synchronized animations
- 🅰️ Standalone, `OnPush`, zoneless-compatible; Angular 17 → latest

## Installation

```bash
npm i ng-number-flow number-flow
```

## Usage

```ts
import { Component, signal } from '@angular/core';
import { NumberFlowComponent } from 'ng-number-flow';

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [NumberFlowComponent],
  template: `<number-flow [value]="count()" />`,
})
export class DemoComponent {
  readonly count = signal(3500);
}
```

Formatting (any `Intl.NumberFormat` options, plus `locales`, `prefix`, `suffix`):

```html
<number-flow [value]="price()" [format]="{ style: 'currency', currency: 'USD' }" />
```

Grouping — synchronize animations across multiple numbers:

```ts
import { NumberFlowComponent, NumberFlowGroupDirective } from 'ng-number-flow';

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [NumberFlowComponent, NumberFlowGroupDirective],
  template: `
    <div numberFlowGroup>
      <number-flow [value]="a()" /> / <number-flow [value]="b()" />
    </div>
  `,
})
export class GroupComponent {}
```

**Full API reference** (all inputs, outputs, timing options, exported types) lives in the package
README: [`packages/ng-number-flow/README.md`](./packages/ng-number-flow/README.md).

## Repository layout

```
ng-number-flow/
├── apps/
│   └── demo/                     # standalone Angular demo app (zoneless)
├── docs/                         # feasibility + implementation notes
└── packages/
    └── ng-number-flow/           # the publishable Angular library (ng-packagr)
```

This is a pnpm workspace.

## Development

```bash
pnpm install

# Build the library (ng-packagr → packages/ng-number-flow/dist)
pnpm --filter ng-number-flow build

# Run the demo app (imports the library from source, live reload)
pnpm --filter demo start
```

The demo imports the library from source via a tsconfig `paths` mapping, so library edits
hot-reload without a rebuild.

See [`docs/feasibility-and-implementation-plan.md`](./docs/feasibility-and-implementation-plan.md)
for the architecture investigation and as-built implementation notes.

## SSR

Client-side only in this release; the component initializes in the browser. Declarative-Shadow-DOM
hydration is a planned follow-up.

## License

MIT — same as `number-flow`.
