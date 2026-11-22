#!/usr/bin/env bash
# Runs the screenshot tour in English and Hindi and collects the PNGs into screenshots/.
set -u
adb install -r apk/app-release.apk
adb shell settings put system font_scale 1.0
# Clean status bar: fixed clock, full battery and signal, no notifications.
adb shell settings put global sysui_demo_allowed 1
adb shell am broadcast -a com.android.systemui.demo -e command enter >/dev/null
adb shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm 0930 >/dev/null
adb shell am broadcast -a com.android.systemui.demo -e command battery -e level 100 -e plugged false >/dev/null
adb shell am broadcast -a com.android.systemui.demo -e command network -e mobile show -e level 4 -e datatype lte >/dev/null
adb shell am broadcast -a com.android.systemui.demo -e command notifications -e visible false >/dev/null
mkdir -p screenshots
STATUS=0
for LANG_CODE in en hi; do
  maestro test .maestro-screens/tour.yaml -e APP_LANG="$LANG_CODE" --test-output-dir "maestro-out-$LANG_CODE" || STATUS=1
done
# Maestro writes takeScreenshot files to the working directory; failure shots go to the output dirs.
find . -maxdepth 1 -name '*.png' -exec mv {} screenshots/ \;
ls -1 screenshots
exit "$STATUS"
