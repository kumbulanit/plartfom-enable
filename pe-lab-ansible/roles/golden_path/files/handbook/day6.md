# Day 6: Deploy, observe and the capstone

**Goal:** Release to staging and prod through Git, read the dashboard, recover from a bad change, and present your service with its evidence.

By the end of the day you can:

- Promote a release to staging and then prod by pull request, and see each environment report its name
- Read the dashboard, run a load test, and explain end-to-end performance engineering
- Break and recover a service, and assemble the evidence pack for the capstone

## Kubernetes and GitOps

### Kubernetes in one slide: the five words you need

You will see these in Argo CD and on the dashboard. You will not type them; the templates already wrote them.

- **Cluster:** The machines that run containers, managed as one. In the lab: one server running k3s.
- **Namespace:** A fenced area inside the cluster with its own budget, access and network rules. One per environment: teamNN-dev, teamNN-staging, teamNN-prod.
- **Pod and Deployment:** A Pod is a running container. A Deployment says "keep N copies of this image running, and replace them carefully when the image changes". Replicas is N.
- **Service and Ingress:** A Service is the stable internal address for the pods. An Ingress is the public address: https://hello-teamNN-dev.&lt;domain>.
- **ConfigMap:** The settings for an environment (APP_ENV, GREETING), supplied to the container as environment variables. Same image, different ConfigMap.

### GitOps and promotion: how a release reaches prod

The repository holds one folder per environment: deploy/dev, deploy/staging, deploy/prod. Each says which image tag runs there and how many copies. Argo CD makes each namespace match its folder.

dev follows main: every merge runs the newest image. staging and prod run only the tag written in their folder, so they change only when someone changes that file, by pull request, with an approval.

Promotion is therefore a two-line change: the tag (the commit id of a build that passed every check) and the replica count. Rollback is a revert of that change. Deterministic, recorded, no production access needed.

> **In one sentence:** Promotion is a reviewed change to the tag in an environment's folder; Argo CD does the rest.

**In the lab**

- Find the tag in Harbor or in the pipeline log.
- Edit deploy/staging/kustomization.yaml: newTag and replicas.
- Pull request, approval, merge. Argo CD syncs within a few minutes.
- The same for deploy/prod, with two replicas.

### The promotion change: two lines

```
# deploy/staging/kustomization.yaml   (before -> after)

images:
  - name: harbor.<lab domain>/teamNN/hello
-   newTag: not-released-yet
+   newTag: 3f9c2a7e1b0d4c5e6f7a8b9c0d1e2f3a4b5c6d7e
    # the new tag is the commit id, copied from Harbor

replicas:
  - name: hello
-   count: 0
+   count: 1

# deploy/prod/kustomization.yaml: the same, with count: 2
```

- newTag: the exact image that passed the pipeline. Copy it from Harbor; never type "latest".
- count: how many copies run. Staging gets one; prod gets two, so one can restart without downtime.
- Nothing else changes between environments except the settings in the ConfigMap.
- The pull request shows exactly these lines. The reviewer can check the tag against the scan in Harbor.

## Lab 1: promote to staging and prod

### Lab 1: promote hello to staging, then prod

*40 min · per team*

**What you do:** Release the image running in dev to staging and then prod, by changing two lines in a reviewed pull request.

**Before you start:** Your team has staging and prod (Day 3). One member drives, the others review.

#### Step 1. Find the tag to release

*Where: Workspace terminal, then Harbor*

The image to release is the one built from the latest commit on main. Its tag is that commit's id. Check in Harbor (teamNN → hello) that an image with this tag exists and is scanned. If not, the pipeline on main is still running: wait for it.

```bash
cd ~/hello
git switch main && git pull
TAG=$(git rev-parse HEAD)
echo $TAG
```

**You should see:** A 40-character tag, the same as the newest image in Harbor.

#### Step 2. Change two lines for staging

*Where: Workspace terminal*

In deploy/staging/kustomization.yaml, newTag says which image runs and count says how many copies. Set the tag and one copy.

```bash
git switch -c release-staging-$ME
sed -i "s/newTag: .*/newTag: $TAG/; s/count: 0/count: 1/" deploy/staging/kustomization.yaml
git diff
```

**You should see:** Exactly two changed lines: newTag and count.

#### Step 3. Propose the release; a teammate approves

*Where: Workspace terminal, then Gitea*

```bash
git commit -am "Release ${TAG:0:8} to staging"
git push -u origin release-staging-$ME
```

**You should see:** A green pipeline (it checks the deploy folders still build). After an approval, merge.

#### Step 4. Watch staging update

*Where: Browser: Argo CD*

Open teamNN-hello-staging in Argo CD.

**You should see:** Syncing, then Synced and Healthy with 1 pod.

> **Tip:** If the safety net is on: the merge commit's safety-net/staging says "Deployed to teamNN-staging: &lt;tag>, 1 replica", and kubectl -n $TEAM-staging get pods shows the pod.

#### Step 5. Check staging answers with the right version

*Where: Workspace terminal*

```bash
curl -s https://hello-$TEAM-staging.$DOMAIN/
```

**You should see:** "environment": "staging" and "version" with your tag.

#### Step 6. Do the same for prod, with two copies

*Where: Workspace terminal, then Gitea*

Start from the updated main. Same two lines, in deploy/prod, with count 2. Pull request, approval, merge.

```bash
git switch main && git pull
git switch -c release-prod-$ME
sed -i "s/newTag: .*/newTag: $TAG/; s/count: 0/count: 2/" deploy/prod/kustomization.yaml
git diff
git commit -am "Release ${TAG:0:8} to prod"
git push -u origin release-prod-$ME
```

**You should see:** After the merge: curl -s https://hello-$TEAM-prod.$DOMAIN/ says "environment": "prod". Three environments, three answers, one image.

**Done when:** dev, staging and prod each report their own environment, and staging and prod run the tag you released.

**If you are stuck**

- Copy the whole tag: all 40 characters of the commit id.
- Argo CD shows the image cannot be pulled: the tag is wrong. Fix it in a new pull request.

## Observability

*Is the service keeping its promise? Metrics, logs, dashboards and a simple service level objective.*

### Observability and SLOs in plain words

Metrics are numbers over time: requests per second, errors, response time, CPU. Logs are the events, one line each. A dashboard puts the numbers on screen; an alert says when a number crosses a line.

A service level indicator (SLI) is a number that measures the promise, such as the share of requests that succeed. A service level objective (SLO) is the target: 99% of requests succeed. The error budget is the 1% you may spend on changes and incidents.

Observability is what lets a team say "it works" with evidence, and lets an incident be found in minutes rather than reported by a user.

> **In one sentence:** Observability turns "it works" into numbers and logs you can see; an SLO is the promise those numbers must keep.

**In the lab**

- hello exposes /metrics; Prometheus collects it every 30 seconds.
- Alloy ships the JSON logs to Loki.
- The Golden path dashboard in Grafana shows versions, traffic, errors and logs per team and environment.
- The template includes one alert: the service is down for five minutes.

### Lab 2: read the dashboard

*30 min*

**What you do:** Read your service's health on the Golden path dashboard: versions, traffic, errors and logs. Then write a short service-level report.

**Before you start:** Lab 1 done: staging runs one copy.

#### Step 1. Open the dashboard

*Where: Browser: Grafana*

Open https://grafana.<lab domain> (no sign-in needed) → Dashboards → PE Lab → Golden path. At the top, pick your team and the app hello.

**You should see:** A table of running versions per environment: dev, staging and prod, each with its tag.

#### Step 2. Make some traffic

*Where: Workspace terminal*

This calls staging 300 times, five times a second (about a minute).

```bash
for i in $(seq 1 300); do curl -s -o /dev/null https://hello-$TEAM-staging.$DOMAIN/; sleep 0.2; done
```

**You should see:** Within a minute the requests-per-second panel rises for staging.

#### Step 3. Make some errors

*Where: Workspace terminal*

Ask 50 times for a page that does not exist.

```bash
for i in $(seq 1 50); do curl -s -o /dev/null https://hello-$TEAM-staging.$DOMAIN/missing; done
```

**You should see:** The failed-share panel shows a small percentage of 404 answers.

#### Step 4. Find them in the logs

*Where: Browser: Grafana*

In the logs panel, type missing in the search box.

**You should see:** One JSON line per failed request, for example {"event": "request", ..., "path": "/missing", "status": 404, ...}.

#### Step 5. Write a service-level report

*Where: Your team notes*

Write three lines: the promise (99% of requests succeed), today's measured success rate from the dashboard, and the one alert that exists (it fires when hello has no healthy copy).

**You should see:** A three-line report for the evidence pack.

**Done when:** You can read versions, traffic, errors and logs for your service, and have a three-line service-level report.

**If you are stuck**

- Empty panels: pick your team and app at the top of the dashboard, and look at the last 15 minutes.

## Performance engineering

### End-to-end performance engineering

Performance has two halves, and a platform measures both from the same place. Delivery performance: how fast and safely changes flow, measured as lead time for a change, deployment frequency, change failure rate and time to restore. Runtime performance: how the service behaves under load, measured as response time, error rate and saturation of its budget.

End to end means tracing one change from the pull request to its effect in production: when it was merged, when it was live, what it did to response time and errors, and how fast a bad one was undone.

The platform makes these numbers a by-product: Git gives lead time, Argo CD gives deployment time, the dashboard gives runtime, and the incident lab gives time to restore.

> **In one sentence:** Performance engineering end to end measures both the flow of changes and the service under load, from one platform.

**In the lab**

- Lead time: from first commit to live in dev, read from Git and Argo CD.
- Deployment frequency: count your team's deployments this week.
- Runtime: a two-minute k6 load test against staging, watched on the dashboard.
- Time to restore: measured in the next lab.

### A load test in ten lines: k6

```
// ~/day6/load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = { vus: 20, duration: '2m' };

export default function () {
  const r = http.get('https://hello-teamNN-staging.<lab domain>/');
  check(r, { 'status is 200': (res) => res.status === 200 });
  sleep(0.5);
}

// run it:   k6 run load.js
```

- vus: 20 virtual users, each calling the service in a loop for two minutes.
- check: counts how many answers were good. That is your SLI under load.
- k6 prints requests per second, response time (average and p95) and the check pass rate.
- Run it against staging, never prod, unless the platform team agrees.

### Lab 3: load-test staging and watch the dashboard

*30 min*

**What you do:** Put real load on staging with k6, watch what it does on the dashboard, and turn the numbers into a decision.

**Before you start:** Lab 1 done (staging runs). Put the dashboard and the terminal side by side.

#### Step 1. Write the load test

*Where: Workspace terminal*

This writes the ten-line test from the slide, with your team's staging address filled in. 20 virtual users each call staging twice a second, for two minutes.

```bash
mkdir -p ~/day6 && cd ~/day6
cat > load.js <<EOF
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = { vus: 20, duration: '2m' };

export default function () {
  const r = http.get('https://hello-$TEAM-staging.$DOMAIN/');
  check(r, { 'status is 200': (res) => res.status === 200 });
  sleep(0.5);
}
EOF
cat load.js
```

**You should see:** The script, with your team and the lab domain in the address.

#### Step 2. Run it

*Where: Workspace terminal*

```bash
k6 run load.js
```

**You should see:** A progress bar for two minutes, then a summary. Find three lines: http_reqs (how many, and per second), http_req_duration with p(95), and checks (the share that answered 200).

#### Step 3. Watch the dashboard while it runs

*Where: Browser: Grafana*

**You should see:** Requests per second for staging rise to about 40; the failed share stays at 0%.

#### Step 4. Run it again with 100 users

*Where: Workspace terminal, and the dashboard*

--vus overrides the number of users in the script.

```bash
k6 run --vus 100 load.js
```

**You should see:** More traffic; response time (p95) rises; the CPU panel approaches staging's budget.

#### Step 5. Turn the numbers into a decision

*Where: Your team notes*

Write down p95 at 20 and at 100 users, and the success rate. Then decide: does one copy keep the promise at 100 users? If not, what would you change: more copies, a bigger budget, or the code?

**You should see:** A short performance note with a recommendation, for example "prod needs two copies".

**Done when:** You have p95 and success rate at two loads, and a recommendation based on them.

**If you are stuck**

- Use your team's staging address, never prod.
- Many failed checks: your staging may have 0 replicas. Check Lab 1 was merged and synced.

## Resilience

### Lab 4: break it, and watch the platform recover

*35 min*

**What you do:** Cause two incidents on purpose, a manual change and a bad release, and measure how the platform recovers from each. Note the clock time at every step.

**Before you start:** Labs 1 and 2 done. Keep the dashboard open.

#### Step 1. Switch dev off by hand

*Where: Workspace terminal*

```bash
date +%T
kubectl -n $TEAM-dev scale deployment hello --replicas=0
curl -s -o /dev/null -w "%{http_code}\n" https://hello-$TEAM-dev.$DOMAIN/
```

**You should see:** The time, then an error code instead of 200 (503: no copy is running). The healthy-pods panel drops to 0.

#### Step 2. Do nothing, and watch

*Where: Browser: Argo CD, and the terminal*

Git says dev runs one copy. Watch teamNN-hello-dev in Argo CD, or follow it in the terminal (Ctrl+C to stop watching).

```bash
kubectl -n $TEAM-dev get deployment hello -w
```

**You should see:** Argo CD reports OutOfSync, then self-heals: READY goes back to 1/1, within a few minutes. Note the time: that is the time to restore, with no human involved.

> **Tip:** If the safety net is on, the platform puts the copy back within two minutes instead.

#### Step 3. Release something broken to staging

*Where: Workspace terminal, then Gitea*

Release a tag that does not exist, through the normal path: branch, pull request, approval, merge.

```bash
cd ~/hello
git switch main && git pull
git switch -c bad-release-$ME
sed -i "s/newTag: .*/newTag: does-not-exist/" deploy/staging/kustomization.yaml
git commit -am "Release a tag that does not exist"
git push -u origin bad-release-$ME
```

**You should see:** After the merge, the new pod cannot start (kubectl -n $TEAM-staging get pods shows ErrImagePull or ImagePullBackOff), but the old pod keeps serving: staging still answers.

#### Step 4. Recover through Git

*Where: Workspace terminal, then Gitea*

Undo the bad release with git revert: a new commit that reverses it. Same path: branch, pull request, approval, merge. Note the time.

```bash
git switch main && git pull
git switch -c revert-bad-release-$ME
git revert --no-edit $(git log -1 --format=%H -- deploy/staging/kustomization.yaml)
git diff HEAD~1 --stat
git push -u origin revert-bad-release-$ME
```

**You should see:** After the merge, staging syncs back to the good tag and the broken pod is replaced. Time to restore measured, with a full record of who did what.

#### Step 5. Read the incident timeline

*Where: Browser: Argo CD*

Open teamNN-hello-staging → History and Rollback.

**You should see:** Every sync with its commit and time: the incident timeline, written by the platform.

> **Tip:** If the safety net is on: in Gitea, open deploy/staging/kustomization.yaml → History. Each commit shows its safety-net/staging result.

**Done when:** You have two recovery times: one with no human (self-heal) and one through Git (revert).

**If you are stuck**

- Note the clock time at every step: the times are the evidence.

### Scenarios: budgets and recovery

| Scenario | What happens | What the platform does | The rule |
| --- | --- | --- | --- |
| Over budget | A pull request raises the service's CPU request to 10 cores "to be safe". | The deployment is refused: the environment's budget is 1 CPU. The message names the quota. The team asks for a bigger size through the environment template if it really needs it. | Budgets and fair sharing. Capacity is a reviewed decision, not a side effect. |
| The hand edit | An administrator "fixes" dev by hand at 2 a.m. and forgets to tell anyone. | Argo CD notices that the cluster no longer matches Git and puts it back within minutes. The real fix has to go through a pull request, where it is reviewed and recorded. | Git is the source of truth; the cluster is made to match it. |
| The bad release | A release to prod passes every check but misbehaves under real traffic. | Rollback is a revert of the two-line promotion change: pull request, approval, merge. Argo CD returns prod to the previous tag. The history shows both the release and the rollback. | Deterministic rollback, with evidence. |

## Capstone

*Take your team's own service to production through the whole path, collect the evidence, and present it to the panel.*

### Capstone: your service to prod, with evidence

*90 min · in teams*

**What you do:** As a team, take your Day 4 service (rates) from a real improvement to production, with the evidence a reviewer would ask for, and present it.

**Before you start:** Everything from the week. Split the work: one person drives the change, one collects evidence, one prepares the presentation.

#### Step 1. Make one real improvement

*Where: Workspace, then Gitea*

For example a new field in the answer, or a new test. Branch, pull request, review, approve, merge: as on Day 2 and in Day 4 Lab 4, in ~/rates.

**You should see:** A green pipeline run on main and a new scanned image in Harbor.

#### Step 2. Release it to staging, then prod

*Where: Workspace, then Gitea*

As in Lab 1, in ~/rates: deploy/staging with one copy, check it, then deploy/prod with two copies.

**You should see:** Three addresses (rates-teamNN-dev, -staging and -prod) each reporting its environment and your version.

#### Step 3. Measure it

*Where: Workspace and Grafana*

Run a two-minute load test against rates in staging (Lab 3, with rates in the address) and read the dashboard.

**You should see:** p95 and success rate written down, with a recommendation.

#### Step 4. Assemble the evidence pack

*Where: A folder or a shared page*

Collect, as links or screenshots: the pull requests with their approvals, the pipeline runs, the image with its scan and SBOM, the environment request and its plan, the guardrail refusals, the release pull requests, the dashboard, the load-test numbers and your recovery times.

**You should see:** Every item linked or captured.

#### Step 5. Prepare ten minutes

*Where: Your team*

What we built; the path it took from commit to prod; the evidence; our charter from Day 2; what we would add to the platform next.

**You should see:** Five slides or one whiteboard.

#### Step 6. Present to the panel

*Where: In front of the panel*

Present at 14:45 and answer questions.

**You should see:** The panel scores against the rubric: operability, security, architecture, evidence and user value.

**Done when:** Your service runs in prod, your evidence pack is complete, and you have presented.

**If you are stuck**

- Collect evidence as you go: a link or a screenshot after every step, not at the end.

### The evidence pack: where each item comes from

Evidence by default: every item below was produced by normal work this week. Nobody writes it afterwards.

- **Change control:** The pull request with its review and approval; the three refusal messages from Day 2 (push to main, self-approval, stale approval).
- **Pipeline and supply chain:** The green run on main; the image tag; the Harbor vulnerability report and SBOM; the Day 5 failures for a bad test, a secret and a root user.
- **Policy:** The three guardrail refusals and the fixed deployment; the Kyverno CLI pass and fail output.
- **Environments and promotion:** The environment pull request with its plan; the staging and prod promotion pull requests; Argo CD's history for each environment.
- **Operations:** The dashboard with versions per environment; the SLO note; the load-test numbers and recommendation; the two recovery times from Lab 4.

### What we built this week: the whole platform, used end to end

| Piece | Tool | What it does |
| --- | --- | --- |
| Workspace | Linux, Docker, Git | Days 1 and 4 |
| Portal | Backstage | Days 1 and 4 |
| Template | Golden path | Days 3, 4 and 5 |
| Repository | Gitea | Day 2 |
| Pipeline | Gitea Actions | Day 5 |
| Registry | Harbor | Day 5 |
| GitOps | Argo CD | Days 2 and 6 |
| Environments | k3s + Kyverno | Days 3, 5 and 6 |
| Observe | Grafana, Loki | Day 6 |

Monday: the app ran by hand. Friday: it runs in prod through every piece of this path, with evidence at each step. Nothing was deployed by a person.

### What you would add next: the platform roadmap

Every capstone presentation ends with this. Some options the lab already contains, switched off.

- **Single sign-on:** Keycloak: one login for every tool, tied to the bank's directory. The brief's "enterprise identity, MFA".
- **Signed images and provenance:** cosign signing in the pipeline and a policy that only runs signed images. Lab 5 in full.
- **Canary releases:** Argo Rollouts: send 10% of traffic to a new version, watch the dashboard, then promote or roll back automatically.
- **An API gateway and events:** APISIX and Redpanda: governed APIs with rate limits, and an event stream. The brief's data and integration platform.
- **Cost per team:** OpenCost: the budget turned into money, per team and per environment, for showback.

### Final check: the whole path

1. Describe, in order, what happens between a merge to main and the new version answering in dev.
2. How does a release reach prod, who approves it, and how is it rolled back?
3. What is an SLO, and what did your service measure against it today?
4. Name the four delivery measures and the three runtime measures of end-to-end performance engineering.
5. Explain to a colleague, in two sentences, what an Internal Developer Platform is and why FMD would want one.

---

[Day 5](day5.md) · [Contents](README.md)
