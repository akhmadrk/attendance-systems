# Product Requirement Document (PRD)
## Employee WFH Attendance & HRD Monitoring System

---

## 1. Document Overview

### 1.1 Document Details
* **Document Name:** Product Requirement Document (PRD) - Employee WFH Attendance & HRD Monitoring System
* **Version:** 2.0.0
* **Date:** September 7, 2026
* **Target Audience:** Engineering Team (Frontend, Backend, DevOps), QA Team, Product Managers, Technical Reviewers / Stakeholders.
* **Changes from v1.1.0:** See [Changelog](#changelog) at end of document.

### 1.2 Tech Stack Mandate
* **Backend:** Node.js / TypeScript with **NestJS** (Microservices architecture / REST API)
* **Frontend:** **React.js** (Responsive Web Application using CSS Frameworks such as Tailwind CSS / Ant Design)
* **Database:** Primary DB: **PostgreSQL** + Separate PostgreSQL DB for Audit Logging
* **ORM:** **TypeORM** (recommended for NestJS maturity) or **Prisma** (alternative for type safety)
* **Real-time Notifications:** **Socket.IO** (WebSocket-based, via `@nestjs/websockets` and `socket.io-client`)
* **Message Queue:** **RabbitMQ** (via `@nestjs/microservices` with `amqplib`)
* **Monorepo Tooling:** **Nx** with **pnpm** workspaces
* **Containerization:** **Docker** + **docker-compose** for local development

---

## 2. Product Summary & Objectives

### 2.1 Executive Summary
The **Employee WFH Attendance & HRD Monitoring System** is a dual-application ecosystem designed to manage remote work attendance and provide HR administrators with complete oversight. The platform consists of:
1. **Employee WFH Attendance Web App:** A responsive web interface for employees to view/edit their profile, check in/out daily, and view attendance summaries.
2. **HRD Monitoring Admin Web App:** A management console for HR Personnel to manage employee records and monitor attendance submissions across the entire organization.
3. **Microservices Backend Core:** Scalable NestJS microservices handling business logic, authentication, data persistence, async message processing, and real-time alerts.

### 2.2 Objectives
* **Seamless Remote Tracking:** Enable remote employees to securely log attendance (clock in / clock out) from any mobile or desktop browser.
* **Data Security & Profile Management:** Allow employees to manage specific profile attributes (Photo, Phone Number, Password) while keeping key business attributes read-only.
* **Real-Time HR Alerts:** Notify HR administrators instantly when an employee modifies profile details.
* **Auditing & Logging:** Implement an asynchronous message queue system to log all profile change events into a dedicated audit database without blocking main API operations.
* **Scalable Microservices:** Build a decoupled architecture using NestJS microservices for independent deployment, high availability, and easy maintenance.

---

## 3. User Roles & Personas

| Role | Access Level | Primary Objectives / Responsibilities |
| :--- | :--- | :--- |
| **Employee** | Employee Web Application | Log in via corporate email/password, update personal details (photo, phone, password), clock in/out daily, view filtered attendance history. |
| **HRD Admin** | HRD Admin Web Application | Manage (CRUD) employee master data, view organization-wide attendance history in real time, receive instant notifications on employee profile changes, deactivate employee accounts. |
| **System / Service** | Microservices Architecture | Handle authentication, API endpoints, push notifications, asynchronous event queuing, and decoupled audit logging. |

---

## 4. System Architecture & Tech Stack

```
+-----------------------------------------------------------------------------------+
|                                 FRONTEND LAYER                                    |
|                                                                                   |
|   +----------------------------------+    +-----------------------------------+   |
|   |   Employee WFH Web App (React)   |    |    HRD Monitoring Web App (React) |   |
|   +----------------------------------+    +-----------------------------------+   |
+----------------------------------------+------------------------------------------+
                                         | REST API / WebSocket (Socket.IO)
                                         v
+-----------------------------------------------------------------------------------+
|                              BACKEND MICROSERVICES                                |
|                                                                                   |
|   +------------------------+  +------------------------+  +-------------------+   |
|   | Auth Service           |  | Attendance Service     |  | Audit Service     |   |
|   | (NestJS)               |  | (NestJS)               |  | (NestJS)          |   |
|   | - Authentication       |  | - Clock In/Out         |  | - Audit Logging   |   |
|   | - Profile Management   |  | - Attendance Summary   |  | - Notifications   |   |
|   +-----------+------------+  +------------------------+  +---------^---------+   |
+---------------|-----------------------------------------------------|-------------+
                |                                                     |
                | Publish Profile Change Event                        | Consume Event
                v                                                     |
+---------------------------------------------------------------------|-------------+
|                        MESSAGE QUEUE & NOTIFICATIONS                |             |
|                                                                     |             |
|   +------------------------------------+      +---------------------+---------+   |
|   | Message Queue (RabbitMQ)           |----->| Real-time Alert               |   |
|   +------------------------------------+      | (Socket.IO / WebSocket)       |   |
|                                               +---------------------+-----------+   |
+-----------------------------------------------------------------------------------+
                                                                       |
                                                                       v
+-----------------------------------------------------------------------------------+
|                                 DATABASE LAYER                                    |
|                                                                                   |
|   +------------------------------------+      +-------------------------------+   |
|   | Primary DB (PostgreSQL)            |      | Audit DB (PostgreSQL)         |   |
|   | (Users, Roles, Attendance)         |      | (Profile Audit Logs)          |   |
|   +------------------------------------+      +-------------------------------+   |
+-----------------------------------------------------------------------------------+
```

### 4.1 Technology Decisions

| Concern | Decision | Rationale |
|:---|:---|:---|
| Primary Database | PostgreSQL | ACID compliance, mature ecosystem, strong NestJS support |
| Audit Database | PostgreSQL (separate instance) | Consistency with primary DB, simpler ops than mixing DB types |
| ORM | TypeORM | Mature NestJS integration, decorator-based, migration support |
| Message Queue | RabbitMQ | Simpler setup than Kafka, sufficient for event-driven audit logging |
| Real-time | Socket.IO | Bi-directional, NestJS native support, no external service dependency |
| Monorepo | Nx + pnpm | Native NestJS support, dependency graph, caching, workspace management |
| Containerization | Docker + docker-compose | Consistent dev environment, easy service orchestration |
| Password Hashing | bcrypt (10 salt rounds) | Industry standard, well-supported in Node.js |

### 4.2 Business Timezone

**Canonical Timezone: `Asia/Jakarta` (WIB, UTC+7)**

All attendance timestamps, date calculations, and business logic MUST use this timezone.
- Server stores timestamps in UTC.
- All date comparisons and business rules convert to `Asia/Jakarta` before evaluation.
- Frontend displays times in `Asia/Jakarta` regardless of user's local timezone.

---

## 5. Detailed Functional Requirements

### 5.1 Employee WFH Attendance Web Application

#### Module 1: Authentication & Authorization
* **FR-EMP-001 (Login):** Employee must be able to log in using a combination of **Corporate Email** and **Password**.
  * **Acceptance Criteria:**
    - [ ] Valid credentials return access token + refresh token
    - [ ] Invalid credentials return 401 with generic error (no user enumeration)
    - [ ] After 5 consecutive failed attempts, account is locked for 15 minutes
    - [ ] Login response includes user profile data (name, role, photo_url)

* **FR-EMP-002 (Session Management):** The system must generate secure JWT upon login and manage token lifecycle.
  * **Acceptance Criteria:**
    - [ ] Access token expires after 1 hour
    - [ ] Refresh token expires after 7 days
    - [ ] Refresh token is stored securely (httpOnly cookie or secure storage)
    - [ ] Expired access token can be renewed via refresh endpoint
    - [ ] Logout invalidates refresh token server-side

* **FR-EMP-003 (Access Control):** Non-authenticated users attempting to access protected routes must be redirected to the login page.
  * **Acceptance Criteria:**
    - [ ] Frontend redirects to `/login` when API returns 401
    - [ ] Frontend clears stored tokens on 401
    - [ ] Protected API endpoints return 401 for missing/invalid/expired tokens

#### Module 2: Employee Profile (`Menu: Profil Karyawan`)
* **FR-EMP-004 (Profile View):** Display employee details including:
  * Employee Full Name (read-only)
  * Corporate Email (read-only)
  * Profile Photo (Avatar)
  * Employee Position / Title (read-only)
  * Phone Number
  * **Acceptance Criteria:**
    - [ ] All fields displayed correctly from database
    - [ ] Read-only fields are visually distinguished from editable fields
    - [ ] Photo displays with fallback avatar when `photo_url` is null

* **FR-EMP-005 (Profile Edit):** Employee can modify:
  * Profile Photo (Image upload with format validation: JPG, PNG, WEBP; Max 2MB).
  * Phone Number (Regex validation: `^[+]?[0-9]{10,15}$`).
  * Password (Must require current password verification + new password: min 8 chars, 1 uppercase, 1 lowercase, 1 number).
  * **Acceptance Criteria:**
    - [ ] Photo upload rejects non-JPG/PNG/WEBP files with clear error message
    - [ ] Photo upload rejects files > 2MB with clear error message
    - [ ] Phone number validates against regex before submission
    - [ ] Password change requires correct current password
    - [ ] Password change rejects weak passwords with specific validation feedback
    - [ ] Successful update returns updated profile data
    - [ ] Read-only fields (name, email, position, role) cannot be modified via API

* **FR-EMP-006 (Profile Update Event Triggering):**
  * Upon successful data update, the backend must dispatch a background event to RabbitMQ.
  * The backend must trigger an instant real-time notification to the HRD Admin app via Socket.IO.
  * **Acceptance Criteria:**
    - [ ] Event is published to RabbitMQ after successful DB update
    - [ ] API response is returned BEFORE audit log is written (non-blocking)
    - [ ] HRD admin receives Socket.IO notification within 2 seconds of profile update
    - [ ] Event payload contains: userId, changedFields (old/new values), ipAddress, userAgent, timestamp
    - [ ] Event payload NEVER contains password or password hash

#### Module 3: Attendance Logging (`Menu: Absen`)
* **FR-EMP-007 (Clock In / Clock Out Action):**
  * Employee can trigger a **"Masuk" (Clock In)** or **"Pulang" (Clock Out)** action.
  * System automatically captures:
    * Current Date (`YYYY-MM-DD`) in Asia/Jakarta timezone
    * Current Time (`HH:mm:ss`) in Asia/Jakarta timezone
    * Attendance Status (`CLOCK_IN` or `CLOCK_OUT`)
  * **Acceptance Criteria:**
    - [ ] Clock-in creates attendance record with `clock_in` timestamp
    - [ ] Clock-out updates existing record with `clock_out` timestamp
    - [ ] Server determines timestamp (not client/browser)
    - [ ] Response includes the recorded timestamp

* **FR-EMP-008 (Business Rules for Clocking):**
  * Employee cannot clock in twice on the same working date without prior clock-out.
  * Employee cannot clock out if no "Clock In" record exists for the current date.
  * **Acceptance Criteria:**
    - [ ] Duplicate clock-in returns 409 Conflict with descriptive error
    - [ ] Clock-out without clock-in returns 400 Bad Request with descriptive error
    - [ ] Database UNIQUE constraint on `(user_id, date)` prevents duplicates at DB level
    - [ ] Concurrent requests are handled safely (no race conditions)

#### Module 4: Attendance Summary (`Menu: Summary Absen`)
* **FR-EMP-009 (Default View):** Automatically load and display attendance records starting from the **first day of the current month (`YYYY-MM-01`) up to today (`YYYY-MM-DD`)**.
  * **Acceptance Criteria:**
    - [ ] Default date range is first day of current month to today
    - [ ] Records displayed in reverse chronological order (newest first)
    - [ ] Empty state shown when no records exist for the period

* **FR-EMP-010 (Date Range Filtering):** Employee can select a custom `From Date` and `To Date` and click "Cari" (Search) to filter attendance logs.
  * **Acceptance Criteria:**
    - [ ] `from` date must be <= `to` date (validation error if not)
    - [ ] Date range cannot exceed 90 days
    - [ ] Filter results replace default view
    - [ ] URL query params update to reflect current filter (shareable links)

* **FR-EMP-011 (Summary Layout Display):** Display records clearly showing:
  * Date Header (e.g., `2022-11-22`)
  * Clock-In Timestamp (e.g., `2022-11-22 08:00`)
  * Clock-Out Timestamp (e.g., `2022-11-22 17:00`)
  * **Acceptance Criteria:**
    - [ ] Each day's record is clearly separated
    - [ ] Days with only clock-in (no clock-out) show clock-out as "—" or "Not recorded"
    - [ ] Timestamps displayed in Asia/Jakarta timezone (HH:mm format)

---

### 5.2 HRD Monitoring Web Application

#### Module 1: Employee Management (`Menu: Kelola Karyawan`)
* **FR-HRD-001 (Create Employee):** HRD Admin can add new employee records (Name, Corporate Email, Position, Initial Password, Phone Number, Photo).
  * **Acceptance Criteria:**
    - [ ] All fields validated (email format, name required, position required)
    - [ ] Initial password meets complexity requirements (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
    - [ ] Duplicate email returns 409 Conflict
    - [ ] New employee created with role `EMPLOYEE` and status `ACTIVE`
    - [ ] Photo upload follows same validation as FR-EMP-005

* **FR-HRD-002 (Update Employee):** HRD Admin can edit any employee data (including reassigning position, updating email, or resetting credentials).
  * **Acceptance Criteria:**
    - [ ] HRD can modify ALL employee fields (including read-only fields for employees)
    - [ ] HRD can reset password (sets new password directly, no current password required)
    - [ ] HRD can deactivate employee (set status to `INACTIVE`)
    - [ ] Deactivated employees cannot log in
    - [ ] Email uniqueness enforced on update

* **FR-HRD-003 (Employee List):** Paginated data table with search and filtering options by name, position, or email.
  * **Acceptance Criteria:**
    - [ ] Default pagination: 10 items per page
    - [ ] Search filters by name, position, or email (case-insensitive partial match)
    - [ ] Table shows: Name, Email, Position, Role, Status, Created Date
    - [ ] Pagination metadata: current page, total pages, total records

#### Module 2: Employee Attendance Monitoring (`Menu: Monitoring Absensi`)
* **FR-HRD-004 (Read-Only Attendance View):** HRD Admin can view all attendance entries submitted across all employees.
  * **Acceptance Criteria:**
    - [ ] Shows all employees' attendance records
    - [ ] Each record shows: Employee Name, Date, Clock-In Time, Clock-Out Time
    - [ ] Records in reverse chronological order
    - [ ] Read-only — no edit/delete actions available

* **FR-HRD-005 (Global Filtering):** Filter overall attendance records by:
  * Specific Employee (dropdown/search)
  * Date Range (`From Date` - `To Date`)
  * Status (All / Clock In only / Clock Out complete / Missing Clock Out)
  * **Acceptance Criteria:**
    - [ ] Filters can be combined
    - [ ] Empty results show appropriate message
    - [ ] Default view shows today's records for all employees

* **FR-HRD-006 (Export Capabilities):** (Optional/Recommended) Ability to export filtered attendance data into CSV format.
  * **Acceptance Criteria:**
    - [ ] Export respects current active filters
    - [ ] CSV includes: Employee Name, Email, Date, Clock-In, Clock-Out
    - [ ] File downloads with descriptive filename: `attendance-export-YYYY-MM-DD.csv`

#### Module 3: Admin Real-time Alerts & Logging Notifications
* **FR-HRD-007 (Real-time Alert Popup):** When an employee updates profile data (photo, phone, or password), a popup alert / notification badge must trigger instantly in the HRD Web Console (powered by Socket.IO).
  * **Acceptance Criteria:**
    - [ ] Alert appears within 2 seconds of employee profile update
    - [ ] Alert shows: Employee name, changed field(s), timestamp
    - [ ] Alert is dismissible
    - [ ] Notification badge shows count of unread alerts
    - [ ] Alerts persist across page refresh (loaded from audit DB)

* **FR-HRD-008 (Profile Change Log Overview):** Admin can view an audit log table sourced from the separate logging database detailing profile modifications (Who changed what, previous vs. new values, timestamp).
  * **Acceptance Criteria:**
    - [ ] Table shows: Employee Name, Changed Field, Old Value, New Value, IP Address, Timestamp
    - [ ] Sorted by timestamp (newest first)
    - [ ] Paginated (10 items per page)
    - [ ] Filterable by employee name and date range
    - [ ] Password fields show "***" instead of actual values

---

## 6. Non-Functional Requirements (NFR)

### 6.1 Performance & Scalability
* **API Response Time:** 95% of REST API requests must respond within < 200ms under standard loads.
* **Asynchronous Processing:** Profile update logging to the Audit DB must be strictly non-blocking (executed asynchronously via RabbitMQ) to guarantee fast user experience.
* **Database Indexes:** Appropriate indexes on frequently queried columns (user_id, date, email).

### 6.2 Security
* **Authentication:** JWT with access token expiration (1 hour) and refresh token mechanism (7 days).
* **Password Hashing:** Passwords must be hashed using `bcrypt` with 10 salt rounds before storing in DB.
* **Data Validation:** Strict input sanitization and DTO validation in NestJS using `class-validator` and `class-transformer`.
* **CORS:** Configured CORS headers allowing only frontend origins.
* **Rate Limiting:** NestJS Throttler configured:
  - Login endpoint: 5 requests per minute per IP
  - General API: 100 requests per minute per IP
* **Account Lockout:** 5 consecutive failed login attempts → 15-minute lockout.
* **File Upload Security:** Validate MIME type by reading file headers (not trusting Content-Type header alone).

### 6.3 Usability & Responsiveness
* **Cross-Device Compatibility:** The Employee Web App must be fully responsive, supporting mobile viewports (320px+) as well as desktop viewports (1920px).
* **UI/UX Standard:** Clean, modern interface utilizing CSS frameworks (Tailwind CSS or Ant Design) with loading spinners and feedback toasts.
* **Error Feedback:** All API errors displayed as user-friendly toast notifications with actionable messages.

### 6.4 Observability
* **Health Checks:** Each microservice exposes `GET /health` endpoint (via `@nestjs/terminus`) reporting DB connectivity and service status.
* **Application Logging:** Structured JSON logging via NestJS built-in Logger or Winston. Log levels: ERROR, WARN, INFO, DEBUG.
* **Audit Logging:** All profile changes logged to separate audit database (see FR-EMP-006).

---

## 7. Data Architecture & Database Schema Design

### 7.1 Primary Database Schema (PostgreSQL)

#### `users` Table
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, Default `gen_random_uuid()` | Unique user identifier |
| `name` | `VARCHAR(100)` | NOT NULL | Employee full name |
| `email` | `VARCHAR(100)` | NOT NULL, UNIQUE | Corporate email address |
| `password` | `VARCHAR(255)` | NOT NULL | Hashed password (bcrypt) |
| `position` | `VARCHAR(100)` | NOT NULL | Position / job title |
| `phone_number`| `VARCHAR(20)` | NULLABLE | Mobile phone number |
| `photo_url` | `VARCHAR(500)` | NULLABLE | URL path to avatar image |
| `role` | `ENUM('EMPLOYEE', 'HRD')` | NOT NULL, Default 'EMPLOYEE' | Access role |
| `status` | `ENUM('ACTIVE', 'INACTIVE')` | NOT NULL, Default 'ACTIVE' | Account status |
| `failed_login_attempts` | `INTEGER` | Default 0 | Consecutive failed login count |
| `locked_until` | `TIMESTAMP` | NULLABLE | Account lockout expiry |
| `refresh_token` | `VARCHAR(500)` | NULLABLE | Hashed refresh token |
| `created_at` | `TIMESTAMP` | Default NOW() | Record creation date |
| `updated_at` | `TIMESTAMP` | Default NOW() | Record last update date |

#### `attendances` Table
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, Default `gen_random_uuid()` | Unique record identifier |
| `user_id` | `UUID` | Foreign Key (`users.id`), NOT NULL | Reference to employee |
| `date` | `DATE` | NOT NULL | Attendance date (`YYYY-MM-DD`) in Asia/Jakarta |
| `clock_in` | `TIMESTAMP` | NULLABLE | Clock-in timestamp (UTC) |
| `clock_out` | `TIMESTAMP` | NULLABLE | Clock-out timestamp (UTC) |
| `created_at` | `TIMESTAMP` | Default NOW() | Creation timestamp |
| `updated_at` | `TIMESTAMP` | Default NOW() | Update timestamp |

**Indexes:**
- `UNIQUE(user_id, date)` — Prevents duplicate attendance records per user per day
- `INDEX(user_id)` — Fast lookup by employee
- `INDEX(date)` — Fast date-range queries

---

### 7.2 Audit / Logging Database Schema (Separate PostgreSQL Database)

#### `profile_change_logs` Table
| Column / Field | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, Default `gen_random_uuid()` | Unique log entry ID |
| `user_id` | `UUID` | NOT NULL | Employee who changed profile |
| `user_name` | `VARCHAR(100)` | NOT NULL | Employee name (denormalized for display) |
| `changed_fields` | `JSONB` | NOT NULL | Object holding modified keys (e.g., `{ "phone_number": {"old": "...", "new": "..."} }`) |
| `ip_address` | `VARCHAR(45)` | NOT NULL | IP address of request |
| `user_agent` | `TEXT` | NOT NULL | Browser user-agent |
| `timestamp` | `TIMESTAMP` | Default NOW() | Event timestamp |

**Indexes:**
- `INDEX(user_id)` — Fast lookup by employee
- `INDEX(timestamp)` — Fast date-range queries

---

## 8. Microservices & Message Queue Specifications

### 8.1 Microservices Structure
1. **Auth Service:**
   * Handles authentication (login, refresh, logout).
   * Manages employee profile CRUD (for employees).
   * Validates JWT tokens for other services.

2. **Attendance Service:**
   * Manages Clock In / Clock Out actions.
   * Provides attendance summary and filtering queries.

3. **Audit & Notification Service:**
   * Subscribes to RabbitMQ events (`employee.profile.updated`).
   * Writes logs to Audit Database.
   * Dispatches real-time notifications to HRD Admin interface via Socket.IO.

### 8.2 Message Queue Event Flow

```
[Employee Web] --> (PUT /api/v1/profile) --> [Auth Service]
                                                    |
                                                    +---> [Update Primary DB]
                                                    |
                                                    +---> [Publish Event to RabbitMQ]
                                                                    |
                                                                    v
                                                  [Queue: employee.profile.updated]
                                                                    |
                                                                    v
                                                 [Audit & Notification Service]
                                                                 |
                                     +---------------------------+---------------------------+
                                     |                                                       |
                                     v                                                       v
                         [Write to Audit Database]                         [Emit Socket.IO Event]
                                                                                               |
                                                                                               v
                                                                                     [HRD Admin Web Alert]
```

### 8.3 Event Payload Specification

```json
{
  "event": "employee.profile.updated",
  "userId": "uuid-of-employee",
  "userName": "John Doe",
  "changedFields": {
    "phone_number": {
      "old": "+6281234567890",
      "new": "+6289876543210"
    }
  },
  "metadata": {
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0 ..."
  },
  "timestamp": "2026-09-07T10:30:00Z"
}
```

**Rules:**
- Password and password hash MUST NEVER appear in event payloads.
- `changedFields` only includes fields that actually changed.
- For photo changes, include old and new URL paths (not binary data).

---

## 9. API Specifications

### 9.1 Authentication APIs
| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| `POST` | `/api/v1/auth/login` | Authenticate user & return JWT + refresh token | No |
| `POST` | `/api/v1/auth/refresh` | Refresh expired access token | Refresh Token |
| `POST` | `/api/v1/auth/logout` | Invalidate refresh token | Yes |

#### `POST /api/v1/auth/login`
**Request:**
```json
{
  "email": "john@company.com",
  "password": "SecurePass123"
}
```
**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@company.com",
      "role": "EMPLOYEE",
      "photoUrl": "/uploads/photos/john.jpg"
    }
  }
}
```
**Error (401):**
```json
{
  "statusCode": 401,
  "error": "UNAUTHORIZED",
  "message": "Invalid email or password"
}
```

#### `POST /api/v1/auth/refresh`
**Request:**
```json
{
  "refreshToken": "eyJhbGciOi..."
}
```
**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOi...(new)",
    "refreshToken": "eyJhbGciOi...(new)"
  }
}
```

### 9.2 Profile APIs
| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| `GET` | `/api/v1/profile` | Fetch current user profile | Yes (Employee) |
| `PUT` | `/api/v1/profile` | Update profile details (Photo, Phone, Password) | Yes (Employee) |

#### `GET /api/v1/profile`
**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@company.com",
    "position": "Software Engineer",
    "phoneNumber": "+6281234567890",
    "photoUrl": "/uploads/photos/john.jpg",
    "role": "EMPLOYEE"
  }
}
```

#### `PUT /api/v1/profile`
**Request (multipart/form-data or JSON):**
```json
{
  "phoneNumber": "+6289876543210",
  "currentPassword": "OldPass123",
  "newPassword": "NewPass456"
}
```
**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@company.com",
    "position": "Software Engineer",
    "phoneNumber": "+6289876543210",
    "photoUrl": "/uploads/photos/john.jpg",
    "role": "EMPLOYEE"
  }
}
```

### 9.3 Attendance APIs
| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| `POST` | `/api/v1/attendance/clock-in` | Record clock-in entry for current date | Yes (Employee) |
| `POST` | `/api/v1/attendance/clock-out` | Record clock-out entry for current date | Yes (Employee) |
| `GET` | `/api/v1/attendance/summary?from=YYYY-MM-DD&to=YYYY-MM-DD` | Query employee attendance summary | Yes (Employee) |

#### `POST /api/v1/attendance/clock-in`
**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "date": "2026-09-07",
    "clockIn": "2026-09-07T01:00:00.000Z",
    "clockInDisplay": "08:00:00"
  }
}
```
**Error (409):**
```json
{
  "statusCode": 409,
  "error": "CONFLICT",
  "message": "You have already clocked in today without clocking out"
}
```

#### `GET /api/v1/attendance/summary?from=2026-09-01&to=2026-09-07`
**Response (200):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "date": "2026-09-07",
      "clockIn": "2026-09-07T01:00:00.000Z",
      "clockOut": "2026-09-07T10:00:00.000Z",
      "clockInDisplay": "08:00:00",
      "clockOutDisplay": "17:00:00"
    }
  ]
}
```

### 9.4 HRD Admin APIs
| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| `GET` | `/api/v1/admin/employees?page=1&limit=10&search=john` | List all employees (Paginated) | Yes (HRD) |
| `POST` | `/api/v1/admin/employees` | Create new employee | Yes (HRD) |
| `PUT` | `/api/v1/admin/employees/:id` | Update employee details | Yes (HRD) |
| `DELETE` | `/api/v1/admin/employees/:id` | Deactivate employee (soft delete) | Yes (HRD) |
| `GET` | `/api/v1/admin/attendances?userId=&from=&to=&status=` | Read-only global attendance list | Yes (HRD) |
| `GET` | `/api/v1/admin/attendances/export?userId=&from=&to=` | Export attendance as CSV | Yes (HRD) |
| `GET` | `/api/v1/admin/audit-logs?userId=&from=&to=` | Retrieve audit log records | Yes (HRD) |

#### Standard Paginated Response Format
```json
{
  "statusCode": 200,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

#### Standard Error Response Format
```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "phoneNumber", "message": "Phone number must be 10-15 digits" }
  ]
}
```

---

## 10. Implementation Plan & Deliverables (Phased Development)

### Phase 1: Architecture, Setup & Core Infrastructure
**Estimated Duration:** 1 week

- [ ] Setup Nx monorepo with pnpm workspaces
- [ ] Create NestJS microservice apps: `auth-service`, `attendance-service`, `audit-service`
- [ ] Create shared libraries: `libs/common`, `libs/database`, `libs/messaging`
- [ ] Configure Docker + docker-compose (PostgreSQL primary, PostgreSQL audit, RabbitMQ)
- [ ] Configure TypeORM with primary and audit database connections
- [ ] Implement database migrations for `users` and `attendances` tables
- [ ] Implement database migration for `profile_change_logs` table (audit DB)
- [ ] Setup environment configuration (`@nestjs/config`, `.env.example`)
- [ ] Implement health check endpoints (`@nestjs/terminus`) per service
- [ ] Setup application logging (structured JSON via NestJS Logger)
- [ ] Create database seed script (1 HRD admin + sample employees)

### Phase 2: Authentication & Profile Management
**Estimated Duration:** 1 week

- [ ] Implement Auth Module: login, JWT generation, bcrypt password hashing
- [ ] Implement refresh token flow (issue, validate, rotate, revoke)
- [ ] Implement logout endpoint (invalidate refresh token)
- [ ] Implement account lockout logic (5 attempts → 15 min lockout)
- [ ] Implement JWT Guard and Role Guard (EMPLOYEE, HRD)
- [ ] Implement Profile GET endpoint (employee)
- [ ] Implement Profile PUT endpoint (employee) with field-level validation
- [ ] Implement file upload handling (multer, MIME validation, 2MB limit)
- [ ] Configure file storage (local disk for dev, configurable for production)
- [ ] Implement RabbitMQ producer: publish `employee.profile.updated` event
- [ ] Implement RabbitMQ consumer: write audit log to audit DB
- [ ] Implement Socket.IO gateway: emit real-time notification to HRD clients

### Phase 3: Attendance Core
**Estimated Duration:** 1 week

- [ ] Implement Clock-In endpoint with business rules and UNIQUE constraint
- [ ] Implement Clock-Out endpoint with business rules
- [ ] Implement concurrent request handling (transactions, optimistic locking)
- [ ] Implement Attendance Summary endpoint with date range filtering
- [ ] Implement timezone conversion logic (UTC storage → Asia/Jakarta display)
- [ ] Write unit tests for all attendance business rules
- [ ] Write integration tests for attendance DB operations

### Phase 4: HRD Admin Features
**Estimated Duration:** 1 week

- [ ] Implement Employee CRUD endpoints (Create, Read, Update, Deactivate)
- [ ] Implement paginated employee list with search/filter
- [ ] Implement global attendance view with filtering (employee, date range, status)
- [ ] Implement attendance CSV export endpoint
- [ ] Implement audit log retrieval endpoint with filtering
- [ ] Write unit and integration tests for admin endpoints

### Phase 5: Employee React Web Application
**Estimated Duration:** 1.5 weeks

- [ ] Setup React app with routing, state management, and CSS framework
- [ ] Implement Login page with form validation and error handling
- [ ] Implement auth token management (storage, refresh, auto-logout)
- [ ] Implement Profile page (view + edit with photo upload)
- [ ] Implement Attendance page (clock in/out actions)
- [ ] Implement Attendance Summary page (default view + date filtering)
- [ ] Implement responsive design (320px to 1920px)
- [ ] Implement loading states, error toasts, and success feedback

### Phase 6: HRD Admin React Web Application
**Estimated Duration:** 1.5 weeks

- [ ] Setup React app with routing, state management, and CSS framework
- [ ] Implement Login page (shared auth logic with employee app)
- [ ] Implement Employee Management page (CRUD table with search/pagination)
- [ ] Implement Attendance Monitoring page (read-only table with filters)
- [ ] Implement Audit Log page (table with filtering)
- [ ] Implement Socket.IO client for real-time alert popup
- [ ] Implement notification badge and alert history
- [ ] Implement responsive design (320px to 1920px)

### Phase 7: Testing, Refinement & Final Polish
**Estimated Duration:** 1 week

- [ ] End-to-end testing of complete flows:
  - [ ] Login → Profile Update → Message Queue → Audit Log + HRD Alert
  - [ ] Login → Clock In → Clock Out → Summary View
  - [ ] HRD Login → Employee CRUD → Verify Employee App reflects changes
  - [ ] HRD Login → Attendance Monitoring → Filter → Export CSV
- [ ] Bug fixes and responsive design touch-ups
- [ ] Performance optimization (query optimization, indexing verification)
- [ ] Security review (CORS, rate limiting, input validation audit)
- [ ] Write Documentation (README, Setup Guide, API Spec, Architecture Decision Records)
- [ ] Final Submission Preparation

---

## 11. Acceptance Criteria & Evaluation Matrix

| Module | Criteria | Status Checklist |
| :--- | :--- | :--- |
| **Tech Stack Compliance** | Built with NestJS (Backend), React.js (Frontend), REST Microservices, RabbitMQ, Socket.IO, PostgreSQL. | [ ] |
| **Employee Login** | Login with email/password, JWT access + refresh tokens, account lockout after 5 failures. | [ ] |
| **Session Management** | Token refresh, logout with token invalidation, auto-redirect on 401. | [ ] |
| **Profile Management** | View profile. Modify Photo (validated), Phone Number (regex), Password (complexity + current verification). | [ ] |
| **Admin Real-time Notification** | Profile update triggers Socket.IO popup on HRD Admin Web within 2 seconds. | [ ] |
| **Data Stream / Logging** | Profile updates publish RabbitMQ event → audit log in separate DB (non-blocking). | [ ] |
| **Attendance Clock In/Out** | Capture date/time in Asia/Jakarta. UNIQUE constraint prevents duplicates. Business rules enforced. | [ ] |
| **Attendance Summary** | Default: current month start to today. Filterable by date range (max 90 days). | [ ] |
| **HRD Admin - Employee CRUD** | Create, update, deactivate employees. Paginated list with search. | [ ] |
| **HRD Admin - Attendance** | View all employees' attendance. Filter by employee/date/status. Export CSV. | [ ] |
| **HRD Admin - Audit Logs** | View profile change audit logs with filtering. Password fields masked. | [ ] |
| **Responsiveness** | Web apps adapt seamlessly from 320px mobile to 1920px desktop. | [ ] |
| **Health Checks** | Each service exposes `/health` endpoint reporting DB and service status. | [ ] |
| **Docker Setup** | Full stack runnable via `docker-compose up` (app services + PostgreSQL + RabbitMQ). | [ ] |

---

## 12. Glossary

| Term | Definition |
|:---|:---|
| **WIB** | Waktu Indonesia Barat (Western Indonesia Time), UTC+7 |
| **HRD** | Human Resource Development |
| **WFH** | Work From Home |
| **JWT** | JSON Web Token |
| **DTO** | Data Transfer Object |
| **CRUD** | Create, Read, Update, Delete |

---

## Changelog

### v2.0.0 (September 7, 2026)
**Major additions:**
- Added timezone specification (Asia/Jakarta) — GAP-C01
- Added refresh token and logout API endpoints — GAP-C02, GAP-C03
- Added UNIQUE constraint on attendances table — GAP-C04
- Added file storage strategy guidance — GAP-C05
- Added monorepo tooling decision (Nx + pnpm) — GAP-C06
- Standardized service naming — GAP-I01
- Completed API query parameters — GAP-I02
- Standardized attendance status naming (CLOCK_IN/CLOCK_OUT) — GAP-I03
- Added employee deactivation (soft delete) — GAP-I04, GAP-B05
- Defined error response format — GAP-T01
- Defined pagination format — GAP-T02
- Added database migration strategy — GAP-T03
- Specified ORM (TypeORM) — GAP-T04
- Added application logging strategy — GAP-T05
- Added health check endpoints — GAP-T06
- Added environment configuration strategy — GAP-T07
- Decided on Socket.IO for real-time — GAP-T08
- Added account lockout policy — GAP-B02
- Added per-requirement acceptance criteria — GAP-E01
- Added API request/response examples — GAP-E02
- Added Docker/containerization to Phase 1 — GAP-O01
- Added seed data strategy — GAP-O03
- Added `status` field to users table — GAP-B05
- Added attendance CSV export endpoint — GAP-I04
- Expanded implementation plan from 5 to 7 phases with granular tasks

**Minor changes:**
- Added `user_name` to audit log schema (denormalized for display)
- Added `failed_login_attempts` and `locked_until` to users table
- Added `refresh_token` to users table
- Added database indexes specification
- Added glossary section
- Added rate limiting specifics (login: 5/min, general: 100/min)
- Added phone number regex: `^[+]?[0-9]{10,15}$`
- Added password complexity: min 8 chars, 1 uppercase, 1 lowercase, 1 number
- Added date range max limit: 90 days
