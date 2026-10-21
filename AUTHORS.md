# Authors

DesignOps is designed, written and maintained by
**[Lulamile Mkhungela](https://github.com/LulamileMkhungela)**
&lt;mkhungela.l@gmail.com&gt;.

The dashboard, the token pipeline (`tools/ship.mjs`), the demo generator, the
advisory bridge, the documentation, the skill and the test suites in this
repository are his work.

## Third-party work

DesignOps builds on other people's work. Those notices stay in the repository:

- **`@designops/lint`** is a DesignOps distribution of
  [shadcn-ui/lint](https://github.com/shadcn-ui/lint) (MIT, © shadcn). The rule
  engine originates upstream; the `designops/` rule namespace, the packaging,
  the documentation, the tests and the changes in this repository are
  DesignOps work.
- **`packages/advisory`** is a vendored copy of
  [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
  (MIT, © Next Level Builder). It is read-only and never edited in place.
- **Test fixtures** under `packages/evals/fixture*` include shadcn/ui component
  code (MIT, © shadcn).
- **Generated demo sites** load Google Fonts under the SIL Open Font License,
  including JetBrains Mono.

The full licence texts and the exact scope of each notice are in
[NOTICE.md](./NOTICE.md).
