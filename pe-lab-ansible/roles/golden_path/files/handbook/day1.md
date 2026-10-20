# Day 1: Platform engineering and Linux basics

### The week: six days, one small app, a whole platform

Each day adds one layer of the platform. The same hello app travels all the way: by hand on Day 1, in a container on Day 4, deployed automatically to dev, staging and prod on Day 6.

| Day | Theme | Working at the end of the day |
| --- | --- | --- |
| 1 | Platform engineering and Linux basics | The hello app runs by hand in your workspace and reports its environment |
| 2 | Git and working together | An approved change of yours is live in dev |
| 3 | Infrastructure as Code from a template | Your team has staging and prod, built from code |
| 4 | Containers and the packaging template | A second service exists, in the catalog and in dev |
| 5 | CI/CD, testing and security | Pipeline green, image scanned with an SBOM, a bad deployment blocked |
| 6 | Deploy, observe and the capstone | The new service runs in prod, with an evidence pack, presented to a panel |

**Goal:** Understand what a platform and an Internal Developer Platform are, and be at home on a Linux command line.

By the end of the day you can:

- Explain platform engineering and an IDP in two sentences
- Use the Linux terminal for everyday tasks: files, permissions, processes, services, logs
- Run the hello app by hand, see it report its environment, and count the manual steps

## Platform engineering

### Why platform engineering exists

In most organisations every team builds its own road to production: its own scripts, its own servers, its own checks. Each road is slightly different, slow to build, and hard for anyone else to audit.

Platform engineering builds one shared road and runs it as a product. Teams use the road; the platform team maintains it, improves it, and puts the controls inside it so that the safe way is also the easy way.

The result: faster delivery, fewer incidents, less duplicated tooling, and evidence produced by default. That is exactly what the SARB brief asks for.

> **In one sentence:** Platform engineering builds and runs the shared road to production so teams ship safely without re-solving the same problems.

**In the lab**

- Open the portal. Every team already has a hello service running in dev.
- Nobody raised a ticket for it. Nobody ran a deployment by hand.
- The platform team built the road once; the teams travel on it.
- This week you learn to travel on it, and to see how it is built.

### What an Internal Developer Platform (IDP) is

An IDP is the product teams use to get what they need by self-service: a code repository, environments, a pipeline, a deployment, a dashboard. The rules of the bank are built into it, so self-service is safe.

It is not one tool. It is a set of tools joined together by templates, so that a team fills in a few values and gets the whole result.

The portal is the front door. Behind it: Git, the pipeline runners, the image registry, the GitOps deployer, the cluster, and the monitoring.

> **In one sentence:** An IDP is the self-service product that gives teams code, environments, pipelines and deployments with the controls already inside.

**In the lab**

- Front door: Backstage (the portal and catalog).
- Code and pipelines: Gitea.
- Images and scans: Harbor.
- Deployment: Argo CD onto k3s (Kubernetes), with Kyverno guardrails.
- Watching it run: Prometheus, Grafana and Loki.

### The mini platform you will use all week

| Piece | Tool | What it does |
| --- | --- | --- |
| Workspace | Linux, Docker, Git | Write and try code in your browser |
| Portal | Backstage | Find services and templates |
| Template | Golden path | Creates a service or an environment |
| Repository | Gitea | Protected main, pull requests |
| Pipeline | Gitea Actions | Lint, test, scan, build |
| Registry | Harbor | Images, scans, SBOM |
| GitOps | Argo CD | Deploys what Git says |
| Environments | k3s + Kyverno | dev, staging, prod |
| Observe | Grafana, Loki | Dashboards, logs, alerts |

A change travels left to right along the top row, then along the bottom row. Today you use the first two pieces.

### Platform as a product, and golden paths

A platform is a product: it has users (the teams), an owner, a roadmap, service levels and measures of success. The brief calls this "platform as a product".

A golden path (the brief also says paved road) is the approved, easy route for a common job, such as creating a new service, with the controls already inside it.

A template is a golden path packaged so a team fills in a few values and gets the whole result. This week you use three: environments, application packaging, and the pipeline.

> **In one sentence:** A golden path is the approved, easy route for a common job; a template is how the platform hands it to you.

**In the lab**

- The platform team (your instructors) built the three templates.
- You will request environments from one (Day 3), create a service from one (Day 4) and read the pipeline one (Day 5).
- On Day 6 you say what you would add to the road next.

### What a delegate does on this platform: the week in five steps

- **Find:** Open the portal; see your team, its services, who owns them and where they run.
- **Create:** Make a new service or request an environment from a template. A few values, no ticket.
- **Change:** Edit on a branch, open a pull request, get one approval, merge. Nothing reaches main any other way.
- **Ship:** The pipeline checks and builds; the registry scans; Argo CD deploys to dev, and to staging and prod after an approved promotion.
- **Watch:** The dashboard shows versions, traffic, errors and logs per environment. Evidence of every step is kept.

### Getting a change live: today versus the paved road

**How it often works today**

- Raise a ticket for a server or an environment; wait
- Someone installs software by hand and copies files
- Checks depend on who is doing the work that day
- A deployment is a person logging in and running commands
- Nobody is sure which version runs where
- Evidence is assembled afterwards, for the audit

**On the paved road**

- An environment is a few lines in a template, approved in a pull request
- The pipeline runs the same checks on every change
- The image is built once, scanned, and kept with its ingredients list
- Deployment happens because Git changed, not because someone logged in
- The dashboard shows which version runs in dev, staging and prod
- Evidence is a by-product: every run, approval and decision is recorded

## Lab 1: map your delivery

### Lab 1: map how a change reaches production today

*45 min · in teams*

**What you do:** Draw how one real change travels from an idea to production in your part of FMD today, and find where it waits.

**Before you start:** Your team, an A3 sheet and markers. No computer needed.

#### Step 1. Pick one real change

*Where: Your team, on paper*

Choose something one of you changed recently: a report, a spreadsheet model, a script, a configuration, a small application. Real is better than typical.

**You should see:** One change written at the top of the sheet, for example "New column in the daily liquidity report".

#### Step 2. List every step from idea to live

*Where: Your team, on paper*

Write the steps left to right, one box each: who asked, who wrote it, who tested it, who approved it, who put it live, who told the users.

Include the tickets, e-mails, meetings and sign-offs. If you are not sure whether a step exists, write it with a question mark.

**You should see:** A chain of 8 to 20 boxes.

#### Step 3. Mark the waits, hand-offs and manual checks

*Where: Your team, on paper*

Draw a clock on every box where the change waits, an arrow where it passes from one person or team to another, and a hand where someone checks something by hand.

**You should see:** Most boxes carry at least one mark.

#### Step 4. Count the time and the people

*Where: Your team, on paper*

Count the calendar days from the idea to the change being live, and the number of different people who touched it. Calendar days, not working hours: that is what the user experiences.

**You should see:** Two numbers in the corner of the sheet, for example "19 days, 7 people".

#### Step 5. Circle the biggest bottleneck

*Where: Your team, on paper*

Circle one box: the longest wait, or the riskiest manual step.

**You should see:** One circle.

#### Step 6. Present it in two minutes

*Where: In front of the room*

Say what the change was, the two numbers, and the bottleneck. The instructor writes every team's bottleneck on the board.

**You should see:** A list of bottlenecks on the board. You will come back to it on Day 6: which of them does the platform remove?

**Done when:** Your sheet has the change, the chain of steps with marks, two numbers and one circle. Keep it for Day 6.

**If you are stuck**

- No recent change to map? Use how you got access to a new system, or how a report reaches its readers.
- Count waits in calendar days, not working hours; the point is how long a user waits.

## Linux basics

*Everything on the platform runs on Linux. You need about ten commands, and the confidence to read a log.*

### Your workspace: a Linux machine in your browser

Each delegate has a personal workspace: a small Ubuntu Linux machine running on the lab server. You reach it from the browser, so there is nothing to install on your laptop.

The workspace is Visual Studio Code in the browser (code-server): files on the left, an editor in the middle, a terminal at the bottom.

Everything you need is already inside it: Git, Docker, Python, OpenTofu, kubectl and the security scanners. Your files survive between days.

> **In one sentence:** Your workspace is a Linux machine in your browser with every course tool already installed.

**In the lab**

- Open https://studentNN.<lab domain> with the password on your access sheet.
- Open a terminal: Menu, Terminal, New Terminal (or Ctrl + `).
- The prompt shows your user and the current folder.
- If the page will not load, tell the lab assistant; a spare workspace is ready.

### Ten commands you will use all week

| Command | What it does | Example |
| --- | --- | --- |
| pwd  ·  ls -la  ·  cd | Where am I, what is here (with permissions), go somewhere | cd ~/hello && ls -la |
| cat  ·  less  ·  tail -f | Show a file, page through it, follow it as it grows | tail -f app.log |
| mkdir  ·  cp  ·  mv  ·  rm | Make a folder, copy, move or rename, delete | mkdir -p ~/day1/notes |
| nano  (or the editor) | Edit a file in the terminal; the workspace editor also works | nano README.md |
| chmod  ·  sudo | Change who may read, write or run a file; run one command as the administrator | chmod +x run.sh  ·  sudo apt update |
| ps aux  ·  top | List running programs; watch CPU and memory live | ps aux \| grep python |
| systemctl status  ·  journalctl -u | Is a service running; read its log | journalctl -u docker --since today |
| curl | Call a web address from the terminal and see the raw answer | curl -i http://localhost:8080/healthz |
| env  ·  export | Show the environment variables; set one for the next command | APP_ENV=staging python3 -m app.main |
| Ctrl + C  ·  Ctrl + R | Stop the running program; search your command history |  |

## Lab 2: Linux warm-up

### Lab 2: Linux warm-up in your workspace

*30 min*

**What you do:** Get comfortable in the Linux terminal of your workspace: files, permissions, processes, services, logs, the web and sudo.

**Before you start:** Open your workspace at https://studentNN.<lab domain> (your user name and password are on your access sheet). Open a terminal: menu (☰) → Terminal → New Terminal. It appears at the bottom of the editor. To paste a command into it, use Ctrl+V or right-click → Paste.

#### Step 1. Make a folder and a file

*Where: Workspace terminal*

mkdir makes a folder, cd moves into it, echo writes text, and > sends it into a file. ls -la lists everything in the folder with details.

```bash
mkdir -p ~/day1
cd ~/day1
echo "hello" > notes.txt
ls -la
```

**You should see:** notes.txt with its permissions, owner, size and date:

```
-rw-r--r-- 1 student01 student01    6 Nov  2 09:41 notes.txt
```

> **Tip:** Your workspace knows who you are. Type echo "$ME $TEAM $DOMAIN" to see your user name, your team and the lab domain. Many commands in this handbook use them, so you can paste them as they are.

#### Step 2. Read and change permissions

*Where: Workspace terminal*

The first column says who may do what: r is read, w is write, x is run. There are three groups of three: the owner, the owner's group, and everyone else.

chmod 600 means: the owner may read and write, nobody else may do anything.

```bash
chmod 600 notes.txt
ls -la notes.txt
```

**You should see:** The permissions change from -rw-r--r-- to -rw-------. Now only you can read the file.

#### Step 3. See what is running

*Where: Workspace terminal*

Every running program is a process. ps lists them once; top shows them live, busiest first.

```bash
ps aux | head
top
```

**You should see:** A list of processes with their owner, CPU and memory. top keeps updating. Press q to leave top.

#### Step 4. Check a service and read its log

*Where: Workspace terminal*

A service is a program the system keeps running for you, such as Docker. systemctl says whether it is running; journalctl shows what it wrote to the log.

Reading the system log needs administrator rights, so the second command starts with sudo. q leaves the status screen if it does not return by itself.

```bash
systemctl status docker --no-pager
sudo journalctl -u docker --since today | tail
```

**You should see:** Active: active (running) in green, then the last ten log lines from today.

#### Step 5. Call a web service from the terminal

*Where: Workspace terminal*

curl talks to a web address the way a browser does. -I asks only for the headers: the answer's status and details, without the page.

```bash
curl -I https://gitea.$DOMAIN
```

**You should see:** The first line is the status. 200 means OK:

```
HTTP/2 200
content-type: text/html; charset=utf-8
...
```

#### Step 6. Run an admin command with sudo

*Where: Workspace terminal*

sudo runs one command as the administrator. In your workspace you may use it; on a real server it is given carefully. wc -l counts lines, so this counts the installed packages.

```bash
sudo apt list --installed 2>/dev/null | wc -l
```

**You should see:** A number: how many software packages your workspace has.

**Done when:** You made a file and changed who may read it, looked at processes, checked a service and its log, called a web address, and used sudo.

**If you are stuck**

- command not found: check the spelling. Press Tab to complete commands and file names.
- top, less and man take over the terminal: press q to leave.
- Permission denied: work inside your home folder (cd ~).

## Lab 3: run the app by hand

### The app you will ship all week: hello

hello is a web service of about 100 lines of Python with no dependencies. It answers three addresses: / (its name, version, environment and a greeting), /healthz (am I alive) and /metrics (numbers for the dashboard).

It takes its settings from environment variables: APP_NAME, APP_VERSION, APP_ENV, GREETING and PORT. The same code runs in dev, staging and prod and reports which one it is in.

It writes one JSON line per request to its log. That is enough to practise everything: testing, packaging, deploying, monitoring.

> **In one sentence:** hello is the smallest app that can show every step of the platform, including which environment it runs in.

**What / returns**

```
{ "app": "hello",
  "version": "dev",
  "environment": "local",
  "message": "Hello from the PE Lab golden path" }
```

- Change APP_ENV and the environment changes. Nothing else does.
- /healthz answers ok; /metrics lists counters for the dashboard.

### Lab 3: run hello by hand, and count the steps

*45 min*

**What you do:** Get your team's service, hello, and run it by hand on your workspace in two settings. Count every manual step: on the next days the platform takes them over.

**Before you start:** A terminal in your workspace (menu → Terminal → New Terminal).

#### Step 1. Tell Git who you are, then copy your team's repository

*Where: Workspace terminal*

The first two lines tell Git your name and e-mail once; every change you save will carry them. Put your own name between the quotes.

The third line makes Git remember your password for the day, so you type it only once.

git clone copies the repository, with its whole history, into a folder called hello in your home folder. Git asks for your user name (studentNN) and password: the ones on your access sheet.

```bash
git config --global user.name "Your Name"
git config --global user.email "$ME@$DOMAIN"
git config --global credential.helper "cache --timeout=36000"
cd ~
git clone https://gitea.$DOMAIN/$TEAM/hello
cd hello
ls
```

**You should see:** The folders and files of the service:

```
Dockerfile  README.md  app  catalog-info.yaml  deploy  pyproject.toml  tests
```

#### Step 2. Start the service

*Where: Workspace terminal*

This starts the program in this terminal. It keeps running, so the terminal is busy until you stop it.

```bash
python3 -m app.main
```

**You should see:** One line in JSON saying it started on port 8080:

```
{"event": "started", "app": "hello", "env": "local", "version": "dev", "port": 8080}
```

#### Step 3. Call it from a second terminal

*Where: A second workspace terminal*

Open a second terminal with the + button at the top right of the terminal panel. The first one is still busy running the service. /healthz is the address the platform uses to ask "are you alive?".

```bash
curl -s localhost:8080/
curl -i localhost:8080/healthz
```

**You should see:** The service describes itself, then answers the health check with 200 OK:

```
{"app": "hello", "version": "dev", "environment": "local", "message": "Hello from the PE Lab golden path"}

HTTP/1.0 200 OK
Server: hello Python/3.12.3
Content-Type: text/plain
Content-Length: 3

ok
```

#### Step 4. Stop it and start it again as "staging"

*Where: First terminal, then the second*

Press Ctrl+C in the first terminal to stop the service.

Then start it again with three settings in front of the command: the environment name, a greeting and another port. The program is the same; only its settings change. This is how one program runs in dev, staging and prod.

```bash
APP_ENV=staging GREETING="Hello from staging" PORT=8081 python3 -m app.main
```

**You should see:** In the second terminal, curl -s localhost:8081/ now answers:

```
{"app": "hello", "version": "dev", "environment": "staging", "message": "Hello from staging"}
```

#### Step 5. Look at its logs and its numbers

*Where: Both terminals*

Every request writes one JSON line in the first terminal: that is the log. /metrics is a page of counters that the monitoring system reads.

```bash
curl -s localhost:8081/metrics
```

**You should see:** Counters such as:

```
http_requests_total{path="/",status="200"} 1
app_info{app="hello",version="dev",env="staging"} 1
app_uptime_seconds 74
```

> **Tip:** Stop the service with Ctrl+C in the first terminal when you are done.

#### Step 6. Write down every manual step

*Where: Paper or a file*

List everything you did to get one copy running: clone, change folder, set the settings, start it, check it, and so on. Then ask: what would it take for 25 people, three environments and a change every day?

**You should see:** Around 8 to 10 steps, for one copy of one app in one environment.

**Done when:** You ran hello as local and as staging, read its answer, health check, log and metrics, and have a list of your manual steps.

**If you are stuck**

- git clone asks for a user name and password: studentNN and the password on your access sheet.
- Address already in use: a copy is still running. Stop it with pkill -f app.main, or use another PORT.
- curl: connection refused: the app is not running, or it runs on another port. Check the first terminal.

### What just happened, and why it does not scale

**Running it by hand**

- You typed every step, in the right order, from memory
- The settings live in your head and your terminal history
- A second copy for staging meant doing it all again
- If the workspace restarts, the app is gone
- Nobody else can see what you ran, or prove it was checked

**What the platform will do instead**

- Day 2: every change goes through Git and a reviewed pull request
- Day 3: environments come from a template, with budgets and rules
- Day 4: the app is packaged once as an image with its settings outside it
- Day 5: a pipeline tests, scans and builds every change the same way
- Day 6: Argo CD runs what Git says in dev, staging and prod, and the dashboard proves it

### Check your understanding

1. In your own words: what problem does platform engineering solve?
2. Name three things a team gets from an Internal Developer Platform by self-service.
3. What is a golden path, and how does a template relate to it?
4. Which environment variable told hello which environment it was in, and why does that matter later?
5. Which Linux command shows whether a service is running, and which shows its log?

### What we built today

You can now:

- Explain platform engineering, an IDP and a golden path in plain words
- Find your team and its services in the portal
- Work in your browser workspace and use the everyday Linux commands
- Run hello by hand and make it report a different environment
- Name your team's biggest delivery bottleneck

**Tomorrow:** Git and working together. You will make a change to hello on a branch, open a pull request, get it reviewed and approved, and watch it go live in dev without touching a server.

---

[Contents](README.md) · [Day 11](day11.md)
