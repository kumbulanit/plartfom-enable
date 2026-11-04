// Day 2 labs, step by step, for the handbook (see labs/day1.js for the format).
// The Gitea screens and messages quoted here were checked on Gitea 1.27.0.
'use strict';

const { TERMINAL, OPEN_LINK, PRIVATE_WINDOW } = require('./common');

module.exports = {
  'Lab 1: Git basics in a practice repository': {
    goal: 'Try every Git command of the day in a practice folder of your own, where nothing can go wrong, and then recognise the same things in your real repository, ~/hello.',
    learn: [
      'The four places a change lives (working folder, staging area, your repository, Gitea), and the command that moves it between them.',
      'How to read git status, a diff and the history.',
      'How to make a branch, merge it, and undo a change safely.',
    ],
    words: [
      ['Repository', 'A folder whose whole history Git keeps, in a hidden folder called .git.'],
      ['Working folder', 'The files as they are now, which you edit.'],
      ['Staging area', 'The changes you chose, with git add, to go into the next commit.'],
      ['Commit', 'A saved snapshot of the files, with your name, the time and a message that says why.'],
      ['Commit id', 'A unique fingerprint of a commit, such as 8dcb232. Yours are different from the ones on this page.'],
      ['Diff', 'The difference between two versions, line by line: - for a removed line, + for an added one.'],
      ['Branch', 'A name that points at the newest commit of a line of work. It moves forward when you commit.'],
      ['HEAD', 'Where you are: the branch (and commit) your files come from.'],
      ['Merge', 'Bring the commits of one branch into another.'],
      ['Revert', 'A new commit that undoes an earlier one, keeping both in the history.'],
    ],
    start: [
      ...TERMINAL,
      'This lab works in a new folder, ~/git-practice, which only you have: it is never pushed to Gitea. If you get lost at any point, run cd ~ && rm -rf ~/git-practice and start again at step 2.',
      'Run git status whenever you are unsure what happened: it always says which branch you are on and where each change is.',
    ],
    steps: [
      {
        title: 'Check that Git knows who you are',
        where: 'Workspace terminal',
        why: 'Git writes your name and e-mail address on every commit. You set them on Day 1; check them before you make your first commit today.',
        run: 'git --version\ngit config --global --list',
        explain: [
          ['git --version', 'show which version of Git is installed.'],
          ['git config --global --list', 'list your Git settings for every repository (--global): your name, your e-mail address and the password cache.'],
        ],
        see: 'The version, then your three settings:',
        out: 'git version 2.43.0\nuser.name=Thandi Nkosi\nuser.email=student01@<lab domain>\ncredential.helper=cache --timeout=36000',
        ifnot: [
          ['No user.name or user.email line', 'set them now, with your own name: git config --global user.name "Your Name", then git config --global user.email "$ME@$DOMAIN".'],
        ],
      },
      {
        title: 'Make a practice repository',
        where: 'Workspace terminal',
        why: 'git init turns an ordinary folder into a repository by adding the .git folder, where Git keeps the history. On Day 1, git clone did this for you and also filled in hello\'s history.',
        run: 'mkdir -p ~/git-practice && cd ~/git-practice\ngit init -b main\nls -a\ngit status',
        explain: [
          ['mkdir -p ~/git-practice && cd ~/git-practice', 'make a new folder and go into it.'],
          ['git init -b main', 'make it a repository, whose first branch is called main (-b: branch).'],
          ['ls -a', 'list everything, hidden files included (-a: all). Names that start with a dot are hidden.'],
          ['git status', 'ask Git what is going on.'],
        ],
        see: 'An empty repository: only the hidden .git folder, and no commits yet:',
        out: 'Initialized empty Git repository in /home/student01/git-practice/.git/\n.\n..\n.git\nOn branch main\n\nNo commits yet\n\nnothing to commit (create/copy files and use "git add" to track)',
        read: [
          '. is this folder and .. the one above it: every folder has both.',
          '.git is the repository\'s memory. Never edit or delete it by hand: Git commands do that.',
        ],
      },
      {
        title: 'Your first commit: from working folder to repository',
        where: 'Workspace terminal',
        why: 'A change goes through three places on your workspace: the working folder (you edit), the staging area (git add) and the repository (git commit). git status shows where it is at each moment.',
        run: 'echo "Hello from $TEAM" > greeting.txt\ngit status',
        explain: [
          ['echo "Hello from $TEAM" > greeting.txt', 'create the file greeting.txt with one line in it. $TEAM becomes your team, team01.'],
          ['git status', 'Git sees a new file it does not follow yet.'],
        ],
        see: 'The new file is untracked: Git sees it, but does not record it:',
        out: 'On branch main\n\nNo commits yet\n\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)\n\tgreeting.txt\n\nnothing added to commit but untracked files present (use "git add" to track)',
        then: {
          say: 'Now stage it, check again, and commit it:',
          run: 'git add greeting.txt\ngit status\ngit commit -m "Add the team greeting"\ngit log',
          explain: [
            ['git add greeting.txt', 'put the file in the staging area: it goes into the next commit.'],
            ['git status', 'the file is now under "Changes to be committed".'],
            ['git commit -m "Add the team greeting"', 'save the staged changes as a commit, with a message (-m) that says why.'],
            ['git log', 'show the history: every commit, newest first.'],
          ],
          see: 'Staged, then committed, then your first commit in the history:',
          out: 'On branch main\n\nNo commits yet\n\nChanges to be committed:\n  (use "git rm --cached <file>..." to unstage)\n\tnew file:   greeting.txt\n\n[main (root-commit) 8dcb232] Add the team greeting\n 1 file changed, 1 insertion(+)\n create mode 100644 greeting.txt\ncommit 8dcb2323e356112fde90624d1d774d5230894302 (HEAD -> main)\nAuthor: Thandi Nkosi <student01@<lab domain>>\nDate:   Tue Nov 3 11:21:05 2026 +0000\n\n    Add the team greeting',
          read: [
            'root-commit: the first commit of the repository; it has no commit before it.',
            '8dcb232 is the start of the commit id. Yours is different: it depends on your name, the time and the content.',
            '(HEAD -> main): you are on main, and main points at this commit.',
            'git log opens a viewer when the history is longer than the screen: press q to leave it.',
          ],
        },
      },
      {
        title: 'Change the file, and read the difference',
        where: 'Workspace terminal',
        why: 'Before you commit, look at what you changed. A diff is also what a reviewer reads in a pull request, so reading one here is practice for reviewing in Lab 3.',
        run: 'sed -i "s/Hello/Good morning/" greeting.txt\necho "Owner: $ME" >> greeting.txt\ngit diff',
        explain: [
          ['sed -i "s/Hello/Good morning/" greeting.txt', 'change Hello into Good morning, in the file itself (-i). s/old/new/ means substitute.'],
          ['echo "Owner: $ME" >> greeting.txt', 'add a line at the end (>> adds; > would replace the whole file).'],
          ['git diff', 'show the changes that are not staged yet, line by line.'],
        ],
        see: 'One line removed (-) and two added (+):',
        out: 'diff --git a/greeting.txt b/greeting.txt\nindex f42170f..ab65d5d 100644\n--- a/greeting.txt\n+++ b/greeting.txt\n@@ -1 +1,2 @@\n-Hello from team01\n+Good morning from team01\n+Owner: student01',
        read: [
          '--- a/ is the file before your change, +++ b/ the file after.',
          '@@ -1 +1,2 @@: line 1 before, lines 1 to 2 after.',
          'A changed line shows as one line removed and one added: Git compares whole lines.',
        ],
        then: {
          say: 'Stage and commit it, and look at the history:',
          run: 'git add -A\ngit commit -m "Say good morning and name the owner"\ngit log --oneline',
          explain: [
            ['git add -A', 'stage every change (-A: all).'],
            ['git commit -m "..."', 'commit it.'],
            ['git log --oneline', 'the history, one line per commit: the short id and the message.'],
          ],
          see: 'Two commits, newest at the top:',
          out: '[main 9267ee9] Say good morning and name the owner\n 1 file changed, 2 insertions(+), 1 deletion(-)\n9267ee9 (HEAD -> main) Say good morning and name the owner\n8dcb232 Add the team greeting',
        },
      },
      {
        title: 'Look inside a commit',
        where: 'Workspace terminal',
        why: 'Every commit keeps who, when, why and exactly what changed. This is the record an auditor reads, and anyone can read it again years later.',
        run: 'git show HEAD',
        explain: [
          ['git show HEAD', 'show one commit in full: here HEAD, the newest commit on the branch you are on. git show 8dcb232 would show the first one (with your own id).'],
        ],
        see: 'The commit\'s full id, author, date and message, then its diff:',
        out: 'commit 9267ee9d97b2ab97c1164331660fd6b6c182680e (HEAD -> main)\nAuthor: Thandi Nkosi <student01@<lab domain>>\nDate:   Tue Nov 3 11:21:05 2026 +0000\n\n    Say good morning and name the owner\n\ndiff --git a/greeting.txt b/greeting.txt\nindex f42170f..ab65d5d 100644\n--- a/greeting.txt\n+++ b/greeting.txt\n@@ -1 +1,2 @@\n-Hello from team01\n+Good morning from team01\n+Owner: student01',
        read: ['Gitea shows the same page when you click a commit on the Commits page of a repository.'],
      },
      {
        title: 'Make a mistake, and undo it',
        where: 'Workspace terminal',
        why: 'Before a commit, a change can be undone without leaving a trace. git restore takes a change out of the staging area, or throws it away entirely.',
        run: 'echo "A mistake" >> greeting.txt\ngit add greeting.txt\ngit status --short\ngit restore --staged greeting.txt\ngit status --short\ngit restore greeting.txt\ngit status --short\ncat greeting.txt',
        explain: [
          ['echo "A mistake" >> greeting.txt, git add greeting.txt', 'make a bad change and stage it.'],
          ['git status --short', 'a short status: one line per file. M in the first column: staged. M in the second: changed, not staged.'],
          ['git restore --staged greeting.txt', 'take the change out of the staging area. It stays in the file.'],
          ['git restore greeting.txt', 'throw the change away: the file goes back to the last commit. This cannot be undone.'],
          ['cat greeting.txt', 'show the file.'],
        ],
        see: 'Staged (M in the first column), then only changed (M in the second), then nothing, and the file as it was committed:',
        out: 'M  greeting.txt\n M greeting.txt\nGood morning from team01\nOwner: student01',
        read: [
          'The third git status --short prints nothing: there is nothing left to commit.',
          'After a commit has been pushed, you undo it differently: with git revert, in step 8.',
        ],
      },
      {
        title: 'Work on a branch',
        where: 'Workspace terminal',
        why: 'A branch lets you work without touching main. Every change you make this week starts on a branch; main only changes when a reviewed change is merged.',
        run: 'git switch -c add-farewell\necho "Goodbye from $TEAM" >> greeting.txt\ngit commit -am "Add a farewell"\ngit log --oneline --graph --all',
        explain: [
          ['git switch -c add-farewell', 'create (-c) a branch called add-farewell where you are, and switch to it.'],
          ['git commit -am "Add a farewell"', 'stage every changed file (-a) and commit it (-m), in one go. It works for files Git already follows, not for new ones.'],
          ['git log --oneline --graph --all', 'the history of every branch (--all), drawn as a line (--graph).'],
        ],
        see: 'The new commit, on add-farewell; main still points at the commit before:',
        out: 'Switched to a new branch \'add-farewell\'\n[add-farewell 9f22cfd] Add a farewell\n 1 file changed, 1 insertion(+)\n* 9f22cfd (HEAD -> add-farewell) Add a farewell\n* 9267ee9 (main) Say good morning and name the owner\n* 8dcb232 Add the team greeting',
        then: {
          say: 'Go back to main and look at the file:',
          run: 'git switch main\ncat greeting.txt\ngit branch',
          explain: [
            ['git switch main', 'move to main. Git changes your files to main\'s version.'],
            ['cat greeting.txt', 'show the file: no farewell on main.'],
            ['git branch', 'list your branches; * marks the one you are on.'],
          ],
          see: 'main\'s version of the file, and two branches:',
          out: 'Switched to branch \'main\'\nGood morning from team01\nOwner: student01\n  add-farewell\n* main',
          read: ['The farewell is not lost: it is on add-farewell. git switch add-farewell would bring it back into the file.'],
        },
      },
      {
        title: 'Merge the branch, then undo it with a revert',
        where: 'Workspace terminal',
        why: 'Merging brings a branch\'s work into main; in the team, Gitea does this for you after the review (Lab 3). A revert undoes a commit by adding a new one, so the history keeps both: that is how a change already shared is undone on this platform.',
        run: 'git merge add-farewell\ngit log --oneline --graph\ngit branch -d add-farewell',
        explain: [
          ['git merge add-farewell', 'bring the commits of add-farewell into the branch you are on, main.'],
          ['git log --oneline --graph', 'main\'s history now.'],
          ['git branch -d add-farewell', 'delete the branch (-d): its work is in main now.'],
        ],
        see: 'A fast-forward: main had not moved, so Git only moved main forward to the branch\'s commit:',
        out: 'Updating 9267ee9..9f22cfd\nFast-forward\n greeting.txt | 1 +\n 1 file changed, 1 insertion(+)\n* 9f22cfd (HEAD -> main, add-farewell) Add a farewell\n* 9267ee9 Say good morning and name the owner\n* 8dcb232 Add the team greeting\nDeleted branch add-farewell (was 9f22cfd).',
        then: {
          say: 'Now suppose the farewell was a mistake. Undo it, and keep the record:',
          run: 'git revert --no-edit HEAD\ngit log --oneline\ncat greeting.txt',
          explain: [
            ['git revert --no-edit HEAD', 'add a new commit that undoes the newest one (HEAD). --no-edit keeps the message Git suggests.'],
            ['git log --oneline, cat greeting.txt', 'the history and the file.'],
          ],
          see: 'Four commits: the farewell and its revert are both in the history, and the file is back as before:',
          out: '[main 8cb387a] Revert "Add a farewell"\n Date: Tue Nov 3 11:21:05 2026 +0000\n 1 file changed, 1 deletion(-)\n8cb387a (HEAD -> main) Revert "Add a farewell"\n9f22cfd Add a farewell\n9267ee9 Say good morning and name the owner\n8dcb232 Add the team greeting\nGood morning from team01\nOwner: student01',
          read: ['Nothing was deleted: anyone can see that the farewell was added, then taken out, by whom and when. On Day 6 a rollback in prod is exactly this, through a pull request.'],
        },
      },
      {
        title: 'The same things in your real repository',
        where: 'Workspace terminal, then Gitea',
        why: 'Your copy of hello is a repository like the practice one, with one difference: it was cloned from Gitea, so it knows a remote, origin, to push to and pull from.',
        run: 'cd ~/hello\ngit status\ngit remote -v\ngit log --oneline\ngit branch -a',
        explain: [
          ['cd ~/hello', 'go into your copy of hello, from Day 1.'],
          ['git status', 'where you are, and whether your copy is in step with Gitea.'],
          ['git remote -v', 'the remote this copy talks to: origin, the address you cloned from.'],
          ['git log --oneline', 'hello\'s history.'],
          ['git branch -a', 'every branch (-a: all), yours and the ones Git remembers from Gitea (remotes/origin/...).'],
        ],
        see: 'main, in step with Gitea; origin is Gitea; one commit so far:',
        out: 'On branch main\nYour branch is up to date with \'origin/main\'.\n\nnothing to commit, working tree clean\norigin\thttps://gitea.<lab domain>/team01/hello (fetch)\norigin\thttps://gitea.<lab domain>/team01/hello (push)\ne448d09 (HEAD -> main, origin/main, origin/HEAD) Initial commit\n* main\n  remotes/origin/HEAD -> origin/main\n  remotes/origin/main',
        read: [
          'Initial commit was made by the platform when it created hello from its template. Your id is different.',
          'origin/main is your copy\'s memory of Gitea\'s main. It only changes when you talk to Gitea (git pull or git fetch).',
          'In Gitea, open team01/hello and click Commits (above the file list): the same commit, with the same id. Click it: the same page as git show.',
        ],
        ifnot: [
          ['cd: no such file or directory', 'you have no copy yet: do step 1 of Day 1 Lab 3 first.'],
          ['Changes not staged, or untracked files', 'something changed in ~/hello since Day 1. git restore . puts the files back as they were committed (you lose those changes, which is what you want here).'],
        ],
      },
    ],
    done: 'Your practice repository has four commits, you have merged and reverted a change, and you have seen the same history in ~/hello and in Gitea.',
  },

  'Lab 2: your first change, on a branch': {
    goal: 'Change the greeting of your team\'s service on a branch of your own, check it, save it as a commit and send it to Gitea.',
    learn: [
      'The everyday Git loop: get the latest version, make a branch, change, check, commit, push.',
      'Why every change starts on a branch of its own.',
      'What a commit is, and how to write a useful commit message.',
    ],
    words: [
      ['main', 'The main line of the code: what gets deployed. Nobody changes it directly.'],
      ['Branch', 'Your own copy of the line, where your change cannot disturb anyone until it is reviewed.'],
      ['Commit', 'A saved change, with your name, the time and a message that says why. Git keeps every commit for ever.'],
      ['Push', 'Send your commits from your workspace to Gitea, so others can see them.'],
      ['Pull', 'Fetch the commits others pushed, into your copy.'],
    ],
    start: [
      ...TERMINAL,
      'The Git in this lab is what you practised in Lab 1: git switch, git status, git diff, git add and git commit, and then git push to send your branch to Gitea for the first time.',
      'Your copy of hello from Day 1, in ~/hello. If you do not have it, do step 1 of Day 1 Lab 3 first.',
      'The file list on the left of the workspace (the Explorer, the two-pages icon at the top of the left bar) shows your home folder. If it says "You have not yet opened a folder": click Open Folder, type /home/ followed by your user name (for example /home/student01), and click OK.',
    ],
    steps: [
      {
        title: 'Go to main and get the latest version',
        where: 'Workspace terminal',
        why: 'Always start from the newest main. Changes may have been merged into it since yesterday; starting from an old copy causes conflicts later.',
        run: 'cd ~/hello\ngit switch main\ngit pull',
        explain: [
          ['cd ~/hello', 'go into your copy of the service.'],
          ['git switch main', 'switch to the main line.'],
          ['git pull', 'fetch what others merged into main on Gitea, and add it to your copy.'],
        ],
        see: 'Either "Already up to date." or a short list of the files that changed:',
        out: 'Already on \'main\'\nYour branch is up to date with \'origin/main\'.\nAlready up to date.',
        ifnot: [
          ['Password prompt', 'type your student01 password, from cat /etc/pelab/logins.md (nothing appears while you type).'],
          ['cd: no such file or directory', 'you have no copy yet: do step 1 of Day 1 Lab 3, then come back.'],
        ],
      },
      {
        title: 'Make your own branch',
        where: 'Workspace terminal',
        why: 'A branch is your own copy of the line: you can change anything there without disturbing anyone. Putting your user name in the branch name makes it unique, so it never clashes with anyone else\'s.',
        run: 'git switch -c greeting-$ME',
        explain: [
          ['git switch -c greeting-$ME', 'create (-c) a new branch called greeting- followed by your user name, and switch to it. $ME is filled in for you.'],
        ],
        see: 'Git confirms the new branch:',
        out: 'Switched to a new branch \'greeting-student01\'',
        read: [
          'From now on, every commit goes onto your branch, not onto main. git branch lists your branches; the one with * is the one you are on.',
        ],
      },
      {
        title: 'Change the greeting',
        where: 'Workspace editor',
        why: 'A small, visible change is the best way to follow a change all the way to dev: you will see your own text answer on the dev address.',
        do: [
          'In the Explorer on the left, click hello, then app, then main.py. The file opens in the editor.',
          'Find line 22, which starts with GREETING. The line numbers are on the left of the editor.',
          'Change only the text in the second pair of quotes, for example to Hello from team01. Keep the quotes.',
          'Save with Ctrl+S (on a Mac Cmd+S). The dot next to the file name at the top disappears when it is saved.',
          { text: 'Editor not working for you? Instead of the four instructions above, paste this in the terminal: it makes the same change (a greeting with your team and your name) and shows the new line.', cmd: 'sed -i "s/^GREETING = .*/GREETING = os.environ.get(\\"GREETING\\", \\"Hello from $TEAM, by $ME\\")/" app/main.py\ngrep -n "^GREETING" app/main.py' },
          { text: 'Back in the terminal, run this to see that Git noticed:', cmd: 'git status' },
        ],
        change: {
          file: 'app/main.py',
          how: 'line 22, only the text in the second pair of quotes.',
          before: 'GREETING = os.environ.get("GREETING", "Hello from the PE Lab golden path")',
          after: 'GREETING = os.environ.get("GREETING", "Hello from team01")',
        },
        run: 'git status',
        explain: [
          ['git status', 'show which files changed since the last commit.'],
        ],
        see: 'One modified file, in red:',
        out: 'On branch greeting-student01\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n  (use "git restore <file>..." to discard changes in working directory)\n\tmodified:   app/main.py',
        ifnot: [
          ['nothing to commit, working tree clean', 'the file was not saved. Click in the editor and press Ctrl+S (Mac Cmd+S), then run git status again.'],
        ],
      },
      {
        title: 'Check it works before you share it',
        where: 'Two workspace terminals',
        why: 'Check your own change before you ask anyone to review it: it saves everyone time, and it is what the pipeline will do again anyway.',
        do: [
          'In the first terminal, start the service with the command below. It keeps running.',
          { text: 'Open a second terminal (the + at the top right of the terminal panel) and run:', cmd: 'curl -s localhost:8081/' },
          'Check that "message" shows your new text.',
          'Go back to the first terminal and press Ctrl+C to stop the service.',
        ],
        run: 'python3 -m app.main',
        explain: [
          ['python3 -m app.main', 'run the service from your changed code, as on Day 1.'],
        ],
        see: 'In the second terminal, your text in "message":',
        out: '{"app": "hello", "version": "dev", "environment": "local", "message": "Hello from team01"}',
        ifnot: [
          ['SyntaxError when it starts', 'a quote went missing in the GREETING line. Fix the line so it looks like the After box in step 3, save, and start again.'],
          ['Address already in use', 'a copy from Day 1 is still running: pkill -f "python3 -m app.main", then start again.'],
        ],
      },
      {
        title: 'Save the change as a commit',
        where: 'Workspace terminal (the first one, after Ctrl+C)',
        why: 'A commit saves the change in Git, with your name, the time and a message. Anyone can later see who changed what, when and why: that is the record an auditor reads.',
        run: 'git add -A\ngit commit -m "Change the greeting for $TEAM"',
        explain: [
          ['git add -A', 'put every changed file (-A: all) into the next commit. Git calls this staging.'],
          ['git commit -m "Change the greeting for $TEAM"', 'save the commit, with a message (-m). A good message finishes the sentence "This change will..."'],
        ],
        see: 'One line with your branch and the commit\'s short id, then a count of what changed:',
        out: '[greeting-student01 6514a43] Change the greeting for team01\n 1 file changed, 1 insertion(+), 1 deletion(-)',
        read: [
          '6514a43 is the start of the commit\'s id, a unique fingerprint. Yours is different.',
          '1 insertion, 1 deletion: Git sees a changed line as one line removed and one added.',
        ],
        ifnot: [
          ['Author identity unknown', 'Git does not know your name yet: run the two git config lines from Day 1 Lab 3, step 1, then commit again.'],
        ],
      },
      {
        title: 'Send your branch to Gitea',
        where: 'Workspace terminal',
        why: 'Until you push, the change exists only in your workspace. Pushing puts your branch in Gitea, where a reviewer can see it and review it.',
        run: 'git push -u origin greeting-$ME',
        explain: [
          ['git push -u origin greeting-$ME', 'send your branch to Gitea (origin is Git\'s name for where you cloned from). -u links your branch to Gitea\'s, so next time just git push is enough.'],
        ],
        see: 'Gitea answers with a link to open a pull request:',
        out: 'remote:\nremote: Create a new pull request for \'greeting-student01\':\nremote:   https://gitea.<lab domain>/team01/hello/pulls/new/greeting-student01\nremote:\nTo https://gitea.<lab domain>/team01/hello\n * [new branch]      greeting-student01 -> greeting-student01\nbranch \'greeting-student01\' set up to track \'origin/greeting-student01\'.',
        read: [
          'Keep this terminal open: in Lab 3 you open that link. ' + OPEN_LINK,
          'Check in Gitea: open team01/hello and click Branches (above the file list). Your branch is in the list.',
        ],
        ifnot: [
          ['rejected (non-fast-forward)', 'someone pushed to a branch with the same name first, which should not happen with $ME in the name. Run git pull --rebase, then git push again.'],
        ],
      },
    ],
    done: 'Your branch is in Gitea (team01/hello → Branches shows greeting-student01).',
  },

  'Lab 3: review, approve, merge, and watch it go live': {
    goal: 'Turn your change into a reviewed decision: a pull request, a review and approval by a second person, a merge, and the change running in dev by itself.',
    learn: [
      'How to propose a change with a pull request, and how to review one.',
      'Why main needs an approval and a green pipeline before anything is merged.',
      'GitOps: how a merge into main deploys to dev without anyone touching a server.',
    ],
    words: [
      ['Pull request', 'A request to merge your branch into main, with a page where others read the change, comment and approve.'],
      ['Review', 'Reading the change and either approving it, or asking for changes.'],
      ['Pipeline', 'The automatic checks (lint, tests, scans, build) that run on every change. Its result shows on the pull request.'],
      ['Merge', 'Putting the approved change into main. From then on the platform treats it as the truth.'],
      ['Squash', 'A way of merging that turns all the commits of a branch into one tidy commit on main.'],
      ['Argo CD', 'The tool that watches main and makes the cluster run what main says, in dev by itself.'],
    ],
    start: [
      'Lab 2 done: your branch is pushed.',
      'The Git in this lab: after the merge, git switch main and git pull bring Gitea\'s new main into your copy, and git log shows it (Lab 1, steps 4 and 9).',
      'You play two people: the author, in your normal browser window, and the reviewer, in a private window. The reviewer\'s login is in your logins file (cat /etc/pelab/logins.md).',
      'Gitea is open in your browser and you are signed in as yourself: https://gitea.<lab domain> → Sign In, with your student01 and password.',
    ],
    steps: [
      {
        title: 'Open the pull request',
        where: 'Browser: Gitea',
        why: 'A pull request turns your change into a proposal that others can read, discuss and approve. Nothing reaches main without one.',
        do: [
          'In the terminal from Lab 2, find the line remote:   https://gitea.<lab domain>/team01/hello/pulls/new/greeting-student01. ' + OPEN_LINK,
          'Gitea shows your change and a form under it. The title is already your commit message ("Change the greeting for team01"): keep it or make it clearer. It should say what changes.',
          'In the box under the title, write two lines on why: for example "Shows our team\'s name on the dev page, so we can see our own release."',
          'Click Create Pull Request.',
        ],
        see: 'The pull request page, with your title and description. At the bottom, the checks: a yellow dot while the pipeline checks your change, then a green tick.',
        read: [
          'Conversation (the tab you are on) holds the description, the comments and the checks. Commits lists your commits. Files Changed shows the change line by line.',
          'Under the checks Gitea says what still stands between the change and main, for example that it needs an approval.',
        ],
        ifnot: [
          ['The link does not open', 'in Gitea open team01/hello → Pull Requests → New Pull Request; on the right (pull from) choose your branch greeting-student01, then fill in the form as above.'],
          ['"These branches are equal"', 'your commit was not pushed. Go back to Lab 2, step 6.'],
        ],
      },
      {
        title: 'The reviewer reads the change and comments',
        where: 'Browser: Gitea, a private window, as reviewer',
        why: 'A review is a second pair of eyes. Small changes make reviews quick: one line takes a minute to read.',
        do: [
          PRIVATE_WINDOW + ' Sign in as reviewer.',
          'As the reviewer, open your pull request (team01/hello → Pull Requests → yours) and click the Files Changed tab.',
          'The old line is shown in red with -, the new line in green with +.',
          'Move the mouse over the green line: a blue + appears at its left. Click it, write a short comment (a question or a suggestion) and click Add single comment.',
        ],
        see: 'A comment attached to a line of your change, by reviewer. In your normal window you see it too, in the Conversation tab.',
        read: [
          'A good comment is about the change, not the person: "Should this say team01 or Team 01?" rather than "This is wrong".',
          'You, the author, can answer under the comment, and change the code if the comment is right.',
        ],
      },
      {
        title: 'The reviewer approves',
        where: 'Browser: Gitea, the private window, as reviewer',
        why: 'main only accepts a change that someone other than its author has approved, and whose pipeline is green. That is segregation of duties, enforced by the tool.',
        do: [
          'Still in the private window, in Files Changed, click Review (the blue button, top right). A box called Submit review opens.',
          'Write a short note ("Looks good"), then click Approve. Then close the private window: you are the author again.',
          'Now wait for the pipeline: on the Conversation tab, the yellow dot next to the checks turns into a green tick, in a few minutes.',
        ],
        see: '"All checks were successful", one green approval, and a plain merge button.',
        read: [
          'Until both are there, the box above the merge button says what is missing: "Some checks are pending" (the pipeline is still running), or "This pull request doesn\'t have enough required approvals yet. 0 of 1 official approvals granted."',
          'While something is missing, the merge button reads "... (When checks succeed)": it would only queue the merge, not do it.',
          'A red pipeline says "Some required checks failed". Then nothing merges until the branch is fixed and pushed again (Day 5 shows how to read the failure).',
        ],
        tip: 'The approval counts because reviewer is another account. At work the reviewer is a real colleague; here you play them.',
      },
      {
        title: 'Merge it, and update your copy',
        where: 'Browser: Gitea, then the workspace terminal',
        why: 'Merging is the decision to put the change on the main line. Your own copy of main then needs the new commit too.',
        do: [
          'On the Conversation tab, click the small arrow to the right of the merge button and choose Create squash commit.',
          'Click the merge button, which now reads Create squash commit. A small form opens: the title of the commit (your pull request\'s title with its number, for example (#1)) and a message that already says who reviewed it (Reviewed-by: ...).',
          'Tick Delete Branch "greeting-student01" (your branch has done its job) and click Create squash commit.',
          'In the workspace terminal, paste the box to bring main up to date.',
        ],
        run: 'cd ~/hello\ngit switch main\ngit pull\ngit log --oneline -3',
        explain: [
          ['cd ~/hello', 'go into your copy of hello (a new terminal starts in your home folder, where git cannot find it).'],
          ['git switch main', 'go back to main.'],
          ['git pull', 'fetch the merge from Gitea.'],
          ['git log --oneline -3', 'show the last three commits, one line each.'],
        ],
        see: 'Your change at the top of the history, as one commit:',
        out: 'b70e47f (HEAD -> main, origin/main, origin/HEAD) Change the greeting for team01 (#1)\ne448d09 Initial commit',
        read: [
          'The (#1) is the number of your pull request: anyone can open it later to see the review and the approval. The commit message also records who reviewed it (git log -1 shows the Reviewed-by line).',
        ],
      },
      {
        title: 'Watch it go live',
        where: 'Browser: Gitea, then Argo CD',
        why: 'This is GitOps: the platform runs what main says. Nobody logs in to a server; the merge is the instruction.',
        do: [
          'In Gitea, open team01/hello → Actions. The newest run (your merge, on main) builds the image and pushes it to Harbor. Wait for its green tick, a few minutes.',
          'Open https://argocd.<lab domain> in a new tab and sign in as delegate, with its password from cat /etc/pelab/logins.md (a read-only login; not your student01 password).',
          { text: 'In the search box at the top, type team01. Your service has one box per environment: dev, staging and prod. Click the application team01-hello-dev.', shot: { src: 'argocd-apps.png', caption: 'Argo CD\'s application list, searched for the team: one box per environment of hello (dev, prod, staging), each with its health (Healthy) and sync state (Synced: it runs what Git says). On Day 2 only dev runs; staging and prod come on Day 3 and are released on Day 6. In your lab the repository is https://gitea.<lab domain>/team01/hello.git, and the names, ids and times are your own.' } },
        ],
        see: 'Within a few minutes of the green pipeline: Synced and Healthy, with your commit id under Last Sync.',
        read: [
          'Synced: the cluster runs what main says. Healthy: it answers its health check.',
          'Argo CD checks main every minute, and the pipeline takes a few minutes before that: a short wait is normal.',
          'The pipeline is not something you wrote: it is the file .gitea/workflows/ci.yaml in team01/hello, copied from the platform team\'s template, platform/golden-path. Open it in Gitea to see every step. On Day 4 you look inside the template itself.',
        ],
        tip: 'If your instructor has switched on the safety net, Argo CD is paused. Look at your merge commit in Gitea instead (Commits → the tick next to it): safety-net/dev says "Deployed to team01-dev" with your commit.',
      },
      {
        title: 'See your change in dev',
        why: 'The proof: your text, answering from dev, put there by the platform.',
        browser: {
          where: 'Browser',
          do: ['Open https://hello-team01-dev.<lab domain>/ in a new tab.'],
          see: 'DEV in big red letters, your new greeting under it, and the version: the commit id of your merge.',
          shot: { src: 'hello-dev.png', caption: 'hello in dev: the environment\'s name in big letters (red for dev), then the greeting and the version (the commit id the platform built). Your greeting and version are your own.' },
        },
        where: 'Workspace terminal',
        run: 'curl -s https://hello-$TEAM-dev.$DOMAIN/',
        explain: [
          ['curl -s https://hello-$TEAM-dev.$DOMAIN/', 'call your team\'s service in dev, at its dev address. A program (like curl) gets the facts as data (JSON); a browser gets the coloured page.'],
        ],
        see: '"environment": "dev" and your new greeting:',
        out: '{"app": "hello", "version": "b70e47f...", "environment": "dev", "message": "Hello from team01"}',
        read: [
          'version is now the commit id of your merge: the platform built that exact commit.',
          'Nobody logged in to a server: the merge did it.',
        ],
        ifnot: [
          ['The old greeting', 'the pipeline or Argo CD has not finished. Check the Actions run (green?) and Argo CD (your commit?), wait a minute, try again.'],
        ],
      },
    ],
    done: 'Your greeting answers on https://hello-team01-dev.<lab domain>/ and the pull request shows who approved it.',
  },

  'Lab 4: try to break the rules': {
    goal: 'Try the three shortcuts the platform refuses, and keep the refusal messages as evidence that the controls work.',
    learn: [
      'Which shortcuts the platform blocks: pushing straight to main, approving your own change, and changing a change after it was approved.',
      'That a refusal is a success here: it proves the control works.',
    ],
    words: [
      ['Protected branch', 'A branch, here main, that only takes changes through an approved pull request.'],
      ['Stale approval', 'An approval given before the change changed again. It no longer counts.'],
      ['Evidence', 'Proof, written down, that a control works. It goes into your Day 6 evidence pack.'],
    ],
    start: [
      ...TERMINAL,
      'The Git in this lab: git push (refused on main), git reset --hard origin/main to undo a local commit (the "Undo safely" slide), and git commit -am (Lab 1, step 7).',
      'Have a notes file or a sheet ready: you will copy three messages.',
    ],
    steps: [
      {
        title: 'Push straight to main',
        where: 'Workspace terminal',
        why: 'This is the shortcut a hurried person takes: change main directly, with no review. The platform must refuse it.',
        run: 'cd ~/hello\ngit switch main && git pull\necho "Direct edit" >> README.md\ngit add -A\ngit commit -m "Direct edit"\ngit push',
        explain: [
          ['git switch main && git pull', 'go to main and make sure it is up to date.'],
          ['echo "Direct edit" >> README.md', 'add a line at the end of README.md (>> adds to the end; > would replace the whole file).'],
          ['git add -A, git commit -m "Direct edit"', 'commit the change, on main itself.'],
          ['git push', 'try to send main to Gitea.'],
        ],
        see: 'Refused. Copy the message into your notes:',
        out: 'remote:\nremote: error:\nremote: error: Not allowed to push to protected branch main\nremote: error:\nTo https://gitea.<lab domain>/team01/hello\n ! [remote rejected] main -> main (pre-receive hook declined)\nerror: failed to push some refs to \'https://gitea.<lab domain>/team01/hello\'',
      },
      {
        title: 'Undo it',
        where: 'Workspace terminal',
        why: 'Your main now has a commit Gitea will never accept. Put your copy back to exactly what Gitea has.',
        run: 'git reset --hard origin/main\ngit status',
        explain: [
          ['git reset --hard origin/main', 'make your main exactly like Gitea\'s main (origin/main), throwing away the local commit. --hard also resets the files.'],
          ['git status', 'check.'],
        ],
        see: 'Back in step with Gitea:',
        out: 'HEAD is now at b70e47f Change the greeting for team01 (#1)\nOn branch main\nYour branch is up to date with \'origin/main\'.\n\nnothing to commit, working tree clean',
      },
      {
        title: 'Approve your own pull request',
        where: 'Workspace terminal, then Gitea',
        why: 'The author of a change must never be the one who approves it. Here you check that the tool enforces it.',
        do: [
          'Paste the box: it makes a small change on a new branch and pushes it.',
          'Open the pulls/new link it prints and click Create Pull Request.',
          'Open Files Changed, click Review, and try to click Approve.',
        ],
        run: 'git switch -c self-approve-$ME\necho "Self review" >> README.md\ngit commit -am "Try to approve my own change"\ngit push -u origin self-approve-$ME',
        explain: [
          ['git switch -c self-approve-$ME', 'a new branch for this test.'],
          ['git commit -am "..."', 'commit every changed file in one go (-a: all changed files, -m: the message).'],
          ['git push -u origin self-approve-$ME', 'send it to Gitea.'],
        ],
        out: 'Switched to a new branch \'self-approve-student01\'\n[self-approve-student01 ba23b3f] Try to approve my own change\n 1 file changed, 1 insertion(+)\nremote:\nremote: Create a new pull request for \'self-approve-student01\':\nremote:   https://gitea.<lab domain>/team01/hello/pulls/new/self-approve-student01\nremote:\nTo https://gitea.<lab domain>/team01/hello\n * [new branch]      self-approve-student01 -> self-approve-student01\nbranch \'self-approve-student01\' set up to track \'origin/self-approve-student01\'.',
        see: 'In the terminal, the commit and the pulls/new link (above). Then in Gitea, in the Submit review box, Approve and Request changes are greyed out. Hover over Approve: "Pull request authors can\'t approve their own pull request". Copy that into your notes.',
        tip: 'Signing in as reviewer gets an approval through: the tool checks accounts, not people. That is why at work every account is personal and never shared. In this lab you use a second login only to play the reviewer.',
      },
      {
        title: 'Change it after the reviewer approved',
        where: 'Gitea, then the workspace terminal',
        why: 'An approval is for what the reviewer read. If the change changes afterwards, the old approval must not count.',
        do: [
          'Approve your self-approve pull request as reviewer, in a private window, as in Lab 3. The page now shows one approval.',
          'Paste the box: it adds one more commit to the same branch.',
          'Reload the pull request page.',
        ],
        run: 'echo "One more line" >> README.md\ngit commit -am "Change after approval"\ngit push',
        explain: [
          ['echo "One more line" >> README.md', 'change the file again.'],
          ['git commit -am "...", git push', 'commit and push to the same branch: the pull request updates itself. git push now prints "Visit the existing pull request" with its link, instead of a new one.'],
        ],
        out: '[self-approve-student01 6987239] Change after approval\n 1 file changed, 1 insertion(+)\nremote:\nremote: Visit the existing pull request:\nremote:   https://gitea.<lab domain>/team01/hello/pulls/2\nremote:\nTo https://gitea.<lab domain>/team01/hello\n   ba23b3f..6987239  self-approve-student01 -> self-approve-student01',
        see: 'In the terminal, the push to the existing pull request (above). Then in Gitea, after the reload: "New commits pushed, approval review dismissed automatically according to repository settings", and the merge box says "This pull request doesn\'t have enough required approvals yet. 0 of 1 official approvals granted." Copy both into your notes.',
        tip: 'Close this pull request without merging when you are done (Close Pull Request at the bottom of the Conversation tab), and delete the branch.',
      },
      {
        title: 'Write down the three messages',
        where: 'Workspace terminal',
        why: 'Words on a slide are a claim; a refusal you saw yourself is evidence. These three lines go into the Day 6 evidence pack.',
        do: [
          'Paste the box: it writes the three refusals you saw into a file, ~/evidence/day2-refusals.md, with your user name and today\'s date, shows it, and goes back to main.',
          'Compare the file with what you saw on the screen. If a message was different, open the file in the editor (Explorer → evidence) and correct it.',
        ],
        run: 'mkdir -p ~/evidence\ncat > ~/evidence/day2-refusals.md <<EOF\n# Day 2: three refusals, seen by $ME on $(date +%F)\n1. Push straight to main: "Not allowed to push to protected branch main"\n2. Approve my own pull request: "Pull request authors can\'t approve their own pull request"\n3. Change after approval: "approval review dismissed automatically according to repository settings"\nEOF\ncat ~/evidence/day2-refusals.md\ncd ~/hello && git switch main',
        explain: [
          ['mkdir -p ~/evidence', 'a folder for everything you collect for the Day 6 evidence pack.'],
          ['cat > ~/evidence/day2-refusals.md <<EOF ... EOF', 'write the lines between the two EOF markers into the file. $ME becomes your user name and $(date +%F) today\'s date.'],
          ['cat ~/evidence/day2-refusals.md', 'show the file.'],
          ['cd ~/hello && git switch main', 'go back to main, ready for the next lab.'],
        ],
        see: 'The file, with your name and today\'s date, then Git back on main:',
        out: '# Day 2: three refusals, seen by student01 on 2026-10-29\n1. Push straight to main: "Not allowed to push to protected branch main"\n2. Approve my own pull request: "Pull request authors can\'t approve their own pull request"\n3. Change after approval: "approval review dismissed automatically according to repository settings"\nSwitched to branch \'main\'\nYour branch is up to date with \'origin/main\'.',
        read: ['Three lines of proof that segregation of duties is enforced by the tool, not by trust.'],
      },
    ],
    done: 'Three refusals written down, and main unchanged.',
  },

  'Lab 5: resolve a merge conflict': {
    goal: 'See what happens when two changes touch the same line, and resolve it calmly.',
    learn: [
      'Why conflicts happen: two changes to the same line, and Git cannot know which one you want.',
      'How to read the conflict markers and choose what to keep.',
      'That a conflict is normal and safe: nothing is lost.',
    ],
    words: [
      ['Merge conflict', 'Git cannot combine two changes by itself because they touch the same lines. A person decides.'],
      ['Conflict markers', 'The lines <<<<<<<, ======= and >>>>>>> that Git writes into the file around the two versions.'],
    ],
    start: [
      'At work, a conflict happens when two colleagues change the same line. Here you play both: you make two branches, A and B, from the same main, and change the same line differently on each.',
      'hello is on main and up to date (cd ~/hello && git switch main && git pull).',
      'The Git in this lab: git merge (Lab 1, step 8), the conflict markers (the slide "How Git joins two branches"), and git merge --abort if you get lost.',
      'The reviewer approves in a private window, as in Lab 3 (logins: cat /etc/pelab/logins.md).',
    ],
    steps: [
      {
        title: 'Change the same line on two branches',
        where: 'Workspace terminal, then Gitea',
        why: 'To make a conflict on purpose, two branches change the same line, differently: as two colleagues would without knowing about each other.',
        do: [
          'Paste the first box: from main, it makes branch A, changes line 22 (GREETING) to "Hello from branch A", commits and pushes.',
          'Paste the second box: from the same main, it makes branch B, changes the same line to "Hello from branch B", commits and pushes.',
          'Open both pulls/new links the boxes print, and click Create Pull Request on each.',
        ],
        run: 'cd ~/hello\ngit switch main && git pull\ngit switch -c conflict-a-$ME\nsed -i "s/^GREETING = .*/GREETING = os.environ.get(\\"GREETING\\", \\"Hello from branch A\\")/" app/main.py\ngrep -n "^GREETING" app/main.py\ngit commit -am "Greeting from branch A"\ngit push -u origin conflict-a-$ME',
        explain: [
          ['git switch main && git pull', 'start from the newest main.'],
          ['git switch -c conflict-a-$ME', 'a new branch, A, with your name in it.'],
          ['sed -i "s/^GREETING = .*/.../" app/main.py', 'replace the whole GREETING line with one that says Hello from branch A. sed changes a file without opening it; -i means "in the file itself".'],
          ['grep -n "^GREETING" app/main.py', 'show the new line and its number (22).'],
          ['git commit -am "...", git push -u origin conflict-a-$ME', 'commit the changed file and send branch A to Gitea.'],
        ],
        see: 'main up to date, branch A, its new line 22, the commit and the pulls/new link:',
        out: 'Already on \'main\'\nYour branch is up to date with \'origin/main\'.\nAlready up to date.\nSwitched to a new branch \'conflict-a-student01\'\n22:GREETING = os.environ.get("GREETING", "Hello from branch A")\n[conflict-a-student01 a348b70] Greeting from branch A\n 1 file changed, 1 insertion(+), 1 deletion(-)\nremote:\nremote: Create a new pull request for \'conflict-a-student01\':\nremote:   https://gitea.<lab domain>/team01/hello/pulls/new/conflict-a-student01\nremote:\nTo https://gitea.<lab domain>/team01/hello\n * [new branch]      conflict-a-student01 -> conflict-a-student01\nbranch \'conflict-a-student01\' set up to track \'origin/conflict-a-student01\'.',
        then: {
          say: 'Then branch B, from the same main:',
          run: 'git switch main\ngit switch -c conflict-b-$ME\nsed -i "s/^GREETING = .*/GREETING = os.environ.get(\\"GREETING\\", \\"Hello from branch B\\")/" app/main.py\ngrep -n "^GREETING" app/main.py\ngit commit -am "Greeting from branch B"\ngit push -u origin conflict-b-$ME',
          explain: [
            ['git switch main', 'back to main, which does not have A\'s change: A is only on its branch.'],
            ['git switch -c conflict-b-$ME', 'a second branch, B, from the same main.'],
            ['sed ..., grep ..., git commit ..., git push ...', 'the same as for A, with Hello from branch B.'],
          ],
          see: 'Branch B, its line 22, the commit and its pulls/new link:',
          out: 'Switched to branch \'main\'\nYour branch is up to date with \'origin/main\'.\nSwitched to a new branch \'conflict-b-student01\'\n22:GREETING = os.environ.get("GREETING", "Hello from branch B")\n[conflict-b-student01 b6f652b] Greeting from branch B\n 1 file changed, 1 insertion(+), 1 deletion(-)\nremote:\nremote: Create a new pull request for \'conflict-b-student01\':\nremote:   https://gitea.<lab domain>/team01/hello/pulls/new/conflict-b-student01\nremote:\nTo https://gitea.<lab domain>/team01/hello\n * [new branch]      conflict-b-student01 -> conflict-b-student01\nbranch \'conflict-b-student01\' set up to track \'origin/conflict-b-student01\'.',
          read: ['When you have opened both pull requests: team01/hello → Pull Requests shows two, both changing line 22.'],
        },
      },
      {
        title: 'Merge A first',
        where: 'Browser: Gitea (the reviewer in a private window, then you)',
        why: 'Once A\'s change is in main, B no longer fits: B was made from the old main.',
        do: [
          'In a private window, as reviewer, open A\'s pull request (conflict-a-student01): Files Changed → Review → Approve. Close the private window.',
          'When the checks are green, merge A as yourself (as in Lab 3, step 4).',
          'Open B\'s pull request (conflict-b-student01) and read the box above the merge button.',
        ],
        see: 'B\'s pull request now says "This pull request has changes conflicting with the target branch." and cannot be merged.',
      },
      {
        title: 'Bring main into branch B',
        where: 'Workspace terminal',
        why: 'You take the new main into branch B, in your workspace, to see the conflict and decide.',
        run: 'git switch main\ngit pull\ngit switch conflict-b-$ME\ngit merge main',
        explain: [
          ['git switch main, git pull', 'get the new main, with A\'s change.'],
          ['git switch conflict-b-$ME', 'back to branch B.'],
          ['git merge main', 'try to combine main into branch B.'],
        ],
        see: 'Git stops and names the file:',
        out: 'Auto-merging app/main.py\nCONFLICT (content): Merge conflict in app/main.py\nAutomatic merge failed; fix conflicts and then commit the result.',
        read: [
          'Nothing is lost: both versions are in the file, waiting for you to choose. git status shows "both modified: app/main.py".',
        ],
      },
      {
        title: 'Choose the line to keep',
        where: 'Workspace editor',
        why: 'Only a person knows which greeting is right, or whether to write a new one.',
        do: [
          'Open app/main.py in the editor (Explorer → hello → app → main.py). Around line 22 Git has put both versions between markers (the editor colours them, and offers buttons such as Accept Current Change and Accept Incoming Change above them).',
          'Decide which greeting to keep, or write a new one.',
          'Delete the other version and all three marker lines, so that one GREETING line is left. Save with Ctrl+S (Mac Cmd+S).',
          { text: 'Editor not working for you? Instead of the three instructions above, paste this: it keeps main\'s version (A\'s greeting), removes B\'s and the markers, and shows the line that is left.', cmd: "sed -i '/^<<<<<<< /,/^=======/d; /^>>>>>>> /d' app/main.py\ngrep -n \"^GREETING\" app/main.py" },
          'Check with the command below that no marker is left.',
        ],
        change: {
          file: 'app/main.py',
          how: 'keep one GREETING line and delete the rest, markers included.',
          before: '<<<<<<< HEAD\nGREETING = os.environ.get("GREETING", "Hello from branch B")\n=======\nGREETING = os.environ.get("GREETING", "Hello from branch A")\n>>>>>>> main',
          after: 'GREETING = os.environ.get("GREETING", "Hello from branch A and branch B")',
        },
        run: 'grep -n "<<<<<<<\\|=======\\|>>>>>>>" app/main.py || echo "no markers left"',
        explain: [
          ['grep -n "<<<<<<<\\|=======\\|>>>>>>>" app/main.py', 'search the file for any of the three markers and show their line numbers (-n). \\| means "or".'],
          ['|| echo "no markers left"', 'if grep finds nothing, print "no markers left" instead.'],
        ],
        see: '"no markers left", and one GREETING line in the file.',
        read: [
          'Between <<<<<<< HEAD and ======= is the version on the branch you are on (B); between ======= and >>>>>>> main is main\'s (A, merged in step 2).',
        ],
        ifnot: [
          ['grep prints a line number', 'a marker is still there. Delete that line, save, and check again.'],
        ],
      },
      {
        title: 'Finish the merge and update the pull request',
        where: 'Workspace terminal, then Gitea',
        why: 'The resolved file becomes a commit on branch B; pushing it updates B\'s pull request, which can be merged again.',
        run: 'if grep -q "^<<<<<<<\\|^>>>>>>>" app/main.py; then echo "STOP: conflict markers are still in app/main.py. Go back to step 4."; else\ngit add -A\ngit commit -m "Resolve conflict with main"\ngit push\nfi',
        explain: [
          ['if grep -q ...; then echo "STOP..."; else ... fi', 'a safety check first: if a marker is still in the file, stop and say so. Git would otherwise save the markers as if they were code.'],
          ['git add -A', 'mark the conflict as resolved (staging the fixed file).'],
          ['git commit -m "Resolve conflict with main"', 'finish the merge with a commit.'],
          ['git push', 'send it to Gitea: B\'s pull request updates itself (git push prints "Visit the existing pull request" and its link).'],
        ],
        out: '[conflict-b-student01 bce9e43] Resolve conflict with main\nremote:\nremote: Visit the existing pull request:\nremote:   https://gitea.<lab domain>/team01/hello/pulls/4\nremote:\nTo https://gitea.<lab domain>/team01/hello\n   b6f652b..bce9e43  conflict-b-student01 -> conflict-b-student01',
        see: 'In the terminal, the merge commit and the push to the existing pull request (above). In Gitea, the conflict message is gone from B\'s pull request. Approve it as reviewer in a private window, merge it as yourself, and a few minutes later dev shows the greeting you kept.',
        ifnot: [
          ['STOP: conflict markers are still in app/main.py', 'nothing was saved. Go back to step 4, remove the marker lines, save, and paste this box again.'],
          ['Lost in the middle of it', 'git merge --abort puts everything back as before step 3. Start step 3 again.'],
        ],
      },
    ],
    done: 'Both pull requests are merged, and app/main.py on main has one greeting and no markers.',
  },

  'Lab 6: write your one-page platform charter': {
    goal: 'Write what a platform for your part of FMD must do and promise: a one-page charter.',
    learn: [
      'That a platform is a product: it has users, promises and measures, like any service.',
      'How to write a promise that can be measured.',
    ],
    words: [
      ['Charter', 'One page that says who the platform is for, what it promises and how you will know it works.'],
      ['Service level', 'A promise with a number and a unit, for example "live in dev within 15 minutes".'],
    ],
    start: [
      'Your workspace, or an A4 sheet if you prefer paper.',
      'Your Day 1 delivery map, if you have it: its bottleneck is a good place to start.',
      { text: 'Paste this in your workspace terminal: it creates the charter with its five headings, ~/charter/charter.md, and shows it. Then open it in the editor (Explorer → charter → charter.md) and fill it in, step by step below.', cmd: 'mkdir -p ~/charter\ncat > ~/charter/charter.md <<EOF\n# Platform charter: $TEAM\n\n## Who uses it\n- \n\n## What they need (three jobs, in their words)\n1. \n2. \n3. \n\n## What we promise (two service levels: a number and a unit)\n1. \n2. \n\n## How we measure (two numbers, and where each comes from)\n1. \n2. \n\n## What is next (three things, most important first)\n1. \n2. \n3. \nEOF\ncat ~/charter/charter.md' },
    ],
    steps: [
      {
        title: 'Who uses it',
        where: 'Your workspace editor',
        why: 'A product without known users gets built for nobody. Naming them keeps every later decision honest.',
        do: [
          'List the roles in your part of FMD who would use a platform like this one.',
          'For each, half a line on what they do: for example "Analysts: build and change the daily reports".',
        ],
        see: 'Three to five roles, for example analysts, developers, data engineers, testers, risk and audit.',
      },
      {
        title: 'What they need',
        where: 'Your workspace editor',
        why: 'Users judge a platform by the jobs it makes easy, not by its tools.',
        do: [
          'Write the three jobs the platform must make easy, in the users\' own words.',
          'Use your Day 1 bottleneck if it fits.',
        ],
        see: 'Three jobs, one line each, for example "Get a new report into production without raising four tickets."',
      },
      {
        title: 'What we promise',
        where: 'Your workspace editor',
        why: 'A promise with a number can be checked. "Fast" cannot.',
        do: [
          'Write two service levels you could measure this week, each with a number and a unit.',
          'Check each one: could you prove on Friday whether you kept it?',
        ],
        see: 'Two promises, for example "A merged change is live in dev within 15 minutes" and "A new service is running in dev within 30 minutes of using the template".',
      },
      {
        title: 'How we measure',
        where: 'Your workspace editor',
        why: 'Measures tell the platform\'s owner whether it is getting better, and where to invest next.',
        do: [
          'Write two numbers you would show the platform\'s owner every month.',
          'Say where each number would come from: Git, the pipeline, the dashboard, a survey.',
        ],
        see: 'Two measures, for example "time from template to running service (from Git and Argo CD)" and "share of changes that needed a fix afterwards (from the pull requests)".',
      },
      {
        title: 'What is next',
        where: 'Your workspace editor',
        why: 'A product has a roadmap. Three next steps show what the platform should learn to do after this course.',
        do: [
          'Write three things you would add to the platform after this course, most important first.',
        ],
        see: 'Three items, for example "a template for scheduled reports", "single sign-on", "a cost report per team".',
      },
      {
        title: 'Present it in two minutes',
        where: 'With your neighbour',
        why: 'Saying it out loud tests it: if a promise sounds vague, it is.',
        do: [
          'Read your charter to your neighbour: users, jobs, the two promises, the two measures and the three next steps. Then listen to theirs.',
          'Keep the file (or a photo of the sheet): it goes into your Day 6 capstone.',
        ],
        see: 'A one-page charter of your own.',
      },
    ],
    done: 'A one-page charter with users, jobs, two promises, two measures and three next steps.',
  },
};
