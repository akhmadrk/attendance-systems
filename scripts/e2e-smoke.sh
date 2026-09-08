#!/usr/bin/env bash
# End-to-end smoke test for the Employee WFH Attendance system.
# Exercises the full critical flow:
#   Employee update -> Primary DB -> RabbitMQ -> Audit DB -> Socket.IO
# plus auth, attendance, and HRD admin endpoints.
#
# Prerequisites:
#   - docker-compose infra running: docker compose -f docker/docker-compose.yml up -d
#   - migrations + seed applied
#   - all three services running (auth:3000, attendance:3001, audit:3002)
#
# Usage: bash scripts/e2e-smoke.sh

set -euo pipefail

AUTH_BASE="${AUTH_BASE:-http://localhost:3000/api/v1}"
ATT_BASE="${ATT_BASE:-http://localhost:3001/api/v1}"
AUDIT_BASE="${AUDIT_BASE:-http://localhost:3002/api/v1}"

PASS=0
FAIL=0

check() {
  local name="$1"
  local condition="$2"
  local detail="${3:-}"
  if [ "$condition" = "true" ]; then
    echo "  ✓ $name"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $name $detail"
    FAIL=$((FAIL + 1))
  fi
}

echo "== 1. Authentication =="

LOGIN=$(curl -s -X POST "$AUTH_BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"employee1@company.com","password":"Employee123!"}')
ACCESS=$(echo "$LOGIN" | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["accessToken"])' 2>/dev/null || echo "")
check "employee login returns access token" "$([ -n "$ACCESS" ] && echo true || echo false)"

REFRESH=$(echo "$LOGIN" | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["refreshToken"])' 2>/dev/null || echo "")
check "employee login returns refresh token" "$([ -n "$REFRESH" ] && echo true || echo false)"

BAD=$(curl -s -X POST "$AUTH_BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"employee1@company.com","password":"wrongpass"}')
check "invalid password returns 401" "$(echo "$BAD" | grep -q '"statusCode":401' && echo true || echo false)"

ADMIN_LOGIN=$(curl -s -X POST "$AUTH_BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@company.com","password":"Admin123!"}')
ADMIN_ACCESS=$(echo "$ADMIN_LOGIN" | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["accessToken"])' 2>/dev/null || echo "")
check "admin login returns access token" "$([ -n "$ADMIN_ACCESS" ] && echo true || echo false)"

echo "== 2. Attendance (clock in/out business rules) =="

DUP1=$(curl -s -X POST "$ATT_BASE/attendance/clock-in" \
  -H "Authorization: Bearer $ACCESS")
check "clock-in succeeds (201)" "$(echo "$DUP1" | grep -q '"statusCode":201' && echo true || echo false)"

DUP2=$(curl -s -X POST "$ATT_BASE/attendance/clock-in" \
  -H "Authorization: Bearer $ACCESS")
check "duplicate clock-in rejected (409)" "$(echo "$DUP2" | grep -q '"statusCode":409' && echo true || echo false)"

OUT=$(curl -s -X POST "$ATT_BASE/attendance/clock-out" \
  -H "Authorization: Bearer $ACCESS")
check "clock-out succeeds" "$(echo "$OUT" | grep -q '"statusCode":200' && echo true || echo false)"

SUMMARY=$(curl -s "$ATT_BASE/attendance/summary" \
  -H "Authorization: Bearer $ACCESS")
check "summary returns records" "$(echo "$SUMMARY" | grep -q '"statusCode":200' && echo true || echo false)"

echo "== 3. Profile update -> event flow =="

PHONE="+6289$(date +%s | tail -c 8)"
UPDATE=$(curl -s -X PUT "$AUTH_BASE/profile" \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d "{\"phoneNumber\":\"$PHONE\"}")
check "profile update succeeds" "$(echo "$UPDATE" | grep -q '"statusCode":200' && echo true || echo false)"

# Poll the audit DB for the profile-change log (async via RabbitMQ).
echo "  waiting for audit log (async)..."
AUDIT_FOUND="false"
for i in $(seq 1 10); do
  LOGS=$(curl -s "$AUDIT_BASE/admin/audit-logs?limit=10" \
    -H "Authorization: Bearer $ADMIN_ACCESS")
  if echo "$LOGS" | grep -q "$PHONE"; then
    AUDIT_FOUND="true"
    break
  fi
  sleep 1
done
check "audit log written asynchronously" "$AUDIT_FOUND"

echo "== 4. HRD admin endpoints =="

EMP_LIST=$(curl -s "$ATT_BASE/admin/employees?limit=5" \
  -H "Authorization: Bearer $ADMIN_ACCESS")
check "admin employee list paginated" "$(echo "$EMP_LIST" | grep -q '"meta"' && echo true || echo false)"

EMP_DENIED=$(curl -s "$ATT_BASE/admin/employees" -H "Authorization: Bearer $ACCESS")
check "employee blocked from admin (403)" "$(echo "$EMP_DENIED" | grep -q '"statusCode":403' && echo true || echo false)"

echo ""
echo "== E2E Smoke Result: $PASS passed, $FAIL failed =="
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
