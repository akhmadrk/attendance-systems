# API Reference

Base path: `/api/v1` (all services). Auth via `Authorization: Bearer <accessToken>`.

## Response envelopes

**Success**
```json
{ "statusCode": 200, "data": {} }
```

**Paginated**
```json
{ "statusCode": 200, "data": [], "meta": { "page": 1, "limit": 10, "total": 150, "totalPages": 15 } }
```

**Error**
```json
{ "statusCode": 400, "error": "BAD_REQUEST", "message": "Validation failed", "details": [{ "field": "email", "message": "Invalid email format" }] }
```

---

## Authentication (`auth-service` :3000)

| Method | Path | Auth | Description |
|:---|:---|:---|:---|
| POST | `/auth/login` | — | Login, returns access + refresh token + user |
| POST | `/auth/refresh` | — | Rotate tokens (body: `refreshToken`) |
| POST | `/auth/logout` | ✅ | Invalidate refresh token |

## Profile (`auth-service` :3000)

| Method | Path | Auth | Description |
|:---|:---|:---|:---|
| GET | `/profile` | ✅ | Current employee profile |
| PUT | `/profile` | ✅ | Update phone / password; `multipart` for photo |

**PUT body (JSON):** `{ phoneNumber?, currentPassword?, newPassword? }`
**PUT photo:** `multipart/form-data` field `photo` (JPG/PNG/WEBP, ≤2MB).
Requires `currentPassword` when changing `newPassword`.

## Attendance (`attendance-service` :3001)

| Method | Path | Auth | Description |
|:---|:---|:---|:---|
| POST | `/attendance/clock-in` | ✅ (EMPLOYEE) | Clock in for today (Jakarta) |
| POST | `/attendance/clock-out` | ✅ (EMPLOYEE) | Clock out for today |
| GET | `/attendance/summary?from=&to=` | ✅ (EMPLOYEE) | Attendance list (max 90-day range) |

## HRD Admin — Employees (`attendance-service` :3001)

| Method | Path | Auth | Description |
|:---|:---|:---|:---|
| GET | `/admin/employees?page=&limit=&search=` | HRD | Paginated list, search by name/email/position |
| POST | `/admin/employees` | HRD | Create (name, email, position, password, phone) |
| PUT | `/admin/employees/:id` | HRD | Update fields, role, status, reset password |
| DELETE | `/admin/employees/:id` | HRD | Soft-deactivate (status → INACTIVE) |

## HRD Admin — Attendance (`attendance-service` :3001)

| Method | Path | Auth | Description |
|:---|:---|:---|:---|
| GET | `/admin/attendances?userId=&from=&to=&status=&page=&limit=` | HRD | Read-only global view |
| GET | `/admin/attendances/export?userId=&from=&to=` | HRD | CSV download |

## HRD Admin — Audit Logs (`audit-service` :3002)

| Method | Path | Auth | Description |
|:---|:---|:---|:---|
| GET | `/admin/audit-logs?userId=&from=&to=&page=&limit=` | HRD | Profile-change audit logs (password fields masked) |

## Health

| Method | Path | Description |
|:---|:---|:---|
| GET | `/health` | Service health (DB status) — all services |

---

## HTTP status codes

| Code | Usage |
|:---|:---|
| 200 | GET/PUT success |
| 201 | POST resource created |
| 204 | DELETE (deactivate) success |
| 400 | Validation / business-rule violation (e.g. clock-out before clock-in) |
| 401 | Missing/invalid/expired token, or account locked/inactive |
| 403 | Authenticated but wrong role |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, duplicate clock-in) |
| 500 | Internal error |
