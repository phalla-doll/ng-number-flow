# ng-number-flow

An Angular (17+ standalone) animated number component. A thin, dependency-light wrapper around
the framework-agnostic [`number-flow`](https://github.com/barvian/number-flow) web component —
the same animation/formatting engine used by the official React, Vue, and Svelte packages.

- 🎞️ Smooth rolling-digit transitions (Web Animations API)
- ♿ Accessible out of the box (`role="img"` + `aria-label`)
- 🌍 Locale-aware formatting via `Intl.NumberFormat`
- 🧩 Group directive to synchronize animations across multiple numbers
- 🅰️ Standalone, `OnPush`, zoneless-compatible; works with Angular 17 → latest

## Installation

```bash
npm i ng-number-flow number-flow
# or
pnpm add ng-number-flow number-flow
```

`number-flow` is a runtime dependency of the wrapper and installed automatically, but keeping it
in your own `package.json` is recommended so bundlers resolve it reliably.

## Quick start

`NumberFlowComponent` is a standalone component with the selector `number-flow`. Import it and
bind a `value`:

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

Whenever `value` changes, the digits animate from the old value to the new one.

## Formatting

Pass a standard [`Intl.NumberFormat` options](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#options)
object to `format`, and optionally `locales`, `prefix`, and `suffix`:

```html
<!-- Currency -->
<number-flow
  [value]="price()"
  [format]="{ style: 'currency', currency: 'USD' }"
/>

<!-- Percent -->
<number-flow
  [value]="ratio()"
  [format]="{ style: 'percent', maximumFractionDigits: 1 }"
/>

<!-- Fixed decimals with prefix/suffix and a locale -->
<number-flow
  [value]="amount()"
  locales="de-DE"
  prefix="$"
  suffix=" USD"
  [format]="{ minimumFractionDigits: 2, maximumFractionDigits: 2 }"
/>
```

`Intl.NumberFormat` instances are cached internally (keyed by `locales:format`), so re-renders
are cheap.

## Grouping (synchronized animations)

Wrap multiple `number-flow` elements with the `numberFlowGroup` directive so their animations
start on the **same frame**, even when only some values change:

```ts
import { Component, signal } from '@angular/core';
import { NumberFlowComponent, NumberFlowGroupDirective } from 'ng-number-flow';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [NumberFlowComponent, NumberFlowGroupDirective],
  template: `
    <div numberFlowGroup>
      <number-flow [value]="wins()" /> / <number-flow [value]="total()" />
    </div>
  `,
})
export class StatsComponent {
  readonly wins = signal(120);
  readonly total = signal(480);
}
```

To exclude a single child from group batching (animate it independently), set `[isolate]="true"`
on that `number-flow`.

## API

### `NumberFlowComponent` — `<number-flow>`

#### Inputs

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `number \| bigint \| string` (`Value`) | — | The number to display. Changing it triggers the animation. |
| `locales` | `Intl.LocalesArgument` | runtime default | BCP 47 locale(s) for formatting. |
| `format` | `Format` (`Intl.NumberFormatOptions`) | — | Number formatting options. |
| `prefix` | `string` | — | Static text rendered before the number. |
| `suffix` | `string` | — | Static text rendered after the number. |
| `animated` | `boolean` | `true` | Enable/disable animation. |
| `respectMotionPreference` | `boolean` | `true` | Skip animation when the OS requests reduced motion. |
| `transformTiming` | `EffectTiming` | `linear(...)` ~900ms | Timing for digit movement. |
| `spinTiming` | `EffectTiming` | falls back to `transformTiming` | Timing for the spin/roll effect. |
| `opacityTiming` | `EffectTiming` | `ease-out` 450ms | Timing for fade in/out of digits. |
| `trend` | `Trend` (`number \| (oldValue, value) => number`) | `Math.sign(value - old)` | Direction digits roll. |
| `plugins` | `Plugin[]` | — | `number-flow` plugins. |
| `digits` | `Digits` | — | Per-place digit constraints, e.g. `{ 1: { max: 5 } }`. |
| `isolate` | `boolean` | `false` | When inside a group, opt this element out of batched updates. |
| `willChange` | `boolean` | `false` | Add `will-change` hints for smoother animation of frequently-updating numbers. |
| `nonce` | `string` | — | CSP nonce for the injected style. |

#### Outputs

| Output | Payload | Description |
| --- | --- | --- |
| `animationsStart` | `void` | Emitted when a transition begins. |
| `animationsFinish` | `void` | Emitted when all transitions complete. |

```html
<number-flow
  [value]="count()"
  (animationsStart)="onStart()"
  (animationsFinish)="onFinish()"
/>
```

### `NumberFlowGroupDirective` — `[numberFlowGroup]`

A standalone attribute directive. Place it on any container element to batch the animations of
all descendant `number-flow` components. No inputs.

### Exported types

`Value`, `Format`, `Data`, `Trend`, `Digits`, `Props`, `Plugin`, and `NumberFlowElement`
(the underlying custom-element type) are re-exported for convenience.

## How it works

The component renders an internal custom element (`<number-flow-ng>`, registered once via
`number-flow`'s `define()`) inside a host with `display: contents`, mirroring the React/Vue
wrapper pattern. On each change it sets every element property first and assigns `data` **last**
(the engine's required ordering), computing `data` with the core `formatToData` helper.

## SSR

This release is **client-side only**. On the server the component renders nothing and initializes
in the browser (guarded by `isPlatformBrowser`). Declarative-Shadow-DOM hydration is a planned
follow-up.

## Compatibility

- **Angular:** peer dependency `>=17.0.0` (standalone APIs). Built and tested with the latest
  Angular tooling; source stays 17-compatible.
- **Zone / zoneless:** works with both. Uses `OnPush` and native element events.

## License

MIT — same as `number-flow`.
