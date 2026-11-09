# PE Lab handbook

Every lab of the Platform Engineering Capability Development Programme, step by step, with what you should see after each step and what to do if you are stuck. Keep it open in a browser tab next to your workspace.

## Your accounts

You have a virtual machine of your own, with the whole platform on it: nobody else works on it, and nothing you do there can affect anyone else. Your logins are in one file on it, `/etc/pelab/logins.md`; your instructor shows you how to open it on Day 1, and once your workspace is open you can print it at any time with `cat /etc/pelab/logins.md`. Your own password (user `studentNN`) opens your workspace, Gitea and Harbor. Argo CD and Grafana take a read-only login, user `delegate`, with its own password in the same file. The portal needs no password: sign in as guest.

| What | Address | Sign in as |
| --- | --- | --- |
| Your workspace (editor and terminal) | https://studentNN.<lab domain> | studentNN |
| Portal: catalog and templates | https://backstage.<lab domain> | guest |
| Git, pull requests, pipelines | https://gitea.<lab domain> | studentNN |
| Images, scan reports, SBOMs | https://harbor.<lab domain> | studentNN |
| Deployments (read-only) | https://argocd.<lab domain> | delegate (shared) |
| Dashboards and logs (read-only) | https://grafana.<lab domain> | delegate (shared) |
| Environment requests (Day 3) | https://gitea.<lab domain>/platform/environments | studentNN |
| Guardrails and exceptions (Day 5) | https://gitea.<lab domain>/platform/policies | studentNN |

## The days

| Day | Goal |
| --- | --- |
| [Day 1: Platform engineering and Linux basics](day1/README.md) | Understand what a platform and an Internal Developer Platform are, and be at home on a Linux command line. |
| [Day 2: Git and working together](day2/README.md) | Every change goes through Git, a pull request and a review, and the approved change goes live in dev by itself. |
| [Day 3: Infrastructure as Code from a template](day3/README.md) | Describe infrastructure in code, read a plan, and request your own staging and prod environments from the environment template. |
| [Day 4: Containers and the packaging template](day4/README.md) | Build and run a container, and create a new service from the packaging template without a ticket. |
| [Day 5: CI/CD, testing and security](day5/README.md) | Read a pipeline and its results, fix a failing check, and explain how guardrails and evidence protect production. |
| [Day 6: Deploy, observe and the capstone](day6/README.md) | Release to staging and prod through Git, read the dashboard, recover from a bad change, and present your service with its evidence. |

Each day has concepts and a live demo, then hands-on labs, then a short quiz. Words you do not know are in the [glossary](glossary.md).

## How to use this handbook

**New to all of this? Read [Start here](start-here.md) first.** It is written for someone who has never typed a command: what the workspace looks like, how to paste a command and press Enter, how to tell it has finished, how to read each part of a lab, and what to do when something goes wrong.

- Every lab is written out step by step, for someone who has never done it before. A lab starts with what you will learn, the words you will meet and what you need before you start. Then each step gives:
  - **Where** you work (your workspace terminal, Gitea, Argo CD...) and **Why** you do it;
  - **Do this**: every click and key, numbered;
  - the commands to paste, in a grey box with a copy button, and **What each line does**;
  - **What changes**, before and after, when you edit a file;
  - **You should see**: the real output, and **How to read it**;
  - **If you see something else**: the usual surprises and what to do about each.
- Open a terminal in your workspace with the menu (☰) → Terminal → New Terminal. Paste with Ctrl+V or right-click → Paste. A second terminal: the + button at the top right of the terminal panel.
- Your workspace knows who you are. `$ME` is your user name, `$TEAM` your team name (every delegate is a team of one) and `$DOMAIN` the lab's domain, so the commands work as pasted. Try `echo "$ME $TEAM $DOMAIN"`.
- In addresses you type into the browser, replace `teamNN` with your team name and `studentNN` with your user name, for example `team03` and `student12`.
- **You work alone, and play the second person.** A few steps need someone else: a reviewer who approves your change, or the platform team who approves your request. You play them: open a private window (Ctrl+Shift+N; on a Mac Cmd+Shift+N; Firefox Ctrl+Shift+P), sign in to Gitea as `reviewer` or as `platform-approver` with the password from `cat /etc/pelab/logins.md`, do the step, and close the window. At work you never share a login, and the second person is a real colleague; here it is role-play, so every step can be done alone.
- If your instructor says the safety net is on, Argo CD is paused and the platform deploys for it. Work exactly as written; where a step says to look at Argo CD, look at the commit in Gitea instead: click the tick next to it and read `safety-net/dev`, `safety-net/staging` or `safety-net/prod`.

## Working on the platform, in five verbs

1. **Find**: open the portal and see your services, who owns them and where they run.
2. **Create**: make a new service or request an environment from a template. A few values, no ticket.
3. **Change**: edit on a branch, open a pull request, get one approval, merge.
4. **Ship**: the pipeline checks and builds; Argo CD deploys to dev, and to staging and prod after an approved promotion.
5. **Watch**: the dashboard shows versions, traffic, errors and logs per environment.

## When something does not work

1. Read the message: most refusals on this platform say what to fix.
2. Look at "If you are stuck" under the lab.
3. Ask your neighbour, then the lab assistant. Nothing you do in your workspace can break anyone else's.

## The code behind the labs

In the course repository (`plartfom-enable/labs`), each day's folder holds its instructions (`README.md`) and the code the platform puts in Gitea when the lab is built. Files ending in `.j2` are filled in for the lab at that point (its domain, its teams). In the lab, open the Gitea repositories instead.

| Day | Folder | In the lab |
| --- | --- | --- |
| 1, and every day after | `day1/golden-path/` | `platform/golden-path`: the template every team's `hello` and every new service is made from (the app, its tests, the Dockerfile, the pipeline, the deployments) |
| 3 | `day3/environments/` | `platform/environments`: the environment requests (OpenTofu) and their plan pipeline |
| 4 | `day4/catalog/` | `platform/catalog`: what the portal (Backstage) shows |
| 5 | `day5/policies/` | `platform/policies`: the guardrails' tests, examples and exception requests |
| 5 | `day5/guardrails.yaml.j2` | The three guardrails the platform enforces (one file each in `platform/policies/policies/`) |
| 6 | `day6/dashboard/golden-path.json` | The Golden path dashboard in Grafana |
