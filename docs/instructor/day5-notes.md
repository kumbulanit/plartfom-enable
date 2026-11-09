# Day 5 instructor guide: CI/CD, testing and security

Deck: `Day5-CICD-testing-and-security.pptx`. Delegates follow the handbook (Gitea `platform/handbook`, page day5/README.md), which has every lab step by step. If Argo CD gives trouble, see [safety-net.md](safety-net.md).

## Before the day

- [ ] The morning checks in the run-book (portal, a workspace, a dev address, Argo CD, Grafana), on every VM: ansible pelab -m ping first. 30 minutes before the start.
- [ ] Kyverno is running on every VM: ansible pelab -b -a "k3s kubectl -n kyverno get pods"
- [ ] Today each delegate approves their own exception requests as platform-approver, as on Day 3. Before Lab 5, show on your demo VM what the platform team checks in an exception (Lab 5, step 4).
- [ ] The latest commit of platform/policies shows a green platform/apply "3 policies, 0 exceptions in force".

## The day, hour by hour

| Time | What | Slides | Notes |
| --- | --- | --- | --- |
| 09:00 | Opening | 1-2 |  |
| 09:15 | CI/CD and DevSecOps; the pipeline file | 3-6 | Open the real ci.yaml beside slide 6. |
| 10:00 | Lab 1: read the pipeline and its evidence | 7 |  |
| 10:30 | Break |  |  |
| 10:45 | Lab 2: break the pipeline three ways, and fix it | 8-9 | Red runs are the point. Read one failing log together. |
| 11:40 | Policy-as-code: what a guardrail looks like | 10-12 |  |
| 12:20 | Lunch |  |  |
| 13:05 | Lab 3: watch the guardrails refuse a bad deployment | 13 |  |
| 13:40 | Lab 4: test a policy like code | 14 |  |
| 14:05 | Scenarios; exceptions as code | 15-17 |  |
| 14:30 | Break |  |  |
| 14:45 | Lab 5: ask for an exception, and watch it expire | 18 | Two approvals per delegate, as platform-approver. |
| 15:25 | Close: quiz and recap | 19-20 |  |
| 15:45 | Check-off and questions |  |  |

## What you do yourself

Each delegate built their own VM, and its passwords are on it. `ansible pelab ...` commands run from your machine, in `prelab-setup/`, after `export ANSIBLE_INVENTORY=inventory/all-vms.yml` (pelab05 instead of pelab reaches one VM). `ansible-playbook ...` commands run on the VM they are for, in `~/plartfom-enable/prelab-setup`, with `-K`. Without SSH to the VMs, the delegate runs the command on their VM with `sudo` in front.

**Lab 2.** Expect red runs: they are the point. Each delegate must see all three failures: the wrong test, the password, and USER root.

**Lab 5, step 4: before the delegates approve.** On your demo VM, show what the platform team checks in an exception: the file is exceptions/team01-status-page.yaml only; the name and namespace are the team's own; requested-by is the delegate; the reason makes sense; the end date is at most 30 days ahead; and the test pipeline is green. Two minutes after the merge, the commit shows "3 policies, 1 exceptions in force". *(Gitea on your demo VM, as platform-approver)*

**Lab 5, step 6.** Each delegate sets their end date to yesterday and approves it as platform-approver; the check reports it as ended and stays green. The next platform/apply says "expired, not applied: team01-status-page".

**End of the day.** Each VM backs itself up every night: nothing to copy. Remind everyone to push their work: anything only in a workspace is not backed up. Next morning, check last night's backup is there on every VM. *(Your machine, every VM)*

```bash
ansible pelab -b -m ansible.builtin.shell -a "ls -1t /opt/pelab/backups | head -1"
```

## Watch for

| What you see | What to do |
| --- | --- |
| Everything shows as skipped in kyverno apply | The --values-file tests/values.yaml part is missing. |
| The status page is still refused after the merge | Wait for platform/apply (two minutes). Then check the namespace and the names in the exception match the deployment. |
| A delegate committed a changed examples/ file | The policy tests then fail. Undo it: git checkout examples/ and push again. The labs work on copies in the home folder. |

## End of the day

- [ ] Every delegate's exception is ended, and its status-page deployment deleted.
- [ ] Everyone pushed their work.
- [ ] Check-off sheet updated.

## Labs today

| Lab | Time |
| --- | --- |
| Lab 1: read the pipeline and its evidence | 30 min |
| Lab 2: break the pipeline three ways, and fix it | 45 min |
| Lab 3: watch the guardrails refuse a bad deployment | 35 min |
| Lab 4: test a policy like code, with the Kyverno CLI | 25 min |
| Lab 5: ask for an exception, and watch it expire | 25 min · on your own |

## Slide by slide

The same notes are in the deck's speaker notes; quiz answers are under the quiz slide.

### 1. CI/CD, testing and security

The pipeline has run on every change since Day 2. Today the delegates read it, break it, fix it, and then meet the policies that guard the cluster. This is the brief's Lab 5 (secure CI/CD and supply chain) and Lab 6 (policy-as-code) at a beginner level.

### 2. Today's goal

Today has the most scenarios of any day. Each one is a story: an everyday mistake, caught before production.

### 3. Today's plan

The pipeline has run on every change since Day 2; today they read it. Lab 2 is the favourite: three mistakes, three red pipelines, three fixes.

### 4. CI/CD in plain words

The brief defines CI/CD as workflows that "enforce least privilege, separation of duties, reusable controls, evidence capture, controlled promotion and deterministic rollback". Map each to the lab as you go through the day.

### 5. What the pipeline does on every change

Say what each step would catch: lint catches sloppy code, tests catch broken behaviour, the secret scan catches passwords, the Dockerfile check catches unsafe images, the scan catches known vulnerabilities, and the push only happens for reviewed code on main.

### 6. DevSecOps and the software supply chain

The brief's Lab 5 lists: test gates, dependency scanning, secret detection, SBOM, signing, provenance, promotion, exception handling. All but provenance appear today; signing is an optional exercise.

### 7. The pipeline file, shortened

Open the real ci.yaml beside this slide. Delegates do not need to write pipelines in this course; they need to read one, know what each step guards against, and know where to look when it fails.

### 8. Lab 1: read the pipeline and its evidence

Most delegates have never looked inside an image. The SBOM makes the supply chain real: they can see that most of the image is not their code. Discuss what a "critical" finding in the base image would mean and who fixes it (the platform team updates the base image in the template; every service gets the fix on its next build).

### 9. Lab 2: break the pipeline three ways, and fix it

Each failure is a story from the scenarios slide. Make the point in step 4: the scan caught the secret before merge, so it never reached main; if it had, the password would need changing, because Git never forgets. That is why the check runs on the pull request, not after.

### 10. Testing basics, for people who are not developers

Non-developers in the room should leave able to read a test and a test failure, and to ask "where is the test for this?" in a review. That is enough.

### 11. Policy-as-code

The pipeline guards what gets built. Policies guard what gets to run. Both are code.

### 12. Policy-as-code in plain words

Brief Lab 6 pass criteria: "policies are deterministic, versioned, tested and produce usable remediation guidance". Each of the four words maps to a bullet on this slide. Mention that the same idea applies to cost rules, naming rules and data rules; the lab shows three security rules because they are the easiest to see.

### 13. What a policy looks like: the trusted-registry rule

Read the plain-words comment first, then the YAML. Delegates do not write policies in this course; they read one, test one with the CLI, and see what it does to a bad deployment.

### 14. Lab 3: watch the guardrails refuse a bad deployment

The refusals come with fix-it messages, which is the point: a guardrail that only says "no" sends people around it. Each message names the rule, so an exception request can name it too.

### 15. Lab 4: test a policy like code, with the Kyverno CLI

This is the brief's "policy source, tests, decision log" evidence in miniature: the policy files, the good and bad test cases, and the CLI output. The policies live in platform/policies; its pipeline runs kyverno test tests/ on every pull request, and the platform applies main to the cluster within two minutes. Why the values file: the policies only apply in namespaces labelled pelab.io/tier=team; the cluster knows the labels, the command line does not.

### 16. Scenarios and exceptions

Recap the morning in the scenarios, then the exception: a real platform needs a safe way to say yes.

### 17. Scenarios: everyday mistakes the pipeline catches

Delegates have now done scenarios 1 and 5 themselves in Lab 2 and seen scenario 4 in Lab 1. Ask the room for a real story that matches each one.

### 18. Scenarios: what the guardrails do

Scenario 7 is the brief's "waiver workflow", and Lab 5 does it for real. The brief's section 8.4 lists what an exception must record: scope, rationale, affected assets, residual risk, compensating controls, owner, approver, expiry and remediation plan. The lab's request carries the core of that (who, why, which rule, which workload, until when) and the pipeline refuses a request without them.

### 19. Saying yes safely: exceptions

This closes the policy-as-code story. Governance people in the room will recognise their own exception register; the difference is that here the register is the mechanism, not a spreadsheet next to it.

### 20. Lab 5: ask for an exception, and watch it expire

Every step here was rehearsed on Kyverno 1.19. In step 6 the delegate opens the pull request that ends their exception and approves it as platform-approver: Gitea does not let anyone approve their own pull request, and only the platform team (pelab-admin, or the delegate playing platform-approver) may approve here. The check accepts a date in the past (it reports the exception as ended). The point of the last step: an expired exception does not switch anything off, it stops anything new from starting, so the team must fix the root cause before its next release. The platform applier removes expired exceptions on its own; the commit status names them ("expired, not applied: ..."). Exceptions only count in the pelab-exceptions namespace, which only the platform writes to, so a delegate cannot grant themselves one with kubectl.

### 21. Check your understanding

Answers. 1: CI merges and checks every change at once; CD packages every checked change so it can be deployed at any time. 2: Any three of: lint (sloppy code), tests (broken behaviour), secret scan (passwords), Dockerfile check (unsafe images), image scan (known vulnerabilities). 3: The ingredients list of an image; "are we affected by this vulnerability?" 4: It is a file in Git, reviewed, tested with good and bad examples, enforced automatically, with an explainable message. 5: A scope, a reason, an approver and an end date; without the end date it is a permanent change to the rule.

### 22. What we built today

Every piece of the platform except Observe has now been used and explained. Tomorrow completes the path and the course.
