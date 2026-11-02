# Capstone rubric and evidence pack

The capstone is 30% of the assessment (brief, section 7). Each team takes its own
Day 4 service to prod through the whole platform and presents it in 10 minutes to
a panel of 2 to 3 reviewers. The panel scores each criterion 0 to 3, then adds a
short written comment.

## Rubric

| Criterion (brief) | 0: missing | 1: partly | 2: meets | 3: strong |
| --- | --- | --- | --- | --- |
| Operability | Not running in prod | Runs in prod, but the team cannot show its health | Runs in dev, staging and prod; the dashboard shows the version, traffic and errors in each | Also shows a recovery (Day 6 Lab 4) with times, and explains what an alert would trigger |
| Security | Controls bypassed, or cannot be shown | Some checks shown | Pipeline checks, image scan and SBOM shown; guardrails refused a bad deployment | Explains a finding from the scan or SBOM and what they would do about it; any exception is time-limited and justified |
| Architecture | Cannot explain how it got to prod | Explains parts of the path | Explains the path from commit to prod: pipeline, registry, GitOps, environments | Explains why each control sits where it does, and what they would change in the golden path |
| Evidence | None | Some items, collected afterwards | Every item of the evidence pack below, each linked | Evidence ties together: the same commit id in the pull request, the pipeline, Harbor, Argo CD and the dashboard |
| User value | No link to a need | A vague benefit | Charter (Day 2) with users, needs and two measurable promises | Measures what they promised (for example lead time or response time) and proposes the next improvement from the numbers |

Professional practice (15%) is scored separately by the instructors across the
week: teamwork, documentation and conduct.

## Evidence pack checklist

Every item is produced by normal work during the week. Teams collect links or
screenshots in one place (a shared page or a folder).

**Change control**

- [ ] The pull request for the capstone change, with its review and approval
- [ ] The three refusal messages from Day 2 Lab 3 (push to main, own approval, stale approval)

**Pipeline and supply chain**

- [ ] The green pipeline run on main for the released commit
- [ ] The image tag (the commit id) and its Harbor vulnerability report
- [ ] The SBOM
- [ ] The Day 5 Lab 2 failures: a broken test, a secret, a root user

**Policy**

- [ ] The three guardrail refusals from Day 5 Lab 3, and the accepted deployment
- [ ] The `kyverno test` output from Day 5 Lab 4
- [ ] If an exception was used: its pull request, approval and expiry

**Environments and promotion**

- [ ] The environment request pull request (Day 3) with its plan and its platform/apply status
- [ ] The staging and prod promotion pull requests
- [ ] Argo CD's history for staging and prod

**Operations**

- [ ] The dashboard showing the version in dev, staging and prod
- [ ] The SLO note (target and measured success rate)
- [ ] The load-test numbers (p95 at 20 and 100 users, success rate) and the recommendation
- [ ] The two recovery times from Day 6 Lab 4, and Argo CD's history as the incident timeline

## Presentation (10 minutes)

1. What we built, and for whom (the charter).
2. The path it took, commit to prod, shown live.
3. The evidence, one item per control.
4. What the numbers say (SLO, load test, recovery times).
5. What we would add to the platform next, and why.
