# PE Lab handbook

Every lab of the Platform Engineering Capability Development Programme, step by step, with what you should see after each step and what to do if you are stuck. Keep it open in a browser tab next to your workspace.

## Your accounts

Your access sheet has your user name (`studentNN`), your team and your password. One password opens your workspace, Gitea and Harbor. The portal, Argo CD and Grafana open without signing in, read-only.

| What | Address |
| --- | --- |
| Your workspace (editor and terminal) | https://studentNN.<lab domain> |
| Portal: catalog and templates | https://backstage.<lab domain> |
| Git, pull requests, pipelines | https://gitea.<lab domain> |
| Images, scan reports, SBOMs | https://harbor.<lab domain> |
| Deployments | https://argocd.<lab domain> |
| Dashboards and logs | https://grafana.<lab domain> |
| Environment requests (Day 3) | https://gitea.<lab domain>/platform/environments |
| Guardrails and exceptions (Day 5) | https://gitea.<lab domain>/platform/policies |

## The days

| Day | Goal |
| --- | --- |
| [Day 1: Platform engineering and Linux basics](day1.md) | Understand what a platform and an Internal Developer Platform are, and be at home on a Linux command line. |
| [Day 2: Git and working together](day2.md) | Every change goes through Git, a pull request and a review, and the approved change goes live in dev by itself. |
| [Day 3: Infrastructure as Code from a template](day3.md) | Describe infrastructure in code, read a plan, and request your team's staging and prod environments from the environment template. |
| [Day 4: Containers and the packaging template](day4.md) | Build and run a container, and create a new service from the packaging template without a ticket. |
| [Day 5: CI/CD, testing and security](day5.md) | Read a pipeline and its results, fix a failing check, and explain how guardrails and evidence protect production. |
| [Day 6: Deploy, observe and the capstone](day6.md) | Release to staging and prod through Git, read the dashboard, recover from a bad change, and present your service with its evidence. |

Each day runs 09:00 to 16:00: concepts and a live demo, then hands-on labs, then a short quiz. Words you do not know are in the [glossary](glossary.md).

## How to use this handbook

- Every lab is written out step by step. Each step says where you work (your workspace terminal, Gitea, Argo CD...), what to do and why, the commands to paste, and what you should see.
- Open a terminal in your workspace with the menu (☰) → Terminal → New Terminal. Paste with Ctrl+V or right-click → Paste. A second terminal: the + button at the top right of the terminal panel.
- Your workspace knows who you are. `$ME` is your user name, `$TEAM` your team and `$DOMAIN` the lab's domain, so the commands work as pasted. Try `echo "$ME $TEAM $DOMAIN"`.
- In addresses you type into the browser, replace `teamNN` with your team and `studentNN` with your user name, for example `team03` and `student12`.
- If your instructor says the safety net is on, Argo CD is paused and the platform deploys for it. Work exactly as written; where a step says to look at Argo CD, look at the commit in Gitea instead: click the tick next to it and read `safety-net/dev`, `safety-net/staging` or `safety-net/prod`.

## Working on the platform, in five verbs

1. **Find**: open the portal and see your team, its services, who owns them and where they run.
2. **Create**: make a new service or request an environment from a template. A few values, no ticket.
3. **Change**: edit on a branch, open a pull request, get one approval, merge.
4. **Ship**: the pipeline checks and builds; Argo CD deploys to dev, and to staging and prod after an approved promotion.
5. **Watch**: the dashboard shows versions, traffic, errors and logs per environment.

## When something does not work

1. Read the message: most refusals on this platform say what to fix.
2. Look at "If you are stuck" under the lab.
3. Ask your team, then the lab assistant. Nothing you do in your workspace can break anyone else's.
