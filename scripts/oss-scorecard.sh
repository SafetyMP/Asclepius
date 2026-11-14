#!/usr/bin/env bash
# Optional OpenSSF Scorecard report for the committed Asclepius source tree.
# Requires: scorecard, git, tar, python3. Does not scan uncommitted changes.
# Usage: ./scripts/oss-scorecard.sh [--json]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

JSON=0
case "${1:-}" in
  "") ;;
  --json) JSON=1 ;;
  *) echo "Usage: $0 [--json]" >&2; exit 2 ;;
esac
if [[ $# -gt 1 ]]; then
  echo "Usage: $0 [--json]" >&2
  exit 2
fi

if ! command -v scorecard >/dev/null 2>&1; then
  echo "scorecard CLI not found. Installation: https://github.com/ossf/scorecard#installation" >&2
  exit 1
fi
if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required to format the report." >&2
  exit 1
fi

COMMIT="$(git rev-parse HEAD)"
WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/asclepius-scorecard.XXXXXX")"
trap 'rm -rf "$WORK_DIR"' EXIT
mkdir "$WORK_DIR/tree"
git archive "$COMMIT" >"$WORK_DIR/source.tar"
tar -xf "$WORK_DIR/source.tar" -C "$WORK_DIR/tree"
scorecard --local="$WORK_DIR/tree" --format=json >"$WORK_DIR/scorecard.json"

python3 - "$WORK_DIR/scorecard.json" "$COMMIT" "$JSON" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as source:
    scorecard = json.load(source)

scope = (
    "Local scan of the committed git archive; excludes uncommitted changes. "
    "Local checks do not establish hosted repository security, clinical safety, "
    "FHIR conformance, or project value."
)
report = {
    "repository": "SafetyMP/Asclepius",
    "commit": sys.argv[2],
    "scan_mode": "committed_git_archive",
    "scope": scope,
    "scorecard": scorecard,
}

if sys.argv[3] == "1":
    print(json.dumps(report, indent=2))
else:
    print("Asclepius — optional local OpenSSF Scorecard report")
    print(f"Commit: {report['commit']}")
    print(scope)
    print(f"Local Scorecard score: {scorecard.get('score', 'not reported')}")
    for check in sorted(scorecard.get("checks", []), key=lambda item: item["name"]):
        print(f"  {check['name']}: {check.get('score', 'not reported')}")
        if check.get("reason"):
            print(f"    {check['reason']}")
PY
