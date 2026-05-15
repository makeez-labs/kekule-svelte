# Versioning

kekule-svelte follows [Semantic Versioning 2.0.0](https://semver.org/).

## Release Cadence

Releases are published both to [npm](https://www.npmjs.com/package/kekule-svelte) and as [GitHub Releases](https://github.com/makeez-labs/kekule-svelte/releases).

## Version Format

Given a version number `MAJOR.MINOR.PATCH`:

- **MAJOR** — breaking changes to the public API (props, exported methods, exports)
- **MINOR** — new features, new components, or significant additions (backward-compatible)
- **PATCH** — bug fixes, performance improvements, dependency updates (backward-compatible)

## Release Process

1. Ensure all changes are committed on `main`.
2. Update `CHANGELOG.md` with the new version and notes.
3. Bump `version` in `package.json`.
4. Commit the version bump and changelog: `git commit -m "Release v0.x.y"`.
5. Tag the commit: `git tag v0.x.y`.
6. Push the tag: `git push origin v0.x.y`.
7. A GitHub Actions workflow automatically creates a GitHub Release from the tag.
8. The Release creation triggers the publish workflow to npm.

## Pre-release Versions

Pre-release tags (e.g., `0.x.y-alpha.1`, `0.x.y-beta.2`) can be used for early testing.
These are published to npm with the corresponding `--tag` flag.
