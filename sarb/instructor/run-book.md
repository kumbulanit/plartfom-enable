# Instructor run-book

How to check, run and reset the lab during the course. For the first build,
step by step, use the [setup guide](setup-guide.md). The Ansible project is
`pe-lab-ansible/`; its README has every setting. Commands run from that folder
on the control machine unless they say "on the lab host". On the lab host, every
command starts with `sudo`.

## Accounts you use

| What | Where | Credentials |
| --- | --- | --- |
| Gitea admin; the only account that can approve environment and exception requests | https://gitea.&lt;lab domain&gt; | `pelab-admin`; password in `credentials/gitea-admin.txt` |
| Harbor admin | https://harbor.&lt;lab domain&gt; | `admin`; `credentials/harbor-admin.txt` |
| Grafana admin (delegates read without a login) | https://grafana.&lt;lab domain&gt; | `credentials/grafana-admin.txt` |
| Argo CD admin (delegates read without a login) | https://argocd.&lt;lab domain&gt; | `sudo k3s kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' \| base64 -d` on the host |
| Every service and link, in one page | `credentials/platform.md` | written by the build |
| Delegate access sheets | `credentials/access/` | one page per delegate, to print |

Keep `credentials/` on the control machine only. It is never committed.

## Build

```bash
ansible-galaxy collection install -r requirements.yml
ansible-playbook site.yml
```

The build ends with the platform applier's first run. If it fails, the error
shows the applier's log.

## Check the lab before the first day (and every morning)

From a delegate thin client on the SARB network:

1. Open https://backstage.&lt;lab domain&gt;: the catalog lists five `hello` services.
2. Open https://student01.&lt;lab domain&gt; with student01's password: the editor and terminal load.
3. In that terminal: `git clone https://gitea.<lab domain>/team01/hello` with student01's password.
4. Open https://hello-team01-dev.&lt;lab domain&gt;/: `"environment": "dev"`.
5. Open Harbor as student01: the team01 project shows a scanned `hello` image with an SBOM.
6. Open Grafana: folder PE Lab, dashboard Golden path, team01: the version table is filled.

On the lab host:

```bash
systemctl list-timers 'pelab-*'
sudo journalctl -u pelab-platform-apply.service -n 20 --no-pager
sudo lxc list -c ns4 | head
sudo k3s kubectl get pods -A | grep -v -E 'Running|Completed'
sudo pelab-safety-net status
```

The applier's last lines should read `environments ...: Up to date` and
`policies ...: 3 policies, 0 exceptions in force`. The safety net should be
`OFF` (unless you switched it on).

## During the labs: common fixes

| Symptom | Cause | Fix |
| --- | --- | --- |
| A workspace does not load | The container stopped, or its code-server crashed | On the host: `sudo lxc restart studentNN`. Still broken: reset it (below) |
| A delegate locked themselves out of their workspace | Changed files under their home or broke the shell | Reset that workspace: `sudo lxc stop -f studentNN && sudo lxc restore studentNN clean && sudo lxc start studentNN`. Their work is safe in Git |
| A workspace is beyond repair | | Give the delegate a spare (student26, student27): set `pelab_spare_team_assignments` and run `ansible-playbook site.yml --tags workspaces,teams,golden_path` |
| A pipeline stays "Waiting" | Runners busy or stopped | On the host: `sudo lxc exec runner01 -- systemctl status pelab-gitea-runner`; restart it with `sudo lxc exec runner01 -- systemctl restart pelab-gitea-runner` (same for runner02 to runner05) |
| A pipeline cannot pull the base image | Harbor's Docker Hub cache has no internet and no cached copy | Pull once with internet; the cache keeps it. See "Offline" in the README |
| Day 3: the plan pipeline fails with an access error | The read-only kubeconfig secret is stale (cluster rebuilt) | `ansible-playbook site.yml --tags golden_path` |
| Day 3: no platform/apply status after a merge | The applier failed | `sudo journalctl -u pelab-platform-apply.service -n 50` on the host; fix, then `sudo systemctl start pelab-platform-apply.service` |
| Day 3 Lab 3: you need to cause drift | | On the host, pause the repairs first: `sudo systemctl stop pelab-platform-apply.timer`. Then `sudo k3s kubectl -n teamNN-staging patch resourcequota team-quota --type merge -p '{"spec":{"hard":{"requests.cpu":"5"}}}'`. After the teams have run their plan: `sudo systemctl start pelab-platform-apply.timer pelab-platform-apply.service` |
| Day 5 Lab 5: expire an exception | | Let the team open the pull request that sets `pelab.io/expires` to yesterday, and approve it (you cannot approve a pull request you opened yourself); the next applier run removes the exception |
| Argo CD shows staging or prod "Retrying" | The team has not requested its environments yet | Expected until Day 3 Lab 2 |
| Merges stop reaching dev, or Argo CD is down, and the fixes above do not help within 15 minutes | Argo CD | Switch on the safety net: `ansible-playbook safety-net.yml -e safety_net=on`. See [safety-net.md](safety-net.md) |
| A merge is blocked although it was approved | The approval went stale after a new commit (`dismiss_stale_approvals`), or the required check `pipeline` is not green: the run is still going, or it failed | Approve again; wait for the run; if it is red, the team fixes the branch |
| Merge blocked, approved, and the run is green but the pull request says the check `pipeline` is missing | The run was cancelled or the runner stopped before the last step | Re-run the pipeline (Actions → the run → Re-run all jobs); check the runners with `sudo lxc list` |
| A delegate needs to approve an environment or exception request | Only `pelab-admin` may | Approve it yourself after reading the plan or the reason with the team |

## Reset

Between days of the same cohort, nothing needs resetting: teams keep their work.

To put every workspace back and rebuild the team environments from Git (same cohort):

```bash
ansible-playbook reset.yml
```

Between cohorts (new passwords, new Gitea accounts and repositories, empty environment and exception requests):

```bash
ansible-playbook reset.yml -e reset_rotate_credentials=true
```

Then print the new access sheets from `credentials/access/`.

## Backup and restore

Every evening of the course, copy the night's backup to the control machine (it
takes a fresh one first):

```bash
ansible-playbook backup.yml
```

If the server fails: build the replacement with the same inventory (new
`ansible_host`) and the same `credentials/` folder, then restore the latest copy
and check the golden path:

```bash
ansible-playbook site.yml
ansible-playbook restore.yml -e restore_from=backups/pelab01/<date-time>
ansible-playbook site.yml --tags golden_path
```

Delegates keep their accounts, passwords, repositories and pull requests. Work
that was only in a workspace and never pushed is lost: tell teams to push at the
end of every lab.

## Teardown

```bash
ansible-playbook teardown.yml -e pelab_teardown_confirm=<pelab_domain>
```

## Before the course: rehearsal checklist

- [ ] Full build on the real server; build time recorded.
- [ ] Every lab of all six days done once from a thin client, following the handbook exactly.
- [ ] Day 3 Lab 2 and Lab 3, and Day 5 Lab 5, done once end to end (they involve the platform applier).
- [ ] The GitOps path, which could only be tested here: a merge goes live in dev (Day 2 Lab 2);
  staging and prod sync after the environment request (Day 3 Lab 2, step 6); promotion,
  a bad release and its revert, and self-heal (Day 6 Labs 1 and 4).
- [ ] A reset of the same cohort, and a reset for a new cohort; times recorded.
- [ ] `backup.yml`, then a full restore with `restore.yml` (ideally onto a second machine); times recorded.
- [ ] The safety net switched on, a merge reaching dev through it, and switched off again ([safety-net.md](safety-net.md)).
- [ ] The lab works with the server's internet switched off (if the course will run offline).
- [ ] Access sheets printed; capstone panel briefed with the rubric.
