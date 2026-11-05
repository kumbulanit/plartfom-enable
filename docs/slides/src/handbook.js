// Writes the delegate handbook and the instructor guide from the same content as
// the decks, so the slides, the handbook and the guide never disagree.
//
//   node handbook.js
//
// Delegate handbook -> labs/README.md, labs/glossary.md, labs/dayN/README.md
//   (the lab build seeds them into Gitea as platform/handbook and replaces
//   "<lab domain>" with the real domain)
// Instructor guide  -> docs/instructor/ (day notes and the lab check-off sheet;
//   the run-book and the capstone rubric there are written by hand)
'use strict';

const fs = require('fs');
const path = require('path');
const DAYS = require('./content/days');
const STUCK = require('./content/stuck');
const LABS = require('./content/labs');
const { agenda, who } = require('./content/agenda');
const START_HERE = require('./content/starthere');
const FACILITATE = require('./content/facilitate');
const GLOSSARY = require('./content/glossary');

// The course repository's labs folder: README.md and glossary.md, and each day's
// instructions in dayN/README.md next to that day's code. The lab build seeds them into
// Gitea as platform/handbook.
const HANDBOOK = path.resolve(__dirname, '../../../labs');
const GUIDE = path.resolve(__dirname, '../../instructor');

// Prose for Markdown: keep "<lab domain>" (replaced when seeded), escape other
// opening angle brackets and asterisks so Gitea shows them as typed.
function md(text) {
  return String(text)
    .split('<lab domain>')
    .map((part) => part.replace(/</g, '&lt;').replace(/\*/g, '\\*'))
    .join('<lab domain>');
}
// A line break inside a cell becomes <br>, which Gitea shows as a new line.
const cell = (text) => md(text).replace(/\|/g, '\\|').replace(/\n\n?/g, '<br>');
const bullets = (items) => items.map((t) => `- ${md(t)}`).join('\n');
const table = (header, rows) => [
  `| ${header.map(cell).join(' | ')} |`,
  `| ${header.map(() => '---').join(' | ')} |`,
  ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`),
].join('\n');

// The anchor Gitea gives a heading (GitHub style), for links within a page.
const anchor = (t) => '#' + String(t).toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-');
const fence = (text, lang = '') => ['```' + lang, String(text).replace(/\n+$/, ''), '```'].join('\n');
const numbered = (items) => items.map((t, i) => `${i + 1}. ${md(t)}`).join('\n');
// Inline code, shown exactly as typed (entities are not decoded inside code spans).
const code = (text) => (String(text).includes('`') ? `\`\` ${text} \`\`` : `\`${text}\``);

// "Do this" with each command box right under the instruction that uses it. An
// instruction is a string, or { text, cmd } with its own command. A string that
// points at a box ("the command below", "the box", "the second box") gets that box
// (step.run is the first, then[0].run the second...); boxes no instruction points
// at stay where they were, after the list. Returns the list and the boxes it used.
const ORDINAL = { first: 0, second: 1, third: 2, fourth: 3 };
function doList(step) {
  const boxes = [step.run, ...[].concat(step.then || []).map((t) => t.run)];
  const used = new Set();
  const items = step.do.map((d, i) => {
    let text = typeof d === 'string' ? d : d.text;
    let cmd = typeof d === 'string' ? null : d.cmd;
    const item = typeof d === 'string' ? {} : d;
    if (!cmd) {
      const ord = text.match(/\b(first|second|third|fourth) box\b/i);
      let k = null;
      if (ord) k = ORDINAL[ord[1].toLowerCase()];
      else if (/\b(command|commands|box) below\b|\bthe box\b/i.test(text)) k = 0;
      if (k !== null && boxes[k] && !used.has(k)) {
        used.add(k);
        cmd = boxes[k];
        text = text
          .replace(/\bthe commands below\b/i, 'these commands')
          .replace(/\bthe (whole )?(grey )?(command|box) below\b/i, 'this $1$2$3')
          .replace(/ below\b/i, '');
      }
    }
    const lead = `${i + 1}. `;
    let s = lead + md(text);
    const pad = (block) => block.split('\n').map((l) => (l ? ' '.repeat(lead.length) + l : l)).join('\n');
    if (cmd) s += '\n\n' + pad(fence(cmd, 'bash'));
    // One command, one result: what this command prints, right under it.
    if (item.see) s += '\n\n' + pad(`**You should see:** ${md(item.see)}`);
    if (item.out) s += '\n\n' + pad(fence(item.out));
    for (const n of [].concat(item.note || [])) s += '\n\n' + pad(md(n));
    // A real screenshot of what this instruction shows, from a test Gitea.
    for (const p of [].concat(item.shot || [])) s += '\n\n' + pad(`![${p.caption}](../images/${p.src})`) + '\n\n' + pad(`*${md(p.caption)}*`);
    return s;
  });
  // A box whose every line is already an instruction's own command is not repeated.
  const own = new Set(step.do.flatMap((d) => (typeof d === 'string' || !d.cmd ? [] : d.cmd.split('\n'))));
  boxes.forEach((b, k) => { if (b && b.split('\n').every((l) => own.has(l))) used.add(k); });
  // A list with a box inside is a loose list: a blank line between items.
  const loose = items.some((s) => s.includes('```') || s.includes('\n\n'));
  return { text: items.join(loose ? '\n\n' : '\n'), used };
}

// A lab in full: what you do, then every step with where, why, the commands to
// paste and what you should see. The slide's short steps are the step titles.
function labBlock(spec) {
  const lab = LABS[spec.title];
  if (!lab) throw new Error(`No step-by-step guide in content/labs for "${spec.title}"`);
  if (lab.steps.length !== spec.steps.length) {
    throw new Error(`"${spec.title}": ${spec.steps.length} steps on the slide, ${lab.steps.length} in the handbook`);
  }
  const out = [`### ${md(spec.title)}`, ''];
  if (who(spec.time)) out.push(`*${md(who(spec.time))}*`, '');
  // The theory this lab practises, linked back to its place on this page.
  if (spec.practises) out.push(`**This lab puts into practice:** ${spec.practises.map((t) => `[${md(t)}](${anchor(t)})`).join(' · ')}`, '');
  if (lab.story) {
    out.push('#### The idea, in plain words', '');
    for (const p of [].concat(lab.story)) out.push(md(p), '');
  }
  out.push(`**What you do:** ${md(lab.goal)}`, '');
  if (lab.end) out.push(`**At the end you will have:** ${md(lab.end)}`, '');
  if (lab.learn) out.push('**You will learn:**', '', bullets(lab.learn), '');
  if (lab.words) out.push('**Words you will meet:**', '', lab.words.map(([w, m]) => `- **${md(w)}:** ${md(m)}`).join('\n'), '');
  if (Array.isArray(lab.start)) out.push('**Before you start:**', '', doList({ do: lab.start }).text, '');
  else if (lab.start) out.push(`**Before you start:** ${md(lab.start)}`, '');
  // The browser way of a step: where, what to click, what you see (with screenshots).
  const browserBlock = (b) => {
    if (b.where) out.push(`*Where: ${md(b.where)}*`, '');
    if (b.do) out.push('**Do this:**', '', doList({ do: b.do }).text, '');
    if (b.see) out.push(`**You should see:** ${md(b.see)}`, '');
    for (const p of [].concat(b.shot || [])) out.push(`![${p.caption}](../images/${p.src})`, '', `*${md(p.caption)}*`, '');
    if (b.read) out.push('**How to read it:**', '', bullets(b.read), '');
    if (b.ifnot) out.push('**If you see something else:**', '', b.ifnot.map(([w, f]) => `- *${md(w)}*: ${md(f)}`).join('\n'), '');
  };
  lab.steps.forEach((step, i) => {
    out.push(`#### Step ${i + 1}. ${md(step.title)}`, '');
    if (step.plain) out.push(`> **In plain words:** ${md(step.plain)}`, '');
    if (step.where && !step.browser) out.push(`*Where: ${md(step.where)}*`, '');
    if (step.why) out.push(`**Why:** ${md(step.why)}`, '');
    // step.browser: the browser is the way; the terminal way follows, folded away,
    // for those who want the commands.
    if (step.browser) {
      browserBlock(step.browser);
      out.push('<details>', '<summary>The same in the terminal (optional)</summary>', '');
      if (step.where) out.push(`*Where: ${md(step.where)}*`, '');
    }
    for (const text of [].concat(step.say || [])) out.push(md(text), '');
    const list = step.do ? doList(step) : { used: new Set() };
    if (step.do) out.push('**Do this:**', '', list.text, '');
    if (step.file) out.push(`\`${step.file.path}\`:`, '', fence(step.file.text, step.file.lang || ''), '');
    if (step.change) {
      const c = step.change;
      out.push(`**What changes in \`${c.file}\`:** ${md(c.how || '')}`.trimEnd(), '', 'Before:', '', fence(c.before), '', 'After:', '', fence(c.after), '');
    }
    if (step.run && !list.used.has(0)) out.push(fence(step.run, 'bash'), '');
    // A box already shown in the list keeps only its line-by-line explanation here.
    const thens = [].concat(step.then || []);
    const explain = [...(step.explain || [])];
    thens.forEach((then, k) => { if (list.used.has(k + 1) && then.explain) explain.push(...then.explain); });
    if (explain.length) out.push('**What each line does:**', '', explain.map(([c, m]) => `- ${code(c)}: ${md(m)}`).join('\n'), '');
    // A box with its own expected output comes after the step's output, as its own
    // little block; one without belongs to the step and comes before it.
    const thenBlock = (then) => {
      for (const text of [].concat(then.say || [])) out.push(md(text), '');
      if (then.run) out.push(fence(then.run, 'bash'), '');
      if (then.explain) out.push('**What each line does:**', '', then.explain.map(([c, m]) => `- ${code(c)}: ${md(m)}`).join('\n'), '');
      if (then.see) out.push(`**You should see:** ${md(then.see)}`, '');
      if (then.out) out.push(fence(then.out), '');
      if (then.read) out.push('**How to read it:**', '', bullets(then.read), '');
    };
    const own = (then) => then.see || then.out;
    thens.forEach((then, k) => { if (!list.used.has(k + 1) && !own(then)) thenBlock(then); });
    const inItems = (step.do || []).some((d) => typeof d !== 'string' && d.out);
    if (step.see && !inItems) out.push(`**You should see:** ${md(step.see)}`, '');
    if (step.out && !inItems) out.push(fence(step.out), '');
    if (step.read) out.push('**How to read it:**', '', bullets(step.read), '');
    if (step.ifnot) out.push('**If you see something else:**', '', step.ifnot.map(([s, f]) => `- *${md(s)}*: ${md(f)}`).join('\n'), '');
    thens.forEach((then, k) => {
      if (!own(then)) return;
      if (!list.used.has(k + 1)) return thenBlock(then);
      // Its box is already in the list: show only what it prints.
      if (then.see) out.push(`**Then, after the ${['second', 'third', 'fourth'][k] || 'next'} box, you should see:** ${md(then.see)}`, '');
      if (then.out) out.push(fence(then.out), '');
      if (then.read) out.push('**How to read it:**', '', bullets(then.read), '');
    });
    if (step.browser) out.push('</details>', '');
    // step.look: the step is done in the terminal; then see the result in the browser.
    if (step.look) {
      out.push('**Then see it in the browser:**', '');
      browserBlock(step.look);
    }
    if (step.tip) out.push(`> **Tip:** ${md(step.tip)}`, '');
    if (step.tryit) {
      const t = typeof step.tryit === 'string' ? { text: step.tryit } : step.tryit;
      out.push(`**Try it yourself:** ${md(t.text)}`, '');
      if (t.cmd) out.push(fence(t.cmd, 'bash'), '');
      if (t.see) out.push(`**You should see:** ${md(t.see)}`, '');
      if (t.out) out.push(fence(t.out), '');
    }
    if (step.check) out.push(`**Check before you go on:** ${md(step.check)}`, '');
  });
  if (lab.done) out.push(`**Done when:** ${md(lab.done)}`, '');
  if (spec.debrief) out.push(`**What this lab showed:** ${md(spec.debrief)}`, '');
  const tips = STUCK[spec.title];
  if (tips && tips.length) out.push('**If you are stuck**', '', bullets(tips));
  return out.join('\n');
}

function slideToMarkdown(spec, specs) {
  switch (spec.type) {
    case 'agenda': {
      // Each lab links to its heading on this page.
      const rows = agenda(specs).map((t) => [t.name, t.labs.length
        ? t.labs.map((l) => `[${md(l.title)}](${anchor(l.title)})${l.time ? ` (${l.time})` : ''}`).join('<br>')
        : (spec.noLab || 'Concepts and discussion, no lab')]);
      const head = `| Topic | Labs |\n| --- | --- |\n` + rows.map(([a, b]) => `| ${cell(a)} | ${b.replace(/\|/g, '\\|')} |`).join('\n');
      return [`### ${md(spec.title || "Today's plan")}`, '', spec.bridge ? `${md(spec.bridge)}\n` : '', head].join('\n');
    }
    case 'title':
    case 'close':
    case 'bigstep': // one step per page on the slides; the lab itself is written out in full
      return null;
    case 'picture': {
      const out = [`### ${md(spec.title)}`, '', `![${spec.caption || spec.title}](../images/${spec.src})`, ''];
      if (spec.caption) out.push(`*${md(spec.caption)}*`, '');
      if (spec.points) out.push(bullets(spec.points));
      return out.join('\n');
    }
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
  // Every topic a lab says it puts into practice must be a slide of the same day.
  const titles = new Set(specs.map((x) => x.title).filter(Boolean));
  for (const x of specs) for (const t of x.practises || []) {
    if (!titles.has(t)) throw new Error(`Day ${d}, "${x.title}": puts into practice "${t}", which is not a slide of that day`);
  }
  const out = [`# Day ${d}: ${DAYS[d].title}`, ''];
  if (Number(d) === 1) out.push('> **Never used a terminal before?** Read [Start here](../start-here.md) first (15 minutes). It shows what the screen looks like, how to paste a command, how to tell it has finished, and what to do when something goes wrong.', '');
  let section = null;
  for (const spec of specs) {
    if (spec.section && spec.section !== section && !['Opening', 'Close'].includes(spec.section)) {
      out.push(`## ${md(spec.section)}`, '');
    }
    section = spec.section;
    let text = slideToMarkdown(spec, specs);
    // A diagram (labs/images, made by labs/images/diagrams.py) goes right under its heading.
    if (text && spec.figure) {
      const lines = text.split('\n');
      lines.splice(1, 0, '', `![${spec.figure.caption}](../images/${spec.figure.src})`, '', `*${md(spec.figure.caption)}*`);
      text = lines.join('\n');
    }
    if (text) out.push(text.trim(), '');
  }
  const n = Number(d);  // the keys of DAYS are strings: '3' + 1 would be '31'
  const prev = n > 1 ? `[Day ${n - 1}](../day${n - 1}/README.md)` : null;
  const next = n < 6 ? `[Day ${n + 1}](../day${n + 1}/README.md)` : null;
  out.push('---', '', [prev, '[Contents](../README.md)', next].filter(Boolean).join(' · '), '');
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

function handbookReadme() {
  const days = Object.entries(DAYS).map(([d, m]) => {
    const specs = require(`./content/day${d}`);
    const goal = specs.find((s) => s.type === 'goal');
    return [`[Day ${d}: ${m.title}](day${d}/README.md)`, goal ? goal.goal : ''];
  });
  return [
    '# PE Lab handbook',
    '',
    'Every lab of the Platform Engineering Capability Development Programme, step by step, with what you should see after each step and what to do if you are stuck. Keep it open in a browser tab next to your workspace.',
    '',
    '## Your accounts',
    '',
    'You have a virtual machine of your own, with the whole platform on it: nobody else works on it, and nothing you do there can affect anyone else. Your logins are in one file on it, `/etc/pelab/logins.md`; your instructor shows you how to open it on Day 1, and once your workspace is open you can print it at any time with `cat /etc/pelab/logins.md`. Your own password (user `studentNN`) opens your workspace, Gitea and Harbor. Argo CD and Grafana take a read-only login, user `delegate`, with its own password in the same file. The portal needs no password: sign in as guest.',
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
    'Each day has concepts and a live demo, then hands-on labs, then a short quiz. Words you do not know are in the [glossary](glossary.md).',
    '',
    '## How to use this handbook',
    '',
    '**New to all of this? Read [Start here](start-here.md) first.** It is written for someone who has never typed a command: what the workspace looks like, how to paste a command and press Enter, how to tell it has finished, how to read each part of a lab, and what to do when something goes wrong.',
    '',
    '- Every lab is written out step by step, for someone who has never done it before. A lab starts with what you will learn, the words you will meet and what you need before you start. Then each step gives:',
    '  - **Where** you work (your workspace terminal, Gitea, Argo CD...) and **Why** you do it;',
    '  - **Do this**: every click and key, numbered;',
    '  - the commands to paste, in a grey box with a copy button, and **What each line does**;',
    '  - **What changes**, before and after, when you edit a file;',
    '  - **You should see**: the real output, and **How to read it**;',
    '  - **If you see something else**: the usual surprises and what to do about each.',
    '- Open a terminal in your workspace with the menu (☰) → Terminal → New Terminal. Paste with Ctrl+V or right-click → Paste. A second terminal: the + button at the top right of the terminal panel.',
    '- Your workspace knows who you are. `$ME` is your user name, `$TEAM` your team and `$DOMAIN` the lab\'s domain, so the commands work as pasted. Try `echo "$ME $TEAM $DOMAIN"`.',
    '- In addresses you type into the browser, replace `teamNN` with your team and `studentNN` with your user name, for example `team03` and `student12`.',
    '- **You work alone, and play the second person.** A few steps need someone else: a reviewer who approves your change, or the platform team who approves your request. You play them: open a private window (Ctrl+Shift+N; on a Mac Cmd+Shift+N; Firefox Ctrl+Shift+P), sign in to Gitea as `reviewer` or as `platform-approver` with the password from `cat /etc/pelab/logins.md`, do the step, and close the window. At work you never share a login, and the second person is a real colleague; here it is role-play, so every step can be done alone.',
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
    '## The code behind the labs',
    '',
    'In the course repository (`plartfom-enable/labs`), each day\'s folder holds its instructions (`README.md`) and the code the platform puts in Gitea when the lab is built. Files ending in `.j2` are filled in for the lab at that point (its domain, its teams). In the lab, open the Gitea repositories instead.',
    '',
    table(['Day', 'Folder', 'In the lab'], [
      ['1, and every day after', '`day1/golden-path/`', '`platform/golden-path`: the template every team\'s `hello` and every new service is made from (the app, its tests, the Dockerfile, the pipeline, the deployments)'],
      ['3', '`day3/environments/`', '`platform/environments`: the environment requests (OpenTofu) and their plan pipeline'],
      ['4', '`day4/catalog/`', '`platform/catalog`: what the portal (Backstage) shows'],
      ['5', '`day5/policies/`', '`platform/policies`: the guardrails\' tests, examples and exception requests'],
      ['5', '`day5/guardrails.yaml.j2`', 'The three guardrails the platform enforces (one file each in `platform/policies/policies/`)'],
      ['6', '`day6/dashboard/golden-path.json`', 'The Golden path dashboard in Grafana'],
    ]),
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
    'Each delegate built their own VM, and its passwords are on it. `ansible pelab ...` commands run from your machine, in `prelab-setup/`, after `export ANSIBLE_INVENTORY=inventory/all-vms.yml` (pelab05 instead of pelab reaches one VM). `ansible-playbook ...` commands run on the VM they are for, in `~/plartfom-enable/prelab-setup`, with `-K`. Without SSH to the VMs, the delegate runs the command on their VM with `sudo` in front.', ''];
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
    `Deck: \`${DAYS[d].file}\`. Delegates follow the handbook (Gitea \`platform/handbook\`, page day${d}/README.md), which has every lab step by step. If Argo CD gives trouble, see [safety-net.md](safety-net.md).`, '',
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
      rows.push([`Day ${d}`, lab.title, '[ ]', '']);
    }
  }
  return ['# Lab check-off sheet', '',
    'One sheet per delegate: every delegate works alone, on their own VM. Tick the box when the delegate has reached the last "You should see" of the lab. Lab performance is 35% of the assessment (brief, section 7); every critical safety and control step is mandatory.', '',
    'Delegate: ____________________    VM: __________', '',
    table(['Day', 'Lab', 'Done', 'Note'], rows), ''].join('\n');
}

// A terminal "screenshot" for the short version: the command and the output the
// lab recorded when it was tested, drawn as a terminal window (SVG). Real outputs
// only: a step without a recorded output gets no picture.
const TERM_DIR = path.join(HANDBOOK, 'images', 'terminal');
// Spaces become no-break spaces: SVG viewers squeeze ordinary ones, and the
// indentation of git's output matters.
const xml = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, '\u00a0').replace(/\t/g, '\u00a0'.repeat(8));
// Colours as in a terminal: diff lines red and green, hunk headers blue.
const outColour = (t) => (/^\+(?!\+\+ )/.test(t) ? '#3fb950' : /^-(?!-- )/.test(t) ? '#f85149' : /^@@/.test(t) ? '#79c0ff' : '#c9d1d9');
// output: what the command printed when tested; '' when it prints nothing (the
// prompt comes back); null when it was not recorded (the picture shows only what to type).
// where: whose terminal it is (default: the workspace's).
function terminalSvg(cmd, output, where = 'Workspace terminal') {
  const wrap = (line, kind) => {
    const parts = [];
    let rest = line;
    while (rest.length > 96) { parts.push(rest.slice(0, 96)); rest = rest.slice(96); }
    parts.push(rest);
    return parts.map((t, k) => ({ t, kind: k ? kind + '-more' : kind }));
  };
  let lines = [
    ...String(cmd).split('\n').flatMap((l) => wrap('$ ' + l, 'cmd')),
    ...(output ? String(output).replace(/\n+$/, '').split('\n').flatMap((l) => wrap(l, 'out')) : []),
    ...(output === '' ? [{ t: '$ ', kind: 'cmd' }] : []),
  ];
  if (lines.length > 30) lines = [...lines.slice(0, 28), { t: '...', kind: 'out' }];
  const lh = 19; const top = 46; const h = top + lines.length * lh + 18; const w = 900;
  const text = lines.map((l, i) => {
    const y = top + i * lh;
    if (l.kind === 'cmd') return `<text x="20" y="${y}"><tspan fill="#7ee787">$</tspan><tspan fill="#f0f6fc"> ${xml(l.t.slice(2))}</tspan></text>`;
    return `<text x="20" y="${y}" fill="${l.kind.startsWith('cmd') ? '#f0f6fc' : outColour(l.t)}">${xml(l.t)}</text>`;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="ui-monospace, Menlo, Consolas, 'DejaVu Sans Mono', monospace" font-size="14" xml:space="preserve" style="background:#000;border-radius:10px">
<rect width="${w}" height="${h}" rx="10" fill="#000"/>
<rect width="${w}" height="28" rx="10" fill="#21262d"/><rect y="18" width="${w}" height="10" fill="#21262d"/>
<circle cx="20" cy="14" r="6" fill="#ff5f56"/><circle cx="40" cy="14" r="6" fill="#ffbd2e"/><circle cx="60" cy="14" r="6" fill="#27c93f"/>
<rect x="${w - 214}" y="5" width="204" height="18" rx="9" fill="#d29922"/><text x="${w - 112}" y="18" fill="#000" font-size="11" font-weight="bold" text-anchor="middle">EXAMPLE · DO NOT COPY</text>
<text x="${w / 2}" y="19" fill="#8b949e" font-size="12" text-anchor="middle">${output === null || output === undefined ? where + ': type this' : where}</text>
${text}
</svg>
`;
}
let termCount = 0;
function terminalShot(name, cmd, output = null, where) {
  fs.mkdirSync(TERM_DIR, { recursive: true });
  fs.writeFileSync(path.join(TERM_DIR, name), terminalSvg(cmd, output, where));
  termCount++;
  const alt = output === null ? 'What to type in the terminal' : 'What you should see in the terminal';
  const label = output === null ? 'In the terminal it looks like this (the output depends on your lab):' : 'In the terminal it looks like this:';
  return `*${label}*\n\n![${alt}](../images/terminal/${name})`;
}
const slug = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

// The short version of a day, for a walk-through led by the instructor: each lab's
// steps with their instructions and commands; no explanations, outputs or checks.
// content/simple.js adds sections by topic (Git, IaC, pipelines, guardrails).
const SIMPLE = require('./content/simple');

function simpleStep(step, i, prefix) {
  const shotName = (k) => `${prefix}-${i + 1}${k === undefined ? '' : '-' + (k + 1)}-${slug(step.title)}.svg`;
  const out = [`### ${i + 1}. ${md(step.title)}`, ''];
  const items = step.do || (step.browser && step.browser.do) || [];
  const shown = new Set();
  const pad = (block) => block.split('\n').map((l) => (l ? '   ' + l : l)).join('\n');
  items.forEach((d, k) => {
    const text = typeof d === 'string' ? d : d.text;
    const cmd = typeof d === 'string' ? null : d.cmd;
    let s = `${k + 1}. ${md(text)}`;
    if (cmd) {
      s += '\n\n' + pad('**Copy and paste:**\n\n' + fence(cmd, 'bash'));
      cmd.split('\n').forEach((l) => shown.add(l));
      const quiet = /prints nothing/i.test(text) ? '' : null;
      s += '\n\n' + pad(terminalShot(shotName(k), cmd, d.out !== undefined ? d.out : quiet, d.where));
    }
    if (typeof d !== 'string') for (const p of [].concat(d.shot || [])) s += '\n\n' + pad(`![${p.caption}](../images/${p.src})`) + '\n\n' + pad(`*${md(p.caption)}*`);
    out.push(s, '');
  });
  if (!items.length) for (const t of [].concat(step.say || [])) out.push(md(t), '');
  if (step.file) out.push(`\`${step.file.path}\`:`, '', fence(step.file.text, step.file.lang || ''), '');
  if (step.change) out.push(`In \`${step.change.file}\`, change:`, '', fence(step.change.before), '', 'to:', '', fence(step.change.after), '');
    // The step's own output belongs to its first box (step.run); a then box has its own.
  const inItems = items.some((d) => typeof d !== 'string' && d.out);
  const thens = [].concat(step.then || []);
  [step.run, ...thens.map((t) => t.run)].forEach((b, k) => {
    if (!b || b.split('\n').every((l) => shown.has(l))) return;
    const output = k === 0 ? (inItems ? null : step.out) : thens[k - 1].out;
    out.push('**Copy and paste:**', '', fence(b, 'bash'), '', terminalShot(shotName(100 + k), b, output === undefined ? null : output), '');
  });
  if (step.out && step.run && !inItems && step.run.split('\n').every((l) => shown.has(l))) out.push(terminalShot(shotName(), step.run, step.out), '');
  return out;
}

function simpleDay(d) {
  const out = [`# Day ${d}: ${md(DAYS[d].title)}: the steps`, '',
    'Only the steps and the commands, to follow along with your instructor. Every step is explained in full in [README.md](README.md).', '',
    'Each command comes twice. **Copy and paste:** is the grey box to copy (the copy button is at its top right). Under it, a picture of the terminal marked EXAMPLE shows what it looks like: do not copy from the picture. Where the lab was tested, the picture shows what the command printed (your ids, times, names and team are your own); a picture titled "type this" shows only the command.', ''];
  // Topic sections: before the labs, or after them (after: true). A section's
  // say is a sentence, or a list of short points.
  const section = (x) => {
    out.push(`## ${md(x.title)}`, '');
    if (Array.isArray(x.say)) out.push(bullets(x.say), '');
    else if (x.say) out.push(md(x.say), '');
    (x.steps || []).forEach((s, i) => out.push(...simpleStep(s, i, `day${d}-${slug(x.title).slice(0, 20)}`)));
  };
  const extra = SIMPLE[d] || [];
  extra.filter((x) => !x.after).forEach(section);
  for (const spec of require(`./content/day${d}`).filter((s) => s.type === 'steps')) {
    const lab = LABS[spec.title];
    out.push(`## ${md(spec.title)}`, '', md(lab.goal), '');
    const labNo = (spec.title.match(/^Lab (\d+)/) || [null, slug(spec.title).slice(0, 12)])[1];
    lab.steps.forEach((s, i) => out.push(...simpleStep(s, i, `day${d}-lab${labNo}`)));
  }
  extra.filter((x) => x.after).forEach(section);
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

function write(dir, name, text) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), text);
  console.log(`wrote ${path.relative(path.resolve(__dirname, '../../..'), path.join(dir, name))}`);
}

write(HANDBOOK, 'README.md', handbookReadme());
for (const d of Object.keys(DAYS)) write(path.join(HANDBOOK, `day${d}`), 'README.md', handbookDay(d));
write(HANDBOOK, 'glossary.md', glossary());
write(HANDBOOK, 'start-here.md', START_HERE);
for (const d of Object.keys(DAYS)) write(GUIDE, `day${d}-notes.md`, guideDay(d));
write(GUIDE, 'lab-check-off.md', checkoffSheet());
fs.rmSync(TERM_DIR, { recursive: true, force: true });
for (const d of Object.keys(DAYS)) write(path.join(HANDBOOK, `day${d}`), 'simple-instruction.md', simpleDay(d));
console.log(`drew ${termCount} terminal pictures in labs/images/terminal`);
