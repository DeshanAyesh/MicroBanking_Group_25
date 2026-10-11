DELIMITER $$

DROP TRIGGER IF EXISTS prevent_negative_savings_balance$$

DROP TRIGGER IF EXISTS trg_savings_account_insert_validate$$
CREATE TRIGGER trg_savings_account_insert_validate
BEFORE INSERT ON savings_account
FOR EACH ROW
BEGIN
  IF NEW.current_balance < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Savings account balance cannot be negative';
  END IF;

  IF TRIM(NEW.account_number) = '' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Savings account number is required';
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_savings_account_update_validate$$
CREATE TRIGGER trg_savings_account_update_validate
BEFORE UPDATE ON savings_account
FOR EACH ROW
BEGIN
  IF NEW.current_balance < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Savings account balance cannot be negative';
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_joint_holder_validate$$
CREATE TRIGGER trg_joint_holder_validate
BEFORE INSERT ON joint_account_holders
FOR EACH ROW
BEGIN
  DECLARE matching_accounts INT DEFAULT 0;
  DECLARE selected_type VARCHAR(20);
  DECLARE selected_status VARCHAR(20);

  SELECT COUNT(*), MAX(acc_type), MAX(status)
    INTO matching_accounts, selected_type, selected_status
  FROM savings_account
  WHERE account_id = NEW.account_id;

  IF matching_accounts = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Savings account does not exist';
  END IF;

  IF selected_type <> 'JOINT' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Holders can only be added to a joint account';
  END IF;

  IF selected_status <> 'ACTIVE' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Holders cannot be added to an inactive account';
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_account_transaction_validate$$
CREATE TRIGGER trg_account_transaction_validate
BEFORE INSERT ON account_transaction
FOR EACH ROW
BEGIN
  IF NEW.amount <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Transaction amount must be greater than zero';
  END IF;

  IF NEW.balance_after < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Transaction balance cannot be negative';
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_account_transaction_immutable_update$$
CREATE TRIGGER trg_account_transaction_immutable_update
BEFORE UPDATE ON account_transaction
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Posted transactions cannot be modified';
END$$

DROP TRIGGER IF EXISTS trg_account_transaction_immutable_delete$$
CREATE TRIGGER trg_account_transaction_immutable_delete
BEFORE DELETE ON account_transaction
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Posted transactions cannot be deleted';
END$$

DELIMITER ;
