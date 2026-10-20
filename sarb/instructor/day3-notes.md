# Day 3 instructor guide: Infrastructure as Code from a template

Deck: `Day3-Infrastructure-as-Code.pptx`. Delegates follow the handbook (Gitea `platform/handbook`, page day3.md), which has every lab step by step. If Argo CD gives trouble, see [safety-net.md](safety-net.md).

## Before the day

- [ ] The morning checks in the run-book (portal, a workspace, a dev address, Argo CD, Grafana, and the lab server lines). 30 minutes before the start.
- [ ] Sign in to Gitea as pelab-admin (credentials/gitea-admin.txt) in a private window. Today the platform team approves environment requests: you, or a delegate playing the platform team as platform-approver (its login is on every access sheet). Decide which before Lab 2 and tell the room; either way, read each plan with the team.
- [ ] On the lab server, the applier says "Up to date": sudo journalctl -u pelab-platform-apply.service -n 5 --no-pager
- [ ] No team has staging or prod yet: Argo CD shows teamNN-hello-staging and -prod retrying. That is expected.

## The day, hour by hour

| Time | What | Slides | Notes |
| --- | --- | --- | --- |
| 09:00 | Opening | 1-2 |  |
| 09:15 | Infrastructure as Code; how this lab was built | 3-5 | Show the lab's own Ansible project (site.yml, roles/, versions.yml). Do not run it. |
| 10:00 | Lab 1: plan, apply, change, destroy | 6-7 | Type the file live on slide 6 first. |
| 10:40 | Break |  |  |
| 10:55 | Environments from a template; how a request becomes an environment | 8-9 |  |
| 11:30 | Lab 2: request staging and prod from the template | 10 | One driver per team. You, or each team as platform-approver, approve five pull requests. |
| 12:30 | Lunch |  |  |
| 13:15 | What happened when you merged | 11 |  |
| 13:30 | Lab 3: drift, and destroy and recreate | 12 | You pause the repairs and change the quotas (actions below). You, or the teams as platform-approver, approve ten pull requests. |
| 14:15 | Break |  |  |
| 14:30 | Budgets: FinOps starts in the template | 13-14 |  |
| 15:00 | Close: quiz and recap | 15-16 |  |
| 15:30 | Check-off and questions |  |  |

## What you do yourself

Commands for the lab server run there over SSH (`ssh labadmin@<server>`); the others on the control machine, in `pe-lab-ansible/`.

**Lab 2, step 4: approve each team's request.** In platform/environments → Pull Requests, open each one. Files Changed must show one new file, teamNN.tf, with the team's own name in both places, environments ["staging", "prod"] and size "small". Open its plan run: "Plan: 16 to add, 0 to change, 0 to destroy". Then Review → Approve. If anything else changes, or the plan destroys something, choose Request Changes and say why. If the teams approve as platform-approver, walk one team through these checks first. *(Gitea, as pelab-admin or platform-approver)*

**Lab 2, after the merges.** Each merge commit gets a green platform/apply within two minutes. If one does not after five minutes, read the applier's log, fix the cause, and run it again. *(Lab server)*

```bash
sudo journalctl -u pelab-platform-apply.service -n 50 --no-pager
sudo systemctl start pelab-platform-apply.service
```

**Lab 3, step 1: cause the drift.** Pause the platform's repairs first, or it may put the quotas back before the teams run their plan. Then raise every team's staging CPU budget by hand. *(Lab server)*

```bash
sudo systemctl stop pelab-platform-apply.timer
for t in team01 team02 team03 team04 team05; do
  sudo k3s kubectl -n $t-staging patch resourcequota team-quota --type merge -p '{"spec":{"hard":{"requests.cpu":"5"}}}'
done
```

**Lab 3, after step 2 (every team has seen "1 to change").** Switch the repairs back on. The quotas return to the code's value within two minutes. *(Lab server)*

```bash
sudo systemctl start pelab-platform-apply.timer pelab-platform-apply.service
```

**Lab 3, steps 4 and 5.** Approve each team's "remove staging" pull request (its plan says 8 to destroy: expected in this lab, and only for staging), then its "add staging back" pull request (8 to add). *(Gitea, as pelab-admin)*

**End of the day.** Copy tonight's backup to the control machine (it takes a fresh one first). *(Control machine)*

```bash
ansible-playbook backup.yml
```

## Watch for

| What you see | What to do |
| --- | --- |
| The plan pipeline fails with an access error | Its read-only credentials are stale (for example after a cluster rebuild): ansible-playbook site.yml --tags golden_path |
| "Invalid value for variable" in the plan | The team name, environment list or size is wrong. The message says which. |
| A team approved its own request as studentNN | It does not count: only pelab-admin or platform-approver may approve here. Approve it yourself, or let a team member sign in as platform-approver in a private window. |

## End of the day

- [ ] Every team has teamNN-staging and teamNN-prod (Argo CD: staging and prod Synced, 0 replicas).
- [ ] The applier timer is running again: systemctl list-timers pelab-platform-apply.timer
- [ ] Backup copied.
- [ ] Check-off sheet updated.

## Labs today

| Lab | Time |
| --- | --- |
| Lab 1: plan, apply, change, destroy | 30 min |
| Lab 2: request staging and prod from the template | 45 min · per team |
| Lab 3: drift, and destroy and recreate | 30 min |

## Slide by slide

The same notes are in the deck's speaker notes; quiz answers are under the quiz slide.

### 1. Infrastructure as Code from a template

Today the delegates get their staging and prod environments. Not from the instructor, and not from a ticket: from a template, by pull request, with an approval. The morning teaches the idea with a tiny OpenTofu exercise; the afternoon uses the real environment template.

### 2. Today's goal

The outcome that matters for the brief is the third: a "secure landing zone" provisioned from reusable modules, repeatably, with evidence (the plan) and a teardown (destroy).

### 3. Infrastructure as Code in plain words

The four words to land: plan, apply, destroy, drift. Use a bank analogy: a standing instruction versus phoning the branch each month. The brief asks for "repeatable deployment", "no critical control failure" and "environment can be safely destroyed and recreated"; all three come directly from this way of working.

### 4. The Infrastructure as Code loop

init downloads the providers (the plug-ins that know how to talk to Kubernetes, a cloud, or a file system). plan is read-only. apply changes things. destroy is the undo. Say clearly that destroy is a feature, not a danger: environments that can be destroyed and recreated are environments nobody is afraid to change.

### 5. Why a bank wants infrastructure as code

Keep the demo to the structure: show site.yml, the roles folder and versions.yml. Do not run it (it takes a long time and disrupts the lab). The lesson: everything they use this week was created from code, which is why it can be reset between cohorts.

### 6. Your first OpenTofu file: five lines that create a file

Type it live, slowly. The point is the shape of every IaC file: providers, then resources with settings. The environment template this afternoon has the same shape, with Kubernetes resources instead of a file.

### 7. Lab 1: plan, apply, change, destroy

Step 5: a file cannot be edited in place, so the plan shows -/+ (replace). This afternoon's quota changes in place (~): read the symbol, not only the summary. Step 6 is the drift demonstration in miniature. If tofu init cannot download the provider, the lab's provider mirror is not reachable; the lab assistant checks the dry-run notes. Everything here runs inside the workspace and touches nothing shared.

### 8. Environments: dev, staging and prod

Make the governance point: prod being read-only for people is not distrust, it is the brief's "least privilege" and "controlled promotion". Deployments to prod happen through Git and Argo CD, which keeps the evidence.

### 9. The environment template

This is "architecting a golden path" for infrastructure: the hard, risky part (what a safe environment looks like) is done once by the platform team and reviewed by security; the easy part (asking for one) is left to the teams. Compare with the ticket: a form that goes to a person who does it by hand, differently each time.

### 10. Lab 2: request staging and prod from the template

One pull request per team, driven by one delegate with the others reading the plan. The plan is the evidence the brief asks for in Lab 3: a design record of exactly what will be created. A teammate cannot approve: only the platform team can (Gitea approval whitelist: pelab-admin and, for role-play, platform-approver), which is the separation of duties the brief requires for infrastructure. Keep the pull request link and the platform/apply status for the evidence pack. If the plan fails with "Invalid value for variable", the message says exactly what to fix (team name, environments or size).

### 11. Who may change the cluster

This is a deliberate design choice worth explaining to a bank audience: if the pipeline that runs on a pull request could change the cluster, anyone who can open a pull request could change the cluster by editing the pipeline. Keeping the write credentials with the platform, and applying only what is approved on main, is the pattern behind tools like Atlantis and Argo CD.

### 12. Lab 3: drift, and destroy and recreate

Before step 1, pause the platform's repairs on the lab server (sudo systemctl stop pelab-platform-apply.timer), or it may put the quota back before the teams run their plan. Change every team's quota, let them do step 2, then start it again (sudo systemctl start pelab-platform-apply.timer pelab-platform-apply.service) for step 3. The day guide has the commands. This is the brief's pass criterion for Lab 3: "environment can be safely destroyed and recreated". The drift step is the brief's "drift detection" from the IaC product standard. Point out that the plan for a destroy is the safest possible review: the reviewer sees the blast radius before approving.

### 13. Budgets: FinOps starts in the template

The brief's FinOps outcome is mostly beyond this course, but budgets are where it starts: allocation, unit cost and waste detection all need a budget per team and environment first. OpenCost is an optional extra in the lab for a later module.

### 14. What the plan tells a reviewer, and an auditor

Teach delegates to read the summary line first (x to add, y to change, z to destroy) and only then the detail. A reviewer who sees "to destroy" on a prod environment asks questions before approving.

### 15. Check your understanding

Answers. 1: plan shows what would change without changing it; apply changes it. The plan attached to the approved pull request is the audit evidence. 2: Reality differing from the code; the plan showed the hand-edited quota as a change, apply restored it. 3: The platform team put the correct, security-reviewed definition in the module once; teams only choose what varies. 4: Least privilege; deployments to prod go through Git and Argo CD, which keep the evidence. 5: The CPU and memory budget of each environment; the cost of a choice is known before anything runs and fairness between teams is enforced.

### 16. What we built today

Each team now has three environments. Tomorrow the app gets packaged so that the same image can run in all three.
