// Day 6 labs, step by step, for the handbook (see labs/day1.js for the format).
'use strict';

module.exports = {
  'Lab 1: promote hello to staging, then prod': {
    goal: 'Release the image running in dev to staging and then prod, by changing two lines in a reviewed pull request.',
    start: 'Your team has staging and prod (Day 3). One member drives, the others review.',
    steps: [
      {
        title: 'Find the tag to release',
        where: 'Workspace terminal, then Harbor',
        say: 'The image to release is the one built from the latest commit on main. Its tag is that commit\'s id. Check in Harbor (teamNN → hello) that an image with this tag exists and is scanned. If not, the pipeline on main is still running: wait for it.',
        run: 'cd ~/hello\ngit switch main && git pull\nTAG=$(git rev-parse HEAD)\necho $TAG',
        see: 'A 40-character tag, the same as the newest image in Harbor.',
      },
      {
        title: 'Change two lines for staging',
        where: 'Workspace terminal',
        say: 'In deploy/staging/kustomization.yaml, newTag says which image runs and count says how many copies. Set the tag and one copy.',
        run: 'git switch -c release-staging-$ME\nsed -i "s/newTag: .*/newTag: $TAG/; s/count: 0/count: 1/" deploy/staging/kustomization.yaml\ngit diff',
        see: 'Exactly two changed lines: newTag and count.',
      },
      {
        title: 'Propose the release; a teammate approves',
        where: 'Workspace terminal, then Gitea',
        run: 'git commit -am "Release ${TAG:0:8} to staging"\ngit push -u origin release-staging-$ME',
        see: 'A green pipeline (it checks the deploy folders still build). After an approval, merge.',
      },
      {
        title: 'Watch staging update',
        where: 'Browser: Argo CD',
        say: 'Open teamNN-hello-staging in Argo CD (sign in as delegate if it asks).',
        see: 'Syncing, then Synced and Healthy with 1 pod.',
        tip: 'If the safety net is on: the merge commit\'s safety-net/staging says "Deployed to teamNN-staging: <tag>, 1 replica", and kubectl -n $TEAM-staging get pods shows the pod.',
      },
      {
        title: 'Check staging answers with the right version',
        where: 'Workspace terminal',
        run: 'curl -s https://hello-$TEAM-staging.$DOMAIN/',
        see: '"environment": "staging" and "version" with your tag.',
      },
      {
        title: 'Do the same for prod, with two copies',
        where: 'Workspace terminal, then Gitea',
        say: 'Start from the updated main. Same two lines, in deploy/prod, with count 2. Pull request, approval, merge.',
        run: 'git switch main && git pull\ngit switch -c release-prod-$ME\nsed -i "s/newTag: .*/newTag: $TAG/; s/count: 0/count: 2/" deploy/prod/kustomization.yaml\ngit diff\ngit commit -am "Release ${TAG:0:8} to prod"\ngit push -u origin release-prod-$ME',
        see: 'After the merge: curl -s https://hello-$TEAM-prod.$DOMAIN/ says "environment": "prod". Three environments, three answers, one image.',
      },
    ],
    done: 'dev, staging and prod each report their own environment, and staging and prod run the tag you released.',
  },

  'Lab 2: read the dashboard': {
    goal: 'Read your service\'s health on the Golden path dashboard: versions, traffic, errors and logs. Then write a short service-level report.',
    start: 'Lab 1 done: staging runs one copy.',
    steps: [
      {
        title: 'Open the dashboard',
        where: 'Browser: Grafana',
        say: 'Open https://grafana.<lab domain> and sign in as delegate with the password on your access sheet (the same shared read-only login as Argo CD). Then Dashboards → PE Lab → Golden path. At the top, pick your team and the app hello.',
        see: 'A table of running versions per environment: dev, staging and prod, each with its tag.',
      },
      {
        title: 'Make some traffic',
        where: 'Workspace terminal',
        say: 'This calls staging 300 times, five times a second (about a minute).',
        run: 'for i in $(seq 1 300); do curl -s -o /dev/null https://hello-$TEAM-staging.$DOMAIN/; sleep 0.2; done',
        see: 'Within a minute the requests-per-second panel rises for staging.',
      },
      {
        title: 'Make some errors',
        where: 'Workspace terminal',
        say: 'Ask 50 times for a page that does not exist.',
        run: 'for i in $(seq 1 50); do curl -s -o /dev/null https://hello-$TEAM-staging.$DOMAIN/missing; done',
        see: 'The failed-share panel shows a small percentage of 404 answers.',
      },
      {
        title: 'Find them in the logs',
        where: 'Browser: Grafana',
        say: 'In the logs panel, type missing in the search box.',
        see: 'One JSON line per failed request, for example {"event": "request", ..., "path": "/missing", "status": 404, ...}.',
      },
      {
        title: 'Write a service-level report',
        where: 'Your team notes',
        say: 'Write three lines: the promise (99% of requests succeed), today\'s measured success rate from the dashboard, and the one alert that exists (it fires when hello has no healthy copy).',
        see: 'A three-line report for the evidence pack.',
      },
    ],
    done: 'You can read versions, traffic, errors and logs for your service, and have a three-line service-level report.',
  },

  'Lab 3: load-test staging and watch the dashboard': {
    goal: 'Put real load on staging with k6, watch what it does on the dashboard, and turn the numbers into a decision.',
    start: 'Lab 1 done (staging runs). Put the dashboard and the terminal side by side.',
    steps: [
      {
        title: 'Write the load test',
        where: 'Workspace terminal',
        say: 'This writes the ten-line test from the slide, with your team\'s staging address filled in. 20 virtual users each call staging twice a second, for two minutes.',
        run: 'mkdir -p ~/day6 && cd ~/day6\ncat > load.js <<EOF\nimport http from \'k6/http\';\nimport { check, sleep } from \'k6\';\n\nexport const options = { vus: 20, duration: \'2m\' };\n\nexport default function () {\n  const r = http.get(\'https://hello-$TEAM-staging.$DOMAIN/\');\n  check(r, { \'status is 200\': (res) => res.status === 200 });\n  sleep(0.5);\n}\nEOF\ncat load.js',
        see: 'The script, with your team and the lab domain in the address.',
      },
      {
        title: 'Run it',
        where: 'Workspace terminal',
        run: 'k6 run load.js',
        see: 'A progress bar for two minutes, then a summary. Find three lines: http_reqs (how many, and per second), http_req_duration with p(95), and checks (the share that answered 200).',
      },
      {
        title: 'Watch the dashboard while it runs',
        where: 'Browser: Grafana',
        see: 'Requests per second for staging rise to about 40; the failed share stays at 0%.',
      },
      {
        title: 'Run it again with 100 users',
        where: 'Workspace terminal, and the dashboard',
        say: '--vus overrides the number of users in the script.',
        run: 'k6 run --vus 100 load.js',
        see: 'More traffic; response time (p95) rises; the CPU panel approaches staging\'s budget.',
      },
      {
        title: 'Turn the numbers into a decision',
        where: 'Your team notes',
        say: 'Write down p95 at 20 and at 100 users, and the success rate. Then decide: does one copy keep the promise at 100 users? If not, what would you change: more copies, a bigger budget, or the code?',
        see: 'A short performance note with a recommendation, for example "prod needs two copies".',
      },
    ],
    done: 'You have p95 and success rate at two loads, and a recommendation based on them.',
  },

  'Lab 4: break it, and watch the platform recover': {
    goal: 'Cause two incidents on purpose, a manual change and a bad release, and measure how the platform recovers from each. Note the clock time at every step.',
    start: 'Labs 1 and 2 done. Keep the dashboard open.',
    steps: [
      {
        title: 'Switch dev off by hand',
        where: 'Workspace terminal',
        run: 'date +%T\nkubectl -n $TEAM-dev scale deployment hello --replicas=0\ncurl -s -o /dev/null -w "%{http_code}\\n" https://hello-$TEAM-dev.$DOMAIN/',
        see: 'The time, then an error code instead of 200 (503: no copy is running). The healthy-pods panel drops to 0.',
      },
      {
        title: 'Do nothing, and watch',
        where: 'Browser: Argo CD, and the terminal',
        say: 'Git says dev runs one copy. Watch teamNN-hello-dev in Argo CD, or follow it in the terminal (Ctrl+C to stop watching).',
        run: 'kubectl -n $TEAM-dev get deployment hello -w',
        see: 'Argo CD reports OutOfSync, then self-heals: READY goes back to 1/1, within a few minutes. Note the time: that is the time to restore, with no human involved.',
        tip: 'If the safety net is on, the platform puts the copy back within two minutes instead.',
      },
      {
        title: 'Release something broken to staging',
        where: 'Workspace terminal, then Gitea',
        say: 'Release a tag that does not exist, through the normal path: branch, pull request, approval, merge.',
        run: 'cd ~/hello\ngit switch main && git pull\ngit switch -c bad-release-$ME\nsed -i "s/newTag: .*/newTag: does-not-exist/" deploy/staging/kustomization.yaml\ngit commit -am "Release a tag that does not exist"\ngit push -u origin bad-release-$ME',
        see: 'After the merge, the new pod cannot start (kubectl -n $TEAM-staging get pods shows ErrImagePull or ImagePullBackOff), but the old pod keeps serving: staging still answers.',
      },
      {
        title: 'Recover through Git',
        where: 'Workspace terminal, then Gitea',
        say: 'Undo the bad release with git revert: a new commit that reverses it. Same path: branch, pull request, approval, merge. Note the time.',
        run: 'git switch main && git pull\ngit switch -c revert-bad-release-$ME\ngit revert --no-edit $(git log -1 --format=%H -- deploy/staging/kustomization.yaml)\ngit diff HEAD~1 --stat\ngit push -u origin revert-bad-release-$ME',
        see: 'After the merge, staging syncs back to the good tag and the broken pod is replaced. Time to restore measured, with a full record of who did what.',
      },
      {
        title: 'Read the incident timeline',
        where: 'Browser: Argo CD',
        say: 'Open teamNN-hello-staging → History and Rollback.',
        see: 'Every sync with its commit and time: the incident timeline, written by the platform.',
        tip: 'If the safety net is on: in Gitea, open deploy/staging/kustomization.yaml → History. Each commit shows its safety-net/staging result.',
      },
    ],
    done: 'You have two recovery times: one with no human (self-heal) and one through Git (revert).',
  },

  'Capstone: your service to prod, with evidence': {
    goal: 'As a team, take your Day 4 service (rates) from a real improvement to production, with the evidence a reviewer would ask for, and present it.',
    start: 'Everything from the week. Split the work: one person drives the change, one collects evidence, one prepares the presentation.',
    steps: [
      {
        title: 'Make one real improvement',
        where: 'Workspace, then Gitea',
        say: 'For example a new field in the answer, or a new test. Branch, pull request, review, approve, merge: as on Day 2 and in Day 4 Lab 4, in ~/rates.',
        see: 'A green pipeline run on main and a new scanned image in Harbor.',
      },
      {
        title: 'Release it to staging, then prod',
        where: 'Workspace, then Gitea',
        say: 'As in Lab 1, in ~/rates: deploy/staging with one copy, check it, then deploy/prod with two copies.',
        see: 'Three addresses (rates-teamNN-dev, -staging and -prod) each reporting its environment and your version.',
      },
      {
        title: 'Measure it',
        where: 'Workspace and Grafana',
        say: 'Run a two-minute load test against rates in staging (Lab 3, with rates in the address) and read the dashboard.',
        see: 'p95 and success rate written down, with a recommendation.',
      },
      {
        title: 'Assemble the evidence pack',
        where: 'A folder or a shared page',
        say: 'Collect, as links or screenshots: the pull requests with their approvals, the pipeline runs, the image with its scan and SBOM, the environment request and its plan, the guardrail refusals, the release pull requests, the dashboard, the load-test numbers and your recovery times.',
        see: 'Every item linked or captured.',
      },
      {
        title: 'Prepare ten minutes',
        where: 'Your team',
        say: 'What we built; the path it took from commit to prod; the evidence; our charter from Day 2; what we would add to the platform next.',
        see: 'Five slides or one whiteboard.',
      },
      {
        title: 'Present to the panel',
        where: 'In front of the panel',
        say: 'Present at 14:45 and answer questions.',
        see: 'The panel scores against the rubric: operability, security, architecture, evidence and user value.',
      },
    ],
    done: 'Your service runs in prod, your evidence pack is complete, and you have presented.',
  },
};
