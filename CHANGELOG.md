# Changelog

All notable changes to **`ng-number-flow`** are documented here. This project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) and the format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] - 2026-07-14

### Changed

- Migrated `NumberFlowComponent` to the modern signal APIs (`input()`, `output()`,
  `viewChild.required()`, and the `afterRender*` hooks). This is an internal refactor — the
  public API is unchanged and consumers need no code changes. The component is now fully
  zoneless-compatible and no longer injects `NgZone`/`PLATFORM_ID`; SSR safety comes from the
  render hooks. Peer dependency remains `@angular/core >=19`.

### Added

- Unit tests for the library (`NumberFlowComponent` and the formatter cache), run with the
  Vitest runner via `@angular/build:unit-test`.

## [0.1.0] - 2026-07-07

### Added

- Initial release: an Angular 19+ standalone `<number-flow>` component wrapping the
  framework-agnostic [`number-flow`](https://github.com/barvian/number-flow) custom element,
  plus `[numberFlowGroup]` for synchronized multi-element animations.

[0.2.0]: https://github.com/phalla-doll/ng-number-flow/releases/tag/v0.2.0
[0.1.0]: https://github.com/phalla-doll/ng-number-flow/releases/tag/v0.1.0
