// Day 1: the icebreaker and the theory slides, spliced into day1.js where each belongs.
// Kept apart so day1.js still reads as the day's running order.
'use strict';

module.exports = {
  // ------------------------------------------------------------ opening: break the ice
  icebreaker: [
    {
      type: 'section', section: 'Getting to know each other',
      title: 'Getting to know each other',
      subtitle: 'One short icebreaker before any technology: two truths and a lie, in your team. By the end you will know who you are working with all week.',
      notes: 'Teams of 4 to 5 are already seated, mixing levels and tracks (use the pre-course questionnaire summary). Make sure every table has notes, pens and a table card. Put a 20-minute timer on the screen.',
    },
    {
      type: 'steps', section: 'Getting to know each other', time: '20 min · in teams',
      title: 'Icebreaker: two truths and a lie',
      debrief: "Most wishes are about not waiting: for an environment, a sign-off, an answer. Those wishes are what a platform is for. You meet them again in Lab 1 (the waits on your map) and on Day 2 (your platform charter).",
      steps: [
        { do: 'On your own, write three short statements about your work: two true, one false. For example "I have worked at SARB for 12 years".', expect: 'Three statements on a note; only you know which is false.' },
        { do: 'Take turns: your name, your role in FMD, then read your three statements. The team guesses the false one.', expect: 'Everyone has had a turn, and the team knows each other a little.' },
        { do: 'Each person names one tool they wish existed at work: "a button that gives me a test environment", "a report that builds itself"...', expect: 'One wish per person, written on a sheet.' },
        { do: 'Choose a team name, inspired by your wishes if you like, and write it on your table card.', expect: 'A team name on the card.' },
        { do: 'One person reads your team name and your favourite wish to the room.', expect: 'Every team has spoken; the instructor writes the wishes on the board.' },
      ],
      notes: 'The wish list is the hook for the whole course: most wishes ("an environment in minutes", "no tickets", "know what is running where") are exactly what an internal developer platform provides. Keep the board: refer back to it on the "Why platform engineering exists" slide, in Lab 1 (the bottlenecks behind the wishes) and in the Day 2 charter (what users need).',
    },
  ],

  // ------------------------------------------------------------ platform engineering: where it came from
  history: [
    {
      type: 'table', section: 'Platform engineering',
      title: 'How we got here: from silos to platforms',
      intro: 'Each step solved a real problem and left a new one. Platform engineering is the answer to the problem DevOps left.',
      header: ['Era', 'The idea', 'What it solved', 'What it left hard'],
      colW: [2.2, 3.6, 3.1, 3.23],
      fontSize: 12,
      boldFirst: true,
      rows: [
        ['Separate teams (before 2009)', 'Developers write the code; operations run it. Work is "thrown over the wall".', 'Clear specialist roles.', 'Slow hand-offs, blame between teams, releases a few times a year.'],
        ['DevOps (from 2009)', 'One team builds and runs its software ("you build it, you run it"), with automation and CI/CD.', 'Faster, shared responsibility.', 'Every team must master dozens of tools: too much to know.'],
        ['SRE (Google from 2003, book 2016)', 'Run operations as software engineering: service level objectives and error budgets.', 'Reliability that is measured, not hoped for.', 'Needs scarce specialist skills in every team.'],
        ['Cloud and containers (Docker 2013, Kubernetes 2014)', 'Infrastructure on demand, through code and APIs.', 'Minutes instead of weeks for a server.', 'Tool sprawl: every team builds its own pipeline, cluster and rules.'],
        ['Platform engineering (from about 2018)', 'A platform team builds one paved road as a product; teams use it by self-service.', 'Speed and safety for every team, with the controls inside.', 'The platform must be run like a product, with users and a roadmap.'],
      ],
      notes: 'Tell it as a story, not a list of dates. The key line is the last column of the DevOps row: DevOps was right, but asking every team to be expert in Git, pipelines, containers, Kubernetes, security scanning and monitoring overloaded them. Gartner predicted in 2022 that by 2026, 80% of large software engineering organisations would have platform engineering teams. The SARB brief follows the same path: from "fragmented engineering practices" to an institution-wide Internal Developer Platform.',
    },
    {
      type: 'concept', section: 'Platform engineering',
      title: 'Cognitive load: the hidden cost of "you build it, you run it"',
      icon: 'FiCpu',
      idea: [
        'Cognitive load is how much a person must hold in their head to do the work. Psychology splits it in three: intrinsic (the problem itself), extraneous (everything around it: tools, forms, waiting for access) and germane (learning that makes you better).',
        'A team that wants to change one report should spend its effort on the report. If it must also learn the pipeline tool, the cluster, the scanner and the firewall rules, extraneous load crowds out the real work.',
        'A platform takes extraneous load off the teams: the hard parts are solved once, by the platform team, and offered as simple, safe defaults.',
      ],
      labTitle: 'In this course',
      lab: [
        'To ship hello, a team touches ten tools: Git, Gitea, a pipeline, Harbor, Trivy, Kyverno, OpenTofu, Kubernetes, Argo CD, Grafana.',
        'With the platform, the team writes code and opens a pull request. The template wires up the rest.',
        'By Day 6 you will know what each tool does, but you will not need to configure them for every change.',
      ],
      oneLiner: 'A platform lowers the load on every team by solving the undifferentiated hard parts once, for everyone.',
      notes: 'The term comes from learning psychology (Sweller) and was brought to software teams by the book Team Topologies (Skelton and Pais, 2019). Ask the room: how many tools, forms and access requests stand between you and a change today? That number is extraneous load.',
    },
    {
      type: 'rows', section: 'Platform engineering',
      title: 'Team Topologies: four kinds of team',
      intro: 'A widely used model (Skelton and Pais, 2019) for who does what. A platform team exists to make the other teams faster.',
      rows: [
        { icon: 'FiTrendingUp', head: 'Stream-aligned team', text: 'Owns a flow of work for users from start to finish, for example the team behind a market-operations service. Most teams are this kind; the others exist to help them.' },
        { icon: 'FiLayers', head: 'Platform team', text: 'Builds and runs the internal platform as a product, so stream-aligned teams can self-serve: environments, pipelines, deployment, monitoring. Measured by how much it speeds the others up.' },
        { icon: 'FiCompass', color: 'accent4', head: 'Enabling team', text: 'Specialists who coach other teams for a while, for example in security or testing, then step back. This course is an enabling activity.' },
        { icon: 'FiSettings', color: 'accent5', head: 'Complicated-subsystem team', text: 'Owns a part that needs deep specialist knowledge, such as a pricing model or a payments engine, so other teams do not have to master it.' },
      ],
      notes: 'The model also names three ways teams interact: collaboration (working closely for a time), X-as-a-service (one team uses another\'s product with little coordination, which is how a platform should be used) and facilitating (an enabling team coaching). Ask which kind each delegate\'s team is today.',
    },
  ],

  // ------------------------------------------------------------ the IDP in layers
  layers: [
    {
      type: 'table', section: 'Platform engineering',
      title: 'The layers of an Internal Developer Platform',
      intro: 'Industry reference architectures describe an IDP in five layers. Every layer has a tool in this course.',
      header: ['Layer', 'What it does', 'In this course', 'Day'],
      colW: [2.6, 5.0, 3.33, 1.2],
      fontSize: 12.5,
      boldFirst: true,
      rows: [
        ['Developer control plane', 'Where teams start and change things: the portal, the templates, the code', 'Backstage, golden-path templates, Gitea', '1, 2, 4'],
        ['Integration and delivery', 'Builds, tests, scans and stores every change, then deploys it', 'Gitea Actions, Harbor, Trivy, Argo CD', '2, 4, 5, 6'],
        ['Resource plane', 'The compute, networks and environments the software runs on', 'k3s (Kubernetes), OpenTofu environments', '3, 6'],
        ['Monitoring and logging', 'Shows what runs where, whether it is healthy and what went wrong', 'Prometheus, Grafana, Loki', '6'],
        ['Security and policy', 'Identity, secrets, and the rules every deployment must pass', 'Kyverno guardrails, scanners, protected branches', '2, 5'],
      ],
      notes: 'This layering follows public reference architectures for IDPs (for example the CNOE and platformengineering.org models). Delegates do not need to memorise it; it is a map. Point out that the brief\'s capability domains map onto the same layers: developer experience, delivery platform, cloud and infrastructure, reliability and observability, security and compliance engineering.',
    },
  ],

  // ------------------------------------------------------------ golden paths, not cages
  paths: [
    {
      type: 'compare', section: 'Platform engineering',
      title: 'Golden paths, not golden cages',
      left: {
        head: 'A golden path (what to build)',
        items: [
          'The easiest way to do a common job is also the safe way',
          'Optional: a team may leave the path, and then owns what it built',
          'Self-service: no ticket, no waiting for another team',
          'Starts as the "thinnest viable platform": one useful path, then grows',
          'Has users, a product owner, a roadmap and measures',
        ],
      },
      right: {
        head: 'Anti-patterns (what to avoid)',
        items: [
          'Golden cage: one mandatory path, with no room for real exceptions',
          'Ticket-ops: "self-service" that is really a form sent to a queue',
          'Tool-led: buying tools before knowing what users need',
          'Shadow platforms: every team builds its own because the official one is too slow',
          'Platform built for the platform team, never measured by its users',
        ],
      },
      notes: 'The brief names "tool-led transformation" as its first principal risk, and asks for product discovery before tooling. The thinnest viable platform (a Team Topologies term) can start as a wiki page of agreed steps; this course\'s platform is three templates. Ask: which of the anti-patterns have delegates seen?',
    },
  ],

  // ------------------------------------------------------------ measuring, regulation, maturity, flow
  measure: [
    {
      type: 'table', section: 'Platform engineering',
      title: 'Measuring delivery: the four DORA metrics',
      intro: 'Ten years of State of DevOps research (DORA) found four measures that predict both speed and stability. The brief asks for the same measures.',
      header: ['Metric', 'Question it answers', 'Best-performing teams (DORA)', 'Where the course shows it'],
      colW: [2.5, 3.6, 3.0, 3.03],
      fontSize: 12.5,
      boldFirst: true,
      rows: [
        ['Deployment frequency', 'How often do we release to production?', 'On demand, many times a day', 'Day 6: promotion by pull request'],
        ['Lead time for changes', 'How long from a committed change to production?', 'Less than a day', 'Day 2: merge to dev in minutes'],
        ['Change failure rate', 'What share of releases cause a problem?', 'Around 5%', 'Day 5: the pipeline blocks bad changes'],
        ['Time to restore service', 'How fast do we recover from a failure?', 'Less than an hour', 'Day 6: Lab 4 measures it'],
      ],
      notes: 'Speed and stability are not a trade-off: the research shows the best teams are better at both. The brief\'s performance framework uses these same measures (lead time, deployment frequency, change failure rate, restoration time) and adds a guardrail: metrics must not reward unsafe change volume. Warn against using them to rank individuals.',
    },
    {
      type: 'table', section: 'Platform engineering',
      title: 'Why a central bank needs this: the brief\'s six principles',
      intro: 'The FMD brief sets these principles for every platform product. Each one becomes something you do this week.',
      header: ['Principle', 'What it means', 'Where you do it this week'],
      colW: [2.9, 5.2, 4.03],
      fontSize: 12.5,
      boldFirst: true,
      rows: [
        ['Security and resilience by design', 'Controls, recovery and monitoring are part of the product, not added later', 'Day 5 guardrails, Day 6 recovery'],
        ['Platform as a product', 'Known users, an owner, a roadmap, service levels and feedback', 'Day 2 Lab 6: your charter'],
        ['Self-service with guardrails', 'Teams act alone, within approved patterns and automated rules', 'Days 3 and 4: templates'],
        ['Open standards and portability', 'No unjustified lock-in; data and workloads can move', 'Open-source tools throughout'],
        ['Evidence by default', 'Every pipeline run leaves traceable, tamper-evident evidence for audit', 'Day 5 evidence, Day 6 capstone pack'],
        ['Continuous learning', 'Skills kept up through practice, incidents and communities', 'Every lab; the community of practice after'],
      ],
      notes: 'This is the bridge from theory to the institution. Regulators expect operational resilience, segregation of duties and auditability; the platform makes them the default instead of a separate project. Read the "evidence by default" row slowly: it changes audit from collecting screenshots afterwards to reading records the pipeline already wrote.',
    },
    {
      type: 'table', section: 'Platform engineering',
      title: 'The maturity journey: five levels',
      intro: 'The brief measures the capability on five levels, with objective evidence. A good tool score never makes up for weak ownership or controls.',
      header: ['Level', 'What it looks like', 'Evidence to move up'],
      colW: [2.0, 5.4, 4.73],
      fontSize: 12.5,
      boldFirst: true,
      rows: [
        ['1. Initial', 'Local, manual, person-dependent work; risks and duplication not visible', 'Inventory, risk assessment, a sponsor and a team'],
        ['2. Repeatable', 'Common practices and some reusable automation for priority cases', 'Minimum standards, pilot paved roads, service owners'],
        ['3. Defined', 'Platform products and standard workflows, broadly adopted', 'Service catalogue, roadmaps, SLOs, controls built in'],
        ['4. Managed', 'Performance, risk, cost and reliability managed with numbers', 'Dashboards, error budgets, recovery tests'],
        ['5. Optimising', 'Continuous experiment and improvement across the portfolio', 'Learning loops, automation, external benchmarks'],
      ],
      notes: 'The course\'s mini platform shows level 3 in miniature: a catalogue, templates, SLOs and controls built in. Ask delegates where their own area is today; most will say 1 or 2. That is normal and is exactly where the brief starts.',
    },
    {
      type: 'concept', section: 'Platform engineering',
      title: 'Value streams: where the time really goes',
      icon: 'FiClock',
      idea: [
        'A value stream is every step a piece of work goes through, from the first idea to the user having it. Lean thinking, from manufacturing, maps it to see where time is lost.',
        'Two numbers matter. Lead time is the calendar time from idea to live. Process time is the time someone was actually working on it. The rest is waiting: in queues, for approvals, for hand-offs.',
        'Flow efficiency is process time divided by lead time. In office and IT work it is often low: most of the calendar time, the work is waiting, not being worked on.',
      ],
      labTitle: 'A worked example',
      labCode: 'Lead time:     20 days (idea to live)\nProcess time:   2 days (actual work)\nFlow efficiency: 2 / 20 = 10%\n\n18 days of waiting:\n  tickets, queues, sign-offs, hand-offs',
      lab: [
        'Lab 1 maps one of your own changes like this.',
        'The platform attacks the waiting, not the working.',
      ],
      oneLiner: 'Most delivery time is waiting between people, so the biggest gains come from removing hand-offs and queues.',
      notes: 'Connect to the wish list on the board from the icebreaker: most wishes are about removing a wait. Lead time and process time are the two numbers teams will estimate in Lab 1. Do not promise a typical percentage; let the teams find their own.',
    },
  ],

  // ------------------------------------------------------------ Linux theory
  linux: [
    {
      type: 'concept', section: 'Linux basics',
      title: 'What Linux is, and why it runs the platform',
      icon: 'FiTerminal',
      idea: [
        'An operating system is the software that runs a computer and lets programs use it: Windows and macOS are operating systems, and so is Linux.',
        'Linux has three parts: the kernel (the core, which talks to the hardware), the shell (the program that reads the commands you type) and the programs themselves. Ubuntu, which your workspace runs, is one distribution: a kernel plus a chosen set of programs.',
        'Linux runs most of the world\'s servers and cloud, and every container and Kubernetes node. Every tool in this course runs on it, so a little Linux opens all of them.',
      ],
      labTitle: 'Windows and Linux side by side',
      lab: [
        'Folder C:\\Users\\you  is  /home/you  (written ~ for short)',
        'Task Manager  is  ps and top',
        'Services panel  is  systemctl',
        'Event Viewer  is  journalctl (the system log)',
        '"Run as administrator"  is  sudo',
      ],
      oneLiner: 'Linux is the operating system under almost every server, container and cloud, and the terminal is how you talk to it.',
      notes: 'Most delegates use Windows; the comparison on the right lowers the fear. Stress that nobody needs to administer Linux this week: we use about ten commands.',
    },
    {
      type: 'table', section: 'Linux basics',
      title: 'Where things live: the Linux file system',
      intro: 'Linux keeps everything in one tree of folders that starts at / (the root). A few folders are worth knowing.',
      header: ['Folder', 'What is in it', 'You will meet it when'],
      colW: [2.4, 5.3, 4.43],
      fontSize: 12.5,
      boldFirst: true,
      rows: [
        ['/', 'The root: the top of the tree; every other folder is inside it', 'Every path starts here'],
        ['/home/student01  (~)', 'Your own folder: your files and your copy of the code', 'All week: ~/hello, ~/day1'],
        ['/etc', 'Settings (configuration files) for the system and its programs', 'Reading how a service is set up'],
        ['/var/log', 'Log files written by programs', 'Day 1 Lab 2: reading a log'],
        ['/usr/bin', 'The programs themselves: git, python3, curl...', 'When you type a command'],
        ['/tmp', 'Temporary files, cleared from time to time', 'Rarely; never keep work there'],
      ],
      notes: 'Draw the tree on the whiteboard. One idea to land: in Linux "everything is a file", including settings and logs, which is why reading files with cat and less is so useful.',
    },
    {
      type: 'concept', section: 'Linux basics',
      title: 'Users, permissions and least privilege',
      icon: 'FiLock',
      idea: [
        'Every file has an owner, a group, and permissions for three kinds of people: the owner, the group, and everyone else. Each may read (r), write (w) or run (x) it.',
        'One user, root, may do anything. Normal users borrow root\'s power for one command with sudo, and on a real server every use of sudo is logged.',
        'Least privilege means giving each person and program only the access they need, and no more. It is a basic control in every bank, and the platform applies it to people, pipelines and deployments alike.',
      ],
      labTitle: 'Reading a permission',
      labCode: "-  rw-  r--  r--   notes.txt\n|   |    |    |\n|   |    |    `-- everyone else: read\n|   |    `------- group: read\n|   `------------ owner: read, write\n`---------------- - file, d folder",
      lab: [
        'Lab 2 locks a file to its owner with chmod 600.',
      ],
      oneLiner: 'Each file says who may read, write or run it, and least privilege means giving no one more access than they need.',
      notes: 'Link to the brief: segregation of duties and least privilege are named controls, and on Day 2 the same idea appears as "you cannot approve your own change". The numbers in chmod (4 read, 2 write, 1 run, added up) are a detail; the letters are what matter.',
    },
    {
      type: 'rows', section: 'Linux basics',
      title: 'Processes, services and logs',
      intro: 'Three ideas you will use every day this week, from your own terminal to the platform\'s dashboard.',
      rows: [
        { icon: 'FiPlay', head: 'A process is a program that is running', text: 'Every running program has a number (its PID), an owner, and uses some CPU and memory. ps lists them; top shows them live. Ctrl+C stops the one in your terminal.' },
        { icon: 'FiRefreshCw', head: 'A service is a process the system keeps running', text: 'The system (systemd) starts it when the machine starts and restarts it if it stops, like Docker in your workspace. systemctl status shows how it is.' },
        { icon: 'FiFileText', head: 'A log is a program\'s diary', text: 'Programs write what they do, line by line, with a time on each line. When something goes wrong, the log is the first place to look: journalctl reads the system\'s logs.' },
        { icon: 'FiActivity', color: 'accent4', head: 'On the platform, the same three ideas', text: 'Kubernetes runs your service as processes in containers and restarts them if they fail; Loki collects their logs; Grafana shows them. Day 6 uses all three.' },
      ],
      notes: 'This slide sets up the last two steps of Lab 2 and all of Day 6. Ask what a Windows user would use: Task Manager for processes, the Services panel for services, Event Viewer for logs.',
    },
  ],

  // ------------------------------------------------------------ how a web service works
  web: [
    {
      type: 'concept', section: 'Lab 3: run the app by hand',
      title: 'How a web service works',
      icon: 'FiGlobe',
      idea: [
        'A web service is a program that waits for requests and answers them. Your browser, or the curl command, is the client: it sends a request; the service (the server) sends back a response.',
        'A request names an address (a URL): the computer, the port (a numbered door on that computer, like 8081) and the path (/, /healthz). The response starts with a status code and carries a body, often in JSON.',
        'The status code says how it went: 200 OK, 404 not found, 403 not allowed, 500 the service failed. Monitoring counts these codes to know whether a service is healthy.',
      ],
      labTitle: 'One request, one response',
      labCode: 'curl localhost:8081/healthz\n|    |         |   |\n|    |         |   `- path: the page\n|    |         `- port: which door\n|    `- computer: this one\n`- the client\n\nHTTP/1.0 200 OK   <- status\nok                <- body',

      lab: [
        'Lab 3 asks hello for / and /healthz.',
      ],
      oneLiner: 'A client sends a request to an address and port; the service answers with a status code and a body.',
      notes: 'Draw a client and a server with an arrow each way. Delegates know URLs from the browser; the new ideas are the port and the status code. Everything on the platform, from health checks to the dashboard, is built on these.',
    },
    {
      type: 'table', section: 'Lab 3: run the app by hand',
      title: 'Build once, configure outside: how a cloud-native app behaves',
      intro: 'The "twelve-factor app" (2011) set out how a service should behave so a platform can run it anywhere. hello follows the rules that matter most.',
      header: ['Rule', 'What it means', 'How hello does it'],
      colW: [2.8, 5.0, 4.33],
      fontSize: 12.5,
      boldFirst: true,
      rows: [
        ['Config in the environment', 'Settings come from outside the code, so one build runs everywhere', 'APP_ENV, GREETING, PORT as environment variables'],
        ['Logs as a stream', 'Write events to the screen, one per line; the platform collects them', 'One JSON line per request'],
        ['Health checks', 'An address that says "I am alive", for the platform to ask', '/healthz answers ok'],
        ['Metrics', 'Numbers the service publishes about itself', '/metrics: requests, version, uptime'],
        ['Disposable', 'Starts fast and can be stopped and replaced at any time', 'Starts in a second; Ctrl+C stops it cleanly'],
        ['One codebase', 'One repository, many deployments', 'team01/hello runs as dev, staging and prod'],
      ],
      notes: 'This is why Lab 3 changes environment variables and not code. On Day 4 the same image runs with three sets of settings; on Day 6 Kubernetes asks /healthz and Grafana reads /metrics. The twelve-factor app was published by engineers at Heroku in 2011 and is still the common reference.',
    },
  ],
  // ------------------------------------------------------------ diagrams (labs/images, drawn by diagrams.py)
  pictures: {
    beforeAfter: [{
      type: 'picture', section: 'Platform engineering', src: 'before-after.svg',
      title: 'A change before and after the platform',
      caption: 'Same change, two roads. Blue is what the platform does by itself; red is where the old way waits.',
      points: [
        'The old road is slow because of the waiting between people, not the work.',
        'On the paved road one person reviews; every other check is automatic and identical every time.',
        'Evidence is written as the change moves, not gathered for the audit later.',
        'Lab 1 maps your own change on the top road.',
      ],
      notes: 'Walk the top row slowly and ask who has lived each red box. Then the bottom row: this is what delegates will do themselves from Day 2 to Day 6. Do not claim exact times for the bottom row; the point is that the waits disappear.',
    }],
    architecture: [{
      type: 'picture', section: 'Platform engineering', src: 'platform-architecture.svg',
      title: 'Inside the platform: how the pieces talk',
      caption: 'The lab platform on one page. You touch the workspace and the pull request; everything in blue runs by itself.',
      points: [
        'Backstage: find services and start new ones from a template.',
        'Gitea: the code, and the pull request where people decide.',
        'Actions and Harbor: test, scan and store every change.',
        'Argo CD: makes the cluster run what Git says. Kyverno checks every pod.',
        'Grafana: shows what runs where, and whether it is healthy.',
      ],
      notes: 'This is the same platform as the strip on the previous slide, drawn as it is wired. Trace one change: push, pipeline, image, Argo CD, cluster, dashboard. Each box returns on a later day: Gitea on Day 2, the environments on Day 3, Harbor on Day 4, Actions and Kyverno on Day 5, Argo CD and Grafana on Day 6.',
    }],
    teams: [{
      type: 'picture', section: 'Platform engineering', src: 'team-topologies.svg',
      title: 'How the teams work together',
      caption: 'Stream-aligned teams deliver to users; the platform team serves them by self-service; enabling teams coach for a while.',
      points: [
        'The platform team\'s customers are the other teams.',
        'Good platforms are used "as a service": no ticket, no meeting.',
        'Enabling teams, like this course, step back once teams can work alone.',
      ],
      notes: 'Ask each team to place their own FMD unit on the picture. Most will be stream-aligned; a few may be complicated-subsystem (for example a pricing or payments engine). Then ask: who is the platform team in FMD today? Usually the answer is "nobody, or every team a bit": the brief\'s starting point.',
    }],
    roles: [{
      type: 'table', section: 'Platform engineering',
      title: 'Who builds and runs a platform: the brief\'s eight role families',
      intro: 'Platform engineering is a team sport. The brief groups the skills into eight families, each with its own career path.',
      header: ['Family', 'What they do', 'Example roles'],
      colW: [3.0, 5.6, 3.53],
      fontSize: 12,
      boldFirst: true,
      rows: [
        ['Platform product leadership', 'Decide what the platform offers, for whom, and in what order', 'Platform product manager, service owner'],
        ['Platform architecture', 'Design how the pieces fit: cloud, APIs, data, security', 'Platform architect, solution architect'],
        ['Platform engineering', 'Build the templates, environments and automation', 'Platform engineer, automation engineer'],
        ['DevSecOps engineering', 'Build safe pipelines and protect the software supply chain', 'DevSecOps engineer, release engineer'],
        ['Reliability engineering', 'Keep services up: SLOs, monitoring, incidents, recovery', 'Site reliability engineer, operations engineer'],
        ['Data and integration', 'Data pipelines, APIs, events, data quality and access', 'Data platform engineer, API engineer'],
        ['Governance and assurance', 'Turn rules into controls, and produce evidence', 'Control engineer, technology assurance analyst'],
        ['Developer enablement', 'Docs, training and support so teams can use the platform', 'Developer advocate, technical writer, trainer'],
      ],
      notes: 'Ask delegates which family they are closest to. Analysts, risk and audit staff usually find themselves in product leadership or governance and assurance: platform engineering is not only for developers. The brief links each family to proficiency levels from Awareness to Authority; this course aims at Practitioner.',
    }],
    goldenContents: [{
      type: 'picture', section: 'Platform engineering', src: 'golden-path-contents.svg',
      title: 'What one golden-path request gives a team',
      caption: 'One template, about a minute: six things a team would otherwise build and agree by hand, each with the controls inside.',
      points: [
        'Nobody has to remember tests, scanning, an owner or a dashboard: they come with the service.',
        'Every service looks the same, so anyone can find their way in it.',
        'On Day 4 Lab 3 you request one and watch all six appear.',
      ],
      notes: 'This makes "golden path" concrete. Compare with the old road: each of these six boxes is usually a ticket, a meeting or a forgotten step.',
    }],
    valueStream: [{
      type: 'picture', section: 'Platform engineering', src: 'value-stream.svg',
      title: 'A value stream, mapped: where the time goes',
      caption: 'A made-up example of the map you draw in Lab 1: work time under each step, waiting time between them.',
      points: [
        'Work time: when someone is actually working on it.',
        'Wait time: in a queue, for a meeting, for a sign-off.',
        'Flow efficiency = work / lead time. Here 2 / 20 = 10%.',
        'In Lab 1, mark the waits on your own map, and estimate both numbers.',
      ],
      notes: 'This is the model answer for Lab 1, with invented numbers. Show it, then hide it while teams draw their own: their map should end with the same two numbers and a flow efficiency.',
    }],
    linuxLayers: [{
      type: 'picture', section: 'Linux basics', src: 'linux-layers.svg',
      title: 'The layers of a Linux computer',
      caption: 'Your command goes down through the layers; the answer comes back up.',
      points: [
        'The shell is the program you talk to in the terminal.',
        'The kernel does the real work and enforces who may do what.',
        'Containers (Day 4) share the kernel: that is why they are small and fast.',
      ],
      notes: 'Keep it light: the point is that a command is just a request to the kernel, passed on by the shell. The container note plants an idea for Day 4.',
    }],
    linuxTree: [{
      type: 'picture', section: 'Linux basics', src: 'linux-tree.svg',
      title: 'The file tree you will use this week',
      caption: 'Everything hangs from / . You mostly live in your home folder, ~ .',
      points: [
        '~ is short for /home/your-name.',
        'Settings live in /etc, logs in /var/log, programs in /usr/bin.',
        'Lab 2 makes ~/day1; Lab 3 copies the code into ~/hello.',
      ],
      notes: 'Draw the same tree on the whiteboard and add hello/ under the home folder as Lab 3 creates it.',
    }],
    webRequest: [{
      type: 'picture', section: 'Lab 3: run the app by hand', src: 'web-request.svg',
      title: 'One request through hello',
      caption: 'The client asks; hello answers with a status code and a body, and writes one log line and one count.',
      points: [
        'Lab 3, step 3 is exactly this request.',
        'Watch the first terminal: each request writes one log line.',
        'Step 5 reads the counts in /metrics.',
      ],
      notes: 'Run the request live while this slide is up, so the log line appears in front of the room.',
    }],
    configEnvs: [{
      type: 'picture', section: 'Lab 3: run the app by hand', src: 'config-envs.svg',
      title: 'One code, three environments',
      caption: 'The same build runs everywhere; only the settings change.',
      points: [
        'Lab 3, step 4 does this by hand: same code, three new settings.',
        'Day 4 packs the code into one image; Day 6 runs that image in dev, staging and prod.',
        'What was tested is exactly what runs in production.',
      ],
      notes: 'This is the idea to carry into Days 4 and 6. Ask: why is it safer that staging and prod run the same image?',
    }],
  },
};

// Place each diagram right after the slide it illustrates.
(function placeDiagrams(m) {
  const P = m.pictures;
  const after = (group, title, ...slides) => {
    const i = group.findIndex((x) => x.title === title);
    if (i < 0) throw new Error(`day1-extra: no slide "${title}"`);
    group.splice(i + 1, 0, ...slides);
  };
  after(m.history, 'Team Topologies: four kinds of team', ...P.teams, ...P.roles);
  after(m.paths, 'Golden paths, not golden cages', ...P.goldenContents);
  after(m.measure, 'Value streams: where the time really goes', ...P.valueStream);
  after(m.linux, 'What Linux is, and why it runs the platform', ...P.linuxLayers);
  after(m.linux, 'Where things live: the Linux file system', ...P.linuxTree);
  after(m.web, 'How a web service works', ...P.webRequest);
  after(m.web, 'Build once, configure outside: how a cloud-native app behaves', ...P.configEnvs);
})(module.exports);
