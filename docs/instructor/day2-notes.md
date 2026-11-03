# Day 2 instructor guide: Git and working together

Deck: `Day2-Git-and-working-together.pptx`. Delegates follow the handbook (Gitea `platform/handbook`, page day2/README.md), which has every lab step by step. If Argo CD gives trouble, see [safety-net.md](safety-net.md).

## Before the day

- [ ] The morning checks in the run-book (portal, a workspace, a dev address, Argo CD, Grafana), on every VM: ansible pelab -m ping first. 30 minutes before the start.
- [ ] Check every VM's dev address answers: ansible pelab -a "curl -sk https://hello-team01-dev.<lab domain>/" shows hello's answer for each VM.
- [ ] Check every VM's runner is up: ansible pelab -b -a "lxc exec runner01 -- systemctl is-active pelab-gitea-runner" says active for each.
- [ ] Before Lab 3, show the logins file: every delegate has a reviewer login, to approve their own change as a second person in a private window, and platform-approver for Days 3 and 5. Say plainly that at work accounts are personal, and the second person is a real colleague.

## The day, hour by hour

| Time | What | Slides | Notes |
| --- | --- | --- | --- |
| 09:00 | Opening: yesterday in one minute, today's goal | 1-3 |  |
| 09:10 | Git basics: what Git is, where a change lives, status, diff, commits, branches, origin, undo | 4-15 | Keep a terminal next to the slides and show each command as you explain it. This theory carries the whole day. |
| 10:00 | Lab 1: Git basics in a practice repository | 16-17 | Nothing touches Gitea until the last step, which only reads. Ask each delegate to read their git status aloud and say where their change is. |
| 10:40 | Break |  |  |
| 10:55 | The pull-request loop, protected main | 18-19 |  |
| 11:10 | Lab 2: your first change, on a branch | 20 | Everyone makes their own branch and change, on their own VM. |
| 11:40 | Pull requests and reviews | 21 |  |
| 11:50 | Lab 3: review, approve, merge, and watch it go live | 22 | Each delegate approves as reviewer in a private window. Explain GitOps (slide 23) while the pipelines run. |
| 12:30 | Lunch |  |  |
| 13:15 | Lab 4: try to break the rules | 24 |  |
| 13:35 | Merging and conflicts | 25 |  |
| 13:45 | Lab 5: resolve a merge conflict | 26 | On your own: two branches, A and B. |
| 14:10 | Platform as a product | 27-28 |  |
| 14:30 | Lab 6: your platform charter | 29 | 30 minutes on your own, then two minutes with a neighbour. Ask two or three to read theirs to the room. |
| 15:05 | Break |  |  |
| 15:15 | Close: scenarios, quiz and recap | 30-32 |  |
| 15:45 | Check-off and questions |  |  |

## What you do yourself

Each delegate built their own VM, and its passwords are on it. `ansible pelab ...` commands run from your machine, in `prelab-setup/`, after `export ANSIBLE_INVENTORY=inventory/all-vms.yml` (pelab05 instead of pelab reaches one VM). `ansible-playbook ...` commands run on the VM they are for, in `~/plartfom-enable/prelab-setup`, with `-K`. Without SSH to the VMs, the delegate runs the command on their VM with `sudo` in front.

**Lab 3.** Each merge runs the pipeline twice (pull request, then main), on the VM's one runner: a few minutes of waiting is normal. Use the wait for slide 23. If one pipeline waits more than 10 minutes, check that VM's runner (here pelab05). *(Your machine, one VM)*

```bash
ansible pelab05 -b -a "lxc exec runner01 -- systemctl status pelab-gitea-runner --no-pager"
```

**Lab 4.** Every delegate must see the three refusals. If a push straight to main succeeds, stop: the protection is missing on that VM. Put it back: on that VM, in ~/plartfom-enable/prelab-setup (the delegate types it, or you over SSH). *(On that VM)*

```bash
ansible-playbook site.yml --tags golden_path -K
```

**Lab 6.** Make sure every delegate saved their charter (~/charter/charter.md): they use it in the Day 6 capstone.

**End of the day.** Each VM backs itself up every night: nothing to copy. Remind everyone to push their work: anything only in a workspace is not backed up. Next morning, check last night's backup is there on every VM. *(Your machine, every VM)*

```bash
ansible pelab -b -m ansible.builtin.shell -a "ls -1t /opt/pelab/backups | head -1"
```

## Watch for

| What you see | What to do |
| --- | --- |
| Merge stays grey | No approval as reviewer yet, the approval went stale after a new commit (approve again), or the pipeline check is not green yet. Your own approval never counts. |
| A pull request is red and someone wants to merge | Gitea will not let them: "Some required checks failed", and the button only offers to merge when checks succeed. Read the failing step together; Day 5 is about exactly this. |
| Argo CD asks for a login | The read-only account: delegate, with its password in the logins file (cat /etc/pelab/logins.md). studentNN does not work there. The same login opens Grafana on Day 6. |
| Argo CD shows the old commit for a long time | The pipeline on main must finish first (Actions tab). Argo CD checks Git every minute, so it notices within a minute or two. If merges stop reaching dev on a VM, see the safety net (safety-net.md). |

## End of the day

- [ ] Everyone pushed their work.
- [ ] Check-off sheet updated.
- [ ] Charters kept.

## Labs today

| Lab | Time |
| --- | --- |
| Lab 1: Git basics in a practice repository | 40 min |
| Lab 2: your first change, on a branch | 30 min |
| Lab 3: review, approve, merge, and watch it go live | 40 min · on your own |
| Lab 4: try to break the rules | 20 min |
| Lab 5: resolve a merge conflict | 25 min · on your own |
| Lab 6: write your one-page platform charter | 30 min · on your own |

## Slide by slide

The same notes are in the deck's speaker notes; quiz answers are under the quiz slide.

### 1. Git and working together

Yesterday the app ran on one person's machine, from memory. Today every change becomes a recorded, reviewed event. By the end of the day each delegate has made a change that a second person (the reviewer login) approved and that went live in dev without anyone touching a server.

### 2. Today's goal

The third outcome is the governance point. In a bank, "four eyes" and an audit trail are not optional. Git and pull requests give both for free.

### 3. Today's plan

Link back to yesterday's list of manual steps: today removes the first of them. The morning starts with the theory of Git and a practice lab where nothing can break; then the team workflow in four labs, and the charter in the afternoon.

### 4. Git basics

This is the theory the labs depend on. Take your time: every later lab, and every later day, uses these ideas. Have a terminal open next to the slides and show each command as you explain it.

### 5. What Git is, and why the platform runs on it

Ask who has ever had "report_final_v3_REALLY_final.docx" on their desktop. Git solves exactly that: one file name, every version kept, and a note on each saying who and why. Then open team01/hello in Gitea and click Commits: one commit so far, "Initial commit", made when the platform created the repository from its template.

### 6. A repository: a folder with a memory

ls -a shows hidden files: names that start with a dot. The listing on the slide is folded onto three lines to fit; on screen ls prints it in columns. Point out that .gitea/CODEOWNERS and the pipeline live in the repository: a change to who reviews, or to what the pipeline checks, goes through a pull request like any code change.

### 7. Where a change lives: four places

This is the most important picture of the day. Walk one change through it: edit the GREETING line (working folder), git add (staging area), git commit (your repository), git push (Gitea). Ask: if I commit but forget to push, can the reviewer see my change? No: it is still only on my workspace. That is the most common beginner surprise.

### 8. git status: where is my change?

This is the GREETING change of Lab 2, as you will see it. Teach the habit: run git status before and after every Git command, and read it. It always says which branch you are on and where each change is. Most beginner mistakes (committing on main, forgetting to add, forgetting to push) show up here first.

### 9. Reading a difference (diff)

A diff is what a reviewer reads, so learning to read one is learning to review. git diff shows changes not yet added; git diff --staged shows what will go into the next commit. The long first line is cut short on the slide (...): on screen it is the whole line that comes before the change.

### 10. A commit, up close

Yours have different ids and times. The point for an auditor: because every id depends on the one before it, nobody can change an old commit without changing every id after it, which everyone would notice. Together with the pull request and its approval, that is the audit trail.

### 11. A good commit message says why

Six months from now, someone reads git log to find when and why something changed: maybe an auditor, maybe you. The what is in the diff; the message is the only place the why is kept. In Lab 3 the pull request description adds two lines of why.

### 12. Branches: a label on a commit

A branch is not a copy of the files: it is a name pointing at a commit. That is why making one takes no time. Show git branch (the \* marks where HEAD is) and git log --oneline --graph --all. In Lab 1 the practice repository shows a branch moving ahead of main, then main catching up with a merge.

### 13. Your copy and Gitea's: origin, push and pull

The git remote -v box is shortened to fit: on screen the address is the whole https://gitea.<lab domain>/team01/hello. Draw two boxes on the board, "my workspace" and "Gitea", and move a commit between them with push and pull. The most common surprise: "I committed, why can't the reviewer see it?" Because commit is local; push shares it.

### 14. Undo safely: which command for which mistake

The rule behind the table: never rewrite history other people already have. Once a commit is in Gitea, undo it with git revert, which adds a record, instead of deleting it. That is also what a rollback is on this platform: a revert pull request (Day 6).

### 15. The Git commands you need

Eleven commands cover the whole week. Lab 1 uses every one of them, in a practice folder first. Say the commit message rule once more: it says why, not what.

### 16. Lab 1: Git basics in a practice repository

Nothing in this lab touches Gitea until the last step, which only reads. Delegates can make any mistake here: if they get lost, rm -rf ~/git-practice and start step 2 again. Walk round and ask each delegate to explain, from git status, where their change is.

### 17. The pull-request loop you will use every day

Walk the loop once with the terminal and Gitea side by side. The green step is the one that makes it a control: a second person must approve. Make the point that step 8 is the platform at work; on Day 6 they learn how.

### 18. Why main is protected

Connect to the brief's policy principles: security by design, evidence by default. Ask who has signed a change-request form after the change was already made. Protected branches make the approval happen before, and keep the record automatically.

### 19. Lab 2: your first change, on a branch

Everyone works on their own VM, with their own branch and change; conflicts are Lab 5's problem. If a push asks for a password, it is the student01 password from cat /etc/pelab/logins.md.

### 20. Pull requests and reviews: what good looks like

Show a pull request on screen: the Files tab, the Conversation tab, the checks, the Approve button. Point out how little effort the review takes when the change is small. That is why the platform encourages many small changes over one big release.

### 21. Lab 3: review, approve, merge, and watch it go live

The wait between merge and live is the pipeline building the image (Day 5) and Argo CD noticing (Day 6). Use the wait to explain the next slide. If two delegates in a team merge within minutes of each other, the second one simply replaces the first in dev; that is correct behaviour.

### 22. GitOps: Git says what should run

Keep this to five minutes; Day 6 goes deeper. The idea to land: in a regulated environment, "nobody logs in to deploy" is both safer and easier to evidence than any manual process.

### 23. Lab 4: try to break the rules

This is the brief's "compromised inputs are blocked" at the simplest level. Delegates who see the refusals trust the control more than those who only hear about it. Then make the honest point: they have a reviewer login so they can play the second person, and signing in as reviewer gets an approval through. The tool checks accounts, not people; that is why at work accounts are personal, protected by two-factor sign-in, and never shared.

### 24. How Git joins two branches: merge, squash and conflicts

Show the merge-conflict picture on the Lab 5 slide while you explain. Conflicts frighten people because the file suddenly looks broken; say clearly that the markers are Git asking a question, and git merge --abort always takes you back.

### 25. Lab 5: resolve a merge conflict

Conflicts frighten beginners; doing one on purpose removes the fear. The lesson for later: small changes merged often rarely conflict.

### 26. Platform as a product

This is the brief's Lab 2, done lightly. The point is to practise thinking of the platform as something with customers.

### 27. What makes a platform a product

Make this concrete with the lab: the instructors are the platform team, the delegates are the users, the service levels can be measured this week (time from merge to live in dev, time from template to a running service).

### 28. Lab 6: write your one-page platform charter

The charter comes back in the Day 6 capstone presentation. Push everyone towards measurable promises; "fast" is not a promise, "within 15 minutes" is.

### 29. Scenario: straight to production

Three views of the same control. Delegates saw the first one in Lab 4; the second is their Lab 3; the third is the brief's "evidence by default" principle made concrete.

### 30. Check your understanding

Answers. 1: Working folder (git add) → staging area (git commit) → your repository (git push) → Gitea; git pull brings changes back. 2: A commit saves a snapshot on your machine; a push sends your branch to Gitea. 3: Segregation of duties; a second person checks every change, and the record of who approved is kept. 4: The pipeline built and scanned the image, and Argo CD saw that main changed and deployed it. 5: A revert pull request (leaves a record) or a new fix pull request (also a record); changing the cluster by hand would be undone by Argo CD and leaves no Git record. 6: Users and jobs, owner, promises, measures, feedback and roadmap.

### 31. What we built today

Today's pieces: Repository and GitOps. Tomorrow adds Environments.
