# Notices

DesignOps is © 2026 Lulamile Mkhungela and licensed under the MIT licence in
[LICENSE](./LICENSE).

This file records the third-party work that ships in the repository and the
scope of each notice. Nothing here weakens the MIT grant for DesignOps code; it
keeps the upstream copyright notices that MIT requires.

## `packages/lint` — derived from shadcn-ui/lint

`@designops/lint` is derived from
[`shadcn-ui/lint`](https://github.com/shadcn-ui/lint), MIT, © shadcn.

Upstream code: the rule engine, class classification, project analysis and the
Tailwind theme loader. DesignOps changes: the `designops/` rule namespace and
messages, package identity and build, documentation, tests, and the changes in
this repository. The upstream changelog is kept at
[`packages/lint/CHANGELOG.md`](./packages/lint/CHANGELOG.md).

## `packages/advisory` — vendored catalogue

The design-intelligence catalogue is a vendored copy of
[`nextlevelbuilder/ui-ux-pro-max-skill`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
at commit `1a2c459`, MIT, © Next Level Builder.

It is kept byte-identical to upstream; only the directory layout differs.
Provenance, exclusions and the refresh procedure are in
[`packages/advisory/VENDOR.md`](./packages/advisory/VENDOR.md); the licence is
[`packages/advisory/LICENSE.vendored.md`](./packages/advisory/LICENSE.vendored.md).

## Test fixtures

`packages/evals/fixture`, `fixture-rich` and `fixture-ds` include shadcn/ui
component code (MIT, © shadcn) used to measure the linter against a real
project. They are test data, not part of the published package.

## Fonts and icons

The generated demo sites request Google Fonts under the SIL Open Font License
(each family carries its own copyright line; the catalogue records the
families and their licences in
`packages/advisory/data/google-font-licenses.json`). JetBrains Mono is
requested under the SIL Open Font License, © JetBrains s.r.o.

The advisory catalogue's icon data derives from Phosphor Icons (MIT, ©
Phosphor Icons); see
`packages/advisory/data/phosphor-icons-upstream.json`.
