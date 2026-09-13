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
- [API Reference](#-api-reference)
  - [Authentication](#1-authentication-module--apiauth)
  - [Bank Management](#2-bank-management--bank)
  - [Customer Management](#3-customer-management--customer)
  - [Account Management](#4-account-management--account)
  - [Transaction Processing](#5-transaction-processing--transaction)
  - [UPI Payment System](#6-upi-payment-system--upi)
  - [QR Code Generation](#7-qr-code-generation--qr)
  - [Audit Logging](#8-audit-logging--audit)
  - [Security & Session Management](#9-security--session-management--security)
  - [Notifications](#10-notifications--apinotifications)
  - [Debit Cards](#11-debit-cards--apidebit-cards)
  - [Debit Card Requests](#12-debit-card-requests--apidebit-card-requests)
  - [Credit Cards & Plans](#13-credit-cards--plans--apicredit-cards--apicredit-plans)
  - [Loans & EMI](#14-loans--emi--apiloans--apiemis)
  - [Account Statements](#15-account-statements--apiaccountsaccountnumberstatement)
  - [Webhooks](#16-webhooks--apiwebhooks)
  - [Composite APIs & Card Events](#17-composite--card-events--apicomposite--streamevents)
- [Ledger Architecture](#-ledger-architecture-double-entry)
- [Security Design](#-security-design)
- [Database Schema](#-database-schema)
- [Frontend](#-frontend-react-dashboard)
- [Engineering Highlights](#-engineering-highlights)
- [Troubleshooting](#-troubleshooting)
- [Extra Documentation](#-extra-documentation)
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
- Sender ownership validation
- Pessimistic database locking
- Deterministic account lock ordering
- KYC and compliance checks
- Audit logging
- Session management
- Security access logs
- Notifications
- Debit cards
- Credit cards and credit plans
- Loans and EMI schedules
- QR code generation
- Webhook subscriptions
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
src/main/resources/application.yml
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
http://localhost:8080
```

---

## 4. Start the React frontend

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
VITE_API_BASE_URL=http://localhost:8080
VITE_ENABLE_AUDIT=true
VITE_ENABLE_SECURITY=true
```

Then:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Depending on the Vite configuration, the application may also use port `8081`.

---

## 5. Swagger / OpenAPI

Swagger UI:

```text
http://localhost:8080/swagger-ui.html
```

OpenAPI JSON:

```text
http://localhost:8080/v3/api-docs
```

OpenAPI YAML:

```text
swagger-documentation/openapi.yaml
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

# 📚 API Reference

The application exposes REST APIs for authentication, banking, accounts, transactions, payments, cards, loans, auditing, security, and dashboard operations.

---

## 1. Authentication Module — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Authenticate and receive access + refresh tokens |
| POST | `/api/auth/forgot-password` | Public | Request password reset |
| POST | `/api/auth/reset-password` | Public | Reset password using reset token |
| GET | `/api/auth/me` | Authenticated | Return current user profile and banking metrics |
| POST | `/api/auth/change-password` | Authenticated | Change current password |
| POST | `/api/auth/refresh` | Public | Rotate refresh token |
| POST | `/api/auth/logout` | Authenticated | Logout and terminate active session |

### Login response

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "tokenType": "Bearer",
  "userId": 1,
  "username": "admin",
  "email": "admin@bank.com",
  "fullName": "Admin User",
  "roles": ["ROLE_ADMIN"],
  "expiresAt": "2026-05-11T19:38:00",
  "passwordChangeRequired": false
}
```

### Enriched `/api/auth/me`

```json
{
  "id": 1,
  "username": "alice",
  "email": "alice@bank.com",
  "primaryRole": "ROLE_USER",
  "customerId": "SBI_abc123",
  "kycStatus": "ACTIVE",
  "customerStatus": "ACTIVE",
  "accountCount": 2,
  "totalBalance": 45000.00,
  "upiProfileCount": 1,
  "transactionCount": 12
}
```

Additional fields are returned based on the authenticated user's role.

---

## 2. Bank Management — `/bank`

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/bank` | ADMIN, MANAGER, AUDITOR | List banks |
| GET | `/bank/{id}` | ADMIN, MANAGER, AUDITOR | Get bank |
| GET | `/bank/upi/{upiId}` | ADMIN, MANAGER, AUDITOR, USER | Find bank by UPI ID |
| POST | `/bank/create` | ADMIN | Create bank |
| PATCH | `/bank/{id}` | ADMIN | Update bank |
| DELETE | `/bank/{id}` | ADMIN | Delete bank |

Bank fields include:

```text
bankName
branch
ifscCode
city
state
branchAddress
```

---

## 3. Customer Management — `/customer`

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/customer` | ADMIN, MANAGER, CUSTOMER_MANAGER, AUDITOR | List customers |
| GET | `/customer/paginated` | ADMIN, MANAGER, CUSTOMER_MANAGER, AUDITOR | Paginated customers |
| GET | `/customer/me` | Authenticated | Current customer |
| GET | `/customer/email/{email}` | ADMIN, MANAGER, CUSTOMER_MANAGER, AUDITOR | Find customer |
| GET | `/customer/search` | ADMIN, MANAGER, CUSTOMER_MANAGER | Search customers |
| GET | `/customer/bank` | ADMIN, MANAGER, CUSTOMER_MANAGER | Customers by bank |
| PATCH | `/customer/update` | ADMIN, CUSTOMER_MANAGER | Update customer |
| DELETE | `/customer/delete` | ADMIN | Delete customer |

Customer data includes:

```text
fullName
email
phoneNumber
address
age
kycStatus
customerStatus
```

---

## 4. Account Management — `/account`

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/account` | ADMIN, MANAGER, CUSTOMER_MANAGER, AUDITOR | List accounts |
| GET | `/account/paginated` | ADMIN, MANAGER, CUSTOMER_MANAGER, AUDITOR | Paginated accounts |
| GET | `/account/my` | Authenticated | Own accounts |
| GET | `/account/{id}` | ADMIN, MANAGER, CUSTOMER_MANAGER, AUDITOR | Account details |
| GET | `/account/name/{bankName}` | ADMIN, MANAGER, CUSTOMER_MANAGER, AUDITOR | Accounts by bank |
| GET | `/account/email/{email}` | ADMIN, MANAGER, CUSTOMER_MANAGER | Accounts by email |
| GET | `/account/validate-receiver` | ADMIN, MANAGER, USER | Validate receiver |
| GET | `/account/lookup-by-number` | ADMIN, MANAGER, CUSTOMER_MANAGER, AUDITOR | Lookup account |
| GET | `/account/{accountNumber}/balance` | ADMIN, MANAGER, AUDITOR, USER | Ledger-derived balance |
| POST | `/account/{bankName}` | ADMIN, MANAGER | Create account |
| PATCH | `/account/{accNumber}` | ADMIN, MANAGER | Update account |
| PATCH | `/account/{accNumber}/compliance` | ADMIN, MANAGER, CUSTOMER_MANAGER | Update compliance |
| DELETE | `/account/{accNumber}` | ADMIN | Delete account |

Account numbers are generated automatically.

Example:

```text
ACC_SBI_xxxxx
```

---

## 5. Transaction Processing — `/transaction`

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/transaction/all` | ADMIN, MANAGER, AUDITOR | All transactions |
| GET | `/transaction/all/paginated` | ADMIN, MANAGER, AUDITOR | Paginated transactions |
| GET | `/transaction` | ADMIN, MANAGER, AUDITOR, USER | Filter transactions |
| GET | `/transaction/my` | Authenticated | Own transactions |
| GET | `/transaction/customer/{customerId}` | ADMIN, MANAGER, AUDITOR, CUSTOMER_MANAGER | Customer transactions |
| GET | `/transaction/accounts/{id}/balance` | ADMIN, MANAGER, AUDITOR, USER | Ledger-derived balance |
| POST | `/transaction` | USER | Transfer money |
| POST | `/transaction/{transactionId}/reverse` | ADMIN, MANAGER | Reverse transaction |
| GET | `/transaction/{transactionId}/receipt` | ADMIN, MANAGER, AUDITOR, USER | Transaction receipt |

### Transaction states

```text
INITIATED
    ↓
PROCESSING
    ↓
COMPLETED
```

or:

```text
INITIATED
    ↓
PROCESSING
    ↓
FAILED
```

### Transfer request

```json
{
  "senderAccount": "ACC_SBI_xxxxx",
  "receiverAccount": "ACC_HDFC_xxxxx",
  "amount": 5000.00
}
```

The sender must own the source account.

---

## 6. UPI Payment System — `/upi`

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| POST | `/upi/register` | ADMIN, MANAGER, USER | Register UPI profile |
| GET | `/upi` | ADMIN, MANAGER, AUDITOR, USER | List UPI profiles |
| GET | `/upi/paginated` | ADMIN, MANAGER, AUDITOR, USER | Paginated profiles |
| GET | `/upi/my` | Authenticated | Own UPI profiles |
| GET | `/upi/{upiId}` | ADMIN, MANAGER, AUDITOR, USER | Get UPI profile |
| GET | `/upi/account/{accountNumber}` | ADMIN, MANAGER, USER | Account UPI profiles |
| PATCH | `/upi/{upiId}/status` | ADMIN, MANAGER, USER | Update status |
| PUT | `/upi/{upiId}/toggle` | ADMIN, MANAGER, USER | Enable/disable |
| DELETE | `/upi/{upiId}` | ADMIN | Soft delete |
| POST | `/upi/pay` | USER | Execute UPI payment |

### UPI payment request

```json
{
  "fromUpi": "alice@sbi",
  "toUpi": "bob@hdfc",
  "amount": 1000.00,
  "idempotencyKey": "unique-client-key-123"
}
```

---

## 7. QR Code Generation — `/qr`

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/qr/generate` | ADMIN, MANAGER, USER | Generate UPI payment QR |
| GET | `/qr/account` | ADMIN, MANAGER, USER | Generate account QR |

QR codes are generated using ZXing.

UPI QR format:

```text
upi://pay?pa=...&pn=...&am=...&cu=INR
```

The API returns:

```text
image/png
```

---

## 8. Audit Logging — `/audit`

Access is restricted to:

```text
ROLE_ADMIN
ROLE_AUDITOR
```

| Method | Endpoint | Description |
|---|---|---|
| GET | `/audit/logs` | Paginated audit log query |
| GET | `/audit/logs/{id}` | Get individual audit entry |

Supported filters include:

```text
startDate
endDate
action
userId
resource
page
size
```

Audit actions:

```text
VIEW
CREATE
UPDATE
DELETE
```

Additional explicit security events include:

```text
LOGIN
LOGOUT
PASSWORD_RESET_REQUEST
PASSWORD_RESET
PASSWORD_CHANGE
```

The `AuditLoggingInterceptor` automatically captures eligible HTTP activity.

Excluded paths include:

```text
/audit
/security
/api/auth
/swagger-ui
/v3/api-docs
/actuator
```

---

## 9. Security & Session Management — `/security`

All endpoints are restricted to:

```text
ROLE_ADMIN
```

| Method | Endpoint | Description |
|---|---|---|
| GET | `/security/sessions` | List active sessions |
| DELETE | `/security/sessions/{sessionId}` | Terminate session |
| POST | `/security/sessions/terminate-all` | Terminate sessions |
| GET | `/security/access-logs` | Query access logs |

Session tracking includes:

```text
sessionId
tokenId
userId
userName
ipAddress
userAgent
createdAt
lastActivity
expiresAt
active
```

Access events include:

```text
LOGIN_SUCCESS
FAILED_LOGIN
LOGOUT
PASSWORD_CHANGE
```

---

## 10. Notifications — `/api/notifications`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | Paginated notifications |
| GET | `/api/notifications/unread` | Unread notifications |
| GET | `/api/notifications/unread/count` | Unread count |
| PUT | `/api/notifications/{notificationId}/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all as read |

Users can only access their own notifications.

The user ID is derived from the authenticated JWT.

---

## 11. Debit Cards — `/api/debit-cards`

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/api/debit-cards/account/{accountId}` | ADMIN, MANAGER, USER | Cards by account |
| GET | `/api/debit-cards/account-number/{accountNumber}` | ADMIN, MANAGER, USER | Cards by account number |
| GET | `/api/debit-cards/{cardId}` | ADMIN, MANAGER, USER | Card details |
| PUT | `/api/debit-cards/{cardId}/toggle-contactless` | ADMIN, USER | Toggle contactless |
| PUT | `/api/debit-cards/{cardId}/toggle-international` | ADMIN, USER | Toggle international |
| PUT | `/api/debit-cards/{cardId}/toggle-otp` | ADMIN, USER | Toggle OTP |
| PUT | `/api/debit-cards/{cardId}/limits` | ADMIN, USER | Update limits |
| PUT | `/api/debit-cards/{cardId}/merchant-blocks` | ADMIN, USER | Merchant category controls |
| POST | `/api/debit-cards/{cardId}/freeze` | ADMIN, USER | Freeze card |
| POST | `/api/debit-cards/{cardId}/unfreeze` | ADMIN, USER | Unfreeze card |
| POST | `/api/debit-cards/{cardId}/replace` | ADMIN, USER | Request replacement |
| PUT | `/api/debit-cards/{cardId}/block` | ADMIN, USER | Permanently block |

---

## 12. Debit Card Requests — `/api/debit-card-requests`

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| POST | `/api/debit-card-requests` | USER | Create card request |
| GET | `/api/debit-card-requests/my` | USER | Own requests |
| GET | `/api/debit-card-requests/pending` | ADMIN, MANAGER | Pending requests |
| GET | `/api/debit-card-requests/approved` | ADMIN, MANAGER | Approved requests |
| GET | `/api/debit-card-requests/issued` | ADMIN, MANAGER | Issued requests |
| POST | `/api/debit-card-requests/{requestId}/approve` | ADMIN, MANAGER | Approve |
| POST | `/api/debit-card-requests/{requestId}/reject` | ADMIN, MANAGER | Reject |
| POST | `/api/debit-card-requests/{requestId}/issue` | ADMIN, MANAGER | Issue |
| POST | `/api/debit-card-requests/{requestId}/dispatch` | ADMIN, MANAGER | Dispatch |
| POST | `/api/debit-card-requests/{requestId}/deliver` | ADMIN, MANAGER | Deliver |

---

## 13. Credit Cards & Plans

### Credit Cards — `/api/credit-cards`

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/api/credit-cards/account/{accountId}` | ADMIN, MANAGER, USER | Cards by account |
| GET | `/api/credit-cards/account-number/{accountNumber}` | ADMIN, MANAGER, USER | Cards by account number |
| GET | `/api/credit-cards/{cardId}` | ADMIN, MANAGER, USER | Card details |
| PUT | `/api/credit-cards/{cardId}/toggle-contactless` | ADMIN, USER | Toggle contactless |
| PUT | `/api/credit-cards/{cardId}/toggle-international` | ADMIN, USER | Toggle international |
| PUT | `/api/credit-cards/{cardId}/toggle-otp` | ADMIN, USER | Toggle OTP |
| PUT | `/api/credit-cards/{cardId}/limits` | ADMIN, USER | Update limits |
| PUT | `/api/credit-cards/{cardId}/merchant-blocks` | ADMIN, USER | Merchant controls |
| POST | `/api/credit-cards/{cardId}/freeze` | ADMIN, USER | Freeze |
| POST | `/api/credit-cards/{cardId}/unfreeze` | ADMIN, USER | Unfreeze |
| POST | `/api/credit-cards/{cardId}/replace` | ADMIN, USER | Replacement |
| PUT | `/api/credit-cards/{cardId}/block` | ADMIN, USER | Permanent block |

### Credit Plans — `/api/credit-plans`

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/api/credit-plans` | ADMIN, MANAGER, USER | List plans |
| GET | `/api/credit-plans/all` | ADMIN, MANAGER | Admin/manager plan view |
| POST | `/api/credit-plans` | ADMIN, MANAGER | Create plan |
| PATCH | `/api/credit-plans/{planId}` | ADMIN, MANAGER | Update plan |
| POST | `/api/credit-plans/{planId}/assign/{cardId}` | ADMIN, MANAGER | Assign plan |

---

## 14. Loans & EMI

### Loans — `/api/loans`

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/api/loans/customer/{customerId}` | ADMIN, MANAGER, USER | Customer loans |
| GET | `/api/loans/account/{accountId}` | ADMIN, MANAGER, USER | Account loans |
| GET | `/api/loans/{loanId}` | ADMIN, MANAGER, USER | Loan details |
| POST | `/api/loans` | ADMIN, MANAGER | Create loan |

### EMI — `/api/emis`

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/api/emis/loan/{loanId}` | ADMIN, MANAGER, USER | EMI schedule |
| GET | `/api/emis/{emiId}` | ADMIN, MANAGER, USER | EMI details |

---

## 15. Account Statements

Endpoint:

```text
GET /api/accounts/{accountNumber}/statement
```

Supports:

```text
format=csv
format=pdf
from=
to=
```

Example:

```text
GET /api/accounts/ACC_SBI_xxxxx/statement?format=pdf
```

Statements are generated from account transaction / ledger information.

---

## 16. Webhooks — `/api/webhooks`

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| POST | `/api/webhooks` | ADMIN, MANAGER | Register webhook |
| GET | `/api/webhooks` | ADMIN, MANAGER, AUDITOR | List subscriptions |
| DELETE | `/api/webhooks/{id}` | ADMIN, MANAGER | Delete subscription |
| PATCH | `/api/webhooks/{id}/active` | ADMIN, MANAGER | Enable/disable |

Webhook subscriptions contain configuration such as:

```text
url
secret
eventTypes
active
```

---

## 17. Composite APIs & Card Events

### Composite APIs — `/api/composite`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/composite/my/overview` | Aggregated dashboard overview |
| POST | `/api/composite/transfer` | Composite transfer workflow |
| GET | `/api/composite/customers/{customerId}/banking-profile` | Banking profile |
| GET | `/api/composite/banks/{bankId}/operations-summary` | Bank operations summary |
| POST | `/api/composite/accounts/balance-check` | Multi-account balance check |
| GET | `/api/composite/transactions/advanced` | Advanced transaction search |
| GET | `/api/composite/search/global` | Global entity search |
| POST | `/api/composite/accounts/{accountNumber}/freeze` | Freeze account |
| POST | `/api/composite/customers/{customerId}/kyc-verify` | KYC verification |

### Server-Sent Events

```text
GET /stream/events
```

The endpoint provides real-time card-related events using **Server-Sent Events (SSE)**.

---

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

The UPI payment flow applies the same ownership concept through UPI-to-account resolution.

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
| `webhook_subscriptions` | Outbound webhook registrations |

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
Customer
     ↓
Account ownership
     ↓
Financial operation
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

# 🧪 Testing

The backend includes unit tests covering important business and security rules, including:

- KYC validation
- Authorization
- Transaction rules
- Ownership validation
- Security-related behavior

Run tests using:

```bash
./mvnw test
```

Windows:

```powershell
.\mvnw.cmd test
```

---

# 🧯 Troubleshooting

## Frontend shows empty data

Verify:

```env
VITE_API_BASE_URL=http://localhost:8080
```

and make sure the Spring Boot backend is running.

---

## Port conflict

Default ports:

```text
Backend  → 8080
Frontend → 5173
```

Depending on configuration, the frontend may use:

```text
8081
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
- [`swagger-documentation/openapi.yaml`](swagger-documentation/openapi.yaml)
- [`swagger-documentation/openapi.json`](swagger-documentation/openapi.json)

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
├── src/
│   ├── main/
│   │   ├── java/
│   │   └── resources/
│   │
│   └── test/
│
├── bank-frontend/
│
├── public/
│   └── diagrams/
│       ├── double-ledger-architecture.png
│       ├── double-ledger-authentication-jwt-rbac.png
│       ├── double-ledger-concurrency-locking.png
│       ├── double-ledger-database-erd.png
│       ├── double-ledger-deployment.png
│       ├── double-ledger-idempotency-flow.png
│       ├── double-ledger-ledger.png
│       └── double-ledger-transaction-flow.png
│
├── swagger-documentation/
│   ├── openapi.yaml
│   └── openapi.json
│
├── PROJECT_REPORT.md
├── pom.xml
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
