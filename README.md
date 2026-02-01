# HTTP_based_Bank Payment System

A comprehensive Spring Boot-based REST API for managing banking operations including bank management, customer accounts, and inter-bank transactions.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
  - [Bank Endpoints](#bank-endpoints)
  - [Account Endpoints](#account-endpoints)
  - [Transaction Endpoints](#transaction-endpoints)
  - [Customer Endpoints](#customer-endpoints)
- [Data Models](#data-models)
- [Database Schema](#database-schema)
- [Error Handling](#error-handling)
- [Building & Running](#building--running)
- [API Examples](#api-examples)

---

## Overview

The Bank Management System is a RESTful API built with Spring Boot that enables:
- **Multi-bank Management**: Register and manage multiple banks with different branches and IFSC codes
- **Customer Account Management**: Create and manage customer accounts across different banks
- **Transaction Processing**: Execute secure inter-bank and intra-bank transactions
- **Balance Management**: Track account balances and transaction history

## Features

✅ **Bank Management**
- Create, read, update, and delete banks
- Store bank details including branch info, IFSC codes, and location

✅ **Customer Management**
- Register customers with KYC verification status
- Support for customer status tracking (ACTIVE, INACTIVE, PENDING)
- Unique constraints on email and phone number

✅ **Account Management**
- Create accounts for customers at specific banks
- Support for multiple currencies (default: INR)
- Account status tracking (ACTIVE, INACTIVE, SUSPENDED)
- Auto-generated account numbers with bank prefix

✅ **Transaction Management**
- Perform inter-bank and intra-bank transactions
- Real-time balance updates
- Transaction status tracking (INITIATED, COMPLETED, FAILED)
- Transaction history with timestamps
- Optional bank name-based transaction routing

✅ **Comprehensive Error Handling**
- Global exception handler for consistent error responses
- Custom exceptions for business rules, validation, and resource not found errors
- Detailed error messages and error codes

✅ **API Documentation**
- Swagger/OpenAPI documentation available at `/swagger-ui.html`
- Interactive API exploration and testing

---

## Technology Stack

- **Backend Framework**: Spring Boot 3.5.10
- **Java Version**: Java 21
- **Database**: PostgreSQL
- **ORM**: Hibernate/JPA
- **Mapping**: MapStruct 1.6.3
- **Build Tool**: Maven
- **API Documentation**: SpringDoc OpenAPI 2.7.0
- **Project Management**: Lombok (reduces boilerplate code)
- **Validation**: Spring Boot Validation

### Dependencies Overview

```xml
<!-- Core Spring Boot Starters -->
spring-boot-starter-data-jpa
spring-boot-starter-web
spring-boot-starter-validation

<!-- Database -->
postgresql

<!-- Code Generation & Mapping -->
lombok
mapstruct
mapstruct-processor

<!-- API Documentation -->
springdoc-openapi-starter-webmvc-ui
```

---

## Project Structure

```
bank/
├── src/
│   ├── main/
│   │   ├── java/com/bank/
│   │   │   ├── BankApplication.java               # Spring Boot entry point
│   │   │   ├── controller/                         # REST API endpoints
│   │   │   │   ├── BankController.java            # Bank CRUD operations
│   │   │   │   ├── AccountController.java         # Account CRUD operations
│   │   │   │   ├── CustomerController.java        # Customer management
│   │   │   │   └── TransactionController.java     # Transaction operations
│   │   │   ├── service/                           # Business logic
│   │   │   │   ├── bank/
│   │   │   │   │   ├── BankService.java           # Bank service interface
│   │   │   │   │   ├── BankServiceIMPL.java       # Bank service implementation
│   │   │   │   │   ├── mapper/
│   │   │   │   │   │   └── BankMapper.java        # MapStruct mapper for Bank
│   │   │   │   ├── account/
│   │   │   │   │   ├── AccountsService.java       # Account service interface
│   │   │   │   │   ├── AccountsServiceIMPL.java   # Account service implementation
│   │   │   │   │   └── mapper/
│   │   │   │   │       └── AccountMapper.java     # MapStruct mapper for Account
│   │   │   │   ├── customer/
│   │   │   │   │   ├── CustomerService.java
│   │   │   │   │   ├── CustomerServiceIMPL.java
│   │   │   │   │   └── mapper/
│   │   │   │   │       └── CustomerMapper.java
│   │   │   │   └── transaction/
│   │   │   │       ├── TransactionService.java    # Transaction service interface
│   │   │   │       ├── TransactionServiceIMPL.java# Transaction service implementation
│   │   │   │       └── mapper/
│   │   │   │           └── TransactionMapper.java # MapStruct mapper for Transaction
│   │   │   ├── repository/                        # JPA Repositories
│   │   │   │   ├── BankRepository.java
│   │   │   │   ├── AccountRepository.java
│   │   │   │   ├── CustomerRepository.java
│   │   │   │   ├── TransactionRepository.java
│   │   │   │   └── BankAccountRepository.java
│   │   │   ├── entity/                            # JPA Entities
│   │   │   │   ├── Bank.java
│   │   │   │   ├── Account.java
│   │   │   │   ├── Customer.java
│   │   │   │   ├── Transaction.java
│   │   │   │   ├── User.java
│   │   │   │   └── Status.java                    # Enum for statuses
│   │   │   ├── dto/                               # Data Transfer Objects
│   │   │   │   ├── ApiResponse.java               # Generic API response wrapper
│   │   │   │   ├── account/
│   │   │   │   │   ├── AccountRequestDTO.java
│   │   │   │   │   └── AccountResponseDTO.java
│   │   │   │   ├── bank/
│   │   │   │   │   ├── BankRequestDTO.java
│   │   │   │   │   └── BankResponseDTO.java
│   │   │   │   ├── customer/
│   │   │   │   │   ├── CustomerRequestDTO.java
│   │   │   │   │   └── CustomerResponseDTO.java
│   │   │   │   ├── transaction/
│   │   │   │   │   ├── TransactionRequestDTO.java
│   │   │   │   │   └── TransactionResponseDTO.java
│   │   │   │   └── bankaccount/
│   │   │   │       ├── BankAccountRequestDTO.java
│   │   │   │       └── BankAccountResponseDTO.java
│   │   │   └── exception/                         # Custom exceptions
│   │   │       ├── BusinessRuleException.java
│   │   │       ├── GlobalExceptionHandler.java    # Global exception handler
│   │   │       ├── GlobalServiceException.java
│   │   │       ├── InvalidDataException.java
│   │   │       └── ResourceNotFoundException.java
│   │   └── resources/
│   │       ├── application.yml                    # Application configuration
│   │       ├── static/                            # Static files
│   │       └── templates/                         # HTML templates
│   └── test/
│       └── java/com/bank/
│           └── BankApplicationTests.java
├── pom.xml                                         # Maven configuration
└── README.md                                       # This file
```

---

## Installation & Setup

### Prerequisites

- **Java 21** or higher
- **Maven 3.8.1** or higher
- **PostgreSQL 12** or higher
- **Git** (optional)

### Step 1: Clone the Repository

```bash
# Navigate to your desired directory
cd C:\Users\Administrator\Music\

# Clone or download the project
git clone <repository-url>
cd bank
```

### Step 2: Database Setup

1. **Create PostgreSQL Database:**

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE bank_db;

-- Connect to the database
\c bank_db

-- You can optionally create a schema
CREATE SCHEMA banking;
```

2. **Update Database Credentials** in `src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    driver-class-name: org.postgresql.Driver
    url: jdbc:postgresql://localhost:5432/bank_db
    username: postgres                    # Your PostgreSQL username
    password: your_password               # Your PostgreSQL password
  jpa:
    hibernate:
      ddl-auto: update                    # Creates/updates tables automatically
    show-sql: true
    properties:
      hibernate:
        format_sql: true
```

### Step 3: Build the Project

```bash
# Navigate to project root
cd C:\Users\Administrator\Music\bank

# Build with Maven
mvn clean install

# Or use the provided Maven wrapper
mvnw clean install
```

### Step 4: Run the Application

```bash
# Run using Maven
mvn spring-boot:run

# Or run the JAR directly
java -jar target/bank-0.0.1-SNAPSHOT.jar

# Using Maven wrapper
mvnw spring-boot:run
```

The application will start on `http://localhost:8080`

### Step 5: Access API Documentation

Visit `http://localhost:8080/swagger-ui.html` to explore the API with Swagger UI

---

## API Documentation

### Base URL
```
http://localhost:8080
```

### Response Format

All API responses follow a consistent structure:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { /* response data */ },
  "error": null,
  "timestamp": "2026-02-01T03:13:26.563+05:30"
}
```

---

## Bank Endpoints

### 1. Get All Banks

**Endpoint:** `GET /bank`

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "SBI_a1b2c3d4e5f6g7h8i9j0",
      "bankName": "SBI",
      "branch": "Main Branch",
      "ifscCode": "SBIN0001234",
      "city": "Delhi",
      "state": "Delhi",
      "branchAddress": "123 Main St, Delhi"
    }
  ]
}
```

### 2. Get Bank by ID

**Endpoint:** `GET /bank/{id}`

**Parameters:**
- `id` (path): Bank ID

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "SBI_a1b2c3d4e5f6g7h8i9j0",
    "bankName": "SBI",
    "branch": "Main Branch",
    "ifscCode": "SBIN0001234",
    "city": "Delhi",
    "state": "Delhi",
    "branchAddress": "123 Main St, Delhi"
  }
}
```

### 3. Create Bank

**Endpoint:** `POST /bank/create`

**Request Body:**
```json
{
  "bankName": "ICICI",
  "branch": "Downtown Branch",
  "ifscCode": "ICIC0000001",
  "city": "Mumbai",
  "state": "Maharashtra",
  "branchAddress": "456 Downtown Ave, Mumbai"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Bank created successfully",
  "data": {
    "id": "ICICI_b2c3d4e5f6g7h8i9j0k1",
    "bankName": "ICICI",
    "branch": "Downtown Branch",
    "ifscCode": "ICIC0000001",
    "city": "Mumbai",
    "state": "Maharashtra",
    "branchAddress": "456 Downtown Ave, Mumbai"
  }
}
```

### 4. Update Bank

**Endpoint:** `PATCH /bank/{id}`

**Parameters:**
- `id` (path): Bank ID

**Request Body:**
```json
{
  "branchAddress": "New Address"
}
```

### 5. Delete Bank

**Endpoint:** `DELETE /bank/{id}`

**Parameters:**
- `id` (path): Bank ID

**Response:** `204 No Content`

---

## Account Endpoints

### 1. Get All Accounts

**Endpoint:** `GET /account`

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "accountNumber": "ACC_SBI_a1b2c3d4e5f6",
      "balance": 10000.00,
      "currencyCode": "INR",
      "status": "ACTIVE",
      "bank": {
        "id": "SBI_x1x2x3x4x5x6",
        "bankName": "SBI"
      },
      "customer": {
        "fullName": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

### 2. Get Account by Account Number

**Endpoint:** `GET /account/{accountNumber}`

**Parameters:**
- `accountNumber` (path): Account number (e.g., ACC_SBI_a1b2c3d4e5f6)

### 3. Get Accounts by Bank Name

**Endpoint:** `GET /account/name/{bankName}`

**Parameters:**
- `bankName` (path): Bank name (e.g., SBI, ICICI)

### 4. Create Account for Customer

**Endpoint:** `POST /account/{bankName}`

**Parameters:**
- `bankName` (path): Name of the bank

**Request Body:**
```json
{
  "currencyCode": "INR",
  "initialDeposit": 10000,
  "customer": {
    "fullName": "ARYAN RAJ",
    "email": "aryan@gmail.com",
    "phoneNumber": "8908401489",
    "kycStatus": "PENDING",
    "customerStatus": "ACTIVE"
  }
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Account created successfully",
  "data": {
    "accountNumber": "ACC_SBI_e59fcd70782748b9a4d2",
    "balance": 10000.00,
    "currencyCode": "INR",
    "status": "ACTIVE",
    "bank": {
      "id": "SBI_12345678",
      "bankName": "SBI"
    },
    "customer": {
      "id": "SBI_c3d4e5f6g7h8i9j0k1l2",
      "fullName": "ARYAN RAJ",
      "email": "aryan@gmail.com",
      "phoneNumber": "8908401489",
      "kycStatus": "PENDING",
      "customerStatus": "ACTIVE"
    }
  }
}
```

### 5. Update Account

**Endpoint:** `PATCH /account/{accountNumber}`

**Parameters:**
- `accountNumber` (path): Account number

**Request Body:**
```json
{
  "currencyCode": "USD",
  "initialDeposit": 15000
}
```

### 6. Delete Account

**Endpoint:** `DELETE /account/{accountNumber}`

**Parameters:**
- `accountNumber` (path): Account number

---

## Transaction Endpoints

### 1. Create Transaction (Transfer Money)

**Endpoint:** `POST /transaction`

**Request Body:**
```json
{
  "senderAccount": "ACC_SBI_e59fcd70782748b9a4d2",
  "receiverAccount": "ACC_ICICI_f6g7h8i9j0k1l2m3n4o5",
  "amount": 5000,
  "senderBankName": "SBI",
  "receiverBankName": "ICICI"
}
```

**Note:** `senderBankName` and `receiverBankName` are optional. You can provide either:
- Full account numbers for both sender and receiver, OR
- Bank names to automatically select the first account from that bank

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Transaction completed successfully",
  "data": {
    "transactionId": 1,
    "amount": 5000.00,
    "status": "COMPLETED",
    "senderAccount": {
      "accountNumber": "ACC_SBI_e59fcd70782748b9a4d2",
      "balance": 5000.00
    },
    "receiverAccount": {
      "accountNumber": "ACC_ICICI_f6g7h8i9j0k1l2m3n4o5",
      "balance": 15000.00
    },
    "senderBank": {
      "bankName": "SBI"
    },
    "receiverBank": {
      "bankName": "ICICI"
    },
    "transactionDate": "2026-02-01T03:13:28.091+05:30"
  }
}
```

### 2. Get Transactions

**Endpoint:** `GET /transaction`

**Query Parameters:**
- `accountNumber` (required): Account number
- `email` (required): Customer email

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "transactionId": 1,
      "amount": 5000.00,
      "status": "COMPLETED",
      "transactionDate": "2026-02-01T03:13:28.091+05:30"
    }
  ]
}
```

---

## Data Models

### Entity: Bank

```java
@Entity
@Table(name = "banks")
public class Bank {
    @Id
    private String id;                    // Auto-generated: bankName_randomUUID
    
    @Column(nullable = false)
    private String bankName;              // Unique bank name
    
    @Column(nullable = false)
    private String branch;                // Branch name
    
    @Column(unique = true, nullable = false)
    private String ifscCode;              // IFSC code (unique)
    
    @Column(nullable = false)
    private String city;                  // City location
    
    @Column(nullable = false)
    private String state;                 // State location
    
    private String branchAddress;         // Full branch address
    
    @OneToMany(mappedBy = "bank")
    private List<Account> accounts;       // Associated accounts
}
```

### Entity: Account

```java
@Entity
@Table(name = "account")
public class Account {
    @Id
    private String accountNumber;         // Primary key: ACC_BankName_randomUUID
    
    @Column(nullable = false, length = 3)
    private String currencyCode;          // Default: INR
    
    @Column(nullable = false)
    private BigDecimal balance;           // Account balance
    
    @Enumerated(EnumType.STRING)
    private Status status;                // ACTIVE, INACTIVE, SUSPENDED
    
    @ManyToOne
    @JoinColumn(name = "bank_id")
    private Bank bank;                    // Associated bank
    
    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;            // Account owner
    
    @OneToMany(mappedBy = "receiverAccount")
    private List<Transaction> receivedTransactions;
    
    @OneToMany(mappedBy = "senderAccount")
    private List<Transaction> sentTransactions;
}
```

### Entity: Customer

```java
@Entity
@Table(name = "customers")
public class Customer {
    @Id
    private String id;                    // Auto-generated: bankName_randomUUID
    
    @Column(nullable = false)
    private String fullName;              // Customer full name
    
    @Column(unique = true, nullable = false)
    private String email;                 // Email (unique)
    
    @Column(unique = true, nullable = false)
    private String phoneNumber;           // Phone (unique)
    
    @Enumerated(EnumType.STRING)
    private Status kycStatus;             // KYC verification status
    
    @Enumerated(EnumType.STRING)
    private Status customerStatus;        // ACTIVE, INACTIVE, PENDING
    
    @OneToMany(mappedBy = "customer")
    private List<Account> accounts;
}
```

### Entity: Transaction

```java
@Entity
@Table(name = "transactions")
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long transactionId;           // Auto-generated ID
    
    @ManyToOne
    @JoinColumn(name = "from_account_id")
    private Account senderAccount;        // Source account
    
    @ManyToOne
    @JoinColumn(name = "to_account_id")
    private Account receiverAccount;      // Destination account
    
    @ManyToOne
    @JoinColumn(name = "sender_bank_id")
    private Bank senderBank;              // Sender's bank
    
    @ManyToOne
    @JoinColumn(name = "receiver_bank_id")
    private Bank receiverBank;            // Receiver's bank
    
    @Column(nullable = false)
    private BigDecimal amount;            // Transaction amount
    
    @Enumerated(EnumType.STRING)
    private Status status;                // INITIATED, COMPLETED, FAILED
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime transactionDate; // Transaction timestamp
}
```

### Enum: Status

```java
public enum Status {
    ACTIVE,
    INACTIVE,
    PENDING,
    SUSPENDED,
    INITIATED,
    COMPLETED,
    FAILED
}
```

---

## Database Schema

### Tables Created Automatically

#### banks table
```sql
CREATE TABLE banks (
    id VARCHAR(255) PRIMARY KEY,
    bank_name VARCHAR(255) NOT NULL,
    branch VARCHAR(255) NOT NULL,
    ifsc_code VARCHAR(255) NOT NULL UNIQUE,
    city VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    branch_address VARCHAR(255)
);
```

#### customers table
```sql
CREATE TABLE customers (
    id VARCHAR(255) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(255) NOT NULL UNIQUE,
    kyc_status VARCHAR(50),
    customer_status VARCHAR(50)
);
```

#### account table
```sql
CREATE TABLE account (
    account_number VARCHAR(255) PRIMARY KEY,
    balance NUMERIC NOT NULL,
    currency_code VARCHAR(3),
    bank_id VARCHAR(255) NOT NULL,
    customer_id VARCHAR(255) NOT NULL,
    status VARCHAR(50),
    FOREIGN KEY (bank_id) REFERENCES banks(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

#### transactions table
```sql
CREATE TABLE transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    from_account_id VARCHAR(255) NOT NULL,
    to_account_id VARCHAR(255) NOT NULL,
    sender_bank_id VARCHAR(255),
    receiver_bank_id VARCHAR(255),
    amount NUMERIC NOT NULL,
    status VARCHAR(50),
    transaction_date TIMESTAMP NOT NULL,
    UNIQUE (transaction_id),
    FOREIGN KEY (from_account_id) REFERENCES account(account_number),
    FOREIGN KEY (to_account_id) REFERENCES account(account_number),
    FOREIGN KEY (sender_bank_id) REFERENCES banks(id),
    FOREIGN KEY (receiver_bank_id) REFERENCES banks(id)
);
```

---

## Error Handling

The application provides comprehensive error handling with detailed error messages.

### Custom Exceptions

1. **BusinessRuleException**: Thrown when business rules are violated
2. **InvalidDataException**: Thrown for invalid input data
3. **ResourceNotFoundException**: Thrown when a resource is not found
4. **GlobalServiceException**: Thrown for general service errors

### Error Response Format

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message",
  "error": {
    "errorCode": "INVALID_DATA",
    "errorMessage": "Detailed error message"
  },
  "timestamp": "2026-02-01T03:13:28.091+05:30"
}
```

### Common Error Codes

| Status Code | Error Code | Meaning |
|-------------|-----------|---------|
| 400 | INVALID_DATA | Invalid input parameters |
| 404 | RESOURCE_NOT_FOUND | Resource doesn't exist |
| 400 | ILLEGAL_ARGUMENT | Invalid argument for operation |
| 400 | INSUFFICIENT_BALANCE | Account balance is insufficient |
| 500 | INTERNAL_ERROR | Server error |

---

## Building & Running

### Build the Project

```bash
# Using Maven
mvn clean install

# Using Maven wrapper (Windows)
mvnw clean install

# Using Maven wrapper (Linux/Mac)
./mvnw clean install
```

### Run the Application

```bash
# Using Maven
mvn spring-boot:run

# Using Maven wrapper
mvnw spring-boot:run

# Or directly run JAR
java -jar target/bank-0.0.1-SNAPSHOT.jar
```

### Run Tests

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=BankApplicationTests

# Run tests with Maven wrapper
mvnw test
```

### Access Application

- **Application**: `http://localhost:8080`
- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **API Docs JSON**: `http://localhost:8080/v3/api-docs`

---

## API Examples

### Example 1: Create a Bank

```bash
curl -X POST http://localhost:8080/bank/create \
  -H "Content-Type: application/json" \
  -d '{
    "bankName": "SBI",
    "branch": "Main Branch",
    "ifscCode": "SBIN0001234",
    "city": "Delhi",
    "state": "Delhi",
    "branchAddress": "123 Main Street, New Delhi"
  }'
```

### Example 2: Create an Account with Customer

```bash
curl -X POST http://localhost:8080/account/SBI \
  -H "Content-Type: application/json" \
  -d '{
    "currencyCode": "INR",
    "initialDeposit": 50000,
    "customer": {
      "fullName": "Raj Kumar",
      "email": "raj@example.com",
      "phoneNumber": "9876543210",
      "kycStatus": "ACTIVE",
      "customerStatus": "ACTIVE"
    }
  }'
```

### Example 3: Create Another Account at Different Bank

```bash
curl -X POST http://localhost:8080/account/ICICI \
  -H "Content-Type: application/json" \
  -d '{
    "currencyCode": "INR",
    "initialDeposit": 100000,
    "customer": {
      "fullName": "Priya Sharma",
      "email": "priya@example.com",
      "phoneNumber": "9123456789",
      "kycStatus": "ACTIVE",
      "customerStatus": "ACTIVE"
    }
  }'
```

### Example 4: Perform a Transaction

```bash
curl -X POST http://localhost:8080/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "senderAccount": "ACC_SBI_abc123def456",
    "receiverAccount": "ACC_ICICI_xyz789uvw012",
    "amount": 25000
  }'
```

### Example 5: Using Bank Names for Transaction

```bash
curl -X POST http://localhost:8080/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "senderAccount": "ACC_SBI_abc123def456",
    "receiverAccount": "ACC_ICICI_xyz789uvw012",
    "amount": 10000,
    "senderBankName": "SBI",
    "receiverBankName": "ICICI"
  }'
```

### Example 6: Get All Banks

```bash
curl -X GET http://localhost:8080/bank \
  -H "Accept: application/json"
```

### Example 7: Get Accounts by Bank Name

```bash
curl -X GET http://localhost:8080/account/name/SBI \
  -H "Accept: application/json"
```

### Example 8: Get Transaction History

```bash
curl -X GET "http://localhost:8080/transaction?accountNumber=ACC_SBI_abc123def456&email=raj@example.com" \
  -H "Accept: application/json"
```

---

## Architecture & Design Patterns

### Design Patterns Used

1. **MVC Pattern**: Separation of concerns with Controllers, Services, and Repositories
2. **DTO Pattern**: Data Transfer Objects for API communication
3. **Mapper Pattern**: MapStruct for entity-DTO conversion
4. **Service Layer Pattern**: Business logic encapsulation
5. **Repository Pattern**: Data access abstraction
6. **Exception Handler Pattern**: Global exception handling

### Layered Architecture

```
┌─────────────────────────────────────────────────────┐
│           REST API (Controllers)                    │
├─────────────────────────────────────────────────────┤
│           Service Layer (Business Logic)            │
├─────────────────────────────────────────────────────┤
│           Repository Layer (Data Access)           │
├─────────────────────────────────────────────────────┤
│           Database (PostgreSQL)                     │
└─────────────────────────────────────────────────────┘
```

---

## Key Features & Implementation Details

### Account Number Generation
- Format: `ACC_{BankName}_{RandomUUID}`
- Example: `ACC_SBI_e59fcd70782748b9a4d2`
- Ensures unique account numbers across different banks

### Customer ID Generation
- Format: `{BankName}_{RandomUUID}`
- Linked to the bank where the account is created
- Helps track customer relationships with banks

### Transaction Processing
- **Balance Validation**: Ensures sufficient funds before transaction
- **Atomic Updates**: Both accounts updated in a single transaction
- **Status Tracking**: Transactions tracked through states (INITIATED → COMPLETED/FAILED)
- **Bank Tracking**: Records both sender and receiver banks for audit trail

### KYC & Status Management
- **KYC Status**: PENDING, ACTIVE, INACTIVE
- **Customer Status**: ACTIVE, INACTIVE, PENDING
- **Account Status**: ACTIVE, INACTIVE, SUSPENDED
- **Transaction Status**: INITIATED, COMPLETED, FAILED

---

## Troubleshooting

### Issue: Database Connection Error

**Error Message**: `org.postgresql.util.PSQLException: Connection refused`

**Solution**:
1. Ensure PostgreSQL is running
2. Check connection details in `application.yml`
3. Verify database exists: `CREATE DATABASE bank_db;`

### Issue: Port Already in Use

**Error Message**: `Address already in use: bind`

**Solution**:
```bash
# Change port in application.yml
server:
  port: 8081
```

### Issue: Schema Not Created

**Solution**:
1. Ensure `ddl-auto: update` or `ddl-auto: create` is set
2. Check Hibernate logs for SQL errors
3. Manually create tables if needed

---

## Future Enhancements

- [ ] User authentication & authorization
- [ ] JWT token-based security
- [ ] Transaction pagination
- [ ] Scheduled transaction support
- [ ] Loan management module
- [ ] Mobile app integration
- [ ] Advanced reporting & analytics
- [ ] Multi-currency support with exchange rates
- [ ] Transaction reversal capability
- [ ] Notification system (Email/SMS)

---

## Contributing

To contribute to this project:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Create a pull request with detailed description

---

## License

This project is provided as-is for educational and development purposes.

---

## Support

For issues, questions, or suggestions, please refer to the project documentation or contact the development team.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-01 | Initial release |

---

**Last Updated**: February 1, 2026

