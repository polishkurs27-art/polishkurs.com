#!/bin/sh
# Renders tools/og.html to src/assets/og.png (1200x630) with headless Chrome.
cd "$(dirname "$0")/.."
out="$PWD/src/assets/og.png"
rm -f "$out"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=4000 \
  --user-data-dir="${TMPDIR:-/tmp}/polishkurs-og-chrome" \
  --screenshot="$out" "file://$PWD/tools/og.html" >/dev/null 2>&1 &
pid=$!
# Chrome does not always exit after saving the screenshot, so stop it once the file is there.
for _ in $(seq 40); do [ -s "$out" ] && break; sleep 0.5; done
sleep 1; kill "$pid" 2>/dev/null
[ -s "$out" ] && echo "wrote $out" || { echo "failed to render og.png" >&2; exit 1; }
