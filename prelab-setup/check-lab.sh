#!/usr/bin/env bash
# Checks a built lab, after "ansible-playbook site.yml": the host, k3s, every
# platform service, the workspace and runner, Gitea, Harbor, Argo CD, Kyverno,
# the hello app in dev and the platform's timers. Changes nothing.
#
#   bash ~/plartfom-enable/prelab-setup/check-lab.sh
#
# Run it on the lab VM, as your own user. It uses sudo (for k3s and LXD), and asks
# for your sudo password once only if sudo needs one.
# Each check prints PASS, WARN (works, but look at it) or FAIL, and the summary
# at the end says what to do. The exit code is the number of failures.
#
# At the end it lists every web address and every login, administrators
# included. Add --no-passwords to hide the passwords (for a shared screen).
set -uo pipefail

SHOW_PASSWORDS=true
[ "${1:-}" = --no-passwords ] && SHOW_PASSWORDS=false
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

KUBECONFIG_FILE=/etc/rancher/k3s/k3s.yaml
# The copy in the system trust store: /etc/pelab/tls is readable by root only.
CA=/usr/local/share/ca-certificates/pelab-lab-ca.crt
PASS=0 WARN=0 FAIL=0
FAILED=()

if [ -t 1 ]; then G=$'\e[32m' Y=$'\e[33m' R=$'\e[31m' B=$'\e[1m' N=$'\e[0m'; else G='' Y='' R='' B='' N=''; fi
section() { printf '\n%s== %s%s\n' "$B" "$*" "$N"; }
pass() { PASS=$((PASS + 1)); printf '  %sPASS%s  %s\n' "$G" "$N" "$*"; }
warn() { WARN=$((WARN + 1)); printf '  %sWARN%s  %s\n' "$Y" "$N" "$*"; }
fail() { FAIL=$((FAIL + 1)); FAILED+=("$*"); printf '  %sFAIL%s  %s\n' "$R" "$N" "$*"; }
kc() { sudo k3s kubectl "$@"; }
# GET a URL with the lab CA; prints the HTTP status (000 when nothing answers).
http_code() { curl -s -o /dev/null -w '%{http_code}' --max-time 15 ${CA_OPT[@]+"${CA_OPT[@]}"} "$@"; }
http_get() { curl -s --max-time 15 ${CA_OPT[@]+"${CA_OPT[@]}"} "$@"; }
json() { python3 -c "import json,sys; d=json.load(sys.stdin); $1" 2>/dev/null; }

[ "$(id -u)" -ne 0 ] || { echo "Run this as your own user, not as root (no sudo in front)."; exit 1; }
# A real command, not sudo -v: -v asks for a password unless every sudo rule for
# the user is NOPASSWD, while a passwordless rule is enough for the commands below.
sudo -n true 2>/dev/null || sudo true || { echo "This check needs sudo (for k3s and LXD)."; exit 1; }
CA_OPT=()
[ -f "$CA" ] && CA_OPT=(--cacert "$CA")

# ---------------------------------------------------------------- host
section "The VM"
. /etc/os-release
dpkg --compare-versions "${VERSION_ID:-0}" ge 22.04 && pass "Ubuntu ${VERSION_ID}" || warn "Ubuntu ${VERSION_ID:-?} (the lab needs 22.04 or later)"
mem_gb=$(awk '/MemTotal/ {printf "%.0f", $2/1024/1024}' /proc/meminfo)
avail_gb=$(awk '/MemAvailable/ {printf "%.1f", $2/1024/1024}' /proc/meminfo)
[ "$mem_gb" -ge 20 ] && pass "Memory: ${mem_gb} GB, ${avail_gb} GB available" || warn "Memory: ${mem_gb} GB (the lab is sized for about 23 GB), ${avail_gb} GB available"
disk_pct=$(df --output=pcent / | tail -1 | tr -dc '0-9')
if [ "$disk_pct" -lt 80 ]; then pass "Disk: ${disk_pct}% used"
elif [ "$disk_pct" -lt 85 ]; then warn "Disk: ${disk_pct}% used (above 85% Kubernetes starts removing pods)"
else fail "Disk: ${disk_pct}% used: Kubernetes removes pods above 85%. Free some space (sudo docker system prune in the workspace, old images)"; fi
[ -f "$CA" ] && pass "Lab CA present ($CA)" || fail "Lab CA missing ($CA): run the build again (--tags host_base)"
if [ -f /var/run/reboot-required ]; then warn "Ubuntu wants a restart (sudo reboot), then run this check again"; fi

# ---------------------------------------------------------------- k3s
section "Kubernetes (k3s)"
if systemctl is-active --quiet k3s; then pass "k3s service is running"; else fail "k3s service is not running: sudo systemctl status k3s"; fi
node=$(kc get nodes --no-headers 2>/dev/null | awk '{print $1" "$2}')
if [[ "$node" == *" Ready"* ]]; then pass "Node ${node% *} is Ready"; else fail "The node is not Ready (${node:-no node}): sudo k3s kubectl describe node"; fi

bad_pods=$(kc get pods -A --no-headers 2>/dev/null | awk '$4 != "Running" && $4 != "Completed" {print $1"/"$2" ("$4")"}')
not_ready=$(kc get pods -A --no-headers 2>/dev/null | awk '$4 == "Running" {split($3,a,"/"); if (a[1] != a[2]) print $1"/"$2" ("$3" ready)"}')
total=$(kc get pods -A --no-headers 2>/dev/null | wc -l)
if [ -z "$bad_pods$not_ready" ] && [ "$total" -gt 0 ]; then pass "All $total pods are running and ready"
else
  [ "$total" -gt 0 ] || fail "No pods found"
  while read -r p; do [ -n "$p" ] && fail "Pod not running: $p"; done <<< "$bad_pods"
  while read -r p; do [ -n "$p" ] && fail "Pod not ready: $p"; done <<< "$not_ready"
fi
restarts=$(kc get pods -A --no-headers 2>/dev/null | awk '$5+0 > 5 {print $1"/"$2" ("$5" restarts)"}')
while read -r p; do [ -n "$p" ] && warn "Pod restarts often: $p"; done <<< "$restarts"

section "Platform services (Helm)"
releases=$(sudo KUBECONFIG="$KUBECONFIG_FILE" /usr/local/bin/helm list -A -o json 2>/dev/null)
if [ -z "$releases" ]; then fail "Helm cannot list the releases: sudo KUBECONFIG=$KUBECONFIG_FILE helm list -A"
else
  while IFS='|' read -r name ns status; do
    [ -z "$name" ] && continue
    [ "$status" = deployed ] && pass "$name ($ns): deployed" || fail "$name ($ns): $status. Run the build again: ansible-playbook site.yml -K --tags platform"
  done < <(echo "$releases" | json 'print("\n".join(r["name"]+"|"+r["namespace"]+"|"+r["status"] for r in d))')
  for want in kube-prometheus-stack kyverno gitea harbor argo-cd loki alloy; do
    echo "$releases" | grep -q "\"name\":\"$want\"" || fail "$want is not installed: ansible-playbook site.yml -K --tags platform"
  done
fi

# ---------------------------------------------------------------- web addresses
section "Web addresses (every Ingress)"
HOSTS_FILE=$(mktemp)  # kept for the list of addresses at the end
DOMAIN=$(kc -n gitea get ingress -o jsonpath='{.items[0].spec.rules[0].host}' 2>/dev/null); DOMAIN=${DOMAIN#gitea.}
[ -n "$DOMAIN" ] && pass "Lab domain: $DOMAIN" || fail "Cannot find the lab domain (no Gitea Ingress)"
while read -r host; do
  [ -z "$host" ] && continue
  code=$(http_code "https://$host/")
  case "$code" in
    2??|3??|401) pass "https://$host/ answers ($code)" ;;
    404) warn "https://$host/ answers 404 (up, but nothing at /)" ;;
    000) fail "https://$host/ does not answer (name, certificate or Traefik): curl -v https://$host/" ;;
    *) fail "https://$host/ answers $code" ;;
  esac
done < <(kc get ingress -A -o jsonpath='{range .items[*]}{range .spec.rules[*]}{.host}{"\n"}{end}{end}' 2>/dev/null | sort -u | tee "$HOSTS_FILE")

# ---------------------------------------------------------------- LXD
section "Workspace and runner (LXD)"
lxc_list=$(sudo lxc list -c ns -f csv 2>/dev/null)
[ -n "$lxc_list" ] || fail "LXD lists no containers: sudo lxc list"
for kind in student runner; do
  found=$(echo "$lxc_list" | grep "^$kind" || true)
  [ -n "$found" ] || fail "No $kind container: ansible-playbook site.yml -K --tags $([ $kind = student ] && echo workspaces || echo runners)"
  while IFS=, read -r name state; do
    [ -z "$name" ] && continue
    [ "$state" = RUNNING ] && pass "$name is running" || fail "$name is $state: sudo lxc start $name"
  done <<< "$found"
done
sudo test -f /etc/pelab/logins.md && pass "Logins file /etc/pelab/logins.md is there" || fail "No /etc/pelab/logins.md: ansible-playbook site.yml -K --tags workspaces"

# ---------------------------------------------------------------- Gitea
section "Gitea"
GU=$(kc -n gitea get secret gitea-admin -o jsonpath='{.data.username}' 2>/dev/null | base64 -d)
GP=$(kc -n gitea get secret gitea-admin -o jsonpath='{.data.password}' 2>/dev/null | base64 -d)
GAPI="https://gitea.$DOMAIN/api/v1"
gitea() { http_get -u "$GU:$GP" "$GAPI$1"; }
if [ -z "$GP" ] || [ "$(http_code -u "$GU:$GP" "$GAPI/user")" != 200 ]; then
  fail "Cannot sign in to the Gitea API as the admin: is Gitea up? (see Web addresses above)"
else
  pass "Gitea API answers, admin login works"
  for u in student01 reviewer platform-approver; do
    [ "$(http_code -u "$GU:$GP" "$GAPI/users/$u")" = 200 ] && pass "Account $u exists" || warn "No account $u (fine if this lab uses other names)"
  done
  for r in golden-path pipeline-templates catalog environments policies handbook; do
    info=$(gitea "/repos/platform/$r")
    if [ -z "$(echo "$info" | json 'print(d["name"])')" ]; then fail "Repository platform/$r is missing: ansible-playbook site.yml -K --tags golden_path"
    elif [ "$(echo "$info" | json 'print(d["empty"])')" = True ]; then fail "Repository platform/$r is empty: ansible-playbook site.yml -K --tags golden_path"
    else pass "Repository platform/$r"; fi
  done
  [ "$(gitea /repos/platform/golden-path | json 'print(d["template"])')" = True ] && pass "platform/golden-path is a template" || fail "platform/golden-path is not marked as a template"
  runners=$(gitea "/admin/actions/runners" | json 'rs=d.get("runners",d) if isinstance(d,dict) else d; print("\n".join(r["name"]+"|"+str(r.get("status","")) for r in rs))')
  [ -n "$runners" ] || fail "No pipeline runner registered: ansible-playbook site.yml -K --tags runners"
  while IFS='|' read -r name status; do
    [ -z "$name" ] && continue
    [ "$status" = online ] || [ "$status" = idle ] || [ "$status" = active ] && pass "Runner $name is $status" || fail "Runner $name is ${status:-unknown}: sudo lxc exec $name -- systemctl status gitea-runner"
  done <<< "$runners"
  TEAMS=$(gitea "/orgs?limit=50" | json 'print("\n".join(o["username"] for o in d if o["username"].startswith("team")))')
  [ -n "$TEAMS" ] || fail "No team organisations in Gitea: ansible-playbook site.yml -K --tags golden_path"
  for t in $TEAMS; do
    [ "$(http_code -u "$GU:$GP" "$GAPI/repos/$t/hello")" = 200 ] && pass "$t/hello exists" || { fail "$t/hello is missing"; continue; }
    [ "$(gitea "/repos/$t/hello/branch_protections" | json 'print(len(d))')" -ge 1 ] 2>/dev/null && pass "$t/hello main is protected" || fail "$t/hello main is not protected: ansible-playbook site.yml -K --tags golden_path"
    run=$(gitea "/repos/$t/hello/actions/runs?branch=main&limit=1" | json 'r=d["workflow_runs"][0]; print(r["status"]+"|"+str(r.get("conclusion")))')
    case "$run" in
      completed\|success) pass "$t/hello: the last pipeline on main is green" ;;
      completed\|*) fail "$t/hello: the last pipeline on main is ${run#*|}: open https://gitea.$DOMAIN/$t/hello/actions" ;;
      "") warn "$t/hello: no pipeline run on main yet" ;;
      *) warn "$t/hello: the pipeline on main is still ${run%|*}; run this check again in a few minutes" ;;
    esac
  done
fi

# ---------------------------------------------------------------- Harbor
section "Harbor"
HP=$(kc -n harbor get secret harbor-admin -o jsonpath='{.data.HARBOR_ADMIN_PASSWORD}' 2>/dev/null | base64 -d)
HAPI="https://harbor.$DOMAIN/api/v2.0"
if [ -z "$HP" ] || [ "$(http_code -u "admin:$HP" "$HAPI/users/current")" != 200 ]; then
  fail "Cannot sign in to the Harbor API as admin: is Harbor up? (see Web addresses above)"
else
  pass "Harbor API answers, admin login works"
  for t in ${TEAMS:-}; do
    if [ "$(http_code -u "admin:$HP" "$HAPI/projects/$t")" = 200 ]; then
      pass "Harbor project $t"
      n=$(http_get -u "admin:$HP" "$HAPI/projects/$t/repositories/hello/artifacts?page_size=1" | json 'print(len(d))')
      [ "${n:-0}" -ge 1 ] 2>/dev/null && pass "$t/hello has an image in Harbor" || warn "$t/hello has no image in Harbor yet (its first pipeline has not pushed)"
    else fail "No Harbor project $t: ansible-playbook site.yml -K --tags golden_path"; fi
  done
  [ "$(http_code -u "admin:$HP" "$HAPI/projects/dockerhub")" = 200 ] && pass "Docker Hub cache project (dockerhub)" || warn "No dockerhub cache project in Harbor"
fi

# ---------------------------------------------------------------- Argo CD
section "Argo CD"
apps=$(kc -n argocd get applications.argoproj.io -o json 2>/dev/null | json 'print("\n".join(a["metadata"]["name"]+"|"+a.get("status",{}).get("sync",{}).get("status","?")+"|"+a.get("status",{}).get("health",{}).get("status","?") for a in d["items"]))')
[ -n "$apps" ] || fail "Argo CD has no applications: ansible-playbook site.yml -K --tags golden_path"
while IFS='|' read -r name sync health; do
  [ -z "$name" ] && continue
  if [ "$sync" = Synced ] && [ "$health" = Healthy ]; then pass "$name: Synced and Healthy"
  elif [ "$health" = Progressing ] || [ "$health" = Missing ]; then warn "$name: $sync and $health (still deploying, or the image is not built yet)"
  else fail "$name: $sync and $health: open https://argocd.$DOMAIN/applications/argocd/$name"; fi
done <<< "$apps"

# ---------------------------------------------------------------- Kyverno
section "Guardrails (Kyverno)"
pols=$(kc get clusterpolicies -o json 2>/dev/null | json 'print("\n".join(p["metadata"]["name"]+"|"+str(any(c.get("type")=="Ready" and c.get("status")=="True" for c in p.get("status",{}).get("conditions",[]))) for p in d["items"]))')
[ -n "$pols" ] || fail "No Kyverno policies: ansible-playbook site.yml -K --tags golden_path"
while IFS='|' read -r name ready; do
  [ -z "$name" ] && continue
  [ "$ready" = True ] && pass "Policy $name is ready" || fail "Policy $name is not ready: sudo k3s kubectl describe clusterpolicy $name"
done <<< "$pols"

# ---------------------------------------------------------------- the app
section "The hello app"
for t in ${TEAMS:-}; do
  body=$(http_get "https://hello-$t-dev.$DOMAIN/")
  env=$(echo "$body" | json 'print(d["environment"])')
  [ "$env" = dev ] && pass "https://hello-$t-dev.$DOMAIN/ answers as dev" || fail "https://hello-$t-dev.$DOMAIN/ does not answer as dev: check $t-hello-dev in Argo CD"
done

# ---------------------------------------------------------------- timers
section "Platform timers"
systemctl is-active --quiet pelab-platform-apply.timer && pass "Platform applier (pelab-platform-apply.timer) is active" || fail "The platform applier timer is not active: sudo systemctl enable --now pelab-platform-apply.timer (unless you paused it on purpose)"
systemctl is-active --quiet pelab-backup.timer && pass "Nightly backup (pelab-backup.timer) is active" || warn "The nightly backup timer is not active: ansible-playbook site.yml -K --tags backup"

# ---------------------------------------------------------------- applications and logins
secret() { kc -n "$1" get secret "$2" -o json 2>/dev/null | json "import base64; print(base64.b64decode(d['data']['$3']).decode())"; }
pw() { if $SHOW_PASSWORDS; then printf '%s' "${1:-(not found)}"; else printf '(hidden)'; fi; }
# One application: its name and address, then one line per login.
app() { printf '\n  %s%-29s%s %s\n' "$B" "$1" "$N" "$2"; }
acct() { printf '      %-20s %-28s %s\n' "$1" "$(pw "$2")" "$3"; }
none() { printf '      %s\n' "$1"; }

# The participant's logins come from the logins file the build wrote: its first
# table, | Who | User | Password | Use it for |.
LOGINS=$(sudo cat /etc/pelab/logins.md 2>/dev/null | awk '/^\| Who/ {t=1; next} t && /^\| ---/ {next} t && /^\|/ {print; next} t {exit}' | tr -d '`')
login_of() { echo "$LOGINS" | awk -F' *\\| *' -v who="$1" '$2 ~ who {print $3; exit}'; }
pass_of() { echo "$LOGINS" | awk -F' *\\| *' -v who="$1" '$2 ~ who {print $4; exit}'; }
ME=$(login_of '^You$'); ME=${ME:-student01}; ME_PW=$(pass_of '^You$')
VIEWER=$(login_of '^Read-only viewer$'); VIEWER=${VIEWER:-delegate}; VIEWER_PW=$(pass_of '^Read-only viewer$')
REVIEWER=$(login_of '^The reviewer$'); REVIEWER_PW=$(pass_of '^The reviewer$')
APPROVER=$(login_of '^The platform team$'); APPROVER_PW=$(pass_of '^The platform team$')
[ -n "$LOGINS" ] || echo "  (No /etc/pelab/logins.md, so the participant passwords are missing below.)"

section "Applications, addresses and logins"
printf '      %-20s %-28s %s\n' "User" "Password" "What for"
while read -r host; do
  [ -z "$host" ] && continue
  url="https://$host/"
  case "${host%%.*}" in
    student*) app "Workspace (editor, terminal)" "$url?folder=/home/${host%%.*}"
      acct "${host%%.*}" "$ME_PW" "you" ;;
    backstage) app "Portal (Backstage)" "$url"
      none "guest sign-in, no password" ;;
    gitea) app "Gitea (code, pipelines)" "$url"
      acct "$ME" "$ME_PW" "you"
      [ -n "$REVIEWER" ] && acct "$REVIEWER" "$REVIEWER_PW" "approves your pull requests"
      [ -n "$APPROVER" ] && acct "$APPROVER" "$APPROVER_PW" "the platform team: approves requests"
      acct "$GU" "$GP" "administrator" ;;
    harbor) app "Harbor (images, scans)" "$url"
      acct "$ME" "$ME_PW" "you"
      acct admin "$HP" "administrator" ;;
    argocd) app "Argo CD (deployments)" "$url"
      acct "$VIEWER" "$VIEWER_PW" "read-only, for participants"
      acct admin "$(secret argocd argocd-initial-admin-secret password)" "administrator" ;;
    grafana) app "Grafana (dashboards, logs)" "$url"
      acct "$VIEWER" "$VIEWER_PW" "Viewer, for participants"
      acct "$(secret monitoring grafana-admin admin-user)" "$(secret monitoring grafana-admin admin-password)" "administrator" ;;
    prometheus) app "Prometheus" "$url"
      acct "$VIEWER" "$VIEWER_PW" "the browser asks" ;;
    alertmanager) app "Alertmanager" "$url"
      acct "$VIEWER" "$VIEWER_PW" "the browser asks" ;;
    keycloak) app "Keycloak" "$url"
      acct "$(secret keycloak keycloak-admin username)" "$(secret keycloak keycloak-admin password)" "administrator" ;;
    sonarqube) app "SonarQube" "$url"
      acct admin "$(secret sonarqube sonarqube-admin password)" "administrator" ;;
    api) app "API gateway (APISIX)" "$url"
      acct "admin key" "$(secret apisix apisix-admin admin)" "header X-API-KEY, admin API only" ;;
    rollouts) app "Argo Rollouts dashboard" "$url"; none "no login (read-only)" ;;
    jaeger) app "Jaeger (traces)" "$url"; none "no login" ;;
    opencost) app "OpenCost (costs)" "$url"; none "no login" ;;
    redpanda) app "Redpanda Console" "$url"; none "no login" ;;
    hello-*) app "hello (${host%%.*})" "$url"; none "no login" ;;
    *) app "${host%%.*}" "$url" ;;
  esac
# In the order the labs use them, then the rest.
done < <(awk -F. 'BEGIN { n = split("student backstage gitea harbor argocd grafana prometheus alertmanager", o, " "); for (i = 1; i <= n; i++) r[o[i]] = i }
  { k = $1; sub(/[0-9]+$/, "", k); print (k in r ? r[k] : 99) " " $0 }' "$HOSTS_FILE" | sort -n -k1,1 -k2 | cut -d' ' -f2)
rm -f "$HOSTS_FILE"
echo
echo "  Passwords are lab-only: never use them anywhere else."

# ---------------------------------------------------------------- summary
printf '\n%s== Summary%s\n  %s%d passed%s, %s%d warnings%s, %s%d failed%s\n' "$B" "$N" "$G" "$PASS" "$N" "$Y" "$WARN" "$N" "$R" "$FAIL" "$N"
if [ "$FAIL" -eq 0 ]; then
  echo "  The lab is ready. Your own logins again at any time: cat /etc/pelab/logins.md"
else
  echo "  Fix the failures above (each says how), or run the build again: cd $SETUP_DIR && ansible-playbook site.yml"
  echo "  Pods that were still starting are often fine two minutes later: run this check again first."
fi
exit "$FAIL"
