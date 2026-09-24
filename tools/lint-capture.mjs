// Regenerates the verbatim diagnostics in assets/data.js (LINT_RULES).
// Run: pnpm lint:capture
// Each snippet triggers exactly one rule of the real @designops/lint
// build; paste the printed messages into the LINT_RULES table.

import { lintCode } from "./lint-server.mjs"

const SNIPPETS = {
  "designops/no-restyle": `import { Button } from "@/components/ui/button"
export const A = () => <Button className="p-4">Submit</Button>`,
  "designops/no-raw-colors": `export const A = () => <div className="bg-pink-500">Raw color</div>`,
  "designops/no-arbitrary-values": `export const A = () => <div className="p-[13px]">Arbitrary</div>`,
  "designops/no-inline-styles": `export const A = () => <div style={{ color: "red" }}>Inline</div>`,
  "designops/require-static-classes": `import { Button } from "@/components/ui/button"
export const A = ({ n }: { n: string }) => <Button className={\`mt-\${n}\`}>Dynamic</Button>`,
  "designops/no-unknown-classes": `export const A = () => <div className="rounded-huge">Unknown</div>`,
}

const out = {}
for (const [rule, code] of Object.entries(SNIPPETS)) {
  const { diagnostics, ms } = await lintCode(code)
  out[rule] = { ms, diagnostics }
}
console.log(JSON.stringify(out, null, 2))
process.exit(0)
