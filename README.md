<div align="center">

# 🏦 Bank Ledger Payment Engine

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
- [Demo](#-demo)
- [Architecture Diagrams](#-architecture-diagrams)
- [Key Features](#-key-features)
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

Bank Ledger Payment Engine is a fintech-style **Spring Boot** backend that models money movement using an **immutable double-entry ledger**, plus **UPI payment flows** and a **React dashboard**.

The security centerpiece is **full sender ownership validation**: even if someone knows an account number or UPI ID, they *still cannot* initiate payments unless the authenticated JWT user truly owns the sender account.

---


## 📽️ Project Demo

[![Watch the demo](https://img.youtube.com/vi/qOHr7ZWKY7E/0.jpg)](https://www.youtube.com/watch?v=qOHr7ZWKY7E)

👉 [Live Demo Page](https://aryandevcodes.github.io/Bank-Ledger-Payment-Engine/)

---

## 🗺️ Architecture Diagrams

> Diagram assets live in [demo/docs/](demo/docs).

### System architecture

![System Architecture](demo/docs/system-architecture-diagram.png)

### Database relations (ERD)

![Database Relation Diagram](demo/docs/database-relation-diagram.png)

### Ledger engine (double-entry)

![Ledger Engine Diagram](demo/docs/ledger-engine-diagram.png)

### Complete payment flow

![Complete Payment Flow](demo/docs/complete-payment-flow.png)

### Idempotency flow

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

---

## 🧩 Project Structure

<details>
<summary><b>Backend (Spring Boot)</b></summary>

```text
src/main/java/com/bank/
  controller/    REST APIs
  service/       business logic
  repository/    persistence
  entity/        JPA entities
  ledger/        ledger subsystem
```

</details>

<details>
<summary><b>Frontend (React)</b></summary>

```text
bank-frontend/
  src/pages
  src/components
  src/contexts
  src/lib
```

</details>

---

## 🧯 Troubleshooting

- **Frontend shows empty data** → confirm backend is running and `VITE_API_BASE_URL` points to it
- **Port conflicts** → keep frontend on 8081 and backend on 8080 (or change Vite port)
- **Database connection fails** → verify PostgreSQL is up and `application.yml` credentials match

---

## 📎 Extra Docs (in this repo)
- Project report: [PROJECT_REPORT.md](PROJECT_REPORT.md)
- Customer API guide: [CUSTOMER_API_GUIDE.md](CUSTOMER_API_GUIDE.md)
- Complete documentation: [COMPLETE_DOCUMENTATION.md](COMPLETE_DOCUMENTATION.md)

---

## 📄 License

No license file is included in this repository.
