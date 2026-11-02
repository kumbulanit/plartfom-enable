#!/usr/bin/env bash
# Installs everything the lab build needs on a fresh Ubuntu 24.04 VM: Ansible
# (with passlib and bcrypt), git and tmux, the course project, and its Ansible
# collections. Safe to run again.
#
# From a copy of the project:
#   bash ~/sarb/prelab-setup/install-prerequisites.sh
# Before you have a copy (the script clones it into ~/sarb):
#   bash install-prerequisites.sh <repository address>
#
# Add --build to start the build straight away, inside tmux:
#   bash ~/sarb/prelab-setup/install-prerequisites.sh --build
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
[ "$(id -u)" -ne 0 ] || fail "Run this as your own user, not as root (no sudo in front). It asks for your sudo password when it needs it."
. /etc/os-release
[ "${ID:-}" = ubuntu ] || fail "This VM runs ${PRETTY_NAME:-an unknown system}; the lab needs Ubuntu 24.04."
[ "${VERSION_ID:-}" = 24.04 ] || echo "WARNING: this is Ubuntu ${VERSION_ID:-?}; the lab is built and tested on 24.04."

# 1. Packages and Ansible
step "Installing pipx, git and tmux (asks for your sudo password)"
sudo apt-get update -q
sudo apt-get install -y -q pipx git tmux

export PATH="$HOME/.local/bin:$PATH"
step "Installing Ansible with pipx"
if pipx list --short 2>/dev/null | grep -q '^ansible '; then
  echo "Ansible is already installed."
else
  pipx install --include-deps ansible
fi
pipx inject ansible passlib bcrypt
pipx ensurepath >/dev/null
ansible --version | head -1

# 2. The course project
SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SELF_DIR/site.yml" ]; then
  SETUP="$SELF_DIR"
  step "Using the project in $(dirname "$SETUP")"
elif [ -f "$HOME/sarb/prelab-setup/site.yml" ]; then
  SETUP="$HOME/sarb/prelab-setup"
  step "Using the project already in ~/sarb"
else
  [ -n "$REPO" ] || fail "No copy of the project found. Run it again with the repository address: bash $0 <repository address>"
  step "Copying the project into ~/sarb"
  git clone "$REPO" "$HOME/sarb"
  SETUP="$HOME/sarb/prelab-setup"
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
