Atomic Deposit and Withdrawal operations


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

    -- Validate amount
    IF p_amount IS NULL OR p_amount <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Deposit amount must be greater than zero.';
    END IF;

    -- Lock the account row before reading/updating balance
    SELECT account_id, current_balance, status
      INTO v_account_id, v_balance, v_status
      FROM savings_account
     WHERE account_id = CAST(p_account_identifier AS UNSIGNED)
        OR account_number = p_account_identifier
     LIMIT 1
     FOR UPDATE;

    -- Validate account
    IF v_account_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Savings account not found.';
    END IF;

    -- Validate active status
    IF UPPER(v_status) <> 'ACTIVE' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Savings account is not active.';
    END IF;

    -- Find the active agent belonging to the logged-in user
    SELECT agent_id
      INTO v_agent_id
      FROM agent
     WHERE user_id = p_user_id
       AND status = 'ACTIVE'
     LIMIT 1;

    -- Calculate new balance
    SET v_new_balance = v_balance + p_amount;

    -- Generate unique transaction reference
    SET v_transaction_ref = CONCAT('TXN-', UUID());

    -- Update account balance
    UPDATE savings_account
       SET current_balance = v_new_balance
     WHERE account_id = v_account_id;

    -- Record transaction
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

    -- Return result
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

    -- Validate amount
    IF p_amount IS NULL OR p_amount <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Withdrawal amount must be greater than zero.';
    END IF;

    -- Lock account row before checking balance
    SELECT account_id, plan_id, current_balance, status
      INTO v_account_id, v_plan_id, v_balance, v_status
      FROM savings_account
     WHERE account_id = CAST(p_account_identifier AS UNSIGNED)
        OR account_number = p_account_identifier
     LIMIT 1
     FOR UPDATE;

    -- Validate account
    IF v_account_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Savings account not found.';
    END IF;

    -- Validate active status
    IF UPPER(v_status) <> 'ACTIVE' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Savings account is not active.';
    END IF;

    -- Get minimum balance from the savings plan
    SELECT minimum_balance
      INTO v_minimum_balance
      FROM savings_plan
     WHERE plan_id = v_plan_id;

    -- Check available balance and minimum balance
    IF v_balance - p_amount < v_minimum_balance THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'Withdrawal would violate the minimum balance requirement.';
    END IF;

    -- Find active agent belonging to logged-in user
    SELECT agent_id
      INTO v_agent_id
      FROM agent
     WHERE user_id = p_user_id
       AND status = 'ACTIVE'
     LIMIT 1;

    -- Calculate new balance
    SET v_new_balance = v_balance - p_amount;

    -- Generate unique transaction reference
    SET v_transaction_ref = CONCAT('TXN-', UUID());

    -- Update account balance
    UPDATE savings_account
       SET current_balance = v_new_balance
     WHERE account_id = v_account_id;

    -- Record transaction
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

    -- Return result
    SELECT
        v_transaction_ref AS transaction_ref,
        v_account_id AS account_id,
        v_new_balance AS balance_after;

END$$

DELIMITER ;
