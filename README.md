<div align="center">

# 🏦 Double-Entry Payment Ledger System (Spring Boot)

**Double-entry ledger + secure UPI payments — with JWT auth and strict sender ownership validation.**

![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.10-6DB33F?logo=springboot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-DB-4169E1?logo=postgresql&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring%20Security-Enabled-6DB33F?logo=springsecurity&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?logo=jsonwebtokens&logoColor=white)
![OpenAPI](https://img.shields.io/badge/Swagger%20%2F%20OpenAPI-Docs-85EA2D?logo=swagger&logoColor=black)
![Maven](https://img.shields.io/badge/Maven-Build-C71A36?logo=apachemaven&logoColor=white)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-Dev%20Server-646CFF?logo=vite&logoColor=white)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Open-0ea5e9?style=for-the-badge)](https://aryandevcodes.github.io/Bank-Ledger-Payment-Engine/)
[![Swagger UI](https://img.shields.io/badge/Swagger%20UI-Local-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](http://localhost:8080/swagger-ui.html)

</div>

---

## 📌 Contents

- [What this project is](#-what-this-project-is)
- [Why this system matters](#-why-this-system-matters)
- [Demo](#-demo)
- [Architecture Diagrams](#-architecture-diagrams)
- [Key Features](#-key-features)
- [Failure Handling](#-failure-handling)
- [Design Tradeoffs](#-design-tradeoffs)
- [Tech Stack](#-tech-stack)
- [Quick Start (4–5 steps)](#-quick-start-45-steps)
- [Security Highlights](#-security-highlights-must-read)
- [API Documentation](#-api-documentation)
- [Ledger Architecture](#-ledger-architecture-double-entry)
- [Frontend](#-frontend-react-dashboard)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)
- [Extra Docs](#-extra-docs-in-this-repo)
- [License](#-license)

## ✨ What this project is

Double-Entry Payment Ledger System is a fintech-style **Spring Boot** backend that models money movement using an **immutable double-entry ledger**, plus **UPI payment flows** and a **React dashboard**.

The security centerpiece is **full sender ownership validation**: even if someone knows an account number or UPI ID, they *still cannot* initiate payments unless the authenticated JWT user truly owns the sender account.

---

## Why this system matters

In financial systems, storing balances directly can lead to inconsistencies due to concurrent updates, retries, and partial failures.

This system avoids that by:

- Deriving balances from transaction history (ledger entries)
- Enforcing double-entry accounting (every movement is DEBIT + CREDIT)
- Using immutable logs for auditability and easier reconciliation

---

## 🎬 Demo

- ▶️ **Live Demo page:** https://aryandevcodes.github.io/Bank-Ledger-Payment-Engine/
- 📄 **Local demo HTML (video embed):** [demo/index.html](demo/index.html)

[![Watch the demo](https://img.youtube.com/vi/qOHr7ZWKY7E/0.jpg)](https://www.youtube.com/watch?v=qOHr7ZWKY7E)

---

## 🗺️ Architecture Diagrams

> Diagram assets live in [demo/docs/](demo/docs).

### System architecture

What this diagram is showing (end-to-end layers):

1. **Client (Postman / Frontend)** calls either `/transaction` (transfer) or `/upi/pay`
2. **JWT Auth** gates protected endpoints before business logic executes
3. **API Layer (Spring Boot Controllers)** receives the request and delegates
4. **Service Layer** orchestrates use-cases:
    - `TransactionService` for transfers (API: `/transaction`)
    - `UpiService` for UPI payments (API: `/upi/pay`)
    - `LedgerService` for posting ledger entries
5. **Core Engine** contains the “correctness primitives”:
    - **Idempotency Handler** (safe retries)
    - **Transaction Validator** (amount/account invariants)
    - **Ledger Processor** (double-entry posting)
    - **Debit = Credit enforcement** (system invariant)
6. **Persistence Layer (PostgreSQL)** stores:
    - **Transactions table** (status + snapshot)
    - **Ledger table** (**append-only**, the source of truth)
    - **UPI tables** (profiles + payment objects)
    - **Account table** (identity/metadata; balance correctness comes from ledger)
7. The right-side bracket highlights the **atomic transaction boundary**: either the whole ledger+status update commits, or everything rolls back.

![System Architecture](demo/docs/system-architecture-diagram.png)

### Database relations (ERD)

What to notice in this ERD:

- `banks → account`: a bank has many accounts
- `account → upi_profiles`: an account can have UPI profiles via `linked_account_id`
- `upi_profiles → upi_payment_obj`: UPI payment requests are tracked with a persisted object containing:
  - `transaction_id`
  - `idempotency_key`
- `upi_payment_obj → transactions`: the payment object links to the canonical transaction record
- `transactions → ledger`: ledger entries reference the transaction via `reference_id (transaction_id)`

Why this matters:

- **Idempotency is stateful**: the `upi_payment_obj` row is where duplicates/retries get deduplicated.
- **Audit is reconstructable**: `transactions` give business context; `ledger` gives immutable financial truth.
- **Balance is not stored** (as the diagram notes): balance is derived from ledger entries, preventing drift.

![Database Relation Diagram](demo/docs/database-relation-diagram.png)

### Ledger engine (double-entry)

How the ledger processing works (the invariant):

1. **Input**: `from_account`, `to_account`, `amount`
2. **Validation**: `amount > 0` and both accounts are valid
3. **Process**:
    - Step 1: create **DEBIT** entry (`account_id = sender`)
    - Step 2: create **CREDIT** entry (`account_id = receiver`)
4. **Check** (hard invariant): `Sum(DEBIT) == Sum(CREDIT)` — always
5. **Store**: append to the ledger table (append-only)

Result: balances can be computed from the ledger as credits minus debits, which is safer than trusting a mutable “balance” column.

![Ledger Engine Diagram](demo/docs/ledger-engine-diagram.png)

### Complete payment flow

This is the detailed execution path the system follows:

1. **User initiates payment** (UPI / transfer)
2. **API receives request** and validates input
3. **Idempotency check** (`upi_payment_obj`):
    - If the key already exists → **return previous result**
    - If it’s a failed/invalid previous attempt → surfaced via stored failure status
4. **Create transaction record** (transactions table) with `status = PROCESSING`
5. **Validate accounts** (`from_account_id`, `to_account_id` must exist)
6. **Ledger processing (CRITICAL - Double Entry)**:
    - Ledger Entry 1: sender **DEBIT** amount = X
    - Ledger Entry 2: receiver **CREDIT** amount = X
7. **Store in ledger table** (append-only)
8. **Update transaction status** → `SUCCESS` / `FAILED`
9. **Update upi_payment_obj** with final status + `reference transaction_id`
10. **Return response**

Failure behavior shown in red:

- On errors, the system **rolls back the transaction**, marks the business transaction as **FAILED**, and persists a **failure_reason** (in `upi_payment_obj`) so retries are safe and diagnosable.

![Complete Payment Flow](demo/docs/complete-payment-flow.png)

### Idempotency flow

This is the decision tree used for safe retries:

1. Request arrives with an **`idempotency_key`**
2. Check if a matching record exists in `upi_payment_obj`
3. If it exists → **return the stored response** (no double-debit)
4. If it does not exist → **execute the payment**, then **store key + result**
5. Return result to the client

The diagram’s key point: idempotency prevents duplicate payments caused by retry issues or network failures.

![Idempotency Flow](demo/docs/idempotency-flow.png)

---

## ✅ Key Features

- 📒 **Double-entry ledger** (DEBIT + CREDIT) for every transaction
- 🧮 **Balances derived from ledger** (reduces “stored balance drift”)
- 🔐 **JWT authentication** + role-based access (Spring Security)
- 🧾 **Audit-friendly trail** with immutable ledger references
- 🪙 **Secure UPI payments** + UPI profiles (link UPI → account)
- 🔁 **Idempotent UPI payment execution** (safe retries)
- 🖥️ **React dashboard** (admin/manager/auditor/user views)

---

## Failure Handling

- Duplicate requests handled via idempotency keys (safe retries)
- Partial failures avoided using atomic database transactions
- Invalid financial states prevented via strict debit/credit + validation rules

---

## Design Tradeoffs

- Immutable ledger increases storage, but dramatically improves auditability
- Balance derivation can be slower than stored balances, but ensures correctness
- Strict validation reduces flexibility, but prevents silent data corruption

---

## 🧰 Tech Stack

**Backend**

- Java 21
- Spring Boot (Web, Data JPA, Validation, Security)
- PostgreSQL
- JWT (JJWT)
- Swagger / OpenAPI (springdoc)

**Frontend**

- React + Vite
- Tailwind CSS + shadcn/ui (Radix)

---

## 🚀 Quick Start (4–5 steps)

### 1) Prerequisites

- Java 21
- PostgreSQL running locally
- Node.js 18+ (or Bun)

### 2) Configure the backend

Update the database configuration in `src/main/resources/application.yml`.

> Tip: use environment variables in real deployments. This repo’s default `application.yml` is aimed at local development.

### 3) Start Spring Boot (port 8080)

Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

macOS/Linux:

```bash
./mvnw spring-boot:run
```

Backend base URL: `http://localhost:8080`

### 4) Start the React frontend

```bash
cd bank-frontend
npm install
```

Create `bank-frontend/.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_ENABLE_MOCKS=false
```

Run:

```bash
npm run dev
```

Frontend URL: `http://localhost:8081`

### 5) Open Swagger and try endpoints

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

---

## 🛡️ Security Highlights (Must Read)

### ✅ Sender Ownership Enforcement – Implemented

Critical protection against **Insecure Direct Object References (IDOR)**:

- Payment endpoints reject requests where the authenticated user does **not** own the source UPI/account.
- Verified server-side in `UpiResolver.resolveAndVerifyOwnership()`:
  - Matches JWT username against the UPI-linked `Customer → User.username`
  - Throws `AccessDeniedException` (→ HTTP 403) on mismatch
- Prevents: guessing UPI IDs, using stolen account numbers, unauthorized debits

### 🔐 Authentication & Authorization

- Stateless JWT (Spring Security 6 + JJWT)
- Protected endpoints require `Authorization: Bearer <token>`
- `@EnableMethodSecurity` ready for future `@PreAuthorize` role/ownership checks

---

## 📚 API Documentation

- Swagger UI (runtime): `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON (runtime): `http://localhost:8080/v3/api-docs`

Bundled specs:

- [swagger-documentation/openapi.yaml](swagger-documentation/openapi.yaml)
- [swagger-documentation/openapi.json](swagger-documentation/openapi.json)

---

## 🧾 Ledger Architecture (double-entry)

This project implements traditional accounting:

- **Every transaction creates two ledger entries** (DEBIT & CREDIT)
- Ledger entries are treated as **immutable financial records**
- Balances can be computed from ledger history

<details>
<summary><b>Ledger example (transfer ₹5,000)</b></summary>

1) Debit sender ₹5,000
2) Credit receiver ₹5,000

| entry_type | amount | meaning |
|-----------:|:------:|:--------|
| DEBIT      | 5000   | money leaves sender |
| CREDIT     | 5000   | money enters receiver |

</details>

---

## 🖥️ Frontend (React dashboard)

Frontend lives in `bank-frontend/`.

Includes:

- Auth (token storage + protected routing)
- Role-based dashboards
- Banking flows (banks/customers/accounts/transactions)
- UPI flows (profiles + payments)
- Security/audit screens (audit logs, access logs, sessions)

<details>
<summary><b>Frontend scripts</b></summary>

```bash
cd bank-frontend
npm run dev
npm run build
npm run preview
npm run test
```

</details>



## 🧯 Troubleshooting

- **Frontend shows empty data** → confirm backend is running and `VITE_API_BASE_URL` points to it
- **Port conflicts** → keep frontend on 8081 and backend on 8080 (or change Vite port)
- **Database connection fails** → verify PostgreSQL is up and `application.yml` credentials match

---

## 📎 Extra Docs (in this repo)
- Project report: [PROJECT_REPORT.md](PROJECT_REPORT.md)
---


