// Day 6: Deploy, observe and the capstone
'use strict';
const DOMAIN = '<lab domain>';

module.exports = [
  {
    type: 'title', section: 'Opening',
    title: 'Deploy, observe and the capstone',
    subtitle: 'Release to staging and prod safely, see the service running, measure it under load, and present your work.',
    highlight: ['GitOps', 'Environments', 'Observe'],
    notes: 'The last day completes the path: the same hello app that ran by hand on Monday is promoted to staging and prod by pull request, watched on a dashboard, load-tested, broken and recovered. The afternoon is the capstone: each delegate takes their own Day 4 service through the same path and presents the evidence.',
  },
  {
    type: 'goal', section: 'Opening',
    goal: 'Release to staging and prod through Git, read the dashboard, recover from a bad change, and present your service with its evidence.',
    outcomes: [
      'Promote a release to staging and then prod by pull request, and see each environment report its name',
      'Read the dashboard, run a load test, and explain end-to-end performance engineering',
      'Break and recover a service, and assemble the evidence pack for the capstone',
    ],
    highlight: ['GitOps', 'Environments', 'Observe'],
    notes: 'Outcomes map to the brief\'s Labs 7 (observability), 8 (resilience and recovery), 10 (capacity, lightly) and 11 (capstone).',
  },
  {
    type: 'agenda', section: 'Opening',
    title: "Today's plan",
    bridge: 'Yesterday you saw what the pipeline and the guardrails refuse. Today you release to staging and prod, watch the service, break it, and present your capstone.',
    notes: 'Timings matter today: the capstone panel is at 14:45. Keep Labs 1 to 4 moving.',
  },
  {
    type: 'rows', section: 'Kubernetes and GitOps',
    title: 'Kubernetes in one slide: the five words you need',
    intro: 'You will see these in Argo CD and on the dashboard. You will not type them; the templates already wrote them.',
    rows: [
      { icon: 'FiServer', head: 'Cluster', text: 'The machines that run containers, managed as one. In the lab: one server running k3s.' },
      { icon: 'FiLayers', head: 'Namespace', text: 'A fenced area inside the cluster with its own budget, access and network rules. One per environment: teamNN-dev, teamNN-staging, teamNN-prod.' },
      { icon: 'FiBox', head: 'Pod and Deployment', text: 'A Pod is a running container. A Deployment says "keep N copies of this image running, and replace them carefully when the image changes". Replicas is N.' },
      { icon: 'FiGlobe', head: 'Service and Ingress', text: 'A Service is the stable internal address for the pods. An Ingress is the public address: https://hello-teamNN-dev.<domain>.' },
      { icon: 'FiSliders', head: 'ConfigMap', text: 'The settings for an environment (APP_ENV, GREETING), supplied to the container as environment variables. Same image, different ConfigMap.' },
    ],
    notes: 'Resist going deeper. These five, seen in Argo CD\'s tree view, are enough for delegates to follow what the platform does. Kubernetes as a subject is a course of its own; here it is hidden behind the templates, deliberately.',
  },
  {
    type: 'concept', section: 'Kubernetes and GitOps',
    title: 'GitOps and promotion: how a release reaches prod',
    figure: { src: 'promotion.svg', caption: 'dev follows main automatically; staging and prod change only through an approved two-line release pull request.' },
    icon: 'FiRefreshCw',
    idea: [
      'The repository holds one folder per environment: deploy/dev, deploy/staging, deploy/prod. Each says which image tag runs there and how many copies. Argo CD makes each namespace match its folder.',
      'dev follows main: every merge runs the newest image. staging and prod run only the tag written in their folder, so they change only when someone changes that file, by pull request, with an approval.',
      'Promotion is therefore a two-line change: the tag (the commit id of a build that passed every check) and the replica count. Rollback is a revert of that change. Deterministic, recorded, no production access needed.',
    ],
    lab: [
      'Find the tag in Harbor or in the pipeline log.',
      'Edit deploy/staging/kustomization.yaml: newTag and replicas.',
      'Pull request, approval, merge. Argo CD syncs within a few minutes.',
      'The same for deploy/prod, with two replicas.',
    ],
    oneLiner: 'Promotion is a reviewed change to the tag in an environment\'s folder; Argo CD does the rest.',
    notes: 'The brief\'s delivery automation module asks for "promotion, rollback and evidence capture". All three are Git operations here. Emphasise that nobody in the room has production access, and nobody needs it.',
  },
  {
    type: 'code', section: 'Kubernetes and GitOps',
    title: 'The promotion change: two lines',
    code: `# deploy/staging/kustomization.yaml   (before -> after)

images:
  - name: harbor.${DOMAIN}/teamNN/hello
-   newTag: not-released-yet
+   newTag: 3f9c2a7e1b0d4c5e6f7a8b9c0d1e2f3a4b5c6d7e
    # the new tag is the commit id, copied from Harbor

replicas:
  - name: hello
-   count: 0
+   count: 1

# deploy/prod/kustomization.yaml: the same, with count: 2`,
    notesRight: [
      'newTag: the exact image that passed the pipeline. Copy it from Harbor; never type "latest".',
      'count: how many copies run. Staging gets one; prod gets two, so one can restart without downtime.',
      'Nothing else changes between environments except the settings in the ConfigMap.',
      'The pull request shows exactly these lines. The reviewer can check the tag against the scan in Harbor.',
    ],
    notes: 'Show the real file. The long tag looks intimidating; explain it is the commit id, so the reviewer can click through to the exact code, the pipeline run and the scan. That click-through is the traceability the brief asks for.',
  },
  {
    type: 'steps', section: 'Lab 1: promote to staging and prod', time: '40 min · on your own',
    title: 'Lab 1: promote hello to staging, then prod',
    steps: [
      { do: 'In Harbor (signed in as studentNN), open teamNN/hello and copy the tag of the newest scanned image (the commit id).', expect: 'A 40-character tag on your clipboard.' },
      { do: 'cd ~/hello && git switch main && git pull && git switch -c release-staging. Edit deploy/staging/kustomization.yaml: newTag to the tag, count to 1.', expect: 'git diff shows two changed lines.' },
      { do: 'Commit "Release <short tag> to staging", push, open a pull request, get an approval, merge.', expect: 'The pipeline is green (it checks the deploy folders build).' },
      { do: 'Open Argo CD, application teamNN-hello-staging.', expect: 'Syncing, then Synced and Healthy with 1 pod.' },
      { do: `Open https://hello-teamNN-staging.${DOMAIN}/`, expect: '"environment": "staging", "version": "<your tag>".' },
      { do: 'Repeat for deploy/prod with count: 2, on a branch release-prod.', expect: `https://hello-teamNN-prod.${DOMAIN}/ says "environment": "prod". Three environments, three answers, one image.` },
    ],
    notes: 'This is the moment the course has been building to: the app from Monday is in production, through the platform, with evidence at every step. Take a screenshot of the three URLs side by side for the evidence pack. If Argo CD shows the prod app as OutOfSync and does not sync, check that the approval happened and main contains the change.',
  },
  {
    type: 'section', section: 'Observability',
    title: 'Observe',
    subtitle: 'Is the service keeping its promise? Metrics, logs, dashboards and a simple service level objective. Then you read your own service\'s dashboard (Lab 2).',
    notes: 'The last piece of the platform. Everything so far was about getting a change to production safely; this is about knowing it is working once there.',
  },
  {
    type: 'concept', section: 'Observability',
    title: 'Observability and SLOs in plain words',
    figure: { src: 'observability.svg', caption: 'What the dashboard reads: metrics and logs from every copy of the service, in every environment.' },
    icon: 'FiActivity',
    idea: [
      'Metrics are numbers over time: requests per second, errors, response time, CPU. Logs are the events, one line each. A dashboard puts the numbers on screen; an alert says when a number crosses a line.',
      'A service level indicator (SLI) is a number that measures the promise, such as the share of requests that succeed. A service level objective (SLO) is the target: 99% of requests succeed. The error budget is the 1% you may spend on changes and incidents.',
      'Observability is what lets a team say "it works" with evidence, and lets an incident be found in minutes rather than reported by a user.',
    ],
    lab: [
      'hello exposes /metrics; Prometheus collects it every 30 seconds.',
      'Alloy ships the JSON logs to Loki.',
      'the Golden path services dashboard in Grafana shows versions, traffic, errors and logs per team and environment.',
      'The template includes one alert: the service is down for five minutes.',
    ],
    oneLiner: 'Observability turns "it works" into numbers and logs you can see; an SLO is the promise those numbers must keep.',
    notes: 'Brief Lab 7 asks for dashboards, alert rules, an SLO report and an incident timeline. The lab provides the first two; the SLO report and the timeline are the next two labs\' output. Keep SRE vocabulary minimal: SLI, SLO, error budget.',
  },
  {
    type: 'steps', section: 'Observability', time: '30 min',
    title: 'Lab 2: read the dashboard',
    steps: [
      { do: `Open Grafana at https://grafana.${DOMAIN} (sign in as delegate: the password is in cat /etc/pelab/logins.md), folder PE Lab, dashboard Golden path services. Pick your team name (teamNN) and the app hello.`, expect: 'A table of running versions per environment: dev, staging and prod with their tags.' },
      { do: 'In your workspace, generate traffic: for i in $(seq 1 300); do curl -s https://hello-teamNN-staging.<domain>/ > /dev/null; sleep 0.2; done', expect: 'The requests-per-second panel rises for staging within a minute.' },
      { do: 'Request a page that does not exist 50 times: curl -s .../missing', expect: 'The failed-share panel shows a small percentage of 404s.' },
      { do: 'Open the logs panel and filter for "missing".', expect: 'One JSON log line per failed request, with the path and status.' },
      { do: 'Write down: your SLO (99% success), today\'s measured success rate, and the one alert that exists.', expect: 'A three-line SLO report for the evidence pack.' },
    ],
    notes: 'Make the connection to the version table: this is how the dashboard proves which version runs where, which an auditor and an incident responder both need. The three-line SLO report is the brief\'s "SLO report" at its simplest.',
  },
  {
    type: 'section', section: 'Performance engineering',
    title: 'Performance engineering',
    subtitle: 'You can see the service\'s health on the dashboard. Next: put real load on staging and turn the numbers into a decision (Lab 3).',
    notes: 'The dashboard from Lab 2 stays open: Lab 3 watches it under load.',
  },
  {
    type: 'concept', section: 'Performance engineering',
    title: 'End-to-end performance engineering',
    icon: 'FiTrendingUp',
    idea: [
      'Performance has two halves, and a platform measures both from the same place. Delivery performance: how fast and safely changes flow, measured as lead time for a change, deployment frequency, change failure rate and time to restore. Runtime performance: how the service behaves under load, measured as response time, error rate and saturation of its budget.',
      'End to end means tracing one change from the pull request to its effect in production: when it was merged, when it was live, what it did to response time and errors, and how fast a bad one was undone.',
      'The platform makes these numbers a by-product: Git gives lead time, Argo CD gives deployment time, the dashboard gives runtime, and the incident lab gives time to restore.',
    ],
    lab: [
      'Lead time: from first commit to live in dev, read from Git and Argo CD.',
      'Deployment frequency: count your deployments this week.',
      'Runtime: a two-minute k6 load test against staging, watched on the dashboard.',
      'Time to restore: measured in the next lab.',
    ],
    oneLiner: 'Performance engineering end to end measures both the flow of changes and the service under load, from one platform.',
    notes: 'This is where "drive end-to-end performance engineering" lives. The four delivery measures are the DORA metrics; name them but do not lecture. The practical hook is the next two labs: the load test gives runtime numbers, the break-and-recover lab gives time to restore. Compare with the Day 1 delivery map: the same change measured on the platform is minutes, not days.',
  },
  {
    type: 'code', section: 'Performance engineering',
    title: 'A load test in ten lines: k6',
    code: `// ~/day6/load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = { vus: 20, duration: '2m' };

export default function () {
  const r = http.get('https://hello-teamNN-staging.${DOMAIN}/');
  check(r, { 'status is 200': (res) => res.status === 200 });
  sleep(0.5);
}

// run it:   k6 run load.js`,
    notesRight: [
      'vus: 20 virtual users, each calling the service in a loop for two minutes.',
      'check: counts how many answers were good. That is your SLI under load.',
      'k6 prints requests per second, response time (average and p95) and the check pass rate.',
      'Run it against staging, never prod, unless the platform team agrees.',
    ],
    notes: 'k6 is in every workspace. The output summary has everything needed: http_reqs per second, http_req_duration p(95), and the checks percentage. Teach delegates to read p95: "95% of requests were faster than this".',
  },
  {
    type: 'steps', section: 'Performance engineering', time: '30 min',
    title: 'Lab 3: load-test staging and watch the dashboard',
    steps: [
      { do: 'Create ~/day6/load.js from the previous slide with your staging address. Open the dashboard beside the terminal.', expect: 'Two windows: terminal and Grafana.' },
      { do: 'k6 run load.js', expect: 'A live progress bar; after two minutes a summary with http_reqs, http_req_duration p(95) and checks.' },
      { do: 'On the dashboard, watch requests per second and the failed share during the run.', expect: 'Traffic rises to roughly 40 requests per second; failures stay at 0%.' },
      { do: 'Run again with vus: 100. Watch the healthy-pods and CPU panels.', expect: 'Higher traffic; response time rises; CPU approaches the environment\'s budget.' },
      { do: 'Write down p95 at 20 and at 100 users, and the success rate. Decide: does one replica keep the SLO at 100 users?', expect: 'A short performance note for the evidence pack, with a recommendation (for example: prod needs two replicas).' },
    ],
    notes: 'This is runtime performance engineering with real numbers from the delegates\' own service. The recommendation step matters: performance engineering ends in a decision (more replicas, a higher budget, a code change), made from evidence. The brief\'s Lab 10 (capacity) starts here.',
  },
  {
    type: 'section', section: 'Resilience',
    title: 'Resilience',
    subtitle: 'You know how the service behaves under load. Next: break it on purpose, twice, and time how the platform recovers (Lab 4).',
    notes: 'Ask the room to predict the recovery times before the lab; compare after.',
  },
  {
    type: 'steps', section: 'Resilience', time: '35 min',
    title: 'Lab 4: break it, and watch the platform recover',
    figure: { src: 'recovery.svg', caption: 'Two incidents, two ways back: Argo CD self-heals a change made by hand; Git reverts a bad release.' },
    steps: [
      { do: 'Note the time. kubectl -n teamNN-dev scale deployment hello --replicas=0', expect: `https://hello-teamNN-dev.${DOMAIN}/ stops answering; the healthy-pods panel drops to 0.` },
      { do: 'Watch Argo CD, application teamNN-hello-dev. Do nothing else.', expect: 'Within a few minutes it reports OutOfSync, self-heals, and the service answers again. Note the time: that is time to restore, with no human.' },
      { do: 'Now a bad release: on a branch, set deploy/staging newTag to does-not-exist. Pull request, approve, merge.', expect: 'Argo CD syncs; the new pod fails with ImagePullBackOff; the healthy-pods panel for staging drops; the old pod keeps serving.' },
      { do: 'Recover through Git: git revert <merge commit> on a branch, pull request, approve, merge. Note the time.', expect: 'Argo CD syncs back to the good tag; healthy pods return. Time to restore measured, with a full record.' },
      { do: 'Open Argo CD\'s History tab for staging.', expect: 'Every sync listed with its commit: the incident timeline, written by the platform.' },
    ],
    notes: 'Brief Lab 8: controlled failure, restoration, recovery objectives evidenced. The two cases teach two recoveries: drift corrected by GitOps without a person, and a bad change undone by a revert with a person and a record. Point out that production access was never needed. Argo CD\'s history is the incident timeline for the evidence pack.',
  },
  {
    type: 'scenarios', section: 'Resilience',
    title: 'Scenarios: budgets and recovery',
    items: [
      { n: 6, icon: 'FiDollarSign', color: 'accent2', name: 'Over budget', does: 'A pull request raises the service\'s CPU request to 10 cores "to be safe".', platform: 'The deployment is refused: the environment\'s budget is 1 CPU. The message names the quota. The team asks for a bigger size through the environment template if it really needs it.', rule: 'Budgets and fair sharing. Capacity is a reviewed decision, not a side effect.' },
      { n: 9, icon: 'FiRefreshCw', color: 'accent1', name: 'The hand edit', does: 'An administrator "fixes" dev by hand at 2 a.m. and forgets to tell anyone.', platform: 'Argo CD notices that the cluster no longer matches Git and puts it back within minutes. The real fix has to go through a pull request, where it is reviewed and recorded.', rule: 'Git is the source of truth; the cluster is made to match it.' },
      { n: 10, icon: 'FiRotateCcw', color: 'accent4', name: 'The bad release', does: 'A release to prod passes every check but misbehaves under real traffic.', platform: 'Rollback is a revert of the two-line promotion change: pull request, approval, merge. Argo CD returns prod to the previous tag. The history shows both the release and the rollback.', rule: 'Deterministic rollback, with evidence.' },
    ],
    notes: 'Delegates have now seen scenario 9 and 10 in Lab 4; scenario 6 can be done live by one team if time allows (edit the CPU request in deploy/base/deployment.yaml on a branch and apply it in dev with kubectl to see the quota refusal).',
  },
  {
    type: 'section', section: 'Capstone',
    title: 'Capstone',
    subtitle: 'Take your own service to production through the whole path, collect the evidence, and present it to the panel.',
    notes: 'Each delegate works alone, on their own VM, with their Day 4 service (rates or whatever they named it). Instructors circulate; the panel arrives at 14:45.',
  },
  {
    type: 'steps', section: 'Capstone', time: '90 min · on your own',
    title: 'Capstone: your service to prod, with evidence',
    steps: [
      { do: 'Make one real improvement to your Day 4 service: a new field in the response, or a new test. Pull request, approve as reviewer, merge.', expect: 'A green pipeline run on main and a new scanned image in Harbor.' },
      { do: 'Promote it to staging, check it, then promote it to prod with two replicas.', expect: 'Three URLs reporting dev, staging and prod, with your version.' },
      { do: 'Run a two-minute load test against staging and read the dashboard.', expect: 'p95 and success rate written down; a recommendation.' },
      { do: 'Assemble the evidence pack (next slide) in a folder or a shared page.', expect: 'Every item linked or screenshotted.' },
      { do: 'Prepare a five-minute presentation: what you built, the path it took, the evidence, your charter, what you would add to the platform next.', expect: 'Five short slides or one page of notes.' },
      { do: 'Present to the panel when the instructor calls you. Answer questions.', expect: 'The panel scores against the rubric: operability, security, architecture, evidence, user value.' },
    ],
    notes: 'The brief\'s capstone: "a production-equivalent platform product increment for a representative workload, defended before a multidisciplinary panel". At this level the workload is the delegate\'s own service and the panel is two or three reviewers. Score with the rubric, kindly and honestly; professional practice (documentation, conduct) is 15% of the mark.',
  },
  {
    type: 'rows', section: 'Capstone',
    title: 'The evidence pack: where each item comes from',
    intro: 'Evidence by default: every item below was produced by normal work this week. Nobody writes it afterwards.',
    rows: [
      { icon: 'FiGitPullRequest', head: 'Change control', text: 'The pull request with its review and approval; the three refusal messages from Day 2 (push to main, self-approval, stale approval).' },
      { icon: 'FiPlay', head: 'Pipeline and supply chain', text: 'The green run on main; the image tag; the Harbor vulnerability report and SBOM; the Day 5 failures for a bad test, a secret and a root user.' },
      { icon: 'FiLock', head: 'Policy', text: 'The three guardrail refusals and the fixed deployment; the Kyverno CLI pass and fail output.' },
      { icon: 'FiLayers', head: 'Environments and promotion', text: 'The environment pull request with its plan; the staging and prod promotion pull requests; Argo CD\'s history for each environment.' },
      { icon: 'FiActivity', head: 'Operations', text: 'The dashboard with versions per environment; the SLO note; the load-test numbers and recommendation; the two recovery times from Lab 4.' },
    ],
    notes: 'This list is also the answer to the brief\'s "required evidence" column for Labs 2 to 8. Delegates who keep links as they go finish the capstone in time; those who look for evidence afterwards do not. Say so at 09:00.',
  },
  {
    type: 'steps', section: 'Final lab', time: '30 min · on your own',
    title: 'Final lab: your name in dev, staging and prod',
    steps: [
      { do: 'Type your name: read -p "Your name: " NAME', expect: 'Your name is kept in $NAME.' },
      { do: 'Paste the box: a branch, your name in app/graduates/studentNN.txt, the party on the page, the tests.', expect: '"Added the party to the page" and 6 passed.' },
      { do: 'Commit, push, open the pull request.', expect: 'A pull request with two files changed; the pipeline runs.' },
      { do: 'The reviewer approves in a private window; you merge.', expect: 'Green pipeline, one approval, merged.' },
      { do: 'Open https://hello-teamNN-dev.<domain>/ a few minutes after the merge.', expect: 'DEV glowing red, confetti, a rainbow Congratulations, your name on a badge, "you are done with Platform Engineering!" and five things from the week.' },
      { do: 'Release to staging (newTag = the newest commit on main). The reviewer approves; merge.', expect: 'STAGING in yellow, with your name.' },
      { do: 'Release to prod (newTag = what staging runs). The reviewer approves; merge.', expect: 'PROD in green, with your name.' },
      { do: 'Put dev, staging and prod side by side and take a screenshot.', expect: 'One image, three environments, an approval at every step.' },
    ],
    notes: 'The week in one change, done alone: commit, pull request, approval, pipeline, dev, then two approved releases. Each delegate plays the reviewer in a private window, as all week. Run it after the capstone presentations, as the celebration: put everyone\'s prod page on the big screen.',
  },
  {
    type: 'picture', section: 'Looking back, and ahead', src: 'platform-week.svg',
    title: 'The week on one page: how the pieces come together',
    // No caption: the diagram says it in its own headline, and keeps the whole height of the slide.
    points: [
      'A, a service change: golden path, workspace, pull request, CI pipeline and Harbor, then Argo CD.',
      'B, an environment: the same moves, with OpenTofu and the platform applier.',
      'C, an exception to a rule: the same moves again, with Kyverno.',
      'Grey is what people do; blue is what the platform does by itself.',
      'Underneath: watch it in Grafana, recover from Git, keep the evidence.',
    ],
    notes: 'Walk one row at a time, left to right, and ask the room which lab each box was (the yellow tags say the day). Then point at the columns, not the rows: every flow has a template, a pull request, a check and an automatic apply. That pattern, not any one tool, is the platform. End on the bottom row: the capstone evidence pack is simply what each box left on record.',
  },
  {
    type: 'diagram', section: 'Looking back, and ahead',
    title: 'What we built this week: the whole platform, used end to end',
    tools: [
      { name: 'Workspace', tool: 'Linux, Docker, Git', what: 'Days 1 and 4' },
      { name: 'Portal', tool: 'Backstage', what: 'Days 1 and 4' },
      { name: 'Template', tool: 'Golden path', what: 'Days 3, 4 and 5' },
      { name: 'Repository', tool: 'Gitea', what: 'Day 2' },
      { name: 'Pipeline', tool: 'Gitea Actions', what: 'Day 5' },
      { name: 'Registry', tool: 'Harbor', what: 'Day 5' },
      { name: 'GitOps', tool: 'Argo CD', what: 'Days 2 and 6' },
      { name: 'Environments', tool: 'k3s + Kyverno', what: 'Days 3, 5 and 6' },
      { name: 'Observe', tool: 'Grafana, Loki', what: 'Day 6' },
    ],
    highlight: ['Workspace', 'Portal', 'Template', 'Repository', 'Pipeline', 'Registry', 'GitOps', 'Environments', 'Observe'],
    caption: 'Monday: the app ran by hand. Friday: it runs in prod through every piece of this path, with evidence at each step. Nothing was deployed by a person.',
    notes: 'Put this beside the Day 1 delivery maps on the wall. Ask the room how many of their bottlenecks the platform removed, and which remain (they are usually organisational, not technical). That conversation is the brief\'s "lead platform transformation" outcome, at awareness level.',
  },
  {
    type: 'picture', section: 'Looking back, and ahead', src: 'platform-before.svg',
    title: 'Before platform engineering',
    // No caption: the diagram says it, and keeps the whole width of the slide.
    points: [
      'Every team sets up every tool itself: 3 teams × 6 tools = 18 set-ups, each a little different.',
      'What a team cannot do itself waits in the ops team\'s ticket queue: days to weeks.',
      'What it costs: slow, risky, inconsistent, overloaded teams, and evidence gathered afterwards.',
    ],
    notes: 'This is Day 1: ask the room to point at where their own Lab 1 delivery map sits in this picture, usually the ticket queue. Read the right-hand column slowly; the next slide answers each line in the same row.',
  },
  {
    type: 'picture', section: 'Looking back, and ahead', src: 'platform-after.svg',
    title: 'After platform engineering',
    points: [
      'Teams use one way in: the portal, templates and a pull request. No tickets.',
      'A platform team wires the tools once, with guardrails built in, and runs it as a product, with feedback from the teams.',
      'Each cost becomes a gain: faster, safer, consistent, less to learn, audit-ready.',
    ],
    notes: 'Go back and forth with the previous slide: slow becomes faster, risky becomes safer, inconsistent becomes consistent, overloaded becomes less to learn, audit pain becomes audit-ready. Then ask which box of the platform they used in which lab this week. The next slide puts both side by side and adds where the road can go next.',
  },
  {
    type: 'picture', section: 'Looking back, and ahead', src: 'platform-why.svg',
    title: 'Platform engineering: where it was, is, and can go',
    // No caption: the three numbered parts of the diagram say it, and it keeps the whole height.
    points: [
      'Where it was: every team wires every tool itself, and waits on tickets for the rest.',
      'Where it is now: one way in, built once by a platform team, with the checks built in.',
      'What it gives the bank: faster, safer, consistent, less to learn, audit-ready.',
      'Where it can go next: single sign-on, signed images, canary releases, APIs and events, cost per team.',
    ],
    notes: 'Left is Day 1: put it next to the delivery maps the teams drew in Lab 1 and ask which of their waits it shows. Right is what they used all week; ask them to name the lab where they met each box. The bottom row is the road ahead: each dashed box is one setting in the lab build, already prepared but switched off. The next slide says what each one would bring.',
  },
  {
    type: 'rows', section: 'Looking back, and ahead',
    title: 'What you would add next: the platform roadmap',
    intro: 'Every capstone presentation ends with this. Some options the lab already contains, switched off.',
    rows: [
      { icon: 'FiKey', head: 'Single sign-on', text: 'Keycloak: one login for every tool, tied to the bank\'s directory. The brief\'s "enterprise identity, MFA".' },
      { icon: 'FiAward', head: 'Signed images and provenance', text: 'cosign signing in the pipeline and a policy that only runs signed images. Lab 5 in full.' },
      { icon: 'FiGitMerge', head: 'Canary releases', text: 'Argo Rollouts: send 10% of traffic to a new version, watch the dashboard, then promote or roll back automatically.' },
      { icon: 'FiGlobe', head: 'An API gateway and events', text: 'APISIX and Redpanda: governed APIs with rate limits, and an event stream. The brief\'s data and integration platform.' },
      { icon: 'FiDollarSign', head: 'Cost per team', text: 'OpenCost: the budget turned into money, per team and per environment, for showback.' },
    ],
    notes: 'These are the brief\'s level 3 and 4 tools. Each is one setting in the lab build, which is itself a lesson: a platform built as code grows by configuration, not by projects. Teams may also propose a golden path for an FMD job: that is the best answer of all.',
  },
  {
    type: 'quiz', section: 'Close',
    title: 'Final check: the whole path',
    questions: [
      'Describe, in order, what happens between a merge to main and the new version answering in dev.',
      'How does a release reach prod, who approves it, and how is it rolled back?',
      'What is an SLO, and what did your service measure against it today?',
      'Name the four delivery measures and the three runtime measures of end-to-end performance engineering.',
      'Explain to a colleague, in two sentences, what an Internal Developer Platform is and why FMD would want one.',
    ],
    notes: 'Answers. 1: The pipeline lints, tests, scans and builds the image tagged with the commit id and pushes it to Harbor, which scans it again; Argo CD sees that main changed, updates the dev folder\'s image to the new tag and syncs the namespace; the pod starts and the Ingress serves it. 2: A pull request changing the tag and replica count in deploy/prod, approved by a second person and merged; Argo CD syncs; rollback is a revert of that change. 3: A target for a measured promise, for example 99% of requests succeed; the success rate from the dashboard and the load test. 4: Lead time, deployment frequency, change failure rate, time to restore; response time, error rate, saturation. 5: In their own words; the five verbs (find, create, change, ship, watch) and the paved road.',
  },
  {
    type: 'close', section: 'Close',
    title: 'Thank you',
    subtitle: 'You built, shipped, observed and recovered a service through a platform you can now explain. Certification follows the brief\'s weights; the community of practice continues after the course.',
    notes: 'Close with what happens next: assessment results, certification recorded by SARB, and the follow-on modules (APIs and data, FinOps, leadership). Collect the course feedback form before anyone leaves.',
  },
];
