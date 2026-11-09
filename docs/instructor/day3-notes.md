# Day 3 instructor guide: Infrastructure as Code from a template

Deck: `Day3-Infrastructure-as-Code.pptx`. Delegates follow the handbook (Gitea `platform/handbook`, page day3/README.md), which has every lab step by step. If Argo CD gives trouble, see [safety-net.md](safety-net.md).

## Before the day

- [ ] The morning checks in the run-book (portal, a workspace, a dev address, Argo CD, Grafana), on every VM: ansible pelab -m ping first. 30 minutes before the start.
- [ ] Today each delegate approves their own environment request as the platform team, signed in as platform-approver in a private window. Before Lab 2, show on your demo VM what the platform team checks in a request (Lab 2, step 4).
- [ ] On every VM, the applier says "Up to date": ansible pelab -b -a "journalctl -u pelab-platform-apply.service -n 5 --no-pager"
- [ ] Nobody has staging or prod yet: Argo CD shows team01-hello-staging and -prod retrying. That is expected.

## The day, hour by hour

| Time | What | Slides | Notes |
| --- | --- | --- | --- |
| 09:00 | Opening | 1-2 |  |
| 09:15 | Infrastructure as Code; how this lab was built | 3-5 | Show the lab's own Ansible project (site.yml, roles/, versions.yml). Do not run it. |
| 10:00 | Lab 1: plan, apply, change, destroy | 6-7 | Type the file live on slide 6 first. |
| 10:40 | Break |  |  |
| 10:55 | Environments from a template; how a request becomes an environment | 8-9 |  |
| 11:30 | Lab 2: request staging and prod from the template | 10 | Each delegate approves their own request as platform-approver. Walk round and read a few plans with them. |
| 12:30 | Lunch |  |  |
| 13:15 | What happened when you merged | 11 |  |
| 13:30 | Lab 3: drift, and destroy and recreate | 12 | You pause the repairs and change the quotas on every VM (actions below). Each delegate approves their two pull requests as platform-approver. |
| 14:15 | Break |  |  |
| 14:30 | Budgets: FinOps starts in the template | 13-14 |  |
| 15:00 | Close: quiz and recap | 15-16 |  |
| 15:30 | Check-off and questions |  |  |

## What you do yourself

Each delegate built their own VM, and its passwords are on it. `ansible pelab ...` commands run from your machine, in `prelab-setup/`, after `export ANSIBLE_INVENTORY=inventory/all-vms.yml` (pelab05 instead of pelab reaches one VM). `ansible-playbook ...` commands run on the VM they are for, in `~/plartfom-enable/prelab-setup`, with `-K`. Without SSH to the VMs, the delegate runs the command on their VM with `sudo` in front.

**Lab 2, step 4: before the delegates approve.** On your demo VM, show what the platform team checks before approving: Files Changed shows one new file, team01.tf, with the team's name in both places, environments ["staging", "prod"] and size "small"; the plan run says "Plan: 16 to add, 0 to change, 0 to destroy". If anything else changes, or the plan destroys something, the platform team chooses Request Changes and says why. *(Gitea on your demo VM, as platform-approver)*

**Lab 2, after the merges.** Each merge commit gets a green platform/apply within two minutes. If one does not after five minutes, read that VM's applier log (here pelab05), fix the cause, and run it again. *(Your machine, one VM)*

```bash
ansible pelab05 -b -a "journalctl -u pelab-platform-apply.service -n 50 --no-pager"
ansible pelab05 -b -a "systemctl start pelab-platform-apply.service"
```

**Lab 3, step 1: cause the drift.** Pause the platform's repairs on every VM first, or they may put the quota back before the delegates run their plan. Then raise every VM's staging CPU budget by hand. *(Your machine, every VM)*

```bash
ansible pelab -b -a "systemctl stop pelab-platform-apply.timer"
ansible pelab -b -m ansible.builtin.shell -a "k3s kubectl -n team01-staging patch resourcequota team-quota --type merge -p '{\"spec\":{\"hard\":{\"requests.cpu\":\"5\"}}}'"
```

**Lab 3, after step 2 (every delegate has seen their quota in the plan: 1 to change).** Switch the repairs back on, on every VM. The quotas return to the code's value within two minutes. *(Your machine, every VM)*

```bash
ansible pelab -b -a "systemctl start pelab-platform-apply.timer pelab-platform-apply.service"
```

**Lab 3, steps 4 and 5.** Each delegate approves their own "remove staging" pull request (its plan says 8 to destroy: expected in this lab, and only for staging), then their "add staging back" pull request (8 to add), as platform-approver. Remind them to read the plan before approving.

**End of the day.** Each VM backs itself up every night: nothing to copy. Remind everyone to push their work: anything only in a workspace is not backed up. Next morning, check last night's backup is there on every VM. *(Your machine, every VM)*

```bash
ansible pelab -b -m ansible.builtin.shell -a "ls -1t /opt/pelab/backups | head -1"
```

## Watch for

| What you see | What to do |
| --- | --- |
| The plan pipeline fails with an access error | Its read-only credentials are stale (for example after a cluster rebuild): ansible-playbook site.yml --tags golden_path -K, on that VM |
| "Invalid value for variable" in the plan | The team name, environment list or size is wrong. The message says which. |
| A delegate approved their request as studentNN or reviewer | It does not count: only pelab-admin or platform-approver may approve here. They sign in as platform-approver in a private window and approve again. |

## End of the day

- [ ] Every VM has team01-staging and team01-prod (Argo CD: staging and prod Synced, 0 replicas).
- [ ] The applier timer is running again on every VM: ansible pelab -b -a "systemctl is-active pelab-platform-apply.timer"
- [ ] Everyone pushed their work.
- [ ] Check-off sheet updated.

## Labs today

| Lab | Time |
| --- | --- |
| Lab 1: plan, apply, change, destroy | 30 min |
| Lab 2: request staging and prod from the template | 45 min · on your own |
| Lab 3: drift, and destroy and recreate | 30 min |

## Slide by slide

The same notes are in the deck's speaker notes; quiz answers are under the quiz slide.

### 1. Infrastructure as Code from a template

Today the delegates get their staging and prod environments. Not from the instructor, and not from a ticket: from a template, by pull request, with an approval. The morning teaches the idea with a tiny OpenTofu exercise; the afternoon uses the real environment template.

### 2. Today's goal

The outcome that matters for the brief is the third: a "secure landing zone" provisioned from reusable modules, repeatably, with evidence (the plan) and a teardown (destroy).

### 3. Today's plan

Same loop as yesterday (branch, pull request, review, merge), now for infrastructure. Lab 1 is a harmless warm-up; Lab 2 is the real request.

### 4. Infrastructure as Code in plain words

The four words to land: plan, apply, destroy, drift. Use a bank analogy: a standing instruction versus phoning the branch each month. The brief asks for "repeatable deployment", "no critical control failure" and "environment can be safely destroyed and recreated"; all three come directly from this way of working.

### 5. The Infrastructure as Code loop

init downloads the providers (the plug-ins that know how to talk to Kubernetes, a cloud, or a file system). plan is read-only. apply changes things. destroy is the undo. Say clearly that destroy is a feature, not a danger: environments that can be destroyed and recreated are environments nobody is afraid to change.

### 6. Why a bank wants infrastructure as code

Keep the demo to the structure: show site.yml, the roles folder and versions.yml. Do not run it (it takes a long time and disrupts the lab). The lesson: everything they use this week was created from code, which is why it can be reset between cohorts.

### 7. Your first OpenTofu file: five lines that create a file

Type it live, slowly. The point is the shape of every IaC file: providers, then resources with settings. The environment template this afternoon has the same shape, with Kubernetes resources instead of a file.

### 8. Lab 1: plan, apply, change, destroy

Step 5: a file cannot be edited in place, so the plan shows -/+ (replace). This afternoon's quota changes in place (~): read the symbol, not only the summary. Step 6 is the drift demonstration in miniature. If tofu init cannot download the provider, the lab's provider mirror is not reachable; the lab assistant checks the dry-run notes. Everything here runs inside the workspace and touches nothing shared.

### 9. Environments

Bridge from the warm-up: the file was harmless practice; the next plan creates real namespaces, quotas and access for the team.

### 10. Environments: dev, staging and prod

Make the governance point: prod being read-only for people is not distrust, it is the brief's "least privilege" and "controlled promotion". Deployments to prod happen through Git and Argo CD, which keeps the evidence.

### 11. The environment template

This is "architecting a golden path" for infrastructure: the hard, risky part (what a safe environment looks like) is done once by the platform team and reviewed by security; the easy part (asking for one) is left to the teams. Compare with the ticket: a form that goes to a person who does it by hand, differently each time.

### 12. Lab 2: request staging and prod from the template

One pull request per delegate, on their own VM. The plan is the evidence the brief asks for in Lab 3: a design record of exactly what will be created. Neither the delegate nor the reviewer login can approve: only the platform team can (Gitea approval whitelist: pelab-admin and, for role-play, platform-approver, which each delegate signs in as), which is the separation of duties the brief requires for infrastructure. Keep the pull request link and the platform/apply status for the evidence pack. If the plan fails with "Invalid value for variable", the message says exactly what to fix (team name, environments or size).

### 13. Who may change the cluster

This is a deliberate design choice worth explaining to a bank audience: if the pipeline that runs on a pull request could change the cluster, anyone who can open a pull request could change the cluster by editing the pipeline. Keeping the write credentials with the platform, and applying only what is approved on main, is the pattern behind tools like Atlantis and Argo CD.

### 14. Lab 3: drift, and destroy and recreate

Before step 1, pause the platform's repairs on every VM, or they may put the quota back before the delegates run their plan. Change every delegate's quota, let them do step 2, then start the repairs again for step 3. The day guide has the commands: one ansible line from your machine reaches every VM (or each delegate runs it with sudo on their own VM). This is the brief's pass criterion for Lab 3: "environment can be safely destroyed and recreated". The drift step is the brief's "drift detection" from the IaC product standard. Point out that the plan for a destroy is the safest possible review: the reviewer sees the blast radius before approving.

### 15. Budgets

Short topic, no lab: use the plans the teams already opened in Lab 2 as the examples.

### 16. Budgets: FinOps starts in the template

The brief's FinOps outcome is mostly beyond this course, but budgets are where it starts: allocation, unit cost and waste detection all need a budget per team and environment first. OpenCost is an optional extra in the lab for a later module.

### 17. What the plan tells a reviewer, and an auditor

Teach delegates to read the summary line first (x to add, y to change, z to destroy) and only then the detail. A reviewer who sees "to destroy" on a prod environment asks questions before approving.

### 18. Check your understanding

Answers. 1: plan shows what would change without changing it; apply changes it. The plan attached to the approved pull request is the audit evidence. 2: Reality differing from the code; the plan showed the hand-edited quota as a change, apply restored it. 3: The platform team put the correct, security-reviewed definition in the module once; teams only choose what varies. 4: Least privilege; deployments to prod go through Git and Argo CD, which keep the evidence. 5: The CPU and memory budget of each environment; the cost of a choice is known before anything runs and fairness between teams is enforced.

### 19. What we built today

Each delegate now has three environments. Tomorrow the app gets packaged so that the same image can run in all three.
