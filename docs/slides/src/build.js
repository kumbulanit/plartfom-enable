// Builds one .pptx per day into ../ (the slides folder).
//   cd .. && npm install    (once: the packages in ../package.json)
//   node build.js [day ...]
'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const { Deck, THEME } = require('./lib');

// The Claude pptx skill's apply_theme.js: PPTX_SKILL_DIR, or the newest copy the
// Claude desktop app keeps under Application Support.
function findSkill() {
  if (process.env.PPTX_SKILL_DIR) return process.env.PPTX_SKILL_DIR;
  const root = path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'local-agent-mode-sessions', 'skills-plugin');
  const found = [];
  for (const a of fs.existsSync(root) ? fs.readdirSync(root) : []) {
    for (const b of fs.readdirSync(path.join(root, a), { withFileTypes: true }).filter((e) => e.isDirectory())) {
      const dir = path.join(root, a, b.name, 'skills', 'pptx');
      const script = path.join(dir, 'scripts', 'apply_theme.js');
      if (fs.existsSync(script)) found.push({ dir, time: fs.statSync(script).mtimeMs });
    }
  }
  if (!found.length) throw new Error('Set PPTX_SKILL_DIR to the pptx skill directory');
  return found.sort((x, y) => y.time - x.time)[0].dir;
}
const SKILL = findSkill();
// apply_theme.js finds pptxgenjs and its jszip through NODE_PATH: add ../node_modules.
process.env.NODE_PATH = [path.resolve(__dirname, '..', 'node_modules'), process.env.NODE_PATH].filter(Boolean).join(path.delimiter);
require('module').Module._initPaths();
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
