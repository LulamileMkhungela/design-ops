# @designops/lint evals

Evaluation harness for measuring `@designops/lint` effects on generated UI. Methodology and results: [docs/evals.md](../../docs/evals.md).

## Tools

- `run.mjs`: paired before/after runs; `--control` runs the rules-only control.
- `drift.mjs`: sequential tasks in one project.
- `fidelity.mjs`: compare rendered output with the design intent.
- `report.mjs`, `aggregate-runs.mjs`: report individual or grouped runs.
- `tasks/`, `fixture*/`: prompts and test projects.
- `scripts/`: corpus, red-team, parity and benchmark checks.
- `results/`: local, untracked run output.

## Run

Requires the Codex CLI signed in and available as `codex`. Set `CODEX_BIN` to use another executable. The CLI must support `exec --ignore-user-config` and `--ephemeral`.

```bash
pnpm build
node packages/evals/run.mjs --model gpt-5.6-terra --reasoning medium --control
```

Runs use temporary project copies, exclude user configuration and plugins, and have a five-minute timeout. Results record token use and duration; cost is `null` when unavailable.
