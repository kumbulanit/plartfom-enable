# Day 1 instructor guide: Platform engineering and Linux basics

Deck: `Day1-Platform-engineering-and-Linux-basics.pptx`. Delegates follow the handbook (Gitea `platform/handbook`, page day1.md), which has every lab step by step. If Argo CD gives trouble, see [safety-net.md](safety-net.md).

## Before the day

- [ ] The morning checks in the run-book (portal, a workspace, a dev address, Argo CD, Grafana, and the lab server lines). 30 minutes before the start.
- [ ] Print the access sheets (credentials/access/student01.md to student25.md), one per delegate, in team order. Keep student26 aside as the spare; student27 is your demo workspace (setup guide, Part 5).
- [ ] One A3 sheet and markers per team for Lab 1.
- [ ] Know who sits in which team: student01-05 are team01, student06-10 team02, and so on.
- [ ] Open the portal, Gitea and Argo CD on the presenter screen, signed in as pelab-admin in a private window (you approve on Days 3 and 5).

## The day, hour by hour

| Time | What | Slides | Notes |
| --- | --- | --- | --- |
| 09:00 | Welcome; hand out the access sheets | 1-3 | Everyone opens the portal and their workspace before you go on. Count the workspaces that loaded. |
| 09:30 | Platform engineering and the IDP | 4-9 | The mini platform (slide 6) comes back every day: trace one change through it slowly. |
| 10:30 | Break |  |  |
| 10:45 | Lab 1: map how a change reaches production | 10 | 45 minutes in teams, then two minutes per team. Write each team's bottleneck on the board. |
| 11:45 | Linux basics | 11-13 |  |
| 12:15 | Lunch |  |  |
| 13:00 | Lab 2: Linux warm-up | 14 | Pair confident delegates with less confident ones. |
| 13:30 | Run the app by hand | 15 |  |
| 13:45 | Lab 3: run hello by hand, and count the steps | 16-17 | Collect the step counts: they are the case for the rest of the week. |
| 14:45 | Break |  |  |
| 15:00 | Close: quiz and recap | 18-19 |  |
| 15:30 | Check-off and questions |  | Tick Labs 1 to 3 per team on the check-off sheet. |

## What you do yourself

Commands for the lab server run there over SSH (`ssh labadmin@<server>`); the others on the control machine, in `pe-lab-ansible/`.

**09:00, while everyone signs in.** If a workspace does not load, restart it. If a password is refused, check it is typed exactly as on the sheet (it is case-sensitive: Lab-xxxx-xxxx-1234). *(Lab server)*

```bash
sudo lxc restart studentNN
```

**Lab 1.** Photograph the board of bottlenecks. On Day 6 the teams check which of them the platform removed.

**Lab 3, step 1.** The first git clone of the week asks for the user name and password: the same ones as the workspace.

**End of the day.** Copy tonight's backup to the control machine (it takes a fresh one first). *(Control machine)*

```bash
ansible-playbook backup.yml
```

## Watch for

| What you see | What to do |
| --- | --- |
| The browser warns about the certificate | The thin clients do not trust the lab CA. Desktop support must install it (setup guide, Part 1). Until then delegates can continue past the warning, but code-server misbehaves. |
| A workspace page stays blank | sudo lxc restart studentNN on the lab server. Still broken: give the delegate a spare (run-book). |
| Address already in use (Lab 3) | A copy of hello is still running: pkill -f app.main, or use another PORT. |

## End of the day

- [ ] Backup copied (ansible-playbook backup.yml).
- [ ] Check-off sheet updated.
- [ ] Bottleneck photo kept for Day 6.

## Labs today

| Lab | Time |
| --- | --- |
| Lab 1: map how a change reaches production today | 45 min · in teams |
| Lab 2: Linux warm-up in your workspace | 30 min |
| Lab 3: run hello by hand, and count the steps | 45 min |

## Slide by slide

The same notes are in the deck's speaker notes; quiz answers are under the quiz slide.

### 1. Platform engineering and Linux basics

Welcome. This is a six-day, hands-on programme. Say it plainly on the first slide: by Friday every team will have shipped a small application to production through a platform they understand, using templates, pull requests and pipelines, and they will be able to explain how each piece works. Today is the foundation: what a platform is, and enough Linux to be comfortable in a terminal.

### 2. The week: six days, one small app, a whole platform

Walk the table once. Stress the rhythm of every day: concepts and a live demo first, then two or three hands-on labs, then a short quiz. More doing than listening. Point out that the hello app is deliberately tiny, about 100 lines of Python with no dependencies, so that nobody is slowed down by the application itself. The platform is the subject, not the app.

### 3. Today's goal

Three outcomes, all checkable at the end of the day. The third one matters most: the manual run is the "before" picture. Everything the platform does from Day 2 onwards removes one of the manual steps they count today.

### 4. Why platform engineering exists

Theory, spoken practically. Ask the room: when you last needed a server, a database or a pipeline, how long did it take and how many people were involved? Those waits are the cost of everyone building their own road. Then open the portal live and show the list of hello services, one per team, already running. The point: a platform makes the common things boring. Mention the brief: "paved roads, reusable platform products and policy-as-code" is its own wording for the same idea.

### 5. What an Internal Developer Platform (IDP) is

Keep the tool names light today; they come back one per day. What matters is the shape: a front door, a set of services behind it, and templates that join them. Analogy that works for a bank audience: the IDP is to engineering what a well-run branch is to banking. You do not need to know how the core banking system works to open an account; the process is designed, controlled and repeatable.

### 6. The mini platform you will use all week

This diagram comes back at the end of every day with one more piece lit up. Trace a change through it slowly: a delegate edits code in the workspace, pushes to the repository, the pipeline checks and builds an image, the registry scans it, Argo CD deploys it into an environment, and the dashboard shows it running. Everything on this slide runs on one Ubuntu server in the lab.

### 7. Platform as a product, and golden paths

Practical framing: ask what jobs every team does the same way. New service, new environment, a release. Those are golden-path candidates. The discipline of architecting a golden path is: pick a job many teams do, build it once with the controls inside, measure how many teams use it, and keep improving it. That is Day 4 material in detail, but plant it now.

### 8. What a delegate does on this platform: the week in five steps

Five verbs. If a delegate remembers nothing else, these five are the shape of working on any IDP. Each one is a day or half a day of this course.

### 9. Getting a change live: today versus the paved road

This is the "before and after" for Lab 1. Before mapping their own delivery, delegates need to see what good looks like; otherwise the map has no target. Keep the right-hand side honest: it is what the lab does, not a vendor promise.

### 10. Lab 1: map how a change reaches production today

This is the brief's Lab 1, the baseline and value-stream diagnostic, done at a beginner level. The output is the evidence the brief asks for: a current-state map with waits and hand-offs quantified. Keep the board of bottlenecks; it comes back on Day 6 when teams compare it with the platform's path.

### 11. Linux basics

Set expectations: nobody needs to become a Linux administrator. The commands on the next slides are the ones that come up all week.

### 12. Your workspace: a Linux machine in your browser

Have everyone open the workspace now and confirm the terminal works before moving on. Common issues: the browser must trust the lab certificate; pop-ups for the lab domain must be allowed. The lab assistant handles stragglers while the next slide is explained.

### 13. Ten commands you will use all week

Read the table with the terminal open and type a few live. Explain the two that trip people up: sudo is "do this one thing as the administrator", used sparingly; environment variables are settings a program reads when it starts, and the hello app uses them to know which environment it is in. That idea carries through to containers on Day 4 and to the three environments on Day 6.

### 14. Lab 2: Linux warm-up in your workspace

Pair a confident delegate with a less confident one. The aim is comfort, not speed. The lab assistant circulates. Anyone who finishes early: try tail -f on a file while writing to it from a second terminal.

### 15. The app you will ship all week: hello

Explain why the app is tiny: the course is about the platform, and a complicated app would hide it. Make the environment-variable point carefully, because it is the key to Day 4 and Day 6: build once, run anywhere, configure with variables. Show main.py on screen; it fits on two pages.

### 16. Lab 3: run hello by hand, and count the steps

This is the "before" picture. Do the arithmetic on the board: those steps, times 3 environments, times every service, times every change. By Day 6 the same result takes one approved pull request. If python3 -m app.main fails with "address in use", a previous copy is still running: ps aux | grep app.main and kill it.

### 17. What just happened, and why it does not scale

Close the loop between the morning theory and the afternoon practice. The right-hand column is the course outline in one slide.

### 18. Check your understanding

Answers. 1: Every team building its own road to production is slow, inconsistent and hard to audit; a platform builds one shared road and runs it as a product. 2: Any three of: a repository, an environment, a pipeline, a deployment, a dashboard. 3: The approved easy route for a common job with the controls inside; a template is that route packaged so a team fills in a few values. 4: APP_ENV; the same image will run in dev, staging and prod with only its variables changed. 5: systemctl status &lt;service>; journalctl -u &lt;service>.

### 19. What we built today

End on the map of bottlenecks from Lab 1. Tomorrow starts to remove the first of them: changes that live on one person's machine.
