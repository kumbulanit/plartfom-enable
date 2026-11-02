# PE Lab: an Internal Developer Platform in one playbook

This project builds the training lab for the 6-day Platform Engineering Capability
Development Programme. By default **every delegate has an Ubuntu Server 24.04 VM of
their own** with the whole platform on it, and works alone. Ansible runs on the VM
it builds (localhost, `inventory/hosts.yml`). The usual way: each delegate clones
this repository onto their own Ubuntu machine and runs the build there, following
[BUILD-YOUR-VM.md](BUILD-YOUR-VM.md); every machine gets the same passwords, from
`files/passwords/` in this repository. The
other way: the instructor builds one VM and clones it for every delegate, so every
VM is an exact copy with the same passwords (the build is clone-safe: a fixed
Kubernetes node name, and lab addresses that are names resolving on the VM itself).
Every VM is `student01` in `team01`. The platform runs in k3s, installed directly
on the VM. See the setup guide, "Before you clone".
A second login, `reviewer`, lets a delegate approve their own pull request as a
second person, and `platform-approver` lets them play the platform team. The
same playbook still builds one shared host for a whole cohort (set
`pelab_cohort_size`, `pelab_team_count` and `pelab_runner_count`).

The lab is a small but complete **Internal Developer Platform (IDP)**. At the end of
the build, every team has a simple web service that it changes, ships and runs
through the platform. Nobody has to ask for access, and nobody runs `kubectl apply`.
The service is called `hello`; it only reports its name, version and environment.

```
 Portal ──▶ Template ──▶ Repository ──▶ Pipeline ──▶ Registry ──▶ GitOps ──▶ Cluster ──▶ Observability
 Backstage   Gitea        Gitea          Gitea         Harbor       Argo CD    k3s +       Prometheus,
 (catalog)   template     (protected     Actions       (scan +      (dev on    Kyverno     Grafana, Loki
             repository    main, 1        (lint, test,  SBOM)        merge;     guardrails  (dashboard,
                           approval)      secrets,                   staging/prod           logs, alert)
                                          build, scan)               by PR)
        ◀──────────── catalog entry: owner, links to every step ────────────┘
```

> **Status.** This has not yet been run on a real host. What has been checked
> locally is listed under [What was verified](#what-was-verified). Plan a full
> rehearsal on the target hardware before the first cohort.

## What the platform is made of

The **core** is always installed. It covers each part of the brief's capability
model with one tool:

| Capability (brief) | Tool | What the golden path does with it |
|---|---|---|
| Developer portal and catalogue | **Backstage** | Lists the platform services, the golden-path template, teams, people and every team service with its owner and links |
| Golden paths / templates | **Gitea template repository** | "Create from template" makes a new service with code, tests, pipeline, deployments, alert and catalog entry; `platform/pipeline-templates` holds small pipelines (smoke test, nightly scan) a team copies in |
| Source control, segregation of duties | **Gitea** | `main` is protected: every change is a pull request that a teammate must approve (CODEOWNERS) |
| CI, test gates, secret detection | **Gitea Actions** + runners | ruff, pytest, gitleaks, hadolint, kustomize validation, docker build, trivy |
| Artefact management, vulnerability scanning, SBOM | **Harbor** | One project per team; every pushed image is scanned and gets an SBOM; images are tagged with the commit SHA |
| GitOps delivery and promotion | **Argo CD** | Deploys every merge to dev automatically; staging and prod change only through an approved pull request |
| Container platform, tenancy | **k3s** + team namespaces | `teamNN-dev/staging/prod` with RBAC, quotas, default limits and network policy |
| Infrastructure as Code, environment lifecycle | **OpenTofu** + the platform applier | dev comes with every team; each team requests staging and prod with a six-line module in `platform/environments`. The pull request shows the plan, the platform team approves, the platform applies |
| Policy-as-code | **Kyverno** | Images must come from Harbor, must not use `latest`, and workloads must carry ownership labels. The policies, their tests and time-limited exceptions live in `platform/policies` |
| Observability | **Prometheus, Grafana, Loki, Alloy** | The service's metrics, an availability panel, a running-version table and its logs on one dashboard, plus a first alert |

The **extras** are switched off to keep the lab simple. Each one is enabled with
a single variable, ready for the later labs:

```yaml
# inventory/group_vars/pelab/main.yml
pelab_extras: [opencost, argo-rollouts]
```

| Extra | Tool | For |
|---|---|---|
| `keycloak` | Keycloak (dev mode) | Identity federation (Lab 3) |
| `sonarqube` | SonarQube Community | Code quality gates |
| `argo-rollouts` | Argo Rollouts | Progressive delivery (maturity level 4) |
| `jaeger` | Jaeger | Tracing (OTLP) |
| `redpanda` | Redpanda (Kafka API) | Events and data contracts (Lab 9) |
| `apisix` | APISIX gateway | Governed APIs (Lab 9) |
| `opencost` | OpenCost | FinOps and unit cost (Lab 10) |

### Who signs in where

| Tool | Delegates | Instructors |
|---|---|---|
| Workspace, Gitea, Harbor | `studentNN` with their own password (`/etc/pelab/logins.md`) | `pelab-admin` (Gitea), `admin` (Harbor) |
| Gitea, for role-play | `reviewer` (approves their pull requests) and `platform-approver` (the platform team), same file | |
| Argo CD, Grafana | `delegate`: a read-only login, with its password in the same file | `admin` |
| Prometheus, Alertmanager | `delegate`, the same login, asked for by the browser | the same |
| Backstage | guest sign-in, no password | the same |

Only the portal lets anyone in without a login, because the upstream Backstage
image offers only the guest sign-in, which has no password. Argo CD and Grafana
have anonymous access off, and Traefik asks for the `delegate` login in front of
Prometheus and Alertmanager, so the lab can face the internet without an address
allowlist. The setup guide's cloud section says what the open portal means and
how to keep the firewall allowlist instead. The shared password is generated
from `files/passwords/delegate-viewer.txt` like the others. `delegate` is a local
Argo CD account with the built-in `role:readonly` (its bcrypt hash goes into
`argocd-secret` through the chart), and a Grafana Viewer that the `platform`
role creates through Grafana's API once the chart is up. Prometheus and
Alertmanager have no accounts of their own: a Traefik `Middleware`
(`delegate-login` in `monitoring`, `platform_monitoring_login`) checks the same
bcrypt hash with HTTP basic auth on both Ingresses, so the browser shows its own
sign-in box. Alertmanager has no roles, so whoever signs in there can also add
silences. Grafana reads both inside the cluster and never passes through the
login.

### Optional: image signing

For the supply-chain lab (Lab 5), the golden path can also sign images. It is off
by default. To turn it on, set `golden_path_signing: true`, for example in
`inventory/group_vars/pelab/main.yml`, and run `site.yml` (or `--tags golden_path`
on a lab that is already built). Then:

- **Key.** A cosign key pair is generated once, on `runner01`, and kept in
  `credentials/`: `cosign.key` (encrypted with the password in
  `cosign-password.txt`) and `cosign.pub`.
- **Pipeline.** Each team organisation gets two more Actions secrets,
  `COSIGN_PRIVATE_KEY` and `COSIGN_PASSWORD`. After "Push to Harbor", the
  pipeline's "Sign the image" step signs the pushed image by its digest. The step
  is skipped when the secret is missing, so it does nothing in the default lab.
- **Verification.** The Kyverno policy `pelab-signed-images` checks the signature
  of every team-project image in the team namespaces. It only audits: unsigned
  images still run, and they show up in the namespace's policy report.

The lab may have no internet access, so signatures are not written to the public
transparency log (Rekor). By default, cosign 3 downloads its service settings
(the "signing config") from the internet, and it rejects `--tlog-upload=false`
on its own. The pipeline therefore passes `--use-signing-config=false
--tlog-upload=false`; cosign 3.1.3 prints a deprecation notice for the second
flag. cosign 3 also attaches the signature to the image as a Sigstore bundle
(an OCI referrer) instead of a `.sig` tag, so the policy uses
`type: SigstoreBundle`. Kyverno trusts the lab CA (the `pelab-ca` ConfigMap) so
that it can read signatures from Harbor. That trust is configured whether
signing is on or not.

Two things to know:

- The template README gets its "Signed images" section only if signing is on
  when the template repository is first created.
- Turning the option off again does not remove the key, the two secrets or the
  policy. Delete the secrets in each team organisation and the
  `pelab-signed-images` ClusterPolicy by hand.

## The golden path: what a delegate does

Each delegate's logins are in one file, `/etc/pelab/logins.md`: on their own VM
(on the host and in the workspace), with a copy next to the project on that VM in
`credentials/pelab01/logins/student01.md`. There is no printed access sheet. Their own
password, in the form `Lab-abcd-efgh-1234`, signs in to the browser IDE, Gitea and
Harbor. Argo CD and Grafana take the read-only login `delegate`, whose password is
in the same file; the portal signs everyone in as guest. Every lab is written out
step by step in the handbook, `platform/handbook` in Gitea.

**Role-play logins.** With `pelab_shared_logins: true` (the default), Gitea also
has `reviewer`, a member of every team's `developers`, and `platform-approver`,
and the logins file lists both. A delegate working alone signs in as `reviewer` in
a private window to approve their own pull request as a second person, and as
`platform-approver` to approve their environment and exception requests as the
platform team. `platform-approver` is in the Gitea team `approvers` of the
platform organisation: read access to the request repositories, where its
approval counts; it cannot push or merge. Its approval does not count on the team
repositories, and `reviewer`'s does not count on the request repositories. The
course says plainly that this is role-play: at work accounts are personal.
`false` creates neither account, lists only the delegate's own login and leaves
approvals to `pelab-admin`. Changing the setting on a built lab
takes effect on the next `site.yml` run (the branch rules are brought in line);
an approval counts if its author was on the list when they approved.

1. **Open the portal** at `https://backstage.<domain>`. It shows the platform
   services, the golden path, the teams and their services.
2. **Open your workspace** at `https://studentNN.<domain>`. This is VS Code in the
   browser, with a terminal, git, kubectl and all the course tools. Clone your
   team's service with `git clone https://gitea.<domain>/teamNN/hello.git`.
3. **See it running.** The build already ran the pipeline once, so
   `https://hello-teamNN-dev.<domain>` answers with its version, which is the
   commit SHA.
4. **Change something.** Edit the `GREETING` line in `app/main.py`, push a branch,
   and open a pull request. The pipeline runs on it. dev sets no greeting of its
   own, so the code's greeting is what dev shows; staging and prod set theirs in
   `deploy/<env>/kustomization.yaml`.
5. **Get it approved.** A second person (`reviewer`) approves the pull request. Without
   that approval, and without a green pipeline, `main` will not accept the
   change: the pipeline's last step posts its verdict as the `pipeline` status,
   and the branch rule requires it (see [The merge gate](#the-merge-gate)).
6. **Watch it ship.** On merge, the pipeline pushes `harbor.<domain>/teamNN/hello:<sha>`.
   Harbor scans it and records its SBOM, and Argo CD rolls it out to `teamNN-dev`.
7. **Request staging and prod (Day 3).** Add `teamNN.tf` to `platform/environments`
   (see [The request repositories](#the-request-repositories-and-the-platform-applier)).
8. **Release to staging, then prod.** In `deploy/prod/kustomization.yaml`, set
   `newTag` to the SHA running in dev and the replica count to 2. Open a pull
   request and get it approved. Argo CD deploys exactly what is in Git. The Grafana
   dashboard ("PE Lab / Golden path services") shows the new version per
   environment.
9. **Self-service.** Create a second service with "Create from template" (the link
   is on the golden-path entry in the portal). Tick "Git content" and "Protected
   branches", and use a lowercase name with dashes. Argo CD finds the new repository
   on its own within a minute, and dev goes live once its first pipeline run has
   pushed an image. Register it in the portal with Create, Register existing
   component, and the address of its `catalog-info.yaml`.

Two demonstrations work out of the box:

- **Guardrails.** Try deploying `nginx:latest` into a team namespace. Kyverno
  rejects it three times: wrong registry, `latest` tag, missing ownership labels.
  Each rejection names the fix.
- **GitOps recovery.** `ansible-playbook reset.yml` deletes every team namespace.
  The build recreates dev, the platform applier recreates the staging and prod
  environments the teams requested, and Argo CD redeploys every service from Git.

The template's README (`platform/golden-path` in Gitea) is the user guide that
delegates read. The service code is about 100 lines of standard-library Python;
see `../labs/day1/golden-path/`.

## The merge gate

`main` in every service and request repository takes pull requests only, with
one approval and a green pipeline. Gitea enforces the green pipeline through a
required status check called `pipeline`:

- the last step of every pipeline (`ci.yaml`, `plan.yaml`, `test.yaml`) runs
  even when an earlier step failed and posts one commit status, `pipeline`,
  success or failure, with a link to the run;
- the branch rule (`golden_path_branch_protection`,
  `golden_path_request_protection`) has `enable_status_check` with
  `status_check_contexts: [pipeline]`. While that status is missing, pending or
  failed, the pull request says "Some checks are pending" or "Some required
  checks failed", the API refuses the merge ("Not all required status checks
  successful"), and the merge button only offers to merge "When checks
  succeed", which queues it. Repository administrators could still merge;
  delegates are writers, not administrators.

The pipeline posts the status itself because Gitea 1.27.0 cannot reliably
require the statuses its jobs write (see [Not included](#not-included-follow-ups)).
A re-run of a failed pipeline on the same commit posts a newer `pipeline`
status, and the newest one counts.

## The request repositories and the platform applier

Two platform repositories are how teams ask for things. Every delegate may branch
and open pull requests there (Gitea team `requesters`); only the platform team may
approve (`golden_path_request_approvers`: `pelab-admin`, and `platform-approver`
when `pelab_shared_logins` is true).

| Repository | What teams ask for | What the pull request runs |
| --- | --- | --- |
| `platform/environments` | Staging and prod: a `teamNN.tf` file using the OpenTofu module `modules/team-environment` (team, environments, size small or medium) | `tofu fmt`, `validate` and `plan`, with a read-only identity |
| `platform/policies` | A time-limited exception to a guardrail: a Kyverno `PolicyException` in `exceptions/`, with who, why and until when | `kyverno test tests/`, and `tests/check-exceptions.py` (who, why, at most 30 days, team namespaces only) |

**No pipeline can change the cluster.** The plan pipeline's credentials
(`ENVIRONMENTS_READER_KUBECONFIG`, a ServiceAccount in `pelab-tfstate`) can read
namespaces, budgets, network policies, role bindings, the delegate accounts and the
OpenTofu state, and nothing else. The changes are made by the **platform applier**,
a systemd timer on the lab host (`pelab-platform-apply.timer`, every
`golden_path_applier_interval`, default 2 minutes). It fetches `main` of both
repositories and:

- runs `tofu apply` for `environments`, with the state in the cluster (Secret
  `tfstate-default-environments` in `pelab-tfstate`);
- applies `policies/`, applies the exceptions whose `pelab.io/expires` date has not
  passed into `pelab-exceptions`, and deletes the expired or removed ones.

It posts the result on the commit as the status `platform/apply` ("Applied: 16
added", "Up to date", "3 policies, 1 exceptions in force", or the error). Because
it applies every run, hand-made changes are put back (drift). Its log:
`journalctl -u pelab-platform-apply.service` on the host.

Kyverno honours policy exceptions only in `pelab-exceptions` (chart setting
`features.policyExceptions.namespace`), which only the applier writes to. After an
exception expires, running pods keep running, but new ones are refused.

The lab build creates only each team's dev namespace. Until a team requests its
environments, Argo CD's staging and prod applications for it keep retrying (every
5 minutes at most) and sync as soon as the namespaces exist. The applier, the runners and the
workspaces have the two providers the template and the warm-up use in a local
mirror (`/usr/local/share/opentofu/plugins`, configured in
`/etc/opentofu/tofurc` through `TF_CLI_CONFIG_FILE`), so `tofu init` needs no
internet for them.

## The delivery safety net

If Argo CD gives trouble during the course, one switch moves the teams' deployments
to the platform applier. Nothing that runs is removed, and teams keep working the
same way. The step-by-step version, with what to tell delegates, is
[`../docs/instructor/safety-net.md`](../docs/instructor/safety-net.md).

```bash
ansible-playbook safety-net.yml -e safety_net=on     # Argo CD paused; the applier deploys
ansible-playbook safety-net.yml -e safety_net=off    # Argo CD deploys again
ansible-playbook safety-net.yml                      # which one is deploying
```

While it is on (the flag file `golden_path_safety_net_flag`), every applier run:
- keeps Argo CD's two controllers at 0 replicas;
- deploys each team repository's `deploy/<env>` from main:
  - **dev** at the latest commit whose pipeline passed. It waits while the
    pipeline runs, and keeps the old version if it failed.
  - **staging and prod** exactly as committed.

It also obeys these limits:
- It applies only `golden_path_safety_net_kinds`, and only into the team's own
  namespaces.
- The Kyverno guardrails still check everything.
- Pipelines still hold no cluster credentials.

The result appears on each commit as `safety-net/dev`, `safety-net/staging` and
`safety-net/prod`. To post those statuses, the applier is a member of a
`platform` team in each team organisation, with write access to code only. The
same switch exists on the host as `sudo pelab-safety-net on|off|status`.

It does not prune: a file removed from `deploy/` stays in the cluster until Argo
CD is back.

## Course materials

| What | Where |
| --- | --- |
| **Setup guide**: from an empty server to a checked lab, step by step; includes a cloud virtual machine on the internet | [`../docs/instructor/setup-guide.md`](../docs/instructor/setup-guide.md) |
| **The GitHub option**: running the Git side on github.com instead of Gitea, and what it would take | [`../docs/instructor/github-option.md`](../docs/instructor/github-option.md) |
| Delegate handbook: every lab step by step, with the commands to paste, what to expect, and "If you are stuck" | Gitea `platform/handbook` (source: `../labs/README.md` and `../labs/dayN/README.md`) |
| The code each day uses: the golden path template, the environments, the catalog, the policies and guardrails, the dashboard | `../labs/dayN/` (the build seeds it into Gitea; see `golden_path_platform_repos` in `roles/golden_path/defaults/main.yml`) |
| The six day decks (PowerPoint, with speaker notes) | `../docs/slides/` |
| Instructor guide: a guide per day (hour by hour, the instructor's own actions and commands), run-book, safety net, capstone rubric, lab check-off sheet | `../docs/instructor/` |

The handbook, the day guides and the check-off sheet are generated from the decks'
content (`../docs/slides/src/handbook.js`), so they always agree.

Every workspace has `/etc/pelab/env`, which sets `ME` (studentNN), `TEAM` (teamNN)
and `DOMAIN`, so the handbook's commands work as pasted, for example
`git clone https://gitea.$DOMAIN/$TEAM/hello`.

## Build the lab

The [setup guide](../docs/instructor/setup-guide.md) walks through all of this
step by step, including what to ask the infrastructure, network and desktop
teams for, weeks ahead. In short:

**Lab hosts.** Ubuntu Server 24.04, freshly installed, one per delegate. One
delegate's VM (one workspace, one runner and the whole core platform) is built for
8 vCPU, 23 GB RAM and a 100 GB disk. Where that goes, roughly (estimates, to
check in the rehearsal with `free -h`, `df -h /` and `k3s kubectl top pods -A`):

| | Memory | Disk |
| --- | --- | --- |
| Ubuntu, k3s and Traefik | 1.5 GB | 10 GB |
| Platform: Prometheus and Grafana, Loki, Alloy, Kyverno, Gitea, Harbor, Argo CD, Backstage | 8 to 10 GB | 15 GB of images |
| The delegate's dev, staging and prod (the hello app) | 0.5 GB | |
| Workspace (container, at most 2 vCPU and 6 GiB) | 1.5 to 6 GB | |
| Runner (container, at most 4 vCPU and 6 GiB) | 0.5 to 6 GB | |
| Workspace and runner disk (the LXD pool, a 40 GiB file) | | up to 40 GB |
| ZFS cache (capped at an eighth of the RAM) | up to 3 GB | |
| Harbor images, Prometheus (at most 5 GB), Loki, Gitea | | 10 GB |
| **Total** | **about 14 to 16 GB in use, 23 GB at the worst** | **about 75 GB** |

Keep the disk below 85 % full: above that, Kubernetes starts removing pods. The
extras need more: SonarQube alone wants 3 to 6 GiB and Keycloak 1 to 1.5 GiB, so
leave `pelab_extras` empty on a 23 GB VM, or turn on one at a time in the
rehearsal and watch `free -h`. For one shared host
with 25 delegates, 2 spares and 5 runners: 32 vCPU, 96–128 GB RAM and 1 TB NVMe. A
second disk for the ZFS pool helps. The build needs internet access for packages,
release downloads, Helm charts and container images.

**Where Ansible runs.** On each delegate's VM itself (`ansible_connection: local`
in `inventory/hosts.yml`, the default): the VM is its own control node. A build on
the VM cannot reboot the VM and carry on, so when the updates need a restart it
stops with "The updates need a restart"; reboot and run it again. The instructor
can still check or change every VM at once over SSH with `inventory/all-vms.yml`
(no passwords in it): `export ANSIBLE_INVENTORY=inventory/all-vms.yml`, then the
`ansible pelab ...` commands of the instructor guides. To build a shared host
from a separate control node instead, list it in `inventory/hosts.yml` with its
`ansible_host` and no `ansible_connection`.

**Control node.** ansible-core 2.17 or later, the collections from
`requirements.yml`, and the Python packages `passlib` and `bcrypt` next to
Ansible: they hash the delegates' Argo CD password. Homebrew's `ansible` has
both; otherwise `pip install passlib bcrypt` into Ansible's Python. passlib 1.7.4
prints a harmless "error reading bcrypt version" warning with bcrypt 5.

**Without internet during the course.** The build needs the internet; the course
can run without it if the build has warmed the caches. The Python base image is
pulled through Harbor's Docker Hub cache when the build runs each team's first
pipeline, and it stays cached. The OpenTofu providers are mirrored locally. Two
things still reach out: Trivy's vulnerability database (the pipeline's Trivy step
does not fail the build without it, but Harbor's scans need it) and any image a
delegate pulls that is not cached yet. Rehearse once with the server's internet
switched off.

**DNS and TLS.** On the VM itself every `*.<pelab_domain>` name already resolves to
the lab, so a delegate working in their VM's browser needs no DNS. The playbook
creates a lab CA and certificate per VM (`pelab_tls_generate_selfsigned: true`, the
default); the delegate imports `files/tls/ca.crt` into their browser once. For
laptops reaching a lab from outside, add a wildcard DNS record `*.<pelab_domain>`
and, ideally, the bank's wildcard certificate with its CA in `files/tls/` (then set
`pelab_tls_generate_selfsigned: false`).

On a fresh VM, one script installs the prerequisites (pipx, git, tmux, Ansible
with passlib and bcrypt, and the collections); `--build` also starts the build
in tmux:

```bash
bash install-prerequisites.sh
```

```bash
ansible-playbook site.yml -K
```

Then check the whole lab (it changes nothing; each failure says what to do):

```bash
bash check-lab.sh
```

Run on the delegate's VM, as in [BUILD-YOUR-VM.md](BUILD-YOUR-VM.md). The delegate
then finds their logins on their VM (`/etc/pelab/logins.md`); a copy is in
`credentials/pelab01/logins/`. The VM's administrator logins and every URL are in
`credentials/pelab01/platform.md`, on that VM.

### Placeholders to replace

| Where | Placeholder | Replace with |
|---|---|---|
| `inventory/all-vms.yml` | `ansible_host: 192.0.2.10` | Each delegate's VM address (instructor only) |
| `ansible.cfg` | `remote_user = labadmin` | Your admin account on the VMs (for `all-vms.yml`) |
| `group_vars/pelab/main.yml` | `pelab_domain: pelab.example.internal` | The lab DNS zone (matching the DNS record and the certificate) |
| `group_vars/pelab/main.yml` | `pelab_training_subnets: [192.0.2.0/24]` | The delegates' laptop subnet |
| `group_vars/pelab/main.yml` | `pelab_admin_subnets: []` | Instructor subnet (also allowed to reach the Kubernetes API) |
| `group_vars/pelab/main.yml` | `pelab_ntp_servers: [ntp.ubuntu.com]` | Internal NTP servers |
| `files/tls/` | `wildcard.crt`, `wildcard.key`, `ca.crt` | Your certificate files, or set `pelab_tls_generate_selfsigned: true` |
| `group_vars/pelab/versions.yml` | `backstage_image` (upstream demo app) | Your organisation's Backstage build, when you have one |
| `group_vars/pelab/secrets.yml` | `pelab_dockerhub_username/token: ""` | Optional: a Docker Hub account to raise pull limits |
| `files/ssh-keys/` | (empty) | Optional: delegates' own `studentNN.pub` keys |

### What `site.yml` does

Each role can also be run on its own with a tag of the same name, for example
`--tags golden_path`. Run the full playbook once first.

| Tag | Role |
|---|---|
| `host_base` | Patching, chrony, sysctls and file limits, lab TLS and CA trust, ufw |
| `lxd` | LXD with a ZFS pool and a bridge; builds the `workspace` image with all course tools |
| `k3s` | k3s with Traefik and in-cluster DNS for the lab domain, plus Helm |
| `platform` | The core Helm releases and any extras; the delegates' Grafana login; the Harbor Docker Hub cache |
| `workspaces` | `student01` (or `student01..27` on a shared host): containers, browser IDE, SSH jump access, `clean` snapshot, the logins file |
| `runners` | `runner01` (or more, `pelab_runner_count`): Gitea Actions runners with the same tools as the workspaces |
| `teams` | Each team's `dev` namespace with RBAC, quota, defaults and network policy; delegate identities and kubeconfigs (with contexts for dev, staging and prod) |
| `backup` | The nightly backup timer, and the `pelab-backup` and `pelab-restore` scripts (see [Backup and restore](#backup-and-restore)) |
| `golden_path` | Gitea accounts and team organisations; the template, pipeline-templates, catalog, request and handbook repositories; one `hello` per team with a protected `main`; Harbor projects, the robot and the delegates' Harbor logins; Argo CD projects and ApplicationSets; Kyverno policies; the Grafana dashboard; the Backstage portal; the platform applier |

### How delegates connect

- **Browser:** `https://studentNN.<domain>` opens code-server inside the delegate's
  own LXD container.
- **SSH:** each workspace has a jump account on the host that can only reach its own
  container. The key pairs are in `credentials/<host>/ssh/`.
- **Inside the workspace:** the delegate has sudo and Docker. kubectl starts in
  `teamNN-dev`, with edit rights in dev and staging and view-only in prod (staging
  and prod exist once the team has requested them).

## Reset and teardown

```bash
ansible-playbook reset.yml                                    # same cohort: clean workspaces, rebuilt namespaces
ansible-playbook reset.yml -e reset_rotate_credentials=true   # new cohort: also fresh accounts and repos (same passwords)
```

A plain `reset.yml` does the following:

- Pauses the platform applier while it works.
- Restores every workspace to its `clean` snapshot.
- Deletes the team namespaces and recreates dev; the applier recreates the
  requested staging and prod environments.
- Prunes the runners.
- Lets Argo CD redeploy the team services from Git.

With `reset_rotate_credentials=true` (a new cohort) it also deletes and recreates
the delegate accounts (with the same passwords), keys and tokens, the teams' Gitea organisations,
repositories, Harbor images and Harbor logins, and empties the request
repositories: the OpenTofu state and the approved exceptions are removed, so the
new cohort starts with no staging or prod.

```bash
ansible-playbook teardown.yml -e pelab_teardown_confirm=<pelab_domain>
```

This removes the containers, k3s with all its data, and the lab state. Add
`-e teardown_remove_lxd=true` to remove LXD as well. Host hardening,
`credentials/` and the backups in `/opt/pelab/backups` are kept.

## Backup and restore

Every night at 02:30 (`backup_on_calendar`), `pelab-backup.timer` writes what the
course cannot rebuild from Ansible to `/opt/pelab/backups/<UTC date-time>/`, and
keeps the last 7 (`backup_keep`):

| File | What |
| --- | --- |
| `gitea.tar.gz` | `gitea dump`: repositories, pull requests and reviews, accounts, organisations, Actions secrets and logs, branch protection, and `app.ini` with its secret keys |
| `harbor-db.sql.gz` | Harbor's database: projects, users, the robot, scan reports, SBOM records |
| `harbor-registry.tar` | Harbor's image storage, so the images staging and prod run can be pulled again (`backup_harbor_registry`) |
| `cluster.yaml` | OpenTofu's state and the approved exceptions, for reference (both are rebuilt from Git) |
| `SHA256SUMS` | Checksums of the above |

Not backed up, because it is rebuilt: the platform (site.yml), the environments
and exceptions (from Git, by the platform applier), the deployments (from Git, by
Argo CD), and the workspaces (delegates' work is in Git; files only in a
workspace are lost).

Copy the latest backup to the control node every evening of the course. When the
delegate's VM is its own control node, the copy stays on that VM: it only helps
against a broken platform, not a lost VM, which is rebuilt instead.

```bash
ansible-playbook backup.yml                          # back up now, then copy
ansible-playbook backup.yml -e backup_run_now=false  # copy last night's
```

It lands in `backups/<host>/<date-time>/` (git-ignored) and is checked against
its checksums.

**Restore** onto a freshly built lab, for example a replacement server with the
same inventory and the same `credentials/` folder:

```bash
ansible-playbook site.yml
ansible-playbook restore.yml -e restore_from=backups/pelab01/20261020-023000
ansible-playbook site.yml --tags golden_path
```

`restore.yml` copies the backup to the host and runs `pelab-restore`, which:

1. checks the checksums and pauses the platform applier;
2. Gitea: reads the data, repository and database paths from Gitea's `app.ini`,
   stops Gitea, puts back the data folder (with the old `app.ini`, whose secret
   keys decrypt the restored Actions secrets), the repositories and the database
   (`sqlite3` from the SQL dump), then starts Gitea and regenerates the git hooks;
3. Harbor: stops everything except its database and cache, restores the
   database with `psql`, puts back the image storage, and starts Harbor again.

Then the applier is started again: within two minutes it recreates the teams'
staging and prod environments and exceptions from the restored repositories, and
Argo CD redeploys every service. Restore only one part with
`-e '{"restore_parts": ["gitea"]}'`.

Rehearsed locally (2026-10-20), with the same images as the lab: a backup of a
rootless Gitea 1.27.0 with the chart's layout restored into a fresh one by the
restore script (accounts and passwords, pull requests, branch protection, Actions
secrets, and git clone and push afterwards), and Harbor's database dumped and
restored with `goharbor/harbor-db:v2.15.4`. The backup script ran five times
with the right contents, checksums and rotation. Not rehearsed: the Harbor part
of the restore script, and either script on the real host.

## Reference

**Variables.** All site settings live in `inventory/group_vars/pelab/`:

- `main.yml`: domain, cohort (one delegate per VM: 1 delegate, 1 team, no spare, 1 runner), extras,
  network and TLS.
- `versions.yml`: every pinned version, checked against upstream on 2026-10-18.
- `secrets.yml`: passwords read from `files/passwords/` (part of the repository, so every machine has the same ones; a missing file is generated). Vault-able.

Role defaults have comments; the ones most often changed:

| Variable | Default |
|---|---|
| `pelab_extras` | `[]` |
| `pelab_container_host` | `false`. `true` only when the lab host is itself a container: Patchbay Labs builds a one-person lab this way on each delegate's own machine (its `templates/sarb-host`). The clock, kernel settings, firewall and host DNS are then left to that machine |
| `pelab_spare_team_assignments` | `{}`, for example `{student26: team03}` |
| `pelab_shared_logins` | `true` (the `reviewer` and `platform-approver` role-play logins, listed in the logins file) |
| `golden_path_starter_repo` | `hello` |
| `golden_path_branch_protection` | pull requests only, 1 approval, the `pipeline` status green |
| `golden_path_pipeline_context` | `pipeline` (the status every pipeline's last step posts) |
| `golden_path_build_starters` | `true` (run the pipeline once on each starter repo) |
| `golden_path_signing` | `false` (see [Optional: image signing](#optional-image-signing)) |
| `pelab_viewer_user` | `delegate`: the shared read-only Argo CD and Grafana login, also asked for in front of Prometheus and Alertmanager (its password is generated) |
| `pelab_team_member_roles` | dev and staging `edit`, prod `view` |
| `pelab_team_sizes` | `small`: 1 CPU and 2 Gi requested per namespace (dev, and the default for staging and prod); `medium`: double |
| `golden_path_request_approvers` | `[pelab-admin]`: who may approve environment and exception requests |
| `golden_path_applier_interval` | `2min` |
| `workspaces_profile_config` | 2 vCPU and 6 GiB per workspace |
| `runners_profile_config` | 4 vCPU and 6 GiB per runner |
| `host_base_zfs_arc_max` | an eighth of the RAM (the ZFS cache) |
| `lxd_storage_source` / `lxd_storage_size` | loop file / 20 GiB per workspace and runner, at least 40 GiB |

**Generated files** (where Ansible runs, so on the delegate's own VM; git-ignored), one folder per host, `credentials/<host>/` (`credentials/pelab01/` on a delegate's VM):

| File | Contents |
|---|---|
| `credentials/<host>/platform.md` | URLs, instructor logins, each team's repository and environments |
| `credentials/<host>/logins/studentNN.md` | The delegate's logins and addresses: the same file as `/etc/pelab/logins.md` on their VM |
| `credentials/<host>/workspaces.csv` | Roster |
| `credentials/<host>/ssh/` | Generated key pairs |
| `credentials/<host>/gitea-bot-token.txt`, `credentials/<host>/gitea-applier-token.txt` | Tokens Gitea made for the platform's own accounts |
| `files/passwords/` (in the repository, not generated) | Every password: `delegates/` holds the random part of `student01`'s, `reviewer`'s and `platform-approver`'s; the rest are the administrator and service passwords, and the salt of the `delegate` login's bcrypt hash |
| `credentials/<host>/cosign.key`, `credentials/<host>/cosign.pub` | The image signing key pair (only with `golden_path_signing`) |

**Supply chain of the lab itself.** Every downloaded binary is checked against its
project's published checksum. code-server publishes none, so it is pinned by
version only. The Docker apt key is checked against Docker's fingerprint.

**Upstream changes accounted for:**

- The Gitea runner is now `gitea-runner` v5.
- The OSS Loki chart moved to `grafana-community`.
- Bitnami images are no longer freely available, so no Bitnami subcharts are used:
  Gitea runs on SQLite and Backstage on its built-in database.

**Security notes:**

- Traffic to Traefik bypasses ufw (k3s ServiceLB uses DNAT), so the same source
  ranges are enforced on the Traefik service.
- Argo CD and Grafana need a login: delegates share the read-only `delegate`
  account (Argo CD's built-in `role:readonly`; Grafana's Viewer), and anonymous
  access is off in both. Traefik asks for the same account in front of
  Prometheus and Alertmanager (HTTP basic auth over the lab's TLS). Only the
  portal signs everyone in as guest (see [Not included](#not-included-follow-ups)).
  Delegates' Harbor logins have no project roles:
  the team projects are public, and only the pipeline's robot can push.
- No pipeline holds credentials that can change the cluster: the plan pipeline
  reads, and the platform applier on the host applies only the approved `main`.
- Containers are unprivileged, and LXD port isolation stops them reaching each
  other.

## What was verified

Checked locally:

- **Ansible.** `ansible-playbook --syntax-check` passes on `site.yml`,
  `reset.yml` and `teardown.yml`. `ansible-lint` passes the `production` profile
  with 0 failures and 0 warnings, so there are no remaining warnings to list.
- **The service.** ruff and hadolint pass, the 5 pytest tests pass, and a local
  run answered on `/`, `/healthz` and `/metrics` with JSON logs.
- **The golden path.** The template repository was rendered exactly as the role
  commits it. A repository was created from it by simulating Gitea's variable
  substitution. Then `kubectl kustomize` built dev, staging and prod, and the
  generated repository's own lint and tests passed. Argo CD's dev image override
  produced `harbor.../teamNN/hello:<sha>`.
- **Guardrails.** With the Kyverno 1.19.1 CLI, the golden-path service passed all
  8 checks. A `nginx:latest` deployment without labels was rejected by all 3
  policies.
- **Charts.** `helm template` succeeded for all 15 charts (core and extras)
  against the pinned versions, with the key settings spot-checked.
- **Templates.** The Argo CD ApplicationSet go-templates survive Ansible's
  templating unchanged. The catalog, dashboard, RBAC, network policy and kubeconfig
  templates all parse.
- **Image signing (option).** Checked with cosign 3.1.3 and the Kyverno 1.19.1 CLI
  against a local test registry, with internet access blocked:
  - The role's key-generation command ran under `dash` with the password on
    stdin. The role's own expressions saved the key pair and built the Actions
    secrets.
  - The pipeline's `cosign sign` command signed by digest without going online.
    Both registry styles were tested: with the OCI referrers API, and without it
    (the fallback tag).
  - The template README's `cosign verify` command passed.
  - With the rendered `pelab-signed-images` policy, the golden-path deployment
    passed with the signed image. It failed with an unsigned image, and with an
    image signed by another key.
  - cosign 3.1.3 rejects `--tlog-upload=false` on its own, and Kyverno's
    `type: Cosign` does not find cosign 3 signatures. These two results are why
    the pipeline passes both flags and the policy uses `type: SigstoreBundle`.
  - With signing off, the policies, the Actions secrets and the template README
    render exactly as before.
  - `helm template` with the new Kyverno values mounts the lab CA in the
    admission and reports controllers.

- **Integration test (2026-10-20)**, against Gitea 1.27.0 in Docker, a k3s
  v1.33 test cluster (k3d) and Kyverno chart 3.9.1 installed with the lab's
  values, with a stand-in for `k3s kubectl` that sends Gitea commands to the
  container:
  - The golden_path Gitea tasks ran end to end with the lab's inventory: 27
    delegate accounts plus the bot and applier accounts and their tokens, six
    organisations with teams, members, Actions secrets and variables, the five
    platform repositories with their content, the starter services generated from
    the template, branch protection everywhere, and the reader secret. A second
    run changed nothing.
  - As student01: pushing a branch to `platform/environments` worked and pushing
    to `main` was refused. A teammate's approval did not allow the merge ("Does not
    have enough approvals"); `pelab-admin`'s did.
  - The platform applier applied the merged request (16 resources), reported it on
    the commit, repaired a hand-edited quota on its next run, and applied the
    policies.
  - With the read-only identity, `tofu plan` showed the drift and `tofu apply` was
    refused. Removing staging planned 8 deletions. Bad input got clear messages.
  - Kyverno refused the shortcut deployment with the three messages, refused the
    status page, admitted it once the approved exception was applied, and refused
    its new pods after the exception expired and the applier removed it.
  - `kyverno test tests/` passes 11 tests, and fails when the exception is missing
    or an expectation is wrong. `tests/check-exceptions.py` accepts a good request
    and lists every problem in a bad one.
  - The handbook was seeded with the lab domain filled in.
- **Pipelines on a real runner (2026-10-20).** gitea-runner 5.1.1 in host mode,
  in a container with the workspace image's pipeline tools at the pinned versions
  (arm64 builds), registered with the test Gitea; a plain registry stood in for
  Harbor (with the Python base image at the cache's path):
  - The five starter pipelines ran green: checkout, ruff, 5 tests, gitleaks,
    hadolint, kustomize for the three environments, the build from the cached
    base image, Trivy, and the push tagged with the commit id.
  - Day 5 Lab 2 behaved as the slides say: a wrong test, a password and `USER
    root` each failed the pull request with the messages now quoted on the
    slides, and removing the password made it green again.
  - The Day 3 plan pipeline showed "Plan: 16 to add" with the read-only identity,
    with the providers from the local mirror. The Day 5 test pipeline passed 11
    tests and accepted the exception request.
  - Found and fixed on the way: gitleaks needed `--verbose` to name the file and
    line; OpenTofu ignored the provider mirror until it was configured explicitly
    (`/etc/opentofu/tofurc`); the read-only identity needed to read the lock.
    The plan needs the state to exist, which the applier's first run creates at
    the end of every build and reset.

- **Platform charts on a test cluster (2026-10-20).** Argo CD chart 10.10.5 and
  Kyverno chart 3.9.1 installed with the lab's rendered values (including Argo
  CD's per-host CA trust) on k3s v1.33, with the monitoring CRDs the golden path
  uses. The lab's CoreDNS template made pods resolve `*.pelab.example.internal`
  and reach Gitea over HTTPS with the lab CA. The full GitOps test (Argo CD
  deploying the teams' services) did not fit on the 8 GB test machine: see below.

- **The step-by-step handbook (2026-10-21).** Every lab was rewritten for
  beginners (why, numbered clicks, each command explained, real output, what to
  do if it differs), and its commands were run as printed: Days 1, 3 and 6 in
  the Ubuntu test image as an ordinary user; Day 2's pushes, refusals and merge
  conflict against Gitea 1.27.0 with two delegates; Day 4's Docker labs on Docker
  29; Day 5's pipeline checks (pytest, ruff, gitleaks on a one-commit checkout,
  hadolint), the Kyverno CLI 1.19 and the exception check; Day 6's release,
  revert and a k6 2.3.0 run. Gitea's screens (pull request form, review box,
  stale approval, conflict, squash merge, Actions, New Repository from a
  template) were checked in a browser. Fixed on the way: the golden path had no
  `.gitignore`, so running the app committed `__pycache__`; dev set its own
  `GREETING`, so a code change never showed in dev; `python3 -m pytest` fails
  where pytest comes from pipx (now `pytest -q`); the push link is
  `.../pulls/new/<branch>`; Day 3's drift plan shows one change per team; Argo CD
  checks every minute, not three; Day 6 named a CPU panel the dashboard does not
  have. Steps that need the whole platform (Argo CD, Harbor's pages, Backstage,
  the applier) are described from the configuration, not run.
- **The move into one repository (2026-10-21, evening).** The course is now the
  git repository `sarb` (history kept): `docs/`, `labs/` and `prelab-setup/` (this
  project). The content the build puts in Gitea moved from the golden_path role to
  `labs/` (`golden_path_labs_dir`; `*.j2` files are rendered, the rest copied).
  Before and after the move, the role's own `repo-files.yml` wrote out every
  platform repository: the template, environments, policies and catalog came out
  byte for byte the same, and so did the guardrails and the dashboard. The
  handbook repository now mirrors `labs/` (`dayN/README.md`). Then lint (0/0,
  131 files), the six syntax checks, the template renders, a deck build and the
  golden_path Gitea tasks against Gitea 1.27.0 and k3d (0 failures; the second
  run changed nothing) passed from the new layout. Found on the way: every
  handbook page's "next day" link was wrong (Day 3 linked to "Day 31").
- **The handbook against its own output (2026-10-21, later).** A harness took
  every command box exactly as the handbook prints it, ran it as student12 of
  team03 (Ubuntu 24.04, the workspace's tool versions) and compared the output
  with the handbook's, line by line; the browser's part (pull requests, reviews,
  approvals, merges) went through Gitea's API, and every before/after edit was
  checked in the file. Against the repositories the golden_path tasks created in
  Gitea 1.27.0, a k3d cluster and the lab's Kyverno chart (3.9.1, v1.19.1, with
  the three guardrails): Days 1 to 6 match, apart from what a test container
  cannot show (systemd, code-server, the umask) and timings. Found and fixed:
  Day 4 Lab 2 never went to `~/hello`, so `docker build .` failed in a new
  terminal; Day 2 Lab 2's `git log` lacked `cd ~/hello`, and the first commit is
  Gitea's "Initial commit"; the Docker build and `git clone` outputs were those
  of a pipe, not of a terminal (BuildKit's `=> [1/3] ...` list; the clone's
  username prompt and object counts); a plural `kubectl describe replicasets`
  prints no events (kubectl 1.36 and 1.37), so Day 5 Lab 5 now reads
  `kubectl get events`; the lab's `sed` rewrote the comment of
  `team00.tf.example`; every terminal lab now says what to type when Git asks
  for a password. Also: Day 3's plans are 16 to add, 1 change per team for the
  drift, 8 to destroy and 8 to add back; Day 5's exception needs
  platform-approver (a teammate's approval is refused) and an expired one stops
  new pods only. The merge gate and the safety net ran again on the current
  template (both pass; the test cluster needed the monitoring CRDs, which
  kube-prometheus-stack brings on the lab). Not run: the full GitOps test with
  Argo CD, and backup and restore (unchanged).
- **Team logins and `platform-approver` (2026-10-20).** The golden_path Gitea
  tasks ran against Gitea 1.27.0 and a k3d cluster: 0 failures, and a second run
  changed nothing. On `platform/environments`, a teammate's approval left the
  merge refused ("Does not have enough approvals"); `platform-approver`'s let it
  merge. `platform-approver` could not push to main (403) or merge ("User not
  allowed to merge PR"), and its approval, like another team's, did not count on
  `team01/hello`. With `pelab_shared_logins=false` the next run removed it from the
  rule (1 change) and its approval no longer counted; `true` put it back (an
  approval it gave while it was off still does not count: Gitea decides when the
  approval is given, so it approves again). The
  access sheet, the workspace's `logins.md` and `all-logins.md` rendered for a
  team member and for spares with and without a team.
- **The merge gate (2026-10-20).** Tested on Gitea 1.27.0 with one runner, on a
  `hello` made from the golden path with the branch rule as the role sends it: a
  pull request with no `pipeline` status yet, and one with a red status, were
  refused ("Not all required status checks successful") although approved; a
  green one merged; a newer `pipeline` status on the same commit overrode an older
  one; the status posted on a push to `main` too. The pull request page said
  "Some checks are pending", "Some required checks failed" and "All checks were
  successful" accordingly.
- **The delivery safety net (2026-10-20).** Tested on k3s v1.33 and Gitea 1.27.0,
  with the lab's Gitea tasks (re-run: 0 changes) and stand-ins for Argo CD's
  controllers. These worked:
  - the switch on, off and status;
  - Argo CD's two controllers scaled to 0 and back, with the Argo CD server
    untouched;
  - dev waiting for a running pipeline, keeping the old version after a failed
    one, then deploying the commit's image after it passed;
  - staging deploying once its namespace existed, then a promotion by changing
    `deploy/staging`;
  - hand-made drift (scaling, a deleted Service) put back;
  - a NetworkPolicy in `deploy/` refused;
  - the statuses posted once each.

  Found and fixed on the way: Gitea's combined status lists every row of a
  check, so the applier counts only the newest.
- **The handbook's commands (2026-10-20).** In an Ubuntu 24.04 image with the
  workspace tools at the pinned versions, the copy-paste commands of Day 3 Labs 1
  to 3, Day 5 Labs 2 to 5 and Day 6 Labs 1, 3 and 4 were run on copies of the
  lab's repositories, as team03. Each gave the result the handbook describes,
  including:
  - every plan summary;
  - the pytest, gitleaks and hadolint messages;
  - the Kyverno results;
  - the exception check;
  - the promotion and revert edits.

  Found and fixed on the way:
  - Changing a `local_file` replaces it (`-/+`, 1 to add and 1 to destroy), so
    Day 3 Lab 1 now says so.
  - Editing the examples in place would break the policy tests, so the Day 5
    labs now work on copies.
  - The drift lab needs the applier paused for a few minutes, or the applier
    repairs the drift before the teams can see it.
  - Ending an exception early needs a pull request the instructor did not open,
    with a past date the check accepts.

- **The delegate login (2026-10-20).** The Argo CD and Grafana values rendered
  with the real `group_vars` and went through `helm template` (argo-cd 10.10.5,
  kube-prometheus-stack 92.10.1): `argocd-cm` has `users.anonymous.enabled:
  "false"` and `accounts.delegate: login`, `argocd-rbac-cm` has `g, delegate,
  role:readonly` with an empty default policy, `argocd-secret` carries the
  bcrypt hash, and Grafana's `grafana.ini` has `[auth.anonymous] enabled =
  false`. The hash came out identical on a second run (fixed salt) and verifies
  with the `bcrypt` library. The Grafana tasks ran twice against a stand-in for
  the six Grafana API calls they make: on an empty instance (one change, then
  none) and on one where the account existed with a wrong password and the
  Editor role (two changes, then none). The access sheet and `platform.md`
  rendered with the login.

- **The login in front of Prometheus and Alertmanager (2026-10-20).** The
  kube-prometheus-stack values rendered with the real `group_vars` and went
  through `helm template` (92.10.1): both Ingresses carry
  `traefik.ingress.kubernetes.io/router.middlewares:
  monitoring-delegate-login@kubernetescrd`, Grafana's has none, and Grafana's
  Prometheus and Alertmanager data sources still use the in-cluster services.
  The Secret (one `users` key, `delegate:<bcrypt hash>`) and the `Middleware`
  rendered, passed `kubeconform` against the Traefik CRD schema, and came out
  identical on a second run; the hash verifies with the `bcrypt` library. On a
  throwaway k3d cluster (k3s v1.36.4, its bundled Traefik 3.7.8) with those
  manifests, the two Ingresses exactly as `helm template` printed them and a
  stand-in web server behind them: no credentials, a wrong password and another
  user name got 401 with the "PE lab: sign in as delegate" prompt, `delegate`
  with its password got 200, and the backend saw no `Authorization` header.

**Not verified** (needs the real host):

- The delegate login on the real Argo CD and Grafana: the chart's
  `configs.secret.extra` landing in `argocd-secret` next to the admin password
  on an upgrade, and Grafana's API answering through Traefik with the lab CA.
- The login in front of the real Prometheus and Alertmanager on the lab's own
  Traefik (k3s v1.36.5, with the lab's TLS and HTTPS redirect): their web pages
  working behind the browser's prompt, and Grafana's data sources unaffected.

- **The GitOps path:** Argo CD's ApplicationSets finding the team repositories
  through Gitea's API, dev deploying each merge, staging and prod retrying until
  their environments exist and then syncing, promotion and rollback by pull
  request, and self-heal. The rehearsal must cover Day 2 Lab 2, Day 3 Lab 2
  step 6 and Day 6 Labs 1 and 4 for at least one team.
- Runner registration on the lab's LXD runners, and jobs on amd64.
- Gitea over the lab's TLS, and the real `k3s kubectl exec` token generation.
- Harbor projects with automatic SBOM generation, and the robot secret update.
- Backstage reading its catalog from Gitea.
- Image signing on the host:
  - generating the key with `lxc exec` on `runner01`;
  - the multi-line `COSIGN_PRIVATE_KEY` secret in Gitea;
  - the digest lookup with `docker image inspect` (no Docker daemon was
    available locally);
  - Harbor storing and showing the signature;
  - Kyverno reaching Harbor through the lab CA.
- The image build, LXD behaviour and everything that only exists at runtime.
- The merge gate with the real LXD runners (tested locally, with one runner).
- The safety net with the real Argo CD and the real pipelines; switch it on and
  off once during the rehearsal.

Kyverno 1.19 reports `ClusterPolicy` as deprecated in favour of `ValidatingPolicy`.
The policies still work. Migrating them is a good Lab 6 exercise.

## Not included (follow-ups)

- Keycloak single sign-on for Gitea, Argo CD, Harbor, Grafana and Backstage.
  Today only the extra is installed, with no services wired to it.
- Signed build provenance (a SLSA attestation made with `cosign attest`). Image
  signing is an option (see [Optional: image signing](#optional-image-signing)),
  and Harbor produces the SBOMs.
- A Backstage software template (scaffolder). Today, Gitea's template repositories
  are the self-service path.
- **A password for the portal.** The upstream Backstage image signs everyone in
  as guest, and the guest provider has no password. A real login needs an
  identity provider (Keycloak, or Gitea as an OpenID Connect provider) wired into
  the portal's frontend, which the upstream image does not offer. Until then the
  portal, including "Register existing component", is open to anyone who reaches
  it.
- **Requiring Gitea's own job statuses.** Gitea 1.27.0 stores the first status a
  job creates ("Waiting to run") under a different key from its later updates,
  so a required check on a job's status stays pending for ever (seen on a test
  instance). The lab requires the `pipeline` status instead (see [The merge
  gate](#the-merge-gate)). With a later Gitea, the job statuses could be
  required directly and the verdict step dropped.
- **A proxy for the build.** The build needs direct internet access from the
  server; there are no proxy settings.
