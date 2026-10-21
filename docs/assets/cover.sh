#!/usr/bin/env bash
# Renders docs/assets/cover.png from docs/assets/cover.svg.
#
#   bash docs/assets/cover.sh
#   RESVG_DIR=/path/to/node_modules bash docs/assets/cover.sh
#
# The cover is a checked-in artifact, so a change to the SVG must be
# re-rendered and committed with it. Needs one of:
#   - @resvg/resvg-js  (npm i @resvg/resvg-js; set RESVG_DIR if it is not
#     resolvable from this directory)
#   - rsvg-convert
#   - Inkscape
set -euo pipefail
cd "$(dirname "$0")"

if command -v rsvg-convert >/dev/null 2>&1; then
  rsvg-convert -w 1568 -b '#0d0d0b' cover.svg -o cover.png
elif command -v inkscape >/dev/null 2>&1; then
  inkscape cover.svg --export-type=png --export-filename=cover.png -w 1568
else
  RESVG_DIR="${RESVG_DIR:-$PWD/node_modules}" node -e "
    const { createRequire } = require('node:module')
    const { readFileSync, writeFileSync } = require('node:fs')
    let Resvg
    try {
      Resvg = createRequire(process.env.RESVG_DIR + '/')('@resvg/resvg-js').Resvg
    } catch {
      console.error('No SVG renderer found: install @resvg/resvg-js (and set RESVG_DIR), rsvg-convert or Inkscape.')
      process.exit(1)
    }
    const png = new Resvg(readFileSync('cover.svg', 'utf8'), {
      fitTo: { mode: 'width', value: 1568 },
      background: '#0d0d0b',
      font: { loadSystemFonts: true },
    }).render().asPng()
    writeFileSync('cover.png', png)
  "
fi

echo "wrote docs/assets/cover.png"
