# Day 2 instructor guide: Git and working together

Deck: `Day2-Git-and-working-together.pptx`. Delegates follow the handbook (Gitea `platform/handbook`, page day2.md), which has every lab step by step. If Argo CD gives trouble, see [safety-net.md](safety-net.md).

## Before the day

- [ ] The morning checks in the run-book (portal, a workspace, a dev address, Argo CD, Grafana, and the lab server lines). 30 minutes before the start.
- [ ] Check every team's dev address answers: https://hello-team01-dev.<lab domain>/ to team05.
- [ ] Check the five runners are up: Gitea → Site Administration → Actions → Runners shows five runners, idle.
- [ ] Before Lab 2, point at "Your team's logins" on the access sheet: anyone may sign in as a teammate in a private window to play that role (for example to approve when the teammate is away). Say plainly that at work accounts are personal.

## The day, hour by hour

| Time | What | Slides | Notes |
| --- | --- | --- | --- |
| 09:00 | Opening: yesterday in one minute, today's goal | 1-2 |  |
| 09:15 | Version control, the pull-request loop, protected main | 3-6 |  |
| 10:00 | Lab 1: your first change, on a branch | 7 | Everyone makes their own branch and change. |
| 10:30 | Break |  |  |
| 10:45 | Pull requests and reviews | 8 |  |
| 11:00 | Lab 2: review, approve, merge, and watch it go live | 9 | In pairs. Explain GitOps (slide 10) while the pipelines run. |
| 11:40 | GitOps: Git says what should run | 10 |  |
| 12:00 | Lab 3: try to break the rules | 11 |  |
| 12:20 | Lunch |  |  |
| 13:05 | Lab 4: resolve a merge conflict | 12 | In pairs. |
| 13:30 | Platform as a product | 13-14 |  |
| 14:00 | Lab 5: the team's platform charter | 15 | 30 minutes in teams, then two minutes per team. |
| 14:45 | Break |  |  |
| 15:00 | Close: scenarios, quiz and recap | 16-18 |  |
| 15:40 | Check-off and questions |  |  |

## What you do yourself

Commands for the lab server run there over SSH (`ssh labadmin@<server>`); the others on the control machine, in `pe-lab-ansible/`.

**Lab 2.** Expect a queue: five runners serve 25 people, and each merge runs the pipeline twice (pull request, then main). Use the wait for slide 10. If one pipeline waits more than 10 minutes, check the runners. *(Lab server)*

```bash
sudo lxc list runner -c ns
sudo lxc exec runner01 -- systemctl status pelab-gitea-runner --no-pager
```

**Lab 3.** Every team must see the three refusals. If a push straight to main succeeds, stop: the protection is missing. Put it back. *(Control machine)*

```bash
ansible-playbook site.yml --tags golden_path
```

**Lab 5.** Photograph or collect the charters: the teams use them in the Day 6 capstone.

**End of the day.** Copy tonight's backup to the control machine (it takes a fresh one first). *(Control machine)*

```bash
ansible-playbook backup.yml
```

## Watch for

| What you see | What to do |
| --- | --- |
| Merge stays grey | No approval yet, the approval went stale after a new commit (approve again), or the pipeline check is not green yet. Your own approval never counts. |
| A pull request is red and someone wants to merge | Gitea will not let them: "Some required checks failed", and the button only offers to merge when checks succeed. Read the failing step together; Day 5 is about exactly this. |
| Argo CD asks for a login | The shared read-only account: delegate, with the password printed on every access sheet. studentNN does not work there. The same login opens Grafana on Day 6. |
| Argo CD shows the old commit for a long time | The pipeline on main must finish first (Actions tab). Argo CD notices within about three minutes. If merges stop reaching dev for every team, see the safety net (safety-net.md). |

## End of the day

- [ ] Backup copied.
- [ ] Check-off sheet updated.
- [ ] Charters kept.

## Labs today

| Lab | Time |
| --- | --- |
| Lab 1: your first change, on a branch | 30 min |
| Lab 2: review, approve, merge, and watch it go live | 40 min · in pairs |
| Lab 3: try to break the rules | 20 min |
| Lab 4: resolve a merge conflict | 25 min · in pairs |
| Lab 5: write your team's one-page platform charter | 30 min · in teams |

## Slide by slide

The same notes are in the deck's speaker notes; quiz answers are under the quiz slide.

### 1. Git and working together

Yesterday the app ran on one person's machine, from memory. Today every change becomes a recorded, reviewed event. By the end of the day each delegate has made a change that a teammate approved and that went live in dev without anyone touching a server.

### 2. Today's goal

The third outcome is the governance point. In a bank, "four eyes" and an audit trail are not optional. Git and pull requests give both for free.

### 3. Version control in plain words

Use the analogy of tracked changes in a document, but for a whole folder, with a named author on every change and the ability to go back to any point. Then show the repository in Gitea: the files, the commit list, the branches. Explain "clone" as "take a full copy, history included".

### 4. The pull-request loop you will use every day

Walk the loop once with the terminal and Gitea side by side. The green step is the one that makes it a control: a second person must approve. Make the point that step 8 is the platform at work; on Day 6 they learn how.

### 5. Why main is protected

Connect to the brief's policy principles: security by design, evidence by default. Ask who has signed a change-request form after the change was already made. Protected branches make the approval happen before, and keep the record automatically.

### 6. The Git commands you need

Eight commands cover the whole week. Say the commit message rule once: it says why, not what ("Shorten the greeting for the dashboard", not "edit main.py"). The what is in the diff.

### 7. Lab 1: your first change, on a branch

Everyone in the team makes their own branch and change; conflicts are tomorrow's problem, or rather Lab 4's. If a push asks for a password, it is the Gitea password from the access sheet.

### 8. Pull requests and reviews: what good looks like

Show a pull request on screen: the Files tab, the Conversation tab, the checks, the Approve button. Point out how little effort the review takes when the change is small. That is why the platform encourages many small changes over one big release.

### 9. Lab 2: review, approve, merge, and watch it go live

The wait between merge and live is the pipeline building the image (Day 5) and Argo CD noticing (Day 6). Use the wait to explain the next slide. If two delegates in a team merge within minutes of each other, the second one simply replaces the first in dev; that is correct behaviour.

### 10. GitOps: Git says what should run

Keep this to five minutes; Day 6 goes deeper. The idea to land: in a regulated environment, "nobody logs in to deploy" is both safer and easier to evidence than any manual process.

### 11. Lab 3: try to break the rules

This is the brief's "compromised inputs are blocked" at the simplest level. Delegates who see the refusals trust the control more than those who only hear about it. Then make the honest point: their access sheet lists the team's logins so they can play each other's roles, and signing in as a teammate would get an approval through. The tool checks accounts, not people; that is why at work accounts are personal, protected by two-factor sign-in, and never shared.

### 12. Lab 4: resolve a merge conflict

Conflicts frighten beginners; doing one on purpose removes the fear. The lesson for later: small changes merged often rarely conflict.

### 13. Platform as a product

This is the brief's Lab 2, done lightly. The point is to practise thinking of the platform as something with customers.

### 14. What makes a platform a product

Make this concrete with the lab: the instructors are the platform team, the delegates are the users, the service levels can be measured this week (time from merge to live in dev, time from template to a running service).

### 15. Lab 5: write your team's one-page platform charter

The charter comes back in the Day 6 capstone presentation. Push teams towards measurable promises; "fast" is not a promise, "within 15 minutes" is.

### 16. Scenario: straight to production

Three views of the same control. Delegates saw the first one in Lab 3; the second is their Lab 2; the third is the brief's "evidence by default" principle made concrete.

### 17. Check your understanding

Answers. 1: A commit saves a snapshot on your machine; a push sends your branch to Gitea. 2: Segregation of duties; a second person checks every change, and the record of who approved is kept. 3: The pipeline built and scanned the image, and Argo CD saw that main changed and deployed it. 4: A revert pull request (leaves a record) or a new fix pull request (also a record); changing the cluster by hand would be undone by Argo CD and leaves no Git record. 5: Users and jobs, owner, promises, measures, feedback and roadmap.

### 18. What we built today

Today's pieces: Repository and GitOps. Tomorrow adds Environments.
