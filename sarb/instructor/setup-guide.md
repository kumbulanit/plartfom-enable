# Setup guide: from an empty server to a checked lab

This guide takes you from a new server to a lab that is ready for delegates, one
step at a time. Each step says what to do, where to do it, and what you should
see. Follow it in order the first time. Afterwards, the [run-book](run-book.md)
is the short version for the course week.

**Who does what.** You need help from three other teams, and some of their work
takes weeks, so start with Part 1 early:

| Team | What they give you |
| --- | --- |
| Infrastructure | The server |
| Network | An address, a DNS record and firewall openings |
| Desktop support | Trust for the lab certificate on the thin clients |
| Nobody, on a cloud machine | If the server is a cloud machine you work on from inside, you need none of the three: see [Is the server in the cloud?](#is-the-server-in-the-cloud-read-this-first) |

**How long it takes.**
- Allow a full day for the first build and its checks.
- Build at least a week before the course, so there is time to rehearse.
- Write down how long each part takes: the next build gets easier to plan.

**What you need to know.** You can follow this without knowing Ansible or
Kubernetes. You only need to log in to a Linux server with SSH and copy commands.

```
 Delegates' laptops or thin clients (browser, SSH)   Instructor's control machine
            │  HTTPS, SSH                          │  SSH (runs Ansible)
            ▼                                      ▼
 ┌──────────────────────── Lab server: Ubuntu Server 24.04 ────────────────────────┐
 │  LXD: 27 workspaces (student01-27) and 5 pipeline runners                       │
 │  k3s (Kubernetes): Gitea, Harbor, Argo CD, Kyverno, Grafana, Backstage,         │
 │                    and every team's dev, staging and prod                       │
 │  The platform applier and the nightly backup (systemd timers)                   │
 └─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Is the server in the cloud? Read this first

If the lab server is a cloud virtual machine that you work on from inside (a
terminal or a remote desktop on the machine itself, as on a laptop), the build
is the same as on a server in the bank, but the preparation is much shorter:
no network team, no DNS record, no certificate request, no firewall request.
The lab provides its own names and certificate, on the machine.

**Working on the machine itself.**

1. **Create the machine** at the provider: Ubuntu Server 24.04 LTS; 32 vCPU, 96
   to 128 GB RAM, 200 GB system disk; optionally an empty 1 TB data disk for
   the workspaces (without it the lab uses a 600 GB file on the system disk,
   which must then be large enough). On Azure the data disk is usually
   `/dev/sdc`; `/dev/sdb` is the temporary disk, never use it. Nested
   virtualisation is not needed.
2. **Get the project onto it:** clone the course repository there (Part 3,
   step 2). The machine is also the control machine: install Ansible on it
   (Part 3, step 1) and add `ansible_connection: local` under `pelab01` in
   `inventory/hosts.yml`. For sudo, add `-K` to every `ansible-playbook`
   command, or allow your user sudo without a password (Part 3, step 4).
3. **Addresses and names.** In `inventory/hosts.yml`, `ansible_host` is the
   machine's own private address (`hostname -I | awk '{print $1}'`). Keep the
   default lab domain or pick any name. No DNS record is needed: on the
   machine, every `<name>.<lab domain>` already resolves to the lab itself,
   for the browser, the workspaces, the runners and the cluster alike. Leave
   `pelab_training_subnets` and `pelab_admin_subnets` empty: the machine's own
   browser is always allowed.
4. **Certificate:** set `pelab_tls_generate_selfsigned: true` (Part 5, item 5)
   and trust `files/tls/ca.crt` in the browser you use on the machine.
   Firefox: Settings → Privacy & Security → Certificates → View Certificates →
   Authorities → Import. Chrome or Chromium: `certutil -d sql:$HOME/.pki/nssdb
   -A -t "C,," -n pelab-ca -i files/tls/ca.crt` (package `libnss3-tools`),
   then restart the browser.
5. **Keep the passwords and backups off the machine too.** `credentials/` and
   `backups/` are written next to the project and are never pushed to the
   repository (git ignores them on purpose). Copy both somewhere else every
   evening: object storage, or your laptop.
6. **Time servers:** leave `pelab_ntp_servers` at the default.
7. **After the course,** stop the machine (a stopped machine costs only its
   disks) and delete it once the final backup is safe (Part 11).

Then continue with Part 2, step 8 (update and reboot) and Part 3.

**Only if delegates connect from their own laptops** rather than working on
the machine, the laptops must reach it and resolve its names, and the requests
of Part 1 come back in a cloud form:
- **A route and a firewall opening:** a private network or VPN between the
  laptops and the machine, or the provider's firewall opened on TCP 443 (and
  22 for SSH). Every tool the delegates work in asks for a login (their own
  password for the workspace, Gitea and Harbor; the shared read-only account
  `delegate`, printed on every access sheet, for Argo CD and Grafana), so 443
  may be open to the whole internet when delegates join from home or from
  several offices. Two things stay readable without a login then: the portal
  (its guest sign-in has no password; it shows the catalog of teams and
  services, and anyone can use "Register existing component" to add a catalog
  file by URL), and Prometheus and Alertmanager. If that is not acceptable,
  open 443 to the venue's public address only. Either way, put the laptops'
  address range in `pelab_training_subnets` (`0.0.0.0/0` for the whole
  internet) and keep 22 to your own address.
- **A wildcard DNS record** `*.<lab domain>` pointing at the address the laptops
  use: the provider's private DNS, the bank's DNS, or a public domain you
  control.
- **A certificate the laptops trust:** install `files/tls/ca.crt` on each
  laptop (Windows: double-click → Install Certificate → Local Machine →
  "Trusted Root Certification Authorities"; Mac: double-click → Keychain Access
  → open it → Trust → "Always Trust"; Firefox imports it under Authorities),
  or, with a public domain, use a free Let's Encrypt certificate (Part 5,
  item 5).
- **SSH by key only.** Cloud images already refuse passwords (check with
  `sudo sshd -T | grep -i passwordauthentication`); never give a delegate the
  admin key. Delegates have write access to their repositories and their
  pipelines run their code: that is by design, and it is contained to their
  team's Harbor project and a read-only cluster credential.
- **The laptops need only a browser** (Edge, Chrome, Firefox or Safari). SSH is
  optional; Windows 10/11 and macOS have it built in.

---

## Part 1. Two to four weeks before: ask for these

Send these requests early. Each one is a single sentence to the right team, but
some take weeks.

On a cloud machine you work on from inside, none of these is needed (see the
section above); items 2 to 8 come back only if delegates connect from their
own laptops.

| # | Ask for | From | Exactly what to ask |
| --- | --- | --- | --- |
| 1 | **The server** | Infrastructure | One physical or virtual server: 32 vCPU, 96 to 128 GB RAM, a 200 GB system disk and a second, empty 1 TB NVMe disk. Ubuntu Server 24.04 LTS. |
| 2 | **A fixed address** | Network | A static IPv4 address for the server on the training network. |
| 3 | **A wildcard DNS record** | Network / DNS | `*.<lab domain>` pointing at that address. Choose the lab domain now, for example `pelab.fmd.internal`. |
| 4 | **A certificate** | PKI / Security | A certificate for `*.<lab domain>` from the bank's internal CA, as PEM files: the certificate, its private key and the CA certificate. |
| 5 | **Trust on the thin clients** | Desktop support | Only if you cannot get item 4: push the lab's own CA certificate (`ca.crt`, made in Part 5) to the thin clients' trust store, so browsers do not warn. |
| 6 | **Firewall openings** | Network / Security | From the thin-client subnet to the server: TCP 22, 80 and 443. From the instructor's subnet to the server: TCP 22, 80, 443 and 6443. |
| 7 | **Internet for the server** | Network / Security | Direct outbound HTTPS from the server during the build. See the list below. |
| 8 | **Thin-client software** | Desktop support | A current Edge or Chrome, and the Windows OpenSSH client (built into Windows). Nothing else is installed on the thin clients. |

**What the build downloads** (for item 7):
- the Ubuntu archive and the Snap Store (LXD);
- GitHub releases (k3s, OpenTofu and the course tools);
- Helm chart repositories;
- container registries: Docker Hub, ghcr.io, quay.io and registry.k8s.io;
- the Python package index.

The lab has no proxy settings. If the server can only reach the internet through
a proxy, raise it now: that needs a change to the lab.

**Why each item matters.**
- **DNS (item 3):** every service is called `<name>.<lab domain>`, for example
  `gitea.pelab.fmd.internal`, and every workspace is `studentNN.<lab domain>`.
  Without the wildcard record nothing opens.
- **Trusted certificate (items 4 and 5):** the browser editor (code-server) and
  the portal only work properly when the browser trusts the certificate.
- **Second disk (item 1):** it holds the workspaces. With ZFS, resetting a
  workspace takes seconds.

---

## Part 2. Install Ubuntu on the server

Do this on the server's console, or ask Infrastructure to do it with these choices.

1. Boot the **Ubuntu Server 24.04 LTS** installer.
2. **Network:** set the static address from item 2, with the gateway and the
   bank's DNS servers.
   *You should see:* the interface shows the fixed address.
3. **Storage:** install on the **system disk only**. Leave the second disk
   untouched: no partitions, not mounted.
4. **Profile:** create the admin account `labadmin`. The lab expects this name;
   another name is fine, but then change `remote_user` in `ansible.cfg` in Part 5.
5. **SSH:** tick **Install OpenSSH server**.
6. **Featured snaps:** choose none. The build installs what it needs.
7. Finish, reboot, and log in as `labadmin`.
8. Bring the system up to date and restart:

   ```bash
   sudo apt update && sudo apt -y full-upgrade && sudo reboot
   ```

9. Log in again and write down the second disk's name:

   ```bash
   lsblk -d -o NAME,SIZE,TYPE,MOUNTPOINT
   ```

   *You should see:* two disks, for example `nvme0n1` (system, with partitions)
   and `nvme1n1` (1 TB, no mount point). Note the empty one: `/dev/nvme1n1`.

10. Check the server can reach the internet and resolve the lab names:

    ```bash
    curl -sI https://github.com | head -1
    getent hosts gitea.<lab domain>
    ```

    *You should see:* `HTTP/2 200`, then the server's own address.

---

## Part 3. Prepare the control machine

The **control machine** runs Ansible and sends the instructions to the server
over SSH. It keeps the lab's passwords and backups, so keep them **off** the
server. Any of these works:
- an Ubuntu laptop or VM;
- Windows with WSL (Ubuntu);
- a Mac;
- the lab server itself, when it is a cloud machine you work on from inside
  (see the note at the end of this part).

1. **Install Ansible.**

   On Ubuntu or WSL:

   ```bash
   sudo apt update && sudo apt install -y pipx git rsync openssh-client
   pipx install --include-deps ansible
   pipx inject ansible passlib bcrypt
   pipx ensurepath
   ```

   Close and reopen the terminal. On a Mac with Homebrew: `brew install ansible`
   (it already includes passlib and bcrypt, which hash the delegates' Argo CD
   password).

   *You should see:* `ansible --version` prints `ansible [core 2.17]` or later.

2. **Get the project** from the course repository. It is private: sign in once
   with `gh auth login` (GitHub CLI), or paste a fine-grained personal access
   token with read access when git asks for a password.

   ```bash
   git clone <repository URL> pe-lab
   cd pe-lab/pe-lab-ansible
   ansible-galaxy collection install -r requirements.yml
   ```

   *You should see:* the four collections installed, or "already installed".
   Later, `git pull` in that folder brings the latest lab and material.

3. **Create an SSH key** if you do not have one, and give it to the server:

   ```bash
   ssh-keygen -t ed25519
   ssh-copy-id labadmin@<server address>
   ssh labadmin@<server address> 'sudo -v && echo sudo works'
   ```

   Press Enter for the default file, and choose a passphrase. `ssh-copy-id` asks
   for labadmin's password once.

   *You should see:* `sudo works`, after a sudo password prompt.

4. **Sudo during the build.** Ansible needs sudo on the server. Choose one:
   - **Answer a prompt (default):** add `-K` to every `ansible-playbook` and
     `ansible` command in this guide and the run-book. Ansible asks for the sudo
     password once, at the start.
   - **No prompt:** allow labadmin to use sudo without a password on this
     dedicated lab server. Remove it after the course if your policy requires:

     ```bash
     ssh labadmin@<server address> \
       'echo "labadmin ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/labadmin && sudo chmod 440 /etc/sudoers.d/labadmin'
     ```

> **No second machine?** This is the usual case on a cloud machine you work on
> from inside. Run Ansible on the lab server itself:
> - Install Ansible there as in step 1, and clone the repository there (step 2).
> - In `inventory/hosts.yml`, add `ansible_connection: local` under `pelab01`,
>   and keep `ansible_host` as the machine's own private address.
> - Step 3 (the SSH key) is not needed; step 4 (sudo) still is.
>
> Two limits:
> - This way has not been rehearsed on a real server yet.
> - The passwords (`credentials/`) and the evening backups then sit on the server
>   they protect. Copy both to another machine every evening.

---

## Part 4. Before you configure: collect five values

| Value | Example | Where it comes from |
| --- | --- | --- |
| Server address | `10.20.30.40` | Part 1, item 2 |
| Lab domain | `pelab.fmd.internal` | Part 1, item 3 |
| Delegate subnet | `10.50.0.0/22` (bank network), or the venue's public address as `196.0.2.10/32` (cloud server) | Network team, or the venue |
| Instructor subnet | `10.60.1.0/24`, or your own public address as `/32` (cloud server) | Network team (where your control machine connects from), or https://ifconfig.me |
| Second disk | `/dev/nvme1n1` | Part 2, step 9 |

Also find out whether the bank has **internal NTP servers**. Ask the network
team if you do not know.

---

## Part 5. Configure the lab (five files)

All paths are inside `pe-lab-ansible/`. Every value you must change is marked
`PLACEHOLDER` in the files.

1. **`inventory/hosts.yml`**: the server's address.

   ```yaml
   pelab01:
     ansible_host: 10.20.30.40
   ```

2. **`ansible.cfg`**: only if your admin account is not `labadmin`, change
   `remote_user = labadmin`.

3. **`inventory/group_vars/pelab/main.yml`**: the lab's identity and network.

   ```yaml
   pelab_domain: pelab.fmd.internal
   pelab_ntp_servers:
     - ntp1.bank.internal          # or keep ntp.ubuntu.com if the server can reach it
   pelab_training_subnets:
     - 10.50.0.0/22                # the delegates (cloud server: the venue's public address, /32)
   pelab_admin_subnets:
     - 10.60.1.0/24                # the instructors and the control machine
   ```

   Leave the cohort at its defaults: 25 delegates in 5 teams, 2 spare workspaces
   (student26, student27) and 5 runners. Change `pelab_cohort_size` and
   `pelab_team_count` only if the cohort is a different size.

   For your own live demos, give the second spare a team, so the handbook's
   commands work in it too:

   ```yaml
   pelab_spare_team_assignments:
     student27: team01
   ```

   **Team logins** are shared by default (`pelab_shared_logins: true`): every
   access sheet, and `/etc/pelab/logins.md` in every workspace, lists the logins
   of the delegate's whole team and of `platform-approver`, the platform team's
   login for delegates. Delegates then sign in as a teammate, in a private
   window, to approve when the teammate is away, and teams can approve their own
   environment and exception requests as the platform team. Set it to `false`
   if each delegate must see only their own login and only you may approve
   platform requests.

4. **The second disk.** Add this line at the end of
   `inventory/group_vars/pelab/main.yml` (use your disk's name):

   ```yaml
   lxd_storage_source: /dev/nvme1n1
   ```

   The build creates the ZFS pool on that disk. **Everything on it is erased.**
   Without the line, the lab uses a 600 GB file on the system disk instead, which
   is slower and needs the space.

5. **The certificate.** Choose one:
   - **The bank's certificate (recommended).** Copy three PEM files into
     `files/tls/`:
     - `wildcard.crt`: the certificate, followed by any intermediate certificates;
     - `wildcard.key`: its private key;
     - `ca.crt`: the issuing CA.
   - **A free Let's Encrypt certificate (recommended for a cloud server with a
     public domain).** On the control machine, with the domain's DNS settings
     at hand:

     ```bash
     sudo apt install -y certbot        # Mac: brew install certbot
     sudo certbot certonly --manual --preferred-challenges dns \
       -d '*.pelab.example.com' -d 'pelab.example.com' --agree-tos -m you@example.com
     ```

     certbot shows a `_acme-challenge.pelab.example.com` TXT record to create
     at the DNS provider. Create it, wait a minute, press Enter. Then copy the
     files (the CA is Let's Encrypt's root):

     ```bash
     sudo cp /etc/letsencrypt/live/pelab.example.com/fullchain.pem files/tls/wildcard.crt
     sudo cp /etc/letsencrypt/live/pelab.example.com/privkey.pem files/tls/wildcard.key
     curl -fsSo files/tls/ca.crt https://letsencrypt.org/certs/isrgrootx1.pem
     sudo chown "$USER" files/tls/wildcard.crt files/tls/wildcard.key
     ```

     The certificate lasts 90 days: long enough for the course (repeat the
     commands and rebuild `host_base` if the lab lives longer). Every browser
     trusts it, so nothing is installed on the delegates' laptops.
   - **The lab's own CA (dry runs, or when desktop support will push the CA).**
     In `main.yml` set:

     ```yaml
     pelab_tls_generate_selfsigned: true
     ```

     The build then creates `files/tls/ca.crt` and the certificate. Send
     `ca.crt` to desktop support for the thin clients (Part 1, item 5).

6. **Optional settings.**
   - A Docker Hub account raises the image download limits. Put it in
     `inventory/group_vars/pelab/secrets.yml` as `pelab_dockerhub_username` and
     `pelab_dockerhub_token`.
   - Delegates' own SSH keys: drop each one into `files/ssh-keys/` as
     `studentNN.pub`. Without them the build makes keys for everyone.

**Check your work.** Run these from `pe-lab-ansible/`:

```bash
ansible-playbook --syntax-check site.yml
ansible pelab -m ping
```

*You should see:*
- `playbook: site.yml`, with no errors;
- `pelab01 | SUCCESS` and `"ping": "pong"`.

If the ping fails, fix SSH (Part 3) first. Add `-K` if you chose the sudo prompt.

---

## Part 6. Build the lab

1. Use a terminal that will not close.
   - **On a laptop:** stop it sleeping, or run the build inside `tmux`
     (`sudo apt install tmux`, then `tmux`). If the terminal drops, reconnect
     with `tmux attach`.
   - **The build is safe to run again:** if anything stops it, run the same
     command and it carries on.
2. Start the build:

   ```bash
   cd pe-lab-ansible
   ansible-playbook site.yml
   ```

3. Watch it work. Each line `TASK [role : what it does]` is one step. They come
   in this order:

   | Part | What it does | Notes |
   | --- | --- | --- |
   | `host_base` | Updates, time, firewall, the certificate | Quick |
   | `lxd` | LXD and the ZFS pool, then **builds the workspace image** with every course tool | One of the slow parts. Long quiet stretches are normal |
   | `k3s` | Kubernetes | A few minutes |
   | `platform` | Installs Gitea, Harbor, Argo CD, Kyverno, monitoring and the portal | The other slow part: many container images |
   | `workspaces` | Creates student01 to student27, each with a browser editor | |
   | `runners` | Creates runner01 to runner05 for the pipelines | |
   | `teams` | Each team's `dev` namespace, access rights and budgets | |
   | `golden_path` | Accounts, the template, the five `hello` services, the first pipeline runs, Argo CD, the guardrails, the portal and the platform applier | |
   | `backup` | The nightly backup | Quick |

4. The build ends with `PLAY RECAP`.

   *You should see:* `pelab01 : ok=… changed=… failed=0`.

5. **If it stops with a red `fatal:` line:**
   - Read the `msg:` under it. Most messages name the cause.
   - Fix the cause (see [When the build fails](#when-the-build-fails) below).
   - Run `ansible-playbook site.yml` again. Completed parts are skipped quickly.

---

## Part 7. After the build: the files you now have

The build wrote these on the control machine, in `pe-lab-ansible/credentials/`.
**They are the keys to the lab:** keep the folder private and never commit it.

| File | What it is | What you do with it |
| --- | --- | --- |
| `platform.md` | Every address, and the instructor logins | Open it now and keep it handy |
| `access/student01.md` … `student27.md` | One page per delegate: user name, team, password, the team's logins (with `platform-approver`), addresses, SSH set-up | Print them, one per delegate. Keep the spares' pages aside |
| `access/all-logins.md` | Every delegate's login, by team, and the shared logins | Keep it with you: for a lost sheet or a team change |
| `gitea-admin.txt` | Password of `pelab-admin`, which approves environment and exception requests (with `platform-approver`) | You use it on Days 3 and 5 |
| `harbor-admin.txt`, `grafana-admin.txt` | Admin passwords | Rarely needed |
| `delegate-viewer.txt`, `delegate-viewer-salt.txt` | The shared read-only login `delegate` for Argo CD and Grafana: its random part, and the salt of the hash Argo CD stores | Nothing: the full password is on every access sheet and in `platform.md` |
| `ssh/` | SSH keys made for the delegates | Only if delegates use SSH (optional; the browser workspace covers the whole course) |

---

## Part 8. Check the lab, step by step

Do these from a **delegate's machine** (a thin client, or a Windows or Mac laptop
at the venue), as a delegate would.
Use `student01`'s access sheet. Tick each step off.

1. **The portal.** Open `https://backstage.<lab domain>` and sign in as guest.
   *You should see:* the catalog lists five `hello` services, one per team.
   There is no certificate warning.
2. **A workspace.** Open `https://student01.<lab domain>` with student01's
   password.
   *You should see:* an editor (code-server) with a terminal at the bottom.
3. **The workspace knows who you are.** In that terminal:

   ```bash
   echo "$ME $TEAM $DOMAIN"
   ```

   *You should see:* `student01 team01 <lab domain>`.
4. **Git.** In the terminal:

   ```bash
   git clone https://gitea.$DOMAIN/$TEAM/hello && ls hello
   ```

   Enter student01 and their password when asked.
   *You should see:* `app`, `deploy`, `tests`, `Dockerfile` and more.
5. **Kubernetes access.**

   ```bash
   kubectl get pods
   ```

   *You should see:* one `hello-…` pod, `Running`, in team01's dev namespace.
6. **The service.** Open `https://hello-team01-dev.<lab domain>/`.
   *You should see:* JSON with `"environment": "dev"`.
7. **Pipelines.** In Gitea (`https://gitea.<lab domain>`, signed in as
   student01), open `team01/hello` → **Actions**.
   *You should see:* one green run.
8. **Images.** Open `https://harbor.<lab domain>`, sign in as student01, and
   open project `team01`.
   *You should see:* `hello` with an image tagged with a 40-character commit id,
   scanned, with an SBOM.
9. **Deployments.** Open `https://argocd.<lab domain>` and sign in as
   `delegate` with the shared password on the access sheet.
   *You should see:* `team01-hello-dev` **Synced** and **Healthy**. The
   staging and prod applications say "Retrying": that is expected until the
   teams request their environments on Day 3.
10. **Dashboards.** Open `https://grafana.<lab domain>`, sign in as `delegate`
    (the same password) → Dashboards → PE Lab → Golden path. Pick team01.
    *You should see:* the version table shows dev with its tag.

**Then on the lab server** (`ssh labadmin@<server address>`):

```bash
systemctl list-timers 'pelab-*'
sudo journalctl -u pelab-platform-apply.service -n 20 --no-pager
sudo lxc list -c ns4 | head
sudo k3s kubectl get pods -A | grep -v -E 'Running|Completed'
```

*You should see:*
- two timers: `pelab-platform-apply` every two minutes, and the nightly
  `pelab-backup`;
- the applier's lines `environments …: Up to date` and `policies …: 3 policies,
  0 exceptions in force`;
- the containers `RUNNING`;
- only the header line from the last command (every pod running).

Repeat steps 1 and 2 with one more delegate from another team. If all of this
works, the lab is ready.

---

## Part 9. Rehearse (the week before)

The rehearsal is the most valuable day of preparation. Do every lab of the six
days from a delegate's machine, following the [handbook](../../pe-lab-ansible/roles/golden_path/files/handbook/README.md)
exactly. Use one delegate account per team, and the instructor account where a
lab needs it. Then work through the checklist at the end of the
[run-book](run-book.md#before-the-course-rehearsal-checklist).

Also rehearse these three things once:

1. **The safety net.** Switch it on, check that a merge still reaches dev, and
   switch it off. It takes five minutes: [safety-net.md](safety-net.md).
2. **A backup** to the control machine (`ansible-playbook backup.yml`), and look
   at the copy in `backups/`.
3. **A reset** (`ansible-playbook reset.yml`). Record how long it takes, and
   check Part 8 again afterwards.

---

## Part 10. During the course week

| When | What | Command or place |
| --- | --- | --- |
| Every morning, 30 minutes before start | The checks in Part 8, steps 1, 2, 6 and 9, plus the server checks | |
| During the labs | Common fixes | [run-book](run-book.md#during-the-labs-common-fixes) |
| If Argo CD gives trouble | Switch on the safety net | [safety-net.md](safety-net.md) |
| Every evening | Copy the backup to the control machine | `ansible-playbook backup.yml` |
| End of each lab | Remind teams to push their work: anything only in a workspace is not backed up | |

## Part 11. After the course

| What | Command |
| --- | --- |
| Same cohort again: clean workspaces, rebuilt environments | `ansible-playbook reset.yml` |
| New cohort: new passwords, accounts and repositories | `ansible-playbook reset.yml -e reset_rotate_credentials=true`, then print the new access sheets |
| Remove the lab from the server | `ansible-playbook teardown.yml -e pelab_teardown_confirm=<lab domain>` |

---

## When the build fails

| What you see | Likely cause | What to do |
| --- | --- | --- |
| `UNREACHABLE` | SSH from the control machine does not work | Check `ssh labadmin@<server address>` works. Check `ansible_host` in `inventory/hosts.yml` |
| `Missing sudo password` or `a password is required` | Sudo needs a password | Add `-K`, or set up sudo as in Part 3, step 4 |
| A TLS file is missing | `files/tls/` lacks a file | Copy the three files (Part 5, step 5), or set `pelab_tls_generate_selfsigned: true` |
| Downloads time out, or `Could not resolve host` | The server has no internet, or a firewall or proxy blocks it | Test on the server: `curl -sI https://github.com`. Ask the network team for item 7 |
| `toomanyrequests` from Docker Hub | Docker Hub's anonymous download limit | Add a Docker Hub account (Part 5, step 6) and run again |
| The ZFS pool cannot be created | The second disk has partitions, or is in use | Check `lsblk`. The disk must be empty and not mounted. Ask Infrastructure before wiping anything |
| `Could not get lock /var/lib/dpkg/lock` | Ubuntu is updating itself in the background | Wait five minutes and run again |
| Disk full | The system disk is too small | `df -h` on the server. Give the server more disk, or a second disk for ZFS |
| The applier fails at the end (its log is shown) | Usually Gitea or the cluster was still starting | Run `ansible-playbook site.yml --tags golden_path` |
| Anything else | | Copy the whole red block and the task name above it. Run again once: most passing problems (a slow download) clear on the second run |

Running only one part after a fix is faster. Use the part's name as a tag, for
example `ansible-playbook site.yml --tags golden_path`. The tags are the part
names in Part 6.
