# HTTP-based Bank Payment System with Ledger Architecture

A comprehensive Spring Boot REST API implementing **Double-Entry Ledger System** for accurate financial transaction management.

## 📋 Table of Contents

- [Overview](#overview)
- [Ledger-Based Architecture](#ledger-based-architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
- [Data Models](#data-models)
- [Database Schema](#database-schema)
- [Transaction Flow](#transaction-flow)
- [Error Handling](#error-handling)
- [Troubleshooting](#troubleshooting)
- [Future Enhancements](#future-enhancements)

---

## Overview

This Bank Management System implements a **Double-Entry Ledger System** following traditional accounting principles:

- **Immutable Financial Records**: All transactions recorded as permanent ledger entries
- **DEBIT/CREDIT System**: Every transaction creates offsetting entries
- **Balance Calculation**: Account balances computed from ledger, not stored
- **Audit Trail**: Complete history of all financial movements
- **Concurrency Safe**: Row-level locking prevents race conditions

---

## Ledger-Based Architecture

### Why Ledger System?

Traditional banking systems use **double-entry bookkeeping**:

✅ **Immutable Records**: Once written, ledger entries cannot be modified  
✅ **Audit Trail**: Complete history of all financial movements  
✅ **Balance Integrity**: Balances computed from ledger entries  
✅ **Reconciliation**: Easy to verify and audit transactions  

### How It Works

#### 1. Ledger Entity

```java
@Entity
@Table(name = "ledger")
public class Ledger {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ledgerId;
    
    private Long accountId;              // Internal account ID
    private BigDecimal amount;           // Always positive
    private String referenceId;          // Transaction reference
    
    @Enumerated(EnumType.STRING)
    private EntryType entryType;         // DEBIT or CREDIT
    
    @CurrentTimestamp
    private Instant ledgerDate;
}
```

#### 2. Entry Types

```java
public enum EntryType {
    DEBIT,   // Money leaving account (-)
    CREDIT   // Money entering account (+)
}
```

#### 3. Transaction Example

**Transfer ₹5,000 from Account A to Account B:**

1. Create Transaction (Status: INITIATED)
2. Lock both accounts
3. Validate sender balance
4. Create ledger entries:
   - Account A: DEBIT ₹5,000
   - Account B: CREDIT ₹5,000
5. Mark transaction COMPLETED

**Ledger Table:**
```
| ledger_id | account_id | amount | reference_id | entry_type | ledger_date       |
|-----------|------------|--------|--------------|------------|-------------------|
| 1         | 101        | 5000   | TXN_1        | DEBIT      | 2026-02-03 10:15  |
| 2         | 102        | 5000   | TXN_1        | CREDIT     | 2026-02-03 10:15  |
```

#### 4. Balance Calculation

```sql
SELECT COALESCE(
    SUM(
        CASE 
            WHEN entry_type = 'CREDIT' THEN amount
            WHEN entry_type = 'DEBIT' THEN -amount
        END
    ), 0
) AS balance
FROM ledger
WHERE account_id = :accountId;
```

**Benefits:**
- ✅ No balance field inconsistencies
- ✅ Complete transaction history
- ✅ Point-in-time balance queries
- ✅ Easy auditing and reconciliation

---

## Features

### 🏦 Ledger System
- Double-entry bookkeeping (DEBIT/CREDIT)
- Immutable financial records
- Real-time balance calculation from ledger
- Historical transaction traceability
- Unique constraints prevent duplicate entries

### 🏛️ Bank Management
- Create, read, update, delete banks
- Branch information and IFSC codes
- Multi-bank support

### 👤 Customer Management
- KYC verification status tracking
- Customer status management
- Unique email and phone constraints

### 💰 Account Management
- Multi-currency support (default: INR)
- Account status tracking
- Auto-generated account numbers
- Initial deposit via ledger entry

### 💸 Transaction Management
- Inter-bank and intra-bank transfers
- Atomic ledger-based updates
- Row-level locking for concurrency
- Transaction status tracking
- Denormalized fields for fast queries

### 🛡️ Error Handling
- Global exception handler
- Custom business exceptions
- Detailed error responses

### 📚 API Documentation
- Swagger/OpenAPI at `/swagger-ui.html`
- Interactive API testing

---

## Technology Stack

- **Framework**: Spring Boot 3.5.10
- **Java**: 21
- **Database**: PostgreSQL
- **ORM**: Hibernate/JPA
- **Mapping**: MapStruct 1.6.3
- **Build Tool**: Maven
- **Documentation**: SpringDoc OpenAPI 2.7.0
- **Utilities**: Lombok

---

## Project Structure

```
bank/
├── src/main/java/com/bank/
│   ├── BankApplication.java
│   ├── controller/              # REST endpoints
│   │   ├── BankController.java
│   │   ├── AccountController.java
│   │   ├── CustomerController.java
│   │   └── TransactionController.java
│   ├── service/                 # Business logic
│   │   ├── bank/
│   │   ├── account/
│   │   ├── customer/
│   │   └── transaction/
│   ├── repository/              # Data access
│   │   ├── BankRepository.java
│   │   ├── AccountRepository.java
│   │   ├── CustomerRepository.java
│   │   ├── TransactionRepository.java
│   │   └── LedgerRepository.java      # ⭐ Ledger queries
│   ├── entity/                  # JPA entities
│   │   ├── Bank.java
│   │   ├── Account.java
│   │   ├── Customer.java
│   │   ├── Transaction.java
│   │   ├── Ledger.java                # ⭐ Ledger entity
│   │   └── Status.java
│   ├── ledger/                  # ⭐ Ledger subsystem
│   │   ├── EntryType.java             # DEBIT/CREDIT enum
│   │   ├── LedgerWriter.java          # Ledger interface
│   │   └── LedgerWriterIMPL.java      # Ledger implementation
│   ├── dto/                     # Data transfer objects
│   └── exception/               # Custom exceptions
├── src/main/resources/
│   └── application.yml
└── pom.xml
```

---

## Installation & Setup

### Prerequisites
- Java 21+
- Maven 3.8+
- PostgreSQL 12+

### Step 1: Database Setup

```sql
-- Create database
CREATE DATABASE bank_db;

-- Connect
\c bank_db
```

### Step 2: Configure Application

Edit `src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/bank_db
    username: postgres
    password: your_password
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
```

### Step 3: Build & Run

```bash
# Build
mvn clean install

# Run
mvn spring-boot:run
```

Application starts at: `http://localhost:8080`  
Swagger UI: `http://localhost:8080/swagger-ui.html`

---

## API Documentation

### Base URL
```
http://localhost:8080
```

### Response Format
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": {},
  "timestamp": "2026-02-03T10:15:30.091+05:30"
}
```

### Key Endpoints

#### Banks
- `POST /bank/create` - Create bank
- `GET /bank` - Get all banks
- `GET /bank/{id}` - Get bank by ID
- `PATCH /bank/{id}` - Update bank
- `DELETE /bank/{id}` - Delete bank

#### Accounts
- `POST /account/{bankName}` - Create account
- `GET /account` - Get all accounts
- `GET /account/{accountNumber}` - Get account
- `GET /account/name/{bankName}` - Get accounts by bank
- `PATCH /account/{accountNumber}` - Update account
- `DELETE /account/{accountNumber}` - Delete account

#### Transactions
- `POST /transaction` - Create transaction
- `GET /transaction?accountNumber={}&email={}` - Get transactions

---

## Data Models

### Ledger (Core)
```java
@Entity
public class Ledger {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ledgerId;
    
    private Long accountId;              // Internal account ID
    private BigDecimal amount;           // Always positive
    private String referenceId;          // Transaction ID
    
    @Enumerated(EnumType.STRING)
    private EntryType entryType;         // DEBIT or CREDIT
    
    @CurrentTimestamp
    private Instant ledgerDate;
}
```

### Transaction
```java
@Entity
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long transactionId;
    
    @ManyToOne
    private Account senderAccount;
    
    @ManyToOne
    private Account receiverAccount;
    
    // Denormalized fields for fast queries
    private String senderAccountNumber;
    private String senderEmail;
    private String senderBankName;
    private String receiverAccountNumber;
    private String receiverEmail;
    private String receiverBankName;
    
    private BigDecimal amount;
    
    @Enumerated(EnumType.STRING)
    private Status status;                // INITIATED, COMPLETED, FAILED
    
    @CreationTimestamp
    private LocalDateTime transactionDate;
}
```

### Account
```java
@Entity
public class Account {
    @Id
    private String accountNumber;         // ACC_{BankName}_{UUID}
    
    private String currencyCode;          // Default: INR
    private BigDecimal balance;           // Synced with ledger
    
    @Enumerated(EnumType.STRING)
    private Status status;
    
    @ManyToOne
    private Bank bank;
    
    @ManyToOne
    private Customer customer;
}
```

---

## Database Schema

### Ledger Table
```sql
CREATE TABLE ledger (
    ledger_id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL,
    amount NUMERIC NOT NULL,
    reference_id VARCHAR(255) NOT NULL,
    entry_type VARCHAR(10) NOT NULL,      -- 'DEBIT' or 'CREDIT'
    ledger_date TIMESTAMP NOT NULL,
    
    -- Prevent duplicate entries
    CONSTRAINT uk_ledger_entry UNIQUE (reference_id, account_id, entry_type)
);

CREATE INDEX idx_ledger_account_id ON ledger(account_id);
CREATE INDEX idx_ledger_reference_id ON ledger(reference_id);
```

### Account Table
```sql
CREATE TABLE account (
    id BIGSERIAL PRIMARY KEY,             -- Internal ID for ledger
    account_number VARCHAR(255) UNIQUE,   -- Public account number
    balance NUMERIC NOT NULL,
    currency_code VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(50),
    bank_id VARCHAR(255),
    customer_id VARCHAR(255),
    FOREIGN KEY (bank_id) REFERENCES banks(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    from_account_id BIGINT NOT NULL,
    to_account_id BIGINT NOT NULL,
    
    -- Denormalized fields
    sender_account_number VARCHAR(255),
    sender_email VARCHAR(255),
    sender_bank_name VARCHAR(255),
    receiver_account_number VARCHAR(255),
    receiver_email VARCHAR(255),
    receiver_bank_name VARCHAR(255),
    
    amount NUMERIC NOT NULL,
    status VARCHAR(50),
    transaction_date TIMESTAMP NOT NULL,
    
    FOREIGN KEY (from_account_id) REFERENCES account(id),
    FOREIGN KEY (to_account_id) REFERENCES account(id)
);

CREATE INDEX idx_txn_sender_account ON transactions(sender_account_number);
CREATE INDEX idx_txn_receiver_account ON transactions(receiver_account_number);
CREATE INDEX idx_txn_date ON transactions(transaction_date);
```

---

## Transaction Flow

### Complete Flow with Ledger

```java
@Transactional
public TransactionResponseDTO makeTransaction(TransactionRequestDTO dto) {
    // 1. Lock accounts (prevent concurrent modifications)
    Account sender = accountRepository.lockById(senderId);
    Account receiver = accountRepository.lockById(receiverId);
    
    // 2. Calculate balance from ledger
    BigDecimal senderBalance = ledgerRepository.calculateBalance(sender.getId());
    
    // 3. Validate sufficient funds
    if (senderBalance.compareTo(dto.getAmount()) < 0) {
        throw new GlobalServiceException("Insufficient balance");
    }
    
    // 4. Create transaction record
    Transaction tx = new Transaction();
    tx.setSenderAccount(sender);
    tx.setReceiverAccount(receiver);
    tx.setAmount(dto.getAmount());
    tx.setStatus(Status.INITIATED);
    
    // Denormalize for fast queries
    tx.setSenderAccountNumber(sender.getAccountNumber());
    tx.setSenderEmail(sender.getCustomer().getEmail());
    tx.setSenderBankName(sender.getBank().getBankName());
    tx.setReceiverAccountNumber(receiver.getAccountNumber());
    tx.setReceiverEmail(receiver.getCustomer().getEmail());
    tx.setReceiverBankName(receiver.getBank().getBankName());
    
    tx = transactionRepository.save(tx);
    
    try {
        // 5. Create ledger entries (double-entry)
        ledgerWriter.postDebit(
            sender.getId(),
            dto.getAmount(),
            tx.getTransactionId().toString()
        );
        
        ledgerWriter.postCredit(
            receiver.getId(),
            dto.getAmount(),
            tx.getTransactionId().toString()
        );
        
        // 6. Mark transaction completed
        tx.setStatus(Status.COMPLETED);
        
    } catch (Exception e) {
        tx.setStatus(Status.FAILED);
        throw e;  // Rollback transaction
    }
    
    return transactionMapper.toResponseDTO(transactionRepository.save(tx));
}
```

### Key Design Decisions

1. **Row-Level Locking**: `lockById()` prevents concurrent modifications
2. **Balance from Ledger**: Always calculate from ledger, not stored balance
3. **Denormalized Fields**: Store account details at transaction time
4. **Atomic Operations**: All ledger writes within transaction boundary
5. **Status Tracking**: INITIATED → COMPLETED/FAILED

---

## Error Handling

### Custom Exceptions
- `BusinessRuleException` - Business rule violations
- `InvalidDataException` - Invalid input data
- `ResourceNotFoundException` - Resource not found
- `GlobalServiceException` - General service errors

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Insufficient balance",
  "error": {
    "errorCode": "INSUFFICIENT_BALANCE",
    "errorMessage": "Account balance is insufficient for this transaction"
  },
  "timestamp": "2026-02-03T10:15:30.091+05:30"
}
```

---

## Troubleshooting

### Balance Mismatch

**Symptom**: Account balance doesn't match ledger

**Diagnosis**:
```sql
-- Check account balance field
SELECT account_number, balance FROM account WHERE account_number = 'ACC_SBI_xxx';

-- Calculate from ledger
SELECT COALESCE(SUM(
    CASE 
        WHEN entry_type = 'CREDIT' THEN amount
        WHEN entry_type = 'DEBIT' THEN -amount
    END
), 0) AS ledger_balance
FROM ledger l
JOIN account a ON a.id = l.account_id
WHERE a.account_number = 'ACC_SBI_xxx';
```

**Fix**: Sync balance from ledger
```sql
UPDATE account a
SET balance = (
    SELECT COALESCE(SUM(
        CASE 
            WHEN l.entry_type = 'CREDIT' THEN l.amount
            WHEN l.entry_type = 'DEBIT' THEN -l.amount
        END
    ), 0)
    FROM ledger l
    WHERE l.account_id = a.id
)
WHERE a.account_number = 'ACC_SBI_xxx';
```

### Duplicate Ledger Entry

**Error**: `Duplicate key violation on constraint 'uk_ledger_entry'`

**Cause**: Attempting to create duplicate entry for same transaction

**Solution**: This is expected! Check if transaction was already processed.

### Transaction Stuck in INITIATED

**Symptom**: Status remains INITIATED after execution

**Diagnosis**:
```sql
SELECT t.transaction_id, t.status, COUNT(l.ledger_id) as entries
FROM transactions t
LEFT JOIN ledger l ON l.reference_id = CAST(t.transaction_id AS VARCHAR)
WHERE t.transaction_id = :txnId
GROUP BY t.transaction_id, t.status;
```

**Expected**: 2 ledger entries (1 DEBIT + 1 CREDIT)

**Fix**: Update status if ledger entries exist
```sql
UPDATE transactions 
SET status = 'COMPLETED' 
WHERE transaction_id = :txnId 
  AND EXISTS (
    SELECT 1 FROM ledger 
    WHERE reference_id = CAST(:txnId AS VARCHAR)
    GROUP BY reference_id
    HAVING COUNT(*) = 2
  );
```

---

## Future Enhancements

### Ledger System
- [ ] Ledger entry reversal/correction mechanism
- [ ] Scheduled reconciliation jobs
- [ ] Balance snapshot tables for performance
- [ ] Ledger archival for old transactions
- [ ] Multi-currency ledger with exchange rates

### Security
- [ ] JWT authentication
- [ ] Role-based access control
- [ ] API rate limiting

### Features
- [ ] Transaction pagination
- [ ] Scheduled transactions
- [ ] Transaction reversal with compensating entries
- [ ] Batch transaction processing
- [ ] Account statements (PDF/Excel)

### Reporting
- [ ] Transaction analytics dashboard
- [ ] Balance history reports
- [ ] Ledger reconciliation reports
- [ ] Audit trail reports

### Performance
- [ ] Redis caching for balance calculations
- [ ] Read replicas for queries
- [ ] Table partitioning for large ledgers
- [ ] Async processing for non-critical updates

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-02-03 | **Major Update**: Implemented double-entry ledger system, row-level locking, denormalized transaction fields, balance calculation from ledger |
| 1.0.0 | 2026-02-01 | Initial release |

---

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

---

## License

Educational and development purposes.

---

**Last Updated**: February 3, 2026

---

## Quick Start Example

```bash
# 1. Create a bank
curl -X POST http://localhost:8080/bank/create \
  -H "Content-Type: application/json" \
  -d '{"bankName":"SBI","branch":"Main","ifscCode":"SBIN0001234","city":"Delhi","state":"Delhi"}'

# 2. Create account with initial deposit
curl -X POST http://localhost:8080/account/SBI \
  -H "Content-Type: application/json" \
  -d '{"currencyCode":"INR","initialDeposit":50000,"customer":{"fullName":"John Doe","email":"john@example.com","phoneNumber":"9876543210"}}'

# 3. Perform transaction
curl -X POST http://localhost:8080/transaction \
  -H "Content-Type: application/json" \
  -d '{"senderAccount":"ACC_SBI_xxx","receiverAccount":"ACC_SBI_yyy","amount":5000}'
```

---

For detailed API documentation, visit: `http://localhost:8080/swagger-ui.html`

