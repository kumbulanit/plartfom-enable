// Outputs recorded for instructions that had none, laid over the labs after
// beginner.js (labs.js): lab title, then step and instruction number (from 1).
// Each was recorded by running the command on a copy of hello in Linux with the
// workspace's tools; '' means the command prints nothing.
'use strict';

module.exports = {
  'Lab 2: Linux warm-up in your workspace': {
    1: { 3: '' },
  },
  'Lab 3: run hello by hand, and count the steps': {
    4: {
      3: '{"app": "hello", "version": "dev", "environment": "staging", "message": "Hello from staging"}',
      4: 'https://student01.<lab domain>/proxy/8082/',
    },
  },
  'Lab 2: your first change, on a branch': {
    3: {
      5: '22:GREETING = os.environ.get("GREETING", "Hello from team01, by student01")',
      6: 'On branch greeting-student01\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n  (use "git restore <file>..." to discard changes in working directory)\n\tmodified:   app/main.py\n\nno changes added to commit (use "git add" and/or "git commit -a")',
    },
    4: { 2: '{"app": "hello", "version": "dev", "environment": "local", "message": "Hello from team01, by student01"}' },
  },
  'Lab 4: break it, and watch the platform recover': {
    2: { 2: '20:31:50' },
  },
  'Capstone: your service to prod, with evidence': {
    1: { 3: '......                                                                   [100%]\n6 passed in 0.04s' },
  },
};
