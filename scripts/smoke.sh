#!/usr/bin/env bash
set -euo pipefail

SMOKE_URL="${1:-https://delphi-atlas.vercel.app}"
SMOKE_URL="${SMOKE_URL%/}"

FAILED=0

check_route() {
  local path="$1"
  local expected="$2"
  local url="${SMOKE_URL}${path}"

  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")

  case "$expected" in
    exact-200)
      if [ "$status" -eq 200 ]; then
        echo "PASS  $path  ($status)"
      else
        echo "FAIL  $path  ($status)"
        FAILED=1
      fi
      ;;
    200-or-redirect)
      if [ "$status" -eq 200 ] || [ "$status" -eq 301 ] || [ "$status" -eq 302 ] || [ "$status" -eq 307 ] || [ "$status" -eq 308 ]; then
        echo "PASS  $path  ($status)"
      else
        echo "FAIL  $path  ($status)"
        FAILED=1
      fi
      ;;
    auth-login)
      if [ "$status" -eq 200 ] || [ "$status" -eq 301 ] || [ "$status" -eq 302 ] || [ "$status" -eq 307 ] || [ "$status" -eq 308 ]; then
        echo "PASS  $path  ($status)"
      else
        echo "FAIL  $path  ($status)"
        FAILED=1
      fi
      ;;
    health)
      if [ "$status" -eq 200 ]; then
        echo "PASS  $path  ($status)"
      elif [ "$status" -eq 404 ]; then
        echo "PASS  $path  ($status) — skipped (not deployed)"
      else
        echo "FAIL  $path  ($status)"
        FAILED=1
      fi
      ;;
    oracle-session)
      if [ "$status" -eq 200 ] || [ "$status" -eq 401 ]; then
        echo "PASS  $path  ($status)"
      else
        echo "FAIL  $path  ($status)"
        FAILED=1
      fi
      ;;
    *)
      echo "FAIL  $path  (unknown expectation: $expected)"
      FAILED=1
      ;;
  esac
}

echo "Smoking $SMOKE_URL ..."
echo ""

check_route "/"                    exact-200
check_route "/dashboard"           200-or-redirect
check_route "/voice"               200-or-redirect
check_route "/analytics"           200-or-redirect
check_route "/admin/bugs"          200-or-redirect
check_route "/api/auth/x/login"    auth-login
check_route "/api/health"          health
check_route "/api/oracle/session"  oracle-session

echo ""
if [ "$FAILED" -eq 0 ]; then
  echo "SMOKE PASSED"
  exit 0
else
  echo "SMOKE FAILED"
  exit 1
fi
