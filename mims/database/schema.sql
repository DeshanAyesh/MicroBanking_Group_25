-- B-Trust MIMS — MySQL relational schema
-- IMPORTANT: SQL STATEMENTS ARE INTENTIONALLY LEFT OUT.
-- The team must write the actual MySQL CREATE TABLE statements.

-- ============================================================
-- TODO: ROLES
-- Purpose: store the allowed application roles.
-- Required: PK, unique role name, NOT NULL constraints.
-- ============================================================

-- ============================================================
-- TODO: BRANCHES
-- Purpose: represent multiple B-Trust branches.
-- Required: PK, branch identity/contact fields, unique constraints as appropriate.
-- ============================================================

-- ============================================================
-- TODO: USERS
-- Purpose: authentication identity.
-- Required: PK, unique username/email, password_hash, role FK, active status.
-- Security: never store plaintext passwords.
-- ============================================================

-- ============================================================
-- TODO: EMPLOYEES / AGENTS
-- Purpose: employee profile and branch relationship.
-- Required: PK, user relationship, branch FK, employee/agent fields.
-- ============================================================

-- ============================================================
-- TODO: CUSTOMERS
-- Purpose: individual customer records.
-- Required: PK, identification fields, contact fields, branch FK, assigned-agent FK.
-- ============================================================

-- ============================================================
-- TODO: SAVINGS_PLANS
-- Purpose: Children 12%/LKR0; Teen 11%/LKR500; Adult (18+) 10%/LKR1000;
-- Senior (60+) 13%/LKR1000; Joint 7%/LKR5000.
-- Avoid duplicating plan values in every account.
-- ============================================================

-- ============================================================
-- TODO: SAVINGS_ACCOUNTS
-- Purpose: account identity, selected plan, balance and status.
-- Required: PK, plan FK, account number uniqueness, non-negative balance,
-- status constraints and timestamps.
-- ============================================================

-- ============================================================
-- TODO: ACCOUNT_HOLDERS
-- Purpose: proper many-to-many relationship between savings accounts and customers.
-- Required: composite/unique relationship constraint; holder role/primary-holder
-- semantics if needed.
-- IMPORTANT: never store comma-separated customer IDs.
-- ============================================================

-- ============================================================
-- TODO: TRANSACTIONS
-- Purpose: DEPOSIT, WITHDRAWAL, INTEREST_CREDIT records.
-- Required: PK, account FK, transaction type constraint, positive amount,
-- timestamp, unique reference, acting user/agent FK, status and metadata.
-- ============================================================

-- ============================================================
-- TODO: FD_PLANS
-- Purpose: 6 months 13%; 1 year 14%; 3 years 15%.
-- ============================================================

-- ============================================================
-- TODO: FIXED_DEPOSITS
-- Purpose: one active FD per savings account.
-- Required: PK, account FK, plan/duration FK, principal, start/maturity dates,
-- rate, status, next interest payout date, uniqueness enforcing maximum one FD
-- per savings account according to the chosen business rule.
-- ============================================================

-- ============================================================
-- TODO: INTEREST_DISTRIBUTION
-- Purpose: record each FD interest credit and its relationship to an FD/account
-- and transaction. Enforce appropriate uniqueness for a 30-day payout cycle.
-- ============================================================

-- ============================================================
-- TODO: AUDIT / SUPPORT TABLES (ONLY IF JUSTIFIED)
-- Keep the model normalized and understandable.
-- ============================================================

-- Bank Entity
CREATE TABLE bank ( 
    bank_id INT AUTO_INCREMENT PRIMARY KEY, 
    bank_code VARCHAR(20) NOT NULL UNIQUE, 
    bank_name VARCHAR(100) NOT NULL, 
    license_number VARCHAR(50) UNIQUE, 
    address VARCHAR(255), 
    email VARCHAR(100), 
    contact_number VARCHAR(20), 
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP 
); 

-- Branch Entity 
CREATE TABLE branch ( 
    branch_id INT AUTO_INCREMENT PRIMARY KEY, 
    bank_id INT NOT NULL, 
    branch_code VARCHAR(20) NOT NULL UNIQUE, 
    branch_name VARCHAR(100) NOT NULL, 
    location VARCHAR(100) NOT NULL, 
    address VARCHAR(255), 
    contact_number VARCHAR(20), 
    email VARCHAR(100), 

    FOREIGN KEY (bank_id) REFERENCES bank(bank_id) 
); 

-- Role entity
CREATE TABLE role ( 
    role_id INT AUTO_INCREMENT PRIMARY KEY, 
    role_name VARCHAR(30) NOT NULL UNIQUE 
); 

-- User Account Entity
CREATE TABLE user_account ( 
    user_id INT AUTO_INCREMENT PRIMARY KEY, 
    role_id INT NOT NULL, 
    username VARCHAR(50) NOT NULL UNIQUE, 
    password_hash VARCHAR(255) NOT NULL, 
    status ENUM('ACTIVE', 'INACTIVE', 'LOCKED') 
        NOT NULL DEFAULT 'ACTIVE', 
    last_login_at DATETIME NULL, 
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 

    FOREIGN KEY (role_id) REFERENCES role(role_id) 
);