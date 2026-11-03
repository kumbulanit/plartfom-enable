#!/usr/bin/env bash
# Installs everything the lab build needs on a fresh Ubuntu VM (22.04 or later): Ansible
# (with passlib and bcrypt), git and tmux, the course project, and its Ansible
# collections. Safe to run again.
#
# From a copy of the project:
#   bash ~/plartfom-enable/prelab-setup/install-prerequisites.sh
# Before you have a copy (the script clones it into ~/plartfom-enable):
#   bash install-prerequisites.sh <repository address>
#
# Add --build to start the build straight away, inside tmux:
#   bash ~/plartfom-enable/prelab-setup/install-prerequisites.sh --build
set -euo pipefail

REPO=""
BUILD=false
for arg in "$@"; do
  case "$arg" in
    --build) BUILD=true ;;
    -h | --help) sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) REPO="$arg" ;;
  esac
done

step() { printf '\n==> %s\n' "$*"; }
fail() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

# 0. The right machine and user
[ "$(id -u)" -ne 0 ] || fail "Run this as your own user, not as root (no sudo in front). It asks for your sudo password only if sudo needs one."
. /etc/os-release
[ "${ID:-}" = ubuntu ] || fail "This VM runs ${PRETTY_NAME:-an unknown system}; the lab needs Ubuntu 22.04 or later."
dpkg --compare-versions "${VERSION_ID:-0}" ge 22.04 || fail "This is Ubuntu ${VERSION_ID:-?}; the lab needs Ubuntu 22.04 or later."
[ "${VERSION_ID:-}" = 24.04 ] || echo "Note: this is Ubuntu ${VERSION_ID}; the lab is built and tested on 24.04, and works on 22.04 and later."

# The collections need ansible-core 2.18 or later, which needs Python 3.11 or later.
# Ubuntu 22.04's default Python is 3.10, so Ansible gets Python 3.11 there.
PY_PKGS=()
PIPX_PY=()
if ! python3 -c 'import sys; sys.exit(sys.version_info < (3, 11))' 2>/dev/null; then
  PY_PKGS=(python3.11 python3.11-venv)
  PIPX_PY=(--python python3.11)
fi

# 1. Packages and Ansible
step "Installing pipx, git and tmux (with sudo)"
sudo apt-get update -q
sudo apt-get install -y -q pipx git tmux ${PY_PKGS[@]+"${PY_PKGS[@]}"}

export PATH="$HOME/.local/bin:$PATH"
step "Installing Ansible with pipx"
# pipx keeps Ansible in its own folder: ~/.local/pipx (pipx 1.0, Ubuntu 22.04) or
# ~/.local/share/pipx (later pipx).
ANSIBLE_PY=""
for d in "$HOME/.local/pipx/venvs/ansible" "$HOME/.local/share/pipx/venvs/ansible"; do
  [ -x "$d/bin/python" ] && ANSIBLE_PY="$d/bin/python"
done
# An Ansible on a Python older than 3.11 (Ubuntu 22.04's default) is too old: replace it.
if [ -n "$ANSIBLE_PY" ] && ! "$ANSIBLE_PY" -c 'import sys; sys.exit(sys.version_info < (3, 11))'; then
  echo "The installed Ansible runs on $("$ANSIBLE_PY" -V), too old for the lab: replacing it."
  pipx uninstall ansible
  ANSIBLE_PY=""
fi
if [ -n "$ANSIBLE_PY" ]; then
  echo "Ansible is already installed."
else
  pipx install --include-deps ${PIPX_PY[@]+"${PIPX_PY[@]}"} ansible
fi
# passlib 1.7.4 (the last release) fails with bcrypt 4.1 and later ("password cannot
# be longer than 72 bytes"), so bcrypt stays on 4.0. runpip, not inject: inject
# leaves an already-injected bcrypt 5 where it is.
pipx inject ansible passlib bcrypt
pipx runpip ansible install -q 'bcrypt<4.1'
pipx ensurepath >/dev/null
ansible --version | head -1

# 2. The course project
SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SELF_DIR/site.yml" ]; then
  SETUP="$SELF_DIR"
  step "Using the project in $(dirname "$SETUP")"
elif [ -f "$HOME/plartfom-enable/prelab-setup/site.yml" ]; then
  SETUP="$HOME/plartfom-enable/prelab-setup"
  step "Using the project already in ~/plartfom-enable"
else
  [ -n "$REPO" ] || fail "No copy of the project found. Run it again with the repository address: bash $0 <repository address>"
  step "Copying the project into ~/plartfom-enable"
  git clone "$REPO" "$HOME/plartfom-enable"
  SETUP="$HOME/plartfom-enable/prelab-setup"
fi

step "Installing the Ansible collections"
cd "$SETUP"
ansible-galaxy collection install -r requirements.yml

# 3. The build, or what to type next
if $BUILD; then
  step "Starting the build in tmux (session 'build'). If your connection drops: tmux attach -t build"
  exec tmux new-session -A -s build "cd '$SETUP' && ansible-playbook site.yml -K; echo; echo 'The build stopped. Read the lines above, then press Enter to close.'; read -r _"
fi

cat <<EOF

All prerequisites are installed.

Next, start the build inside tmux, so a dropped connection does not stop it:

  tmux
  cd $SETUP && ansible-playbook site.yml -K

Or run this script again with --build, and it starts the build for you.
In a new terminal, Ansible is found by itself; in this one, type first:
  export PATH="\$HOME/.local/bin:\$PATH"
EOF
