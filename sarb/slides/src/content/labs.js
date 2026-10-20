// Every lab, step by step, for the handbook: the commands to paste and what you
// should see. The slides keep the short version of the same steps, in the same
// order; handbook.js checks that every lab on the slides has one here.
'use strict';

module.exports = Object.assign({}, ...[1, 2, 3, 4, 5, 6].map((d) => require(`./labs/day${d}`)));
