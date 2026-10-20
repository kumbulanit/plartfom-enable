// Writes the delegate handbook and the instructor guide from the same content as
// the decks, so the slides, the handbook and the guide never disagree.
//
//   node handbook.js
//
// Delegate handbook -> pe-lab-ansible/roles/golden_path/files/handbook/
//   (the lab build seeds it into Gitea as platform/handbook and replaces
//   "<lab domain>" with the real domain)
// Instructor guide  -> sarb/instructor/ (day notes and the lab check-off sheet;
//   the run-book and the capstone rubric there are written by hand)
'use strict';

const fs = require('fs');
const path = require('path');
const DAYS = require('./content/days');
const STUCK = require('./content/stuck');
const LABS = require('./content/labs');
const FACILITATE = require('./content/facilitate');
const GLOSSARY = require('./content/glossary');

const HANDBOOK = path.resolve(__dirname, '../../../pe-lab-ansible/roles/golden_path/files/handbook');
const GUIDE = path.resolve(__dirname, '../../instructor');
const TEAMS = ['team01', 'team02', 'team03', 'team04', 'team05'];

// Prose for Markdown: keep "<lab domain>" (replaced when seeded), escape other
// opening angle brackets and asterisks so Gitea shows them as typed.
function md(text) {
  return String(text)
    .split('<lab domain>')
    .map((part) => part.replace(/</g, '&lt;').replace(/\*/g, '\\*'))
    .join('<lab domain>');
}
const cell = (text) => md(text).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const bullets = (items) => items.map((t) => `- ${md(t)}`).join('\n');
const table = (header, rows) => [
  `| ${header.map(cell).join(' | ')} |`,
  `| ${header.map(() => '---').join(' | ')} |`,
  ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`),
].join('\n');

const fence = (text, lang = '') => ['```' + lang, String(text).replace(/\n+$/, ''), '```'].join('\n');

// A lab in full: what you do, then every step with where, why, the commands to
// paste and what you should see. The slide's short steps are the step titles.
function labBlock(spec) {
  const lab = LABS[spec.title];
  if (!lab) throw new Error(`No step-by-step guide in content/labs for "${spec.title}"`);
  if (lab.steps.length !== spec.steps.length) {
    throw new Error(`"${spec.title}": ${spec.steps.length} steps on the slide, ${lab.steps.length} in the handbook`);
  }
  const out = [`### ${md(spec.title)}`, ''];
  if (spec.time) out.push(`*${md(spec.time)}*`, '');
  out.push(`**What you do:** ${md(lab.goal)}`, '');
  if (lab.start) out.push(`**Before you start:** ${md(lab.start)}`, '');
  lab.steps.forEach((step, i) => {
    out.push(`#### Step ${i + 1}. ${md(step.title)}`, '');
    if (step.where) out.push(`*Where: ${md(step.where)}*`, '');
    for (const text of [].concat(step.say || [])) out.push(md(text), '');
    if (step.file) out.push(`\`${step.file.path}\`:`, '', fence(step.file.text, step.file.lang || ''), '');
    if (step.run) out.push(fence(step.run, 'bash'), '');
    if (step.then) {
      for (const text of [].concat(step.then.say || [])) out.push(md(text), '');
      if (step.then.run) out.push(fence(step.then.run, 'bash'), '');
    }
    if (step.see) out.push(`**You should see:** ${md(step.see)}`, '');
    if (step.out) out.push(fence(step.out), '');
    if (step.tip) out.push(`> **Tip:** ${md(step.tip)}`, '');
  });
  if (lab.done) out.push(`**Done when:** ${md(lab.done)}`, '');
  const tips = STUCK[spec.title];
  if (tips && tips.length) out.push('**If you are stuck**', '', bullets(tips));
  return out.join('\n');
}

function slideToMarkdown(spec) {
  switch (spec.type) {
    case 'title':
    case 'close':
      return null;
    case 'goal':
      return [`**Goal:** ${md(spec.goal)}`, '', 'By the end of the day you can:', '', bullets(spec.outcomes)].join('\n');
    case 'section':
      return spec.subtitle ? `*${md(spec.subtitle)}*` : null;
    case 'concept': {
      const out = [`### ${md(spec.title)}`, '', ...spec.idea.map((p) => `${md(p)}\n`)];
      if (spec.oneLiner) out.push(`> **In one sentence:** ${md(spec.oneLiner)}`, '');
      out.push(`**${md(spec.labTitle || 'In the lab')}**`, '');
      if (spec.labCode) out.push('```', spec.labCode.replace(/\n {14}/g, ' '), '```', '');
      out.push(bullets(spec.lab));
      return out.join('\n');
    }
    case 'flow':
      return [`### ${md(spec.title)}`, '', spec.steps.map((s, i) => `${i + 1}. ${md(typeof s === 'string' ? s : s.text)}`).join('\n'),
        '', spec.caption ? md(spec.caption) : ''].join('\n');
    case 'table':
      return [`### ${md(spec.title)}`, '', spec.intro ? `${md(spec.intro)}\n` : '', table(spec.header, spec.rows)].join('\n');
    case 'rows':
      return [`### ${md(spec.title)}`, '', spec.intro ? `${md(spec.intro)}\n` : '',
        spec.rows.map((r) => `- **${md(r.head)}:** ${md(r.text)}`).join('\n')].join('\n');
    case 'compare':
      return [`### ${md(spec.title)}`, '', `**${md(spec.left.head)}**`, '', bullets(spec.left.items), '',
        `**${md(spec.right.head)}**`, '', bullets(spec.right.items)].join('\n');
    case 'code':
      return [`### ${md(spec.title)}`, '', '```', spec.code, '```', '', spec.notesRight ? bullets(spec.notesRight) : ''].join('\n');
    case 'steps':
      return labBlock(spec);
    case 'scenarios':
      return [`### ${md(spec.title)}`, '', table(['Scenario', 'What happens', 'What the platform does', 'The rule'],
        spec.items.map((i) => [i.name, i.does, i.platform, i.rule]))].join('\n');
    case 'diagram':
      return [`### ${md(spec.title)}`, '', table(['Piece', 'Tool', 'What it does'], spec.tools.map((t) => [t.name, t.tool, t.what])),
        '', spec.caption ? md(spec.caption) : ''].join('\n');
    case 'quiz':
      return [`### ${md(spec.title || 'Check your understanding')}`, '', spec.questions.map((q, i) => `${i + 1}. ${md(q)}`).join('\n')].join('\n');
    case 'recap':
      return [`### ${md(spec.title || 'What we built today')}`, '', 'You can now:', '', bullets(spec.built), '',
        `**${md(spec.tomorrowTitle || 'Tomorrow')}:** ${md(spec.tomorrow)}`].join('\n');
    default:
      throw new Error(`No handbook form for slide type ${spec.type}`);
  }
}

function handbookDay(d) {
  const specs = require(`./content/day${d}`);
  const out = [`# Day ${d}: ${DAYS[d].title}`, ''];
  let section = null;
  for (const spec of specs) {
    if (spec.section && spec.section !== section && !['Opening', 'Close'].includes(spec.section)) {
      out.push(`## ${md(spec.section)}`, '');
    }
    section = spec.section;
    const text = slideToMarkdown(spec);
    if (text) out.push(text.trim(), '');
  }
  const prev = d > 1 ? `[Day ${d - 1}](day${d - 1}.md)` : null;
  const next = d < 6 ? `[Day ${d + 1}](day${d + 1}.md)` : null;
  out.push('---', '', [prev, '[Contents](README.md)', next].filter(Boolean).join(' · '), '');
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

function handbookReadme() {
  const days = Object.entries(DAYS).map(([d, m]) => {
    const specs = require(`./content/day${d}`);
    const goal = specs.find((s) => s.type === 'goal');
    return [`[Day ${d}: ${m.title}](day${d}.md)`, goal ? goal.goal : ''];
  });
  return [
    '# PE Lab handbook',
    '',
    'Every lab of the Platform Engineering Capability Development Programme, step by step, with what you should see after each step and what to do if you are stuck. Keep it open in a browser tab next to your workspace.',
    '',
    '## Your accounts',
    '',
    'Your access sheet has your user name (`studentNN`), your team and two passwords. Your own password opens your workspace, Gitea and Harbor. Argo CD and Grafana take one read-only login that every delegate shares: user `delegate`, with the second password on your sheet. The portal needs no password: sign in as guest.',
    '',
    table(['What', 'Address', 'Sign in as'], [
      ['Your workspace (editor and terminal)', 'https://studentNN.<lab domain>', 'studentNN'],
      ['Portal: catalog and templates', 'https://backstage.<lab domain>', 'guest'],
      ['Git, pull requests, pipelines', 'https://gitea.<lab domain>', 'studentNN'],
      ['Images, scan reports, SBOMs', 'https://harbor.<lab domain>', 'studentNN'],
      ['Deployments (read-only)', 'https://argocd.<lab domain>', 'delegate (shared)'],
      ['Dashboards and logs (read-only)', 'https://grafana.<lab domain>', 'delegate (shared)'],
      ['Environment requests (Day 3)', 'https://gitea.<lab domain>/platform/environments', 'studentNN'],
      ['Guardrails and exceptions (Day 5)', 'https://gitea.<lab domain>/platform/policies', 'studentNN'],
    ]),
    '',
    '## The days',
    '',
    table(['Day', 'Goal'], days),
    '',
    'Each day runs 09:00 to 16:00: concepts and a live demo, then hands-on labs, then a short quiz. Words you do not know are in the [glossary](glossary.md).',
    '',
    '## How to use this handbook',
    '',
    '- Every lab is written out step by step. Each step says where you work (your workspace terminal, Gitea, Argo CD...), what to do and why, the commands to paste, and what you should see.',
    '- Open a terminal in your workspace with the menu (☰) → Terminal → New Terminal. Paste with Ctrl+V or right-click → Paste. A second terminal: the + button at the top right of the terminal panel.',
    '- Your workspace knows who you are. `$ME` is your user name, `$TEAM` your team and `$DOMAIN` the lab\'s domain, so the commands work as pasted. Try `echo "$ME $TEAM $DOMAIN"`.',
    '- In addresses you type into the browser, replace `teamNN` with your team and `studentNN` with your user name, for example `team03` and `student12`.',
    '- **Working as a team.** When a step needs someone else (a teammate who approves, or the platform team), that person does it. If they are not there, play their role: open a private window (Ctrl+Shift+N; on a Mac Cmd+Shift+N; Firefox Ctrl+Shift+P), sign in to Gitea as them with a login from "Your team\'s logins" on your access sheet, or from `cat /etc/pelab/logins.md` in your workspace, do the step, and close the window. `platform-approver` is the platform team\'s login: it approves environment and exception requests. At work you never share a login; here it is role-play, so every step can be done.',
    '- If your instructor says the safety net is on, Argo CD is paused and the platform deploys for it. Work exactly as written; where a step says to look at Argo CD, look at the commit in Gitea instead: click the tick next to it and read `safety-net/dev`, `safety-net/staging` or `safety-net/prod`.',
    '',
    '## Working on the platform, in five verbs',
    '',
    '1. **Find**: open the portal and see your team, its services, who owns them and where they run.',
    '2. **Create**: make a new service or request an environment from a template. A few values, no ticket.',
    '3. **Change**: edit on a branch, open a pull request, get one approval, merge.',
    '4. **Ship**: the pipeline checks and builds; Argo CD deploys to dev, and to staging and prod after an approved promotion.',
    '5. **Watch**: the dashboard shows versions, traffic, errors and logs per environment.',
    '',
    '## When something does not work',
    '',
    '1. Read the message: most refusals on this platform say what to fix.',
    '2. Look at "If you are stuck" under the lab.',
    '3. Ask your team, then the lab assistant. Nothing you do in your workspace can break anyone else\'s.',
    '',
  ].join('\n');
}

function glossary() {
  return ['# Glossary', '', 'The words of the course in plain English.', '', table(['Term', 'Meaning'], GLOSSARY), '',
    '[Contents](README.md)', ''].join('\n');
}

// How to run the day: before, timetable, the instructor's own actions, what to
// watch for and the end of the day (content/facilitate.js).
function runOfTheDay(d) {
  const f = FACILITATE[d];
  if (!f) throw new Error(`No run of the day in content/facilitate.js for Day ${d}`);
  const out = ['## Before the day', '', f.before.map((t) => `- [ ] ${md(t)}`).join('\n'), '',
    '## The day, hour by hour', '', table(['Time', 'What', 'Slides', 'Notes'], f.timetable), '',
    '## What you do yourself', '',
    'Commands for the lab server run there over SSH (`ssh labadmin@<server>`); the others on the control machine, in `pe-lab-ansible/`.', ''];
  for (const a of f.actions) {
    out.push(`**${md(a.when)}.** ${md(a.what)}${a.where ? ` *(${md(a.where)})*` : ''}`, '');
    if (a.run) out.push(fence(a.run, 'bash'), '');
  }
  out.push('## Watch for', '', table(['What you see', 'What to do'], f.watch), '',
    '## End of the day', '', f.after.map((t) => `- [ ] ${md(t)}`).join('\n'), '');
  return out.join('\n');
}

function guideDay(d) {
  const specs = require(`./content/day${d}`);
  const labs = specs.filter((s) => s.type === 'steps');
  const out = [`# Day ${d} instructor guide: ${DAYS[d].title}`, '',
    `Deck: \`${DAYS[d].file}\`. Delegates follow the handbook (Gitea \`platform/handbook\`, page day${d}.md), which has every lab step by step. If Argo CD gives trouble, see [safety-net.md](safety-net.md).`, '',
    runOfTheDay(d),
    '## Labs today', '', table(['Lab', 'Time'], labs.map((l) => [l.title, l.time || ''])), '',
    '## Slide by slide', '', 'The same notes are in the deck\'s speaker notes; quiz answers are under the quiz slide.', ''];
  specs.forEach((spec, i) => {
    const title = spec.title || (spec.type === 'goal' ? "Today's goal" : spec.type === 'quiz' ? 'Check your understanding' : spec.type === 'recap' ? 'What we built today' : spec.type);
    out.push(`### ${i + 1}. ${md(title)}`, '', md(spec.notes || '(no notes)'), '');
  });
  return out.join('\n');
}

function checkoffSheet() {
  const rows = [];
  for (const d of Object.keys(DAYS)) {
    for (const lab of require(`./content/day${d}`).filter((s) => s.type === 'steps')) {
      rows.push([`Day ${d}`, lab.title, ...TEAMS.map(() => '[ ]')]);
    }
  }
  return ['# Lab check-off sheet', '',
    'Tick a team\'s box when every member has reached the last "You should see" of the lab. Lab performance is 35% of the assessment (brief, section 7); every critical safety and control step is mandatory.', '',
    table(['Day', 'Lab', ...TEAMS], rows), ''].join('\n');
}

function write(dir, name, text) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), text);
  console.log(`wrote ${path.relative(path.resolve(__dirname, '../../..'), path.join(dir, name))}`);
}

write(HANDBOOK, 'README.md', handbookReadme());
for (const d of Object.keys(DAYS)) write(HANDBOOK, `day${d}.md`, handbookDay(d));
write(HANDBOOK, 'glossary.md', glossary());
for (const d of Object.keys(DAYS)) write(GUIDE, `day${d}-notes.md`, guideDay(d));
write(GUIDE, 'lab-check-off.md', checkoffSheet());
