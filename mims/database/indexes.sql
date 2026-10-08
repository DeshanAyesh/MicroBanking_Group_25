
CREATE INDEX idx_customer_agent_status
  ON customer (agent_id, status);

CREATE INDEX idx_savings_account_primary_customer
  ON savings_account (primary_customer_id);

CREATE INDEX idx_account_transaction_account_date
  ON account_transaction (account_id, transaction_date);

CREATE INDEX idx_account_transaction_agent_date
  ON account_transaction (agent_id, transaction_date);

CREATE INDEX idx_fixed_deposit_status_payout
  ON fixed_deposit (status, next_payout_date);
