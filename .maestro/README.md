# End-to-end tests (Maestro)

Black-box UI flows for the Android app (`appId: in.khaosahi.app`). Every flow starts from a fresh
install (`launchApp` with `clearState: true`) and onboards through `subflows/onboard.yaml`.

| Flow                      | What it checks                                                  |
| ------------------------- | --------------------------------------------------------------- |
| `01-onboarding.yaml`      | Language → intro → disclaimer → consent → 18+ → profile → Today |
| `02-food-search.yaml`     | Search "rajma" and "राजमा" → food detail with a rating          |
| `03-today-checklist.yaml` | Tick a checklist item on Today; it stays ticked after a restart |
| `04-log-uric-acid.yaml`   | Log a uric acid value in Progress                               |
| `05-change-language.yaml` | Switch to Hindi in Settings and back, without restarting        |
| `06-delete-all-data.yaml` | Settings → Delete all data → back to onboarding                 |

## Install Maestro

Requires Java 17+ and an Android emulator or a device with USB debugging enabled.

```sh
# macOS / Linux / WSL / Git Bash
curl -fsSL "https://get.maestro.mobile.dev" | bash
maestro --version
```

On Windows, Maestro runs best from WSL2 (use the Windows `adb` server, or install the Android
platform tools inside WSL). See the official Maestro docs for details.

## Run

```sh
npm run android            # build and install a debug build on the emulator/device
maestro test .maestro      # run every flow (order from .maestro/config.yaml)
maestro test .maestro/02-food-search.yaml   # run one flow
maestro studio             # inspect the screen and try selectors interactively
```

The Devanagari search in `02-food-search.yaml` needs a Maestro version whose Android `inputText`
supports non-ASCII text. If yours does not, run that flow with the English part only.

## Selectors

Flows prefer visible English text from `src/shared/i18n/en.json` and a few `testID`s
(`open-settings`, and the optional `food-search`, `progress-add`, `progress-value`). Text selectors
are regular expressions, so several flows accept alternatives such as `'Save|Continue'`. The
assumptions each flow makes are listed in comments at the top of the file; update them when a
screen's labels change.
