# The safety net: if Argo CD gives trouble

**In one minute.** Argo CD is the tool that deploys the teams' services. If it
breaks during the course, one command pauses it and lets the platform do the
deploying instead.
- **Teams carry on exactly as before:** branch, pull request, approval, merge.
  Their changes still go live.
- **Where to look changes:** delegates read the result on the commit in Gitea
  instead of in Argo CD.
- **One command switches it back,** and nothing that is running is removed
  either way.

```bash
ansible-playbook safety-net.yml -e safety_net=on     # switch on
ansible-playbook safety-net.yml -e safety_net=off    # switch off
ansible-playbook safety-net.yml                      # which one is deploying now
```

Run these on the delegate's VM, in `~/plartfom-enable/prelab-setup`, with `-K` for the sudo
password. The same switch is also `sudo pelab-safety-net on`, `off` or `status`
on the VM, or for every VM at once from your machine (with
`ANSIBLE_INVENTORY=inventory/all-vms.yml`): `ansible pelab -b -a
"pelab-safety-net on"`.

---

## When to switch it on

Switch on only when Argo CD itself is the problem, **for everyone**. Typical
signs:
- Merges stop reaching dev for every team, although their pipelines are green.
- The Argo CD page does not load.
- Every application shows `Unknown` or a comparison error.

**First, try one restart:**

```bash
sudo k3s kubectl -n argocd rollout restart deployment,statefulset
```

Run it on the lab server, then wait three minutes. If merges still do not reach
dev, switch the safety net on.

**Do not** switch it on for one team's problem. A wrong image tag or a failed
pipeline is part of the labs (Day 5 Lab 2, Day 6 Lab 4), and the safety net
behaves the same way there.

## Switch it on

1. On the delegate's VM (or with `ansible pelab -b -a "pelab-safety-net on"` for every VM):

   ```bash
   ansible-playbook safety-net.yml -e safety_net=on
   ```

2. *You should see:* a few lines per team and service, then the summary:

   ```
   Argo CD is paused. Deploying the teams' services now (a minute or two)...
   team01/hello dev 3f2a9c1b: Deployed to team01-dev: 3f2a9c1b, 1 replica
   team01/hello staging 3f2a9c1b: Deployed to team01-staging: not-released-yet, 0 replicas
   team01/hello prod 3f2a9c1b: Deployed to team01-prod: not-released-yet, 0 replicas
   ...
   The safety net is ON. The platform deploys the teams' services every 2min.
   ```

   Before Day 3, staging and prod say `does not exist yet: request it in
   platform/environments`. That is expected.

3. Tell the delegates. Read this out:

   > "Argo CD is paused for now. You work exactly as before: branch, pull request,
   > approval, merge. The platform still deploys your merges, every two minutes.
   > To see what is running, open your latest commit in Gitea, not Argo CD. Click the
   > tick next to the commit, and read the lines `safety-net/dev`,
   > `safety-net/staging` and `safety-net/prod`. Your service addresses and the
   > Grafana dashboards work as before."

## What changes in the labs

Only the steps that say "open Argo CD" change. Everything else is the same.

| Lab and step | With Argo CD | With the safety net on |
| --- | --- | --- |
| Day 2 Lab 3, step 5 | Watch `teamNN-hello-dev` sync | In Gitea, open `teamNN/hello` → Commits → the merge commit → the tick. Look for `safety-net/dev`: "Waiting for the pipeline…", then "Deployed to teamNN-dev: <commit>" |
| Day 3 Lab 2, step 6 | staging and prod stop retrying | Within two minutes of the environment merge, the latest `hello` commit shows `safety-net/staging`: "Deployed to teamNN-staging: not-released-yet, 0 replicas". Also `kubectl -n teamNN-staging get deployments` |
| Day 4 Lab 3, step 4 | `teamNN-rates-dev` appears | The latest commit of `teamNN/rates` shows `safety-net/dev`: "Deployed to teamNN-dev", once the first pipeline has passed |
| Day 4 Lab 4, step 4 | Watch Argo CD | The merge commit's `safety-net/dev` |
| Day 6 Lab 1, step 4 | `teamNN-hello-staging` syncs | The merge commit's `safety-net/staging`: "Deployed to teamNN-staging: <tag>, 1 replica". Also `kubectl -n teamNN-staging get pods` |
| Day 6 Lab 4, step 2 | Argo CD self-heals | The platform puts the replicas back within two minutes. Watch it with `kubectl -n teamNN-dev get deployment hello -w` or the dashboard's healthy-pods panel. Time to restore is still measured, with no human |
| Day 6 Lab 4, step 3 | The bad tag syncs | Same result: `safety-net/staging` says "Deployed … does-not-exist", the new pod cannot pull its image, and the old pod keeps serving |
| Day 6 Lab 4, step 5 | Argo CD's History tab | The history of `deploy/staging` in Gitea (the file's History button), with each commit's `safety-net/staging` result: the same timeline |

## What the safety net does

Every two minutes, the platform applier on the lab server does this for every
repository of every team that has `deploy/<env>/kustomization.yaml` on main:

- **dev:** it waits until the pipeline on the latest commit of main has passed.
  Then it deploys `deploy/dev`, running the image the pipeline built from that
  commit. This is the same as Argo CD.
  - While the pipeline runs, the status says "Waiting".
  - If the pipeline failed, dev keeps the version it has.
- **staging and prod:** it deploys `deploy/staging` and `deploy/prod` exactly as
  committed: the tag and the number of copies in the file. Releasing is still a
  reviewed pull request.
- **Hand-made changes are put back** on the next run, for example scaling to 0
  or deleting the deployment. Argo CD does the same.
- **The same rules hold:**
  - It only deploys into the team's own namespaces.
  - It deploys only these kinds: Deployment, Service, Ingress, ConfigMap,
    ServiceMonitor, PrometheusRule, HorizontalPodAutoscaler and
    PodDisruptionBudget. Anything else is refused, and the status says which kind.
  - The Kyverno guardrails check everything, as before.
  - Pipelines still hold no cluster credentials.

## Limits (fine for the course)

- **It does not delete.** If a team removes a file from `deploy/`, the object
  stays in the cluster until Argo CD is back, or you delete it by hand.
- **Argo CD's pages are frozen** while it is paused. They show the state from
  before the pause.
- **New services** appear within two minutes of their first green pipeline.

## Switch it off

1. When Argo CD is healthy again (for example after the restart above, or the
   next morning):

   ```bash
   ansible-playbook safety-net.yml -e safety_net=off
   ```

2. *You should see:* "The safety net is OFF. Argo CD deploys the teams' services
   again".
3. Open `https://argocd.<lab domain>` after three minutes.
   *You should see:* the applications `Synced` and `Healthy`. Nothing was removed
   or redeployed in between, because both deploy the same thing from Git.
4. Tell the delegates to use Argo CD again.

## Check which one is deploying

```bash
ansible-playbook safety-net.yml
```

*You should see:* either `OFF: Argo CD deploys the teams' services.` or `ON: the
platform applier deploys the teams' services; Argo CD is paused.`, and Argo CD's
two controllers with their replica counts (1 when off, 0 when on).

## How it was tested

The safety net was tested on a one-node k3s v1.33 test cluster with Gitea 1.27.0,
the lab's Gitea set-up tasks and stand-ins for Argo CD's controllers. These worked:
- switching on and off;
- dev waiting for, refusing and then deploying a commit by its pipeline result;
- staging appearing when its namespace was created;
- a promotion by changing `deploy/staging`;
- hand-made drift put back;
- a NetworkPolicy refused;
- no repeated statuses.

It has not yet run on the real server with the real Argo CD: switch it on and off
once during the rehearsal.
