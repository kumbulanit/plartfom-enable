// Shared theme, layouts and slide types for the six day decks.
// Build with: node build.js   (see build.js for the NODE_PATH it needs)
'use strict';

const pptxgen = require('pptxgenjs');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const Fi = require('react-icons/fi');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
// The diagrams are the handbook's SVGs (labs/images, made by diagrams.py), shown on slides too.
const IMAGES = path.resolve(__dirname, '../../../labs/images');
const { agenda, who } = require('./content/agenda');

const THEME = {
  name: 'PE Lab',
  headFontFace: 'Cambria',
  bodyFontFace: 'Calibri',
  colors: {
    dk1: '16233A', // ink navy: text, dark slides
    lt1: 'FFFFFF',
    dk2: '0E5E6F', // deep teal: section slides, table headers
    lt2: 'EDF2F6', // pale blue-grey: cards
    accent1: '1B9C6E', // green: the paved road, a green build
    accent2: 'E0871B', // amber: warnings, exceptions
    accent3: 'C62828', // red: blocked, rejected
    accent4: '2F6FB5', // blue: information
    accent5: '6B7A8F', // slate: quiet text
    accent6: 'F2C14E', // gold: highlights
    hlink: '0E5E6F',
    folHlink: '6B7A8F',
  },
};

// The nine pieces of the platform, in the order a change travels.
const PIECES = ['Workspace', 'Portal', 'Template', 'Repository', 'Pipeline', 'Registry', 'GitOps', 'Environments', 'Observe'];

const X0 = 0.6; // left margin
const W = 12.13; // content width (13.33 - 2 * 0.6)
const YT = 1.45; // content top
const YB = 6.75; // content bottom
const H = YB - YT;

const iconCache = new Map();
async function icon(name, hex) {
  const key = name + hex;
  if (iconCache.has(key)) return iconCache.get(key);
  const Comp = Fi[name];
  if (!Comp) throw new Error('Unknown icon ' + name);
  let svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { size: 256 }));
  svg = svg.replace(/currentColor/g, '#' + hex);
  if (!/xmlns=/.test(svg)) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  const buf = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
  const data = 'image/png;base64,' + buf.toString('base64');
  iconCache.set(key, data);
  return data;
}

class Deck {
  constructor(day, dayTitle) {
    const P = new pptxgen();
    P.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5
    P.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
    P.author = 'Platform Engineering Capability Development Programme';
    P.title = `Day ${day}: ${dayTitle}`;
    this.P = P;
    this.C = P.SchemeColor;
    this.day = day;
    this.dayTitle = dayTitle;
    this.footer = `Platform Engineering Capability Development Programme  ·  Day ${day}: ${dayTitle}`;
    this.currentSection = null;
    this.defineLayouts();
  }

  defineLayouts() {
    const { P, C } = this;
    const T = THEME.colors;
    const footer = { text: { text: this.footer, options: { x: X0, y: 7.02, w: 10.5, h: 0.3, fontSize: 9, color: C.accent5, margin: 0 } } };
    const num = { x: 12.3, y: 7.02, w: 0.45, h: 0.3, fontSize: 9, color: T.accent5, align: 'right' };

    P.defineSlideMaster({
      title: 'TITLE',
      background: { color: T.dk1 },
      objects: [
        { placeholder: { options: { name: 'title', type: 'title', x: 0.8, y: 2.0, w: 11.7, h: 1.9, fontSize: 40, bold: true, color: C.background1, align: 'left', valign: 'bottom' }, text: '' } },
        { placeholder: { options: { name: 'subtitle', type: 'body', x: 0.8, y: 4.05, w: 11.7, h: 1.2, fontSize: 20, color: C.background2, align: 'left', valign: 'top' }, text: '' } },
      ],
    });
    P.defineSlideMaster({
      title: 'SECTION',
      background: { color: T.dk2 },
      objects: [
        { placeholder: { options: { name: 'title', type: 'title', x: 0.8, y: 2.3, w: 11.7, h: 1.5, fontSize: 38, bold: true, color: C.background1, align: 'left', valign: 'bottom' }, text: '' } },
        { placeholder: { options: { name: 'subtitle', type: 'body', x: 0.8, y: 3.95, w: 11.7, h: 1.2, fontSize: 20, color: C.background2, align: 'left', valign: 'top' }, text: '' } },
      ],
    });
    P.defineSlideMaster({
      title: 'CONTENT',
      background: { color: T.lt1 },
      slideNumber: num,
      objects: [
        { placeholder: { options: { name: 'title', type: 'title', x: X0, y: 0.42, w: W, h: 0.85, fontSize: 30, bold: true, color: C.text1, align: 'left', valign: 'middle', margin: 0 }, text: '' } },
        footer,
      ],
    });
  }

  slide(layout) {
    const s = this.P.addSlide({ masterName: layout, sectionTitle: this.currentSection || undefined });
    return s;
  }

  setSection(title) {
    if (title && title !== this.currentSection) {
      this.P.addSection({ title });
      this.currentSection = title;
    }
  }

  // ---- building blocks -------------------------------------------------

  // A row of the nine platform pieces; the named ones are highlighted.
  strip(s, y, highlight, label) {
    const { P, C } = this;
    const gap = 0.12;
    const w = (W - gap * (PIECES.length - 1)) / PIECES.length;
    if (label) s.addText(label, { x: X0, y: y - 0.32, w: W, h: 0.28, fontSize: 11, color: C.accent5, margin: 0, isTextBox: true });
    PIECES.forEach((p, i) => {
      const on = highlight.includes(p);
      s.addText(p, {
        shape: P.ShapeType.roundRect, rectRadius: 0.12,
        x: X0 + i * (w + gap), y, w, h: 0.5,
        fill: { color: on ? C.accent1 : C.background2 }, line: { color: on ? C.accent1 : C.background2 },
        fontSize: 11.5, bold: on, color: on ? C.background1 : C.accent5, align: 'center', valign: 'middle', margin: 0, isTextBox: true,
      });
    });
  }

  async circleIcon(s, name, x, y, d, bg, fg) {
    const { P, C } = this;
    s.addShape(P.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: bg }, line: { color: bg } });
    const pad = d * 0.24;
    s.addImage({ data: await icon(name, fg), x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad });
  }

  bullets(items, size, opts = {}) {
    return items.map((t, i) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: i < items.length - 1, fontSize: size, paraSpaceAfter: opts.space ?? 6, color: opts.color ?? this.C.text1 } }));
  }

  // ---- slide types -----------------------------------------------------

  title(spec) {
    const s = this.slide('TITLE');
    s.addText(`DAY ${this.day}`, { x: 0.8, y: 1.3, w: 6, h: 0.5, fontSize: 18, bold: true, color: this.C.accent1, charSpacing: 4, margin: 0, isTextBox: true });
    s.addText(spec.title, { placeholder: 'title' });
    s.addText(spec.subtitle, { placeholder: 'subtitle' });
    this.strip(s, 6.3, spec.highlight || [], 'Today on the platform');
    s.addNotes(spec.notes || '');
  }

  section(spec) {
    const s = this.slide('SECTION');
    s.addText(spec.title, { placeholder: 'title' });
    if (spec.subtitle) s.addText(spec.subtitle, { placeholder: 'subtitle' });
    s.addNotes(spec.notes || '');
  }

  // One step per page, for a room activity: the step's number, one line to read from the
  // back of the room, a few short "how" lines, its time, and the run of steps at the bottom
  // with this one lit up.
  async bigstep(spec) {
    const { P, C } = this;
    const s = this.slide('CONTENT');
    s.addText(`${spec.lab.toUpperCase()}  ·  STEP ${spec.n} OF ${spec.track.length}`, { x: X0, y: 0.55, w: 9, h: 0.42, fontSize: 14, bold: true, color: C.accent1, charSpacing: 2, valign: 'middle', margin: 0, isTextBox: true });
    if (who(spec.time)) {
      const tw = 2.1;
      s.addText(who(spec.time), { shape: P.ShapeType.roundRect, rectRadius: 0.15, x: X0 + W - tw, y: 0.55, w: tw, h: 0.42, fill: { color: C.accent6 }, line: { color: C.accent6 }, fontSize: 12, bold: true, color: C.text1, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
    }
    const d = 1.3, tx = X0 + d + 0.45, tw2 = W - d - 0.45;
    s.addText(String(spec.n), { shape: P.ShapeType.ellipse, x: X0, y: 1.6, w: d, h: d, fill: { color: C.accent1 }, line: { color: C.accent1 }, fontSize: 54, bold: true, color: C.background1, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
    s.addText(spec.line, { x: tx, y: 1.45, w: tw2, h: 1.6, fontSize: 32, bold: true, color: C.text1, valign: 'middle', margin: 0, isTextBox: true });
    if (spec.how) s.addText(this.bullets(spec.how, 19, { space: 10 }), { x: tx, y: 3.3, w: tw2, h: 2.5, valign: 'top', margin: 0, isTextBox: true });
    // The run of steps, this one lit up.
    const gap = 0.15, bw = (W - gap * (spec.track.length - 1)) / spec.track.length;
    spec.track.forEach((name, i) => {
      const on = i + 1 === spec.n;
      s.addText(`${i + 1}  ${name}`, {
        shape: P.ShapeType.roundRect, rectRadius: 0.12, x: X0 + i * (bw + gap), y: 6.1, w: bw, h: 0.55,
        fill: { color: on ? C.accent1 : C.background2 }, line: { color: on ? C.accent1 : C.background2 },
        fontSize: 13, bold: on, color: on ? C.background1 : C.accent5, align: 'center', valign: 'middle', margin: 0, isTextBox: true,
      });
    });
    s.addNotes(spec.notes || '');
  }

  async goal(spec) {
    const { P, C } = this;
    const s = this.slide('CONTENT');
    s.addText(spec.title || "Today's goal", { placeholder: 'title' });
    s.addText(spec.goal, {
      shape: P.ShapeType.roundRect, rectRadius: 0.12, x: X0, y: YT, w: W, h: 1.25,
      fill: { color: C.background2 }, line: { color: C.background2 },
      fontSize: 22, bold: true, color: C.text2, align: 'left', valign: 'middle', margin: 14, isTextBox: true,
    });
    s.addText('By the end of the day you can', { x: X0, y: 2.95, w: W, h: 0.35, fontSize: 12, color: C.accent5, margin: 0, isTextBox: true });
    let y = 3.35;
    for (const o of spec.outcomes) {
      await this.circleIcon(s, 'FiCheck', X0, y + 0.02, 0.42, THEME.colors.accent1, 'FFFFFF');
      s.addText(o, { x: X0 + 0.6, y, w: W - 0.6, h: 0.46, fontSize: 16, color: C.text1, valign: 'middle', margin: 0, isTextBox: true });
      y += 0.6;
    }
    this.strip(s, 5.95, spec.highlight || [], 'Where we are on the platform');
    s.addNotes(spec.notes || '');
  }

  // Today's plan: where we come from, then each topic with the labs that follow it
  // (worked out from the deck itself), and where the full lab steps are.
  async agenda(spec) {
    const { P, C } = this;
    const s = this.slide('CONTENT');
    s.addText(spec.title || "Today's plan", { placeholder: 'title' });
    if (spec.bridge) s.addText(spec.bridge, { x: X0, y: YT, w: W, h: 0.6, fontSize: 15, color: C.accent5, valign: 'top', margin: 0, isTextBox: true });
    const topics = agenda(this.specs);
    const top = YT + 0.8, bottom = 6.05, gap = 0.15, tw = 3.4;
    const rh = (bottom - top - gap * (topics.length - 1)) / topics.length;
    topics.forEach((t, i) => {
      const y = top + i * (rh + gap);
      s.addText(t.name, { shape: P.ShapeType.roundRect, rectRadius: 0.1, x: X0, y, w: tw, h: rh, fill: { color: C.text2 }, line: { color: C.text2 }, fontSize: 15, bold: true, color: C.background1, valign: 'middle', margin: 12, isTextBox: true });
      s.addShape(P.ShapeType.roundRect, { x: X0 + tw + 0.2, y, w: W - tw - 0.2, h: rh, rectRadius: 0.1, fill: { color: C.background2 }, line: { color: C.background2 } });
      const runs = t.labs.length
        ? t.labs.flatMap((l, j) => [
          { text: l.title, options: { bold: true, color: C.text1 } },
          { text: l.time ? `   ${l.time}` : '', options: { color: C.accent5, breakLine: j < t.labs.length - 1 } },
        ])
        : [{ text: spec.noLab || 'Concepts and discussion, no lab', options: { italic: true, color: C.accent5 } }];
      s.addText(runs, { x: X0 + tw + 0.45, y, w: W - tw - 0.65, h: rh, fontSize: 13.5, valign: 'middle', paraSpaceAfter: 3, margin: 0, isTextBox: true });
    });
    await this.circleIcon(s, 'FiBookOpen', X0, 6.22, 0.4, THEME.colors.accent1, 'FFFFFF');
    s.addText([{ text: 'Every lab, step by step, with the commands and what you should see: ', options: {} }, { text: `the handbook, Day ${this.day} (labs/day${this.day}/README.md)`, options: { bold: true } }],
      { x: X0 + 0.55, y: 6.22, w: W - 0.55, h: 0.4, fontSize: 13, color: C.text1, valign: 'middle', margin: 0, isTextBox: true });
    s.addNotes(spec.notes || '');
  }

  // A diagram from labs/images, with a caption and optional talking points on the right.
  async picture(spec) {
    const { C } = this;
    const s = this.slide('CONTENT');
    s.addText(spec.title, { placeholder: 'title' });
    const svg = fs.readFileSync(path.join(IMAGES, spec.src));
    const meta = await sharp(svg).metadata();
    const png = await sharp(svg, { density: 220 }).png().toBuffer();
    // The diagram gets the whole width, so its labels stay readable on a projector. The talking
    // points go beside it only if at least 3.3 in is left over; otherwise into the notes.
    const points = spec.points || [];
    const areaH = H - (spec.caption ? 0.55 : 0);
    const ratio = meta.width / meta.height;
    let w = W, h = w / ratio;
    if (h > areaH) { h = areaH; w = h * ratio; }
    const side = points.length && W - w >= 3.65;
    const areaW = side ? w : W;
    s.addImage({ data: 'image/png;base64,' + png.toString('base64'), x: X0, y: YT, w, h, altText: spec.caption || spec.title });
    if (spec.caption) s.addText(spec.caption, { x: X0, y: YT + h + 0.12, w: Math.max(areaW, 6), h: 0.4, fontSize: 12, italic: true, color: C.accent5, margin: 0, isTextBox: true, valign: 'top' });
    if (side) {
      const rx = X0 + areaW + 0.35, rw = W - areaW - 0.35;
      s.addText(spec.pointsTitle || 'Say it in plain words', { x: rx, y: YT, w: rw, h: 0.4, fontSize: 15, bold: true, color: C.text2, margin: 0, isTextBox: true });
      s.addText(this.bullets(points, 13, { space: 8 }), { x: rx, y: YT + 0.5, w: rw, h: H - 0.5, valign: 'top', margin: 0, isTextBox: true });
    }
    const said = points.length && !side ? 'Say it in plain words:\n- ' + points.join('\n- ') : '';
    s.addNotes([said, spec.notes || ''].filter(Boolean).join('\n\n'));
  }

  async concept(spec) {
    const { P, C } = this;
    const s = this.slide('CONTENT');
    s.addText(spec.title, { placeholder: 'title' });
    const lw = 6.9, rx = X0 + lw + 0.4, rw = W - lw - 0.4;
    s.addText('THE IDEA', { x: X0, y: YT, w: lw, h: 0.3, fontSize: 11, bold: true, color: C.accent5, charSpacing: 2, margin: 0, isTextBox: true });
    const paras = spec.idea.map((t, i) => ({ text: t, options: { breakLine: i < spec.idea.length - 1, paraSpaceAfter: 10 } }));
    s.addText(paras, { x: X0, y: YT + 0.35, w: lw, h: 3.55, fontSize: 15, color: C.text1, valign: 'top', margin: 0, isTextBox: true });
    if (spec.oneLiner) {
      s.addText([{ text: 'In one sentence: ', options: { bold: true, color: C.text2 } }, { text: spec.oneLiner, options: { italic: true } }], {
        shape: P.ShapeType.roundRect, rectRadius: 0.1, x: X0, y: 5.5, w: lw, h: 1.25,
        fill: { color: C.background2 }, line: { color: C.background2 }, fontSize: 14, color: C.text1, valign: 'middle', margin: 12, isTextBox: true,
      });
    }
    s.addShape(P.ShapeType.roundRect, { x: rx, y: YT, w: rw, h: H, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: C.background2 } });
    await this.circleIcon(s, spec.icon || 'FiCompass', rx + 0.3, YT + 0.3, 0.8, THEME.colors.accent1, 'FFFFFF');
    s.addText(spec.labTitle || 'In the lab', { x: rx + 1.3, y: YT + 0.38, w: rw - 1.5, h: 0.65, fontSize: 18, bold: true, color: C.text2, valign: 'middle', margin: 0, isTextBox: true });
    let ly = YT + 1.35, lh = H - 1.6;
    if (spec.labCode) {
      const lines = spec.labCode.split('\n');
      const ch = Math.min(2.4, 0.3 + lines.length * 0.26);
      s.addText(lines.map((l, i) => ({ text: l.length ? l : ' ', options: { breakLine: i < lines.length - 1 } })), {
        shape: P.ShapeType.roundRect, rectRadius: 0.08, x: rx + 0.3, y: ly, w: rw - 0.6, h: ch,
        fill: { color: C.text1 }, line: { color: C.text1 }, fontFace: 'Courier New', fontSize: 11, color: C.background2, valign: 'middle', margin: 10, isTextBox: true,
      });
      ly += ch + 0.2; lh -= ch + 0.2;
    }
    s.addText(this.bullets(spec.lab, 13.5, { space: 7 }), { x: rx + 0.3, y: ly, w: rw - 0.6, h: lh, valign: 'top', margin: 0, isTextBox: true });
    s.addNotes(spec.notes || '');
  }

  async rows(spec) {
    const { C } = this;
    const s = this.slide('CONTENT');
    s.addText(spec.title, { placeholder: 'title' });
    let y = YT;
    let avail = H;
    if (spec.intro) {
      s.addText(spec.intro, { x: X0, y, w: W, h: 0.5, fontSize: 14.5, color: C.accent5, margin: 0, isTextBox: true, valign: 'top' });
      y += 0.6; avail -= 0.6;
    }
    const n = spec.rows.length;
    const rh = Math.min(1.15, avail / n);
    for (const r of spec.rows) {
      await this.circleIcon(s, r.icon, X0, y + 0.08, 0.62, THEME.colors[r.color || 'accent1'], 'FFFFFF');
      s.addText(r.head, { x: X0 + 0.9, y, w: W - 0.9, h: 0.38, fontSize: 16, bold: true, color: C.text1, valign: 'middle', margin: 0, isTextBox: true });
      s.addText(r.text, { x: X0 + 0.9, y: y + 0.38, w: W - 0.9, h: rh - 0.42, fontSize: 13.5, color: C.text1, valign: 'top', margin: 0, isTextBox: true });
      y += rh;
    }
    s.addNotes(spec.notes || '');
  }

  flow(spec) {
    const { P, C } = this;
    const s = this.slide('CONTENT');
    s.addText(spec.title, { placeholder: 'title' });
    const steps = spec.steps;
    const perRow = steps.length <= 5 ? steps.length : Math.ceil(steps.length / 2);
    const rows = Math.ceil(steps.length / perRow);
    const gap = 0.55, bw = (W - gap * (perRow - 1)) / perRow, bh = 1.15;
    const y0 = rows === 1 ? 2.6 : 1.9;
    steps.forEach((st, i) => {
      const r = Math.floor(i / perRow), c = i % perRow;
      const x = X0 + c * (bw + gap), y = y0 + r * 2.0;
      const text = typeof st === 'string' ? st : st.text;
      const hot = typeof st === 'object' && st.highlight;
      s.addText([{ text: `${i + 1}  `, options: { bold: true, color: hot ? C.background1 : C.accent1 } }, { text, options: { bold: true } }], {
        shape: P.ShapeType.roundRect, rectRadius: 0.1, x, y, w: bw, h: bh,
        fill: { color: hot ? C.accent1 : C.background2 }, line: { color: hot ? C.accent1 : C.background2 },
        fontSize: 13.5, color: hot ? C.background1 : C.text1, align: 'center', valign: 'middle', margin: 6, isTextBox: true,
      });
      if (c < perRow - 1 && i < steps.length - 1) {
        s.addShape(P.ShapeType.line, { x: x + bw + 0.08, y: y + bh / 2, w: gap - 0.16, h: 0, line: { color: THEME.colors.accent5, width: 1.5, endArrowType: 'triangle' } });
      } else if (i < steps.length - 1 && rows > 1) {
        // wrap to the next row: a bent connector down and back to the left
        s.addShape(P.ShapeType.line, { x: x + bw / 2, y: y + bh + 0.05, w: 0, h: 0.8, line: { color: THEME.colors.accent5, width: 1.5, endArrowType: 'triangle' } });
      }
    });
    if (spec.caption) {
      s.addText(spec.caption, { x: X0, y: rows === 1 ? 4.4 : 5.9, w: W, h: 0.8, fontSize: 14, italic: true, color: C.accent5, margin: 0, isTextBox: true, valign: 'top' });
    }
    s.addNotes(spec.notes || '');
  }

  async steps(spec) {
    const { P, C } = this;
    const chunks = [];
    // Up to six cards a slide, spread evenly (eight steps make 4 + 4, not 6 + 2).
    const per = Math.ceil(spec.steps.length / Math.ceil(spec.steps.length / 6));
    for (let i = 0; i < spec.steps.length; i += per) chunks.push(spec.steps.slice(i, i + per));
    for (let ci = 0; ci < chunks.length; ci++) {
      const s = this.slide('CONTENT');
      // "1 of 2" goes in the badge (who does the lab) when there is one: in the title it runs into the badge.
      const part = chunks.length > 1 ? `${ci + 1} of ${chunks.length}` : '';
      const time = who(spec.time);
      s.addText(spec.title + (part && !time ? `  (${part})` : ''), { placeholder: 'title' });
      if (time) {
        const label = part ? `${time}  ·  ${part}` : time;
        const tw = part ? 2.8 : 2.1;
        s.addText(label, { shape: P.ShapeType.roundRect, rectRadius: 0.15, x: X0 + W - tw, y: 0.55, w: tw, h: 0.42, fill: { color: C.accent6 }, line: { color: C.accent6 }, fontSize: 12, bold: true, color: C.text1, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
      }
      const list = chunks[ci];
      const cols = 2, rowsN = Math.ceil(list.length / cols);
      // The cards leave a line at the bottom for where the full steps are, and one at the top
      // naming the topics the lab puts into practice.
      const long = spec.practises && ('Puts into practice: ' + spec.practises.join('  ·  ')).length > 130;
      const top = spec.practises ? (long ? 0.62 : 0.42) : 0;
      if (spec.practises) {
        s.addText([{ text: 'Puts into practice: ', options: { bold: true, color: C.text2 } }, { text: spec.practises.join('  ·  '), options: { color: C.text1 } }],
          { x: X0, y: YT - 0.05, w: W, h: long ? 0.52 : 0.32, fontSize: 12, margin: 0, isTextBox: true, valign: 'top' });
      }
      const HS = H - 0.4 - top;
      const gap = 0.3, cw = (W - gap) / cols, ch = (HS - gap * (rowsN - 1)) / rowsN;
      s.addText([{ text: 'Full commands and what you should see: ', options: {} }, { text: `handbook, Day ${this.day} → ${spec.title}`, options: { bold: true } }],
        { x: X0, y: YB - 0.27, w: W, h: 0.3, fontSize: 11, italic: true, color: C.accent5, valign: 'middle', margin: 0, isTextBox: true });
      for (let i = 0; i < list.length; i++) {
        const st = list[i];
        const col = i % cols, row = Math.floor(i / cols);
        const x = X0 + col * (cw + gap), y = YT + top + row * (ch + gap);
        s.addShape(P.ShapeType.roundRect, { x, y, w: cw, h: ch, rectRadius: 0.1, fill: { color: C.background2 }, line: { color: C.background2 } });
        const n = ci * per + i + 1;
        s.addText(String(n), { shape: P.ShapeType.ellipse, x: x + 0.18, y: y + 0.18, w: 0.46, h: 0.46, fill: { color: C.accent1 }, line: { color: C.accent1 }, fontSize: 14, bold: true, color: C.background1, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
        const doH = st.expect ? ch - 0.95 : ch - 0.35;
        s.addText(st.do, { x: x + 0.8, y: y + 0.15, w: cw - 0.95, h: doH, fontSize: 12.5, color: C.text1, valign: 'top', margin: 0, isTextBox: true });
        if (st.expect) {
          s.addText([{ text: 'You should see: ', options: { bold: true } }, { text: st.expect }], { x: x + 0.8, y: y + ch - 0.85, w: cw - 0.95, h: 0.75, fontSize: 11.5, italic: true, color: C.accent1, valign: 'bottom', margin: 0, isTextBox: true });
        }
      }
      s.addNotes([spec.notes || '', spec.debrief ? `Debrief (what this lab showed): ${spec.debrief}` : ''].filter(Boolean).join('\n\n'));
    }
  }

  code(spec) {
    const { P, C } = this;
    const s = this.slide('CONTENT');
    s.addText(spec.title, { placeholder: 'title' });
    const cw = spec.wide ? W : 7.7;
    const lines = spec.code.split('\n');
    const size = spec.fontSize || (lines.length > 18 ? 11 : 12.5);
    s.addText(lines.map((l, i) => ({ text: l.length ? l : ' ', options: { breakLine: i < lines.length - 1 } })), {
      shape: P.ShapeType.roundRect, rectRadius: 0.1, x: X0, y: YT, w: cw, h: H,
      fill: { color: C.text1 }, line: { color: C.text1 }, fontFace: 'Courier New', fontSize: size, color: C.background2, valign: 'top', margin: 14, isTextBox: true,
    });
    if (!spec.wide && spec.notesRight) {
      const rx = X0 + cw + 0.35, rw = W - cw - 0.35;
      s.addText(spec.notesTitle || 'Read it line by line', { x: rx, y: YT, w: rw, h: 0.4, fontSize: 16, bold: true, color: C.text2, margin: 0, isTextBox: true });
      s.addText(this.bullets(spec.notesRight, 13, { space: 7 }), { x: rx, y: YT + 0.5, w: rw, h: H - 0.5, valign: 'top', margin: 0, isTextBox: true });
    }
    s.addNotes(spec.notes || '');
  }

  table(spec) {
    const { C } = this;
    const s = this.slide('CONTENT');
    s.addText(spec.title, { placeholder: 'title' });
    let y = YT;
    if (spec.intro) {
      s.addText(spec.intro, { x: X0, y, w: W, h: 0.45, fontSize: 14, color: C.accent5, margin: 0, isTextBox: true });
      y += 0.55;
    }
    const size = spec.fontSize || 12.5;
    const head = spec.header.map((h) => ({ text: h, options: { bold: true, color: C.background1, fill: { color: C.text2 }, fontSize: size, valign: 'middle' } }));
    // A line break in a cell needs separate runs: pptxgenjs ignores a bare \n there.
    const lines = (c) => (String(c).includes('\n') ? String(c).split('\n').map((t, i, all) => ({ text: t || ' ', options: { breakLine: i < all.length - 1 } })) : c);
    const body = spec.rows.map((r, ri) => r.map((c, ci) => ({ text: lines(c), options: { fontSize: size, color: C.text1, bold: ci === 0 && spec.boldFirst, fill: { color: ri % 2 ? C.background2 : C.background1 }, valign: 'top' } })));
    const rowH = spec.rowH || Math.min(0.62, (YB - y) / (spec.rows.length + 1));
    s.addTable([head, ...body], { x: X0, y, w: W, colW: spec.colW, border: { type: 'solid', color: THEME.colors.lt2, pt: 1 }, margin: 0.07, autoPage: false, rowH });
    s.addNotes(spec.notes || '');
  }

  compare(spec) {
    const { P, C } = this;
    const s = this.slide('CONTENT');
    s.addText(spec.title, { placeholder: 'title' });
    const gap = 0.4, cw = (W - gap) / 2;
    [spec.left, spec.right].forEach((side, i) => {
      const x = X0 + i * (cw + gap);
      const good = i === 1 && !spec.neutral;
      s.addShape(P.ShapeType.roundRect, { x, y: YT, w: cw, h: H, rectRadius: 0.12, fill: { color: good ? 'E4F4EC' : C.background2 }, line: { color: good ? 'E4F4EC' : C.background2 } });
      s.addText(side.head, { x: x + 0.3, y: YT + 0.2, w: cw - 0.6, h: 0.55, fontSize: 18, bold: true, color: good ? C.accent1 : C.text2, valign: 'middle', margin: 0, isTextBox: true });
      s.addText(this.bullets(side.items, 14, { space: 8 }), { x: x + 0.3, y: YT + 0.9, w: cw - 0.6, h: H - 1.1, valign: 'top', margin: 0, isTextBox: true });
    });
    s.addNotes(spec.notes || '');
  }

  async scenarios(spec) {
    const { P, C } = this;
    const s = this.slide('CONTENT');
    s.addText(spec.title, { placeholder: 'title' });
    const n = spec.items.length, gap = 0.3, cw = (W - gap * (n - 1)) / n;
    for (let i = 0; i < n; i++) {
      const it = spec.items[i];
      const x = X0 + i * (cw + gap);
      s.addShape(P.ShapeType.roundRect, { x, y: YT, w: cw, h: H, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: C.background2 } });
      await this.circleIcon(s, it.icon || 'FiAlertTriangle', x + 0.25, YT + 0.25, 0.6, THEME.colors[it.color || 'accent3'], 'FFFFFF');
      s.addText(it.name, { x: x + 1.0, y: YT + 0.25, w: cw - 1.2, h: 0.6, fontSize: 16, bold: true, color: C.text1, valign: 'middle', margin: 0, isTextBox: true });
      const block = (label, text, y, h, color) => {
        s.addText(label, { x: x + 0.25, y, w: cw - 0.5, h: 0.28, fontSize: 10.5, bold: true, color: C.accent5, charSpacing: 1.5, margin: 0, isTextBox: true });
        s.addText(text, { x: x + 0.25, y: y + 0.3, w: cw - 0.5, h: h - 0.3, fontSize: 12.5, color: color || C.text1, valign: 'top', margin: 0, isTextBox: true });
      };
      block('WHAT HAPPENS', it.does, YT + 1.05, 1.35);
      block('WHAT THE PLATFORM DOES', it.platform, YT + 2.45, 1.75);
      block('THE RULE', it.rule, YT + 4.25, 0.95, C.text2);
    }
    s.addNotes(spec.notes || '');
  }

  async quiz(spec) {
    const { C } = this;
    const s = this.slide('CONTENT');
    s.addText(spec.title || 'Check your understanding', { placeholder: 'title' });
    await this.circleIcon(s, 'FiHelpCircle', 11.6, 0.5, 0.7, THEME.colors.accent4, 'FFFFFF');
    s.addText('Answer with your team. Answers are in the notes.', { x: X0, y: YT, w: W, h: 0.4, fontSize: 13, color: C.accent5, margin: 0, isTextBox: true });
    const qs = spec.questions.map((q, i) => ({ text: `${i + 1}.  ${q}`, options: { breakLine: i < spec.questions.length - 1, paraSpaceAfter: 18 } }));
    s.addText(qs, { x: X0, y: YT + 0.55, w: W, h: H - 0.55, fontSize: 18, color: C.text1, valign: 'top', margin: 0, isTextBox: true });
    s.addNotes(spec.notes || '');
  }

  async recap(spec) {
    const { P, C } = this;
    const s = this.slide('CONTENT');
    s.addText(spec.title || 'What we built today', { placeholder: 'title' });
    this.strip(s, YT + 0.3, spec.highlight || [], 'The platform so far');
    const lw = 7.4, rx = X0 + lw + 0.4, rw = W - lw - 0.4, y = YT + 1.15;
    s.addText('You can now', { x: X0, y, w: lw, h: 0.35, fontSize: 12, color: C.accent5, margin: 0, isTextBox: true });
    s.addText(this.bullets(spec.built, 15, { space: 8 }), { x: X0, y: y + 0.4, w: lw, h: H - 1.6, valign: 'top', margin: 0, isTextBox: true });
    s.addShape(P.ShapeType.roundRect, { x: rx, y, w: rw, h: 3.1, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: C.background2 } });
    await this.circleIcon(s, 'FiArrowRightCircle', rx + 0.25, y + 0.25, 0.6, THEME.colors.accent1, 'FFFFFF');
    s.addText(spec.tomorrowTitle || 'Tomorrow', { x: rx + 1.0, y: y + 0.25, w: rw - 1.2, h: 0.6, fontSize: 17, bold: true, color: C.text2, valign: 'middle', margin: 0, isTextBox: true });
    s.addText(spec.tomorrow, { x: rx + 0.25, y: y + 1.0, w: rw - 0.5, h: 1.95, fontSize: 14, color: C.text1, valign: 'top', margin: 0, isTextBox: true });
    s.addNotes(spec.notes || '');
  }

  // The whole platform: nine pieces with their tools, in two rows, with arrows.
  diagram(spec) {
    const { P, C } = this;
    const s = this.slide('CONTENT');
    s.addText(spec.title, { placeholder: 'title' });
    const tools = spec.tools; // array of 9 {name, tool, what, hot}
    const layout = [[0, 1, 2, 3, 4], [5, 6, 7, 8]];
    const gap = 0.35, bw = (W - gap * 4) / 5, bh = 1.55;
    const ys = [YT + 0.2, YT + 2.75];
    const pos = {};
    layout.forEach((row, r) => {
      const offset = r === 1 ? (bw + gap) / 2 : 0;
      row.forEach((idx, c) => {
        const t = tools[idx];
        const x = X0 + offset + c * (bw + gap), y = ys[r];
        pos[idx] = { x, y };
        const hot = (spec.highlight || []).includes(t.name);
        s.addShape(P.ShapeType.roundRect, { x, y, w: bw, h: bh, rectRadius: 0.12, fill: { color: hot ? C.accent1 : C.background2 }, line: { color: hot ? C.accent1 : C.background2 } });
        s.addText(t.name, { x, y: y + 0.12, w: bw, h: 0.4, fontSize: 15, bold: true, color: hot ? C.background1 : C.text1, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
        s.addText(t.tool, { x, y: y + 0.5, w: bw, h: 0.35, fontSize: 12, color: hot ? C.background1 : C.accent5, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
        s.addText(t.what, { x: x + 0.1, y: y + 0.85, w: bw - 0.2, h: 0.65, fontSize: 11.5, color: hot ? C.background1 : C.text1, align: 'center', valign: 'top', margin: 0, isTextBox: true });
      });
    });
    const arrow = (a, b) => {
      const A = pos[a], B = pos[b];
      if (A.y === B.y) s.addShape(P.ShapeType.line, { x: A.x + bw + 0.06, y: A.y + bh / 2, w: gap - 0.12, h: 0, line: { color: THEME.colors.accent5, width: 1.5, endArrowType: 'triangle' } });
    };
    for (let i = 0; i < 4; i++) arrow(i, i + 1);
    for (let i = 5; i < 8; i++) arrow(i, i + 1);
    // from Pipeline (4) down to Registry (5): an elbow drawn as two lines
    const A = pos[4], B = pos[5];
    const midY = ys[0] + bh + 0.6;
    s.addShape(P.ShapeType.line, { x: A.x + bw / 2, y: A.y + bh + 0.05, w: 0, h: midY - A.y - bh - 0.05, line: { color: THEME.colors.accent5, width: 1.5 } });
    s.addShape(P.ShapeType.line, { x: B.x + bw / 2, y: midY, w: A.x + bw / 2 - B.x - bw / 2, h: 0, line: { color: THEME.colors.accent5, width: 1.5 }, flipH: true });
    s.addShape(P.ShapeType.line, { x: B.x + bw / 2, y: midY, w: 0, h: B.y - midY - 0.05, line: { color: THEME.colors.accent5, width: 1.5, endArrowType: 'triangle' } });
    if (spec.caption) s.addText(spec.caption, { x: X0, y: 6.35, w: W, h: 0.4, fontSize: 13, italic: true, color: C.accent5, margin: 0, isTextBox: true });
    s.addNotes(spec.notes || '');
  }

  close(spec) {
    const s = this.slide('TITLE');
    s.addText(spec.title, { placeholder: 'title' });
    s.addText(spec.subtitle, { placeholder: 'subtitle' });
    this.strip(s, 6.3, spec.highlight || PIECES, 'The platform');
    s.addNotes(spec.notes || '');
  }

  async render(specs) {
    this.specs = specs;
    for (const spec of specs) {
      this.setSection(spec.section);
      const fn = this[spec.type];
      if (!fn) throw new Error('Unknown slide type ' + spec.type);
      await fn.call(this, spec);
    }
  }

  async write(file) {
    await this.P.writeFile({ fileName: file });
  }
}

module.exports = { Deck, THEME, PIECES };
