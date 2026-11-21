#!/usr/bin/env bash
# Runs the Maestro suite on a booted emulator and keeps logcat for debugging.
# Usage: scripts/e2e-ci.sh <font-scale>
set -u
adb install -r apk/app-release.apk
adb shell settings put system font_scale "${1:-1.0}"
adb logcat -c
adb logcat -v time > logcat.txt &
LOGCAT_PID=$!
maestro test .maestro --format junit --output maestro-report.xml --test-output-dir maestro-out
STATUS=$?
kill "$LOGCAT_PID" 2>/dev/null
grep -E "ReactNativeJS|AndroidRuntime|FATAL|ErrorBoundary" logcat.txt > logcat-app.txt || true
echo "---- app log (last 80 lines) ----"
tail -80 logcat-app.txt
exit "$STATUS"
