# 🧪 API TESTING GUIDE - Bank Management System

**Testing Date:** February 2, 2026  
**Base URL:** http://localhost:8080  
**Content-Type:** application/json

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Bank APIs](#bank-apis)
3. [Customer APIs](#customer-apis)
4. [Account APIs](#account-apis)
5. [Transaction APIs](#transaction-apis)
6. [Complete Workflow Example](#complete-workflow-example)
7. [Error Scenarios](#error-scenarios)

---

## ✅ PREREQUISITES

### Tools Required
- **cURL** (command line) OR
- **Postman** (GUI) OR
- **Swagger UI** (http://localhost:8080/swagger-ui.html)

### Application Status
Ensure application is running:
```bash
mvn spring-boot:run
```

Look for: `Started BankApplication in X.XXX seconds`

---

## 🏦 BANK APIS

### 1. Create Bank (SBI)
```bash
curl -X POST http://localhost:8080/bank/create \
  -H "Content-Type: application/json" \
  -d '{
    "bankName": "SBI",
    "branch": "Main Branch",
    "ifscCode": "SBIN0001234",
    "city": "Mumbai",
    "state": "Maharashtra",
    "branchAddress": "123 Bank Street, Mumbai"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Bank created successfully",
  "data": {
    "id": "SBI_b15dfaeb1ae5487cb470",
    "bankName": "SBI",
    "branch": "Main Branch",
    "ifscCode": "SBIN0001234",
    "city": "Mumbai",
    "state": "Maharashtra",
    "branchAddress": "123 Bank Street, Mumbai",
    "accountNumbers": null
  }
}
```

### 2. Create Another Bank (ICICI)
```bash
curl -X POST http://localhost:8080/bank/create \
  -H "Content-Type: application/json" \
  -d '{
    "bankName": "ICICI",
    "branch": "Corporate Branch",
    "ifscCode": "ICIC0005678",
    "city": "Delhi",
    "state": "Delhi",
    "branchAddress": "456 Finance Road, Delhi"
  }'
```

### 3. Get All Banks
```bash
curl http://localhost:8080/bank
```

### 4. Get Bank by ID
```bash
# Replace with actual bank ID from create response
curl http://localhost:8080/bank/SBI_b15dfaeb1ae5487cb470
```

### 5. Update Bank
```bash
curl -X PATCH http://localhost:8080/bank/SBI_b15dfaeb1ae5487cb470 \
  -H "Content-Type: application/json" \
  -d '{
    "branch": "Updated Main Branch",
    "branchAddress": "789 New Address, Mumbai"
  }'
```

### 6. Delete Bank (Optional - only if no accounts)
```bash
curl -X DELETE http://localhost:8080/bank/SBI_b15dfaeb1ae5487cb470
```

---

## 👤 CUSTOMER APIS

### 1. Get All Customers
```bash
curl http://localhost:8080/customer
```

### 2. Search Customer by Name and Bank
```bash
curl "http://localhost:8080/customer/search?name=John%20Doe&bankName=SBI"
```

### 3. Get Customers by Bank
```bash
curl "http://localhost:8080/customer/bank?bankName=SBI"
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "SBI_14bd4cda2c084de1a168",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "9876543210",
      "kycStatus": "PENDING",
      "customerStatus": "ACTIVE",
      "accountNumbers": ["ACC_SBI_e59fcd70782748b9a4d2"]
    }
  ]
}
```

### 4. Update Customer
```bash
curl -X PATCH "http://localhost:8080/customer/update?name=John%20Doe&email=john@example.com&phoneNumber=9876543210" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe Updated",
    "email": "john@example.com",
    "phoneNumber": "9876543210",
    "kycStatus": "ACTIVE",
    "customerStatus": "ACTIVE"
  }'
```

---

## 💳 ACCOUNT APIS

### 1. Create Account (New Customer)
```bash
curl -X POST http://localhost:8080/account/SBI \
  -H "Content-Type: application/json" \
  -d '{
    "currencyCode": "INR",
    "initialDeposit": 10000,
    "customer": {
      "fullName": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "9876543210",
      "kycStatus": "PENDING",
      "customerStatus": "ACTIVE"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Account created successfully",
  "data": {
    "accountNumber": "ACC_SBI_e59fcd70782748b9a4d2",
    "currencyCode": "INR",
    "balance": 10000.00,
    "status": "ACTIVE",
    "bankId": "SBI_b15dfaeb1ae5487cb470",
    "bankName": "SBI",
    "customerId": "SBI_14bd4cda2c084de1a168",
    "customerName": "John Doe"
  }
}
```

### 2. Create Another Account (ICICI - Same Customer)
```bash
curl -X POST http://localhost:8080/account/ICICI \
  -H "Content-Type: application/json" \
  -d '{
    "currencyCode": "INR",
    "initialDeposit": 15000,
    "customer": {
      "fullName": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "9876543210",
      "kycStatus": "ACTIVE",
      "customerStatus": "ACTIVE"
    }
  }'
```

**Note:** System will find existing customer and create account for them.

### 3. Create Account (Different Customer)
```bash
curl -X POST http://localhost:8080/account/SBI \
  -H "Content-Type: application/json" \
  -d '{
    "currencyCode": "INR",
    "initialDeposit": 20000,
    "customer": {
      "fullName": "Jane Smith",
      "email": "jane@example.com",
      "phoneNumber": "8765432109",
      "kycStatus": "PENDING",
      "customerStatus": "ACTIVE"
    }
  }'
```

### 4. Get All Accounts
```bash
curl http://localhost:8080/account
```

### 5. Get Account by Account Number
```bash
curl http://localhost:8080/account/ACC_SBI_e59fcd70782748b9a4d2
```

### 6. Get Accounts by Bank
```bash
curl http://localhost:8080/account/name/SBI
```

### 7. Update Account
```bash
curl -X PATCH http://localhost:8080/account/ACC_SBI_e59fcd70782748b9a4d2 \
  -H "Content-Type: application/json" \
  -d '{
    "currencyCode": "USD",
    "initialDeposit": 12000
  }'
```

### 8. Delete Account
```bash
curl -X DELETE http://localhost:8080/account/ACC_SBI_e59fcd70782748b9a4d2
```

---

## 💸 TRANSACTION APIS

### 1. Create Transaction (Using Account Numbers)
```bash
curl -X POST http://localhost:8080/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "senderAccount": "ACC_SBI_e59fcd70782748b9a4d2",
    "receiverAccount": "ACC_ICICI_f6g7h8i9j0k1l2m3n4o5",
    "amount": 5000
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Transaction completed successfully",
  "data": {
    "transactionId": 1,
    "senderName": "John Doe",
    "senderAccountNumber": "ACC_SBI_e59fcd70782748b9a4d2",
    "senderBankName": "SBI",
    "receiverName": "John Doe",
    "receiverAccountNumber": "ACC_ICICI_f6g7h8i9j0k1l2m3n4o5",
    "receiverBankName": "ICICI",
    "amount": 5000.00,
    "status": "COMPLETED",
    "transactionDate": "2026-02-02T12:30:45"
  }
}
```

### 2. Create Transaction (Using Bank Names - Easy Mode)
```bash
curl -X POST http://localhost:8080/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "senderBankName": "SBI",
    "receiverBankName": "ICICI",
    "amount": 3000
  }'
```

**Note:** System automatically picks the first account from each bank.

### 3. Create Transaction (Mixed - Account Number + Bank Name)
```bash
curl -X POST http://localhost:8080/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "senderAccount": "ACC_SBI_e59fcd70782748b9a4d2",
    "receiverBankName": "ICICI",
    "amount": 2000
  }'
```

### 4. Get Transaction History (As Sender)
```bash
curl "http://localhost:8080/transaction?accountNumber=ACC_SBI_e59fcd70782748b9a4d2&email=john@example.com"
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "transactionId": 1,
      "senderName": "John Doe",
      "senderAccountNumber": "ACC_SBI_e59fcd70782748b9a4d2",
      "senderBankName": "SBI",
      "receiverName": "John Doe",
      "receiverAccountNumber": "ACC_ICICI_f6g7h8i9j0k1l2m3n4o5",
      "receiverBankName": "ICICI",
      "amount": 5000.00,
      "status": "COMPLETED",
      "transactionDate": "2026-02-02T12:30:45"
    }
  ]
}
```

### 5. Get Transaction History (As Receiver)
```bash
curl "http://localhost:8080/transaction?accountNumber=ACC_ICICI_f6g7h8i9j0k1l2m3n4o5&email=john@example.com"
```

**Note:** Same transaction appears for both sender and receiver.

---

## 🔄 COMPLETE WORKFLOW EXAMPLE

### Scenario: Inter-Bank Money Transfer

**Step 1: Create Two Banks**
```bash
# Create SBI
curl -X POST http://localhost:8080/bank/create \
  -H "Content-Type: application/json" \
  -d '{"bankName":"SBI","branch":"Main","ifscCode":"SBIN0001234","city":"Mumbai","state":"Maharashtra"}'

# Create ICICI
curl -X POST http://localhost:8080/bank/create \
  -H "Content-Type: application/json" \
  -d '{"bankName":"ICICI","branch":"Main","ifscCode":"ICIC0005678","city":"Delhi","state":"Delhi"}'
```

**Step 2: Create Two Accounts**
```bash
# Account 1 at SBI
curl -X POST http://localhost:8080/account/SBI \
  -H "Content-Type: application/json" \
  -d '{
    "currencyCode":"INR",
    "initialDeposit":50000,
    "customer":{
      "fullName":"Alice Johnson",
      "email":"alice@example.com",
      "phoneNumber":"9876543210",
      "kycStatus":"ACTIVE",
      "customerStatus":"ACTIVE"
    }
  }'

# Save the account number: ACC_SBI_xxx

# Account 2 at ICICI
curl -X POST http://localhost:8080/account/ICICI \
  -H "Content-Type: application/json" \
  -d '{
    "currencyCode":"INR",
    "initialDeposit":30000,
    "customer":{
      "fullName":"Bob Williams",
      "email":"bob@example.com",
      "phoneNumber":"8765432109",
      "kycStatus":"ACTIVE",
      "customerStatus":"ACTIVE"
    }
  }'

# Save the account number: ACC_ICICI_xxx
```

**Step 3: Execute Transaction**
```bash
# Transfer ₹10,000 from Alice (SBI) to Bob (ICICI)
curl -X POST http://localhost:8080/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "senderAccount":"ACC_SBI_xxx",
    "receiverAccount":"ACC_ICICI_xxx",
    "amount":10000
  }'
```

**Step 4: Verify Transaction**
```bash
# Check Alice's transactions
curl "http://localhost:8080/transaction?accountNumber=ACC_SBI_xxx&email=alice@example.com"

# Check Bob's transactions
curl "http://localhost:8080/transaction?accountNumber=ACC_ICICI_xxx&email=bob@example.com"
```

**Step 5: Check Updated Balances**
```bash
# Alice's account (should be 40,000)
curl http://localhost:8080/account/ACC_SBI_xxx

# Bob's account (should be 40,000)
curl http://localhost:8080/account/ACC_ICICI_xxx
```

---

## ❌ ERROR SCENARIOS

### 1. Insufficient Balance
```bash
curl -X POST http://localhost:8080/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "senderAccount":"ACC_SBI_xxx",
    "receiverAccount":"ACC_ICICI_xxx",
    "amount":999999
  }'
```

**Expected Error:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Insufficient balance",
  "error": {
    "errorCode": "BUSINESS_RULE_VIOLATION",
    "errorMessage": "Insufficient balance"
  },
  "timestamp": "2026-02-02T12:00:00"
}
```

### 2. Duplicate IFSC Code
```bash
curl -X POST http://localhost:8080/bank/create \
  -H "Content-Type: application/json" \
  -d '{
    "bankName":"HDFC",
    "branch":"Test",
    "ifscCode":"SBIN0001234",
    "city":"Mumbai",
    "state":"Maharashtra"
  }'
```

**Expected Error:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "IFSC code already exists",
  "error": {
    "errorCode": "DUPLICATE_KEY",
    "errorMessage": "IFSC code must be unique"
  }
}
```

### 3. Invalid Account Number
```bash
curl http://localhost:8080/account/INVALID_ACCOUNT
```

**Expected Error:**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Account not found",
  "error": {
    "errorCode": "RESOURCE_NOT_FOUND",
    "errorMessage": "Account with number 'INVALID_ACCOUNT' not found"
  }
}
```

### 4. Duplicate Email
```bash
# Try creating account with existing email
curl -X POST http://localhost:8080/account/SBI \
  -H "Content-Type: application/json" \
  -d '{
    "currencyCode":"INR",
    "initialDeposit":5000,
    "customer":{
      "fullName":"Different Name",
      "email":"john@example.com",
      "phoneNumber":"1234567890",
      "kycStatus":"PENDING"
    }
  }'
```

**Expected Error:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Email already exists",
  "error": {
    "errorCode": "DUPLICATE_KEY",
    "errorMessage": "Email must be unique"
  }
}
```

---

## 📊 TESTING CHECKLIST

Use this checklist to verify all functionality:

### Bank Management
- [ ] Create bank successfully
- [ ] Get all banks
- [ ] Get bank by ID
- [ ] Update bank details
- [ ] Delete bank (without accounts)
- [ ] Duplicate IFSC fails

### Customer Management
- [ ] Customer auto-created with account
- [ ] Get all customers
- [ ] Search by name and bank
- [ ] Get customers by bank
- [ ] Update customer details
- [ ] Duplicate email fails

### Account Management
- [ ] Create account (new customer)
- [ ] Create account (existing customer)
- [ ] Get all accounts
- [ ] Get account by number
- [ ] Get accounts by bank
- [ ] Update account
- [ ] Delete account

### Transaction Processing
- [ ] Inter-bank transaction succeeds
- [ ] Intra-bank transaction succeeds
- [ ] Transaction with bank names
- [ ] Insufficient balance fails
- [ ] Query sender transactions
- [ ] Query receiver transactions
- [ ] Balance updated correctly
- [ ] Ledger entries created

---

## 🎯 PERFORMANCE TESTING

### Test Transaction Query Speed
```bash
# Run multiple times and measure response time
time curl "http://localhost:8080/transaction?accountNumber=ACC_SBI_xxx&email=john@example.com"
```

**Expected:** < 10ms response time

### Test Account Creation
```bash
time curl -X POST http://localhost:8080/account/SBI \
  -H "Content-Type: application/json" \
  -d '{"currencyCode":"INR","initialDeposit":1000,"customer":{"fullName":"Test","email":"test@test.com","phoneNumber":"1234567890"}}'
```

**Expected:** < 100ms response time

---

## 📝 POSTMAN COLLECTION

Import this JSON into Postman for easy testing:

```json
{
  "info": {
    "name": "Bank Management System",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Banks",
      "item": [
        {
          "name": "Create Bank",
          "request": {
            "method": "POST",
            "url": "http://localhost:8080/bank/create",
            "body": {
              "mode": "raw",
              "raw": "{\"bankName\":\"SBI\",\"branch\":\"Main\",\"ifscCode\":\"SBIN0001234\",\"city\":\"Mumbai\",\"state\":\"Maharashtra\"}"
            }
          }
        }
      ]
    }
  ]
}
```

---

## 🔍 DEBUGGING TIPS

### View SQL Queries
Check console output for SQL statements (show-sql: true in application.yml)

### Check Logs
```bash
# In application terminal, look for:
- Hibernate DDL statements
- Transaction processing logs
- Exception stack traces
```

### Database Inspection
```sql
-- Check account balances
SELECT account_number, balance FROM account;

-- Check ledger entries
SELECT * FROM ledger ORDER BY ledger_date DESC LIMIT 10;

-- Check transactions
SELECT * FROM transactions ORDER BY transaction_date DESC LIMIT 10;
```

---

## ✅ VERIFICATION QUERIES

After testing, verify data integrity:

```sql
-- Verify balance = ledger sum
SELECT 
  a.account_number,
  a.balance as account_balance,
  COALESCE(SUM(CASE WHEN l.entry_type = 'CREDIT' THEN l.amount ELSE -l.amount END), 0) as ledger_balance
FROM account a
LEFT JOIN ledger l ON a.id = l.account_id
GROUP BY a.account_number, a.balance;

-- Check for orphaned records
SELECT COUNT(*) FROM transactions WHERE from_account_id IS NULL OR to_account_id IS NULL;

-- Verify all transactions have ledger entries
SELECT t.transaction_id, COUNT(l.ledger_id) as ledger_count
FROM transactions t
LEFT JOIN ledger l ON l.reference_id = t.transaction_id::text
GROUP BY t.transaction_id
HAVING COUNT(l.ledger_id) != 2;
```

---

## 🎉 TESTING COMPLETE

Once all tests pass, your Bank Management System is fully operational!

**Next Steps:**
1. ✅ All APIs tested
2. ✅ Error handling verified
3. ✅ Data integrity confirmed
4. ✅ Performance benchmarked
5. 🚀 Ready for production use!

---

**Testing Guide Created:** February 2, 2026  
**Version:** 1.0.0  
**Status:** ✅ Complete

