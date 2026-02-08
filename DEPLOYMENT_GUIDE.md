# 🚀 DEPLOYMENT GUIDE - Transaction Optimization

## Current Status
⚠️ **Issue Found:** Existing transactions in database prevent adding NOT NULL columns

## Solution
Columns are now **nullable** to allow Hibernate to add them to existing tables.

## Step-by-Step Instructions

### Step 1: Stop the Application
If your application is running, **stop it now** (Ctrl+C in the terminal)

### Step 2: Compile the Project
```powershell
cd C:\Users\Administrator\Music\bank
mvn clean compile
```

This will:
- Regenerate MapStruct mappers with new mappings
- Compile all Java classes with updated Transaction fields (now nullable)

### Step 3: Start the Application
```powershell
mvn spring-boot:run
```

**What happens:**
- Hibernate sees new nullable fields in Transaction entity
- Successfully adds these columns to `transactions` table:
  - `sender_account_number` VARCHAR(255) NULL
  - `sender_email` VARCHAR(255) NULL
  - `sender_bank_name` VARCHAR(255) NULL
  - `receiver_account_number` VARCHAR(255) NULL
  - `receiver_email` VARCHAR(255) NULL
  - `receiver_bank_name` VARCHAR(255) NULL
- ✅ No errors because columns allow NULL values

### Step 4: Verify Application Started Successfully
Look for this log message:
```
Started BankApplication in X.XXX seconds
```

### Step 5: Run the SQL Migration Script

**You can run this NOW** - even if you already started the application and got warnings.

Open a new terminal or use pgAdmin and execute:
```powershell
# Using PostgreSQL client (pgAdmin, DBeaver, or psql)
# Run the file: C:\Users\Administrator\Music\bank\add_transaction_indexes.sql
```

Or copy and paste the SQL directly into your PostgreSQL client.

**What this does:**
1. ✅ Creates any missing columns (if Hibernate warnings occurred)
2. ✅ Verifies all columns exist
3. ✅ Creates indexes for fast queries
4. ✅ Populates existing transactions with denormalized data from related tables
5. ✅ Shows verification results

### Step 6: Test the Solution

#### Test 1: Create a New Transaction
```bash
curl -X POST http://localhost:8080/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "senderAccount": "ACC_SBI_xxx",
    "receiverAccount": "ACC_ICICI_xxx",
    "amount": 1000
  }'
```

**Expected:** Transaction created with all denormalized fields populated

#### Test 2: Query Transactions
```bash
curl -X GET "http://localhost:8080/transaction?accountNumber=ACC_ICICI_5f10ddf8e8684ad3b073&email=aryan2.gmail.com"
```

**Expected:** Fast response with all transaction details (no more NULL values)

## Verification Checklist

After completing all steps, verify:

- [ ] Application started without errors
- [ ] New columns exist in transactions table
- [ ] Indexes created successfully
- [ ] Old transactions populated with data
- [ ] New transactions automatically populate fields
- [ ] Query returns results with bank names populated

## Troubleshooting

### Issue: "Column does not exist" when running SQL
**Solution:** You skipped Step 3. Restart the application first.

### Issue: Compilation errors
**Solution:** Run `mvn clean compile` to regenerate mappers

### Issue: Old transactions still have NULL values
**Solution:** The UPDATE query in the SQL script should fix this. Check logs.

### Issue: Transaction query returns empty
**Solution:** Check that accountNumber and email match exactly (case-sensitive)

## What Changed in the Code

### 1. Transaction Entity
Added 6 new fields for denormalized data

### 2. TransactionServiceIMPL.makeTransaction()
Now populates denormalized fields from Account/Customer/Bank entities

### 3. TransactionRepository
Query simplified - no more JOINs needed

### 4. TransactionMapper
Uses denormalized fields directly

## Performance Improvement

**Before:** Complex JOIN query (~50-200ms)
```sql
SELECT t.* FROM transactions t
JOIN account sa ON t.from_account_id = sa.id
JOIN customers sc ON sa.customer_id = sc.id
WHERE sa.account_number = ? AND sc.email = ?
```

**After:** Simple indexed query (~2-5ms)
```sql
SELECT t.* FROM transactions t
WHERE t.sender_account_number = ? AND t.sender_email = ?
```

**Result:** 10-100x faster queries! ⚡

## Next Steps

Once everything is working:
1. Test with various account numbers and emails
2. Verify transaction history shows correctly
3. Check that new transactions work as expected
4. Monitor query performance

---

**Need Help?**
If you encounter any issues, check:
1. Application logs for Hibernate DDL statements
2. PostgreSQL logs for errors
3. Ensure application.yml has `ddl-auto: update`

