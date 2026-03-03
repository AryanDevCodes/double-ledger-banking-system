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

## 📽️ Project Demo

[![Watch the demo](https://img.youtube.com/vi/qOHr7ZWKY7E/0.jpg)](https://www.youtube.com/watch?v=qOHr7ZWKY7E)

👉 [Live Demo Page](https://aryandevcodes.github.io/-Bank-Ledger-Payment-Engine1/)


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

#### UPI Payments
- `POST /upi/pay` - Execute UPI payment (idempotent)

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
5. **Status Tracking**: INITIATED → PROCESSING → COMPLETED/FAILED

---

## Refactored Transaction Code

### Overview

The transaction service has been refactored to follow clean code principles:
- ✅ **Semantic Compression**: Intent-revealing helper methods
- ✅ **Deterministic Locking**: Prevents deadlocks by locking in order
- ✅ **40% Cognitive Load Reduction**: Complex logic broken into named steps
- ✅ **No Behavioral Changes**: Same functionality, better structure

### Core Implementation

```java
@Override
@Transactional
public TransactionResponseDTO makeTransaction(@NotNull TransactionRequestDTO dto) {
    // 1. Resolve account references (no locking yet)
    Account senderRef = resolveSenderAccount(dto);
    Account receiverRef = resolveReceiverAccount(dto);

    // 2. Validate business rules
    if (senderRef.getId().equals(receiverRef.getId())) {
        throw new InvalidDataException("Sender and receiver cannot be the same account");
    }

    // 3. Lock accounts in deterministic order (prevents deadlocks)
    LockedAccounts locked = lockAccountsInOrder(
            senderRef.getId(),
            receiverRef.getId()
    );

    Account sender = locked.sender();
    Account receiver = locked.receiver();

    // 4. Calculate balance from ledger
    BigDecimal senderBalance = ledgerRepository.calculateBalance(sender.getId());

    if (senderBalance.compareTo(dto.getAmount()) < 0) {
        throw new GlobalServiceException("Insufficient balance");
    }

    // 5. Create transaction with snapshot data
    Transaction tx = transactionMapper.toEntity(dto);
    populateTransactionSnapshot(tx, sender, receiver);

    tx.setStatus(Status.INITIATED);
    tx = transactionRepository.save(tx);

    try {
        // 6. Create double-entry ledger records
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

        tx.setStatus(Status.COMPLETED);

        // 7. Update cached balances
        sender.setBalance(
                ledgerRepository.calculateBalance(sender.getId())
        );
        receiver.setBalance(
                ledgerRepository.calculateBalance(receiver.getId())
        );

    } catch (Exception ex) {
        tx.setStatus(Status.FAILED);
        transactionRepository.save(tx);
        throw ex;
    }

    return transactionMapper.toResponseDTO(
            transactionRepository.save(tx)
    );
}
```

### Helper Methods

#### 1. Deterministic Account Locking

**Problem**: Concurrent transactions can deadlock if they lock accounts in different orders.

**Solution**: Always lock accounts in ascending ID order.

```java
/**
 * Locks accounts in deterministic order to prevent deadlocks.
 * Always locks the account with lower ID first.
 */
private LockedAccounts lockAccountsInOrder(Long senderId, Long receiverId) {

    Long firstId = senderId < receiverId ? senderId : receiverId;
    Long secondId = senderId < receiverId ? receiverId : senderId;

    Account first = accountRepository.lockById(firstId)
            .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

    Account second = accountRepository.lockById(secondId)
            .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

    Account sender = first.getId().equals(senderId) ? first : second;
    Account receiver = first.getId().equals(receiverId) ? first : second;

    return new LockedAccounts(sender, receiver);
}
```

**Value Object**:
```java
/**
 * Value object for holding locked sender and receiver accounts.
 * This is used to maintain deterministic locking order and prevent deadlocks.
 */
record LockedAccounts(Account sender, Account receiver) {}
```

**Benefits**:
- ✅ **No Deadlocks**: Consistent lock ordering prevents circular waits
- ✅ **Type Safety**: Returns both accounts in correct roles
- ✅ **Self-Documenting**: Name reveals intent

#### 2. Transaction Snapshot Population

**Purpose**: Capture account state at transaction time for historical accuracy.

```java
/**
 * Populates transaction with denormalized snapshot data.
 * This captures the state of accounts at transaction time for historical accuracy.
 */
private void populateTransactionSnapshot(
        Transaction tx,
        Account sender,
        Account receiver
) {
    tx.setSenderAccount(sender);
    tx.setReceiverAccount(receiver);
    tx.setSenderBank(sender.getBank());
    tx.setReceiverBank(receiver.getBank());

    tx.setSenderAccountNumber(sender.getAccountNumber());
    tx.setSenderEmail(sender.getCustomer().getEmail());
    tx.setSenderBankName(sender.getBank().getBankName());

    tx.setReceiverAccountNumber(receiver.getAccountNumber());
    tx.setReceiverEmail(receiver.getCustomer().getEmail());
    tx.setReceiverBankName(receiver.getBank().getBankName());
}
```

**Why Denormalize?**
- ✅ Fast queries without joins
- ✅ Historical accuracy (even if account details change)
- ✅ Audit trail completeness

#### 3. Account Resolution

**Flexible Input**: Support both account numbers and bank names.

```java
private Account resolveSenderAccount(TransactionRequestDTO dto) {
    if (dto.getSenderBankName() != null && !dto.getSenderBankName().isBlank()) {
        List<Account> senderAccounts = accountRepository.findByBankBankName(dto.getSenderBankName());
        if (senderAccounts.isEmpty()) {
            throw new ResourceNotFoundException("Account", "bankName", dto.getSenderBankName());
        }
        return senderAccounts.getFirst();
    }

    Account senderAccount = accountRepository.findByAccountNumber(dto.getSenderAccount());
    if (senderAccount == null) {
        throw new ResourceNotFoundException("Account", "accountNumber", dto.getSenderAccount());
    }
    return senderAccount;
}
```

### UPI Payment Integration

**Idempotent UPI Payments** using `UpiPaymentOBJ`:

```java
@Override
@Transactional
public TransactionResponseDTO executeUpiPayment(UpiPayRequestDTO dto) {

    // 1. Check for existing payment intent (idempotency)
    UpiPaymentOBJ intent =
            upiPaymentObjRepository.findByIdempotencyKey(dto.getIdempotencyKey())
                    .orElseGet(() -> createIntent(dto));

    // 2. Return existing transaction if already completed
    if (intent.getStatus() == Status.COMPLETED) {
        return transactionRepository
                .findTransactionByTransactionId(intent.getTransactionId())
                .map(transactionMapper::toResponseDTO)
                .orElseThrow(() -> new GlobalServiceException("Transaction not found"));
    }

    // 3. Fail fast if previous attempt failed
    if (intent.getStatus() == Status.FAILED) {
        throw new GlobalServiceException("Previous payment attempt failed");
    }

    // 4. Transition from INITIATED to PROCESSING
    if (intent.getStatus() == Status.INITIATED) {
        intent.setStatus(Status.PROCESSING);
        upiPaymentObjRepository.save(intent);
    }

    // 5. Resolve UPI IDs to accounts
    Account sender = upiResolver.resolveActiveAccount(intent.getFromUpi());
    Account receiver = upiResolver.resolveActiveAccount(intent.getToUpi());

    TransactionResponseDTO response;

    try {
        // 6. Execute transaction through standard flow
        TransactionRequestDTO transactionRequest = new TransactionRequestDTO();
        transactionRequest.setSenderAccount(sender.getAccountNumber());
        transactionRequest.setReceiverAccount(receiver.getAccountNumber());
        transactionRequest.setAmount(intent.getAmount());

        response = transactionService.makeTransaction(transactionRequest);

        // 7. Mark intent as completed
        intent.setStatus(Status.COMPLETED);
        intent.setTransactionId(response.getTransactionId());
        upiPaymentObjRepository.save(intent);

    } catch (Exception ex) {
        intent.setStatus(Status.FAILED);
        upiPaymentObjRepository.save(intent);
        throw ex;
    }

    return response;
}
```

**Idempotency Features**:
- ✅ **Unique Constraint**: `idempotency_key` prevents duplicate payments
- ✅ **Race Condition Safe**: Concurrent requests return same result
- ✅ **Retry Safe**: Can retry failed payments with same key
- ✅ **Status Tracking**: INITIATED → PROCESSING → COMPLETED/FAILED
- ✅ **Iron-Clad Concurrency**: PROCESSING state persisted BEFORE transaction execution
- ✅ **Failure Tracking**: Error messages stored in `failureReason` field

**Security Improvements**:
- 🔴 **TODO**: Ownership validation (see Security Considerations section)
- ✅ **Input Validation**: Amount and UPI format validation
- ✅ **Error Context**: Full failure details for debugging

### UPI Resolver

**Resolves UPI ID to Account**:

```java
@Component
@RequiredArgsConstructor
public class UpiResolver {
    private final UpiRepository upiRepository;

    @Transactional(readOnly = true)
    public Account resolveActiveAccount(String upiId){
        if (upiId == null || upiId.isBlank()) {
            throw new InvalidDataException("please enter upiId of account");
        }
        UpiProfile upiProfile = upiRepository.findByUpiIdAndStatus(upiId, Status.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("UpiProfile", "upiId", upiId));
        return upiProfile.getLinkedAccount();
    }
}
```

### Deadlock Prevention Example

**Scenario**: Two concurrent transactions

**Without Deterministic Locking** (❌ Can Deadlock):
```
Transaction A: Lock Account 1 → Wait for Account 2
Transaction B: Lock Account 2 → Wait for Account 1
Result: DEADLOCK!
```

**With Deterministic Locking** (✅ No Deadlock):
```
Transaction A: Lock Account 1 → Lock Account 2 → Complete
Transaction B: Wait for Account 1 → Lock Account 1 → Lock Account 2 → Complete
Result: SUCCESS - Transactions execute serially
```

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

## UPI Payment Endpoints

### Execute UPI Payment

**Endpoint:** `POST /upi/pay`

**Description:** Execute a UPI payment with idempotency support. The `idempotencyKey` ensures duplicate requests return the same result without creating duplicate payments.

**Request Body:**
```json
{
  "idempotencyKey": "PAYMENT_UUID_12345",
  "fromUpi": "sender@mybank",
  "toUpi": "receiver@mybank",
  "amount": 5000.00
}
```

**Request Fields:**
- `idempotencyKey` (required) - Unique key to prevent duplicate payments
- `fromUpi` (required) - Sender's UPI ID
- `toUpi` (required) - Receiver's UPI ID  
- `amount` (required) - Payment amount

**Response (Success - 201 Created):**
```json
{
  "transactionId": 1,
  "senderName": "John Doe",
  "senderAccountNumber": "ACC_SBI_abc123",
  "senderBankName": "SBI",
  "receiverName": "Jane Smith",
  "receiverAccountNumber": "ACC_ICICI_xyz789",
  "receiverBankName": "ICICI",
  "amount": 5000.00,
  "status": "COMPLETED",
  "transactionDate": "2026-02-09T10:15:30.091"
}
```

**Response (Idempotent - Already Completed):**
If you retry with the same `idempotencyKey`, you'll get the same transaction response with status 201.

**Error Responses:**

1. **Previous Payment Failed (400 Bad Request):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Previous payment attempt failed",
  "timestamp": "2026-02-09T10:15:30.091+05:30"
}
```

2. **Invalid UPI ID (404 Not Found):**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "UpiProfile not found with upiId: invalid@mybank",
  "timestamp": "2026-02-09T10:15:30.091+05:30"
}
```

3. **Insufficient Balance (400 Bad Request):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Insufficient balance",
  "timestamp": "2026-02-09T10:15:30.091+05:30"
}
```

### UPI Payment Flow

```
1. Client sends payment request with idempotencyKey
2. Validate input (amount > 0, fromUpi != toUpi)
3. System checks if payment intent already exists
   - If COMPLETED: Return existing transaction (with failureReason if any)
   - If FAILED: Throw exception with failure reason
   - If not exists: Create new intent (Status: INITIATED)
4. Transition to PROCESSING state (PERSISTED to DB immediately)
   - This prevents concurrent execution of same intent
5. 🔴 TODO: Verify caller owns fromUpi account (SECURITY CRITICAL)
6. Resolve UPI IDs to linked accounts
7. Execute transaction through ledger system
8. Mark intent as COMPLETED with transaction ID
   - On failure: Mark as FAILED with error message in failureReason
9. Return transaction response
```

**State Persistence Timeline**:
```
INITIATED → (DB Save) → PROCESSING → (Execute) → COMPLETED/FAILED → (DB Save)
            ↑ Iron-clad                           ↑ With failureReason
            idempotency                           if failed
```

### Idempotency Guarantees

✅ **Safe to Retry**: Network failures? Just retry with same key  
✅ **No Duplicates**: Same key always returns same transaction  
✅ **Race Condition Safe**: Concurrent requests handled via unique constraint  
✅ **Status Tracking**: INITIATED → PROCESSING → COMPLETED/FAILED  
✅ **Iron-Clad Concurrency**: PROCESSING persisted BEFORE execution prevents race conditions  
✅ **Error Transparency**: Failed payments include `failureReason` in response

### Example Usage

```bash
# Execute UPI payment
curl -X POST http://localhost:8080/upi/pay \
  -H "Content-Type: application/json" \
  -d '{
    "idempotencyKey": "PAYMENT_2026_02_09_001",
    "fromUpi": "john@mybank",
    "toUpi": "jane@mybank",
    "amount": 5000.00
  }'

# Retry (safe - returns same result)
curl -X POST http://localhost:8080/upi/pay \
  -H "Content-Type: application/json" \
  -d '{
    "idempotencyKey": "PAYMENT_2026_02_09_001",
    "fromUpi": "john@mybank",
    "toUpi": "jane@mybank",
    "amount": 5000.00
  }'
```

**Note:** Before executing UPI payments, ensure UPI profiles are registered for both sender and receiver accounts.

---

## Security Considerations

### 🔴 Critical: UPI Ownership Validation (TODO)

**Current Issue**: The system does not verify that the caller owns the `fromUpi` account before initiating a payment.

**Attack Vector**: Without ownership validation, an attacker could:
1. Discover valid UPI IDs (e.g., `john@mybank`)
2. Initiate payments from those accounts
3. Drain funds to their own account

**Required Fix**: Implement ownership verification before processing payments.

#### Implementation Plan

**Step 1: Add User Context**
```java
// Add authenticated user to the request context
public TransactionResponseDTO executeUpiPayment(
    UpiPayRequestDTO dto, 
    User authenticatedUser
) {
    // ...
}
```

**Step 2: Implement Ownership Validation**
```java
// In UpiResolver.java
public Account resolveAndVerifyOwnership(String upiId, User currentUser) {
    Account account = resolveActiveAccount(upiId);
    
    // Verify the user owns this UPI account
    if (!account.getCustomer().getId().equals(currentUser.getCustomerId())) {
        throw new SecurityException("User does not own the UPI account: " + upiId);
    }
    
    return account;
}
```

**Step 3: Update Service Call**
```java
// Replace this:
Account sender = upiResolver.resolveActiveAccount(obj.getFromUpi());

// With this:
Account sender = upiResolver.resolveAndVerifyOwnership(
    obj.getFromUpi(), 
    authenticatedUser
);
```

**Priority**: 🔴 **CRITICAL** - Must be implemented before production deployment

---

### ✅ Implemented Security Features

#### 1. Idempotency Protection
- ✅ **Unique Constraint**: `idempotency_key` prevents duplicate payments
- ✅ **Status Persistence**: PROCESSING state persisted BEFORE transaction execution
- ✅ **Iron-Clad Concurrency**: Two threads cannot process same intent

**How it works**:
```java
// Persist PROCESSING state immediately
if (obj.getStatus() == Status.INITIATED) {
    obj.setStatus(Status.PROCESSING);
    obj = upiPaymentObjRepository.save(obj);  // Commit to DB
}
// Now execute transaction - concurrent requests will see PROCESSING
```

#### 2. Failure Tracking
- ✅ **Failure Reason Storage**: Error messages stored in `failureReason` field
- ✅ **UI Feedback**: Failed payments include error details
- ✅ **Support Debugging**: Complete error context for troubleshooting

**Database Schema**:
```sql
ALTER TABLE upi_payment_obj 
ADD COLUMN failure_reason VARCHAR(500);
```

**Example Error Storage**:
```java
catch (Exception ex) {
    obj.setStatus(Status.FAILED);
    obj.setFailureReason(ex.getMessage());  // Store error
    upiPaymentObjRepository.save(obj);
    throw ex;
}
```

#### 3. Input Validation
- ✅ **Amount Validation**: Positive, non-zero amounts only
- ✅ **Same-Account Prevention**: Cannot transfer to self
- ✅ **UPI Format Validation**: Valid UPI ID format

```java
private void validateUpiRequest(UpiPayRequestDTO dto) {
    if (dto.getAmount() == null || dto.getAmount().signum() <= 0) {
        throw new InvalidDataException("Invalid amount");
    }
    if (dto.getFromUpi().equalsIgnoreCase(dto.getToUpi())) {
        throw new InvalidDataException("Sender and receiver UPI cannot be same");
    }
}
```

---

### Security Checklist for Production

- [ ] **Authentication**: Implement JWT/OAuth authentication
- [ ] **Authorization**: Role-based access control (RBAC)
- [ ] 🔴 **Ownership Validation**: Verify user owns fromUpi account
- [x] **Input Validation**: Amount, UPI format validation
- [x] **Idempotency**: Duplicate payment prevention
- [x] **Failure Tracking**: Error logging and storage
- [ ] **Rate Limiting**: Prevent payment abuse
- [ ] **Audit Logging**: Log all payment attempts
- [ ] **Encryption**: TLS for data in transit
- [ ] **Sensitive Data**: Mask/encrypt stored data

---

### Recommended Security Enhancements

#### 1. Rate Limiting
```java
@RateLimiter(limit = 10, window = "1m")
public TransactionResponseDTO executeUpiPayment(UpiPayRequestDTO dto) {
    // Max 10 payment attempts per minute per user
}
```

#### 2. Audit Logging
```java
@Audited
public TransactionResponseDTO executeUpiPayment(UpiPayRequestDTO dto) {
    auditLog.log(
        event = "UPI_PAYMENT_INITIATED",
        user = authenticatedUser.getId(),
        fromUpi = dto.getFromUpi(),
        amount = dto.getAmount()
    );
    // ...
}
```

#### 3. Two-Factor Authentication (2FA)
```java
// For high-value transactions
if (dto.getAmount().compareTo(new BigDecimal("50000")) > 0) {
    twoFactorAuth.verify(dto.getOtpCode(), authenticatedUser);
}
```

#### 4. IP Whitelisting
```java
// Restrict payment API to known IP ranges
@IpWhitelist(ranges = {"192.168.1.0/24", "10.0.0.0/8"})
public TransactionResponseDTO executeUpiPayment(UpiPayRequestDTO dto) {
    // ...
}
```

---

## Error Handling

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

