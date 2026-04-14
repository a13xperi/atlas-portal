#!/bin/bash
set -e
cd "$(dirname "$0")/.."

set +e
PLAYWRIGHT_JSON_OUTPUT_FILE=/tmp/atlas-e2e-results.json \
  npx playwright test "$@" --reporter=json 2>&1
EXIT_CODE=$?
set -e

# Summarize results
if [ -f /tmp/atlas-e2e-results.json ]; then
  python3 -c "
import json, sys
data = json.load(open('/tmp/atlas-e2e-results.json'))
total = data.get('stats', {}).get('expected', 0)
passed = data.get('stats', {}).get('expected', 0) - data.get('stats', {}).get('unexpected', 0)
failed = data.get('stats', {}).get('unexpected', 0)
print(f'E2E: {passed}/{total} passed, {failed} failed')
"
fi
exit $EXIT_CODE
