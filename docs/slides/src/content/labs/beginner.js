// The beginner layer for Day 1 and Day 2: written for someone who has never used a
// terminal or Git. labs.js lays it over the tested labs (labs/day1.js, labs/day2.js):
//   lab:  story (the idea in plain words, with an everyday comparison), end (what you
//         will have at the end)
//   step: plain (the step in one sentence), check (how you know it worked), tryit (a
//         small safe experiment), do (one command at a time, each with what it prints),
//         read (how to read the output, for a beginner)
// The commands in "do" are the same lines as the step's tested box (run), split up, so
// the test harness still runs the box exactly as before. The outputs come from those
// tested runs, cut at the line where each command's own output starts.
'use strict';

module.exports = {
  // ---------------------------------------------------------------- Day 1
  'Lab 1: map how a change reaches production today': {
    story: [
      'Think of the last time something you needed changed at work: a new column in a report, a fix to a spreadsheet model, a new script. You asked, and some days or weeks later it was there. In between it passed through several people, waited in queues, and was checked by hand. Most of that time nobody was working on it: it was waiting.',
      'In this lab every team draws that road on paper, then looks at the other teams\' roads. You will find that everyone built almost the same road, each in their own way. That discovery, made by the room itself, is the whole case for a platform. No computer is needed.',
    ],
    end: 'Your road with its waits, ticks from the other teams on what is the same, and one shared road on the wall with what the platform does instead of each shared step.',
    steps: {
      0: { plain: 'Draw every step your change goes through, and mark where it waits and why.', check: 'Your road goes from "someone asks" to "live", with at least one pink wait and two numbers in the corner.' },
      1: { plain: 'One of you looks at the other teams\' roads and ticks every step you recognise.', check: 'Your walker has visited every other board.' },
      2: { plain: 'Back in your team, sort your steps into "the same as others" and "only ours".', check: 'Every note is in one of the two groups.' },
      3: { plain: 'Put everyone\'s shared steps on one wall, and see that this one road is what a platform builds once, for everyone.', check: 'You can say in one sentence what a platform would change for your team.' },
    },
  },

  'Lab 2: Linux warm-up in your workspace': {
    story: [
      'A terminal is like a text chat with the computer. You type an instruction, press Enter, and it answers in text. In this lab you try the handful of instructions everyone uses every day: make a folder, make a file, see who may read it, see what is running, read a program\'s diary (its log), visit a website, and do one thing as the administrator.',
      'If you have not yet, read [Start here](../start-here.md) first: it shows the screen and how to paste a command. Go slowly: run one command, compare what you see with the handbook, read the short explanation, then go on.',
    ],
    end: 'A folder day1 with a file in it that only you can read, and the confidence to type a command, read the answer and know whether it worked.',
    steps: {
      0: {
        plain: 'Make a folder, put a small file in it, and look at what is there.',
        do: [
          { text: 'Make a folder called day1 in your home folder. It prints nothing: on Linux, no message means it worked.', cmd: 'mkdir -p ~/day1' },
          { text: 'Go into that folder. It prints nothing either, but look at the end of the prompt: it changes from ~$ to ~/day1$. The prompt always shows where you are.', cmd: 'cd ~/day1', see: 'Only the prompt changes:', out: 'student07@student07:~/day1$' },
          { text: 'Create a file called notes.txt with the word hello in it. Again, nothing is printed.', cmd: 'echo "hello" > notes.txt' },
          { text: 'Now list what is in the folder, with details, to see your file.', cmd: 'ls -la', see: 'Three lines (your dates and times differ). The last one is your file:', out: 'total 4\ndrwxr-xr-x 2 student07 student07 4096 Nov  2 09:41 .\ndrwxr-x--- 9 student07 student07 4096 Nov  2 09:41 ..\n-rw-r--r-- 1 student07 student07    6 Nov  2 09:41 notes.txt' },
        ],
        read: [
          'Look only at the last line, the one ending in notes.txt: that is your file. The rest of that line is detail: who may read it (-rw-r--r--, explained in step 2), who owns it (student07, you), how big it is (6: the five letters of hello and an invisible end-of-line), and when it was made.',
          'The lines ending in . and .. are the folder itself and the folder above it. Every folder lists them; you can ignore them.',
          'If your file shows -rw-rw-r-- instead of -rw-r--r--, that is also normal.',
        ],
        tryit: { text: 'cat shows what is inside a file. Paste it:', cmd: 'cat notes.txt', see: 'The word you put in the file:', out: 'hello' },
        ifnot: [['cd: no such file or directory', 'the folder was not made. Paste the mkdir line (instruction 1) again, then the cd line.']],
        check: 'Your prompt ends in ~/day1$, and ls -la shows a line ending in notes.txt.',
      },
      1: {
        plain: 'Lock your file so that only you can read it.',
        do: [
          { text: 'Change who may use the file: only you may read and change it, nobody else may even read it. It prints nothing.', cmd: 'chmod 600 notes.txt' },
          { text: 'Look at the file\'s details again.', cmd: 'ls -la notes.txt', see: 'The start of the line has changed to -rw-------:', out: '-rw------- 1 student07 student07 6 Nov  2 09:41 notes.txt' },
        ],
        check: 'The line starts with -rw------- : one rw for you, then only dashes for everyone else.',
      },
      2: {
        plain: 'See which programs are running on your workspace right now, like Task Manager on Windows or Activity Monitor on a Mac.',
        check: 'You pressed q, top has gone, and the prompt is back.',
      },
      3: {
        plain: 'Check that a program that runs in the background (Docker) is working, and read its diary (its log).',
        do: [
          { text: 'Ask the system how the Docker program is doing.', cmd: 'systemctl status docker --no-pager', see: 'A few lines; the important one is Active, which says active (running) in green:', out: '● docker.service - Docker Application Container Engine\n     Loaded: loaded (/usr/lib/systemd/system/docker.service; enabled; preset: enabled)\n     Active: active (running) since Mon 2026-11-02 08:01:12 UTC; 1h 40min ago\n...', note: 'If the screen does not give you the prompt back, press q.' },
          { text: 'Read the last ten lines Docker wrote in its log today. sudo means "as the administrator": reading the system\'s logs needs it. In your workspace it does not ask for a password.', cmd: 'sudo journalctl -u docker --since today | tail', see: 'Ten lines, each starting with a date and time, then the computer\'s name and the program, then what happened. For example:', out: 'Nov 02 08:01:12 student07 dockerd[312]: time="2026-11-02T08:01:12Z" level=info msg="API listen on /run/docker.sock"' },
        ],
        check: 'The status says Active: active (running), and you have read a few log lines.',
      },
      4: {
        plain: 'Visit a website from the terminal instead of from the browser, and read the answer.',
        check: 'The first line of the answer ends in 200, which means OK.',
      },
      5: {
        plain: 'Run one command as yourself and once as the administrator, and see the difference.',
        do: [
          { text: 'Ask "who am I?".', cmd: 'whoami', see: 'Your own user name:', out: 'student07' },
          { text: 'Ask the same question with sudo in front.', cmd: 'sudo whoami', see: 'The administrator, whose name on Linux is always root:', out: 'root' },
        ],
        check: 'whoami said your user name, and sudo whoami said root.',
      },
    },
  },

  'Lab 3: run hello by hand, and count the steps': {
    story: [
      'hello is a very small website: when you visit it, it answers with a short greeting and a few facts about itself. Your team will ship it all week, through the platform.',
      'Today you run it yourself, by hand, the way it was done before platforms existed: copy the code, start it in a terminal, visit it, change its settings, restart it. Think of it as running a market stall yourself: you carry the table, set it up, open, close, and set up again somewhere else. Every manual step you count today is one the platform takes over later in the week.',
      'You will use two terminals at the same time: one runs the website and stays busy, the other visits it. Step 3 shows how to open the second.',
    ],
    end: 'hello running on your workspace, twice, with two different settings; and a written list of every step it took by hand.',
    steps: {
      0: {
        plain: 'Tell Git your name, then copy your team\'s code from Gitea (the place where the bank keeps code) into your workspace.',
        do: [
          { text: 'Paste this one line on its own and press Enter. It asks "Your full name:": type your name (for example Thandi Nkosi) and press Enter. Git puts this name on every change you save. It then prints the name back so you can check it.', cmd: 'read -p "Your full name: " NAME && git config --global user.name "$NAME" && git config --global user.name', see: 'Your question, your answer, and the name printed back:', out: 'Your full name: Thandi Nkosi\nThandi Nkosi' },
          { text: 'Tell Git your e-mail address in the lab. Prints nothing.', cmd: 'git config --global user.email "$ME@$DOMAIN"' },
          { text: 'Let Git remember your password for today, so you type it only once. Prints nothing.', cmd: 'git config --global credential.helper "cache --timeout=36000"' },
          { text: 'Go to your home folder and copy (clone) your team\'s code from Gitea. Git asks for a Username: type your studentNN and press Enter. Then a Password: type your password (from your logins file, cat /etc/pelab/logins.md) and press Enter. Nothing appears while you type a password: that is normal, keep typing.', cmd: 'cd ~\ngit clone https://gitea.$DOMAIN/$TEAM/hello', see: 'Git asks who you are, then copies the code (your numbers may differ a little):', out: 'Cloning into \'hello\'...\nUsername for \'https://gitea.<lab domain>\': student07\nPassword for \'https://student07@gitea.<lab domain>\':\nremote: Enumerating objects: 31, done.\nremote: Counting objects: 100% (31/31), done.\nremote: Compressing objects: 100% (24/24), done.\nremote: Total 31 (delta 1), reused 0 (delta 0), pack-reused 0 (from 0)\nReceiving objects: 100% (31/31), 11.00 KiB | 11.00 MiB/s, done.\nResolving deltas: 100% (1/1), done.' },
          { text: 'Go into the copy and list what is inside.', cmd: 'cd hello\nls', see: 'The files and folders of the website, and your prompt now ends in ~/hello$:', out: 'Dockerfile  README.md  app  catalog-info.yaml  deploy  pyproject.toml  tests' },
        ],
        check: 'Your prompt ends in ~/hello$, and ls shows app, tests and Dockerfile among others.',
      },
      1: {
        plain: 'Start the website on your workspace. From now on this terminal is busy running it, like a shop that is open: leave it alone.',
        check: 'You see the one "started" line and no prompt. That is right: the website is running.',
      },
      2: {
        plain: 'Visit your website from a second terminal, as a customer would, while the first keeps it running.',
        do: [
          'Open a second terminal: click the + at the top right of the terminal panel. A new terminal opens with its own prompt. The list on the right of the panel shows both terminals; click one to switch to it.',
          { text: 'In the new terminal, visit the website\'s front page.', cmd: 'curl -s localhost:8080/', see: 'The website describes itself in one line:', out: '{"app": "hello", "version": "dev", "environment": "local", "message": "Hello from the PE Lab golden path"}', note: 'Now click the first terminal and look: a new line appeared there, saying what was asked and how it was answered. That is the website\'s log.' },
          { text: 'Back in the second terminal, ask the website whether it is healthy.', cmd: 'curl -i localhost:8080/healthz', see: 'The status line HTTP/1.0 200 OK, a few details, and the answer ok:', out: 'HTTP/1.0 200 OK\nServer: hello Python/3.12.3\nDate: Mon, 02 Nov 2026 10:12:41 GMT\nContent-Type: text/plain\nContent-Length: 3\n\nok' },
        ],
        read: [
          'The first answer is written in JSON, a common way to write data: "name": value pairs between curly brackets. app, version and environment are what the website says about itself. environment is local because you started it by hand.',
          '200 OK and ok: the website is alive. The platform asks exactly this question, all the time, to know whether a service is healthy.',
        ],
        check: 'You saw the greeting, then ok, and the first terminal shows a log line for each visit.',
      },
      3: {
        plain: 'Restart the same website with three different settings, so it behaves as "staging" instead of "local".',
        check: 'curl -s localhost:8081/ answers with "environment": "staging" and "Hello from staging".',
      },
      4: {
        plain: 'Look at the numbers the website keeps about itself: how many visits it had, and how long it has been running.',
        check: 'You found the line with http_requests_total, and saw its number go up after one more visit.',
      },
      5: {
        plain: 'Write down every step you just took by hand, in a file, as your "before" picture.',
        check: 'The file shows the ten steps, plus any you added, and your answer on the last line.',
      },
    },
  },

  // ---------------------------------------------------------------- Day 2
  'Lab 1: your first change, on a branch': {
    story: [
      'Git keeps the whole history of a folder of code: every change, who made it, when and why. Think of "track changes" in Word, but for a whole folder, kept for ever, with a way back to any earlier version.',
      'Three ideas carry the whole lab. A **branch** is your own private copy of the code to work in: whatever you do there disturbs nobody. A **commit** is saving your work in Git with a short note saying what you changed, like signing and dating a page. A **push** is uploading your branch to Gitea, so your team can see it.',
      'Here you change one sentence of the website, the greeting, and take it through all three.',
    ],
    end: 'Your own branch in Gitea with one saved change: a new greeting, checked on your workspace first.',
    steps: {
      0: {
        plain: 'Go into your copy of the code, switch to the main line, and fetch whatever your team added since yesterday.',
        do: [
          { text: 'Go into your copy of hello. Prints nothing; the prompt ends in ~/hello$.', cmd: 'cd ~/hello' },
          { text: 'Switch to the main line, the one that gets deployed.', cmd: 'git switch main', see: 'Git says you are on main:', out: 'Already on \'main\'\nYour branch is up to date with \'origin/main\'.' },
          { text: 'Fetch what others added to main in Gitea.', cmd: 'git pull', see: '"Already up to date.", or a short list of changed files if something was merged since:', out: 'Already up to date.' },
        ],
        check: 'Your prompt ends in ~/hello$, and git pull has finished without an error.',
      },
      1: {
        plain: 'Make your own private copy of the code (a branch) to work in, with your name on it.',
        tryit: { text: 'git branch lists your branches, with a * next to the one you are on now. Paste it:', cmd: 'git branch', see: 'Your new branch, with the *, and main:', out: '* greeting-student07\n  main' },
        check: 'Git said "Switched to a new branch \'greeting-studentNN\'" with your own user name.',
      },
      2: {
        plain: 'Change one sentence in the program: the greeting the website answers with.',
        check: 'git status says modified: app/main.py.',
      },
      3: {
        plain: 'Try your change on your own workspace, before anyone else sees it.',
        check: 'The answer shows your new greeting in "message", and you stopped the website with Ctrl+C.',
      },
      4: {
        plain: 'Save your change in Git, with a short note that says what it does.',
        do: [
          { text: 'Tell Git which changes go into this save: all of them. Prints nothing.', cmd: 'git add -A' },
          { text: 'Save it, with a note. The note should finish the sentence "This change will...".', cmd: 'git commit -m "Change the greeting for $TEAM"', see: 'Your branch, the save\'s short id (yours differs) and your note, then what changed:', out: '[greeting-student07 6514a43] Change the greeting for team03\n 1 file changed, 1 insertion(+), 1 deletion(-)' },
        ],
        tryit: { text: 'git log shows the history of saves, newest first. Paste it:', cmd: 'git log --oneline -3', see: 'Your save at the top, with your note (your ids differ):', out: '6514a43 (HEAD -> greeting-student07) Change the greeting for team03\ne448d09 (origin/main, origin/HEAD, main) Initial commit' },
        check: 'Git printed one line with your branch name and your note, and "1 file changed".',
      },
      5: {
        plain: 'Upload your branch to Gitea, so your team can see it and review it.',
        check: 'In Gitea, teamNN/hello → Branches lists greeting-studentNN.',
      },
    },
  },

  'Lab 2: review, approve, merge, and watch it go live': {
    story: [
      'A pull request is like sending a document for sign-off. You say "here is my change, and here is why". A colleague reads it, may comment, and approves. Then it is filed: merged into main, the line that gets deployed.',
      'Two rules protect main, and Gitea enforces both: someone other than you must approve, and the automatic checks (the pipeline) must pass. After the merge you do nothing: the platform notices main has changed and puts your change live in dev by itself. That is called GitOps.',
      'You play both people: the author, in your normal browser window, and the colleague who reviews, in a private window, signed in as reviewer (its password is in cat /etc/pelab/logins.md).',
    ],
    end: 'Your greeting live in dev, put there by the platform, with a record of who approved it.',
    steps: {
      0: {
        plain: 'Ask for your change to be accepted into main, and say why.',
        do: [
          'In the terminal from Lab 1, find the line remote:   https://gitea.<lab domain>/teamNN/hello/pulls/new/greeting-studentNN. Hold Ctrl (on a Mac Cmd) and click the link in the terminal: it opens in a new browser tab.',
          'Gitea shows your change and a form under it. The title is already your commit message ("Change the greeting for teamNN"): keep it or make it clearer. It should say what changes.',
          { text: 'In the box under the title, write two lines on why: for example "Shows our team\'s name on the dev page, so we can see our own release."', shot: { src: 'gitea-02-new-pr-form.png', caption: 'The new pull request form: at the top, which branch goes into which (pull from your branch, merge into main); the title, already filled in; and the box where you write why. Your names, team and numbers are your own.' } },
          { text: 'Click Create Pull Request (the blue button under the form).', shot: { src: 'gitea-03-pr-created.png', caption: 'Your pull request is created: its number (#1), your description, your commit, and at the bottom the checks starting. The yellow dot means "still running". Your names, team and numbers are your own.' } },
        ],
        check: 'Your pull request page is open, with your title, your two lines of why, and the checks starting at the bottom.',
      },
      1: {
        plain: 'As the reviewer, in a private window, read your change line by line and leave a comment.',
        do: [
          'Open a private window (Edge or Chrome: Ctrl+Shift+N, on a Mac Cmd+Shift+N; Firefox: Ctrl+Shift+P, on a Mac Cmd+Shift+P), go to https://gitea.<lab domain>, click Sign In and sign in as reviewer with its password from cat /etc/pelab/logins.md.',
          'As the reviewer, open your pull request (teamNN/hello → Pull Requests → yours) and click the Files Changed tab.',
          'The old line is shown in red with -, the new line in green with +.',
          { text: 'Move the mouse over the green line: a blue + appears at its left. Click it, write a short comment (a question or a suggestion) and click Add single comment.', shot: { src: 'gitea-04-line-comment.png', caption: 'Files Changed, seen by the reviewer: the old line 22 in red, the new one in green, and a comment being written under the green line. Add single comment posts it. Your names, team and numbers are your own.' } },
        ],
        check: 'A comment is attached to your changed line, and in your normal window you can see it in the Conversation tab.',
      },
      2: {
        plain: 'As the reviewer, approve your change; then the automatic checks turn green.',
        do: [
          'Still in the private window, in Files Changed, click Review (the blue button, top right). A box called Submit review opens.',
          { text: 'Write a short note ("Looks good"), then click Approve. Then close the private window: you are the author again.', shot: { src: 'gitea-05-approve-box.png', caption: 'The Submit review box: a note ("Looks good"), then Approve. Comment only comments; Request changes asks the author to change something first. Your names, team and numbers are your own.' } },
          { text: 'Now wait for the pipeline: on the Conversation tab, the yellow dot next to the checks turns into a green tick, in a few minutes.', shot: { src: 'gitea-06-merge-blocked.png', caption: 'Before the approval and the green pipeline, the box above the merge button says exactly what is still missing, and the button only offers to merge "When checks succeed". Your names, team and numbers are your own.' } },
        ],
        check: 'The page shows one approval, "All checks were successful", and a plain merge button.',
      },
      3: {
        plain: 'Accept the change into main, then bring your own copy of main up to date.',
        do: [
          { text: 'On the Conversation tab, click the small arrow to the right of the merge button and choose Create squash commit.', shot: { src: 'gitea-07-merge-squash.png', caption: 'Ready to merge: the reviewer\'s approval, "All checks were successful", and the merge button\'s menu open. Choose Create squash commit. Your names, team and numbers are your own.' } },
          { text: 'Click the merge button, which now reads Create squash commit. A small form opens: the title of the commit (your pull request\'s title with its number, for example (#1)) and a message that already says who reviewed it (Reviewed-by: ...).', shot: { src: 'gitea-08-squash-form.png', caption: 'The squash commit form: the title with the pull request number (#1), a message that records who reviewed it (Reviewed-by), and Delete Branch ticked. In the lab the address in the message is your lab\'s Gitea. Your names, team and numbers are your own.' } },
          'Tick Delete Branch "greeting-studentNN" (your branch has done its job) and click Create squash commit.',
          { text: 'In the workspace terminal, go into your copy and switch to main.', cmd: 'cd ~/hello\ngit switch main', see: 'Git switches back to main:', out: 'Switched to branch \'main\'\nYour branch is up to date with \'origin/main\'.' },
          { text: 'Fetch the merge from Gitea.', cmd: 'git pull', see: 'Git fetches main and updates your copy (your ids differ):', out: 'From https://gitea.<lab domain>/team03/hello\n   e448d09..b70e47f  main       -> origin/main\nUpdating e448d09..b70e47f\nFast-forward\n app/main.py | 2 +-\n 1 file changed, 1 insertion(+), 1 deletion(-)' },
          { text: 'Show the last three saves (commits) in the history, one line each.', cmd: 'git log --oneline -3', see: 'Your change at the top, as one commit with the pull request number:', out: 'b70e47f (HEAD -> main, origin/main, origin/HEAD) Change the greeting for team03 (#1)\ne448d09 Initial commit' },
        ],
        check: 'git log shows your change at the top of main, with (#1) or your pull request\'s number.',
      },
      4: { plain: 'Watch the platform build your change and put it live in dev, without anyone touching a server.', check: 'Argo CD shows teamNN-hello-dev as Synced and Healthy.' },
      5: { plain: 'Visit dev and see your own greeting answering there.', check: 'The dev page shows DEV in big red letters and your greeting.' },
    },
  },

  'Lab 3: try to break the rules': {
    story: [
      'A control at a bank is only real if it stops people, including well-meaning people in a hurry. In this lab you deliberately try three shortcuts: changing main directly, approving your own change, and changing your change after it was approved.',
      'Each time, the platform should say no. Here a "no" is a success: it is proof that the control works. You copy each refusal into a file, as evidence for Day 6.',
    ],
    end: 'A file with the three refusal messages you saw yourself, and main unchanged.',
    steps: {
      0: {
        plain: 'Try to change main directly, without a review, and see Gitea refuse it.',
        do: [
          { text: 'Go to main and make sure it is up to date.', cmd: 'cd ~/hello\ngit switch main && git pull', see: 'Main, up to date:', out: 'Already on \'main\'\nYour branch is up to date with \'origin/main\'.\nAlready up to date.' },
          { text: 'Add a line at the end of README.md. Prints nothing.', cmd: 'echo "Direct edit" >> README.md' },
          { text: 'Save it in Git, directly on main.', cmd: 'git add -A\ngit commit -m "Direct edit"', see: 'Git saves it on your copy of main (this part works, because it is only on your workspace):', out: '[main e34ccb5] Direct edit\n 1 file changed, 1 insertion(+)' },
          { text: 'Now try to upload main to Gitea.', cmd: 'git push', see: 'Refused. Look for the line with "Not allowed":', out: 'remote:\nremote: error:\nremote: error: Not allowed to push to protected branch main\nremote: error:\nTo https://gitea.<lab domain>/team03/hello\n ! [remote rejected] main -> main (pre-receive hook declined)\nerror: failed to push some refs to \'https://gitea.<lab domain>/team03/hello\'' },
        ],
        check: 'git push ended with "Not allowed to push to protected branch main" and "failed to push".',
      },
      1: {
        plain: 'Throw away the change Gitea refused, so your copy of main matches Gitea again.',
        do: [
          { text: 'Make your main exactly like Gitea\'s, throwing away the refused save.', cmd: 'git reset --hard origin/main', see: 'Git names the save it went back to:', out: 'HEAD is now at b70e47f Change the greeting for team03 (#1)' },
          { text: 'Check.', cmd: 'git status', see: 'Clean, and in step with Gitea:', out: 'On branch main\nYour branch is up to date with \'origin/main\'.\n\nnothing to commit, working tree clean' },
        ],
        check: 'git status says "nothing to commit, working tree clean".',
      },
      2: {
        plain: 'Make a small change on a new branch, open a pull request, and try to approve it yourself.',
        do: [
          'Paste the box: it makes a small change on a new branch and pushes it.',
          'Open the pulls/new link it prints and click Create Pull Request.',
          { text: 'Open Files Changed, click Review, and try to click Approve.', shot: { src: 'gitea-09-self-approve-blocked.png', caption: 'Refusal 2, as the author: Approve and Request changes are greyed out, and the mouse over Approve shows "Pull request authors can\'t approve their own pull request". Your names, team and numbers are your own.' } },
        ],
        check: 'The Approve button is greyed out, and hovering over it shows "Pull request authors can\'t approve their own pull request".',
      },
      3: {
        plain: 'Approve it as reviewer, then change your change, and watch the approval disappear.',
        do: [
          'Approve your self-approve pull request as reviewer, in a private window, as in Lab 2. The page now shows one approval.',
          'Paste the box: it adds one more commit to the same branch.',
          { text: 'Reload the pull request page.', shot: { src: 'gitea-10-approval-dismissed.png', caption: 'Refusal 3: the approval is marked Dismissed, the reason says "New commits pushed, approval review dismissed automatically according to repository settings", and the merge box is back to "0 of 1 official approvals granted". Your names, team and numbers are your own.' } },
        ],
        check: 'Gitea says the approval was "dismissed automatically", and the merge box asks for an approval again.',
      },
      4: { plain: 'Save the three refusals you saw in a file, as evidence.', check: 'cat shows the three refusals with your user name and today\'s date, and you are back on main.' },
    },
  },

  'Lab 4: resolve a merge conflict': {
    story: [
      'Imagine two colleagues editing the same sentence of the same document at the same time, each in their own copy. When the copies come together, nobody can say automatically which sentence wins. Git is in the same position: when two branches change the same line, it stops and asks a person to choose. That is a merge conflict.',
      'A conflict is normal and safe: nothing is lost, both versions are kept until you decide. Here you make one on purpose, playing both colleagues with two branches, A and B, so that the first real one does not frighten you.',
    ],
    end: 'Both pull requests merged, and one greeting in main that you chose.',
    steps: {
      0: { plain: 'Change the same line (the greeting) to something different on two branches, A and B, and open a pull request for each.', check: 'teamNN/hello → Pull Requests shows two pull requests, A\'s and B\'s.' },
      1: {
        plain: 'Merge A\'s pull request first. B\'s pull request then no longer fits.',
        do: [
          'In a private window, as reviewer, open A\'s pull request: Files Changed → Review → Approve. Close the private window.',
          'When the checks are green, merge A as yourself (as in Lab 2, step 4).',
          { text: 'Open B\'s pull request and read the box above the merge button.', shot: { src: 'gitea-11-conflict.png', caption: 'B\'s pull request after A\'s was merged: "This pull request has changes conflicting with the target branch", the file that conflicts (app/main.py), and no merge button. Steps 3 to 5 fix it. Your names, team and numbers are your own.' } },
        ],
        check: 'B\'s pull request says "This pull request has changes conflicting with the target branch."',
      },
      2: { plain: 'Bring the new main into branch B, and Git stops to show the conflict.', check: 'Git said "CONFLICT (content): Merge conflict in app/main.py".' },
      3: { plain: 'Look at both versions of the line, keep one, and remove Git\'s markers.', check: 'The check prints "no markers left", and line 22 holds one GREETING line.' },
      4: {
        plain: 'Save the decision and upload it; B\'s pull request can then be merged.',
        do: [
          { text: 'In the workspace terminal, paste the box: it checks no marker is left, saves the merge as a commit and sends it to Gitea.', cmd: 'if grep -q "^<<<<<<<\\|^>>>>>>>" app/main.py; then echo "STOP: conflict markers are still in app/main.py. Go back to step 4."; else\ngit add -A\ngit commit -m "Resolve conflict with main"\ngit push\nfi' },
          'In what git push prints, find "Visit the existing pull request:" and the link under it. Hold Ctrl (on a Mac Cmd) and click it: B\'s pull request opens in Gitea.',
          'Reload the page if it was already open: the message above the merge button no longer says "This pull request has changes conflicting with the target branch". The checks start again (yellow dot).',
          'Approve as the reviewer: open a private window (Edge or Chrome: Ctrl+Shift+N, on a Mac Cmd+Shift+N; Firefox: Ctrl+Shift+P, on a Mac Cmd+Shift+P), go to https://gitea.<lab domain>, click Sign In and sign in as reviewer. Open B\'s pull request, click Files Changed, then Review (top right) → Approve. Close the private window.',
          'Back in your own window, reload the pull request. When it shows the approval and "All checks were successful", click the small arrow next to the merge button, choose Create squash commit, and confirm.',
          'A few minutes later, reload your dev tab (https://hello-teamNN-dev.<lab domain>/): the greeting you chose in step 4.',
        ],
        check: 'B\'s pull request is merged, and the dev page shows the greeting you kept.',
      },
    },
  },

  'Lab 5: write your one-page platform charter': {
    story: [
      'A platform is a product, and its customers are the teams who use it. Like any product, it needs to know who its users are, what they need, what it promises them, and how it will know whether it keeps those promises.',
      'A charter writes this on one page. It is the platform team\'s contract with its users: short enough to read in two minutes, precise enough to check.',
    ],
    end: 'A one-page charter in ~/charter/charter.md: users, three jobs, two promises with numbers, two measures, and three next steps.',
    steps: {
      0: { plain: 'Write down who would use a platform like this one.', check: 'Three to five roles under "Who uses it", each with half a line.' },
      1: { plain: 'Write the three jobs the platform must make easy, as the users would say them.', check: 'Three jobs, one line each.' },
      2: { plain: 'Write two promises, each with a number and a unit, that you could check.', check: 'Each promise has a number and a unit, for example "within 15 minutes".' },
      3: { plain: 'Write two numbers you would show the platform\'s owner every month, and where they come from.', check: 'Two measures, each with its source (Git, the pipeline, the dashboard, a survey).' },
      4: { plain: 'Write the three things you would add to the platform next.', check: 'Three items, most important first.' },
      5: { plain: 'Read your charter to your neighbour, and listen to theirs.', check: 'Your charter is saved, and you have read it out.' },
    },
  },
};
