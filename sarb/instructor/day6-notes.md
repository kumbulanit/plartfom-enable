# Day 6 instructor guide: Deploy, observe and the capstone

Deck: `Day6-Deploy-observe-and-the-capstone.pptx`. Delegates follow the handbook (Gitea `platform/handbook`, page day6.md), which has every lab step by step. If Argo CD gives trouble, see [safety-net.md](safety-net.md).

## Before the day

- [ ] The morning checks in the run-book (portal, a workspace, a dev address, Argo CD, Grafana, and the lab server lines). 30 minutes before the start.
- [ ] Brief the capstone panel with capstone-rubric.md. Presentations start at 14:45: ten minutes and three minutes of questions per team.
- [ ] Every team has staging and prod (Day 3), and rates (Day 4).
- [ ] The Golden path dashboard in Grafana shows all five teams.

## The day, hour by hour

| Time | What | Slides | Notes |
| --- | --- | --- | --- |
| 09:00 | Opening: today ends in production | 1-2 |  |
| 09:10 | Kubernetes in five words; GitOps promotion | 3-5 |  |
| 09:40 | Lab 1: promote hello to staging, then prod | 6 |  |
| 10:20 | Observability; Lab 2: read the dashboard | 7-9 |  |
| 11:05 | Break |  |  |
| 11:15 | Performance engineering; Lab 3: load-test staging | 10-12 | Staging only, never prod. |
| 12:00 | Lab 4: break it, and watch the platform recover | 13-14 | Teams note clock times: they are evidence. |
| 12:45 | Lunch |  |  |
| 13:15 | Capstone: brief, then build | 15-19 | 90 minutes. Warn the teams at 14:30. |
| 14:45 | Presentations to the panel |  | Five teams, 13 minutes each. The panel scores with the rubric. |
| 15:50 | Close: what next for the platform | 20-21 |  |

## What you do yourself

Commands for the lab server run there over SSH (`ssh labadmin@<server>`); the others on the control machine, in `pe-lab-ansible/`.

**Lab 1.** Each team promotes hello twice: staging (one copy), then prod (two copies). The tag must be an image that exists in Harbor; a wrong tag shows as an image pull error.

**Lab 4, step 2.** Argo CD puts the copy back within a few minutes. Ask the teams to write down the time from scale-down to "answers again".

**Capstone.** Circulate. Ask each team for its evidence as it goes, not at the end. At 14:30 tell them to stop building and finish the evidence pack.

**After the presentations.** Collect the evidence packs and the panel scores. Compare the bottlenecks photographed on Day 1 with what the teams did this week.

**End of the day.** Copy tonight's backup to the control machine (it takes a fresh one first). *(Control machine)*

```bash
ansible-playbook backup.yml
```

## Watch for

| What you see | What to do |
| --- | --- |
| Empty dashboard panels | Pick the team and the app at the top of the dashboard, and look at the last 15 minutes. |
| A load test aimed at prod | Stop it. Load tests run against staging only. |
| Merges stop reaching the environments for every team | Restart Argo CD once; if that does not help within 15 minutes, switch on the safety net (safety-net.md). The capstone can finish with it on. |

## End of the day

- [ ] Backup copied.
- [ ] Panel scores and evidence packs collected.
- [ ] Next: a new cohort (ansible-playbook reset.yml -e reset_rotate_credentials=true) or teardown (setup guide, Part 11).

## Labs today

| Lab | Time |
| --- | --- |
| Lab 1: promote hello to staging, then prod | 40 min · per team |
| Lab 2: read the dashboard | 30 min |
| Lab 3: load-test staging and watch the dashboard | 30 min |
| Lab 4: break it, and watch the platform recover | 35 min |
| Capstone: your service to prod, with evidence | 90 min · in teams |

## Slide by slide

The same notes are in the deck's speaker notes; quiz answers are under the quiz slide.

### 1. Deploy, observe and the capstone

The last day completes the path: the same hello app that ran by hand on Monday is promoted to staging and prod by pull request, watched on a dashboard, load-tested, broken and recovered. The afternoon is the capstone: each team takes its own Day 4 service through the same path and presents the evidence.

### 2. Today's goal

Outcomes map to the brief's Labs 7 (observability), 8 (resilience and recovery), 10 (capacity, lightly) and 11 (capstone).

### 3. Kubernetes in one slide: the five words you need

Resist going deeper. These five, seen in Argo CD's tree view, are enough for delegates to follow what the platform does. Kubernetes as a subject is a course of its own; here it is hidden behind the templates, deliberately.

### 4. GitOps and promotion: how a release reaches prod

The brief's delivery automation module asks for "promotion, rollback and evidence capture". All three are Git operations here. Emphasise that nobody in the room has production access, and nobody needs it.

### 5. The promotion change: two lines

Show the real file. The long tag looks intimidating; explain it is the commit id, so the reviewer can click through to the exact code, the pipeline run and the scan. That click-through is the traceability the brief asks for.

### 6. Lab 1: promote hello to staging, then prod

This is the moment the course has been building to: the app from Monday is in production, through the platform, with evidence at every step. Take a screenshot of the three URLs side by side for the evidence pack. If Argo CD shows the prod app as OutOfSync and does not sync, check that the approval happened and main contains the change.

### 7. Observe

The last piece of the platform. Everything so far was about getting a change to production safely; this is about knowing it is working once there.

### 8. Observability and SLOs in plain words

Brief Lab 7 asks for dashboards, alert rules, an SLO report and an incident timeline. The lab provides the first two; the SLO report and the timeline are the next two labs' output. Keep SRE vocabulary minimal: SLI, SLO, error budget.

### 9. Lab 2: read the dashboard

Make the connection to the version table: this is how the dashboard proves which version runs where, which an auditor and an incident responder both need. The three-line SLO report is the brief's "SLO report" at its simplest.

### 10. End-to-end performance engineering

This is where "drive end-to-end performance engineering" lives. The four delivery measures are the DORA metrics; name them but do not lecture. The practical hook is the next two labs: the load test gives runtime numbers, the break-and-recover lab gives time to restore. Compare with the Day 1 delivery map: the same change measured on the platform is minutes, not days.

### 11. A load test in ten lines: k6

k6 is in every workspace. The output summary has everything needed: http_reqs per second, http_req_duration p(95), and the checks percentage. Teach delegates to read p95: "95% of requests were faster than this".

### 12. Lab 3: load-test staging and watch the dashboard

This is runtime performance engineering with real numbers from the delegates' own service. The recommendation step matters: performance engineering ends in a decision (more replicas, a higher budget, a code change), made from evidence. The brief's Lab 10 (capacity) starts here.

### 13. Lab 4: break it, and watch the platform recover

Brief Lab 8: controlled failure, restoration, recovery objectives evidenced. The two cases teach two recoveries: drift corrected by GitOps without a person, and a bad change undone by a revert with a person and a record. Point out that production access was never needed. Argo CD's history is the incident timeline for the evidence pack.

### 14. Scenarios: budgets and recovery

Delegates have now seen scenario 9 and 10 in Lab 4; scenario 6 can be done live by one team if time allows (edit the CPU request in deploy/base/deployment.yaml on a branch and apply it in dev with kubectl to see the quota refusal).

### 15. Capstone

Teams work on their Day 4 service (rates or whatever they named it). Instructors circulate; the panel arrives at 14:45.

### 16. Capstone: your service to prod, with evidence

The brief's capstone: "a production-equivalent platform product increment for a representative workload, defended before a multidisciplinary panel". At this level the workload is the team's own service and the panel is two or three reviewers. Score with the rubric, kindly and honestly; professional practice (teamwork, documentation, conduct) is 15% of the mark.

### 17. The evidence pack: where each item comes from

This list is also the answer to the brief's "required evidence" column for Labs 2 to 8. Teams that keep links as they go finish the capstone in time; teams that look for evidence afterwards do not. Say so at 09:00.

### 18. What we built this week: the whole platform, used end to end

Put this beside the Day 1 delivery maps on the wall. Ask each team how many of their bottlenecks the platform removed, and which remain (they are usually organisational, not technical). That conversation is the brief's "lead platform transformation" outcome, at awareness level.

### 19. What you would add next: the platform roadmap

These are the brief's level 3 and 4 tools. Each is one setting in the lab build, which is itself a lesson: a platform built as code grows by configuration, not by projects. Teams may also propose a golden path for an FMD job: that is the best answer of all.

### 20. Final check: the whole path

Answers. 1: The pipeline lints, tests, scans and builds the image tagged with the commit id and pushes it to Harbor, which scans it again; Argo CD sees that main changed, updates the dev folder's image to the new tag and syncs the namespace; the pod starts and the Ingress serves it. 2: A pull request changing the tag and replica count in deploy/prod, approved by a teammate and merged; Argo CD syncs; rollback is a revert of that change. 3: A target for a measured promise, for example 99% of requests succeed; the success rate from the dashboard and the load test. 4: Lead time, deployment frequency, change failure rate, time to restore; response time, error rate, saturation. 5: In their own words; the five verbs (find, create, change, ship, watch) and the paved road.

### 21. Thank you

Close with what happens next: assessment results, certification recorded by SARB, and the follow-on modules (APIs and data, FinOps, leadership). Collect the course feedback form before anyone leaves.
