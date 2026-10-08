-- Banking transaction and interest procedures.


DELIMITER $$

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



DROP PROCEDURE IF EXISTS deposit;

DELIMITER $$

CREATE PROCEDURE deposit(
    IN p_account_identifier VARCHAR(20),
    IN p_amount DECIMAL(15,2),
    IN p_user_id INT
)
BEGIN
    DECLARE v_account_id INT DEFAULT NULL;
    DECLARE v_balance DECIMAL(15,2) DEFAULT 0.00;
    DECLARE v_status VARCHAR(20) DEFAULT NULL;
    DECLARE v_agent_id INT DEFAULT NULL;
    DECLARE v_new_balance DECIMAL(15,2) DEFAULT 0.00;
    DECLARE v_transaction_ref VARCHAR(50);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    IF p_amount IS NULL OR p_amount <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Deposit amount must be greater than zero.';
    END IF;

    SELECT account_id, current_balance, status
      INTO v_account_id, v_balance, v_status
      FROM savings_account
     WHERE account_id = CAST(p_account_identifier AS UNSIGNED)
        OR account_number = p_account_identifier
     LIMIT 1
     FOR UPDATE;

    IF v_account_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Savings account not found.';
    END IF;

    IF UPPER(v_status) <> 'ACTIVE' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Savings account is not active.';
    END IF;

    SELECT agent_id
      INTO v_agent_id
      FROM agent
     WHERE user_id = p_user_id
       AND status = 'ACTIVE'
     LIMIT 1;

    SET v_new_balance = v_balance + p_amount;

    SET v_transaction_ref = CONCAT('TXN-', UUID());

    UPDATE savings_account
       SET current_balance = v_new_balance
     WHERE account_id = v_account_id;

    INSERT INTO account_transaction
        (
            transaction_ref,
            account_id,
            agent_id,
            transaction_type,
            amount,
            balance_after
        )
    VALUES
        (
            v_transaction_ref,
            v_account_id,
            v_agent_id,
            'DEPOSIT',
            p_amount,
            v_new_balance
        );

    COMMIT;

    SELECT
        v_transaction_ref AS transaction_ref,
        v_account_id AS account_id,
        v_new_balance AS balance_after;

END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS withdraw;

DELIMITER $$

CREATE PROCEDURE withdraw(
    IN p_account_identifier VARCHAR(20),
    IN p_amount DECIMAL(15,2),
    IN p_user_id INT
)
BEGIN
    DECLARE v_account_id INT DEFAULT NULL;
    DECLARE v_plan_id INT DEFAULT NULL;
    DECLARE v_balance DECIMAL(15,2) DEFAULT 0.00;
    DECLARE v_minimum_balance DECIMAL(15,2) DEFAULT 0.00;
    DECLARE v_status VARCHAR(20) DEFAULT NULL;
    DECLARE v_agent_id INT DEFAULT NULL;
    DECLARE v_new_balance DECIMAL(15,2) DEFAULT 0.00;
    DECLARE v_transaction_ref VARCHAR(50);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    IF p_amount IS NULL OR p_amount <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Withdrawal amount must be greater than zero.';
    END IF;

    SELECT account_id, plan_id, current_balance, status
      INTO v_account_id, v_plan_id, v_balance, v_status
      FROM savings_account
     WHERE account_id = CAST(p_account_identifier AS UNSIGNED)
        OR account_number = p_account_identifier
     LIMIT 1
     FOR UPDATE;

    IF v_account_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Savings account not found.';
    END IF;

    IF UPPER(v_status) <> 'ACTIVE' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Savings account is not active.';
    END IF;

    SELECT minimum_balance
      INTO v_minimum_balance
      FROM savings_plan
     WHERE plan_id = v_plan_id;

    IF v_balance - p_amount < v_minimum_balance THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'Withdrawal would violate the minimum balance requirement.';
    END IF;

    SELECT agent_id
      INTO v_agent_id
      FROM agent
     WHERE user_id = p_user_id
       AND status = 'ACTIVE'
     LIMIT 1;

    SET v_new_balance = v_balance - p_amount;

    SET v_transaction_ref = CONCAT('TXN-', UUID());

    UPDATE savings_account
       SET current_balance = v_new_balance
     WHERE account_id = v_account_id;

    INSERT INTO account_transaction
        (
            transaction_ref,
            account_id,
            agent_id,
            transaction_type,
            amount,
            balance_after
        )
    VALUES
        (
            v_transaction_ref,
            v_account_id,
            v_agent_id,
            'WITHDRAWAL',
            p_amount,
            v_new_balance
        );

    COMMIT;

    SELECT
        v_transaction_ref AS transaction_ref,
        v_account_id AS account_id,
        v_new_balance AS balance_after;

END$$

DELIMITER ;
