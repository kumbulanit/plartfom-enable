# Day 2 instructor guide: Git and working together

Deck: `Day2-Git-and-working-together.pptx`. Delegates follow the handbook (Gitea `platform/handbook`, page day2/README.md), which has every lab step by step. If Argo CD gives trouble, see [safety-net.md](safety-net.md).

## Before the day

- [ ] The morning checks in the run-book (portal, a workspace, a dev address, Argo CD, Grafana), on every VM: ansible pelab -m ping first. 30 minutes before the start.
- [ ] Check every VM's dev address answers: ansible pelab -a "curl -sk https://hello-team01-dev.<lab domain>/" shows hello's answer for each VM.
- [ ] Check every VM's runner is up: ansible pelab -b -a "lxc exec runner01 -- systemctl is-active pelab-gitea-runner" says active for each.
- [ ] Before Lab 2, show the logins file: every delegate has a reviewer login, to approve their own change as a second person in a private window, and platform-approver for Days 3 and 5. Say plainly that at work accounts are personal, and the second person is a real colleague.

## The day, hour by hour

| Time | What | Slides | Notes |
| --- | --- | --- | --- |
| 09:00 | Opening: yesterday in one minute, today's goal | 1-2 |  |
| 09:15 | Version control, the pull-request loop, protected main | 3-6 |  |
| 10:00 | Lab 1: your first change, on a branch | 7 | Everyone makes their own branch and change, on their own VM. |
| 10:30 | Break |  |  |
| 10:45 | Pull requests and reviews | 8 |  |
| 11:00 | Lab 2: review, approve, merge, and watch it go live | 9 | Each delegate approves as reviewer in a private window. Explain GitOps (slide 10) while the pipelines run. |
| 11:40 | GitOps: Git says what should run | 10 |  |
| 12:00 | Lab 3: try to break the rules | 11 |  |
| 12:20 | Lunch |  |  |
| 13:05 | Lab 4: resolve a merge conflict | 12 | On your own: two branches, A and B. |
| 13:30 | Platform as a product | 13-14 |  |
| 14:00 | Lab 5: your platform charter | 15 | 30 minutes on your own, then two minutes with a neighbour. Ask two or three to read theirs to the room. |
| 14:45 | Break |  |  |
| 15:00 | Close: scenarios, quiz and recap | 16-18 |  |
| 15:40 | Check-off and questions |  |  |

## What you do yourself

Each delegate built their own VM, and its passwords are on it. `ansible pelab ...` commands run from your machine, in `prelab-setup/`, after `export ANSIBLE_INVENTORY=inventory/all-vms.yml` (pelab05 instead of pelab reaches one VM). `ansible-playbook ...` commands run on the VM they are for, in `~/plartfom-enable/prelab-setup`, with `-K`. Without SSH to the VMs, the delegate runs the command on their VM with `sudo` in front.

**Lab 2.** Each merge runs the pipeline twice (pull request, then main), on the VM's one runner: a few minutes of waiting is normal. Use the wait for slide 10. If one pipeline waits more than 10 minutes, check that VM's runner (here pelab05). *(Your machine, one VM)*

```bash
ansible pelab05 -b -a "lxc exec runner01 -- systemctl status pelab-gitea-runner --no-pager"
```

**Lab 3.** Every delegate must see the three refusals. If a push straight to main succeeds, stop: the protection is missing on that VM. Put it back: on that VM, in ~/plartfom-enable/prelab-setup (the delegate types it, or you over SSH). *(On that VM)*

```bash
ansible-playbook site.yml --tags golden_path -K
```

**Lab 5.** Make sure every delegate saved their charter (~/charter/charter.md): they use it in the Day 6 capstone.

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
| Lab 1: your first change, on a branch | 30 min |
| Lab 2: review, approve, merge, and watch it go live | 40 min · on your own |
| Lab 3: try to break the rules | 20 min |
| Lab 4: resolve a merge conflict | 25 min · on your own |
| Lab 5: write your one-page platform charter | 30 min · on your own |

## Slide by slide

The same notes are in the deck's speaker notes; quiz answers are under the quiz slide.

### 1. Git and working together

Yesterday the app ran on one person's machine, from memory. Today every change becomes a recorded, reviewed event. By the end of the day each delegate has made a change that a second person (the reviewer login) approved and that went live in dev without anyone touching a server.

### 2. Today's goal

The third outcome is the governance point. In a bank, "four eyes" and an audit trail are not optional. Git and pull requests give both for free.

### 3. Today's plan

Link back to yesterday's list of manual steps: today removes the first of them. Four Git labs in a row, then the charter after lunch.

### 4. Version control in plain words

Use the analogy of tracked changes in a document, but for a whole folder, with a named author on every change and the ability to go back to any point. Then show the repository in Gitea: the files, the commit list, the branches. Explain "clone" as "take a full copy, history included".

### 5. The pull-request loop you will use every day

Walk the loop once with the terminal and Gitea side by side. The green step is the one that makes it a control: a second person must approve. Make the point that step 8 is the platform at work; on Day 6 they learn how.

### 6. Why main is protected

Connect to the brief's policy principles: security by design, evidence by default. Ask who has signed a change-request form after the change was already made. Protected branches make the approval happen before, and keep the record automatically.

### 7. The Git commands you need

Eight commands cover the whole week. Say the commit message rule once: it says why, not what ("Shorten the greeting for the dashboard", not "edit main.py"). The what is in the diff.

### 8. Lab 1: your first change, on a branch

Everyone works on their own VM, with their own branch and change; conflicts are Lab 4's problem. If a push asks for a password, it is the studentNN password from cat /etc/pelab/logins.md.

### 9. Pull requests and reviews: what good looks like

Show a pull request on screen: the Files tab, the Conversation tab, the checks, the Approve button. Point out how little effort the review takes when the change is small. That is why the platform encourages many small changes over one big release.

### 10. Lab 2: review, approve, merge, and watch it go live

The wait between merge and live is the pipeline building the image (Day 5) and Argo CD noticing (Day 6). Use the wait to explain the next slide. If two delegates in a team merge within minutes of each other, the second one simply replaces the first in dev; that is correct behaviour.

### 11. GitOps: Git says what should run

Keep this to five minutes; Day 6 goes deeper. The idea to land: in a regulated environment, "nobody logs in to deploy" is both safer and easier to evidence than any manual process.

### 12. Lab 3: try to break the rules

This is the brief's "compromised inputs are blocked" at the simplest level. Delegates who see the refusals trust the control more than those who only hear about it. Then make the honest point: they have a reviewer login so they can play the second person, and signing in as reviewer gets an approval through. The tool checks accounts, not people; that is why at work accounts are personal, protected by two-factor sign-in, and never shared.

### 13. Lab 4: resolve a merge conflict

Conflicts frighten beginners; doing one on purpose removes the fear. The lesson for later: small changes merged often rarely conflict.

### 14. Platform as a product

This is the brief's Lab 2, done lightly. The point is to practise thinking of the platform as something with customers.

### 15. What makes a platform a product

Make this concrete with the lab: the instructors are the platform team, the delegates are the users, the service levels can be measured this week (time from merge to live in dev, time from template to a running service).

### 16. Lab 5: write your one-page platform charter

The charter comes back in the Day 6 capstone presentation. Push everyone towards measurable promises; "fast" is not a promise, "within 15 minutes" is.

### 17. Scenario: straight to production

Three views of the same control. Delegates saw the first one in Lab 3; the second is their Lab 2; the third is the brief's "evidence by default" principle made concrete.

### 18. Check your understanding

Answers. 1: A commit saves a snapshot on your machine; a push sends your branch to Gitea. 2: Segregation of duties; a second person checks every change, and the record of who approved is kept. 3: The pipeline built and scanned the image, and Argo CD saw that main changed and deployed it. 4: A revert pull request (leaves a record) or a new fix pull request (also a record); changing the cluster by hand would be undone by Argo CD and leaves no Git record. 5: Users and jobs, owner, promises, measures, feedback and roadmap.

### 19. What we built today

Today's pieces: Repository and GitOps. Tomorrow adds Environments.
