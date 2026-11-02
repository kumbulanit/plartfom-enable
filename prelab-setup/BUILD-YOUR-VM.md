# Build the lab on your own VM

> If the instructor gave you a VM that already has the lab (a clone of theirs),
> skip to Step 6.

You have a virtual machine (VM) of your own. In this guide you install the whole
course platform on it, with one command. Ansible (the build tool) runs **on your
VM itself**: it builds everything there, and it writes your passwords there.
Nobody else's passwords are on your VM, and yours are on no one else's.

Allow about two hours. Most of that time is waiting, and you can leave it running.

Every command below is typed in a terminal **on your VM**. Copy and paste it,
then press Enter.

---

## Step 1. Check your VM

```bash
lsb_release -ds; nproc; free -h | awk '/Mem/ {print $2}'; df -h / | awk 'NR==2 {print $2}'
```

*You should see* four lines, close to:

```
Ubuntu 24.04.3 LTS
8
22Gi
97G
```

That is Ubuntu 24.04, 8 processors, about 23 GB of memory and about 100 GB of
disk. If yours is much smaller, tell the instructor before you go on.

## Step 2. Get the course project

The instructor gives you the repository address.

```bash
sudo apt update && sudo apt install -y git
git clone <repository address> ~/sarb
```

`sudo` asks for your password on the VM.

*You should see:* `Cloning into '/home/<you>/sarb'...` and no error.

## Step 3. Install the prerequisites

One script installs everything the build needs: pipx, git, tmux, Ansible (with
passlib and bcrypt) and Ansible's collections. You can run it again safely.

```bash
bash ~/sarb/prelab-setup/install-prerequisites.sh
```

*You should see* at the end: `All prerequisites are installed.` Then **close the
terminal and open a new one**, so it finds Ansible: `ansible --version` prints
`ansible [core 2.17]` or a later number.

You change no settings: the project is already set up for one person on their
own VM.

<details><summary>The same, by hand (if the script stops)</summary>

```bash
sudo apt update && sudo apt install -y pipx git tmux
pipx install --include-deps ansible
pipx inject ansible passlib bcrypt
pipx ensurepath
```

Close the terminal and open a new one, then:

```bash
cd ~/sarb/prelab-setup
ansible-galaxy collection install -r requirements.yml
```

</details>

## Step 4. Start the build

Start `tmux` first. If your connection drops, the build keeps running, and
`tmux attach` brings it back.

```bash
tmux
cd ~/sarb/prelab-setup
ansible-playbook site.yml -K
```

`-K` makes Ansible ask for your sudo password once (`BECOME password:`). Type
the password you use for `sudo`.

*Or, in one command:* `bash ~/sarb/prelab-setup/install-prerequisites.sh --build`
starts tmux and the build for you (`tmux attach -t build` brings it back after a
dropped connection).

Now wait. Each line `TASK [...]` is one step. Two parts are slow, with long quiet
stretches: building the workspace image (`lxd`), and installing the platform
(`platform`).

**If it stops and says "The updates need a restart":** that is expected on a new
VM. Run `sudo reboot`, wait a minute, sign in again, and run the same commands
from Step 4 again. The build carries on where it stopped.

**If it stops with a red `fatal:` line:** run the same `ansible-playbook` command
once more; it carries on. If it stops in the same place again, show the
instructor the red lines.

*You should see* at the end, under `PLAY RECAP`:

```
pelab01 : ok=… changed=… unreachable=0 failed=0 …
```

`failed=0` is what matters.

## Step 5. Check that everything is running

One script checks the whole lab: the VM, Kubernetes, every platform service and
web address, the workspace and runner, Gitea, Harbor, Argo CD, the guardrails
and the hello app. It changes nothing.

```bash
bash ~/sarb/prelab-setup/check-lab.sh
```

*You should see* a line per check (PASS, WARN or FAIL) and at the end
`0 failed` and "The lab is ready.". Each FAIL says what to do. Parts that were
still starting are often fine two minutes later: run the check again first.

The same by hand, for the two most important parts:

```bash
sudo k3s kubectl get pods -A | grep -vE 'Running|Completed'
```

*You should see* only the heading line (`NAMESPACE NAME READY STATUS ...`): every
part of the platform is running. If other lines show, wait two minutes and run
it again; parts that were still starting will be `Running` by then.

```bash
sudo lxc list -c ns
```

*You should see* `student01` (your workspace) and `runner01` (it runs your
pipelines), both `RUNNING`.

## Step 6. Trust your lab's certificate in the browser

Your lab made its own certificate, so the browser on your VM needs to trust it
once. The file is `~/sarb/prelab-setup/files/tls/ca.crt`.

- **Firefox:** Settings → Privacy & Security → Certificates → View Certificates
  → Authorities → Import, choose the file, tick "Trust this CA to identify
  websites", OK.
- **Chrome or Chromium:**

  ```bash
  sudo apt install -y libnss3-tools
  certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n pelab-ca -i ~/sarb/prelab-setup/files/tls/ca.crt
  ```

  Then close and reopen the browser.

## Step 7. Open your logins and your workspace

```bash
cat /etc/pelab/logins.md
```

*You should see* "Your lab logins": a table with your user (`student01`) and its
password, the `reviewer` and `platform-approver` logins, the read-only
`delegate` login, and the addresses of every tool.

Open the first address, "Your workspace", in the browser on your VM, and sign
in as `student01`. You are ready for Day 1.

---

## About the passwords

Every participant's lab has the same passwords: they come from the course
project (`files/passwords/`), so the instructor can help you on your machine
without asking for yours. In the labs you sign in only with the logins in
`/etc/pelab/logins.md`. They are lab-only passwords: never use them for anything
else.
