-- MySQL FUNCTION TODOs — DO NOT WRITE IMPLEMENTATIONS.
DELIMITER $$

-- ---------------------------------------------------------------------------
-- CalculateFDInterest(fd_id)
-- Monthly (30-day cycle) interest for one fixed deposit, SRS 4.6.3 #1:
--   Interest = (Principal x Annual Rate) / 12, rounded to 2 decimals.
-- fixed_deposit_plan.interest_rate is stored as a percentage (e.g. 14.00).
-- Returns NULL if the FD does not exist.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS CalculateFDInterest$$
CREATE FUNCTION CalculateFDInterest(p_fd_id INT)
RETURNS DECIMAL(15,2)
READS SQL DATA
BEGIN
  DECLARE v_interest DECIMAL(15,2) DEFAULT NULL;

  SELECT ROUND(fd.deposit_amount * p.interest_rate / 100 / 12, 2)
    INTO v_interest
    FROM fixed_deposit fd
    JOIN fixed_deposit_plan p ON p.fd_plan_id = fd.fd_plan_id
   WHERE fd.fd_id = p_fd_id;

  RETURN v_interest;
END$$

DELIMITER ;

-- TODO: Function for transaction reference generation if implemented as DB logic.
-- Must be unique and collision-safe.
