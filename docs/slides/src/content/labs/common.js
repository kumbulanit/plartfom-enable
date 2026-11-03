// Shared pieces of the step-by-step labs.
'use strict';

module.exports = {
  // How to use the workspace terminal, for every lab that uses it.
  TERMINAL: [
    'Your workspace is open in the browser (https://student01.<lab domain>, signed in with your password).',
    'A terminal is open at the bottom of the workspace. If not: menu ☰ (top left) → Terminal → New Terminal. You are ready when you see a prompt that ends in $, for example student01@student01:~$',
    'To run a command: copy it from this page (the copy button at the top right of each grey box), click in the terminal, paste with Ctrl+V (on a Mac Cmd+V, or right-click → Paste), and press Enter. You can paste a whole box at once: the lines run one after the other.',
    'If Git asks for a Username (the first time each day: it then remembers your password for 10 hours), type student01 and press Enter; for the Password, type your password (from cat /etc/pelab/logins.md) and press Enter. Nothing appears while you type the password: that is normal.',
  ],
  // Opening a link that a command printed in the terminal.
  OPEN_LINK: 'Hold Ctrl (on a Mac Cmd) and click the link in the terminal: it opens in a new browser tab.',
  // Playing the second person in Gitea: the reviewer or the platform team (see /etc/pelab/logins.md).
  PRIVATE_WINDOW: 'Open a private window (Edge or Chrome: Ctrl+Shift+N, on a Mac Cmd+Shift+N; Firefox: Ctrl+Shift+P, on a Mac Cmd+Shift+P), go to https://gitea.<lab domain>, click Sign In, and sign in with the other person\'s login: reviewer or platform-approver, with its password from cat /etc/pelab/logins.md in your workspace.',
};
