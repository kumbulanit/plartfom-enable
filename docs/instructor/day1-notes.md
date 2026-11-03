# Day 1 instructor guide: Platform engineering and Linux basics

Deck: `Day1-Platform-engineering-and-Linux-basics.pptx`. Delegates follow the handbook (Gitea `platform/handbook`, page day1/README.md), which has every lab step by step. If Argo CD gives trouble, see [safety-net.md](safety-net.md).

## Before the day

- [ ] The morning checks in the run-book (portal, a workspace, a dev address, Argo CD, Grafana), on every VM: ansible pelab -m ping first. 30 minutes before the start.
- [ ] Every delegate has built their own VM (prelab-setup/BUILD-YOUR-VM.md): PLAY RECAP said failed=0. Know which VM is whose: one line per delegate in inventory/all-vms.yml on your machine (pelab01, pelab02...), and export ANSIBLE_INVENTORY=inventory/all-vms.yml in your terminal. On every VM the delegate is student01 in team01, and their logins are in /etc/pelab/logins.md on the VM. Keep one VM aside as a spare, and one as your demo VM.
- [ ] For Lab 1, per team: an A3 sheet, yellow and pink sticky notes, markers. For the room: a long empty wall (or a row of flipcharts) for step 4, and the platform cards from the slide "Your shared steps, done once by the platform", printed one row per card.
- [ ] Seat the room at tables of four or five for the two Day 1 games (the icebreaker and Lab 1). These table groups are only for the games: every lab on a computer is done alone, on the delegate's own VM.
- [ ] Open your demo VM's portal, Gitea and Argo CD on the presenter screen: Gitea as student01 (you show the delegate's view), Argo CD as delegate. The passwords are in /etc/pelab/logins.md on the demo VM.

## The day, hour by hour

| Time | What | Slides | Notes |
| --- | --- | --- | --- |
| 09:00 | Welcome; everyone opens their VM and their logins file | 1-3 | Show how to open /etc/pelab/logins.md on the VM. Everyone opens the portal and their workspace before you go on. Count the workspaces that loaded. |
| 09:30 | Platform engineering and the IDP | 4-9 | The mini platform (slide 6) comes back every day: trace one change through it slowly. |
| 10:30 | Break |  |  |
| 10:45 | Lab 1: map how a change reaches production | 10 | The four-step game, one slide per step: list your road (12), walk and tick (10), same or different (10), one road on the wall (13). Keep the wall for Day 6. |
| 11:45 | Linux basics | 11-13 |  |
| 12:15 | Lunch |  |  |
| 13:00 | Lab 2: Linux warm-up | 14 | Seat confident delegates next to less confident ones: they may help each other, each on their own VM. |
| 13:30 | Run the app by hand | 15 |  |
| 13:45 | Lab 3: run hello by hand, and count the steps | 16-17 | Collect the step counts: they are the case for the rest of the week. |
| 14:45 | Break |  |  |
| 15:00 | Close: quiz and recap | 18-19 |  |
| 15:30 | Check-off and questions |  | Tick Labs 1 to 3 per delegate on the check-off sheet. |

## What you do yourself

Each delegate built their own VM, and its passwords are on it. `ansible pelab ...` commands run from your machine, in `prelab-setup/`, after `export ANSIBLE_INVENTORY=inventory/all-vms.yml` (pelab05 instead of pelab reaches one VM). `ansible-playbook ...` commands run on the VM they are for, in `~/plartfom-enable/prelab-setup`, with `-K`. Without SSH to the VMs, the delegate runs the command on their VM with `sudo` in front.

**09:00, while everyone signs in.** If a workspace does not load, restart it on that delegate's VM (here pelab05). If a password is refused, check it is typed exactly as in the logins file (it is case-sensitive: Lab-xxxx-xxxx-1234). *(Your machine, one VM)*

```bash
ansible pelab05 -b -a "lxc restart student01"
```

**Lab 1.** Photograph the board of bottlenecks. On Day 6 the room checks which of them the platform removed.

**Lab 3, step 1.** The first git clone of the week asks for the user name and password: the same ones as the workspace.

**End of the day.** Each VM backs itself up every night: nothing to copy. Remind everyone to push their work: anything only in a workspace is not backed up. Next morning, check last night's backup is there on every VM. *(Your machine, every VM)*

```bash
ansible pelab -b -m ansible.builtin.shell -a "ls -1t /opt/pelab/backups | head -1"
```

## Watch for

| What you see | What to do |
| --- | --- |
| The browser warns about the certificate | The thin clients do not trust the lab CA. Desktop support must install it (setup guide, Part 1). Until then delegates can continue past the warning, but code-server misbehaves. |
| A workspace page stays blank | ansible pelab05 -b -a "lxc restart student01" (that delegate's VM). Still broken: give the delegate the spare VM (run-book). |
| Address already in use (Lab 3) | A copy of hello is still running: pkill -f app.main, or use another PORT. |

## End of the day

- [ ] Everyone pushed their work.
- [ ] Check-off sheet updated.
- [ ] Bottleneck photo kept for Day 6.

## Labs today

| Lab | Time |
| --- | --- |
| Icebreaker: two truths and a lie | 20 min · in teams |
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

### 4. Today's plan

Walk the plan once, then point at the last line: every lab is in the handbook, step by step, with the commands to paste and what they should see. Today opens with one icebreaker (two truths and a lie, in teams), then three labs; the first is on paper, in teams.

### 5. Getting to know each other

Teams of 4 to 5 are already seated, mixing levels and tracks (use the pre-course questionnaire summary). Make sure every table has notes, pens and a table card. Put a 20-minute timer on the screen.

### 6. Icebreaker: two truths and a lie

The wish list is the hook for the whole course: most wishes ("an environment in minutes", "no tickets", "know what is running where") are exactly what an internal developer platform provides. Keep the board: refer back to it on the "Why platform engineering exists" slide, in Lab 1 (the bottlenecks behind the wishes) and in the Day 2 charter (what users need).

### 7. Why platform engineering exists

Theory, spoken practically. Ask the room: when you last needed a server, a database or a pipeline, how long did it take and how many people were involved? Those waits are the cost of everyone building their own road. Then open the portal live and show the list of hello services, one per team, already running. The point: a platform makes the common things boring. Mention the brief: "paved roads, reusable platform products and policy-as-code" is its own wording for the same idea.

### 8. How we got here: from silos to platforms

Tell it as a story, not a list of dates. The key line is the last column of the DevOps row: DevOps was right, but asking every team to be expert in Git, pipelines, containers, Kubernetes, security scanning and monitoring overloaded them. Gartner predicted in 2022 that by 2026, 80% of large software engineering organisations would have platform engineering teams. The SARB brief follows the same path: from "fragmented engineering practices" to an institution-wide Internal Developer Platform.

### 9. Cognitive load: the hidden cost of "you build it, you run it"

The term comes from learning psychology (Sweller) and was brought to software teams by the book Team Topologies (Skelton and Pais, 2019). Ask the room: how many tools, forms and access requests stand between you and a change today? That number is extraneous load.

### 10. Team Topologies: four kinds of team

The model also names three ways teams interact: collaboration (working closely for a time), X-as-a-service (one team uses another's product with little coordination, which is how a platform should be used) and facilitating (an enabling team coaching). Ask which kind each delegate's team is today.

### 11. How the teams work together

Ask each team to place their own FMD unit on the picture. Most will be stream-aligned; a few may be complicated-subsystem (for example a pricing or payments engine). Then ask: who is the platform team in FMD today? Usually the answer is "nobody, or every team a bit": the brief's starting point.

### 12. Who builds and runs a platform: the brief's eight role families

Ask delegates which family they are closest to. Analysts, risk and audit staff usually find themselves in product leadership or governance and assurance: platform engineering is not only for developers. The brief links each family to proficiency levels from Awareness to Authority; this course aims at Practitioner.

### 13. What an Internal Developer Platform (IDP) is

Keep the tool names light today; they come back one per day. What matters is the shape: a front door, a set of services behind it, and templates that join them. Analogy that works for a bank audience: the IDP is to engineering what a well-run branch is to banking. You do not need to know how the core banking system works to open an account; the process is designed, controlled and repeatable.

### 14. The layers of an Internal Developer Platform

This layering follows public reference architectures for IDPs (for example the CNOE and platformengineering.org models). Delegates do not need to memorise it; it is a map. Point out that the brief's capability domains map onto the same layers: developer experience, delivery platform, cloud and infrastructure, reliability and observability, security and compliance engineering.

### 15. The mini platform you will use all week

This diagram comes back at the end of every day with one more piece lit up. Trace a change through it slowly: a delegate edits code in the workspace, pushes to the repository, the pipeline checks and builds an image, the registry scans it, Argo CD deploys it into an environment, and the dashboard shows it running. Everything on this slide runs on one Ubuntu server in the lab.

### 16. Inside the platform: how the pieces talk

This is the same platform as the strip on the previous slide, drawn as it is wired. Trace one change: push, pipeline, image, Argo CD, cluster, dashboard. Each box returns on a later day: Gitea on Day 2, the environments on Day 3, Harbor on Day 4, Actions and Kyverno on Day 5, Argo CD and Grafana on Day 6.

### 17. Platform as a product, and golden paths

Practical framing: ask what jobs every team does the same way. New service, new environment, a release. Those are golden-path candidates. The discipline of architecting a golden path is: pick a job many teams do, build it once with the controls inside, measure how many teams use it, and keep improving it. That is Day 4 material in detail, but plant it now.

### 18. Golden paths, not golden cages

The brief names "tool-led transformation" as its first principal risk, and asks for product discovery before tooling. The thinnest viable platform (a Team Topologies term) can start as a wiki page of agreed steps; this course's platform is three templates. Ask: which of the anti-patterns have delegates seen?

### 19. What one golden-path request gives a team

This makes "golden path" concrete. Compare with the old road: each of these six boxes is usually a ticket, a meeting or a forgotten step.

### 20. What a delegate does on this platform: the week in five steps

Five verbs. If a delegate remembers nothing else, these five are the shape of working on any IDP. Each one is a day or half a day of this course.

### 21. Getting a change live: today versus the paved road

This is the "before and after" for Lab 1. Before mapping their own delivery, delegates need to see what good looks like; otherwise the map has no target. Keep the right-hand side honest: it is what the lab does, not a vendor promise.

### 22. A change before and after the platform

Walk the top row slowly and ask who has lived each red box. Then the bottom row: this is what delegates will do themselves from Day 2 to Day 6. Do not claim exact times for the bottom row; the point is that the waits disappear.

### 23. Measuring delivery: the four DORA metrics

Speed and stability are not a trade-off: the research shows the best teams are better at both. The brief's performance framework uses these same measures (lead time, deployment frequency, change failure rate, restoration time) and adds a guardrail: metrics must not reward unsafe change volume. Warn against using them to rank individuals.

### 24. Why a central bank needs this: the brief's six principles

This is the bridge from theory to the institution. Regulators expect operational resilience, segregation of duties and auditability; the platform makes them the default instead of a separate project. Read the "evidence by default" row slowly: it changes audit from collecting screenshots afterwards to reading records the pipeline already wrote.

### 25. The maturity journey: five levels

The course's mini platform shows level 3 in miniature: a catalogue, templates, SLOs and controls built in. Ask delegates where their own area is today; most will say 1 or 2. That is normal and is exactly where the brief starts.

### 26. Value streams: where the time really goes

Connect to the wish list on the board from the icebreaker: most wishes are about removing a wait. Lead time and process time are the two numbers teams will estimate in Lab 1. Do not promise a typical percentage; let the teams find their own.

### 27. A value stream, mapped: where the time goes

This is the model answer for Lab 1, with invented numbers. Show it, then hide it while teams draw their own: their map should end with the same two numbers and a flow efficiency.

### 28. Lab 1: map how a change reaches production today

A four-step game that is also the brief's Lab 1, the baseline and value-stream diagnostic. Show this overview once, then one slide per step. Materials per team: an A3 sheet, yellow and pink sticky notes, markers; plus a long empty wall or a row of flipcharts for step 4. Keep the wall: on Day 6 teams cross off every note the platform now does.

### 29. bigstep

Hand every team an A3 sheet and sticky notes in two colours (yellow for a step, pink for a wait). Read the job out loud so every team maps the same thing; that is what makes the boards comparable. Stop them at 12 minutes even if unfinished: a rough road is enough.

### 30. bigstep

Choose the walker quickly: the person who knows the team's process least is a good choice, because they ask the plain questions. Two or three minutes per board. The stars matter: a star is usually a check or a control one team has and another is missing.

### 31. bigstep

Most teams find that almost all their steps were ticked, and that most "differences" are the same job with a different name, tool or order. Let them say it themselves; do not give the answer yet.

### 32. bigstep

Build one long line on the wall from "someone asks" to "live". Cluster the notes into columns and write above each one how many teams had it. Then place the platform cards from the next slide over the columns. Finish with the question: what did each team build for itself that it could have used instead? That is the case for platform engineering, in the room's own words.

### 33. Your shared steps, done once by the platform

Print these rows as cards for the wall, or read them out. Keep it honest: the platform does not remove the work of writing the change or the human review; it removes the waiting, the duplicated set-up and the checks that depend on someone remembering. Where a team's road has a step with no card, ask whether it should be on the platform's roadmap: that is Day 2's charter.

### 34. Linux basics

Set expectations: nobody needs to become a Linux administrator. The commands on the next slides are the ones that come up all week.

### 35. What Linux is, and why it runs the platform

Most delegates use Windows; the comparison on the right lowers the fear. Stress that nobody needs to administer Linux this week: we use about ten commands.

### 36. The layers of a Linux computer

Keep it light: the point is that a command is just a request to the kernel, passed on by the shell. The container note plants an idea for Day 4.

### 37. Where things live: the Linux file system

Draw the tree on the whiteboard. One idea to land: in Linux "everything is a file", including settings and logs, which is why reading files with cat and less is so useful.

### 38. The file tree you will use this week

Draw the same tree on the whiteboard and add hello/ under the home folder as Lab 3 creates it.

### 39. Users, permissions and least privilege

Link to the brief: segregation of duties and least privilege are named controls, and on Day 2 the same idea appears as "you cannot approve your own change". The numbers in chmod (4 read, 2 write, 1 run, added up) are a detail; the letters are what matter.

### 40. Processes, services and logs

This slide sets up the last two steps of Lab 2 and all of Day 6. Ask what a Windows user would use: Task Manager for processes, the Services panel for services, Event Viewer for logs.

### 41. Your workspace: a Linux machine in your browser

Have everyone open the workspace now and confirm the terminal works before moving on. Common issues: the browser must trust the lab certificate; pop-ups for the lab domain must be allowed. The lab assistant handles stragglers while the next slide is explained.

### 42. Ten commands you will use all week

Read the table with the terminal open and type a few live. Explain the two that trip people up: sudo is "do this one thing as the administrator", used sparingly; environment variables are settings a program reads when it starts, and the hello app uses them to know which environment it is in. That idea carries through to containers on Day 4 and to the three environments on Day 6.

### 43. Lab 2: Linux warm-up in your workspace

Pair a confident delegate with a less confident one. The aim is comfort, not speed. The lab assistant circulates. Anyone who finishes early: try tail -f on a file while writing to it from a second terminal.

### 44. How a web service works

Draw a client and a server with an arrow each way. Delegates know URLs from the browser; the new ideas are the port and the status code. Everything on the platform, from health checks to the dashboard, is built on these.

### 45. One request through hello

Run the request live while this slide is up, so the log line appears in front of the room.

### 46. Build once, configure outside: how a cloud-native app behaves

This is why Lab 3 changes environment variables and not code. On Day 4 the same image runs with three sets of settings; on Day 6 Kubernetes asks /healthz and Grafana reads /metrics. The twelve-factor app was published by engineers at Heroku in 2011 and is still the common reference.

### 47. One code, three environments

This is the idea to carry into Days 4 and 6. Ask: why is it safer that staging and prod run the same image?

### 48. The app you will ship all week: hello

Explain why the app is tiny: the course is about the platform, and a complicated app would hide it. Make the environment-variable point carefully, because it is the key to Day 4 and Day 6: build once, run anywhere, configure with variables. Show main.py on screen; it fits on two pages.

### 49. Lab 3: run hello by hand, and count the steps

This is the "before" picture. Do the arithmetic on the board: those steps, times 3 environments, times every service, times every change. By Day 6 the same result takes one approved pull request. If python3 -m app.main fails with "address in use", a previous copy is still running: ps aux | grep app.main and kill it.

### 50. What just happened, and why it does not scale

Close the loop between the morning theory and the afternoon practice. The right-hand column is the course outline in one slide.

### 51. Check your understanding

Answers. 1: Every team building its own road to production is slow, inconsistent and hard to audit; a platform builds one shared road and runs it as a product. 2: Any three of: a repository, an environment, a pipeline, a deployment, a dashboard. 3: The approved easy route for a common job with the controls inside; a template is that route packaged so a team fills in a few values. 4: APP_ENV; the same image will run in dev, staging and prod with only its variables changed. 5: systemctl status &lt;service>; journalctl -u &lt;service>. 6: 2 / 20 = 10%; the other 18 days were waiting: queues, approvals, hand-offs. 7: any two of deployment frequency (how often we release), lead time for changes (commit to production), change failure rate (share of releases that cause a problem), time to restore service (how fast we recover).

### 52. What we built today

End on the map of bottlenecks from Lab 1. Tomorrow starts to remove the first of them: changes that live on one person's machine.
