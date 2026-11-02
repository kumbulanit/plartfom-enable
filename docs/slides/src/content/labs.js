// Every lab, step by step, for the handbook: the commands to paste and what you
// should see. The slides keep the short version of the same steps, in the same
// order; handbook.js checks that every lab on the slides has one here.
//
// labs/beginner.js is laid over the tested labs: plain words, stories, checks and
// one-command-at-a-time instructions for people who have never used a terminal. It
// adds and replaces fields only; the tested boxes (run) and their outputs stay.
'use strict';

const LABS = Object.assign({}, ...[1, 2, 3, 4, 5, 6].map((d) => require(`./labs/day${d}`)));
const BEGINNER = require('./labs/beginner');

for (const [title, layer] of Object.entries(BEGINNER)) {
  const lab = LABS[title];
  if (!lab) throw new Error(`beginner.js: no lab "${title}"`);
  const { steps, ...fields } = layer;
  Object.assign(lab, fields);
  for (const [i, extra] of Object.entries(steps || {})) {
    if (!lab.steps[i]) throw new Error(`beginner.js: "${title}" has no step ${Number(i) + 1}`);
    // Split instructions must still hold every line of the tested box, so nothing is lost.
    if (extra.do && lab.steps[i].run) {
      const lines = new Set(extra.do.flatMap((d) => (typeof d === 'string' || !d.cmd ? [] : d.cmd.split('\n'))));
      const missing = lab.steps[i].run.split('\n').filter((l) => !lines.has(l));
      if (missing.length && extra.do.some((d) => typeof d !== 'string' && d.cmd)) {
        throw new Error(`beginner.js: "${title}" step ${Number(i) + 1} leaves out: ${missing.join(' | ')}`);
      }
    }
    Object.assign(lab.steps[i], extra);
  }
}

module.exports = LABS;
