// The day's plan, worked out from the day's own slides, so it can never disagree with
// them: each topic (a section that is not a lab) in order, with the labs that follow
// it. A section called "Lab N: ..." belongs to the topic before it; a topic named
// twice (Day 5's CI/CD) is one topic. Used by the "agenda" slide and the handbook.
'use strict';

// What delegates see of a lab's time: who does it ("on your own", "whole room"), not
// how long it takes. Durations change with the room; the instructor guide keeps them.
function who(time) {
  return (time || '').replace(/^\s*\d+\s*min\b\s*(·\s*)?/, '').trim();
}

function agenda(specs) {
  const topics = [];
  let current = null;
  for (const spec of specs) {
    const sec = spec.section;
    if (!sec || ['Opening', 'Close'].includes(sec)) continue;
    if (!/^Lab \d/.test(sec)) {
      current = topics.find((t) => t.name === sec);
      if (!current) topics.push((current = { name: sec, labs: [] }));
    }
    if (spec.type === 'steps' && current) current.labs.push({ title: spec.title, time: who(spec.time) });
  }
  return topics;
}

module.exports = { agenda, who };
