-- Monthly fixed-deposit interest function.

DELIMITER $$

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
