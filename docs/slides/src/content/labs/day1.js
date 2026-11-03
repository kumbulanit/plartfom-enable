// Day 1 labs, step by step, for the handbook. Keyed by the lab's title on the
// slides; the slides keep the short version of the same steps, in the same order.
//
// Written for someone who has never used a terminal. Each lab: goal, learn,
// words, start, steps, done. Each step: title, where, why, say, do (numbered
// actions), run (commands to paste), explain ([command, meaning]), change
// (before/after of a file), then (more commands), see, out (real output), read
// (how to read it), ifnot ([what you see, what to do]), tip. Commands use $ME
// (studentNN), $TEAM (teamNN) and $DOMAIN (the lab domain), which every
// workspace sets. The outputs are copied from real runs.
'use strict';

const { TERMINAL } = require('./common');

module.exports = {
  'Icebreaker: two truths and a lie': {
    goal: 'Get to know your own team: share two true facts and one false one about your work, and the one tool you wish existed.',
    story: [
      'Before any technology, meet the people you will work with all week. Each of you tells your team three short things about your work, two true and one false, and the team guesses which is false. It is a gentle way to learn names, roles and a bit about each other.',
      'Then each person names one tool they wish existed at work. Those wishes matter: most of them are about not waiting, and not waiting is exactly what a platform gives teams. You will come back to them in Lab 1 and on Day 2.',
    ],
    end: 'A team that knows each other, a team name, and a list of wishes for the platform.',
    learn: [
      'The names and roles of your teammates.',
      'What your team wishes it had at work: the start of thinking about a platform as a product.',
    ],
    words: [
      ['Wish list', 'The tools you wish existed. On Day 2 it becomes what your team\'s platform must make easy.'],
    ],
    start: [
      'Sit with your team: 4 or 5 people.',
      'A note or a sheet, a pen and your table card.',
    ],
    steps: [
      { title: 'Write two truths and one lie', where: 'On your own', plain: 'Write three short things about your work: two true, one false.', why: 'Short, personal facts are easier to remember than a job title, and guessing makes everyone listen.', do: ['On your note, write three short statements about your work.', 'Make two true and one false. For example: "I have worked at SARB for 12 years", "I have never used Excel", "My first job was in a bank in London".'], see: 'Three statements on your note; only you know which is false.', check: 'You have three statements ready.' },
      { title: 'Take turns and guess', where: 'Your team', plain: 'Introduce yourself and read your three statements; the team guesses the false one.', why: 'Everyone speaks once, and you all learn names and roles.', do: ['Take turns: say your name and your role in FMD, then read your three statements.', 'The team agrees on a guess. Then reveal which one was false.'], see: 'Everyone has had a turn, with a few surprises.', check: 'You know every teammate\'s name and role.' },
      { title: 'One tool you wish existed', where: 'Your team', plain: 'Each person says one tool they wish they had at work.', why: 'The wishes show what a platform should do for real people. Most are about removing a wait or a ticket.', do: ['Each person names one tool they wish existed at work, for example "a button that gives me a test environment" or "a report that builds itself".', 'One person writes all the wishes on a sheet.'], see: 'One wish per person on the sheet.', check: 'Every teammate\'s wish is written down.' },
      { title: 'Choose a team name', where: 'Your team', plain: 'Agree a name for your team for the week.', why: 'A name makes the team yours; you will use it all week.', do: ['Agree a team name, inspired by your wishes if you like.', 'Write it on your table card.'], see: 'A team name on the table card.', check: 'Your table card shows your team name.' },
      { title: 'Share with the room', where: 'In front of the room', plain: 'Tell the room your team name and your favourite wish.', why: 'Hearing every team\'s wishes shows which ones the whole of FMD shares: those are where a common platform pays off.', do: ['One person reads your team name and your favourite wish.', 'The instructor writes the wishes on the board.'], see: 'Every team\'s wish on the board.', check: 'Your team\'s wish is on the board. Keep your sheet: you need it in Lab 1 and on Day 2.' },
    ],
    done: 'Your team has a name, knows each other, and has a written list of wishes.',
  },

  'Lab 1: map how a change reaches production today': {
    goal: 'As a team, map your road from a request to a live change, mark where it waits, compare it with the other teams\' roads, and see that the shared steps are what a platform builds once.',
    learn: [
      'How to see delivery as a chain of steps, with waits and hand-offs between them.',
      'That most of the time a change takes is waiting, not working.',
      'That different teams build almost the same road, each on its own: the case for a platform.',
    ],
    words: [
      ['Change', 'Anything that has to reach users: a new report column, a fix to a model, a new script, a configuration setting.'],
      ['Production (live)', 'Where real users use it. "In production" means "live".'],
      ['Wait', 'Time when nobody is working on the change: in a queue, waiting for a sign-off, a server or a meeting.'],
      ['Hand-off', 'The moment work passes from one person or team to another, often with a ticket or an e-mail.'],
      ['Value stream map', 'The name for the drawing you make in step 1: the steps a change goes through, with the waits marked.'],
    ],
    start: [
      'Your team around one table, with an A3 sheet, yellow and pink sticky notes, and markers. No computer needed.',
      'Choose a timekeeper: the instructor tells you how long each of the four steps takes.',
      'Every team maps the same job: a small change to a report or a script, from "someone asks for it" to "it is live".',
    ],
    steps: [
      {
        title: 'List your road, and mark the waits',
        where: 'Your team, on the A3 sheet',
        why: 'You cannot improve a road you have not drawn. Writing every step makes the hidden ones visible: the e-mails, the queues, the sign-off nobody remembers.',
        do: [
          'Write one step per yellow sticky note and put them left to right: who asks, who writes it, who tests it, who approves it, who puts it live, who tells the users.',
          'Wherever the change waits, add a pink note: how long, and why. For example "Sign-off: 3 days, the approver was away".',
          'Add up two numbers and write them in the corner: total days from request to live, and the days someone was actually working on it.',
        ],
        see: 'A row of 8 to 20 notes, with pink waits between them, and two numbers in the corner, for example:',
        out: '[Request by e-mail] -> pink: 2 days, in the inbox -> [Ticket raised] -> pink: 5 days, weekly triage\n  -> [Analyst writes the SQL] -> [Peer check by e-mail] -> pink: 3 days, sign-off\n  -> [Ops runs the script on Friday] -> [Live]\n\nTotal: 14 days.  Working: 2 days.',
        check: 'Your road goes from "someone asks" to "live", with at least one pink wait and two numbers in the corner.',
      },
      {
        title: 'Walk round and tick what you recognise',
        where: 'The other teams\' boards',
        why: 'Seeing another team\'s road is the fastest way to notice that yours is not unique.',
        do: [
          'Your team chooses one walker. Everyone else stays at your board to explain it to visitors.',
          'The walker takes a pen and visits every other team\'s board in turn.',
          'On each board, tick ✓ every step your team does too, and star ★ anything your team never does but maybe should.',
        ],
        see: 'Ticks and stars on every board, including yours, from the other teams\' walkers.',
        check: 'Your walker has visited every other board.',
      },
      {
        title: 'Same or different?',
        where: 'Your team, back at your board',
        why: 'A difference is only real if it is a different job. Most turn out to be the same job with another name, tool or person.',
        do: [
          'The walker tells the team what they saw on the other boards.',
          'Sort your notes into two groups: ticked by other teams (the same), and no ticks (only ours).',
          'For each "only ours" note, ask: is it really a different job, or the same job done another way?',
          'Look at the stars on your board: a step another team has and you do not. Is it a check you are missing?',
        ],
        see: 'Two groups of notes. Usually the "same" group is much bigger than the "only ours" group.',
        check: 'Every note is in one of the two groups, and you have talked about each star.',
      },
      {
        title: 'One road: the platform',
        where: 'The wall, with the whole room',
        why: 'When every team\'s shared steps sit in one place, you can see what each team built for itself, and what could be built once for everyone.',
        do: [
          'Each team brings its ticked notes to the wall. The same step from different teams goes into the same column.',
          'Above each column, write how many teams had that step.',
          'The instructor places a card over each column: what the platform does instead (the table on the slide).',
          'Together, count what disappears: set-up done once per team, waiting, and checks that only some teams remembered.',
        ],
        see: 'One long road on the wall, made of columns that most teams share, each with a platform card over it.',
        read: [
          'Every team built and keeps its own copy of almost the same road. A platform builds the shared steps once, with the checks inside, and every team uses them by self-service: that is platform engineering.',
          'The pink waits are what the platform removes first. On Day 6 you come back to this wall and cross off every note the platform now does.',
        ],
        check: 'The shared steps are on one wall, each with its platform card, and you can say in one sentence what a platform would change for your team.',
        tip: 'Take a photo of your team\'s board and of the wall: both go into your Day 6 evidence pack.',
      },
    ],
    done: 'Your road is mapped with its waits, compared with every other team\'s, and the shared steps are on one wall with what the platform does instead.',
  },

  'Lab 2: Linux warm-up in your workspace': {
    goal: 'Get comfortable in the Linux terminal of your workspace: files, permissions, processes, services, logs, the web and sudo.',
    learn: [
      'How to type commands in a terminal and read what comes back.',
      'Files and folders, and who may read or change them.',
      'Programs that run (processes), programs the system keeps running (services) and what they write (logs).',
      'How to call a web address from the terminal, and how to run one command as the administrator.',
    ],
    words: [
      ['Workspace', 'Your own small Linux computer for the week, running on the lab server. You use it in the browser: an editor at the top, a terminal at the bottom.'],
      ['Terminal', 'The window where you type commands and the computer answers in text.'],
      ['Prompt', 'The text before the cursor, for example student01@student01:~/day1$. It says who you are (student01), on which computer (student01) and in which folder (~/day1). The $ means "ready for a command".'],
      ['Home folder (~)', 'Your own folder, /home/student01. ~ is its short name.'],
      ['Permission', 'Who may read, change or run a file.'],
      ['Process', 'A program that is running right now.'],
      ['Service', 'A program the system starts and keeps running for you, such as Docker.'],
      ['Log', 'What a program writes about what it does, line by line, so you can find out later what happened.'],
      ['sudo', '"Do this as the administrator", for one command.'],
    ],
    start: [
      'Open your workspace at https://student01.<lab domain> (your user name and password are in your logins file, /etc/pelab/logins.md on your VM: your instructor shows you how to open it). The first time, the browser shows a sign-in page: type the password and press Enter.',
      'Open a terminal: menu ☰ (top left) → Terminal → New Terminal. It appears at the bottom of the window, with a prompt like student01@student01:~$',
      'To run a command: copy it from this page (the copy button at the top right of each grey box), click in the terminal, paste with Ctrl+V (on a Mac Cmd+V, or right-click → Paste), and press Enter.',
      'Do not worry about breaking anything: the workspace is yours alone, and the instructor can reset it.',
    ],
    steps: [
      {
        title: 'Make a folder and a file',
        where: 'Workspace terminal',
        why: 'Everything on a computer lives in files and folders. These four commands are the ones you will use most often all week.',
        run: 'mkdir -p ~/day1\ncd ~/day1\necho "hello" > notes.txt\nls -la',
        explain: [
          ['mkdir -p ~/day1', 'make a folder called day1 in your home folder. -p means "no error if it is already there".'],
          ['cd ~/day1', 'go into that folder (change directory). Look at the prompt: it now ends in ~/day1$.'],
          ['echo "hello" > notes.txt', 'echo writes the text hello; > sends it into a file called notes.txt instead of the screen. The file is created if it does not exist, and overwritten if it does.'],
          ['ls -la', 'list the folder\'s contents (ls) as a long list with details (-l), including hidden entries (-a).'],
        ],
        see: 'Three lines: the folder itself (.), the folder above it (..), and your file:',
        out: 'total 4\ndrwxr-xr-x 2 student01 student01 4096 Nov  2 09:41 .\ndrwxr-x--- 9 student01 student01 4096 Nov  2 09:41 ..\n-rw-r--r-- 1 student01 student01    6 Nov  2 09:41 notes.txt',
        read: [
          'Read the notes.txt line from left to right: its permissions (-rw-r--r--), its owner (you) and group (your own group, with the same name), its size (6 bytes: the five letters of hello and an invisible line break), and when it was last changed.',
          'The first character says what it is: - for a file, d for a folder (directory).',
          'Your permissions may show as -rw-rw-r-- instead: that also lets your own group write. Both are normal.',
        ],
        ifnot: [
          ['cd: no such file or directory', 'the mkdir line did not run. Paste the whole box again.'],
        ],
        then: {
          say: 'Your workspace also knows who you are. Paste this:',
          run: 'echo "I am $ME, in $TEAM, on $DOMAIN"',
          explain: [
            ['echo "I am $ME, in $TEAM, on $DOMAIN"', 'print a sentence. $ME, $TEAM and $DOMAIN are filled in by the workspace with your user name, your team and the lab domain.'],
          ],
          see: 'Your own user name and team (here student01 in team01):',
          out: 'I am student01, in team01, on <lab domain>',
          read: ['Many commands in this handbook use $ME, $TEAM and $DOMAIN, so you can paste them exactly as they are: the workspace fills in your own values.'],
        },
      },
      {
        title: 'Read and change permissions',
        where: 'Workspace terminal',
        why: 'Permissions decide who may read or change a file. On a shared server, a file with passwords or customer data must be readable only by its owner.',
        say: [
          'The permissions are three groups of three letters, after the first character: what the owner may do, what the owner\'s group may do, and what everyone else may do. r means read, w means write (change), x means run, and - means not allowed.',
          'So -rw-r--r-- means: the owner may read and write; the group may read; everyone else may read.',
        ],
        run: 'chmod 600 notes.txt\nls -la notes.txt',
        explain: [
          ['chmod 600 notes.txt', 'change the permissions (change mode) of notes.txt to 600: the owner may read and write (6), the group nothing (0), everyone else nothing (0). Each digit adds up read = 4, write = 2, run = 1.'],
          ['ls -la notes.txt', 'show the details of that one file again.'],
        ],
        see: 'The permissions are now -rw-------:',
        out: '-rw------- 1 student01 student01 6 Nov  2 09:41 notes.txt',
        read: [
          'rw- for you, --- for your group, --- for everyone else: now only you can read the file.',
          'chmod 644 would give the original back: read and write for you, read for everyone else.',
        ],
      },
      {
        title: 'See what is running',
        where: 'Workspace terminal',
        why: 'When something is slow or stuck, the first question is "what is running, and what is it using?". ps and top answer it.',
        do: [
          { text: 'Run this: it lists the first few running programs once.', cmd: 'ps aux | head' },
          { text: 'Then run top: it shows the running programs live, busiest first, and keeps updating.', cmd: 'top' },
          'Look at it for a few seconds, then press q to leave top and get your prompt back.',
        ],
        run: 'ps aux | head\ntop',
        explain: [
          ['ps aux', 'list every running program (process): a = of all users, u = with the user and the resources, x = including those not started from a terminal.'],
          ['| head', 'the | (pipe) sends the output of the first command into the second; head keeps only the first ten lines, so the list fits on the screen.'],
          ['top', 'show the processes live, updated every few seconds. q leaves it.'],
        ],
        see: 'A table of processes, something like this. Yours lists other programs too, such as code-server (your editor in the browser) and dockerd (Docker):',
        out: 'USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot           1  0.0  0.1  22048 12872 ?        Ss   08:01   0:02 /sbin/init\nroot         312  0.1  0.9 1906540 74136 ?       Ssl  08:01   0:09 /usr/bin/dockerd ...\nstudent01    401  1.2  2.8 1196064 230412 ?      Ssl  08:01   1:02 /usr/lib/code-server/lib/node ...\n...',
        read: [
          'USER is who runs it, PID its number, %CPU and %MEM how much of the processor and memory it uses right now, COMMAND what it is.',
          'In top, the top lines summarise the whole machine: how many tasks, how busy the processors are, how much memory is used and free.',
        ],
        ifnot: [
          ['top does not go away', 'press q (just the letter, no Enter). If that does not work, press Ctrl+C.'],
        ],
      },
      {
        title: 'Check a service and read its log',
        where: 'Workspace terminal',
        why: 'A service is a program the system keeps running for you, and its log is the first place to look when it misbehaves. You will read logs all week, from your own service on Day 1 to the dashboard on Day 6.',
        say: 'Docker, which you use on Day 4, runs as a service in your workspace. Reading the system\'s log needs administrator rights, so the second command starts with sudo. In your workspace sudo does not ask for a password.',
        run: 'systemctl status docker --no-pager\nsudo journalctl -u docker --since today | tail',
        explain: [
          ['systemctl status docker --no-pager', 'ask the system (systemctl) how the service called docker is. --no-pager prints it all at once instead of in a scrolling viewer.'],
          ['sudo journalctl -u docker --since today', 'show the log (journal) of the docker service (-u: unit), only from today. sudo: as the administrator.'],
          ['| tail', 'keep only the last ten lines: the most recent.'],
        ],
        see: 'Something like this: the service is active (running), shown in green, then the last ten lines it wrote to its log:',
        out: '● docker.service - Docker Application Container Engine\n     Loaded: loaded (/usr/lib/systemd/system/docker.service; enabled; preset: enabled)\n     Active: active (running) since Mon 2026-11-02 08:01:12 UTC; 1h 40min ago\n...\nNov 02 08:01:12 student01 dockerd[312]: time="2026-11-02T08:01:12Z" level=info msg="API listen on /run/docker.sock"',
        read: [
          'Loaded ... enabled: the system starts Docker by itself at every boot.',
          'Active: active (running): it is running now, and since when.',
          'Each log line starts with the date and time, the computer\'s name and the program, then the message.',
        ],
        ifnot: [
          ['The status screen does not return to the prompt', 'press q.'],
          ['Active: failed or inactive', 'tell the instructor: Docker is needed on Day 4.'],
        ],
      },
      {
        title: 'Call a web service from the terminal',
        where: 'Workspace terminal',
        why: 'curl talks to a web address the way a browser does, but shows you the raw answer. It is how you check a service quickly, without a browser, and you use it every day this week.',
        run: 'curl -I https://gitea.$DOMAIN',
        explain: [
          ['curl -I https://gitea.$DOMAIN', 'ask the lab\'s Gitea (the Git service you use from Day 2) for its front page. -I asks only for the headers: the status and details of the answer, without the page itself.'],
        ],
        see: 'The first line is the status. 200 means OK:',
        out: 'HTTP/2 200\ncontent-type: text/html; charset=utf-8\n...',
        read: [
          '200 means OK. You will also meet 404 (not found), 403 (not allowed) and 500 (the service failed).',
          'The other lines are details of the answer, such as its type (content-type).',
        ],
        ifnot: [
          ['curl: (6) Could not resolve host', 'the address was mistyped. Paste the command again, exactly as it is.'],
        ],
      },
      {
        title: 'Run an admin command with sudo',
        where: 'Workspace terminal',
        why: 'Some commands change or read the whole system and need the administrator. sudo gives you that for one command. In your workspace you may use it; on a real server it is given carefully, and every use is logged.',
        run: 'whoami\nsudo whoami',
        explain: [
          ['whoami', 'print who you are: the user the terminal runs commands as.'],
          ['sudo whoami', 'the same question, but run as the administrator (sudo: "do this as the administrator"). The administrator account on Linux is called root.'],
        ],
        see: 'First your own user name, then root:',
        out: 'student01\nroot',
        read: [
          'The same command answers differently with sudo in front: for that one command you were the administrator, root. The next command is you again.',
          'Every course tool you use this week (git, kubectl, tofu, docker, python) was installed this way, with sudo, by the platform team.',
        ],
        ifnot: [
          ['sudo asks for a password', 'type the student01 password, from your logins file (nothing appears while you type).'],
        ],
      },
    ],
    done: 'You made a file and changed who may read it, looked at processes, checked a service and its log, called a web address, and used sudo.',
  },

  'Lab 3: run hello by hand, and count the steps': {
    goal: 'Get your team\'s service, hello, and run it by hand on your workspace in two settings. Count every manual step: on the next days the platform takes them over.',
    learn: [
      'How to copy a team\'s code from Gitea with git.',
      'How a web service runs, answers, reports its health and writes its log.',
      'How the same program runs as different environments by changing only its settings.',
      'Why doing all of this by hand does not scale.',
    ],
    words: [
      ['Repository (repo)', 'A folder of code with its whole history, kept in Gitea. Your service lives in the repository team01/hello: on your own VM you are student01, in team01.'],
      ['Clone', 'Copy a repository from Gitea to your workspace.'],
      ['Port', 'A numbered door on a computer that a program listens on. hello listens on 8080 unless told otherwise.'],
      ['localhost', '"This computer": your own workspace.'],
      ['Environment variable', 'A setting given to a program when it starts, written NAME=value in front of the command.'],
      ['Health check', 'An address (/healthz) that answers ok when the service is alive. The platform asks it all the time.'],
      ['Metrics', 'Numbers a service publishes about itself (/metrics), such as how many requests it answered. The dashboard reads them.'],
    ],
    start: [
      ...TERMINAL,
      'You will need two terminals at the same time: one runs the service, the other talks to it. Step 3 shows how to open the second.',
    ],
    steps: [
      {
        title: 'Tell Git who you are, then copy your team\'s repository',
        where: 'Workspace terminal',
        why: 'Git records who made every change, so you tell it your name once. Then you copy your team\'s service from Gitea to your workspace.',
        do: [
          { text: 'Paste this one line on its own and press Enter. It asks "Your full name:": type your name (for example Thandi Nkosi) and press Enter. Git puts this name on every change you save.', cmd: 'read -p "Your full name: " NAME && git config --global user.name "$NAME" && git config --global user.name' },
          'Git answers with the name it saved. Now paste the box below and press Enter.',
          'Git asks for a Username: type student01 and press Enter. Then for a Password: type your password (from your logins file) and press Enter. Nothing appears while you type the password: that is normal.',
        ],
        run: 'git config --global user.email "$ME@$DOMAIN"\ngit config --global credential.helper "cache --timeout=36000"\ncd ~\ngit clone https://gitea.$DOMAIN/$TEAM/hello\ncd hello\nls',
        explain: [
          ['read -p "Your full name: " NAME', 'ask you a question (-p: the prompt) and keep your answer in NAME.'],
          ['git config --global user.name "$NAME"', 'tell Git your name, for every repository (--global). The last part, git config --global user.name, prints it back so you can check it.'],
          ['git config --global user.email "$ME@$DOMAIN"', 'tell Git your e-mail address in the lab, for example student01@<lab domain>.'],
          ['git config --global credential.helper "cache --timeout=36000"', 'make Git remember your password for 10 hours (36,000 seconds), so you type it once a day.'],
          ['cd ~', 'go to your home folder.'],
          ['git clone https://gitea.$DOMAIN/$TEAM/hello', 'copy your team\'s repository hello, with its whole history, into a new folder called hello.'],
          ['cd hello', 'go into it.'],
          ['ls', 'list what is inside.'],
        ],
        see: 'First the name you typed, printed back by Git. Then the box: Git asks who you are, copies the repository (the numbers may differ a little), and ls lists the files and folders of the service:',
        out: 'Your full name: Thandi Nkosi\nThandi Nkosi\n\nCloning into \'hello\'...\nUsername for \'https://gitea.<lab domain>\': student01\nPassword for \'https://student01@gitea.<lab domain>\':\nremote: Enumerating objects: 31, done.\nremote: Counting objects: 100% (31/31), done.\nremote: Compressing objects: 100% (24/24), done.\nremote: Total 31 (delta 1), reused 0 (delta 0), pack-reused 0 (from 0)\nReceiving objects: 100% (31/31), 11.00 KiB | 11.00 MiB/s, done.\nResolving deltas: 100% (1/1), done.\nDockerfile  README.md  app  catalog-info.yaml  deploy  pyproject.toml  tests',
        read: [
          'app: the program itself (app/main.py, about 100 lines of Python).',
          'tests: the automatic checks for it, used from Day 2.',
          'Dockerfile: how to package it as a container (Day 4). deploy: how the platform runs it in dev, staging and prod (Days 2 and 6).',
          'catalog-info.yaml: its entry in the developer portal. README.md: its user guide.',
        ],
        ifnot: [
          ['Authentication failed', 'the user name or password was mistyped. Run the git clone line again: git clone https://gitea.$DOMAIN/$TEAM/hello'],
          ['Your name is wrong', 'paste the read -p line again and type it correctly: the new name replaces the old one.'],
          ['fatal: destination path \'hello\' already exists', 'you cloned it before. Run cd ~/hello and go on.'],
        ],
      },
      {
        title: 'Start the service',
        where: 'Workspace terminal',
        why: 'Running the program by hand is the "before" picture: you will count every step it takes.',
        say: 'This starts the program in this terminal. It keeps running, so this terminal stays busy (no prompt) until you stop it. That is normal.',
        run: 'python3 -m app.main',
        explain: [
          ['python3 -m app.main', 'run the Python program in app/main.py. It starts a small web server and waits for requests.'],
        ],
        see: 'One line in JSON (a common text format for data) saying it started on port 8080. Then nothing more: the service is waiting.',
        out: '{"event": "started", "app": "hello", "env": "local", "version": "dev", "port": 8080}',
        ifnot: [
          ['No module named \'app\'', 'you are not in the hello folder. Run cd ~/hello and start it again.'],
          ['OSError: [Errno 98] Address already in use', 'a copy is already running, perhaps in another terminal. Stop it with Ctrl+C in that terminal, or run pkill -f "python3 -m app.main", then start again.'],
        ],
      },
      {
        title: 'Call it from a second terminal',
        where: 'A second workspace terminal',
        why: 'A service is used by others over the network. You play the "other" from a second terminal, while the first keeps the service running.',
        do: [
          'Open a second terminal: click the + at the top right of the terminal panel. A new terminal opens; the list on the right of the panel shows both, and you can click to switch between them.',
          'In the new terminal, paste the box and press Enter.',
          { text: 'Then open it in your browser: print your address and Ctrl+click it (Cmd+click on a Mac).', cmd: 'echo "https://$ME.$DOMAIN/proxy/8080/"' },
        ],
        run: 'curl -s localhost:8080/\ncurl -i localhost:8080/healthz',
        explain: [
          ['curl -s localhost:8080/', 'ask the service on this computer (localhost), port 8080, for its main page (/). -s hides curl\'s progress messages.'],
          ['curl -i localhost:8080/healthz', 'ask the health check. -i also shows the status line and headers.'],
        ],
        see: 'The service describes itself, then answers the health check with 200 OK:',
        out: '{"app": "hello", "version": "dev", "environment": "local", "message": "Hello from the PE Lab golden path"}\nHTTP/1.0 200 OK\nServer: hello Python/3.12.3\nDate: Mon, 02 Nov 2026 10:12:41 GMT\nContent-Type: text/plain\nContent-Length: 3\n\nok',
        read: [
          'app, version and environment are what the service says about itself. environment is local because you started it by hand.',
          'Look back at the first terminal: every request wrote one new line there. That is the log.',
          'The health check answers ok with 200 OK: the service is alive. The platform asks exactly this, all the time.',
          'curl uses localhost because curl runs in the workspace, next to the service. Your browser runs on your laptop, so it uses your workspace\'s address, https://$ME.$DOMAIN, and code-server passes /proxy/8080/ on to port 8080. Any port works the same way: /proxy/8081/ for 8081.',
        ],
        ifnot: [
          ['curl: (7) Failed to connect to localhost port 8080', 'the service is not running. Look at the first terminal: start it again with python3 -m app.main.'],
          ['The browser tab shows an error instead of the page', 'the service is not running, or the address has another port. Check the first terminal, and that the address ends in /proxy/8080/.'],
          ['The browser asks for a password', 'it is your workspace\'s sign-in: type your workspace password (from your logins file) and press Enter.'],
        ],
      },
      {
        title: 'Stop it and start it again as "staging"',
        where: 'First terminal, then the second',
        why: 'The same program runs in dev, staging and prod: only its settings change. Here you change three settings by hand.',
        do: [
          'Click in the first terminal (the one running the service) and press Ctrl+C. The service stops and the prompt comes back.',
          'In the same first terminal, paste the box below and press Enter. The service starts again, now as staging, on port 8081.',
          { text: 'Switch to the second terminal and run:', cmd: 'curl -s localhost:8081/' },
          { text: 'See it in your browser too: print the address for port 8081 and Ctrl+click it (Cmd+click on a Mac). The page now says STAGING.', cmd: 'echo "https://$ME.$DOMAIN/proxy/8081/"' },
        ],
        run: 'APP_ENV=staging GREETING="Hello from staging" PORT=8081 python3 -m app.main',
        explain: [
          ['APP_ENV=staging', 'a setting (environment variable): the name of the environment the service says it runs in.'],
          ['GREETING="Hello from staging"', 'a setting: the message it answers with.'],
          ['PORT=8081', 'a setting: listen on port 8081 instead of 8080.'],
          ['python3 -m app.main', 'the same program as before. The settings in front of it apply to this run only.'],
        ],
        see: 'In the second terminal, curl -s localhost:8081/ now answers:',
        out: '{"app": "hello", "version": "dev", "environment": "staging", "message": "Hello from staging"}',
        read: [
          'Same code, different settings, different behaviour. On Day 4 the settings move out of your command line and into the platform; on Day 6 dev, staging and prod each report their own name like this.',
        ],
        ifnot: [
          ['curl: (7) Failed to connect to localhost port 8081', 'the service did not start, or you called 8080. Look at the first terminal for an error, and check the port in your curl.'],
        ],
      },
      {
        title: 'Look at its logs and its numbers',
        where: 'Both terminals',
        why: 'Logs say what happened, request by request; metrics count it. Together they are how anyone, and later the dashboard, knows how a service is doing.',
        run: 'curl -s localhost:8081/metrics',
        explain: [
          ['curl -s localhost:8081/metrics', 'ask the service for its metrics: a page of numbers in the format the monitoring system (Prometheus) reads.'],
        ],
        see: 'Counters, each with a line of explanation (# HELP) above it:',
        out: '# HELP http_requests_total HTTP requests handled, by path and status code.\n# TYPE http_requests_total counter\nhttp_requests_total{path="/",status="200"} 1\n# HELP app_info The running version of the service.\n# TYPE app_info gauge\napp_info{app="hello",version="dev",env="staging"} 1\n# HELP app_uptime_seconds Seconds since the service started.\n# TYPE app_uptime_seconds gauge\napp_uptime_seconds 74',
        read: [
          'http_requests_total{path="/",status="200"} 1: one request to / was answered with 200. Call curl -s localhost:8081/ again and look: the count goes up. (No http_requests_total line at all? Nobody has called the service yet: run curl -s localhost:8081/ once, then the metrics again.)',
          'app_info shows the version and environment; app_uptime_seconds how long it has been running.',
          'In the first terminal, each request wrote one JSON line: the log. For example {"event": "request", ..., "path": "/", "status": 200, "duration_ms": 0.22}: what was asked, the answer and how long it took.',
        ],
        tip: 'When you are done, stop the service: click in the first terminal and press Ctrl+C.',
      },
      {
        title: 'Write down every manual step',
        where: 'Workspace terminal, then the editor',
        why: 'This list is the "before" picture of the week. From Day 2 on, the platform takes these steps over one by one, and on Day 6 you compare.',
        do: [
          'Paste the box: it writes the steps you took today into a file, ~/day1/manual-steps.md, and shows it.',
          'Open the file in the editor (Explorer → day1 → manual-steps.md). Add any step you took that is missing, one per line.',
          'On the last line, after "this would take:", write your answer in a few words. Save with Ctrl+S (Mac Cmd+S).',
          'Keep the file with your Day 1 map: both go into the Day 6 evidence pack.',
        ],
        run: 'mkdir -p ~/day1\ncat > ~/day1/manual-steps.md <<\'EOF\'\n# Day 1: hello by hand, every manual step\n1. Told Git my name and e-mail address\n2. Copied (cloned) the repository from Gitea, with my password\n3. Went into the folder\n4. Started the service by hand, in a terminal that stays busy\n5. Opened a second terminal and called the service\n6. Called its health check\n7. Stopped it with Ctrl+C\n8. Typed three settings by hand (APP_ENV, GREETING, PORT) and started it again\n9. Called it again, on the new port\n10. Read its log and its metrics\n\nFor 25 people, three environments and a change every day, this would take:\nEOF\ncat ~/day1/manual-steps.md',
        explain: [
          ["cat > ~/day1/manual-steps.md <<'EOF' ... EOF", 'write every line between the two EOF markers into the file manual-steps.md (> creates it, or replaces it).'],
          ['cat ~/day1/manual-steps.md', 'show the file.'],
        ],
        see: 'The ten steps, and the question at the end:',
        out: '# Day 1: hello by hand, every manual step\n1. Told Git my name and e-mail address\n2. Copied (cloned) the repository from Gitea, with my password\n3. Went into the folder\n4. Started the service by hand, in a terminal that stays busy\n5. Opened a second terminal and called the service\n6. Called its health check\n7. Stopped it with Ctrl+C\n8. Typed three settings by hand (APP_ENV, GREETING, PORT) and started it again\n9. Called it again, on the new port\n10. Read its log and its metrics\n\nFor 25 people, three environments and a change every day, this would take:',
        read: [
          'Ten steps, for one copy of one app in one environment, all of them in someone\'s head and terminal history. Nothing here is checked, reviewed or recorded.',
        ],
      },
    ],
    done: 'You ran hello as local and as staging, read its answer, health check, log and metrics, and have a list of your manual steps.',
  },
};
