#!/usr/bin/env bash
# Grim Browser — Linux installer (any distro)
# Usage:  curl -fsSL https://grimbrowser.netlify.app/install.sh | bash
set -e

# ⚙️ EDIT THIS to your GitHub repo once it's up:
REPO="https://github.com/GrimTools/GrimBrowser.git"
DIR="$HOME/GrimBrowser"

echo ""
echo "  ✦ Installing Grim Browser…"
echo ""

# check requirements
if ! command -v git >/dev/null 2>&1; then
  echo "  ✗ git is not installed. Install it first (e.g. 'sudo apt install git')."
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "  ✗ Node.js / npm is not installed. Get it at https://nodejs.org (or your package manager)."
  exit 1
fi

# clone or update
if [ -d "$DIR/.git" ]; then
  echo "  ↻ Grim already exists — updating…"
  git -C "$DIR" pull --ff-only
else
  git clone --depth 1 "$REPO" "$DIR"
fi

cd "$DIR"
echo "  ⬇ Installing dependencies…"
npm install --omit=dev

echo ""
echo "  ✅ Grim installed to: $DIR"
echo "     Launch it with:    cd $DIR && npm start"
echo ""
