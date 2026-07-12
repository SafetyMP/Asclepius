#!/usr/bin/env bash
# Local OpenSSF Scorecard + portfolio comparison for Asclepius.
# Requires: scorecard (brew install scorecard), python3, curl
#
# Usage: ./scripts/oss-scorecard.sh [--json]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

JSON=0
if [[ "${1:-}" == "--json" ]]; then
  JSON=1
fi

if ! command -v scorecard >/dev/null 2>&1; then
  echo "scorecard CLI not found — install with: brew install scorecard" >&2
  exit 1
fi

# Score committed + staged tree without node_modules/dist (CI-like).
SCAN_DIR="$(mktemp -d)"
trap 'rm -rf "$SCAN_DIR"' EXIT

git archive HEAD | tar -x -C "$SCAN_DIR"
# Include uncommitted OSS files when adding scorecard locally before commit.
for f in .github/workflows/scorecard.yml scripts/oss-scorecard.sh; do
  if [[ -f "$ROOT/$f" ]]; then
    mkdir -p "$SCAN_DIR/$(dirname "$f")"
    cp "$ROOT/$f" "$SCAN_DIR/$f"
  fi
done

LOCAL_JSON="$(mktemp)"
trap 'rm -rf "$SCAN_DIR"; rm -f "$LOCAL_JSON"' EXIT

scorecard --local="$SCAN_DIR" --format=json >"$LOCAL_JSON"

python3 - "$ROOT" "$LOCAL_JSON" "$JSON" <<'PY'
import json
import subprocess
import sys
from pathlib import Path

root = Path(sys.argv[1])
local_path = sys.argv[2]
json_out = int(sys.argv[3])

with open(local_path) as f:
    local = json.load(f)

peers = [
    "SafetyMP/FidusGate",
    "SafetyMP/Digital-Twin-Compliance",
    "SafetyMP/Autonomous-EHS-Management",
    "SafetyMP/Asclepius",
]

peer_scores: dict[str, float | None] = {}
for repo in peers:
    url = f"https://api.scorecard.dev/projects/github.com/{repo}"
    try:
        raw = subprocess.check_output(
            ["curl", "-fsSL", url],
            text=True,
            timeout=20,
            stderr=subprocess.DEVNULL,
        )
        data = json.loads(raw)
        peer_scores[repo] = data.get("score")
    except Exception:
        peer_scores[repo] = None

commits = int(
    subprocess.check_output(["git", "rev-list", "--count", "HEAD"], cwd=root, text=True).strip()
)
test_files = {
    p
    for p in root.rglob("*.test.ts")
    if "node_modules" not in p.parts
}
src_files = [
    p
    for p in (root / "src").rglob("*.ts")
    if p.is_file() and ".test." not in p.name
]
loc = sum(
    len(p.read_text(encoding="utf-8", errors="replace").splitlines()) for p in src_files
)

local_score = local.get("score")
peer_published = [s for s in peer_scores.values() if s is not None]
peer_avg = sum(peer_published) / len(peer_published) if peer_published else None

# Conservative senior-week estimate from LOC + test surface (reference impl).
weeks_low = max(2, round(loc / 2500))
weeks_high = max(weeks_low, round(loc / 1800))
usd_low = weeks_low * 7500
usd_high = weeks_high * 10000

validated = (
    local_score is not None
    and peer_avg is not None
    and local_score >= peer_avg + 2
    and len(test_files) >= 20
)

report = {
    "repo": "SafetyMP/Asclepius",
    "local_scorecard": {
        "score": local_score,
        "scan_mode": "git_archive_without_node_modules",
        "checks": {c["name"]: c["score"] for c in local.get("checks", [])},
    },
    "peer_scores_api": peer_scores,
    "peer_average_published": peer_avg,
    "engineering": {
        "commits": commits,
        "src_ts_files": len(src_files),
        "src_loc": loc,
        "test_files": len(test_files),
    },
    "value_estimate": {
        "senior_weeks_low": weeks_low,
        "senior_weeks_high": weeks_high,
        "usd_low": usd_low,
        "usd_high": usd_high,
        "validated": validated,
    },
}

if json_out:
    print(json.dumps(report, indent=2))
else:
    print("== Asclepius OSS scorecard ==")
    print()
    print(f"Local OpenSSF score (CI-like tree): {local_score}")
    if peer_avg is not None:
        print(f"Portfolio peer average (published): {peer_avg:.1f}")
        print(f"Delta vs peers: {local_score - peer_avg:+.1f}")
    print()
    print("Local checks:")
    for name, score in sorted(report["local_scorecard"]["checks"].items()):
        print(f"  {name}: {score}")
    print()
    print("Published peer scores (api.scorecard.dev):")
    for repo, score in sorted(report["peer_scores_api"].items()):
        label = f"{score:.1f}" if score is not None else "not published yet"
        print(f"  {repo}: {label}")
    print()
    e = report["engineering"]
    print("Engineering metrics:")
    print(f"  commits: {e['commits']}")
    print(f"  src TypeScript files: {e['src_ts_files']}")
    print(f"  src LOC (approx): {e['src_loc']}")
    print(f"  test files: {e['test_files']}")
    print()
    v = report["value_estimate"]
    verdict = "supports" if v["validated"] else "inconclusive"
    print(
        f"Value estimate (${v['usd_low']:,}–${v['usd_high']:,} / "
        f"{v['senior_weeks_low']}–{v['senior_weeks_high']} senior weeks): {verdict}"
    )
PY
