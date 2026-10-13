
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE interest_distribution;
TRUNCATE TABLE fixed_deposit;
TRUNCATE TABLE fixed_deposit_plan;
TRUNCATE TABLE account_transaction;
TRUNCATE TABLE joint_account_holders;
TRUNCATE TABLE savings_account;
TRUNCATE TABLE savings_plan;
TRUNCATE TABLE customer;
TRUNCATE TABLE agent;
TRUNCATE TABLE user_account;
TRUNCATE TABLE role;
TRUNCATE TABLE branch;
TRUNCATE TABLE bank;
SET FOREIGN_KEY_CHECKS = 1;

-- Seed branches, agents, and test users (Roles, Bank, Branch, User Account, Agent)

INSERT INTO role (role_id, role_name) VALUES
(1, 'ADMIN'), (2, 'AGENT'), (3, 'CUSTOMER');

INSERT INTO bank (bank_id, bank_code, bank_name, license_number, address, email, contact_number) VALUES
(1, 'BTRST', 'B-Trust Microfinance', 'LIC-001', '123 Main St, Colombo', 'info@btrust.lk', '0112345678');

INSERT INTO branch (branch_id, bank_id, branch_code, branch_name, location, address, contact_number, email) VALUES
(1, 1, 'BR001', 'Colombo Main', 'Colombo', '1 Colombo Rd', '0111111111', 'colombo@btrust.lk'),
(2, 1, 'BR002', 'Kandy Branch', 'Kandy', '2 Kandy Rd', '0812222222', 'kandy@btrust.lk'),
(3, 1, 'BR003', 'Galle Branch', 'Galle', '3 Galle Rd', '0913333333', 'galle@btrust.lk');

INSERT INTO user_account (user_id, role_id, username, password_hash) VALUES (1, 2, 'agent1', '$2b$12$f9XvuXjx.xe6b3wKfPPIA.fRuYX1HhdfUOtEQi9uPVrsXi3BRUIE.');
INSERT INTO user_account (user_id, role_id, username, password_hash) VALUES (2, 2, 'agent2', '$2b$12$f9XvuXjx.xe6b3wKfPPIA.fRuYX1HhdfUOtEQi9uPVrsXi3BRUIE.');
INSERT INTO user_account (user_id, role_id, username, password_hash) VALUES (3, 2, 'agent3', '$2b$12$f9XvuXjx.xe6b3wKfPPIA.fRuYX1HhdfUOtEQi9uPVrsXi3BRUIE.');
INSERT INTO user_account (user_id, role_id, username, password_hash) VALUES (4, 2, 'agent4', '$2b$12$f9XvuXjx.xe6b3wKfPPIA.fRuYX1HhdfUOtEQi9uPVrsXi3BRUIE.');
INSERT INTO user_account (user_id, role_id, username, password_hash) VALUES (5, 2, 'agent5', '$2b$12$f9XvuXjx.xe6b3wKfPPIA.fRuYX1HhdfUOtEQi9uPVrsXi3BRUIE.');

INSERT INTO agent (agent_id, user_id, branch_id, agent_code, first_name, last_name, nic, phone, email, joined_date) VALUES
(1, 1, 1, 'AGT001', 'Kamal', 'Perera', '801234567V', '0711111111', 'kamal@btrust.lk', '2020-01-15'),
(2, 2, 1, 'AGT002', 'Nimal', 'Silva', '811234567V', '0712222222', 'nimal@btrust.lk', '2020-02-15'),
(3, 3, 2, 'AGT003', 'Sunil', 'Fernando', '821234567V', '0713333333', 'sunil@btrust.lk', '2020-03-15'),
(4, 4, 2, 'AGT004', 'Saman', 'Kumara', '831234567V', '0714444444', 'saman@btrust.lk', '2020-04-15'),
(5, 5, 3, 'AGT005', 'Ruwan', 'Rajapaksha', '841234567V', '0715555555', 'ruwan@btrust.lk', '2020-05-15');


INSERT INTO user_account (user_id, role_id, username, password_hash) VALUES (6, 3, 'cust1', '$2b$12$f9XvuXjx.xe6b3wKfPPIA.fRuYX1HhdfUOtEQi9uPVrsXi3BRUIE.');
INSERT INTO user_account (user_id, role_id, username, password_hash) VALUES (7, 3, 'cust2', '$2b$12$f9XvuXjx.xe6b3wKfPPIA.fRuYX1HhdfUOtEQi9uPVrsXi3BRUIE.');
INSERT INTO user_account (user_id, role_id, username, password_hash) VALUES (8, 3, 'cust3', '$2b$12$f9XvuXjx.xe6b3wKfPPIA.fRuYX1HhdfUOtEQi9uPVrsXi3BRUIE.');
INSERT INTO user_account (user_id, role_id, username, password_hash) VALUES (9, 3, 'cust4', '$2b$12$f9XvuXjx.xe6b3wKfPPIA.fRuYX1HhdfUOtEQi9uPVrsXi3BRUIE.');
INSERT INTO user_account (user_id, role_id, username, password_hash) VALUES (10, 3, 'cust5', '$2b$12$f9XvuXjx.xe6b3wKfPPIA.fRuYX1HhdfUOtEQi9uPVrsXi3BRUIE.');
INSERT INTO user_account (user_id, role_id, username, password_hash) VALUES (11, 3, 'cust6', '$2b$12$f9XvuXjx.xe6b3wKfPPIA.fRuYX1HhdfUOtEQi9uPVrsXi3BRUIE.');
INSERT INTO user_account (user_id, role_id, username, password_hash) VALUES (12, 3, 'cust7', '$2b$12$f9XvuXjx.xe6b3wKfPPIA.fRuYX1HhdfUOtEQi9uPVrsXi3BRUIE.');
INSERT INTO user_account (user_id, role_id, username, password_hash) VALUES (13, 3, 'cust8', '$2b$12$f9XvuXjx.xe6b3wKfPPIA.fRuYX1HhdfUOtEQi9uPVrsXi3BRUIE.');
INSERT INTO user_account (user_id, role_id, username, password_hash) VALUES (14, 3, 'cust9', '$2b$12$f9XvuXjx.xe6b3wKfPPIA.fRuYX1HhdfUOtEQi9uPVrsXi3BRUIE.');
INSERT INTO user_account (user_id, role_id, username, password_hash) VALUES (15, 3, 'cust10', '$2b$12$f9XvuXjx.xe6b3wKfPPIA.fRuYX1HhdfUOtEQi9uPVrsXi3BRUIE.');
INSERT INTO user_account (user_id, role_id, username, password_hash) VALUES (16, 3, 'cust11', '$2b$12$f9XvuXjx.xe6b3wKfPPIA.fRuYX1HhdfUOtEQi9uPVrsXi3BRUIE.');
INSERT INTO user_account (user_id, role_id, username, password_hash) VALUES (17, 3, 'cust12', '$2b$12$f9XvuXjx.xe6b3wKfPPIA.fRuYX1HhdfUOtEQi9uPVrsXi3BRUIE.');
INSERT INTO user_account (user_id, role_id, username, password_hash) VALUES (18, 3, 'cust13', '$2b$12$f9XvuXjx.xe6b3wKfPPIA.fRuYX1HhdfUOtEQi9uPVrsXi3BRUIE.');
INSERT INTO user_account (user_id, role_id, username, password_hash) VALUES (19, 3, 'cust14', '$2b$12$f9XvuXjx.xe6b3wKfPPIA.fRuYX1HhdfUOtEQi9uPVrsXi3BRUIE.');
INSERT INTO user_account (user_id, role_id, username, password_hash) VALUES (20, 3, 'cust15', '$2b$12$f9XvuXjx.xe6b3wKfPPIA.fRuYX1HhdfUOtEQi9uPVrsXi3BRUIE.');

INSERT INTO customer (customer_id, user_id, branch_id, agent_id, nic, first_name, last_name, date_of_birth, gender, phone, address) VALUES
(1, 6, 3, 5, '19711234567V', 'CustFirst1', 'CustLast1', '1971-01-01', 'FEMALE', '0770000001', 'Address 1'),
(2, 7, 2, 4, '19721234567V', 'CustFirst2', 'CustLast2', '1972-01-01', 'FEMALE', '0770000002', 'Address 2'),
(3, 8, 2, 3, '19731234567V', 'CustFirst3', 'CustLast3', '1973-01-01', 'FEMALE', '0770000003', 'Address 3'),
(4, 9, 2, 4, '19741234567V', 'CustFirst4', 'CustLast4', '1974-01-01', 'MALE', '0770000004', 'Address 4'),
(5, 10, 2, 4, '19751234567V', 'CustFirst5', 'CustLast5', '1975-01-01', 'FEMALE', '0770000005', 'Address 5'),
(6, 11, 1, 1, '19761234567V', 'CustFirst6', 'CustLast6', '1976-01-01', 'MALE', '0770000006', 'Address 6'),
(7, 12, 1, 2, '19771234567V', 'CustFirst7', 'CustLast7', '1977-01-01', 'MALE', '0770000007', 'Address 7'),
(8, 13, 1, 1, '19781234567V', 'CustFirst8', 'CustLast8', '1978-01-01', 'FEMALE', '0770000008', 'Address 8'),
(9, 14, 1, 1, '19791234567V', 'CustFirst9', 'CustLast9', '1979-01-01', 'MALE', '0770000009', 'Address 9'),
(10, 15, 2, 4, '19801234567V', 'CustFirst10', 'CustLast10', '1980-01-01', 'MALE', '0770000010', 'Address 10'),
(11, 16, 3, 5, '19811234567V', 'CustFirst11', 'CustLast11', '1981-01-01', 'FEMALE', '0770000011', 'Address 11'),
(12, 17, 1, 1, '19821234567V', 'CustFirst12', 'CustLast12', '1982-01-01', 'MALE', '0770000012', 'Address 12'),
(13, 18, 1, 2, '19831234567V', 'CustFirst13', 'CustLast13', '1983-01-01', 'FEMALE', '0770000013', 'Address 13'),
(14, 19, 2, 4, '19841234567V', 'CustFirst14', 'CustLast14', '1984-01-01', 'MALE', '0770000014', 'Address 14'),
(15, 20, 1, 1, '19851234567V', 'CustFirst15', 'CustLast15', '1985-01-01', 'FEMALE', '0770000015', 'Address 15');


INSERT INTO savings_plan (plan_id, plan_name, interest_rate, minimum_balance, minimum_age, maximum_age) VALUES
(1, 'Children', 12.00, 0.00, 0, 12),
(2, 'Teen', 11.00, 500.00, 13, 17),
(3, 'Adult', 10.00, 1000.00, 18, 59),
(4, 'Senior', 13.00, 1000.00, 60, 120),
(5, 'Joint', 7.00, 5000.00, 18, 120);

INSERT INTO savings_account (account_id, account_number, primary_customer_id, plan_id, acc_type, current_balance) VALUES
(1, 'ACC00001', 1, 3, 'INDIVIDUAL', 0.00),
(2, 'ACC00002', 2, 3, 'INDIVIDUAL', 0.00),
(3, 'ACC00003', 3, 3, 'INDIVIDUAL', 0.00),
(4, 'ACC00004', 4, 3, 'INDIVIDUAL', 0.00),
(5, 'ACC00005', 5, 3, 'INDIVIDUAL', 0.00),
(6, 'ACC00006', 6, 3, 'INDIVIDUAL', 0.00),
(7, 'ACC00007', 7, 3, 'INDIVIDUAL', 0.00),
(8, 'ACC00008', 8, 3, 'INDIVIDUAL', 0.00),
(9, 'ACC00009', 9, 3, 'INDIVIDUAL', 0.00),
(10, 'ACC00010', 10, 3, 'INDIVIDUAL', 0.00),
(11, 'ACC00011', 11, 3, 'INDIVIDUAL', 0.00),
(12, 'ACC00012', 12, 3, 'INDIVIDUAL', 0.00),
(13, 'ACC00013', 13, 3, 'INDIVIDUAL', 0.00),
(14, 'ACC00014', 14, 5, 'JOINT', 0.00),
(15, 'ACC00015', 15, 5, 'JOINT', 0.00);

INSERT INTO joint_account_holders (account_id, customer_id) VALUES
(14, 14), (14, 1), (15, 15), (15, 2);


INSERT INTO fixed_deposit_plan (fd_plan_id, plan_name, term_months, interest_rate) VALUES
(1, '6 Months', 6, 13.00),
(2, '1 Year', 12, 14.00),
(3, '3 Years', 36, 15.00);

INSERT INTO fixed_deposit (fd_id, fd_number, linked_account_id, fd_plan_id, deposit_amount, start_date, maturity_date, next_payout_date, status) VALUES
(1, 'FD00001', 1, 2, 100000.00, '2023-09-23', '2024-09-22', '2023-10-23', 'ACTIVE'),
(2, 'FD00002', 2, 2, 100000.00, '2023-08-12', '2024-08-11', '2023-09-11', 'ACTIVE'),
(3, 'FD00003', 3, 2, 100000.00, '2023-07-14', '2024-07-13', '2023-08-13', 'ACTIVE'),
(4, 'FD00004', 4, 2, 100000.00, '2023-10-18', '2024-10-17', '2023-11-17', 'ACTIVE'),
(5, 'FD00005', 5, 2, 100000.00, '2023-12-29', '2024-12-28', '2024-01-28', 'ACTIVE'),
(6, 'FD00006', 6, 2, 100000.00, '2023-02-15', '2024-02-15', '2023-03-17', 'ACTIVE'),
(7, 'FD00007', 7, 2, 100000.00, '2023-09-01', '2024-08-31', '2023-10-01', 'ACTIVE'),
(8, 'FD00008', 8, 2, 100000.00, '2023-12-18', '2024-12-17', '2024-01-17', 'ACTIVE'),
(9, 'FD00009', 9, 2, 100000.00, '2023-10-12', '2024-10-11', '2023-11-11', 'ACTIVE'),
(10, 'FD00010', 10, 2, 100000.00, '2023-06-23', '2024-06-22', '2023-07-23', 'ACTIVE');


INSERT INTO account_transaction (transaction_id, transaction_ref, account_id, agent_id, transaction_type, amount, balance_after, transaction_date) VALUES
(1, 'TXN000001', 1, 3, 'DEPOSIT', 18000.00, 18000.00, '2023-01-01 10:00:00'),
(2, 'TXN000002', 2, 3, 'DEPOSIT', 46000.00, 46000.00, '2023-01-01 10:00:00'),
(3, 'TXN000003', 3, 1, 'DEPOSIT', 31000.00, 31000.00, '2023-01-01 10:00:00'),
(4, 'TXN000004', 4, 2, 'DEPOSIT', 15000.00, 15000.00, '2023-01-01 10:00:00'),
(5, 'TXN000005', 5, 4, 'DEPOSIT', 41000.00, 41000.00, '2023-01-01 10:00:00'),
(6, 'TXN000006', 6, 2, 'DEPOSIT', 29000.00, 29000.00, '2023-01-01 10:00:00'),
(7, 'TXN000007', 7, 4, 'DEPOSIT', 13000.00, 13000.00, '2023-01-01 10:00:00'),
(8, 'TXN000008', 8, 3, 'DEPOSIT', 26000.00, 26000.00, '2023-01-01 10:00:00'),
(9, 'TXN000009', 9, 5, 'DEPOSIT', 10000.00, 10000.00, '2023-01-01 10:00:00'),
(10, 'TXN000010', 10, 5, 'DEPOSIT', 50000.00, 50000.00, '2023-01-01 10:00:00'),
(11, 'TXN000011', 11, 4, 'DEPOSIT', 34000.00, 34000.00, '2023-01-01 10:00:00'),
(12, 'TXN000012', 12, 3, 'DEPOSIT', 48000.00, 48000.00, '2023-01-01 10:00:00'),
(13, 'TXN000013', 13, 1, 'DEPOSIT', 40000.00, 40000.00, '2023-01-01 10:00:00'),
(14, 'TXN000014', 14, 4, 'DEPOSIT', 13000.00, 13000.00, '2023-01-01 10:00:00'),
(15, 'TXN000015', 15, 3, 'DEPOSIT', 12000.00, 12000.00, '2023-01-01 10:00:00'),
(16, 'TXN000016', 5, 1, 'DEPOSIT', 13000.00, 54000.00, '2023-06-01 12:00:00'),
(17, 'TXN000017', 2, 5, 'DEPOSIT', 2000.00, 48000.00, '2023-06-01 12:00:00'),
(18, 'TXN000018', 1, 4, 'DEPOSIT', 15000.00, 33000.00, '2023-06-01 12:00:00'),
(19, 'TXN000019', 1, 4, 'DEPOSIT', 2000.00, 35000.00, '2023-06-01 12:00:00'),
(20, 'TXN000020', 12, 5, 'DEPOSIT', 3000.00, 51000.00, '2023-06-01 12:00:00'),
(21, 'TXN000021', 2, 2, 'WITHDRAWAL', 2000.00, 46000.00, '2023-06-01 12:00:00'),
(22, 'TXN000022', 6, 3, 'WITHDRAWAL', 2000.00, 27000.00, '2023-06-01 12:00:00'),
(23, 'TXN000023', 4, 1, 'WITHDRAWAL', 3000.00, 12000.00, '2023-06-01 12:00:00'),
(24, 'TXN000024', 11, 5, 'DEPOSIT', 8000.00, 42000.00, '2023-06-01 12:00:00'),
(25, 'TXN000025', 9, 4, 'WITHDRAWAL', 2000.00, 8000.00, '2023-06-01 12:00:00'),
(26, 'TXN000026', 5, 3, 'DEPOSIT', 7000.00, 61000.00, '2023-06-01 12:00:00'),
(27, 'TXN000027', 3, 1, 'WITHDRAWAL', 5000.00, 26000.00, '2023-06-01 12:00:00'),
(28, 'TXN000028', 1, 1, 'WITHDRAWAL', 4000.00, 31000.00, '2023-06-01 12:00:00'),
(29, 'TXN000029', 14, 3, 'WITHDRAWAL', 2000.00, 11000.00, '2023-06-01 12:00:00'),
(30, 'TXN000030', 14, 2, 'DEPOSIT', 15000.00, 26000.00, '2023-06-01 12:00:00'),
(31, 'TXN000031', 5, 3, 'WITHDRAWAL', 3000.00, 58000.00, '2023-06-01 12:00:00'),
(32, 'TXN000032', 11, 2, 'WITHDRAWAL', 3000.00, 39000.00, '2023-06-01 12:00:00'),
(33, 'TXN000033', 9, 3, 'WITHDRAWAL', 4000.00, 4000.00, '2023-06-01 12:00:00'),
(34, 'TXN000034', 13, 1, 'WITHDRAWAL', 2000.00, 38000.00, '2023-06-01 12:00:00'),
(35, 'TXN000035', 3, 3, 'DEPOSIT', 15000.00, 41000.00, '2023-06-01 12:00:00'),
(36, 'TXN000036', 4, 5, 'WITHDRAWAL', 5000.00, 7000.00, '2023-06-01 12:00:00'),
(37, 'TXN000037', 6, 2, 'WITHDRAWAL', 4000.00, 23000.00, '2023-06-01 12:00:00'),
(38, 'TXN000038', 5, 3, 'WITHDRAWAL', 5000.00, 53000.00, '2023-06-01 12:00:00'),
(39, 'TXN000039', 3, 3, 'DEPOSIT', 19000.00, 60000.00, '2023-06-01 12:00:00'),
(40, 'TXN000040', 3, 5, 'WITHDRAWAL', 1000.00, 59000.00, '2023-06-01 12:00:00'),
(41, 'TXN000041', 8, 3, 'DEPOSIT', 7000.00, 33000.00, '2023-06-01 12:00:00'),
(42, 'TXN000042', 2, 3, 'DEPOSIT', 12000.00, 58000.00, '2023-06-01 12:00:00'),
(43, 'TXN000043', 8, 5, 'DEPOSIT', 10000.00, 43000.00, '2023-06-01 12:00:00'),
(44, 'TXN000044', 1, 5, 'DEPOSIT', 15000.00, 46000.00, '2023-06-01 12:00:00'),
(45, 'TXN000045', 8, 5, 'DEPOSIT', 10000.00, 53000.00, '2023-06-01 12:00:00'),
(46, 'TXN000046', 14, 5, 'DEPOSIT', 18000.00, 44000.00, '2023-06-01 12:00:00'),
(47, 'TXN000047', 13, 2, 'DEPOSIT', 7000.00, 45000.00, '2023-06-01 12:00:00'),
(48, 'TXN000048', 13, 5, 'DEPOSIT', 10000.00, 55000.00, '2023-06-01 12:00:00'),
(49, 'TXN000049', 6, 5, 'DEPOSIT', 6000.00, 29000.00, '2023-06-01 12:00:00'),
(50, 'TXN000050', 1, 2, 'DEPOSIT', 19000.00, 65000.00, '2023-06-01 12:00:00'),
(51, 'TXN000051', 3, 5, 'WITHDRAWAL', 5000.00, 54000.00, '2023-06-01 12:00:00'),
(52, 'TXN000052', 5, 2, 'WITHDRAWAL', 5000.00, 48000.00, '2023-06-01 12:00:00'),
(53, 'TXN000053', 5, 3, 'WITHDRAWAL', 2000.00, 46000.00, '2023-06-01 12:00:00'),
(54, 'TXN000054', 4, 3, 'WITHDRAWAL', 2000.00, 5000.00, '2023-06-01 12:00:00'),
(55, 'TXN000055', 1, 1, 'WITHDRAWAL', 1000.00, 64000.00, '2023-06-01 12:00:00'),
(56, 'TXN000056', 4, 1, 'WITHDRAWAL', 2000.00, 3000.00, '2023-06-01 12:00:00'),
(57, 'TXN000057', 9, 5, 'DEPOSIT', 4000.00, 8000.00, '2023-06-01 12:00:00'),
(58, 'TXN000058', 15, 5, 'WITHDRAWAL', 4000.00, 8000.00, '2023-06-01 12:00:00'),
(59, 'TXN000059', 9, 2, 'WITHDRAWAL', 1000.00, 7000.00, '2023-06-01 12:00:00'),
(60, 'TXN000060', 5, 1, 'WITHDRAWAL', 5000.00, 41000.00, '2023-06-01 12:00:00'),
(61, 'TXN000061', 5, 1, 'WITHDRAWAL', 4000.00, 37000.00, '2023-06-01 12:00:00'),
(62, 'TXN000062', 2, 3, 'DEPOSIT', 7000.00, 65000.00, '2023-06-01 12:00:00'),
(63, 'TXN000063', 5, 4, 'WITHDRAWAL', 4000.00, 33000.00, '2023-06-01 12:00:00'),
(64, 'TXN000064', 10, 5, 'DEPOSIT', 18000.00, 68000.00, '2023-06-01 12:00:00'),
(65, 'TXN000065', 11, 2, 'DEPOSIT', 5000.00, 44000.00, '2023-06-01 12:00:00'),
(66, 'TXN000066', 11, 3, 'WITHDRAWAL', 1000.00, 43000.00, '2023-06-01 12:00:00'),
(67, 'TXN000067', 14, 5, 'WITHDRAWAL', 2000.00, 42000.00, '2023-06-01 12:00:00'),
(68, 'TXN000068', 13, 3, 'DEPOSIT', 3000.00, 58000.00, '2023-06-01 12:00:00'),
(69, 'TXN000069', 12, 3, 'WITHDRAWAL', 1000.00, 50000.00, '2023-06-01 12:00:00'),
(70, 'TXN000070', 2, 1, 'WITHDRAWAL', 1000.00, 64000.00, '2023-06-01 12:00:00'),
(71, 'TXN000071', 7, 3, 'WITHDRAWAL', 2000.00, 11000.00, '2023-06-01 12:00:00'),
(72, 'TXN000072', 12, 2, 'WITHDRAWAL', 5000.00, 45000.00, '2023-06-01 12:00:00'),
(73, 'TXN000073', 3, 1, 'DEPOSIT', 2000.00, 56000.00, '2023-06-01 12:00:00'),
(74, 'TXN000074', 1, 2, 'DEPOSIT', 3000.00, 67000.00, '2023-06-01 12:00:00'),
(75, 'TXN000075', 4, 1, 'WITHDRAWAL', 2000.00, 1000.00, '2023-06-01 12:00:00'),
(76, 'TXN000076', 7, 2, 'WITHDRAWAL', 1000.00, 10000.00, '2023-06-01 12:00:00'),
(77, 'TXN000077', 7, 4, 'DEPOSIT', 9000.00, 19000.00, '2023-06-01 12:00:00'),
(78, 'TXN000078', 6, 3, 'WITHDRAWAL', 2000.00, 27000.00, '2023-06-01 12:00:00'),
(79, 'TXN000079', 11, 1, 'WITHDRAWAL', 4000.00, 39000.00, '2023-06-01 12:00:00'),
(80, 'TXN000080', 3, 2, 'WITHDRAWAL', 2000.00, 54000.00, '2023-06-01 12:00:00'),
(81, 'TXN000081', 5, 3, 'WITHDRAWAL', 4000.00, 29000.00, '2023-06-01 12:00:00'),
(82, 'TXN000082', 1, 1, 'DEPOSIT', 4000.00, 71000.00, '2023-06-01 12:00:00'),
(83, 'TXN000083', 13, 4, 'WITHDRAWAL', 4000.00, 54000.00, '2023-06-01 12:00:00'),
(84, 'TXN000084', 6, 5, 'DEPOSIT', 14000.00, 41000.00, '2023-06-01 12:00:00'),
(85, 'TXN000085', 10, 4, 'WITHDRAWAL', 5000.00, 63000.00, '2023-06-01 12:00:00'),
(86, 'TXN000086', 6, 5, 'DEPOSIT', 9000.00, 50000.00, '2023-06-01 12:00:00'),
(87, 'TXN000087', 5, 3, 'WITHDRAWAL', 5000.00, 24000.00, '2023-06-01 12:00:00'),
(88, 'TXN000088', 3, 5, 'WITHDRAWAL', 5000.00, 49000.00, '2023-06-01 12:00:00'),
(89, 'TXN000089', 1, 1, 'DEPOSIT', 14000.00, 85000.00, '2023-06-01 12:00:00'),
(90, 'TXN000090', 12, 1, 'WITHDRAWAL', 1000.00, 44000.00, '2023-06-01 12:00:00'),
(91, 'TXN000091', 6, 3, 'DEPOSIT', 2000.00, 52000.00, '2023-06-01 12:00:00'),
(92, 'TXN000092', 3, 4, 'WITHDRAWAL', 5000.00, 44000.00, '2023-06-01 12:00:00'),
(93, 'TXN000093', 5, 2, 'WITHDRAWAL', 4000.00, 20000.00, '2023-06-01 12:00:00'),
(94, 'TXN000094', 15, 1, 'DEPOSIT', 20000.00, 28000.00, '2023-06-01 12:00:00'),
(95, 'TXN000095', 1, 1, 'DEPOSIT', 14000.00, 99000.00, '2023-06-01 12:00:00'),
(96, 'TXN000096', 7, 1, 'DEPOSIT', 1000.00, 20000.00, '2023-06-01 12:00:00'),
(97, 'TXN000097', 2, 2, 'DEPOSIT', 5000.00, 69000.00, '2023-06-01 12:00:00'),
(98, 'TXN000098', 14, 2, 'DEPOSIT', 16000.00, 58000.00, '2023-06-01 12:00:00');

UPDATE savings_account SET current_balance = 99000.00 WHERE account_id = 1;
UPDATE savings_account SET current_balance = 69000.00 WHERE account_id = 2;
UPDATE savings_account SET current_balance = 44000.00 WHERE account_id = 3;
UPDATE savings_account SET current_balance = 1000.00 WHERE account_id = 4;
UPDATE savings_account SET current_balance = 20000.00 WHERE account_id = 5;
UPDATE savings_account SET current_balance = 52000.00 WHERE account_id = 6;
UPDATE savings_account SET current_balance = 20000.00 WHERE account_id = 7;
UPDATE savings_account SET current_balance = 53000.00 WHERE account_id = 8;
UPDATE savings_account SET current_balance = 7000.00 WHERE account_id = 9;
UPDATE savings_account SET current_balance = 63000.00 WHERE account_id = 10;
UPDATE savings_account SET current_balance = 39000.00 WHERE account_id = 11;
UPDATE savings_account SET current_balance = 44000.00 WHERE account_id = 12;
UPDATE savings_account SET current_balance = 54000.00 WHERE account_id = 13;
UPDATE savings_account SET current_balance = 58000.00 WHERE account_id = 14;
UPDATE savings_account SET current_balance = 28000.00 WHERE account_id = 15;

INSERT INTO user_account (role_id, username, password_hash, status)
VALUES (1, 'admin', '$2b$12$f9XvuXjx.xe6b3wKfPPIA.fRuYX1HhdfUOtEQi9uPVrsXi3BRUIE.', 'ACTIVE');
