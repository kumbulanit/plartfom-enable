// Day 1 labs, step by step, for the handbook. Keyed by the lab's title on the
// slides; the slides keep the short version of the same steps, in the same order.
//
// Each step: title, where, say (plain words), run (commands to paste), file
// (a file to write), see (what you should see), out (sample output), tip.
// Commands use $ME (studentNN), $TEAM (teamNN) and $DOMAIN (the lab domain),
// which every workspace sets.
'use strict';

module.exports = {
  'Lab 1: map how a change reaches production today': {
    goal: 'Draw how one real change travels from an idea to production in your part of FMD today, and find where it waits.',
    start: 'Your team, an A3 sheet and markers. No computer needed.',
    steps: [
      {
        title: 'Pick one real change',
        where: 'Your team, on paper',
        say: 'Choose something one of you changed recently: a report, a spreadsheet model, a script, a configuration, a small application. Real is better than typical.',
        see: 'One change written at the top of the sheet, for example "New column in the daily liquidity report".',
      },
      {
        title: 'List every step from idea to live',
        where: 'Your team, on paper',
        say: [
          'Write the steps left to right, one box each: who asked, who wrote it, who tested it, who approved it, who put it live, who told the users.',
          'Include the tickets, e-mails, meetings and sign-offs. If you are not sure whether a step exists, write it with a question mark.',
        ],
        see: 'A chain of 8 to 20 boxes.',
      },
      {
        title: 'Mark the waits, hand-offs and manual checks',
        where: 'Your team, on paper',
        say: 'Draw a clock on every box where the change waits, an arrow where it passes from one person or team to another, and a hand where someone checks something by hand.',
        see: 'Most boxes carry at least one mark.',
      },
      {
        title: 'Count the time and the people',
        where: 'Your team, on paper',
        say: 'Count the calendar days from the idea to the change being live, and the number of different people who touched it. Calendar days, not working hours: that is what the user experiences.',
        see: 'Two numbers in the corner of the sheet, for example "19 days, 7 people".',
      },
      {
        title: 'Circle the biggest bottleneck',
        where: 'Your team, on paper',
        say: 'Circle one box: the longest wait, or the riskiest manual step.',
        see: 'One circle.',
      },
      {
        title: 'Present it in two minutes',
        where: 'In front of the room',
        say: 'Say what the change was, the two numbers, and the bottleneck. The instructor writes every team\'s bottleneck on the board.',
        see: 'A list of bottlenecks on the board. You will come back to it on Day 6: which of them does the platform remove?',
      },
    ],
    done: 'Your sheet has the change, the chain of steps with marks, two numbers and one circle. Keep it for Day 6.',
  },

  'Lab 2: Linux warm-up in your workspace': {
    goal: 'Get comfortable in the Linux terminal of your workspace: files, permissions, processes, services, logs, the web and sudo.',
    start: 'Open your workspace at https://studentNN.<lab domain> (your user name and password are on your access sheet). Open a terminal: menu (☰) → Terminal → New Terminal. It appears at the bottom of the editor. To paste a command into it, use Ctrl+V or right-click → Paste.',
    steps: [
      {
        title: 'Make a folder and a file',
        where: 'Workspace terminal',
        say: 'mkdir makes a folder, cd moves into it, echo writes text, and > sends it into a file. ls -la lists everything in the folder with details.',
        run: 'mkdir -p ~/day1\ncd ~/day1\necho "hello" > notes.txt\nls -la',
        see: 'notes.txt with its permissions, owner, size and date:',
        out: '-rw-r--r-- 1 student01 student01    6 Nov  2 09:41 notes.txt',
        tip: 'Your workspace knows who you are. Type echo "$ME $TEAM $DOMAIN" to see your user name, your team and the lab domain. Many commands in this handbook use them, so you can paste them as they are.',
      },
      {
        title: 'Read and change permissions',
        where: 'Workspace terminal',
        say: [
          'The first column says who may do what: r is read, w is write, x is run. There are three groups of three: the owner, the owner\'s group, and everyone else.',
          'chmod 600 means: the owner may read and write, nobody else may do anything.',
        ],
        run: 'chmod 600 notes.txt\nls -la notes.txt',
        see: 'The permissions change from -rw-r--r-- to -rw-------. Now only you can read the file.',
      },
      {
        title: 'See what is running',
        where: 'Workspace terminal',
        say: 'Every running program is a process. ps lists them once; top shows them live, busiest first.',
        run: 'ps aux | head\ntop',
        see: 'A list of processes with their owner, CPU and memory. top keeps updating. Press q to leave top.',
      },
      {
        title: 'Check a service and read its log',
        where: 'Workspace terminal',
        say: [
          'A service is a program the system keeps running for you, such as Docker. systemctl says whether it is running; journalctl shows what it wrote to the log.',
          'Reading the system log needs administrator rights, so the second command starts with sudo. q leaves the status screen if it does not return by itself.',
        ],
        run: 'systemctl status docker --no-pager\nsudo journalctl -u docker --since today | tail',
        see: 'Active: active (running) in green, then the last ten log lines from today.',
      },
      {
        title: 'Call a web service from the terminal',
        where: 'Workspace terminal',
        say: 'curl talks to a web address the way a browser does. -I asks only for the headers: the answer\'s status and details, without the page.',
        run: 'curl -I https://gitea.$DOMAIN',
        see: 'The first line is the status. 200 means OK:',
        out: 'HTTP/2 200\ncontent-type: text/html; charset=utf-8\n...',
      },
      {
        title: 'Run an admin command with sudo',
        where: 'Workspace terminal',
        say: 'sudo runs one command as the administrator. In your workspace you may use it; on a real server it is given carefully. wc -l counts lines, so this counts the installed packages.',
        run: 'sudo apt list --installed 2>/dev/null | wc -l',
        see: 'A number: how many software packages your workspace has.',
      },
    ],
    done: 'You made a file and changed who may read it, looked at processes, checked a service and its log, called a web address, and used sudo.',
  },

  'Lab 3: run hello by hand, and count the steps': {
    goal: 'Get your team\'s service, hello, and run it by hand on your workspace in two settings. Count every manual step: on the next days the platform takes them over.',
    start: 'A terminal in your workspace (menu → Terminal → New Terminal).',
    steps: [
      {
        title: 'Tell Git who you are, then copy your team\'s repository',
        where: 'Workspace terminal',
        say: [
          'The first two lines tell Git your name and e-mail once; every change you save will carry them. Put your own name between the quotes.',
          'The third line makes Git remember your password for the day, so you type it only once.',
          'git clone copies the repository, with its whole history, into a folder called hello in your home folder. Git asks for your user name (studentNN) and password: the ones on your access sheet.',
        ],
        run: 'git config --global user.name "Your Name"\ngit config --global user.email "$ME@$DOMAIN"\ngit config --global credential.helper "cache --timeout=36000"\ncd ~\ngit clone https://gitea.$DOMAIN/$TEAM/hello\ncd hello\nls',
        see: 'The folders and files of the service:',
        out: 'Dockerfile  README.md  app  catalog-info.yaml  deploy  pyproject.toml  tests',
      },
      {
        title: 'Start the service',
        where: 'Workspace terminal',
        say: 'This starts the program in this terminal. It keeps running, so the terminal is busy until you stop it.',
        run: 'python3 -m app.main',
        see: 'One line in JSON saying it started on port 8080:',
        out: '{"event": "started", "app": "hello", "env": "local", "version": "dev", "port": 8080}',
      },
      {
        title: 'Call it from a second terminal',
        where: 'A second workspace terminal',
        say: 'Open a second terminal with the + button at the top right of the terminal panel. The first one is still busy running the service. /healthz is the address the platform uses to ask "are you alive?".',
        run: 'curl -s localhost:8080/\ncurl -i localhost:8080/healthz',
        see: 'The service describes itself, then answers the health check with 200 OK:',
        out: '{"app": "hello", "version": "dev", "environment": "local", "message": "Hello from the PE Lab golden path"}\n\nHTTP/1.0 200 OK\nServer: hello Python/3.12.3\nContent-Type: text/plain\nContent-Length: 3\n\nok',
      },
      {
        title: 'Stop it and start it again as "staging"',
        where: 'First terminal, then the second',
        say: [
          'Press Ctrl+C in the first terminal to stop the service.',
          'Then start it again with three settings in front of the command: the environment name, a greeting and another port. The program is the same; only its settings change. This is how one program runs in dev, staging and prod.',
        ],
        run: 'APP_ENV=staging GREETING="Hello from staging" PORT=8081 python3 -m app.main',
        see: 'In the second terminal, curl -s localhost:8081/ now answers:',
        out: '{"app": "hello", "version": "dev", "environment": "staging", "message": "Hello from staging"}',
      },
      {
        title: 'Look at its logs and its numbers',
        where: 'Both terminals',
        say: 'Every request writes one JSON line in the first terminal: that is the log. /metrics is a page of counters that the monitoring system reads.',
        run: 'curl -s localhost:8081/metrics',
        see: 'Counters such as:',
        out: 'http_requests_total{path="/",status="200"} 1\napp_info{app="hello",version="dev",env="staging"} 1\napp_uptime_seconds 74',
        tip: 'Stop the service with Ctrl+C in the first terminal when you are done.',
      },
      {
        title: 'Write down every manual step',
        where: 'Paper or a file',
        say: 'List everything you did to get one copy running: clone, change folder, set the settings, start it, check it, and so on. Then ask: what would it take for 25 people, three environments and a change every day?',
        see: 'Around 8 to 10 steps, for one copy of one app in one environment.',
      },
    ],
    done: 'You ran hello as local and as staging, read its answer, health check, log and metrics, and have a list of your manual steps.',
  },
};
