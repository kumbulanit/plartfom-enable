// Day 6 labs, step by step, for the handbook (see labs/day1.js for the format).
// The k6 summary is from k6 2.3.0; the dashboard panels are those of
// files/grafana-golden-path.json.
'use strict';

const { TERMINAL, OPEN_LINK, PRIVATE_WINDOW, privateWindowAs } = require('./common');

module.exports = {
  'Lab 1: promote hello to staging, then prod': {
    goal: 'Release the image running in dev to staging and then prod, by changing two lines in a reviewed pull request.',
    learn: [
      'How a release works on the platform: a pull request that changes which image runs, and how many copies.',
      'That staging and prod run the very image dev tested, never a rebuild.',
    ],
    words: [
      ['Release (promotion)', 'Moving a tested image to the next environment: dev → staging → prod.'],
      ['newTag', 'The line in deploy/<env>/kustomization.yaml that says which image (which commit) runs there.'],
      ['count', 'The line that says how many copies (replicas) run there. 0 means off.'],
    ],
    start: [
      ...TERMINAL,
      'You have staging and prod (Day 3). You make each release; the reviewer approves it in a private window.',
      'Use one terminal for the whole lab: step 1 stores the release tag in $TAG, which a new terminal would not know.',
    ],
    steps: [
      {
        title: 'Find the tag to release',
        where: 'Workspace terminal, then Harbor',
        why: 'You release the image built from the newest commit on main: the one running in dev. Its tag is that commit\'s id.',
        do: [
          'Paste the box. The last line prints the tag.',
          'Open Harbor (https://harbor.<lab domain>, sign in as studentNN). Click Projects → teamNN (Project Name column) → teamNN/hello (Repositories tab).',
          'In the artifacts list, find the line whose Tags column shows this tag (move the mouse over a cut-short tag to see it whole), and check that its Vulnerabilities column shows a coloured bar: it has been scanned. If there is no such line, the pipeline on main is still running: wait for it and reload.',
        ],
        run: 'cd ~/hello\ngit switch main && git pull\nTAG=$(git rev-parse HEAD)\necho $TAG',
        explain: [
          ['git switch main && git pull', 'the newest main.'],
          ['TAG=$(git rev-parse HEAD)', 'store the id of the newest commit in a variable called TAG. $( ) runs the command inside and uses its answer.'],
          ['echo $TAG', 'print it.'],
        ],
        see: 'A 40-character tag, the same as the newest image in Harbor:',
        out: '283803288206439f84db4279b5d39fd644cb5f24',
      },
      {
        title: 'Change two lines for staging',
        where: 'Workspace terminal',
        why: 'A release is a tiny change in Git: which image, how many copies. Everything else about staging stays as the template made it.',
        run: 'git switch -c release-staging-$ME\nsed -i "s/newTag: .*/newTag: $TAG/; s/count: 0/count: 1/" deploy/staging/kustomization.yaml\ngit diff',
        explain: [
          ['git switch -c release-staging-$ME', 'a branch for the release.'],
          ['sed -i "s/newTag: .*/newTag: $TAG/; s/count: 0/count: 1/" ...', 'two replacements in the staging file: newTag becomes your tag, and count goes from 0 to 1 copy.'],
          ['git diff', 'show exactly what changed.'],
        ],
        change: {
          file: 'deploy/staging/kustomization.yaml',
          how: 'two lines: which image, how many copies.',
          before: 'images:\n  - name: harbor.<lab domain>/teamNN/hello\n    newTag: not-released-yet\nreplicas:\n  - name: hello\n    count: 0',
          after: 'images:\n  - name: harbor.<lab domain>/teamNN/hello\n    newTag: 283803288206439f84db4279b5d39fd644cb5f24\nreplicas:\n  - name: hello\n    count: 1',
        },
        see: 'Exactly two changed lines in git diff: newTag and count.',
        out: '-    newTag: not-released-yet\n+    newTag: 283803288206439f84db4279b5d39fd644cb5f24\n replicas:\n   - name: hello\n-    count: 0\n+    count: 1',
        ifnot: [
          ['newTag: with nothing after it', '$TAG was empty: you are in a new terminal. Run step 1 again, then git checkout deploy/staging/kustomization.yaml and this step again.'],
        ],
      },
      {
        title: 'Propose the release; the reviewer approves',
        where: 'Workspace terminal, then Gitea',
        why: 'A release is reviewed like any change: someone else agrees that this image may go to staging.',
        do: [
          'Paste the box to commit and push.',
          'Open the pulls/new link it prints (' + OPEN_LINK.replace(/:.*$/, '') + ') and click Create Pull Request.',
          'Approve as reviewer: ' + PRIVATE_WINDOW + ' Read Files Changed (two lines), then Review → Approve, and close the private window.',
          'When "All checks were successful", merge with Create squash commit.',
        ],
        run: 'git commit -am "Release ${TAG:0:8} to staging"\ngit push -u origin release-staging-$ME',
        explain: [
          ['git commit -am "Release ${TAG:0:8} to staging"', 'commit, with the first 8 characters of the tag in the message (${TAG:0:8}).'],
        ],
        see: 'A green pipeline (it checks the deploy folders still build), an approval, and the merge.',
      },
      {
        title: 'Watch staging update',
        where: 'Browser: Argo CD',
        why: 'Argo CD sees the change on main and makes staging match it: the release itself needs no command.',
        do: [
          'Open https://argocd.<lab domain> (sign in as delegate if it asks) and click teamNN-hello-staging.',
          { text: 'Within a minute of the merge it starts syncing.', shot: { src: 'argocd-staging.png', caption: 'teamNN-hello-staging after the release: Healthy, Synced to main, the comment of your release commit, and the tree: settings (cm), service (svc), the hello deployment (deploy) with its copies. In your lab the repository is https://gitea.<lab domain>/teamNN/hello.git, and the names, ids and times are your own.' } },
        ],
        see: 'Syncing, then Synced and Healthy, with one pod.',
        tip: 'If the safety net is on: the merge commit\'s safety-net/staging says "Deployed to teamNN-staging: <tag>, 1 replica", and kubectl -n $TEAM-staging get pods shows the pod.',
      },
      {
        title: 'Check staging answers with the right version',
        why: 'The proof: staging runs your tag, and reports its own name and settings.',
        browser: {
          where: 'Browser',
          do: ['Open https://hello-teamNN-staging.<lab domain>/ in a new tab (your team instead of teamNN).'],
          see: 'STAGING in big yellow letters, staging\'s own greeting ("Hello from staging"), and the version: your tag.',
          shot: { src: 'hello-staging.png', caption: 'hello in staging: the same image as dev, with staging\'s settings: STAGING in yellow. The greeting and version in your lab are your own (staging says "Hello from staging").' },
          read: ['Keep the dev tab open next to it: same service, different environment, different colour.'],
        },
        where: 'Workspace terminal',
        run: 'curl -s https://hello-$TEAM-staging.$DOMAIN/',
        explain: [
          ['curl -s https://hello-$TEAM-staging.$DOMAIN/', 'call hello in staging.'],
        ],
        see: '"environment": "staging", "version" with your tag, and staging\'s own greeting:',
        out: '{"app": "hello", "version": "283803288206439f84db4279b5d39fd644cb5f24", "environment": "staging", "message": "Hello from staging"}',
        read: [
          'The greeting comes from staging\'s settings (deploy/staging/kustomization.yaml), not from the code: same image, different settings, exactly as on Day 4.',
        ],
      },
      {
        title: 'Do the same for prod, with two copies',
        where: 'Workspace terminal, then Gitea',
        why: 'Prod gets the same image as staging, with two copies so that one can fail without an outage.',
        do: [
          'Paste the box: from the updated main, the same two lines in deploy/prod, with count 2.',
          'Pull request, approval, merge, as in step 3.',
          'After the merge, call prod (the second box).',
        ],
        run: 'git switch main && git pull\ngit switch -c release-prod-$ME\nsed -i "s/newTag: .*/newTag: $TAG/; s/count: 0/count: 2/" deploy/prod/kustomization.yaml\ngit diff\ngit commit -am "Release ${TAG:0:8} to prod"\ngit push -u origin release-prod-$ME',
        then: {
          say: 'After the merge and a minute:',
          run: 'curl -s https://hello-$TEAM-prod.$DOMAIN/\nkubectl -n $TEAM-prod get pods',
        },
        see: 'prod answers with "environment": "prod" and your tag, and runs two pods. Three environments, three answers, one image.',
        read: [
          'kubectl in prod works, but only for reading: your team may look at prod, not change it by hand. Changes go through Git.',
        ],
        look: {
          do: [
            'In Argo CD, click teamNN-hello-prod: Synced and Healthy, with two pods.',
            'Open https://hello-teamNN-prod.<lab domain>/ in a new tab.',
            'Put the three tabs side by side: dev, staging, prod.',
          ],
          see: 'PROD in big green letters, with your tag. Three environments, three colours, one image.',
          shot: { src: 'hello-prod.png', caption: 'hello in prod: PROD in green, the colour of what customers use. Your greeting and version are your own (prod says "Hello from prod").' },
        },
      },
    ],
    done: 'dev, staging and prod each report their own environment, and staging and prod run the tag you released.',
  },

  'Lab 2: read the dashboard': {
    goal: 'Read your service\'s health on the Golden path services dashboard: versions, traffic, errors and logs. Then write a short service-level report.',
    learn: [
      'How to see, on one page, what runs where, whether it is healthy, how busy it is and what goes wrong.',
      'How to turn what you see into a service-level report.',
    ],
    words: [
      ['Dashboard', 'A page of live panels in Grafana, fed by the service\'s metrics and logs.'],
      ['Service level (SLO)', 'A promise with a number, for example "99% of requests succeed".'],
      ['4xx / 5xx', 'Error answers: 4xx means the request was wrong (404: not found), 5xx means the service failed.'],
    ],
    start: [
      'Lab 1 done: staging runs one copy.',
      'Put the browser and the workspace side by side if you can: you make traffic in the terminal and watch it in Grafana.',
    ],
    steps: [
      {
        title: 'Open the dashboard',
        where: 'Browser: Grafana',
        why: 'One page shows the whole service across its environments: the first place to look in any incident.',
        do: [
          'Open https://grafana.<lab domain> in a new tab. On the sign-in page, type delegate in Email or username, its password from cat /etc/pelab/logins.md in Password (the same read-only login as Argo CD), and click Log in.',
          'Open the menu on the left (if it is closed, click the ☰ icon at the top left) and click Dashboards.',
          'The list shows folders. Click the folder PE Lab to open it, then click Golden path services.',
          'At the top left of the dashboard there are two lists. Team: choose your team, teamNN. Service: choose hello.',
          'At the top right, leave the time range (Last 1 hour) and the refresh (30s) as they are: the dashboard updates itself every 30 seconds. The round arrow button refreshes it now.',
        ],
        see: 'Five panels: What runs where (version = commit SHA), Healthy pods, Requests per second, Failed requests (share of 4xx and 5xx), and Logs. What runs where lists dev, staging and prod, each with its tag.',
      },
      {
        title: 'Make some traffic',
        where: 'Workspace terminal',
        why: 'An idle service shows flat lines. A minute of steady traffic makes the panels speak.',
        run: 'for i in $(seq 1 300); do curl -s -o /dev/null https://hello-$TEAM-staging.$DOMAIN/; sleep 0.2; done',
        explain: [
          ['for i in $(seq 1 300); do ...; done', 'repeat what is between do and done 300 times.'],
          ['curl -s -o /dev/null https://hello-$TEAM-staging.$DOMAIN/', 'call staging and throw the answer away (-o /dev/null): only the traffic matters.'],
          ['sleep 0.2', 'wait a fifth of a second: five calls a second, about a minute in all.'],
        ],
        see: 'The prompt comes back after about a minute. Meanwhile Requests per second rises for staging, to about 5.',
      },
      {
        title: 'Make some errors',
        where: 'Workspace terminal',
        why: 'See what an error looks like on the dashboard, before a real one happens.',
        run: 'for i in $(seq 1 50); do curl -s -o /dev/null https://hello-$TEAM-staging.$DOMAIN/missing; done',
        explain: [
          ['.../missing', 'an address the service does not have: it answers 404.'],
        ],
        see: 'Failed requests (share of 4xx and 5xx) shows a small percentage for staging, within a minute.',
      },
      {
        title: 'Find them in the logs',
        where: 'Browser: Grafana',
        why: 'The panel says something is wrong; the logs say what, request by request.',
        do: [
          'Scroll down to the Logs panel, at the bottom of the dashboard. The newest lines are at the top.',
          'Press Ctrl+F (on a Mac Cmd+F) and type missing: the browser highlights the failed requests.',
        ],
        see: 'One JSON line per failed request:',
        out: '{"event": "request", "app": "hello", "env": "staging", "method": "GET", "path": "/missing", "status": 404, "duration_ms": 0.21}',
      },
      {
        title: 'Write a service-level report',
        where: 'Your team notes',
        why: 'A report turns what you saw into something a service owner can act on.',
        do: [
          'Write three lines: the promise (99% of requests succeed), today\'s measured success rate (100% minus the failed share on the dashboard), and the one alert that exists (it fires when hello has no healthy copy).',
        ],
        see: 'A three-line report for the evidence pack, for example "Promise 99%. Measured today 85% in staging, all of the failures our own 404 test. Alert: no healthy pod for 2 minutes."',
      },
    ],
    done: 'You can read versions, traffic, errors and logs for your service, and have a three-line service-level report.',
  },

  'Lab 3: load-test staging and watch the dashboard': {
    goal: 'Put real load on staging with k6, watch what it does on the dashboard, and turn the numbers into a decision.',
    learn: [
      'How to measure a service under load: throughput, response time (p95) and success rate.',
      'How to turn the numbers into a decision about copies, budget or code.',
    ],
    words: [
      ['k6', 'A load-testing tool: it plays many users at once and measures every answer.'],
      ['VU (virtual user)', 'One simulated user, calling the service in a loop.'],
      ['p95', 'The 95th percentile: 95% of requests were answered at least this fast. A better guide than the average.'],
    ],
    start: [
      ...TERMINAL,
      'Lab 1 done: staging runs. Put the dashboard and the terminal side by side.',
    ],
    steps: [
      {
        title: 'Write the load test',
        where: 'Workspace terminal',
        why: 'A load test is code too: ten lines that say how many users, for how long, and what counts as success.',
        run: 'mkdir -p ~/day6 && cd ~/day6\ncat > load.js <<EOF\nimport http from \'k6/http\';\nimport { check, sleep } from \'k6\';\n\nexport const options = { vus: 20, duration: \'2m\' };\n\nexport default function () {\n  const r = http.get(\'https://hello-$TEAM-staging.$DOMAIN/\');\n  check(r, { \'status is 200\': (res) => res.status === 200 });\n  sleep(0.5);\n}\nEOF\ncat load.js',
        explain: [
          ['cat > load.js <<EOF ... EOF', 'write the lines into load.js. Because EOF has no quotes here, $TEAM and $DOMAIN are filled in with your team and the lab domain.'],
          ['options = { vus: 20, duration: \'2m\' }', '20 virtual users, for two minutes.'],
          ['http.get(...)', 'each user calls staging...'],
          ['check(r, { \'status is 200\': ... })', '...checks the answer is 200...'],
          ['sleep(0.5)', '...and waits half a second: so about 40 calls a second in all.'],
        ],
        see: 'The script, with your team and the lab domain in the address:',
        out: '  const r = http.get(\'https://hello-team03-staging.<lab domain>/\');',
      },
      {
        title: 'Run it',
        where: 'Workspace terminal',
        why: 'Two minutes of steady load give numbers you can compare.',
        run: 'k6 run load.js',
        explain: [
          ['k6 run load.js', 'run the test. A progress bar runs for two minutes; then the summary.'],
        ],
        see: 'A summary. Find four lines: checks_succeeded, http_req_duration (its p(95)), http_req_failed and http_reqs:',
        out: '  █ TOTAL RESULTS\n\n    checks_total.......: 4731    39.4/s\n    checks_succeeded...: 100.00% 4731 out of 4731\n    checks_failed......: 0.00%   0 out of 4731\n\n    ✓ status is 200\n\n    HTTP\n    http_req_duration..............: avg=4.67ms   min=255.36µs med=2.31ms   max=212.56ms p(90)=5.08ms   p(95)=6.15ms\n    http_req_failed................: 0.00%  0 out of 4731\n    http_reqs......................: 4731   39.4/s',
        read: [
          'checks_succeeded: the share of answers that were 200, your success rate.',
          'http_req_duration p(95): 95% of requests were answered at least this fast.',
          'http_reqs: how many requests, and how many per second.',
        ],
      },
      {
        title: 'Watch the dashboard while it runs',
        where: 'Browser: Grafana',
        why: 'The dashboard shows the same load from the service\'s side.',
        do: [
          'Go to the Golden path services dashboard (Team: teamNN, Service: hello), and click the round arrow button at the top right to refresh it; it also refreshes itself every 30 seconds.',
          'In Requests per second, each line is one environment: move the mouse over the lines to see which is staging.',
          'In Failed requests (share of 4xx and 5xx), check the staging line stays at the bottom, at 0%.',
        ],
        see: 'Requests per second for staging rises to about 40; Failed requests stays at 0%.',
      },
      {
        title: 'Run it again with 100 users',
        where: 'Workspace terminal, and the dashboard',
        why: 'Five times the users: does one copy still keep the promise?',
        do: [
          'Run the first box; it takes two minutes.',
          'While it runs, open a second terminal (+) and run the second box a few times: it shows how much CPU and memory the staging pod uses right now.',
        ],
        run: 'k6 run --vus 100 load.js',
        explain: [
          ['k6 run --vus 100 load.js', 'the same test, but with 100 users: --vus overrides the number in the script.'],
        ],
        then: {
          say: 'In the second terminal, while the test runs:',
          run: 'kubectl -n $TEAM-staging top pods',
          explain: [
            ['kubectl -n $TEAM-staging top pods', 'show the CPU (in millicores: 1000m is one core) and memory each staging pod uses now. hello may use at most 200m CPU (a fifth of a core) and 128Mi of memory: the limits in its deployment (deploy/base/deployment.yaml).'],
          ],
        },
        see: 'More requests per second; p95 rises; the pod\'s CPU climbs towards its 200m limit, for example:',
        out: 'NAME                     CPU(cores)   MEMORY(bytes)\nhello-5c7d9b8f6c-8v2kq   187m         31Mi',
      },
      {
        title: 'Turn the numbers into a decision',
        where: 'Your team notes',
        why: 'Numbers are only useful if they lead to a decision.',
        do: [
          'Write down p95 and the success rate at 20 and at 100 users.',
          'Decide: does one copy keep the promise at 100 users? If not, what would you change: more copies, a bigger budget, or the code?',
        ],
        see: 'A short performance note with a recommendation, for example "At 100 users p95 rose from 6 ms to 180 ms; prod needs two copies".',
      },
    ],
    done: 'You have p95 and success rate at two loads, and a recommendation based on them.',
  },

  'Lab 4: break it, and watch the platform recover': {
    goal: 'Cause two incidents on purpose, a manual change and a bad release, and measure how the platform recovers from each. Note the clock time at every step.',
    learn: [
      'Self-healing: the platform undoes a change made by hand, because Git says otherwise.',
      'Recovery through Git: a bad release is undone with a revert, reviewed and recorded like any change.',
      'How to measure time to restore.',
    ],
    words: [
      ['Incident', 'Something that stops a service working as promised.'],
      ['Self-heal', 'Argo CD puts the cluster back to what Git says, by itself.'],
      ['Revert', 'A new commit that undoes an earlier one. History is kept; nothing is erased.'],
      ['Time to restore', 'How long from the start of an incident until the service works again.'],
    ],
    start: [
      ...TERMINAL,
      'Labs 1 and 2 done. Keep the Golden path services dashboard open, and a notes page for the clock times.',
    ],
    steps: [
      {
        title: 'Switch dev off by hand',
        where: 'Workspace terminal',
        why: 'Incident one: someone changes the cluster by hand and switches dev off. Note the time.',
        run: 'date +%T\nkubectl -n $TEAM-dev scale deployment hello --replicas=0\ncurl -s -o /dev/null -w "%{http_code}\\n" https://hello-$TEAM-dev.$DOMAIN/',
        explain: [
          ['date +%T', 'print the time now (hours:minutes:seconds). Write it down.'],
          ['kubectl -n $TEAM-dev scale deployment hello --replicas=0', 'set hello in dev to 0 copies, by hand.'],
          ['curl ... -w "%{http_code}\\n"', 'call dev and print only the status code.'],
        ],
        see: 'The time, the scale confirmation, then 503 (no copy running) instead of 200. The Healthy pods panel drops to 0 for dev.',
        out: '14:02:11\ndeployment.apps/hello scaled\n503',
        look: {
          do: ['Reload your dev tab (https://hello-teamNN-dev.<lab domain>/).'],
          see: 'An error page instead of the red DEV page: dev has no copy running.',
        },
      },
      {
        title: 'Do nothing, and watch',
        why: 'Git still says dev runs one copy. Watch the platform put it back without anyone doing anything.',
        browser: {
          where: 'Browser: Argo CD, and your dev tab',
          do: [
            'In Argo CD, open teamNN-hello-dev. It may already have put dev back: Argo CD notices the change and syncs it back within seconds, so OutOfSync often lasts too short to see.',
            'Wait until its health turns from Progressing (the copy is starting) to Healthy, then reload your dev tab: the red DEV page is back. Note the time.',
          ],
          see: 'Within seconds to a minute, with nobody doing anything: Sync OK "a few seconds ago", Progressing, then Healthy, and DEV answering. The time between your two notes is the time to restore.',
          shot: { src: 'argocd-dev-selfheal.png', caption: 'teamNN-hello-dev seconds after dev was switched off by hand: Argo CD has already synced it back (Sync OK, a few seconds ago) and the new copy is starting (Progressing). In your lab the repository is https://gitea.<lab domain>/teamNN/hello.git, and the names, ids and times are your own.' },
        },
        where: 'Workspace terminal',
        do: [
          'Run the command below: it keeps watching hello in dev and prints a line at every change.',
          { text: 'When READY is 1/1 again, press Ctrl+C to stop watching, and note the time:', cmd: 'date +%T' },
        ],
        run: 'kubectl -n $TEAM-dev get deployment hello -w',
        explain: [
          ['kubectl ... get deployment hello -w', 'show hello in dev, and keep watching (-w) for changes.'],
        ],
        see: 'READY 0/0 changes back to 1/1 within seconds to a minute: Argo CD notices the change and self-heals. The time between your two notes is the time to restore, with no human involved.',
        out: 'NAME    READY   UP-TO-DATE   AVAILABLE   AGE\nhello   0/0     0            0           2d\nhello   0/1     0            0           2d\nhello   0/1     1            0           2d\nhello   1/1     1            1           2d',
        tip: 'If the safety net is on, the platform puts the copy back within two minutes instead.',
      },
      {
        title: 'Release something broken to staging',
        where: 'Workspace terminal, then Gitea',
        why: 'Incident two: a release that cannot work, through the normal path. Even approved changes can be wrong.',
        do: [
          'Paste the box: it releases a tag that does not exist, on a branch.',
          'Open the pull request, approve it as reviewer in a private window, merge. Note the time.',
          { text: 'A minute after the merge, run:', cmd: 'kubectl -n $TEAM-staging get pods' },
        ],
        run: 'cd ~/hello\ngit switch main && git pull\ngit switch -c bad-release-$ME\nsed -i "s/newTag: .*/newTag: does-not-exist/" deploy/staging/kustomization.yaml\ngit commit -am "Release a tag that does not exist"\ngit push -u origin bad-release-$ME',
        explain: [
          ['sed -i "s/newTag: .*/newTag: does-not-exist/" ...', 'point staging at an image tag that does not exist.'],
        ],
        see: 'The new pod cannot start (ErrImagePull, then ImagePullBackOff), but the old pod keeps serving: staging still answers.',
        out: 'NAME                     READY   STATUS             RESTARTS   AGE\nhello-5c7d9b8f6c-8v2kq   1/1     Running            0          1h\nhello-7f6b4c9d5e-m3x7p   0/1     ImagePullBackOff   0          1m',
        read: [
          'Kubernetes only removes the old pod once the new one is healthy: a bad release does not take staging down. That is the rolling update the platform uses.',
        ],
        look: {
          do: [
            'In Argo CD, open teamNN-hello-staging.',
            'Reload your staging tab (https://hello-teamNN-staging.<lab domain>/).',
          ],
          see: 'Argo CD: Synced (the cluster has what Git says), but its health is Progressing, not Healthy: the new pod cannot pull its image (after ten minutes it turns Degraded). The staging tab still shows the yellow STAGING page: the old copy keeps serving.',
          shot: { src: 'argocd-staging-bad.png', caption: 'teamNN-hello-staging after the bad release: Synced to the commit "Release a tag that does not exist", but Progressing. On the right, two copies of the deployment: the new one spinning (it cannot start), the old one Healthy (it keeps serving). In your lab the repository is https://gitea.<lab domain>/teamNN/hello.git, and the names, ids and times are your own.' },
        },
      },
      {
        title: 'Recover through Git',
        where: 'Workspace terminal, then Gitea',
        why: 'Undo the bad release with a revert: a new commit that reverses it, through the same reviewed path. Nothing is erased; the history shows the mistake and the fix.',
        do: [
          'Paste the box: it makes a branch, reverts the last change to the staging file, shows what the revert changed and pushes.',
          'Pull request, approval, merge. Note the time.',
          { text: 'A minute later, run this again: it shows one healthy pod.', cmd: 'kubectl -n $TEAM-staging get pods' },
        ],
        run: 'git switch main && git pull\ngit switch -c revert-bad-release-$ME\ngit revert --no-edit $(git log -1 --format=%H -- deploy/staging/kustomization.yaml)\ngit diff HEAD~1 --stat\ngit push -u origin revert-bad-release-$ME',
        explain: [
          ['git log -1 --format=%H -- deploy/staging/kustomization.yaml', 'find the id of the last commit that changed the staging file: the bad release.'],
          ['git revert --no-edit <that id>', 'make a new commit that undoes it, with the standard message (--no-edit).'],
          ['git diff HEAD~1 --stat', 'show which file the revert changed.'],
        ],
        see: 'The revert commit, changing one line in the staging file:',
        out: '[revert-bad-release-student12 4e111b4] Revert "Release a tag that does not exist (#4)"\n 1 file changed, 1 insertion(+), 1 deletion(-)\n deploy/staging/kustomization.yaml | 2 +-\n 1 file changed, 1 insertion(+), 1 deletion(-)',
        read: [
          'After the merge, staging syncs back to the good tag and the broken pod is replaced. The time from the bad merge to this one is your time to restore through Git, with a full record of who did what.',
        ],
        look: {
          do: ['A minute after the merge, look at teamNN-hello-staging in Argo CD, then reload your staging tab.'],
          see: 'Argo CD: Synced and Healthy again, with the good tag. The staging tab shows STAGING with the good version.',
        },
      },
      {
        title: 'Read the incident timeline',
        where: 'Browser: Argo CD',
        why: 'The platform wrote the timeline for you: every sync, with its commit and time.',
        do: [
          { text: 'Open teamNN-hello-staging in Argo CD and click History and Rollback (at the top).', shot: { src: 'argocd-history.png', caption: 'History and Rollback: every sync, newest first, with when it was deployed, the commit, its author and its message. Here the revert, and under it the bad release. In your lab the repository is https://gitea.<lab domain>/teamNN/hello.git, and the names, ids and times are your own.' } },
        ],
        see: 'Every sync with its commit and time: the good release, the bad one, and the revert. The incident timeline, written by the platform.',
        tip: 'If the safety net is on: in Gitea, open deploy/staging/kustomization.yaml → History. Each commit shows its safety-net/staging result.',
      },
    ],
    done: 'You have two recovery times: one with no human (self-heal) and one through Git (revert).',
  },

  'Capstone: your service to prod, with evidence': {
    goal: 'Take your Day 4 service (rates) from a real improvement to production, with the evidence a reviewer would ask for, and present it.',
    learn: [
      'How the whole platform fits together, end to end, for one service of your own.',
      'How to show a reviewer that a change is safe: the evidence pack.',
    ],
    words: [
      ['Evidence pack', 'The links and screenshots that prove each control worked for your change: review, pipeline, scan, approval, release, monitoring, recovery.'],
      ['Panel', 'Two or three reviewers who score your work with the rubric: operability, security, architecture, evidence and user value.'],
    ],
    start: [
      'Everything from the week: your notes, the Day 1 map, the Day 2 charter, the refusal messages, the reports.',
      'You do all three jobs yourself: the change and the releases, the evidence, and a short presentation. Keep the evidence as you go: it saves time at the end.',
    ],
    steps: [
      {
        title: 'Make one real improvement',
        where: 'Workspace, then Gitea',
        why: 'A real change, however small, through every control of the platform.',
        do: [
          'Agree on one improvement to rates, for example a new field in the answer, or a new test.',
          { text: 'Get the latest rates and make a branch of your own:', cmd: 'cd ~/rates\ngit switch main && git pull\ngit switch -c improvement-$ME' },
          { text: 'Make the change in the editor and save it. Then run the tests:', cmd: 'pytest -q' },
          { text: 'Commit and push:', cmd: 'git add -A\ngit commit -m "Improve rates"\ngit push -u origin improvement-$ME' },
          'Pull request, review, approval, merge, as on Day 2 and in Day 4 Lab 4.',
        ],
        see: 'A green pipeline run on main and a new scanned image in Harbor.',
      },
      {
        title: 'Release it to staging, then prod',
        where: 'Workspace, then Gitea',
        why: 'Promote the tested image, exactly as in Lab 1.',
        do: [
          'In ~/rates, follow Lab 1 steps 1 to 6, with rates instead of hello in the addresses: deploy/staging with one copy, check it, then deploy/prod with two copies.',
        ],
        see: 'Three addresses (rates-teamNN-dev, -staging and -prod) each reporting its environment and your version.',
      },
      {
        title: 'Measure it',
        where: 'Workspace and Grafana',
        why: 'Show that it keeps a promise under load, with numbers.',
        do: [
          { text: 'Make a copy of the load test for rates:', cmd: 'cd ~/day6\ncp load.js rates.js\nsed -i "s/hello-/rates-/" rates.js' },
          { text: 'Run it. While it runs, open the Golden path services dashboard in Grafana, choose Service: rates at the top left, and read Requests per second and Failed requests for staging:', cmd: 'k6 run rates.js' },
        ],
        see: 'p95 and success rate written down, with a recommendation.',
      },
      {
        title: 'Assemble the evidence pack',
        where: 'A folder or a shared page',
        why: 'The panel asks "how do you know?". The pack answers with proof, not claims.',
        do: [
          'Collect, as links or screenshots: the pull requests with their approvals; the pipeline runs; the image with its scan and SBOM; the environment request and its plan (Day 3); the guardrail refusals (Day 2 and Day 5); the release pull requests; the dashboard; the load-test numbers; your recovery times (Lab 4).',
          'Tick each item off on the list as you add it.',
        ],
        see: 'Every item linked or captured.',
      },
      {
        title: 'Prepare five minutes',
        where: 'Your workspace',
        why: 'Five minutes is short: decide what the panel must hear.',
        do: [
          'Plan five parts, one minute each: what you built; the path it took from commit to prod; the evidence; your charter from Day 2 against what you delivered; what you would add to the platform next.',
        ],
        see: 'Five short slides or one page of notes.',
      },
      {
        title: 'Present to the panel',
        where: 'In front of the panel',
        why: 'Explaining it is the final proof that you understand it.',
        do: [
          'Present at your time slot, then answer the panel\'s questions.',
        ],
        see: 'The panel scores against the rubric: operability, security, architecture, evidence and user value.',
      },
    ],
    done: 'Your service runs in prod, your evidence pack is complete, and you have presented.',
  },

  // One last change through the whole platform, done alone: the delegate makes the change
  // and both releases, and plays the reviewer in a private window. The name goes in a file
  // of its own (app/graduates/<user>.txt), so running the box again only updates the name
  // (and people sharing a repository would not conflict).
  'Final lab: your name in dev, staging and prod': {
    goal: 'One last change through the whole platform: put your name on hello\'s page, see it in dev, then release it to staging and prod, with an approval each time.',
    learn: [
      'The whole path in one go: commit, push, pull request, approval, pipeline, dev, then two approved releases.',
      'That staging and prod get the very image dev ran: only a tag in Git changes.',
    ],
    words: [
      ['Graduates file', 'app/graduates/studentNN.txt: a small file with your name in it. The page shows the name it finds there.'],
    ],
    start: [
      ...TERMINAL,
      'Lab 1 done: you have staging and prod, and know how a release works.',
      'You do every step yourself, and approve as the reviewer in a private window, as all week.',
      'Use one terminal for steps 1 to 3: step 1 keeps your name in $NAME, which a new terminal would not know.',
    ],
    steps: [
      {
        title: 'Type your name',
        where: 'Workspace terminal',
        why: 'Your name goes on the page in every environment, so type it the way you want it shown.',
        do: ['Paste the box on its own. It asks for your name: type it as you want it on the page, for example Thandi Mokoena, and press Enter.'],
        run: 'read -p "Your name: " NAME',
        explain: [
          ['read -p "Your name: " NAME', 'ask a question and keep the answer in a variable called NAME, for the next steps.'],
        ],
        see: 'Your name: with your answer after it, and the prompt back.',
      },
      {
        title: 'Put your name on the page',
        where: 'Workspace terminal',
        why: 'A small change to the code, made on a branch, tested before it is pushed: the same as every change this week.',
        do: ['Paste the box. It makes a branch, writes your name in a file of its own, adds the party to the page and runs the tests.'],
        run: "cd ~/hello\ngit switch main && git pull\ngit switch -c congrats-$ME\nmkdir -p app/graduates\necho \"$NAME\" > app/graduates/$ME.txt\npython3 - <<'EOF'\nfrom pathlib import Path\n\nmain = Path(\"app/main.py\")\ncode = main.read_text()\nif \"def congrats()\" in code:\n    print(\"The party is already on the page (you ran this before). Only your name is updated.\")\nelse:\n    block = r'''\n# The end of the course: the names in app/graduates/ (one file each), and what they did.\nWEEK = [\n    (\"🐧\", \"Linux and Git: every change by pull request, with a review\"),\n    (\"🏗️\", \"Infrastructure as code: environments asked for in OpenTofu\"),\n    (\"📦\", \"Containers, and a new service from the golden path template\"),\n    (\"🛡️\", \"A pipeline that tests and scans, and guardrails in the cluster\"),\n    (\"🚀\", \"Releases to dev, staging and prod with GitOps, watched in Grafana\"),\n]\nPARTY = \"\"\"<style>\n  .env { animation: party-glow 2.4s ease-in-out infinite; }\n  .env, .message, .facts, .party { position: relative; z-index: 1; }\n  .party { display: flex; flex-direction: column; align-items: center; gap: 1rem; }\n  .party-trophy { font-size: 4.5rem; animation: party-bounce 1.6s ease-in-out infinite; }\n  .party-title {\n    font-size: clamp(2rem, 9vw, 6.5rem); font-weight: 900; letter-spacing: 0.02em;\n    background: linear-gradient(90deg, #ff4d6d, #ffd166, #06d6a0, #4cc9f0, #b388ff, #ff4d6d);\n    background-size: 200% auto; -webkit-background-clip: text; background-clip: text;\n    color: transparent; animation: party-pop 0.9s ease-out both, party-shine 3s linear infinite;\n  }\n  .party-names { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.7rem; }\n  .party-name {\n    padding: 0.5rem 1.2rem; border-radius: 999px; font-weight: 800;\n    font-size: clamp(1.2rem, 3.2vw, 2rem); color: #1a1a2e;\n    background: linear-gradient(135deg, #ffd166, #ff8fab);\n    box-shadow: 0 0 28px rgba(255, 209, 102, 0.55);\n    animation: party-pop 0.7s ease-out both, party-float 3s ease-in-out infinite;\n  }\n  .party-done { font-size: clamp(1.3rem, 3.6vw, 2.3rem); font-weight: 600; }\n  .party-week {\n    list-style: none; padding: 0; margin: 0.5rem 0 0; display: flex; flex-wrap: wrap;\n    justify-content: center; gap: 0.7rem; width: min(64rem, 92vw);\n  }\n  .party-week li {\n    flex: 0 1 19rem; display: flex; align-items: center; gap: 0.8rem; padding: 0.9rem 1.1rem;\n    box-sizing: border-box; text-align: left; color: #e8e8f0; border-radius: 16px;\n    background: rgba(255, 255, 255, 0.07); border: 1px solid rgba(255, 255, 255, 0.16);\n    backdrop-filter: blur(6px); animation: party-rise 0.7s ease-out both;\n  }\n  .party-week b { font-size: 1.8rem; }\n  .party-confetti { position: fixed; inset: 0; overflow: hidden; pointer-events: none; }\n  .party-confetti i {\n    position: absolute; top: -6vh; width: 10px; height: 16px; opacity: 0.9;\n    animation: party-fall linear infinite;\n  }\n  @keyframes party-fall { to { transform: translateY(112vh) rotate(760deg); } }\n  @keyframes party-pop { 0% { scale: 0; opacity: 0; } 70% { scale: 1.15; } 100% { scale: 1; } }\n  @keyframes party-shine { to { background-position: 200% center; } }\n  @keyframes party-float { 50% { translate: 0 -8px; } }\n  @keyframes party-rise { from { translate: 0 24px; opacity: 0; } }\n  @keyframes party-bounce { 50% { transform: translateY(-16px) rotate(-8deg); } }\n  @keyframes party-glow { 50% { text-shadow: 0 0 48px currentColor; } }\n  @media (prefers-reduced-motion: reduce) {\n    .party-confetti { display: none; }\n    .env, .party, .party * { animation: none !important; }\n  }\n</style>\"\"\"\n\n\ndef congrats() -> str:\n    \"\"\"Return a party for everyone in app/graduates/ (one file per person), or nothing.\"\"\"\n    from html import escape\n    from pathlib import Path\n\n    folder = Path(__file__).parent / \"graduates\"\n    people = sorted(n for p in folder.glob(\"*.txt\") if (n := p.read_text().strip()))\n    if not people:\n        return \"\"\n    colours = [\"#ff4d6d\", \"#ffd166\", \"#06d6a0\", \"#4cc9f0\", \"#b388ff\", \"#ff8fab\"]\n    shapes = [\"50%\", \"2px\", \"0\"]\n    confetti = \"\".join(\n        f'<i style=\"left: {i * 37 % 100}%; background: {colours[i % 6]}; '\n        f\"border-radius: {shapes[i % 3]}; animation-duration: {3 + i % 5 * 0.7:.1f}s; \"\n        f'animation-delay: -{i * 0.23 % 4:.2f}s\"></i>'\n        for i in range(70)\n    )\n    names = \"\".join(\n        f'<span class=\"party-name\" style=\"animation-delay: {0.5 + i * 0.3:.1f}s, {i * 0.4:.1f}s\">'\n        f\"{escape(name)}</span>\"\n        for i, name in enumerate(people)\n    )\n    week = \"\".join(\n        f'<li style=\"animation-delay: {1.2 + i * 0.2:.1f}s\"><b>{icon}</b>{escape(text)}</li>'\n        for i, (icon, text) in enumerate(WEEK)\n    )\n    return (\n        f'{PARTY}\\n  <div class=\"party-confetti\" aria-hidden=\"true\">{confetti}</div>\\n'\n        '  <div class=\"party\">\\n'\n        '    <div class=\"party-trophy\" aria-hidden=\"true\">🏆</div>\\n'\n        '    <div class=\"party-title\">Congratulations</div>\\n'\n        f'    <div class=\"party-names\">{names}</div>\\n'\n        '    <div class=\"party-done\">you are done with Platform Engineering!</div>\\n'\n        f'    <ul class=\"party-week\">{week}</ul>\\n'\n        \"  </div>\"\n    )\n\n'''\n    env = '  <div class=\"env\">{text[\"environment\"]}</div>\\n'\n    code = code.replace(\"\\ndef render_page(\", block + \"\\ndef render_page(\", 1)\n    code = code.replace(env, env + \"  {congrats()}\\n\", 1)\n    main.write_text(code)\n    print(\"Added the party to the page.\")\nEOF\npytest -q\ngit status --short",
        explain: [
          ['git switch -c congrats-$ME', 'a branch of your own for this change.'],
          ['echo "$NAME" > app/graduates/$ME.txt', 'your name, in a file named after you.'],
          ["python3 - <<'EOF' ... EOF", 'add a party to app/main.py, under the environment\'s name: falling confetti, a trophy, a rainbow Congratulations, your name as a glowing badge, and five things you did this week. If the party is already there (you ran this before), only your name is updated.'],
          ['pytest -q', 'run the tests before you push.'],
          ['git status --short', 'what changed: app/main.py (M) and the new folder app/graduates/ (??).'],
        ],
        see: '"Added the party to the page.", the tests passing, and the two changes:',
        out: "Already on 'main'\nYour branch is up to date with 'origin/main'.\nAlready up to date.\nSwitched to a new branch 'congrats-student01'\nAdded the party to the page.\n......                                                                   [100%]\n6 passed in 0.57s\n M app/main.py\n?? app/graduates/",
        ifnot: [
          ['The party is already on the page (you ran this before)', 'nothing is wrong: only your name file is updated. Carry on with step 3.'],
          ['Your name does not show in dev later', 'the name file was empty: $NAME was lost (a new terminal). Run step 1 again, then echo "$NAME" > app/graduates/$ME.txt, commit and push.'],
        ],
      },
      {
        title: 'Commit, push, and open the pull request',
        where: 'Workspace terminal, then Gitea',
        why: 'Nothing reaches an environment without a pull request.',
        do: [
          'Paste the box to commit and push.',
          'Open the pulls/new link it prints (' + OPEN_LINK.replace(/:.*$/, '') + ') and click Create Pull Request.',
        ],
        run: 'git add -A\ngit commit -m "Congratulations $NAME"\ngit push -u origin congrats-$ME',
        explain: [
          ['git add -A', 'put both changes, the page and your name file, into the commit.'],
        ],
        see: 'A pull request with two files changed, and the pipeline running on it.',
      },
      {
        title: 'The reviewer approves; you merge',
        where: 'Gitea',
        why: 'Someone else agrees before anything is merged.',
        do: [
          'Approve as reviewer: ' + privateWindowAs('reviewer') + ' Then Files Changed → Review → Approve, and close the private window.',
          'When "All checks were successful", merge with Create squash commit.',
        ],
        see: 'Merged: the pipeline was green and the reviewer approved.',
      },
      {
        title: 'See your name in dev',
        where: 'Browser',
        why: 'dev follows main: a merged change appears there by itself.',
        do: [
          'Wait a few minutes: the pipeline on main builds the new image (Actions tab, green tick), then Argo CD puts it in dev.',
          'Open https://hello-teamNN-dev.<lab domain>/ in a new tab (your team instead of teamNN).',
        ],
        see: 'DEV glowing red, falling confetti, a bouncing trophy, a rainbow Congratulations, your name on a glowing badge, "you are done with Platform Engineering!" and five cards with what you did this week.',
      },
      {
        title: 'Release it to staging',
        where: 'Workspace terminal, then Gitea',
        why: 'staging gets the very image that dev runs, through an approved two-line change, as in Lab 1.',
        do: [
          'When your name shows in dev, paste the box.',
          'Open the pulls/new link it prints and click Create Pull Request. The reviewer approves (private window, as in step 4); then merge.',
          'A minute after the merge, open https://hello-teamNN-staging.<lab domain>/ in a new tab.',
        ],
        run: 'cd ~/hello\ngit switch main && git pull\nTAG=$(git rev-parse HEAD)\ngit switch -c congrats-staging-$ME\nsed -i "s/newTag: .*/newTag: $TAG/; s/count: 0/count: 1/" deploy/staging/kustomization.yaml\ngit commit -am "Release the congratulations to staging"\ngit push -u origin congrats-staging-$ME',
        explain: [
          ['TAG=$(git rev-parse HEAD)', 'the newest commit on main: its image is the one dev runs.'],
          ['sed -i "s/newTag: .*/newTag: $TAG/; s/count: 0/count: 1/" ...', 'staging runs that image, with one copy (if it was still off).'],
        ],
        see: 'STAGING in yellow, with your name.',
      },
      {
        title: 'Release it to prod',
        where: 'Workspace terminal, then Gitea',
        why: 'prod gets exactly what staging runs, after one more approval.',
        do: [
          'Paste the box. It takes the tag that staging runs, so prod gets the same image.',
          'Open the pulls/new link, Create Pull Request, the reviewer approves, merge.',
          'A minute after the merge, open https://hello-teamNN-prod.<lab domain>/ in a new tab.',
        ],
        run: 'cd ~/hello\ngit switch main && git pull\nTAG=$(awk \'/newTag:/ {print $2}\' deploy/staging/kustomization.yaml)\ngit switch -c congrats-prod-$ME\nsed -i "s/newTag: .*/newTag: $TAG/; s/count: 0/count: 2/" deploy/prod/kustomization.yaml\ngit commit -am "Release the congratulations to prod"\ngit push -u origin congrats-prod-$ME',
        explain: [
          ["TAG=$(awk '/newTag:/ {print $2}' deploy/staging/kustomization.yaml)", 'read the tag staging runs, from Git.'],
          ['sed -i "s/newTag: .*/newTag: $TAG/; s/count: 0/count: 2/" ...', 'prod runs that same image, with two copies (if it was still off).'],
        ],
        see: 'PROD in green, with your name.',
      },
      {
        title: 'Three environments, one image',
        where: 'Browser',
        why: 'The whole week on three tabs: one change, reviewed, tested, built once and released twice.',
        do: [
          'Put the three tabs side by side: dev (red), staging (yellow), prod (green).',
          'Take a screenshot of the three for your evidence pack.',
        ],
        see: 'The same page and your name in all three, each in its own colour. Congratulations: you are done.',
      },
    ],
    done: 'Your name is on hello\'s page in dev, staging and prod: one change, from commit to prod, with an approval at every step.',
  },
};
