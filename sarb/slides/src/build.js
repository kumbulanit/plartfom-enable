// Builds one .pptx per day into ../ (the slides folder).
//   NODE_PATH=<global node_modules>:<deps> node build.js [day ...]
'use strict';
const path = require('path');
const fs = require('fs');
const { Deck, THEME } = require('./lib');

const SKILL = process.env.PPTX_SKILL_DIR; // the pptx skill directory, for apply_theme.js
if (!SKILL) throw new Error('Set PPTX_SKILL_DIR to the pptx skill directory');
const { applyTheme } = require(path.join(SKILL, 'scripts', 'apply_theme.js'));

const DAYS = require('./content/days');

async function main() {
  const want = process.argv.slice(2).map(Number);
  const days = want.length ? want : Object.keys(DAYS).map(Number);
  const outDir = path.resolve(__dirname, '..');
  for (const d of days) {
    const meta = DAYS[d];
    const specs = require(`./content/day${d}`);
    const deck = new Deck(d, meta.title);
    await deck.render(specs);
    const out = path.join(outDir, meta.file);
    await deck.write(out);
    await applyTheme(out, THEME);
    console.log(`built ${meta.file}: ${specs.length} slides`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
