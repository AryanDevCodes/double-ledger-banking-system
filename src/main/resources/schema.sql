ALTER TABLE IF EXISTS transactions
  DROP CONSTRAINT IF EXISTS transactions_status_check;

ALTER TABLE IF EXISTS transactions
  ADD CONSTRAINT transactions_status_check
  CHECK (status IN ('INITIATED', 'COMPLETED', 'FAILED', 'REVERSED'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_user_id
  ON customers (user_id)
  WHERE user_id IS NOT NULL;
