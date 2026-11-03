# Instructor run-book

How to check, run and reset the lab during the course. For the first build,
step by step, use the [setup guide](setup-guide.md). The Ansible project is
`prelab-setup/`; its README has every setting. Every delegate has a VM of their
own with the whole platform on it, where they are `student01` in `team01`, and
**builds it themselves**: Ansible runs on the VM (localhost), as in
[BUILD-YOUR-VM.md](../../prelab-setup/BUILD-YOUR-VM.md).

- **Playbooks** (`ansible-playbook ...`) run on the VM they are for, in
  `~/plartfom-enable/prelab-setup`, with `-K` for the sudo password: the delegate types them,
  or you do over SSH on that VM.
- **Checks on every VM at once** (`ansible pelab ...`) run from your own machine,
  in `prelab-setup/`, after `export ANSIBLE_INVENTORY=inventory/all-vms.yml` (each
  VM's address listed there; you need SSH to the VMs). `ansible pelab05 -b -a
  "<command>"` reaches one VM. Playbooks refuse to run with that inventory.
- **Without SSH to the VMs,** the delegate runs the command on their own VM:
  `ansible pelab -b -a "lxc list"` becomes `sudo lxc list`.

## Accounts you use

| What | Where | Credentials |
| --- | --- | --- |
| Gitea admin; may approve anything (the delegates approve their own requests as `platform-approver`, and their pull requests as `reviewer`) | https://gitea.&lt;lab domain&gt; | `pelab-admin`; password in `credentials/pelab01/gitea-admin.txt` |
| Harbor admin | https://harbor.&lt;lab domain&gt; | `admin`; `credentials/pelab01/harbor-admin.txt` |
| Grafana admin | https://grafana.&lt;lab domain&gt; | `admin`; `credentials/pelab01/grafana-admin.txt` |
| Argo CD admin | https://argocd.&lt;lab domain&gt; | `admin`; `sudo k3s kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' \| base64 -d` on that VM |
| The delegate's read-only login for Argo CD and Grafana | https://argocd.&lt;lab domain&gt;, https://grafana.&lt;lab domain&gt; | `delegate`; the password is in the logins file and in `credentials/pelab01/platform.md` |
| Every service and link, in one page | `credentials/pelab01/platform.md` | written by the build |
| The delegate's logins | `/etc/pelab/logins.md` on their VM; a copy in `credentials/pelab01/logins/student01.md` | nothing to print |

The `credentials/pelab01/` files are on each delegate's VM, next to the project (`~/plartfom-enable/prelab-setup/credentials/pelab01/`): each VM has its own, and no machine has everyone's. Git never commits them.

## Build

On each VM, by its delegate ([BUILD-YOUR-VM.md](../../prelab-setup/BUILD-YOUR-VM.md)):

```bash
ansible-galaxy collection install -r requirements.yml
ansible-playbook site.yml -K
```

The build ends with the platform applier's first run. If it fails, the error
shows the applier's log.

## Check the lab before the first day (and every morning)

From a delegate thin client on the SARB network:

1. Open https://backstage.&lt;lab domain&gt;: the catalog lists team01's `hello` service.
2. Open https://student01.&lt;lab domain&gt; with student01's password: the editor and terminal load.
3. In that terminal: `git clone https://gitea.<lab domain>/team01/hello` with student01's password.
4. Open https://hello-team01-dev.&lt;lab domain&gt;/: `"environment": "dev"`.
5. Open Harbor as student01: the team01 project shows a scanned `hello` image with an SBOM.
6. Open Grafana as `delegate` (its password is in the logins file): folder PE Lab, dashboard Golden path services, team01: the version table is filled.

On every VM at once, from your machine (`export ANSIBLE_INVENTORY=inventory/all-vms.yml` first):

```bash
ansible pelab -m ping
ansible pelab -b -a "systemctl list-timers pelab-*"
ansible pelab -b -a "journalctl -u pelab-platform-apply.service -n 20 --no-pager"
ansible pelab -b -a "lxc list -c ns4"
ansible pelab -b -m ansible.builtin.shell -a "k3s kubectl get pods -A | grep -v -E 'Running|Completed'"
ansible pelab -b -a "pelab-safety-net status"
```

The applier's last lines should read `environments ...: Up to date` and
`policies ...: 3 policies, 0 exceptions in force`. The safety net should be
`OFF` (unless you switched it on).

## During the labs: common fixes

| Symptom | Cause | Fix |
| --- | --- | --- |
| A workspace does not load | The container stopped, or its code-server crashed | On that VM: `sudo lxc restart student01`. Still broken: reset it (below) |
| A delegate locked themselves out of their workspace | Changed files under their home or broke the shell | On that VM, reset the workspace: `sudo lxc stop -f student01 && sudo lxc restore student01 clean && sudo lxc start student01`. Their work is safe in Git |
| A VM is beyond repair | | Give the delegate the spare VM. Their earlier work is not on it; on the spare they start from the day's first lab |
| A pipeline stays "Waiting" | The VM's runner is busy or stopped | On that VM: `sudo lxc exec runner01 -- systemctl status pelab-gitea-runner`; restart it with `sudo lxc exec runner01 -- systemctl restart pelab-gitea-runner` |
| A pipeline cannot pull the base image | Harbor's Docker Hub cache has no internet and no cached copy | Pull once with internet; the cache keeps it. See "Offline" in the README |
| Day 3: the plan pipeline fails with an access error | The read-only kubeconfig secret is stale (cluster rebuilt) | `ansible-playbook site.yml --tags golden_path -K`, on that VM |
| Day 3: no platform/apply status after a merge | The applier failed | `sudo journalctl -u pelab-platform-apply.service -n 50` on that VM; fix, then `sudo systemctl start pelab-platform-apply.service` |
| Day 3 Lab 3: you need to cause drift | | On every VM: the commands are in the Day 3 guide ([day3-notes.md](day3-notes.md)). Pause the repairs, raise team01-staging's CPU quota to 5, and after the delegates have run their plan, start the repairs again |
| Day 5 Lab 5: expire an exception | | The delegate opens the pull request that sets `pelab.io/expires` to yesterday and approves it as `platform-approver`; the next applier run removes the exception |
| Argo CD shows staging or prod "Retrying" | The delegate has not requested their environments yet | Expected until Day 3 Lab 2 |
| Merges stop reaching dev, or Argo CD is down, and the fixes above do not help within 15 minutes | Argo CD | Switch on the safety net: `ansible-playbook safety-net.yml -e safety_net=on`. See [safety-net.md](safety-net.md) |
| A merge is blocked although it was approved | The approval went stale after a new commit (`dismiss_stale_approvals`), or the required check `pipeline` is not green: the run is still going, or it failed | Approve again (as `reviewer`); wait for the run; if it is red, the delegate fixes the branch |
| Merge blocked, approved, and the run is green but the pull request says the check `pipeline` is missing | The run was cancelled or the runner stopped before the last step | Re-run the pipeline (Actions → the run → Re-run all jobs); check the runner with `sudo lxc list` on that VM |
| An environment or exception request will not merge | Only `pelab-admin` and `platform-approver` count | The delegate signs in as `platform-approver` (its password is in the logins file) in a private window and approves; read the plan or the reason with them |
| A pull request on hello or rates will not merge for lack of an approval | One approval from another account is needed; the author's own does not count | The delegate signs in as `reviewer` in a private window and approves |
| A delegate cannot find their password | | It is in `/etc/pelab/logins.md` on their VM (`cat /etc/pelab/logins.md`), and in `~/plartfom-enable/prelab-setup/credentials/pelab01/logins/student01.md` on the same VM |
| Argo CD or Grafana rejects a delegate's password | Those two take the read-only account, not `studentNN` | `delegate` with its password from the logins file. If that fails too, the account is missing or changed: `ansible-playbook site.yml --tags platform` puts it back |

## Reset

Between days of the same cohort, nothing needs resetting: delegates keep their work.

To put the workspace back and rebuild the environments from Git (same cohort), on each VM:

```bash
ansible-playbook reset.yml
```

Between cohorts (new Gitea accounts and repositories, empty environment and exception requests; the passwords stay the same unless you edit `prelab-setup/files/passwords/` first):

```bash
ansible-playbook reset.yml -e reset_rotate_credentials=true
```

Each VM then has a new logins file (`/etc/pelab/logins.md`).

## Backup and restore

Each VM backs itself up every night (`/opt/pelab/backups` on the VM). To take one
now and copy it next to the project on the same VM:

```bash
ansible-playbook backup.yml -K
```

That copy helps when the platform breaks, not when the VM is lost: a lost VM is
rebuilt from scratch, and the delegate's work is in Gitea on it, so tell
delegates to push at the end of every lab. To restore a broken platform on the
same VM:

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

- [ ] Full build of one delegate VM (and then of all of them at once); build time recorded. During a pipeline: `free -h` shows more than 3 GB available and `df -h /` below 75 %, to confirm 8 vCPU, 23 GB, 100 GB is enough (setup guide, Part 9).
- [ ] Every lab of all six days done once from a thin client, following the handbook exactly.
- [ ] Day 3 Lab 2 and Lab 3, and Day 5 Lab 5, done once end to end (they involve the platform applier).
- [ ] The GitOps path, which could only be tested here: a merge goes live in dev (Day 2 Lab 2);
  staging and prod sync after the environment request (Day 3 Lab 2, step 6); promotion,
  a bad release and its revert, and self-heal (Day 6 Labs 1 and 4).
- [ ] A reset of the same cohort, and a reset for a new cohort; times recorded.
- [ ] `backup.yml`, then a full restore with `restore.yml` (ideally onto a second machine); times recorded.
- [ ] The safety net switched on, a merge reaching dev through it, and switched off again ([safety-net.md](safety-net.md)).
- [ ] The lab works with the server's internet switched off (if the course will run offline).
- [ ] Every delegate can open the logins file on their VM; capstone panels briefed with the rubric.
