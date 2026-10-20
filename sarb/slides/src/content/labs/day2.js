// Day 2 labs, step by step, for the handbook (see labs/day1.js for the format).
'use strict';

module.exports = {
  'Lab 1: your first change, on a branch': {
    goal: 'Change the greeting of your team\'s service on a branch of your own, check it, save it as a commit and send it to Gitea.',
    start: 'Your copy of hello from Day 1 (~/hello). If you do not have it, do step 1 of Day 1 Lab 3 first.',
    steps: [
      {
        title: 'Go to main and get the latest version',
        where: 'Workspace terminal',
        say: 'main is the line that gets deployed. git pull brings in the changes your teammates merged since yesterday.',
        run: 'cd ~/hello\ngit switch main\ngit pull',
        see: '"Already up to date." or a short list of changed files.',
      },
      {
        title: 'Make your own branch',
        where: 'Workspace terminal',
        say: 'A branch is your own copy of the line, where your change cannot disturb anyone. The name includes your user name so it is unique.',
        run: 'git switch -c greeting-$ME',
        see: 'Switched to a new branch \'greeting-student01\' (with your user name).',
      },
      {
        title: 'Change the greeting',
        where: 'Workspace editor',
        say: [
          'In the file list on the left, open hello → app → main.py. Find the line that starts with GREETING (around line 21):',
          'GREETING = os.environ.get("GREETING", "Hello from the PE Lab golden path")',
          'Change only the text in the second pair of quotes, for example to "Hello from team 3". Save with Ctrl+S.',
        ],
        run: 'git status',
        see: 'modified: app/main.py, in red.',
      },
      {
        title: 'Check it works before you share it',
        where: 'Two workspace terminals',
        say: 'Start the service in the first terminal and call it from the second (+ button), as on Day 1. Then stop it with Ctrl+C in the first terminal.',
        run: 'python3 -m app.main',
        see: 'In the second terminal, curl -s localhost:8080/ shows your new text in "message".',
      },
      {
        title: 'Save the change as a commit',
        where: 'Workspace terminal',
        say: 'git add chooses what goes into the commit; git commit saves it with a message that says why. A good message finishes the sentence "This change will...".',
        run: 'git add -A\ngit commit -m "Change the greeting for $TEAM"',
        see: 'One line with the branch and a short commit id, then "1 file changed, 1 insertion(+), 1 deletion(-)".',
      },
      {
        title: 'Send your branch to Gitea',
        where: 'Workspace terminal',
        say: 'git push copies your branch to Gitea, where your team can see it. Gitea answers with a link to open a pull request.',
        run: 'git push -u origin greeting-$ME',
        see: 'The link to create the pull request:',
        out: 'remote: Create a new pull request for \'greeting-student01\':\nremote:   https://gitea.<lab domain>/team01/hello/compare/main...greeting-student01',
      },
    ],
    done: 'Your branch is in Gitea (teamNN/hello → Branches shows greeting-studentNN).',
  },

  'Lab 2: review, approve, merge, and watch it go live': {
    goal: 'Turn your change into a reviewed decision: a pull request, a teammate\'s review and approval, a merge, and the change running in dev by itself.',
    start: 'Lab 1 done: your branch is pushed. Work in pairs: each of you reviews the other\'s pull request.',
    steps: [
      {
        title: 'Open the pull request',
        where: 'Browser: Gitea',
        say: 'Open the link from git push (or Gitea → teamNN/hello → Pull Requests → New Pull Request, and pick your branch). Title: what changed. Description: why, in two lines. Click Create Pull Request.',
        see: 'The pull request page. A yellow dot next to the commit: the pipeline is checking your change.',
      },
      {
        title: 'Your teammate reads the change and comments',
        where: 'Browser: Gitea (your teammate)',
        say: 'Your teammate opens your pull request, then the Files Changed tab. The old line is red, the new one green. They click the + next to a line and leave one comment, then Add single comment.',
        see: 'A comment attached to a line of your change.',
      },
      {
        title: 'Your teammate approves',
        where: 'Browser: Gitea (your teammate)',
        say: 'Your teammate clicks Review (top right of Files Changed), chooses Approve and submits. Then wait for the pipeline: the yellow dot turns into a green tick. Until then the box says "Some checks are pending" and the merge button only offers to merge "When checks succeed": main requires the check called pipeline, which the pipeline posts as its last step.',
        see: '"All checks were successful", one green approval, and a plain Create squash commit button. A red pipeline says "Some required checks failed" instead, and nothing merges until the branch is fixed and pushed again.',
        tip: 'Working alone, or your teammate is busy? Play their role: open a private window (Ctrl+Shift+N; on a Mac Cmd+Shift+N; Firefox Ctrl+Shift+P), sign in to Gitea there with a login from "Your team\'s logins" on your access sheet (or cat /etc/pelab/logins.md in your workspace), and approve as that teammate. It counts because it is another account. Then close the private window and merge as yourself.',
      },
      {
        title: 'Merge it, and update your copy',
        where: 'Browser: Gitea, then the workspace terminal',
        say: 'On the pull request, choose Create squash commit in the merge menu and confirm. Squash turns your branch into one tidy commit on main. Then bring main up to date in your workspace.',
        run: 'git switch main\ngit pull\ngit log --oneline -3',
        see: 'Your change at the top of the history, as one commit.',
      },
      {
        title: 'Watch it go live',
        where: 'Browser: Argo CD',
        say: [
          'The pipeline now runs again on main and builds the image (Gitea → Actions shows it). Then Argo CD notices that main changed.',
          'Open https://argocd.<lab domain> and sign in as delegate with the password on your access sheet: one read-only login that every delegate shares (not your studentNN password). Then click the application teamNN-hello-dev.',
        ],
        see: 'Within a few minutes: Synced and Healthy, with your commit id next to "Sync OK to".',
        tip: 'If your instructor has switched on the safety net, Argo CD is paused. Look at your merge commit in Gitea instead (Commits → the tick next to it): safety-net/dev says "Deployed to teamNN-dev" with your commit.',
      },
      {
        title: 'See your change in dev',
        where: 'Browser',
        say: 'Open your service\'s dev address. Replace teamNN with your team, for example hello-team03-dev.',
        run: 'curl -s https://hello-$TEAM-dev.$DOMAIN/',
        see: '"environment": "dev" and your new greeting. Nobody logged in to a server: the merge did it.',
      },
    ],
    done: 'Your greeting answers on https://hello-teamNN-dev.<lab domain>/ and the pull request shows who approved it.',
  },

  'Lab 3: try to break the rules': {
    goal: 'Try the three shortcuts the platform refuses, and keep the refusal messages as evidence that the controls work.',
    start: 'Your copy of hello, on main and up to date (git switch main && git pull).',
    steps: [
      {
        title: 'Push straight to main',
        where: 'Workspace terminal',
        say: 'This is the shortcut: a change on main with no review.',
        run: 'cd ~/hello\ngit switch main\necho "Direct edit" >> README.md\ngit add -A\ngit commit -m "Direct edit"\ngit push',
        see: 'Refused. Copy the message into your notes:',
        out: 'remote: error: Not allowed to push to protected branch main\n ! [remote rejected] main -> main (pre-receive hook declined)',
      },
      {
        title: 'Undo it',
        where: 'Workspace terminal',
        say: 'Put your main back to what Gitea has, and throw the local commit away.',
        run: 'git reset --hard origin/main\ngit status',
        see: '"Your branch is up to date with \'origin/main\'" and nothing to commit.',
      },
      {
        title: 'Approve your own pull request',
        where: 'Workspace terminal, then Gitea',
        say: 'Make a small change on a new branch and open a pull request, as in Lab 2. Then try to approve it yourself (Files Changed → Review → Approve).',
        run: 'git switch -c self-approve-$ME\necho "Self review" >> README.md\ngit commit -am "Try to approve my own change"\ngit push -u origin self-approve-$ME',
        see: 'Gitea does not let you approve your own pull request, and Merge stays unavailable.',
        tip: 'Signing in as a teammate would get an approval through: the tool checks accounts, not people. That is why at work every account is personal and never shared. In this lab you share logins only to play roles.',
      },
      {
        title: 'Change it after a teammate approved',
        where: 'Gitea, then the workspace terminal',
        say: 'Ask a teammate to approve the pull request (or approve it as a teammate in a private window, as in Lab 2). Then push one more commit to the same branch.',
        run: 'echo "One more line" >> README.md\ngit commit -am "Change after approval"\ngit push',
        see: 'The approval is marked stale (dismissed): what was approved is no longer what would be merged, so it needs a fresh review.',
        tip: 'Close this pull request without merging when you are done (Close Pull Request at the bottom), and delete the branch.',
      },
      {
        title: 'Write down the three messages',
        where: 'Your team notes',
        say: 'Copy the three refusals: the protected branch, your own approval not counting, and the stale approval.',
        see: 'Three lines in your team notes. They go into the Day 6 evidence pack: proof that segregation of duties is enforced by the tool.',
      },
    ],
    done: 'Three refusals written down, and main unchanged.',
  },

  'Lab 4: resolve a merge conflict': {
    goal: 'See what happens when two people change the same line, and resolve it calmly.',
    start: 'Work in pairs: person A and person B, both with hello on main and up to date.',
    steps: [
      {
        title: 'Both change the same line',
        where: 'Both workspaces',
        say: 'Each of you makes a branch from the latest main:',
        run: 'cd ~/hello\ngit switch main && git pull\ngit switch -c conflict-$ME',
        then: {
          say: 'Each of you changes the GREETING line in app/main.py to a different text (as in Lab 1, step 3) and saves. Then commit and push, and open a pull request in Gitea:',
          run: 'git commit -am "Greeting from $ME"\ngit push -u origin conflict-$ME',
        },
        see: 'Two pull requests that change the same line.',
      },
      {
        title: 'Merge the first one',
        where: 'Browser: Gitea',
        say: 'Person B approves person A\'s pull request, and person A merges it.',
        see: 'Person B\'s pull request now says it has conflicts and cannot be merged automatically.',
      },
      {
        title: 'Bring main into your branch',
        where: 'Person B\'s workspace terminal',
        say: 'Person B takes the latest main and merges it into their branch, to see the conflict on their own machine.',
        run: 'git switch main\ngit pull\ngit switch conflict-$ME\ngit merge main',
        see: 'Git stops and names the file:',
        out: 'CONFLICT (content): Merge conflict in app/main.py\nAutomatic merge failed; fix conflicts and then commit the result.',
      },
      {
        title: 'Choose the line to keep',
        where: 'Person B\'s workspace editor',
        say: [
          'Open app/main.py. Git has put both versions in the file, between markers: <<<<<<< your version, ======= the separator, and >>>>>>> main\'s version.',
          'Decide which greeting to keep (or write a new one). Delete the other one and all three marker lines. Save.',
        ],
        run: 'grep -n "<<<<<<<\\|=======\\|>>>>>>>" app/main.py || echo "no markers left"',
        see: '"no markers left", and one GREETING line.',
      },
      {
        title: 'Finish the merge and update the pull request',
        where: 'Person B\'s workspace terminal, then Gitea',
        say: 'Commit the resolved file and push. The pull request updates itself; person A approves it and person B merges.',
        run: 'git add -A\ngit commit -m "Resolve conflict with main"\ngit push',
        see: 'The pull request can be merged again. After the merge, dev shows the greeting you kept.',
      },
    ],
    done: 'Both pull requests are merged, and app/main.py on main has one greeting and no markers.',
  },

  "Lab 5: write your team's one-page platform charter": {
    goal: 'Write, as a team, what a platform for your part of FMD must do and promise: a one-page charter.',
    start: 'Your team, one sheet (or a shared page). No computer needed.',
    steps: [
      {
        title: 'Who uses it',
        where: 'Your team',
        say: 'List the roles in your team and in FMD who would use a platform like this one: for example analysts, developers, data engineers, testers, risk and audit.',
        see: 'Three to five roles.',
      },
      {
        title: 'What they need',
        where: 'Your team',
        say: 'Write the three jobs the platform must make easy, in the users\' own words. For example "Get a new report into production without raising four tickets."',
        see: 'Three jobs, one line each.',
      },
      {
        title: 'What we promise',
        where: 'Your team',
        say: 'Write two service levels you could measure this week, each with a number and a unit. For example "A merged change is live in dev within 15 minutes."',
        see: 'Two promises with a number and a unit.',
      },
      {
        title: 'How we measure',
        where: 'Your team',
        say: 'Write two numbers you would show the platform\'s owner every month. For example "time from template to running service" and "share of changes that needed a fix afterwards".',
        see: 'Two measures.',
      },
      {
        title: 'What is next',
        where: 'Your team',
        say: 'Write three things you would add to the platform after this course.',
        see: 'Three items.',
      },
      {
        title: 'Present it in two minutes',
        where: 'In front of the room',
        say: 'Read your charter. Keep it: it goes into the Day 6 capstone.',
        see: 'A one-page charter per team.',
      },
    ],
    done: 'A one-page charter with users, jobs, two promises, two measures and three next steps.',
  },
};
