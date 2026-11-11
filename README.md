# 🏦 Double Ledger & Banking System

**Full-stack banking platform built with Spring Boot and React, focused on transaction correctness, double-entry accounting, concurrency safety, idempotent payments, security, and auditability.**

![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.10-6DB33F?logo=springboot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-DB-4169E1?logo=postgresql&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring%20Security-Enabled-6DB33F?logo=springsecurity&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?logo=jsonwebtokens&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Frontend-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=black)
![OpenAPI](https://img.shields.io/badge/Swagger%20%2F%20OpenAPI-Docs-85EA2D?logo=swagger&logoColor=black)
![Maven](https://img.shields.io/badge/Maven-Build-C71A36?logo=apachemaven&logoColor=white)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Open-0ea5e9?style=for-the-badge)](https://ledgerlypay.vercel.app)

</div>

---

## 📌 Contents

- [What this project is](#-what-this-project-is)
- [Why this system matters](#-why-this-system-matters)
- [Core Engineering Problems](#-core-engineering-problems)
- [Engineering Architecture & Design](#-engineering-architecture--design)
  - [System Architecture](#1-system-architecture)
  - [Authentication & RBAC](#2-authentication--rbac)
  - [Transaction Processing](#3-transaction-processing)
  - [Concurrency Control](#4-concurrency-control)
  - [Idempotent Payments](#5-idempotent-payments)
  - [Double-Entry Ledger](#6-double-entry-ledger)
  - [Database Design](#7-database-design)
  - [Deployment Architecture](#8-deployment-architecture)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Roles & Access Control](#-roles--access-control)
- [API Documentation](#-api-documentation)
- [Ledger Architecture](#-ledger-architecture-double-entry)
- [Security Design](#-security-design)
- [Database Schema](#-database-schema)
- [Frontend](#-frontend-react-dashboard)
- [Engineering Highlights](#-engineering-highlights)
- [Troubleshooting](#-troubleshooting)
- [Extra Documentation](#-extra-documentation)
- [Recent Implementation Updates](#-recent-implementation-updates)
- [License](#-license)

---

## ✨ What this project is

**Double Ledger** is a full-stack banking system built with **Java 21, Spring Boot, Spring Security, PostgreSQL, React, and TypeScript**.

The system models financial operations using an **immutable double-entry ledger** rather than treating an account balance as the primary source of truth.

It includes:

- Double-entry financial ledger
- Transaction processing
- Idempotent UPI payments
- JWT authentication
- Refresh-token rotation
- Role-based access control
- Centralized ownership authorization for user-scoped banking data
- Pessimistic database locking
- Deterministic account lock ordering
- KYC and compliance checks
- Audit logging
- Session management
- Security access logs
- Notifications
- Role-specific dashboards and real-data analytics
- Masked account identifiers and recipient names in customer-facing banking views
- Debit cards
- Credit cards and credit plans
- Loans and EMI schedules
- QR code generation
- Server-Sent Events for card events
- CSV/PDF account statements
- React role-based dashboards

The project is intentionally designed around backend concerns such as **correctness, consistency, concurrency, security, and traceability**.

---

# 🎯 Why this system matters

Financial systems cannot rely on simple balance updates such as:

```text
balance = balance - amount
```

because concurrent requests, retries, partial failures, and duplicate requests can produce inconsistent results.

This system instead separates the concepts of:

```text
Transaction
    ↓
Ledger Entries
    ↓
Derived Account Balance
```

For every successful transfer:

```text
Alice → Bob ₹5,000

Alice account
    DEBIT   ₹5,000

Bob account
    CREDIT  ₹5,000
```

The implementation also protects money movement using:

- Database transactions
- Pessimistic locking
- Deterministic lock ordering
- Idempotency keys
- Sender ownership validation
- KYC validation
- Append-oriented ledger entries
- Unique database constraints
- Audit trails

---

# 🧠 Core Engineering Problems

The project focuses on solving several problems commonly found in transactional backend systems.

### 1. Financial consistency

Every transfer produces balanced debit and credit ledger entries.

### 2. Duplicate requests

UPI payments use persisted idempotency state so retrying the same request does not create another payment.

### 3. Concurrent transfers

Account rows are protected using pessimistic locking.

### 4. Deadlock prevention

When two accounts need to be locked, they are locked in deterministic ascending ID order.

### 5. Authorization beyond authentication

Knowing an account number or UPI ID is not enough.

The authenticated user must actually own the sender account.

### 6. Auditability

Financial and security-related operations are recorded through audit and access logs.

### 7. Token security

Access tokens are short-lived and refresh tokens are rotated and stored in hashed form.

---

# 🗺️ Engineering Architecture & Design

The following diagrams explain the main architectural and backend design decisions of the system.

---

## 1. System Architecture
<img width="1390" height="1196" alt="double-ledger-architecture" src="https://github.com/user-attachments/assets/c317a9fa-7241-4485-9040-eda1371a4533" />

The backend separates API handling, business logic, persistence, security, and financial transaction processing.

---

## 2. Authentication & RBAC
<img width="1647" height="1332" alt="double-ledger-authentication-jwt-rbac" src="https://github.com/user-attachments/assets/e50a7d58-027a-488c-a09a-8c1e5dce4073" />

Authentication is implemented using **Spring Security and JWT**.
Authorization is enforced at the endpoint/service boundary using method-level security.

---

## 3. Transaction Processing
<img width="2197" height="2015" alt="double-ledger-transaction-flow" src="https://github.com/user-attachments/assets/8fc646f1-12b2-4e77-af54-bd2ff051001a" />

The financial operation is executed inside a transactional boundary so the transaction state and ledger entries remain consistent.

---

## 4. Concurrency Control
<img width="1008" height="901" alt="double-ledger-concurrency-locking" src="https://github.com/user-attachments/assets/d7496283-3dbb-41ae-8569-6dedbc59905e" />

Concurrent transfers can attempt to update the same accounts at the same time.
Both transactions therefore acquire locks in the same order.

---

## 5. Idempotent Payments
<img width="1108" height="1134" alt="double-ledger-idempotency-flow" src="https://github.com/user-attachments/assets/6e19c877-461e-4a1e-85bf-cb73c8c12fbf" />

If the same idempotency key is submitted again, the existing payment state is checked instead of blindly creating another financial operation.

This protects against duplicate submissions and retry scenarios.

---

## 6. Double-Entry Ledger
<img width="1973" height="1658" alt="double-ledger-ledger" src="https://github.com/user-attachments/assets/ee199225-8e6a-4c5a-884f-0c31f28bfe94" />


Every successful money movement creates exactly two ledger entries.

Both entries share the same transaction reference.

This allows the system to maintain a complete financial trail and derive account balances from ledger activity.

---

## 7. Database Design

<img width="3218" height="5912" alt="double-ledger-database-erd" src="https://github.com/user-attachments/assets/b2883957-e0bf-4eac-95c3-627c5b59f29f" />

The PostgreSQL schema models the banking domain across users, customers, accounts, transactions, payments, cards, loans, security, and auditing.

## 8. Deployment Architecture

<img width="1827" height="1023" alt="double-ledger-deployment" src="https://github.com/user-attachments/assets/7e0fc7c6-643d-473a-aef1-a69d5caffa36" />

The application is structured so the major components can be deployed independently:


The frontend communicates with the backend through REST APIs, while the backend manages persistence and financial business logic.

---

# 🧰 Tech Stack

## Backend

| Technology | Version | Purpose |
|---|---|---|
| Java | 21 | Backend language |
| Spring Boot | 3.5.10 | Application framework |
| Spring Security | 6.x | Authentication & authorization |
| Spring Data JPA | Bundled | Persistence layer |
| Hibernate | 6.6.x | JPA provider |
| PostgreSQL | 15+ | Primary database |
| JJWT | 0.12.6 | JWT generation & validation |
| MapStruct | 1.6.3 | DTO mapping |
| SpringDoc OpenAPI | 2.7.0 | API documentation |
| Spring Actuator | Bundled | Health & metrics |
| Spring Mail | Bundled | Password reset emails |
| Spring Cache / Redis | Optional | Caching |
| OpenPDF | 1.3.30 | PDF statement generation |
| ZXing | 3.5.3 | QR code generation |
| Lombok | Bundled | Boilerplate reduction |
| Jakarta Validation | Bundled | Request validation |

## Frontend

| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript | Type-safe frontend development |
| Vite | Build tool and development server |
| Tailwind CSS | Styling |
| shadcn/ui | UI components |
| Radix UI | Accessible primitives |
| Recharts | Charts and analytics |
| React Router v6 | Client-side routing |
| Lucide React | Icons |

---

# 🚀 Quick Start

## Prerequisites

Install:

- Java 21
- PostgreSQL 15+
- Node.js 18+
- npm
- Git

---

## 1. Clone the repository

```bash
git clone <your-repository-url>
cd <your-repository>
```

---

## 2. Configure PostgreSQL

Create a PostgreSQL database and configure the credentials in:

```text
bank-backend/src/main/resources/application.yml
```

Example:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/double_ledger
    username: postgres
    password: your_password
```

Use your actual database configuration.

---

## 3. Start the Spring Boot backend

From the repository root:

```powershell
cd bank-backend
```

### Windows

```powershell
.\mvnw.cmd spring-boot:run
```

### macOS / Linux

```bash
./mvnw spring-boot:run
```

Backend:

```text
http://localhost:8080/api
```

---

## 4. Start the React frontend

In a second terminal from the repository root:

```bash
cd bank-frontend
npm install
```

Create:

```text
bank-frontend/.env.local
```

Add:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_ENABLE_AUDIT=true
VITE_ENABLE_SECURITY=true
```

Then:

```bash
npm run dev
```

Frontend:

```text
http://localhost:8081
```

---

## 5. Swagger / OpenAPI

Swagger UI:

```text
http://localhost:8080/api/swagger-ui/index.html
```

OpenAPI JSON:

```text
http://localhost:8080/api/v3/api-docs
```

Saved OpenAPI snapshots:

```text
bank-backend/swagger-documentation/openapi.json
bank-backend/swagger-documentation/openapi.yaml
```

---

# 👥 Roles & Access Control

The system supports five roles.

| Role | Description |
|---|---|
| `ROLE_ADMIN` | Full system access |
| `ROLE_MANAGER` | Banking, customer, account, transaction and UPI management |
| `ROLE_CUSTOMER_MANAGER` | Customer/account management and compliance operations |
| `ROLE_AUDITOR` | Read-only financial and audit access |
| `ROLE_USER` | Own accounts, transactions and UPI payments |

Authorization is enforced using Spring Security method-level security.

Example:

```java
@PreAuthorize("hasRole('ADMIN')")
```

or:

```java
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
```

---

# 📚 API Documentation

The complete REST API contract is generated from the backend and available in OpenAPI format.

- **Interactive Swagger UI (local backend):** http://localhost:8080/api/swagger-ui/index.html
- **Live OpenAPI JSON:** http://localhost:8080/api/v3/api-docs
- **Saved OpenAPI JSON:** [bank-backend/swagger-documentation/openapi.json](bank-backend/swagger-documentation/openapi.json)
- **Saved OpenAPI YAML:** [bank-backend/swagger-documentation/openapi.yaml](bank-backend/swagger-documentation/openapi.yaml)

The saved snapshots are refreshed from the running backend OpenAPI JSON document.

# 🧾 Ledger Architecture — Double Entry

The ledger is the core financial component of the system.

Every successful transaction produces two entries:

```text
Transaction
     │
     ├───────────────┐
     ▼               ▼
  DEBIT            CREDIT
     │               │
  Sender           Receiver
```

Example:

```text
Transaction: TXN_001

Alice Account
    DEBIT    ₹5,000

Bob Account
    CREDIT   ₹5,000
```

Both entries reference the same transaction.

---

## Balance derivation

Balances are derived from ledger entries:

```sql
SELECT COALESCE(
    SUM(
        CASE
            WHEN entry_type = 'CREDIT' THEN amount
            WHEN entry_type = 'DEBIT' THEN -amount
        END
    ),
    0
)
FROM ledger
WHERE account_id = :accountId;
```

Conceptually:

```text
Balance = Total Credits - Total Debits
```

---

## Duplicate ledger protection

A unique constraint is used to prevent duplicate entries:

```text
uk_ledger_entry
(reference_id, account_id, entry_type)
```

This provides an additional database-level consistency guarantee.

---

# 🛡️ Security Design

## JWT Authentication

The application uses:

```text
Spring Security
        +
JWT
        +
Refresh Token Rotation
```

Protected requests use:

```http
Authorization: Bearer <access-token>
```

---

## Refresh Token Security

Refresh tokens are:

- Stored as hashes
- Rotated after use
- Associated with token metadata
- Revoked when reused
- Managed as a token family

This prevents a previously used refresh token from being continuously reused.

---

## Sender Ownership Validation

Authentication alone is not considered sufficient for financial operations.

For:

```text
POST /transaction
```

the service verifies:

```text
JWT User
    ↓
Customer
    ↓
Owned Account
    ↓
Sender Account
```

If the sender account does not belong to the authenticated user:

```text
HTTP 403 Forbidden
```

The same ownership policy is reused for scoped account, transaction, loan/EMI, and UPI operations. UPI profile lookups by UPI ID or account number also verify ownership; the per-profile shared cache was removed so a cache hit cannot bypass that check. Staff access remains governed by the backend role policy.

---

## Password Security

Passwords are protected using BCrypt.

Password reset flow:

```text
Forgot Password
       ↓
Generate random reset token
       ↓
Store token + expiry
       ↓
Send reset link
       ↓
Validate token
       ↓
Update password
       ↓
Clear token
```

Reset tokens have a limited lifetime.

---

## CORS

Configurable development origins include:

```text
http://localhost:8081
http://localhost:5173
http://localhost:3000
```

---

# 🔐 Concurrency Safety

The transaction layer uses database-level locking.

### Pessimistic locking

Accounts involved in a transfer are locked before balance-sensitive operations.

Conceptually:

```text
Transfer A → B

Lock A
Lock B
   ↓
Validate balance
   ↓
Create transaction
   ↓
Create ledger entries
   ↓
Commit
```

### Deterministic locking

When two accounts are involved:

```text
accountId 10
accountId 25
```

the system locks:

```text
10 → 25
```

regardless of transfer direction.

Therefore:

```text
A → B
B → A
```

both follow the same lock acquisition order.

---

# 🗄️ Database Schema

The database contains the core banking and supporting infrastructure tables.

## Main tables

| Table | Description |
|---|---|
| `users` | Authentication users |
| `roles` | Application roles |
| `user_roles` | User-role relationship |
| `banks` | Bank master data |
| `customers` | Customer profiles |
| `accounts` | Customer bank accounts |
| `transactions` | Financial transactions |
| `ledger` | Double-entry financial ledger |
| `upi_profiles` | UPI identifiers |
| `upi_payment_obj` | UPI payment intents and idempotency |
| `audit_logs` | Application audit events |
| `access_logs` | Security access events |
| `user_sessions` | Active session tracking |
| `refresh_tokens` | Refresh token metadata |
| `notifications` | User notifications |
| `debit_cards` | Debit cards |
| `debit_card_requests` | Card issuance requests |
| `credit_cards` | Credit cards |
| `credit_plans` | Credit plan definitions |
| `loans` | Loan records |
| `emis` | EMI schedule |
---

## Key database relationships

```text
users
  │
  ├── user_roles ── roles
  │
  └── customers
          │
          └── accounts
                 │
                 ├── transactions
                 │
                 ├── ledger
                 │
                 ├── upi_profiles
                 │
                 ├── debit_cards
                 │
                 ├── credit_cards
                 │      │
                 │      └── credit_plans
                 │
                 └── loans
                        │
                        └── emis
```

Security-related data is maintained separately:

```text
users
  │
  ├── refresh_tokens
  ├── user_sessions
  ├── access_logs
  ├── audit_logs
  └── notifications
```

---

## Important indexes

```text
idx_ledger_account_id
idx_ledger_reference_id

idx_upi_payment_key
idx_upi_payment_status

idx_transactions_date

idx_audit_logs_timestamp
idx_audit_logs_action
idx_audit_logs_user_id
idx_audit_logs_resource

idx_access_logs_timestamp
idx_access_logs_event_type
idx_access_logs_user_id

idx_user_sessions_token_id
idx_user_sessions_active
idx_user_sessions_user_id
```

These indexes support common lookup, transaction, auditing, and session-management operations.

---

# 🖥️ Frontend — React Dashboard

The frontend is located in:

```text
bank-frontend/
```

Technology:

```text
React 18
TypeScript
Vite
Tailwind CSS
shadcn/ui
Radix UI
Recharts
React Router
Lucide React
```

---

## Pages

| Route | Component | Access |
|---|---|---|
| `/` | `Index.tsx` | Public / redirect |
| `/login` | `LoginPage.tsx` | Public |
| `/register` | `RegisterPage.tsx` | Public |
| `/forgot-password` | `ForgotPasswordPage.tsx` | Public |
| `/set-password` | `SetPasswordPage.tsx` | Public |
| `/dashboard` | `Dashboard.tsx` | Authenticated |
| `/banks` | `BanksPage.tsx` | ADMIN, MANAGER, AUDITOR |
| `/customers` | `CustomersPage.tsx` | ADMIN, MANAGER, CUSTOMER_MANAGER, AUDITOR |
| `/accounts` | `AccountsPage.tsx` | Authenticated |
| `/transactions` | `TransactionsPage.tsx` | Authenticated |
| `/payments` | `PaymentsPage.tsx` | Authenticated |
| `/upi` | `UpiPage.tsx` | Authenticated |
| `/audit-logs` | `AuditLogsPage.tsx` | ADMIN, AUDITOR |
| `/security` | `SecurityPage.tsx` | ADMIN |
| `/profile` | `ProfilePage.tsx` | Authenticated |

---

## Frontend features

### Role-based routing

```text
ProtectedRoute
      ↓
PermissionGate
      ↓
Role-specific UI
```

Pages and UI sections are conditionally displayed based on the authenticated user's role.

---

### Role-based dashboards

Different roles receive different dashboard views:

```text
ADMIN
MANAGER
CUSTOMER_MANAGER
AUDITOR
USER
```

---

### Global Command Palette

The dashboard includes:

```text
Ctrl + K
```

for quick navigation through the application.

---

### Dashboard analytics

The dashboard uses Recharts for:

- Transaction volume
- Status distribution
- Bank distribution
- Other operational metrics

---

### QR Code viewer

UPI and account QR codes can be generated by the backend and displayed directly inside the React dashboard.

---

### Security screens

Administrators can view:

- Active sessions
- Session metadata
- Access logs
- Login failures
- Password-change events

and terminate sessions when required.

---

### Feature flags

Audit and security modules can be toggled using:

```env
VITE_ENABLE_AUDIT=true
VITE_ENABLE_SECURITY=true
```

---

### Theme support

The dashboard supports:

```text
Light Mode
Dark Mode
```

---

# ⭐ Engineering Highlights

The most important engineering decisions in this project are:

### Double-entry accounting

```text
One transaction
      ↓
Debit + Credit
      ↓
Balanced ledger
```

### Idempotency

```text
Same request
     ↓
Same idempotency key
     ↓
Existing payment state
     ↓
No duplicate financial operation
```

### Concurrency control

```text
Concurrent requests
       ↓
Pessimistic locks
       ↓
Deterministic lock ordering
       ↓
Safer account updates
```

### Ownership enforcement

```text
JWT identity
     ↓
OwnershipAuthorizationService
     ↓
Owned account or banking resource
     ↓
Authorized read or financial operation
```

### Auditability

```text
API operation
     ↓
Audit interceptor
     ↓
Audit log
     ↓
Traceable activity
```

### Token rotation

```text
Access Token
      +
Refresh Token
      ↓
Refresh
      ↓
New Access Token
      +
New Refresh Token
      ↓
Previous Refresh Token revoked
```

---

# 🛠️ Recent Implementation Updates

The latest work in this conversation focused on security alignment, role-aware banking UX, and maintainable API documentation:

- Added centralized ownership checks to reviewed account-scoped transaction, balance, loan/EMI, and UPI paths; UPI profile lookups now enforce ownership, and managers/auditors retain their permitted system-wide view.
- Improved security exception handling and the asynchronous transaction-notification path so authorization failures are not reported as generic errors and notifications do not depend on lazy entity access after the originating transaction.
- Refined role-specific dashboards and banking pages to use role-appropriate APIs, backend metrics, safer account masking, clearer recipient names, and data-backed charts and error states.
- Saved the generated OpenAPI 3.0.1 contract as JSON and YAML under `bank-backend/swagger-documentation/`. The snapshot contains 117 path templates and 123 operations.

The project report records the validation performed and the remaining operational caveats.

# 🧪 Testing

The backend includes unit tests covering important business and security rules, including:

- KYC validation
- Authorization
- Transaction rules
- Ownership validation
- Security-related behavior

Run tests using:

```bash
cd bank-backend
./mvnw test
```

Windows:

```powershell
cd bank-backend
.\mvnw.cmd test
```

---

# 🧯 Troubleshooting

## Frontend shows empty data

Verify:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

and make sure the Spring Boot backend is running.

---

## Port conflict

Default ports:

```text
Backend  → 8080
Frontend → 8081
```

---

## Database connection failure

Check:

```text
PostgreSQL is running
Database exists
Username is correct
Password is correct
application.yml is configured correctly
```

---

## JWT 401 error

The access token may have expired.

Log in again or use the refresh-token flow.

---

## Idempotency key conflict

Use a new unique idempotency key for a new payment attempt.

Do not reuse an existing key for a completely different payment.

---

## Deadlock troubleshooting

The transaction layer uses deterministic account locking.

If investigating a locking problem, verify that account locking continues to use the intended ordered locking path.

---

# 📎 Extra Documentation

Additional project documentation is available in the repository:

- [`PROJECT_REPORT.md`](PROJECT_REPORT.md)
- [`bank-backend/swagger-documentation/openapi.yaml`](bank-backend/swagger-documentation/openapi.yaml)
- [`bank-backend/swagger-documentation/openapi.json`](bank-backend/swagger-documentation/openapi.json)

---

# 🌐 Live Demo

The frontend is deployed at:

```text
https://ledgerlypay.vercel.app
```

> **Note:** The live deployment demonstrates the frontend experience. Local development is recommended when exploring the complete backend, database, Swagger API, and transaction-processing workflow.

---

# 📁 Important Project Structure

A simplified project structure:

```text
.
├── bank-backend/
│   ├── src/
│   ├── swagger-documentation/
│   ├── mvnw.cmd
│   └── pom.xml
├── bank-frontend/
│   ├── src/
│   └── package.json
├── demo/
├── PROJECT_REPORT.md
└── README.md
```

---

# 📄 License

This project is licensed under the MIT License.

See [`LICENSE`](LICENSE) for details.

---

<div align="center">

### Built with Java · Spring Boot · PostgreSQL · React

**Designed around correctness, concurrency, security, and reliability.**

</div>
