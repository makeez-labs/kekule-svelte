# Changelog

## 0.1.2 (2026-05-15)

### Added
- SSR entry point (`kekule-svelte/index-ssr`) for SvelteKit compatibility
- `KekuleEditor` `showToolbar` prop for API consistency with other components
- Reactive `background` prop on `KekuleViewer`, `KekuleReaction`, `Kekule3DViewer`
- Reactive `smiles` prop on `KekuleEditor` — editor now updates when the prop changes
- `destroyed` flag guard on all components to prevent stale renders after unmount
- Component test suite (5 tests + 1 skipped for RAF-dependent case)
- `VERSIONING.md` and `CHANGELOG.md`
- GitHub Actions release workflow (tag → GitHub Release)

### Fixed
- `KekuleEditor.setSmiles()` now fires `onSmiles`/`onChange` callbacks
- Svelte 5 `mount()` error in tests — added `resolve.conditions: ['browser']` to vitest config

### Security
- Updated `svelte` from 5.55.4 → 5.55.7 and `devalue` (transitive) to fix 5 vulnerabilities (1 high, 4 moderate)

## 0.1.1 (2026-05-14)

- Initial public release

## 0.1.0

- Pre-release / initial development
