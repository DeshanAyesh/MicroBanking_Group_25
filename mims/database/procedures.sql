-- MySQL STORED PROCEDURE TODOs — DO NOT WRITE IMPLEMENTATIONS.

-- TODO: Deposit procedure
-- Inputs: account identifier, amount, acting user/agent.
-- Required:
-- 1. validate account and active status
-- 2. validate positive amount
-- 3. update balance
-- 4. insert DEPOSIT transaction
-- 5. generate unique transaction reference
-- 6. COMMIT all changes or ROLLBACK on failure
-- Concurrency: ensure concurrent operations cannot lose updates.

-- TODO: Withdrawal procedure
-- Required:
-- 1. validate account and eligibility
-- 2. check available balance
-- 3. enforce minimum balance
-- 4. update balance
-- 5. insert WITHDRAWAL transaction
-- 6. rollback if any step fails
-- Concurrency: use appropriate row locking/isolation.

DELIMITER $$

-- ---------------------------------------------------------------------------
-- ProcessMonthlyInterest(as_of_date, OUT credits_created, OUT total_interest)
--
-- For every ACTIVE fixed deposit whose next_payout_date is due (<= as_of_date):
--   1. calculates the monthly interest
--   2. credits the linked savings account
--   3. inserts an INTEREST_CREDIT transaction (agent_id NULL = system)
--   4. inserts an interest_distribution row
--   5. moves next_payout_date forward by 30 days
-- Missed cycles are caught up one by one, never past the maturity date.
-- FDs that reached maturity are marked MATURED (no interest after that).
--
-- Duplicate-payout protection:
--   * next_payout_date is advanced in the same transaction as the credit
--   * cycle_number = days since start / 30, and a cycle that already has an
--     interest_distribution row is skipped
--   * the FD / account rows are locked (FOR UPDATE) so two concurrent runs
--     cannot both pay the same cycle
-- Everything runs in ONE transaction: any error rolls the whole run back.
--
-- Assumption (SRS TBD-08): FDs whose savings account is not ACTIVE are skipped.
-- Pass NULL as as_of_date to use today (CURDATE()).
-- ---------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS ProcessMonthlyInterest$$
CREATE PROCEDURE ProcessMonthlyInterest(
  IN  p_as_of_date      DATE,
  OUT p_credits_created INT,
  OUT p_total_interest  DECIMAL(15,2)
)
BEGIN
  DECLARE v_as_of      DATE;
  DECLARE v_done       TINYINT DEFAULT 0;
  DECLARE v_fd_id      INT;
  DECLARE v_account_id INT;
  DECLARE v_start      DATE;
  DECLARE v_maturity   DATE;
  DECLARE v_next       DATE;
  DECLARE v_interest   DECIMAL(15,2);
  DECLARE v_balance    DECIMAL(15,2);
  DECLARE v_cycle      INT;
  DECLARE v_tx_id      BIGINT;

  -- FDs that have a payout due, or that reached maturity and must be closed
  DECLARE cur_fd CURSOR FOR
    SELECT fd.fd_id, fd.linked_account_id, fd.start_date,
           fd.maturity_date, fd.next_payout_date
      FROM fixed_deposit fd
      JOIN savings_account sa ON sa.account_id = fd.linked_account_id
     WHERE fd.status = 'ACTIVE'
       AND sa.status = 'ACTIVE'
       AND (fd.next_payout_date <= v_as_of OR fd.maturity_date <= v_as_of)
     ORDER BY fd.fd_id
       FOR UPDATE;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SET v_as_of = COALESCE(p_as_of_date, CURDATE());
  SET p_credits_created = 0;
  SET p_total_interest  = 0.00;

  START TRANSACTION;

  OPEN cur_fd;
  fd_loop: LOOP
    FETCH cur_fd INTO v_fd_id, v_account_id, v_start, v_maturity, v_next;
    IF v_done = 1 THEN
      LEAVE fd_loop;
    END IF;

    SET v_interest = CalculateFDInterest(v_fd_id);

    -- one pass per due 30-day cycle (catches up missed cycles, stops at maturity)
    WHILE v_next <= v_as_of AND v_next <= v_maturity DO
      SET v_cycle = DATEDIFF(v_next, v_start) DIV 30;

      IF NOT EXISTS (SELECT 1
                       FROM interest_distribution
                      WHERE fd_id = v_fd_id AND cycle_number = v_cycle) THEN

        SELECT current_balance INTO v_balance
          FROM savings_account
         WHERE account_id = v_account_id;

        SET v_balance = v_balance + v_interest;

        UPDATE savings_account
           SET current_balance = v_balance
         WHERE account_id = v_account_id;

        -- reference is unique per FD + cycle, e.g. INT-FD00011-C001
        INSERT INTO account_transaction
          (transaction_ref, account_id, agent_id, transaction_type,
           amount, balance_after, transaction_date)
        VALUES
          (CONCAT('INT-FD', LPAD(v_fd_id, 5, '0'), '-C', LPAD(v_cycle, 3, '0')),
           v_account_id, NULL, 'INTEREST_CREDIT',
           v_interest, v_balance, TIMESTAMP(v_next));

        SET v_tx_id = LAST_INSERT_ID();

        INSERT INTO interest_distribution
          (fd_id, transaction_id, cycle_number,
           cycle_start_date, cycle_end_date, interest_amount)
        VALUES
          (v_fd_id, v_tx_id, v_cycle,
           DATE_SUB(v_next, INTERVAL 30 DAY), v_next, v_interest);

        SET p_credits_created = p_credits_created + 1;
        SET p_total_interest  = p_total_interest + v_interest;
      END IF;

      SET v_next = DATE_ADD(v_next, INTERVAL 30 DAY);
    END WHILE;

    UPDATE fixed_deposit
       SET next_payout_date = v_next,
           status = CASE WHEN maturity_date <= v_as_of THEN 'MATURED' ELSE 'ACTIVE' END
     WHERE fd_id = v_fd_id;
  END LOOP fd_loop;
  CLOSE cur_fd;

  COMMIT;
END$$

DELIMITER ;