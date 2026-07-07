# ng-number-flow — Feasibility & Implementation Plan

An investigation into building an **Angular (17+ standalone)** wrapper for
[`number-flow`](https://github.com/barvian/number-flow), the accessible animated number
component.

---

## TL;DR

**Verdict: Highly feasible. Estimated effort ~1–2 days for an experienced Angular dev.**

`number-flow` is not a React/Svelte/Vue library that we'd have to "port." Its core is a
**framework-agnostic Web Component** (`number-flow/lite`). The official `react`, `vue`, and
`svelte` packages are all thin wrappers (~150–250 LOC each) around that core. An Angular
package would be the **fourth sibling wrapper**, reusing 100% of the animation/formatting
engine and adding only the Angular-specific glue.

This is a **wrapper, not a port.**

---

## 1. How number-flow is architected

The repo is a pnpm monorepo. Three layers:

### 1.1 Core — `number-flow` / `number-flow/lite` (framework-agnostic)

`NumberFlowLite extends HTMLElement`. It owns **everything** framework-independent:

- **Shadow DOM** with an injected stylesheet.
- **Web Animations API** (`element.animate(...)`) for the rolling-digit / slot-machine
  transitions, driven by CSS custom properties (`--current`, `--length`, delta vars).
- **`ElementInternals`** for accessibility (`role="img"`, `aria-label = valueAsString`).
- **`@property` / CSS Houdini** registration (`supportsAtProperty`, `supportsMod`,
  `supportsLinear`) with a `canAnimate` capability flag.
- A **`data` setter** that is the single entry point for rendering & animation.
  `data` is a pre-formatted `Data` structure produced by `formatToData(...)`.
- **Internal lifecycle hooks** `willUpdate()` / `didUpdate()` used to batch grouped updates.
- **Events** `animationsstart` / `animationsfinish`.
- **SSR** via `renderInnerHTML(data, { nonce, elementSuffix })` which emits
  **Declarative Shadow DOM** (`<template shadowrootmode="open">`).

Public props (`Props`):

| Prop | Type | Default |
| --- | --- | --- |
| `transformTiming` | `EffectTiming` | `linear(...)` ~900ms |
| `spinTiming` | `EffectTiming \| undefined` | `undefined` (falls back to transform) |
| `opacityTiming` | `EffectTiming` | `ease-out` 450ms |
| `animated` | `boolean` | `true` |
| `respectMotionPreference` | `boolean` | `true` |
| `trend` | `number \| (old, value) => number` | `Math.sign(value - old)` |
| `plugins` | `Plugin[]?` | `undefined` |
| `digits` | `Record<number, { max?: number }>?` | `undefined` |

Exported helpers/types: `define`, `renderInnerHTML`, `formatToData`, `prefersReducedMotion`,
`canAnimate`, and types `Value`, `Format`, `Data`, `Props`, `Trend`, `Digits`, `Plugin`.

### 1.2 Framework wrappers — `react`, `vue`, `svelte`

Each is a thin adapter that:

1. **Registers its own custom-element variant** (`number-flow-react`, `number-flow-vue`, …)
   to avoid a global collision and improve tree-shaking. (React pre-19 even subclasses to
   read `data`/`digits` as JSON attributes.)
2. **Computes `data`** from `value`/`locales`/`format`/`prefix`/`suffix` via a **cached
   `Intl.NumberFormat`** + `formatToData(...)`.
3. **Binds props** to the element.
4. **Handles group batching** via framework context/inject.
5. **SSR** via `renderInnerHTML(data, { elementSuffix: '-<framework>' })` so hydration
   matches (DSD is identical server- and client-side).

### 1.3 The critical invariant

> **Set every prop first, then set `data` last.** The `data` setter reads `trend`,
> `animated`, `respectMotionPreference`, `plugins`, etc. to decide *how* to animate. Every
> wrapper respects this ordering.

### 1.4 Grouping

A provider collects child `NumberFlowLite` elements and, when any child's `data` changes,
calls `willUpdate()` on all siblings, lets them update the DOM, then calls `didUpdate()` on
all — so their animations start in the same frame. In Vue this is `provide/inject`; in React
a Context. The Angular equivalent is DI.

---

## 2. Why Angular is well-suited

- The core **is** a custom element. Angular 17+ standalone components fully support custom
  elements in templates (and can wrap them as native components).
- Shadow DOM encapsulation means Angular's emulated view encapsulation **does not interfere**.
- All browser APIs used (Web Animations, `ElementInternals`, `@property`, `Intl`) are
  framework-independent.

Net: the hard parts (animation math, accessibility, formatting) are reused as-is. We only
write the Angular glue.

---

## 3. Proposed design for `ng-number-flow`

### 3.1 Package shape

```
packages/ng-number-flow/src/
├── public-api.ts
├── lib/
│   ├── number-flow.component.ts        # the <number-flow-ng> standalone component
│   ├── number-flow-group.directive.ts  # [numberFlowGroup] batching directive
│   ├── number-flow.tokens.ts           # InjectionToken<RegisterWithGroup>
│   ├── number-flow.element.ts          # define('number-flow-ng', NumberFlowLite)
│   ├── formatter-cache.ts              # Intl.NumberFormat cache keyed by locales:format
│   └── types.ts                        # re-export Value/Format/Props/...
```

Build via **ng-packagr** (Angular Package Format), the standard Angular consumers expect.

### 3.2 `NumberFlowComponent` (standalone)

- **Selector:** `number-flow-ng` (the registered custom element).
- **Inputs (signal-based, 17.1+):** `value`, `locales`, `format`, `prefix`, `suffix`,
  `animated`, `respectMotionPreference`, `transformTiming`, `spinTiming`, `opacityTiming`,
  `trend`, `plugins`, `digits`, `isolate`, `willChange`, `nonce`.
- **Outputs:** `animationsStart`, `animationsFinish`.
- Internally computes `data` via a `computed()` over the inputs + `formatToData`.
- `ChangeDetectionStrategy.OnPush`.
- Injects `ElementRef`, `NgZone`, `PLATFORM_ID`, and optionally `NUMBER_FLOW_GROUP`.

> **Property-ordering strategy.** In `ngOnChanges` / an `effect()`, set every element
> property first, then set `el.data = data` **last**. Angular gives us clean control over
> ordering here — cleaner than React's `getSnapshotBeforeUpdate` hack and Vue's
> "data bound last in template" trick.

### 3.3 `NumberFlowGroupDirective`

- **Selector:** `[numberFlowGroup]`.
- **Provides** `NUMBER_FLOW_GROUP` via a `useFactory` provider that owns the
  `Set<NumberFlowLite>` and the `updating` flag, returning a `register(el)` function.
- Each `NumberFlowComponent` injects the token (`@Optional`) and, on browser init, registers
  itself. On `data` change within a group, the registered `willUpdate`/`didUpdate` batching
  runs (mirroring `NumberFlowGroup.vue`).

### 3.4 Usage

```ts
import { NumberFlowComponent } from 'ng-number-flow';

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [NumberFlowComponent],
  template: `<number-flow-ng [value]="count" />`,
})
export class DemoComponent {
  count = 3500;
}
```

---

## 4. Challenge → Solution matrix

| # | Concern | Solution | Difficulty |
| --- | --- | --- | --- |
| 1 | **Prop ordering** (`data` last) | Do all property assignment in `ngOnChanges`/`effect()`, set `data` last. Angular is *better* here than the React hacks. | Trivial |
| 2 | **Zone.js / change detection** | Native `animationsstart/finish` events from the web component bubble through Angular `@Output()` listeners (zone-patched) → CD runs. Use `OnPush`. | Trivial |
| 3 | **Zoneless Angular (18+)** | Compatible. Inputs flow parent→child; `@Output()` events fire regardless of zone. No special handling. | Trivial |
| 4 | **`Intl.NumberFormat` caching** | Module-level `Map<key, Intl.NumberFormat>` keyed by `${locales}:${format}`, mirroring react/vue. | Trivial |
| 5 | **`esm-env` BROWSER flag** | Replace with `isPlatformBrowser(inject(PLATFORM_ID))`. | Trivial |
| 6 | **Custom-element collision / HMR** | The provided `define()` is already HMR-safe; call with `'number-flow-ng'`. | Trivial |
| 7 | **`trend` default fn** | Default in `ngOnChanges` when `undefined` → `NumberFlowLite.defaultProps.trend`. | Trivial |
| 8 | **SSR / hydration** | **Out of scope for now (client-side only).** Documented path: `renderInnerHTML(data, { elementSuffix: '-ng' })` emits DSD; render via `innerHTML` + `DomSanitizer.bypassSecurityTrustHtml` on server, `isPlatformBrowser` guard on client. Matches Next/Nuxt. | (Deferred) |
| 9 | **`trend` as function input** | Angular signal inputs hold function values fine; pass through as-is. | Trivial |

### SSR note (for the future)

The genuinely novel piece vs. existing wrappers is **Angular hydration with Declarative
Shadow DOM**. If `provideClientHydration()` misbehaves on `<template shadowrootmode="open">`
emitted via `innerHTML`, the fallback is the same as the non-SSR `lite` path: render
light-DOM text and initialize the shadow root client-side. Worth a ~1h spike when SSR is
added. Low risk.

---

## 5. Effort & risk

- **Effort:** ~1–2 days — component + group directive + build config (ng-packagr) + a demo
  app. Core animation logic = **zero work** (reused via `number-flow` dependency).
- **Risk:** Low. The animation/formatting/a11y surface lives in the framework-agnostic core.
- **License:** `number-flow` is MIT; this wrapper is MIT. Compatible.

---

## 6. Open follow-ups

1. **Hydration spike** when SSR is needed (see §4 #8 / SSR note).
2. **Playwright visual tests** mirroring the other wrappers' `test/apps` setup.
3. **Signal-input API vs decorator `@Input()`**: skeleton uses signal `input()` (17.1+).
   If 17.0 support is required, add decorator-based aliases.
4. **Tree-shaking of `renderInnerHTML`**: ensure the SSR code path isn't pulled into CSR
   bundles (dynamic import behind `isPlatformBrowser`).

---

## Appendix A — Source references

- Core custom element: `packages/number-flow/src/lite.ts`, `index.ts`
- React wrapper: `packages/react/src/NumberFlow.tsx`
- Vue wrapper: `packages/vue/src/index.vue`, `group.ts`, `NumberFlowGroup.vue`
- SSR helper: `packages/number-flow/src/ssr.ts`
- HMR-safe `define`: `packages/number-flow/src/util/dom.ts`

## Appendix B — Existing wrapper conventions (to mirror)

- Each wrapper depends on `number-flow` + `esm-env`, peer-depends on its framework.
- Registers a per-framework custom element name (`-react`, `-vue`, …).
- Caches `Intl.NumberFormat` by `locales:format`.
- SSR via `renderInnerHTML(data, { elementSuffix })`.
- Group via context/inject → Angular DI.
