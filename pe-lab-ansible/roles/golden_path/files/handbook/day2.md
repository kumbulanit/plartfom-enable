# Day 2: Git and working together

**Goal:** Every change goes through Git, a pull request and a review, and the approved change goes live in dev by itself.

By the end of the day you can:

- Clone, branch, commit and push with Git
- Open a pull request, review a teammate's change, approve and merge it
- Explain why main is protected, and what the history proves to an auditor

## Version control

### Version control in plain words

A repository is a folder with its complete history: every version of every file, who changed it, when, and why.

A commit is a saved snapshot with a message. A branch is a parallel copy where you make a change without disturbing anyone. Merging brings the change back into the main line.

Git keeps this on your machine; Gitea keeps the shared copy everyone pushes to. The shared copy is the one the platform deploys from.

> **In one sentence:** Git records every change with who, when and why; a branch lets you work without disturbing the main line.

**In the lab**

- Gitea at https://gitea.<lab domain> holds one organisation per team.
- teamNN/hello is the service you ran yesterday.
- main is the line that gets deployed. It is protected: no direct pushes.
- Your own branches are yours; nobody else sees them until you push.

### The pull-request loop you will use every day

1. Branch
2. Change
3. Commit
4. Push
5. Pull request
6. Review and approve
7. Merge
8. Live in dev

Steps 1 to 4 happen in your workspace. Steps 5 to 7 happen in Gitea with a teammate. Step 8 happens by itself: Argo CD sees that main changed and deploys it.

### Why main is protected

Four eyes on every change: the person who writes a change cannot be the one who approves it. In the brief this is segregation of duties.

The history is the audit trail: who changed what, who approved it, when it went live. Evidence by default, not assembled afterwards.

Protection is enforced by the tool, not by a rule in a document. A push to main is refused; a pull request without an approval cannot be merged.

> **In one sentence:** Protected main means every change to production has a second pair of eyes and a permanent record.

**In the lab**

- Pushing straight to main is refused.
- A pull request needs one approval from your team before Merge turns green.
- CODEOWNERS sends every review to your team's developers group.
- The pipeline also runs on every pull request; Day 5 explains what it checks.

### The Git commands you need

| Command | What it does | When |
| --- | --- | --- |
| git clone &lt;url> | Take a full copy of the repository, history included | Once per repository |
| git switch -c &lt;branch> | Create a branch for your change and move onto it | Start of every change |
| git status | What has changed since the last commit | Any time |
| git add -A | Stage all changed files for the next commit | Before each commit |
| git commit -m "message" | Save a snapshot with a message that says why | Small, often |
| git push -u origin &lt;branch> | Send your branch to Gitea | When ready for review |
| git switch main && git pull | Go back to main and get the latest merged changes | After a merge |
| git log --oneline | Read the history, one line per commit | Any time |

## Lab 1: your first change

### Lab 1: your first change, on a branch

*30 min*

**What you do:** Change the greeting of your team's service on a branch of your own, check it, save it as a commit and send it to Gitea.

**Before you start:** Your copy of hello from Day 1 (~/hello). If you do not have it, do step 1 of Day 1 Lab 3 first.

#### Step 1. Go to main and get the latest version

*Where: Workspace terminal*

main is the line that gets deployed. git pull brings in the changes your teammates merged since yesterday.

```bash
cd ~/hello
git switch main
git pull
```

**You should see:** "Already up to date." or a short list of changed files.

#### Step 2. Make your own branch

*Where: Workspace terminal*

A branch is your own copy of the line, where your change cannot disturb anyone. The name includes your user name so it is unique.

```bash
git switch -c greeting-$ME
```

**You should see:** Switched to a new branch 'greeting-student01' (with your user name).

#### Step 3. Change the greeting

*Where: Workspace editor*

In the file list on the left, open hello → app → main.py. Find the line that starts with GREETING (around line 21):

GREETING = os.environ.get("GREETING", "Hello from the PE Lab golden path")

Change only the text in the second pair of quotes, for example to "Hello from team 3". Save with Ctrl+S.

```bash
git status
```

**You should see:** modified: app/main.py, in red.

#### Step 4. Check it works before you share it

*Where: Two workspace terminals*

Start the service in the first terminal and call it from the second (+ button), as on Day 1. Then stop it with Ctrl+C in the first terminal.

```bash
python3 -m app.main
```

**You should see:** In the second terminal, curl -s localhost:8080/ shows your new text in "message".

#### Step 5. Save the change as a commit

*Where: Workspace terminal*

git add chooses what goes into the commit; git commit saves it with a message that says why. A good message finishes the sentence "This change will...".

```bash
git add -A
git commit -m "Change the greeting for $TEAM"
```

**You should see:** One line with the branch and a short commit id, then "1 file changed, 1 insertion(+), 1 deletion(-)".

#### Step 6. Send your branch to Gitea

*Where: Workspace terminal*

git push copies your branch to Gitea, where your team can see it. Gitea answers with a link to open a pull request.

```bash
git push -u origin greeting-$ME
```

**You should see:** The link to create the pull request:

```
remote: Create a new pull request for 'greeting-student01':
remote:   https://gitea.<lab domain>/team01/hello/compare/main...greeting-student01
```

**Done when:** Your branch is in Gitea (teamNN/hello → Branches shows greeting-studentNN).

**If you are stuck**

- Author identity unknown: run git config --global user.name "Your Name" and git config --global user.email studentNN@<lab domain>.
- rejected (non-fast-forward): someone pushed first. Run git pull --rebase, then push again.

## Lab 2: review and merge

### Pull requests and reviews: what good looks like

A pull request says: here is a change, please review it. It shows the difference line by line, runs the checks, and collects the approval.

A good change is small and its description says why. A good review reads the difference, asks questions in comments, and either approves or requests changes.

Merging is the decision to put the change on the main line. From then on the platform treats it as the truth and deploys it.

> **In one sentence:** A pull request turns a change into a reviewed, recorded decision.

**In the lab**

- Title: what changed. Description: why, in two lines.
- A teammate reviews; you cannot approve your own change.
- Merge needs one approval from your team and a green pipeline. Until the check called pipeline is green, Gitea says "Some checks are pending" (or "failed") and does not merge.
- Squash merge keeps the history tidy: one commit per change.

### Lab 2: review, approve, merge, and watch it go live

*40 min · in pairs*

**What you do:** Turn your change into a reviewed decision: a pull request, a teammate's review and approval, a merge, and the change running in dev by itself.

**Before you start:** Lab 1 done: your branch is pushed. Work in pairs: each of you reviews the other's pull request.

#### Step 1. Open the pull request

*Where: Browser: Gitea*

Open the link from git push (or Gitea → teamNN/hello → Pull Requests → New Pull Request, and pick your branch). Title: what changed. Description: why, in two lines. Click Create Pull Request.

**You should see:** The pull request page. A yellow dot next to the commit: the pipeline is checking your change.

#### Step 2. Your teammate reads the change and comments

*Where: Browser: Gitea (your teammate)*

Your teammate opens your pull request, then the Files Changed tab. The old line is red, the new one green. They click the + next to a line and leave one comment, then Add single comment.

**You should see:** A comment attached to a line of your change.

#### Step 3. Your teammate approves

*Where: Browser: Gitea (your teammate)*

Your teammate clicks Review (top right of Files Changed), chooses Approve and submits. Then wait for the pipeline: the yellow dot turns into a green tick. Until then the box says "Some checks are pending" and the merge button only offers to merge "When checks succeed": main requires the check called pipeline, which the pipeline posts as its last step.

**You should see:** "All checks were successful", one green approval, and a plain Create squash commit button. A red pipeline says "Some required checks failed" instead, and nothing merges until the branch is fixed and pushed again.

> **Tip:** Working alone, or your teammate is busy? Play their role: open a private window (Ctrl+Shift+N; on a Mac Cmd+Shift+N; Firefox Ctrl+Shift+P), sign in to Gitea there with a login from "Your team's logins" on your access sheet (or cat /etc/pelab/logins.md in your workspace), and approve as that teammate. It counts because it is another account. Then close the private window and merge as yourself.

#### Step 4. Merge it, and update your copy

*Where: Browser: Gitea, then the workspace terminal*

On the pull request, choose Create squash commit in the merge menu and confirm. Squash turns your branch into one tidy commit on main. Then bring main up to date in your workspace.

```bash
git switch main
git pull
git log --oneline -3
```

**You should see:** Your change at the top of the history, as one commit.

#### Step 5. Watch it go live

*Where: Browser: Argo CD*

The pipeline now runs again on main and builds the image (Gitea → Actions shows it). Then Argo CD notices that main changed.

Open https://argocd.<lab domain> and sign in as delegate with the password on your access sheet: one read-only login that every delegate shares (not your studentNN password). Then click the application teamNN-hello-dev.

**You should see:** Within a few minutes: Synced and Healthy, with your commit id next to "Sync OK to".

> **Tip:** If your instructor has switched on the safety net, Argo CD is paused. Look at your merge commit in Gitea instead (Commits → the tick next to it): safety-net/dev says "Deployed to teamNN-dev" with your commit.

#### Step 6. See your change in dev

*Where: Browser*

Open your service's dev address. Replace teamNN with your team, for example hello-team03-dev.

```bash
curl -s https://hello-$TEAM-dev.$DOMAIN/
```

**You should see:** "environment": "dev" and your new greeting. Nobody logged in to a server: the merge did it.

**Done when:** Your greeting answers on https://hello-teamNN-dev.<lab domain>/ and the pull request shows who approved it.

**If you are stuck**

- Argo CD asks for a user name and password: delegate, with the shared password on your access sheet. Your studentNN password does not work there.
- Merge stays grey: it needs one approval from a teammate. Your own approval does not count. Teammate not here? Approve as them in a private window, with the logins on your access sheet.
- "Some checks are pending" or "Some required checks failed" although approved: the required check called pipeline is not green yet. Wait for the run to finish; if it is red, fix it on the branch and push again (Day 5 shows how to read the failure). The "When checks succeed" button only queues the merge: nothing merges while the check is red.
- Argo CD still shows the old commit: the pipeline must finish first (Actions tab). Argo CD then notices within about three minutes.

### GitOps: Git says what should run

The deployment did not happen because someone logged in and ran commands. It happened because main changed.

Argo CD watches the repository and makes the cluster match it. If the two differ, Argo CD changes the cluster, never the other way round.

That is GitOps: Git is the single source of truth for what runs. A rollback is a revert in Git. Nobody needs production access to deploy.

> **In one sentence:** GitOps means the cluster always matches what Git says, so deploying is merging.

**In the lab**

- Argo CD is read-only for delegates; the picture is enough.
- Every merge to main deploys to dev automatically.
- Staging and prod wait for an approved promotion (Day 6).
- If someone changes dev by hand, Argo CD puts it back (Day 6 shows this).

## Lab 3: try to break the rules

### Lab 3: try to break the rules

*20 min*

**What you do:** Try the three shortcuts the platform refuses, and keep the refusal messages as evidence that the controls work.

**Before you start:** Your copy of hello, on main and up to date (git switch main && git pull).

#### Step 1. Push straight to main

*Where: Workspace terminal*

This is the shortcut: a change on main with no review.

```bash
cd ~/hello
git switch main
echo "Direct edit" >> README.md
git add -A
git commit -m "Direct edit"
git push
```

**You should see:** Refused. Copy the message into your notes:

```
remote: error: Not allowed to push to protected branch main
 ! [remote rejected] main -> main (pre-receive hook declined)
```

#### Step 2. Undo it

*Where: Workspace terminal*

Put your main back to what Gitea has, and throw the local commit away.

```bash
git reset --hard origin/main
git status
```

**You should see:** "Your branch is up to date with 'origin/main'" and nothing to commit.

#### Step 3. Approve your own pull request

*Where: Workspace terminal, then Gitea*

Make a small change on a new branch and open a pull request, as in Lab 2. Then try to approve it yourself (Files Changed → Review → Approve).

```bash
git switch -c self-approve-$ME
echo "Self review" >> README.md
git commit -am "Try to approve my own change"
git push -u origin self-approve-$ME
```

**You should see:** Gitea does not let you approve your own pull request, and Merge stays unavailable.

> **Tip:** Signing in as a teammate would get an approval through: the tool checks accounts, not people. That is why at work every account is personal and never shared. In this lab you share logins only to play roles.

#### Step 4. Change it after a teammate approved

*Where: Gitea, then the workspace terminal*

Ask a teammate to approve the pull request (or approve it as a teammate in a private window, as in Lab 2). Then push one more commit to the same branch.

```bash
echo "One more line" >> README.md
git commit -am "Change after approval"
git push
```

**You should see:** The approval is marked stale (dismissed): what was approved is no longer what would be merged, so it needs a fresh review.

> **Tip:** Close this pull request without merging when you are done (Close Pull Request at the bottom), and delete the branch.

#### Step 5. Write down the three messages

*Where: Your team notes*

Copy the three refusals: the protected branch, your own approval not counting, and the stale approval.

**You should see:** Three lines in your team notes. They go into the Day 6 evidence pack: proof that segregation of duties is enforced by the tool.

**Done when:** Three refusals written down, and main unchanged.

**If you are stuck**

- If any of these pushes or approvals succeeds, tell the instructor straight away: a control is missing.

## Lab 4: a merge conflict

### Lab 4: resolve a merge conflict

*25 min · in pairs*

**What you do:** See what happens when two people change the same line, and resolve it calmly.

**Before you start:** Work in pairs: person A and person B, both with hello on main and up to date.

#### Step 1. Both change the same line

*Where: Both workspaces*

Each of you makes a branch from the latest main:

```bash
cd ~/hello
git switch main && git pull
git switch -c conflict-$ME
```

Each of you changes the GREETING line in app/main.py to a different text (as in Lab 1, step 3) and saves. Then commit and push, and open a pull request in Gitea:

```bash
git commit -am "Greeting from $ME"
git push -u origin conflict-$ME
```

**You should see:** Two pull requests that change the same line.

#### Step 2. Merge the first one

*Where: Browser: Gitea*

Person B approves person A's pull request, and person A merges it.

**You should see:** Person B's pull request now says it has conflicts and cannot be merged automatically.

#### Step 3. Bring main into your branch

*Where: Person B's workspace terminal*

Person B takes the latest main and merges it into their branch, to see the conflict on their own machine.

```bash
git switch main
git pull
git switch conflict-$ME
git merge main
```

**You should see:** Git stops and names the file:

```
CONFLICT (content): Merge conflict in app/main.py
Automatic merge failed; fix conflicts and then commit the result.
```

#### Step 4. Choose the line to keep

*Where: Person B's workspace editor*

Open app/main.py. Git has put both versions in the file, between markers: &lt;&lt;&lt;&lt;&lt;&lt;&lt; your version, ======= the separator, and >>>>>>> main's version.

Decide which greeting to keep (or write a new one). Delete the other one and all three marker lines. Save.

```bash
grep -n "<<<<<<<\|=======\|>>>>>>>" app/main.py || echo "no markers left"
```

**You should see:** "no markers left", and one GREETING line.

#### Step 5. Finish the merge and update the pull request

*Where: Person B's workspace terminal, then Gitea*

Commit the resolved file and push. The pull request updates itself; person A approves it and person B merges.

```bash
git add -A
git commit -m "Resolve conflict with main"
git push
```

**You should see:** The pull request can be merged again. After the merge, dev shows the greeting you kept.

**Done when:** Both pull requests are merged, and app/main.py on main has one greeting and no markers.

**If you are stuck**

- Lost in the conflict? git merge --abort puts everything back; start step 3 again.
- Look for the markers &lt;&lt;&lt;&lt;&lt;&lt;&lt;, ======= and >>>>>>>: delete all three lines, not only the text between them.

## Platform as a product

*A platform has users, an owner, a roadmap and measures of success. This afternoon your team writes the one-page charter for the mini platform.*

### What makes a platform a product

The brief: "Capabilities must have identified users, product ownership, funded roadmaps, service levels, telemetry and feedback loops."

- **Users and their jobs:** Who uses the platform (developers, analysts, testers) and the three jobs they most need done: create a service, get an environment, release a change.
- **An owner:** Someone accountable for the platform's roadmap, its service levels and its support. Not a committee.
- **Promises (service levels):** For example: a new service is live in dev within 15 minutes; a pull request is deployed to dev within 5 minutes of merging.
- **Measures:** Lead time for a change, how often teams deploy, how long a new team takes to ship, how satisfied users are. The brief's "flow and productivity" outcome area.
- **Feedback:** A way for users to ask for things and report problems, and a visible backlog of what is coming next.

### Lab 5: write your team's one-page platform charter

*30 min · in teams*

**What you do:** Write, as a team, what a platform for your part of FMD must do and promise: a one-page charter.

**Before you start:** Your team, one sheet (or a shared page). No computer needed.

#### Step 1. Who uses it

*Where: Your team*

List the roles in your team and in FMD who would use a platform like this one: for example analysts, developers, data engineers, testers, risk and audit.

**You should see:** Three to five roles.

#### Step 2. What they need

*Where: Your team*

Write the three jobs the platform must make easy, in the users' own words. For example "Get a new report into production without raising four tickets."

**You should see:** Three jobs, one line each.

#### Step 3. What we promise

*Where: Your team*

Write two service levels you could measure this week, each with a number and a unit. For example "A merged change is live in dev within 15 minutes."

**You should see:** Two promises with a number and a unit.

#### Step 4. How we measure

*Where: Your team*

Write two numbers you would show the platform's owner every month. For example "time from template to running service" and "share of changes that needed a fix afterwards".

**You should see:** Two measures.

#### Step 5. What is next

*Where: Your team*

Write three things you would add to the platform after this course.

**You should see:** Three items.

#### Step 6. Present it in two minutes

*Where: In front of the room*

Read your charter. Keep it: it goes into the Day 6 capstone.

**You should see:** A one-page charter per team.

**Done when:** A one-page charter with users, jobs, two promises, two measures and three next steps.

**If you are stuck**

- A promise needs a number and a unit: "within 15 minutes", not "fast".

### Scenario: straight to production

| Scenario | What happens | What the platform does | The rule |
| --- | --- | --- | --- |
| Straight to production | A developer in a hurry tries to push a fix straight to main, skipping the pull request. | Gitea refuses the push. The only way onto main is a pull request with one approval from the team; the approval and the merge are recorded with names and times. | Four eyes on every change. The history is the audit trail. |
| The same fix, the right way | The same developer makes a branch, opens a pull request and asks a teammate to review. | The checks run, the teammate approves in two minutes, the merge deploys to dev by itself. Total time: a few minutes longer than the shortcut, and fully evidenced. | The safe way is also the easy way: that is what a paved road means. |
| The auditor's question | Six months later someone asks who changed the greeting, who approved it and when it reached dev. | The pull request, its approval, the merge commit and the Argo CD history answer all four questions without anyone searching through emails. | Evidence by default: normal work produces the record. |

### Check your understanding

1. What is the difference between a commit and a push?
2. Why can you not approve your own pull request, and what does that give the bank?
3. What happened in the platform between "Merge" and the new greeting appearing in dev?
4. A change in dev is wrong. Name two ways to undo it on this platform, and which one leaves a record.
5. What are the five parts of a platform charter?

### What we built today

You can now:

- Branch, commit, push, open a pull request
- Review, approve and merge a teammate's change
- Explain protected main, four eyes and the audit trail
- Resolve a merge conflict without fear
- Describe the platform as a product with a charter

**Tomorrow:** Infrastructure as Code. You will create and destroy infrastructure with a few lines of OpenTofu, then request your team's staging and prod environments from the environment template, by pull request.

---

[Day 1](day1.md) · [Contents](README.md) · [Day 21](day21.md)
