#!/bin/bash
# usage: render.sh out.png [pdf]
cd "$(dirname "$0")"
C="/c/Program Files/Google/Chrome/Application/chrome.exe"
W="$(cygpath -w "$PWD")"
URL="file:///$(cygpath -m "$PWD")/master2.html"
"$C" --headless=new --disable-gpu --allow-file-access-from-files --hide-scrollbars --force-device-scale-factor=${SCALE:-1} --window-size=2245,1587 --virtual-time-budget=20000 --screenshot="$W\\$1" "$URL" 2>/dev/null
if [ -n "$2" ]; then "$C" --headless=new --disable-gpu --allow-file-access-from-files --no-pdf-header-footer --virtual-time-budget=20000 --print-to-pdf="$2" "$URL" 2>/dev/null; fi
ls -la "$1" $2
