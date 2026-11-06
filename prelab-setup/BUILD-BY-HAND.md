# Build the lab by hand

This page builds the same lab as `ansible-playbook site.yml`, one command at a
time, with no Ansible. Use it to see what the build really does, and to see
how much time automation saves. You don't need it to run the course: the
normal way is [BUILD-YOUR-VM.md](BUILD-YOUR-VM.md).

> Every step below is something the Ansible roles in `roles/` do. Each part
> names its role, so you can compare the commands with the code.

---

## By hand or with Ansible: the time it takes

The "by hand" times are **estimates** for an engineer who knows Linux and
Kubernetes, typing carefully and reading each output. They leave out waiting
for downloads, which costs the same both ways. Add time for typing mistakes:
a wrong value in a YAML file usually costs more time to find than to type.

| Part | Ansible role | By hand (your time) | With Ansible (your time) |
| --- | --- | --- | --- |
| 1. Prepare the host | `host_base` | 45 min | 0 |
| 2. LXD and DNS | `lxd` | 30 min | 0 |
| 3. Workspace image | `lxd` (image) | 1 h 30 min | 0 |
| 4. Kubernetes (k3s) | `k3s` | 30 min | 0 |
| 5. Platform services | `platform` | 2 h 30 min | 0 |
| 6. Your workspace | `workspaces` | 45 min | 0 |
| 7. The pipeline runner | `runners` | 30 min | 0 |
| 8. Team namespaces | `teams` | 30 min | 0 |
| 9. Golden path | `golden_path` | 4 to 6 h | 0 |
| 10. Backups | `backup` | 20 min | 0 |
| 11. Check | `check-lab.sh` | 15 min | 1 min |
| **Total** | | **about 2 working days** | **about 5 min typing, 2 h unattended** |

What the table doesn't show:

- **The second VM.** By hand, each VM costs the same 2 days again. With
  Ansible each VM costs the same 5 minutes, and 27 VMs can build at once.
- **Running it again.** Ansible checks every step and changes only what is
  wrong, so a rerun repairs a broken lab. By hand you have to work out which
  step broke.
- **Every VM is the same.** By hand, two people never type exactly the same
  thing. With Ansible every lab has the same versions, names and settings,
  which is what makes support possible.
- **The record.** The roles are the documentation: they are always up to
  date, because they are what actually ran.

---

## The settings this page uses

These are the lab's defaults, from `inventory/group_vars/pelab/main.yml`.
Change them in every command if your lab uses other values.

| Setting | Value |
| --- | --- |
| Lab domain | `pelab.example.internal` |
| LXD bridge, its address | `lxdbr0`, `10.120.0.1/24` |
| Workspace address | `10.120.0.101` (`student01`) |
| Runner address | `10.120.0.11` (`runner01`) |
| Pod and service networks | `10.42.0.0/16`, `10.43.0.0/16` |
| Lab files on the host | `/opt/pelab` |
| TLS secret name in Kubernetes | `pelab-wildcard-tls` |
| Team, participant | `team01`, `student01` (account id 2000 in the workspace) |

Passwords: this page writes `<GITEA_ADMIN_PASSWORD>` and similar. Make up your
own (at least 16 letters and digits) and keep them in a file only you can read.
Harbor needs upper case, lower case and a digit; SonarQube also a symbol.

---

## The versions

Every version the lab pins, from `inventory/group_vars/pelab/versions.yml`
(checked against the upstream release pages on 2026-10-18).

**On the host**

| Software | Version |
| --- | --- |
| Ubuntu | 22.04 LTS or later (24.04 recommended) |
| LXD | snap channel `5.21/stable` (LTS) |
| k3s | `v1.36.5+k3s1` (brings its own Traefik) |
| Helm | `4.3.1` |
| OpenTofu | `1.13.1` (for the platform applier) |

**In the workspace image** (Ubuntu 24.04, also used by the runner)

| Software | Version |
| --- | --- |
| Docker Engine | `29.9.1` (docker-ce for noble) |
| kubectl | `1.36.5` |
| Helm | `4.3.1` |
| k9s | `0.51.0` |
| Argo CD CLI | `3.5.5` |
| OpenTofu | `1.13.1`, providers hashicorp/kubernetes `3.4.0`, hashicorp/local `2.9.1` |
| Ansible | `14.5.0` (ansible-core 2.21) |
| pytest, ruff | `9.1.1`, `0.17.1` |
| Trivy, Gitleaks, Semgrep, Checkov | `0.76.0`, `8.30.1`, `1.181.0`, `3.3.29` |
| cosign, Kyverno CLI | `3.1.3`, `1.19.1` |
| hadolint, k6, oasdiff | `2.15.1`, `2.3.0`, `1.33.0` |
| code-server | `4.141.0` |
| Gitea Actions runner | `5.1.1` |

**Helm charts** (chart version, then the application version it installs)

| Release | Chart | Chart version | App version |
| --- | --- | --- | --- |
| kube-prometheus-stack | prometheus-community/kube-prometheus-stack | `92.10.1` | `v0.94.1` |
| kyverno | kyverno/kyverno | `3.9.1` | `v1.19.1` |
| gitea | gitea-charts/gitea | `12.7.0` | `1.27.0` |
| harbor | harbor/harbor | `1.19.4` | `2.15.4` |
| argo-cd | argo/argo-cd | `10.10.5` | `v3.5.5` |
| loki | grafana-community/loki | `18.17.1` | `3.7.8` |
| alloy | grafana/alloy | `1.13.1` | `v1.20.1` |
| backstage | backstage/backstage | `2.10.2` | image `1.55.2` |

Optional extras (only when listed in `pelab_extras`): keycloak
codecentric/keycloakx `7.4.0`, sonarqube `2026.5.1002`, argo-rollouts
`2.43.8`, jaeger `4.16.1`, redpanda `26.2.4`, apisix `2.18.2`, opencost
`2.5.33`. This page installs only the core.

---

## Part 1. Prepare the host (`host_base`)

Every command in Parts 1 to 10 runs on the VM, as your own user, unless it
says otherwise.

**1.1 Update and install the base packages.**

```bash
sudo apt-get update
sudo apt-get -y dist-upgrade
sudo apt-get -y autoremove
sudo apt-get install -y ca-certificates chrony curl git htop jq openssl \
  python3-pip python3-venv rsync snapd sqlite3 tmux ufw unzip xz-utils zfsutils-linux
```

If `/var/run/reboot-required` exists, run `sudo reboot` and sign in again.

**1.2 Kernel settings.** These are for SonarQube and OpenSearch, file
watchers in many containers, Redpanda, and LXD.

```bash
sudo tee /etc/sysctl.d/90-pelab.conf >/dev/null <<'EOF'
vm.max_map_count = 524288
fs.inotify.max_user_instances = 8192
fs.inotify.max_user_watches = 524288
fs.inotify.max_queued_events = 1048576
fs.aio-max-nr = 1048576
kernel.keys.maxkeys = 2000
kernel.keys.maxbytes = 2000000
net.ipv4.ip_forward = 1
net.ipv4.neigh.default.gc_thresh3 = 8192
EOF
sudo sysctl --system
```

**1.3 Keep ZFS's cache to an eighth of the memory** (ZFS takes up to half by
default, which the platform needs).

```bash
ARC=$(( $(awk '/MemTotal/ {print $2}' /proc/meminfo) * 1024 / 8 ))
echo "options zfs zfs_arc_max=$ARC" | sudo tee /etc/modprobe.d/90-pelab-zfs.conf
[ -f /sys/module/zfs/parameters/zfs_arc_max ] && echo "$ARC" | sudo tee /sys/module/zfs/parameters/zfs_arc_max
```

**1.4 Open-file limits** for sessions and services.

```bash
sudo tee /etc/security/limits.d/90-pelab-nofile.conf >/dev/null <<'EOF'
*     soft  nofile  1048576
*     hard  nofile  1048576
root  soft  nofile  1048576
root  hard  nofile  1048576
EOF
for d in system user; do
  sudo mkdir -p /etc/systemd/$d.conf.d
  printf '[Manager]\nDefaultLimitNOFILE=1048576:1048576\n' | sudo tee /etc/systemd/$d.conf.d/90-pelab-limits.conf
done
sudo systemctl daemon-reexec
```

**1.5 Time.**

```bash
sudo timedatectl set-timezone Africa/Johannesburg
sudo systemctl enable --now chrony
```

**1.6 Firewall.** Containers and pods must reach the host; everything else
coming in is closed. Add your own subnet for SSH and HTTPS if people reach the
lab from other machines.

```bash
sudo ufw allow in on lxdbr0 comment 'pelab lxd bridge'
sudo ufw route allow in on lxdbr0 comment 'pelab lxd routing'
sudo ufw route allow out on lxdbr0 comment 'pelab lxd routing'
sudo ufw allow from 10.42.0.0/16 comment 'pelab k3s'
sudo ufw allow from 10.43.0.0/16 comment 'pelab k3s'
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw default deny routed
sudo ufw --force enable
```

If you are connected over SSH, first run `sudo ufw allow from <your address> to any port 22`,
or the last command locks you out.

**1.7 A lab certificate authority (CA) and a wildcard certificate** for
`*.pelab.example.internal`. (The course project already has these in
`files/tls/`; this is how they are made.)

```bash
mkdir -p ~/pelab-tls && cd ~/pelab-tls
openssl ecparam -name secp384r1 -genkey -noout -out ca.key
openssl req -x509 -new -key ca.key -sha256 -days 3650 -out ca.crt \
  -subj "/O=PE Lab (training use only)/CN=PE Lab CA (pelab.example.internal)" \
  -addext "basicConstraints=critical,CA:TRUE" -addext "keyUsage=critical,keyCertSign,cRLSign"
openssl genrsa -out wildcard.key 2048
openssl req -new -key wildcard.key -out wildcard.csr -subj "/CN=*.pelab.example.internal"
openssl x509 -req -in wildcard.csr -CA ca.crt -CAkey ca.key -CAcreateserial -days 825 -sha256 \
  -out wildcard.crt -extfile <(printf 'subjectAltName=DNS:*.pelab.example.internal,DNS:pelab.example.internal\nextendedKeyUsage=serverAuth')
openssl x509 -in wildcard.crt -noout -checkhost gitea.pelab.example.internal
```

The last line must say `does match`. Install them on the host and trust the CA:

```bash
sudo install -d -m 0750 /etc/pelab/tls
sudo install -m 0644 wildcard.crt /etc/pelab/tls/tls.crt
sudo install -m 0600 wildcard.key /etc/pelab/tls/tls.key
sudo install -m 0644 ca.crt /etc/pelab/tls/ca.crt
sudo install -m 0644 ca.crt /usr/local/share/ca-certificates/pelab-lab-ca.crt
sudo update-ca-certificates
```

---

## Part 2. LXD and the lab's names (`lxd`)

**2.1 Install LXD 5.21 and stop it updating itself in the middle of a course day.**

```bash
sudo snap install lxd --channel=5.21/stable
sudo snap refresh --hold=forever lxd
sudo lxd waitready --timeout=300
```

**2.2 Set LXD up:** a ZFS storage pool of 40 GiB (one workspace and one runner,
20 GiB each), the bridge `lxdbr0` with its own network, and a DNS rule that
sends every lab name to the host, where Traefik will answer.

```bash
cat <<'EOF' | sudo lxd init --preseed
config:
  images.auto_update_interval: "0"
networks:
  - name: lxdbr0
    type: bridge
    config:
      ipv4.address: 10.120.0.1/24
      ipv4.nat: "true"
      ipv4.dhcp.ranges: 10.120.0.200-10.120.0.250
      ipv6.address: none
      dns.domain: lxd
      raw.dnsmasq: address=/pelab.example.internal/10.120.0.1
storage_pools:
  - name: default
    driver: zfs
    config:
      size: 40GiB
profiles:
  - name: default
    devices:
      root: {path: /, pool: default, type: disk}
      eth0: {name: eth0, network: lxdbr0, type: nic}
EOF
```

**2.3 Let the host resolve the lab names too.** systemd-resolved sends
`*.lxd` and `*.pelab.example.internal` to LXD's DNS on the bridge.

```bash
sudo tee /etc/systemd/system/pelab-lxd-dns.service >/dev/null <<'EOF'
[Unit]
Description=Per-link DNS for lxdbr0 (LXD containers and lab domain)
BindsTo=sys-subsystem-net-devices-lxdbr0.device
After=sys-subsystem-net-devices-lxdbr0.device

[Service]
Type=oneshot
ExecStart=/usr/bin/resolvectl dns lxdbr0 10.120.0.1
ExecStart=/usr/bin/resolvectl domain lxdbr0 ~lxd ~pelab.example.internal
ExecStopPost=/usr/bin/resolvectl revert lxdbr0
RemainAfterExit=yes

[Install]
WantedBy=sys-subsystem-net-devices-lxdbr0.device
EOF
sudo systemctl daemon-reload
sudo systemctl enable --now pelab-lxd-dns.service
```

That rule only works if programs ask systemd-resolved. Check:

```bash
ls -l /etc/resolv.conf
```

If it points to `/run/systemd/resolve/resolv.conf`, programs skip
systemd-resolved: point it at the stub instead.

```bash
sudo ln -sf ../run/systemd/resolve/stub-resolv.conf /etc/resolv.conf
```

The names work once Traefik runs (Part 4): `getent hosts gitea.pelab.example.internal`
prints `10.120.0.1`.

---

## Part 3. The workspace image (`lxd`, image)

The workspace and the runner both start from one image with every course tool
in it. You build it once in a temporary container, then publish it.

**3.1 Start a builder container from Ubuntu 24.04.**

```bash
sudo lxc launch ubuntu:24.04 pelab-image-builder \
  -c security.nesting=true -c security.syscalls.intercept.mknod=true -c security.syscalls.intercept.setxattr=true
sudo lxc exec pelab-image-builder -- cloud-init status --wait
sudo lxc file push /etc/pelab/tls/ca.crt pelab-image-builder/usr/local/share/ca-certificates/pelab-lab-ca.crt
sudo lxc exec pelab-image-builder -- bash
```

Everything in 3.2 to 3.8 runs **inside** the builder (the prompt shows
`root@pelab-image-builder`).

**3.2 Base packages and the lab CA.**

```bash
export DEBIAN_FRONTEND=noninteractive
apt-get update && apt-get -y dist-upgrade
apt-get install -y --no-install-recommends bash-completion build-essential ca-certificates curl \
  dnsutils git gnupg iputils-ping jq less make nano netcat-openbsd openssh-server pipx python3 \
  python3-dev python3-pip python3-venv python3-yaml sudo tmux unzip vim wget xz-utils
update-ca-certificates
python3 --version    # Python 3.12.x
```

**3.3 Docker Engine 29.9.1.**

```bash
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
cat > /etc/apt/sources.list.d/docker.sources <<'EOF'
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: noble
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF
apt-get update
V="5:29.9.1-1~ubuntu.24.04~noble"
apt-get install -y "docker-ce=$V" "docker-ce-cli=$V" containerd.io docker-buildx-plugin docker-compose-plugin
apt-mark hold docker-ce docker-ce-cli
install -m 0755 -d /etc/docker
cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {"max-size": "10m", "max-file": "3"}
}
EOF
systemctl enable docker.service containerd.service
```

**3.4 The command-line tools**, each a fixed version. Check each download
against its project's checksum file (shown for kubectl; the others publish
theirs next to the download).

```bash
cd /tmp
GH=https://github.com
# kubectl 1.36.5
curl -fLO https://dl.k8s.io/release/v1.36.5/bin/linux/amd64/kubectl
echo "$(curl -fsL https://dl.k8s.io/release/v1.36.5/bin/linux/amd64/kubectl.sha256)  kubectl" | sha256sum -c
install -m 0755 kubectl /usr/local/bin/kubectl
# Helm 4.3.1
curl -fL https://get.helm.sh/helm-v4.3.1-linux-amd64.tar.gz | tar xz && install -m 0755 linux-amd64/helm /usr/local/bin/
# k9s 0.51.0
curl -fL $GH/derailed/k9s/releases/download/v0.51.0/k9s_Linux_amd64.tar.gz | tar xz k9s && install -m 0755 k9s /usr/local/bin/
# Argo CD CLI 3.5.5
curl -fLo /usr/local/bin/argocd $GH/argoproj/argo-cd/releases/download/v3.5.5/argocd-linux-amd64 && chmod 0755 /usr/local/bin/argocd
# OpenTofu 1.13.1
curl -fL $GH/opentofu/opentofu/releases/download/v1.13.1/tofu_1.13.1_linux_amd64.tar.gz | tar xz tofu && install -m 0755 tofu /usr/local/bin/
# Gitleaks 8.30.1
curl -fL $GH/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_linux_x64.tar.gz | tar xz gitleaks && install -m 0755 gitleaks /usr/local/bin/
# cosign 3.1.3
curl -fLo /usr/local/bin/cosign $GH/sigstore/cosign/releases/download/v3.1.3/cosign-linux-amd64 && chmod 0755 /usr/local/bin/cosign
# Kyverno CLI 1.19.1
curl -fL $GH/kyverno/kyverno/releases/download/v1.19.1/kyverno-cli_v1.19.1_linux_x86_64.tar.gz | tar xz kyverno && install -m 0755 kyverno /usr/local/bin/
# hadolint 2.15.1
curl -fLo /usr/local/bin/hadolint $GH/hadolint/hadolint/releases/download/v2.15.1/hadolint-linux-x86_64 && chmod 0755 /usr/local/bin/hadolint
# oasdiff 1.33.0
curl -fL $GH/oasdiff/oasdiff/releases/download/v1.33.0/oasdiff_1.33.0_linux_amd64.tar.gz | tar xz oasdiff && install -m 0755 oasdiff /usr/local/bin/
# Trivy 0.76.0, k6 2.3.0, code-server 4.141.0 (Debian packages)
curl -fLO $GH/aquasecurity/trivy/releases/download/v0.76.0/trivy_0.76.0_Linux-64bit.deb
curl -fLO $GH/grafana/k6/releases/download/v2.3.0/k6-v2.3.0-linux-amd64.deb
curl -fLO $GH/coder/code-server/releases/download/v4.141.0/code-server_4.141.0_amd64.deb
apt-get install -y ./trivy_0.76.0_Linux-64bit.deb ./k6-v2.3.0-linux-amd64.deb ./code-server_4.141.0_amd64.deb
# Gitea Actions runner 5.1.1
curl -fL https://dl.gitea.com/gitea-runner/5.1.1/gitea-runner-5.1.1-linux-amd64.xz | xz -dc > /usr/local/bin/gitea-runner
chmod 0755 /usr/local/bin/gitea-runner
```

**3.5 OpenTofu providers, mirrored inside the image**, so `tofu init` works
without the internet.

```bash
mkdir -p /tmp/providers && cd /tmp/providers
cat > versions.tf <<'EOF'
terraform {
  required_providers {
    kubernetes = { source = "hashicorp/kubernetes", version = "3.4.0" }
    local      = { source = "hashicorp/local", version = "2.9.1" }
  }
}
EOF
tofu providers mirror -platform=linux_amd64 /usr/local/share/opentofu/plugins
install -d -m 0755 /etc/opentofu
cat > /etc/opentofu/tofurc <<'EOF'
provider_installation {
  filesystem_mirror {
    path    = "/usr/local/share/opentofu/plugins"
    include = ["registry.opentofu.org/hashicorp/kubernetes", "registry.opentofu.org/hashicorp/local"]
  }
  direct {
    exclude = ["registry.opentofu.org/hashicorp/kubernetes", "registry.opentofu.org/hashicorp/local"]
  }
}
EOF
```

**3.6 The Python tools**, each in its own environment, on Python 3.12.

```bash
export PIPX_HOME=/opt/pipx PIPX_BIN_DIR=/usr/local/bin PIPX_MAN_DIR=/usr/local/share/man
pipx install --include-deps "ansible==14.5.0"
pipx install "pytest==9.1.1"
pipx install "ruff==0.17.1"
pipx install "semgrep==1.181.0"
pipx install "checkov==3.3.29"
```

**3.7 Check every tool answers.**

```bash
for t in docker kubectl helm k9s argocd tofu ansible pytest ruff trivy gitleaks semgrep \
         checkov cosign kyverno hadolint k6 oasdiff code-server gitea-runner; do
  command -v $t >/dev/null && echo "ok  $t" || echo "MISSING  $t"
done
```

**3.8 The settings the containers read when they start.** The shell
environment, SSH, code-server, the runner service, and the account helper.
These are about 150 lines; copy them exactly from the build script, sections
"Shell environment" to the end:
`roles/lxd/templates/build-workspace-image.sh.j2` (from `step "Shell environment"`).
In short they create:

- `/etc/profile.d/pelab.sh`: reads `/etc/pelab/env` (ME, TEAM, DOMAIN), sets
  `KUBECONFIG=$HOME/.kube/config:/etc/pelab/kubeconfig` and
  `TF_CLI_CONFIG_FILE=/etc/opentofu/tofurc`, and `alias k=kubectl`;
- `/etc/ssh/sshd_config.d/60-pelab.conf`: keys from `/etc/pelab/ssh/<user>.keys`,
  no passwords, no root login;
- a `code-server@.service` drop-in that reads `/etc/pelab/code-server.yaml`;
- `pelab-gitea-runner.service`: `gitea-runner daemon --config /etc/pelab/runner/config.yaml`,
  started only where `/var/lib/gitea-runner/.runner` exists;
- `/usr/local/sbin/pelab-workspace-init <user> <uid>`: creates the participant
  account, adds it to `docker` and `sudo`, and starts `code-server@<user>`.

Then leave the builder: `exit`.

**3.9 Publish the image and remove the builder.**

```bash
sudo lxc stop pelab-image-builder
sudo lxc publish pelab-image-builder --alias workspace description="PE Lab workspace"
sudo lxc delete pelab-image-builder
sudo lxc image list workspace
```

---

## Part 4. Kubernetes: k3s (`k3s`)

**4.1 Download k3s v1.36.5+k3s1 and check it.**

```bash
K=https://github.com/k3s-io/k3s/releases/download/v1.36.5%2Bk3s1
cd /tmp
curl -fLO $K/k3s && curl -fLO $K/sha256sum-amd64.txt
grep ' k3s$' sha256sum-amd64.txt | sha256sum -c
sudo install -m 0755 k3s /usr/local/bin/k3s
curl -fLo install-k3s.sh https://raw.githubusercontent.com/k3s-io/k3s/v1.36.5%2Bk3s1/install.sh
```

**4.2 The k3s settings.**

```bash
sudo mkdir -p /etc/rancher/k3s /var/lib/rancher/k3s/server/manifests
sudo tee /etc/rancher/k3s/config.yaml >/dev/null <<EOF
node-name: pelab
write-kubeconfig-mode: "0600"
cluster-cidr: 10.42.0.0/16
service-cidr: 10.43.0.0/16
tls-san:
  - $(hostname -I | awk '{print $1}')
  - 10.120.0.1
  - k8s.pelab.example.internal
secrets-encryption: true
kubelet-arg:
  - max-pods=250
EOF
```

**4.3 Traefik** (comes with k3s): send HTTP to HTTPS, use the lab
certificate, log requests, and only accept the lab's own networks.

```bash
sudo tee /var/lib/rancher/k3s/server/manifests/pelab-traefik-config.yaml >/dev/null <<'EOF'
apiVersion: helm.cattle.io/v1
kind: HelmChartConfig
metadata:
  name: traefik
  namespace: kube-system
spec:
  valuesContent: |-
    additionalArguments:
      - "--entryPoints.web.http.redirections.entryPoint.to=:443"
      - "--entryPoints.web.http.redirections.entryPoint.scheme=https"
      - "--entryPoints.web.http.redirections.entryPoint.permanent=true"
    tlsStore:
      default:
        defaultCertificate:
          secretName: pelab-wildcard-tls
    logs:
      access:
        enabled: true
    service:
      spec:
        loadBalancerSourceRanges:
          - "10.120.0.0/24"
          - "10.42.0.0/16"
          - "127.0.0.0/8"
EOF
```

**4.4 CoreDNS:** inside the cluster, every lab name answers with the host's
bridge address.

```bash
sudo tee /var/lib/rancher/k3s/server/manifests/pelab-coredns-custom.yaml >/dev/null <<'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: coredns-custom
  namespace: kube-system
data:
  pelab.server: |
    pelab.example.internal:53 {
        errors
        cache 30
        template IN A pelab.example.internal {
            answer "{{ .Name }} 60 IN A 10.120.0.1"
        }
        template IN AAAA pelab.example.internal {
            rcode NOERROR
        }
    }
EOF
```

**4.5 Install and start k3s, then wait for the node.**

```bash
sudo INSTALL_K3S_SKIP_DOWNLOAD=true INSTALL_K3S_VERSION='v1.36.5+k3s1' INSTALL_K3S_EXEC=server sh /tmp/install-k3s.sh
sudo systemctl enable --now k3s
sudo k3s kubectl wait --for=condition=Ready node --all --timeout=120s
```

**4.6 Helm 4.3.1 on the host,** and a short name for kubectl.

```bash
curl -fL https://get.helm.sh/helm-v4.3.1-linux-amd64.tar.gz | tar xz -C /tmp
sudo install -m 0755 /tmp/linux-amd64/helm /usr/local/bin/helm
alias k='sudo k3s kubectl'
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
alias helm='sudo KUBECONFIG=/etc/rancher/k3s/k3s.yaml helm'
```

Keep those three lines: Parts 5 to 9 use `k` and `helm`.

---

## Part 5. The platform services (`platform`)

**5.1 Namespaces, the certificate and the CA in each.**

```bash
for ns in monitoring kyverno gitea harbor argocd backstage pelab-workspaces; do
  k create namespace $ns --dry-run=client -o yaml | k apply -f -
  k -n $ns create secret tls pelab-wildcard-tls --cert=/etc/pelab/tls/tls.crt --key=/etc/pelab/tls/tls.key \
    --dry-run=client -o yaml | k apply -f -
  k -n $ns create configmap pelab-ca --from-file=ca.crt=/etc/pelab/tls/ca.crt --dry-run=client -o yaml | k apply -f -
done
```

**5.2 The administrator passwords, as secrets the charts read.**

```bash
k -n monitoring create secret generic grafana-admin --from-literal=admin-user=admin --from-literal=admin-password='<GRAFANA_ADMIN_PASSWORD>'
k -n gitea create secret generic gitea-admin --from-literal=username=pelab-admin --from-literal=password='<GITEA_ADMIN_PASSWORD>'
k -n harbor create secret generic harbor-admin --from-literal=HARBOR_ADMIN_PASSWORD='<HARBOR_ADMIN_PASSWORD>'
```

**5.3 The read-only login in front of Prometheus and Alertmanager.** They have
no login of their own, so Traefik asks for one. Make a bcrypt hash of the
participants' read-only password (user `delegate`), then the secret and the
Traefik rule:

```bash
HASH=$(python3 -c "import crypt,getpass; print(crypt.crypt(getpass.getpass('delegate password: '), crypt.mksalt(crypt.METHOD_BLOWFISH, rounds=1024)))")
cat <<EOF | k apply -f -
apiVersion: v1
kind: Secret
type: Opaque
metadata: {name: delegate-login, namespace: monitoring}
stringData:
  users: "delegate:$HASH"
---
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata: {name: delegate-login, namespace: monitoring}
spec:
  basicAuth:
    secret: delegate-login
    realm: "PE lab: sign in as delegate"
    removeHeader: true
EOF
```

(`crypt` exists in Python up to 3.12. On a newer Python, use
`htpasswd -nbB delegate '<password>'` from the `apache2-utils` package.)

**5.4 The chart repositories.**

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add kyverno https://kyverno.github.io/kyverno/
helm repo add gitea-charts https://dl.gitea.com/charts/
helm repo add harbor https://helm.goharbor.io
helm repo add argo https://argoproj.github.io/argo-helm
helm repo add grafana-community https://grafana-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add backstage https://backstage.github.io/charts
helm repo update
```

**5.5 Each service: write its values file, then install it.** Keep the files
in `~/pelab-values/`. The full values the build uses are in
`roles/platform/templates/values/`; the files below are the same, with the
lab's values filled in.

Monitoring (Prometheus, Alertmanager, Grafana), `kube-prometheus-stack.yaml`:

```yaml
kubeEtcd: {enabled: false}
kubeControllerManager: {enabled: false}
kubeScheduler: {enabled: false}
kubeProxy: {enabled: false}
defaultRules:
  rules: {etcd: false, kubeControllerManager: false, kubeProxy: false, kubeSchedulerAlerting: false, kubeSchedulerRecording: false}
prometheus:
  ingress:
    enabled: true
    ingressClassName: traefik
    annotations:
      traefik.ingress.kubernetes.io/router.middlewares: monitoring-delegate-login@kubernetescrd
    hosts: [prometheus.pelab.example.internal]
    paths: ["/"]
    pathType: Prefix
    tls: [{secretName: pelab-wildcard-tls, hosts: [prometheus.pelab.example.internal]}]
  prometheusSpec:
    externalUrl: https://prometheus.pelab.example.internal
    retention: 7d
    retentionSize: 5GB
    serviceMonitorSelectorNilUsesHelmValues: false
    podMonitorSelectorNilUsesHelmValues: false
    ruleSelectorNilUsesHelmValues: false
    probeSelectorNilUsesHelmValues: false
    enableRemoteWriteReceiver: true
    resources: {requests: {cpu: 250m, memory: 1Gi}, limits: {memory: 4Gi}}
    storageSpec:
      volumeClaimTemplate:
        spec: {accessModes: [ReadWriteOnce], resources: {requests: {storage: 20Gi}}}
alertmanager:
  ingress:
    enabled: true
    ingressClassName: traefik
    annotations:
      traefik.ingress.kubernetes.io/router.middlewares: monitoring-delegate-login@kubernetescrd
    hosts: [alertmanager.pelab.example.internal]
    paths: ["/"]
    pathType: Prefix
    tls: [{secretName: pelab-wildcard-tls, hosts: [alertmanager.pelab.example.internal]}]
  alertmanagerSpec:
    externalUrl: https://alertmanager.pelab.example.internal
grafana:
  admin: {existingSecret: grafana-admin, userKey: admin-user, passwordKey: admin-password}
  grafana.ini:
    server: {root_url: https://grafana.pelab.example.internal}
    auth.anonymous: {enabled: false}
  persistence: {enabled: true, size: 5Gi}
  ingress:
    enabled: true
    ingressClassName: traefik
    hosts: [grafana.pelab.example.internal]
    tls: [{secretName: pelab-wildcard-tls, hosts: [grafana.pelab.example.internal]}]
  additionalDataSources:
    - {name: Loki, uid: loki, type: loki, access: proxy, url: "http://loki.monitoring.svc:3100"}
  sidecar:
    dashboards:
      enabled: true
      label: grafana_dashboard
      labelValue: "1"
      searchNamespace: ALL
      folderAnnotation: grafana_folder
      provider: {foldersFromFilesStructure: true}
```

```bash
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack --version 92.10.1 \
  -n monitoring -f ~/pelab-values/kube-prometheus-stack.yaml --wait --timeout 20m
```

Kyverno (the guardrails), `kyverno.yaml`:

```yaml
admissionController:
  replicas: 1
  container:
    extraEnvVars: [{name: SSL_CERT_DIR, value: /etc/pelab-ca}]
  extraVolumes: [{name: pelab-ca, configMap: {name: pelab-ca}}]
  extraVolumeMounts: [{name: pelab-ca, mountPath: /etc/pelab-ca, readOnly: true}]
backgroundController: {replicas: 1}
cleanupController: {replicas: 1}
reportsController:
  replicas: 1
  extraEnvVars: [{name: SSL_CERT_DIR, value: /etc/pelab-ca}]
  extraVolumes: [{name: pelab-ca, configMap: {name: pelab-ca}}]
  extraVolumeMounts: [{name: pelab-ca, mountPath: /etc/pelab-ca, readOnly: true}]
features:
  policyExceptions: {enabled: true, namespace: pelab-exceptions}
```

```bash
k -n kyverno create configmap pelab-ca --from-file=ca.crt=/etc/pelab/tls/ca.crt --dry-run=client -o yaml | k apply -f -
helm upgrade --install kyverno kyverno/kyverno --version 3.9.1 -n kyverno -f ~/pelab-values/kyverno.yaml --wait --timeout 15m
```

Gitea (Git, pull requests, pipelines), `gitea.yaml`:

```yaml
strategy: {type: Recreate}
gitea:
  admin: {existingSecret: gitea-admin, email: pelab-admin@pelab.example.internal, passwordMode: keepUpdated}
  config:
    APP_NAME: PE Lab Git
    server:
      DOMAIN: gitea.pelab.example.internal
      ROOT_URL: https://gitea.pelab.example.internal/
      SSH_DOMAIN: gitea.pelab.example.internal
      SSH_PORT: 2222
      SSH_LISTEN_PORT: 2222
    database: {DB_TYPE: sqlite3}
    actions: {ENABLED: true, DEFAULT_ACTIONS_URL: github}
    cache: {ADAPTER: memory}
    session: {PROVIDER: db}
    queue: {TYPE: level}
    service: {DISABLE_REGISTRATION: true, REQUIRE_SIGNIN_VIEW: true, DEFAULT_ORG_VISIBILITY: limited}
    repository: {DEFAULT_BRANCH: main}
    webhook: {ALLOWED_HOST_LIST: private}
    migrations: {ALLOW_LOCALNETWORKS: true}
service:
  ssh:
    type: LoadBalancer
    clusterIP: ""
    port: 2222
    loadBalancerSourceRanges: [10.120.0.0/24, 10.42.0.0/16]
ingress:
  enabled: true
  className: traefik
  hosts: [{host: gitea.pelab.example.internal, paths: [{path: /}]}]
  tls: [{secretName: pelab-wildcard-tls, hosts: [gitea.pelab.example.internal]}]
persistence: {enabled: true, size: 20Gi}
valkey-cluster: {enabled: false}
valkey: {enabled: false}
postgresql-ha: {enabled: false}
postgresql: {enabled: false}
test: {enabled: false}
```

```bash
helm upgrade --install gitea gitea-charts/gitea --version 12.7.0 -n gitea -f ~/pelab-values/gitea.yaml --wait --timeout 15m
```

Harbor (images, scans, SBOMs), `harbor.yaml`. Make up a `secretKey` of
exactly 16 letters and digits:

```yaml
externalURL: https://harbor.pelab.example.internal
expose:
  type: ingress
  tls: {enabled: true, certSource: secret, secret: {secretName: pelab-wildcard-tls}}
  ingress:
    className: traefik
    hosts: {core: harbor.pelab.example.internal}
existingSecretAdminPassword: harbor-admin
existingSecretAdminPasswordKey: HARBOR_ADMIN_PASSWORD
secretKey: "<16_CHARACTERS>"
updateStrategy: {type: Recreate}
persistence:
  enabled: true
  persistentVolumeClaim:
    registry: {size: 200Gi}
    jobservice: {jobLog: {size: 1Gi}}
    database: {size: 5Gi}
    redis: {size: 1Gi}
    trivy: {size: 10Gi}
trivy: {enabled: true}
```

```bash
helm upgrade --install harbor harbor/harbor --version 1.19.4 -n harbor -f ~/pelab-values/harbor.yaml --wait --timeout 20m
```

Argo CD (deployments), `argo-cd.yaml`. The `delegate` account is read-only;
its password hash is the same `$HASH` as in 5.3. Paste the whole CA file
(`/etc/pelab/tls/ca.crt`) under both host names, indented:

```yaml
global: {domain: argocd.pelab.example.internal}
configs:
  params: {server.insecure: true}
  cm:
    timeout.reconciliation: 60s
    users.anonymous.enabled: "false"
    accounts.delegate: login
  rbac:
    policy.default: ""
    policy.csv: |
      g, delegate, role:readonly
  secret:
    extra:
      accounts.delegate.password: "<HASH from 5.3>"
  tls:
    certificates:
      gitea.pelab.example.internal: |
        -----BEGIN CERTIFICATE-----
        ...the lab CA...
        -----END CERTIFICATE-----
      harbor.pelab.example.internal: |
        -----BEGIN CERTIFICATE-----
        ...the lab CA...
        -----END CERTIFICATE-----
dex: {enabled: false}
applicationSet:
  extraEnv: [{name: SSL_CERT_FILE, value: /etc/pelab-ca/ca.crt}]
  extraVolumes: [{name: pelab-ca, configMap: {name: pelab-ca}}]
  extraVolumeMounts: [{name: pelab-ca, mountPath: /etc/pelab-ca, readOnly: true}]
server:
  ingress:
    enabled: true
    ingressClassName: traefik
    tls: false
    extraTls: [{secretName: pelab-wildcard-tls, hosts: [argocd.pelab.example.internal]}]
```

```bash
helm upgrade --install argo-cd argo/argo-cd --version 10.10.5 -n argocd -f ~/pelab-values/argo-cd.yaml --wait --timeout 15m
```

Loki (logs), `loki.yaml`:

```yaml
deploymentMode: SingleBinary
loki:
  auth_enabled: false
  commonConfig: {replication_factor: 1}
  storage: {type: filesystem}
  schemaConfig:
    configs:
      - {from: "2024-04-01", store: tsdb, object_store: filesystem, schema: v13, index: {prefix: loki_index_, period: 24h}}
  limits_config: {retention_period: 168h}
  compactor: {retention_enabled: true, delete_request_store: filesystem}
singleBinary: {replicas: 1, persistence: {enabled: true, size: 20Gi}}
read: {replicas: 0}
write: {replicas: 0}
backend: {replicas: 0}
gateway: {enabled: false}
chunksCache: {enabled: false}
resultsCache: {enabled: false}
lokiCanary: {enabled: false}
test: {enabled: false}
```

```bash
helm upgrade --install loki grafana-community/loki --version 18.17.1 -n monitoring -f ~/pelab-values/loki.yaml --wait --timeout 15m
```

Alloy (collects every pod's logs into Loki): copy
`roles/platform/templates/values/alloy.yaml.j2` to `~/pelab-values/alloy.yaml`
(it has no lab values to fill in), then:

```bash
helm upgrade --install alloy grafana/alloy --version 1.13.1 -n monitoring -f ~/pelab-values/alloy.yaml --wait --timeout 15m
```

**5.6 Wait for everything, then check Grafana answers.**

```bash
k get pods -A | grep -vE 'Running|Completed'
curl -s https://grafana.pelab.example.internal/api/health
```

The first command shows only its heading line once everything runs. The second
prints `"database": "ok"`.

**5.7 The read-only Grafana login** for participants (role Viewer):

```bash
G=https://grafana.pelab.example.internal
curl -s -u 'admin:<GRAFANA_ADMIN_PASSWORD>' -H 'Content-Type: application/json' \
  -d '{"name":"delegate","login":"delegate","password":"<DELEGATE_PASSWORD>"}' $G/api/admin/users
```

New Grafana users get the Viewer role by default.

**5.8 Harbor as a cache for Docker Hub,** so the cluster doesn't hit Docker
Hub's download limits.

```bash
H=https://harbor.pelab.example.internal/api/v2.0
HA='admin:<HARBOR_ADMIN_PASSWORD>'
curl -s -u "$HA" -H 'Content-Type: application/json' \
  -d '{"name":"dockerhub","type":"docker-hub","url":"https://hub.docker.com","insecure":false}' $H/registries
RID=$(curl -s -u "$HA" "$H/registries?name=dockerhub" | jq '.[0].id')
curl -s -u "$HA" -H 'Content-Type: application/json' \
  -d "{\"project_name\":\"dockerhub\",\"registry_id\":$RID,\"public\":true,\"metadata\":{\"public\":\"true\"}}" $H/projects
sudo tee /etc/rancher/k3s/registries.yaml >/dev/null <<'EOF'
mirrors:
  "docker.io":
    endpoint:
      - "https://harbor.pelab.example.internal"
    rewrite:
      "^(.*)$": "dockerhub/$1"
configs:
  "harbor.pelab.example.internal":
    tls:
      ca_file: /etc/pelab/tls/ca.crt
EOF
sudo systemctl restart k3s
```

---

## Part 6. Your workspace (`workspaces`)

**6.1 The workspace profile:** 2 CPUs, 6 GiB, Docker allowed inside, starts at boot.

```bash
sudo lxc profile create pelab-workspace
sudo lxc profile set pelab-workspace boot.autostart=true limits.cpu=2 limits.memory=6GiB \
  security.nesting=true security.syscalls.intercept.mknod=true security.syscalls.intercept.setxattr=true \
  linux.kernel_modules=overlay,br_netfilter,nf_nat,nf_tables,ip_tables,ip6_tables,xt_conntrack
sudo lxc profile device add pelab-workspace root disk path=/ pool=default size=40GiB
sudo lxc profile device add pelab-workspace eth0 nic name=eth0 network=lxdbr0
```

**6.2 Start `student01` from the image, at a fixed address,** with
`/opt/pelab/workspaces/student01` from the host mounted read-only at `/etc/pelab`.

```bash
sudo mkdir -p /opt/pelab/workspaces/student01/ssh
sudo lxc init workspace student01 -p pelab-workspace
sudo lxc config device override student01 eth0 ipv4.address=10.120.0.101
sudo lxc config device add student01 pelab disk source=/opt/pelab/workspaces/student01 path=/etc/pelab readonly=true
sudo lxc start student01
```

**6.3 Give the mounted folder to the container's root user.** Containers run
with shifted user ids: root inside is a high id on the host. Read it from the
map the container really uses (not `volatile.idmap.base`, which reads `0` on
some hosts):

```bash
ROOT=$(sudo lxc config get student01 volatile.last_state.idmap | jq '[.[] | select(.Isuid and .Nsid == 0)][0].Hostid')
echo $ROOT        # usually 1000000
sudo chown -R $ROOT:$ROOT /opt/pelab/workspaces/student01
```

**6.4 The workspace's settings, logins and code-server password.**
`$((ROOT + 2000))` is the participant's account (id 2000) as the host sees it.

```bash
W=/opt/pelab/workspaces/student01
printf 'ME=student01\nTEAM=team01\nDOMAIN=pelab.example.internal\n' | sudo tee $W/env
sudo tee $W/code-server.yaml >/dev/null <<'EOF'
bind-addr: 0.0.0.0:13337
auth: password
password: "<STUDENT01_PASSWORD>"
cert: false
disable-telemetry: true
disable-update-check: true
EOF
sudo chown $((ROOT + 2000)):$((ROOT + 2000)) $W/code-server.yaml && sudo chmod 0600 $W/code-server.yaml
```

Also write `$W/logins.md` with the logins (the format is in
`roles/workspaces/templates/logins.md.j2`), and copy it to `/etc/pelab/logins.md` on the host.

**6.5 Create the account, start code-server, and keep a clean snapshot** to
reset to.

```bash
sudo lxc exec student01 -- systemctl is-system-running --wait
sudo lxc exec student01 -- /usr/local/sbin/pelab-workspace-init student01 2000
sudo lxc snapshot student01 clean
```

**6.6 Publish the workspace at `https://student01.pelab.example.internal`.**
Kubernetes doesn't run the workspace, so a Service points at the
container's address by hand:

```bash
cat <<'EOF' | k apply -f -
apiVersion: v1
kind: Service
metadata: {name: student01, namespace: pelab-workspaces}
spec:
  type: ClusterIP
  ports: [{name: http, port: 13337, targetPort: 13337, protocol: TCP}]
---
apiVersion: discovery.k8s.io/v1
kind: EndpointSlice
metadata:
  name: student01-lxd
  namespace: pelab-workspaces
  labels: {kubernetes.io/service-name: student01}
addressType: IPv4
ports: [{name: http, port: 13337, protocol: TCP}]
endpoints: [{addresses: ["10.120.0.101"], conditions: {ready: true}}]
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata: {name: student01, namespace: pelab-workspaces}
spec:
  ingressClassName: traefik
  tls: [{hosts: [student01.pelab.example.internal], secretName: pelab-wildcard-tls}]
  rules:
    - host: student01.pelab.example.internal
      http:
        paths: [{path: /, pathType: Prefix, backend: {service: {name: student01, port: {number: 13337}}}}]
EOF
```

---

## Part 7. The pipeline runner (`runners`)

**7.1 The runner profile and container** at `10.120.0.11`, with its own mounted folder.

```bash
sudo lxc profile create pelab-runner
sudo lxc profile set pelab-runner boot.autostart=true limits.cpu=4 limits.memory=6GiB security.nesting=true \
  security.syscalls.intercept.mknod=true security.syscalls.intercept.setxattr=true \
  linux.kernel_modules=overlay,br_netfilter,nf_nat,nf_tables,ip_tables,ip6_tables,xt_conntrack
sudo lxc profile device add pelab-runner root disk path=/ pool=default size=80GiB
sudo lxc profile device add pelab-runner eth0 nic name=eth0 network=lxdbr0
sudo mkdir -p /opt/pelab/runners/runner01/runner
sudo lxc init workspace runner01 -p pelab-runner -c user.pelab.role=runner
sudo lxc config device override runner01 eth0 ipv4.address=10.120.0.11
sudo lxc config device add runner01 pelab disk source=/opt/pelab/runners/runner01 path=/etc/pelab readonly=true
sudo lxc start runner01
ROOT=$(sudo lxc config get runner01 volatile.last_state.idmap | jq '[.[] | select(.Isuid and .Nsid == 0)][0].Hostid')
```

**7.2 The runner's configuration.** Copy it from
`roles/runners/templates/config.yaml.j2` into
`/opt/pelab/runners/runner01/runner/config.yaml`, filling in the labels from
`roles/runners/defaults/main.yml`, capacity `2`, job timeout `1h`, and the
cache at `10.120.0.11` port `8088`. Then:

```bash
sudo chown -R $ROOT:$ROOT /opt/pelab/runners/runner01 && sudo chmod 0640 /opt/pelab/runners/runner01/runner/config.yaml
```

**7.3 Register it with Gitea and start it.**

```bash
TOKEN=$(k -n gitea exec deploy/gitea -c gitea -- gitea actions generate-runner-token | tail -1)
echo "$TOKEN" | sudo tee /opt/pelab/runners/runner01/runner/registration-token >/dev/null
sudo chown $ROOT:$ROOT /opt/pelab/runners/runner01/runner/registration-token
sudo chmod 0600 /opt/pelab/runners/runner01/runner/registration-token
sudo lxc exec runner01 -- systemctl is-system-running --wait
sudo lxc exec runner01 --cwd=/var/lib/gitea-runner -- gitea-runner register \
  --config=/etc/pelab/runner/config.yaml --no-interactive \
  --instance=https://gitea.pelab.example.internal --token-file=/etc/pelab/runner/registration-token --name=runner01
sudo lxc exec runner01 -- systemctl enable --now pelab-gitea-runner.service
```

In Gitea, Site Administration → Actions → Runners shows `runner01` as Idle.

---

## Part 8. Team namespaces (`teams`)

For `team01`: three namespaces (`team01-dev`, `team01-staging`,
`team01-prod`), each with a quota, default limits and a network policy; an
identity for `student01` with rights in its team's namespaces; and a
kubeconfig mounted in the workspace.

These are three long templates, each a page of YAML. Fill in the team name and
apply them, in this order:

1. `roles/teams/templates/namespaces.yaml.j2`: the namespaces, with label `pelab.io/team: team01`;
2. `roles/teams/templates/guardrails.yaml.j2`: ResourceQuota, LimitRange and NetworkPolicy, with the numbers from `roles/teams/defaults/main.yml`;
3. `roles/teams/templates/rbac.yaml.j2`: the ServiceAccount, its token Secret and the RoleBindings.

Then wait for the token and write the kubeconfig the workspace reads:

```bash
k -n pelab-users get secret student01-token -o jsonpath='{.data.token}' | base64 -d
```

Put that token into a kubeconfig made from `roles/teams/templates/kubeconfig.yaml.j2`,
save it as `/opt/pelab/workspaces/student01/kubeconfig`, and give it to the
participant's account:

```bash
sudo chown $((ROOT + 2000)):$((ROOT + 2000)) /opt/pelab/workspaces/student01/kubeconfig
sudo chmod 0600 /opt/pelab/workspaces/student01/kubeconfig
```

Check from the workspace: `sudo lxc exec student01 -- su - student01 -c 'kubectl get pods -n team01-dev'`
says "No resources found", not "Forbidden".

---

## Part 9. The golden path (`golden_path`)

This is the longest part: 81 steps in Ansible, nearly all of them calls to
Gitea's, Harbor's and Kubernetes' APIs. By hand you do most of it in the web
pages. In this order:

**9.1 Harbor**, signed in as `admin` at `https://harbor.pelab.example.internal`:

1. Projects → New project `team01`, private. In its Configuration, tick
   **Automatically scan images on push** and **Automatically generate SBOM on push**.
2. Robot Accounts → New: name `ci`, never expires, **Push** and **Pull** on
   `team01`. Copy the secret: the pipelines use it.
3. Users → New user `student01` (password: theirs), and add it to project
   `team01` as Developer.

**9.2 Gitea accounts**, signed in as `pelab-admin` at
`https://gitea.pelab.example.internal`, Site Administration → User Accounts →
Create:

- `student01`, `reviewer`, `platform-approver`: their own passwords, and untick
  "Require user to change password";
- `platform-bot`: read-only, for Argo CD and Backstage. Sign in as it, then
  Settings → Applications → Generate token with **read** on repository, organization,
  user and issue (Argo CD's Gitea generator reads issues too);
- `platform-applier`: Generate a token with **read** on repository and
  **write** on commit statuses.

**9.3 Organisations and teams.**

1. New organisation `team01`, visibility **Limited**.
2. In it, a team `developers` with **Write** on all repositories: add
   `student01` and `reviewer`.
3. A team `platform` with **Read** on all repositories: add `platform-applier`.
4. Organisation `team01` → Settings → Actions → Secrets: `HARBOR_USERNAME` =
   the robot's full name as Harbor shows it (`robot$ci`), `HARBOR_PASSWORD` =
   the robot secret from 9.1.
5. Settings → Actions → Variables: `REGISTRY` = `harbor.pelab.example.internal`.

**9.4 The platform repositories.** Organisation `platform`, with one
repository for each folder of the course's `labs/`:

| Repository | Content from | Settings |
| --- | --- | --- |
| `golden-path` | `labs/day1/golden-path` | Template repository: yes |
| `pipeline-templates` | `labs/day4/pipeline-templates` | |
| `catalog` | `labs/day4/catalog` | |
| `environments` | `labs/day3/environments` | Actions on |
| `policies` | `labs/day5/policies` (plus one file per guardrail in `policies/`) | Actions on |
| `handbook` | the `README.md` of each day, and `labs/images/` | |

For each, create it empty in Gitea, then push the folder from the VM:

```bash
cd ~/plartfom-enable/labs/day1/golden-path
git init -b main && git add -A && git commit -m "Golden path"
git -c http.sslCAInfo=/usr/local/share/ca-certificates/pelab-lab-ca.crt \
  push https://pelab-admin@gitea.pelab.example.internal/platform/golden-path.git main
rm -rf .git
```

Files ending in `.j2` are templates: fill in the lab's values (domain,
organisation, repository names) before you push them, and drop the `.j2`.

**9.5 Protect `main`.**

- On `platform/golden-path`: Settings → Branches → Add rule `main`, no pushes,
  1 approval, block on rejected reviews, dismiss stale approvals, status check
  `pipeline` required.
- On `environments` and `policies` the same, but approvals only from
  `pelab-admin` and `platform-approver`. Add teams `requesters` (the
  participants, read), `automation` (`platform-applier`) and `approvers`
  (`platform-approver`).

**9.6 The team's starter service.** In Gitea, New Repository → from template
`platform/golden-path`, owner `team01`, name `hello`, with **Git content** and
**Template items** ticked. Protect its `main` as in 9.5 (first rule). Then run
its pipeline once: Actions → the workflow → Run workflow on `main`. Wait for it
to be green: it builds the image and pushes it to Harbor.

**9.7 Argo CD.** Give Argo CD the bot's token, then the team's project and
ApplicationSets (one for dev, one for staging and prod):

```bash
k -n argocd create secret generic gitea-scm-token --from-literal=token='<PLATFORM_BOT_TOKEN>'
k -n argocd apply -f - <<'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: gitea-repo-creds
  namespace: argocd
  labels: {argocd.argoproj.io/secret-type: repo-creds}
stringData:
  type: git
  url: https://gitea.pelab.example.internal/
  username: platform-bot
  password: <PLATFORM_BOT_TOKEN>
EOF
```

Then fill `roles/golden_path/templates/manifests/argocd-teams.yaml.j2` in for
`team01` (AppProject `team01`, ApplicationSets `team01-dev` and
`team01-releases`) and apply it. After a minute, Argo CD shows
`team01-hello-dev` Synced and Healthy.

**9.8 The guardrails.** Fill in `labs/day5/guardrails.yaml.j2` (the Kyverno
policies for the team namespaces) and apply it with `k apply -f`. Create the
namespace for approved exceptions: `k create namespace pelab-exceptions`.

**9.9 The golden-path dashboard.** Grafana loads any ConfigMap with the label
`grafana_dashboard: "1"`:

```bash
k -n monitoring create configmap pelab-golden-path-dashboard \
  --from-file=golden-path.json=$HOME/plartfom-enable/labs/day6/dashboard/golden-path.json
k -n monitoring label configmap pelab-golden-path-dashboard grafana_dashboard=1
k -n monitoring annotate configmap pelab-golden-path-dashboard grafana_folder="PE Lab"
```

**9.10 Backstage (the portal).** A secret with the bot's token, then the chart
`backstage/backstage` version `2.10.2` with the values from
`roles/golden_path/templates/values/backstage.yaml.j2` (image
`ghcr.io/backstage/backstage:1.55.2`, the catalog read from `platform/catalog`,
guest sign-in, host `backstage.pelab.example.internal`).

**9.11 The platform applier.** It applies approved environment requests and
policies every 2 minutes:

1. OpenTofu 1.13.1 on the host (as in 3.4), and the providers mirrored as in 3.5.
2. A namespace `pelab-tfstate` for OpenTofu's state, and a read-only identity
   for the plan pipeline.
3. The script `roles/golden_path/templates/pelab-platform-apply.py.j2`, filled
   in, at `/opt/pelab/applier/`, with the applier's Gitea token.
4. A systemd service and a timer every 2 minutes (`OnBootSec=2min`,
   `OnUnitInactiveSec=2min`), started with `systemctl enable --now pelab-platform-apply.timer`.

---

## Part 10. Backups (`backup`)

The scripts `roles/backup/templates/pelab-backup.sh.j2` and `pelab-restore.sh.j2`,
filled in, in `/usr/local/sbin/`, and a nightly timer:

```bash
sudo tee /etc/systemd/system/pelab-backup.service >/dev/null <<'EOF'
[Unit]
Description=PE Lab: back up Gitea and Harbor
After=k3s.service
[Service]
Type=oneshot
TimeoutStartSec=3h
Nice=10
IOSchedulingClass=idle
ExecStart=/usr/local/sbin/pelab-backup
EOF
sudo tee /etc/systemd/system/pelab-backup.timer >/dev/null <<'EOF'
[Unit]
Description=PE Lab: nightly backup of Gitea and Harbor
[Timer]
OnCalendar=*-*-* 02:30:00
Persistent=true
[Install]
WantedBy=timers.target
EOF
sudo systemctl daemon-reload && sudo systemctl enable --now pelab-backup.timer
```

---

## Part 11. Check

The same check as after an Ansible build:

```bash
bash ~/plartfom-enable/prelab-setup/check-lab.sh
```

Every FAIL says what is missing. By hand, this is where most of the time
goes: finding the one value that was typed differently.

---

## What you have seen

- **The same work, two ways.** Each part above is one Ansible role. The role
  does exactly these steps, checks each result, and stops at the first error.
- **Where the time goes.** By hand, little of the time is typing: most of it
  is reading output, checking and fixing. Ansible does the checking itself.
- **Why "run it again" matters.** Run a role a second time and it changes
  nothing; change one value in `inventory/group_vars/pelab/` and it changes
  only what that value touches. By hand there is no "again": there is only
  "start over" or "find what is different".
