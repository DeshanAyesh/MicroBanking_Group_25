
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

-- Agent Entity
CREATE TABLE agent (
    agent_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    branch_id INT NOT NULL,
    agent_code VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    nic VARCHAR(20) NOT NULL UNIQUE,
    phone VARCHAR(20),
    email VARCHAR(100),
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    joined_date DATE,

    FOREIGN KEY (user_id) REFERENCES user_account(user_id),
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id)
);

-- Customer Entity
CREATE TABLE customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    branch_id INT NOT NULL,
    agent_id INT NOT NULL,
    nic VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address VARCHAR(255),
    registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',

    FOREIGN KEY (user_id) REFERENCES user_account(user_id),
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id),
    FOREIGN KEY (agent_id) REFERENCES agent(agent_id)
);


-- Savings Plan Entity
CREATE TABLE savings_plan (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    plan_name VARCHAR(30) NOT NULL UNIQUE,
    interest_rate DECIMAL(5,2) NOT NULL,
    minimum_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    minimum_age INT,
    maximum_age INT
);

-- Savings Account Entity
CREATE TABLE savings_account (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    account_number VARCHAR(20) NOT NULL UNIQUE,
    primary_customer_id INT NOT NULL,
    plan_id INT NOT NULL,
    acc_type ENUM('INDIVIDUAL', 'JOINT') NOT NULL,
    current_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (primary_customer_id) REFERENCES customer(customer_id),
    FOREIGN KEY (plan_id) REFERENCES savings_plan(plan_id)
);


-- Joint Account Holders Entity
CREATE TABLE joint_account_holders (
    account_id INT NOT NULL,
    customer_id INT NOT NULL,
    added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (account_id, customer_id),

    FOREIGN KEY (account_id) REFERENCES savings_account(account_id),
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);

-- Account Transaction Entity
CREATE TABLE account_transaction (
    transaction_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_ref VARCHAR(50) NOT NULL UNIQUE,
    account_id INT NOT NULL,
    agent_id INT NULL,
    transaction_type ENUM(
        'DEPOSIT',
        'WITHDRAWAL',
        'INTEREST_CREDIT'
    ) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,
    transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (account_id) REFERENCES savings_account(account_id),
    FOREIGN KEY (agent_id) REFERENCES agent(agent_id)
);


-- Fixed Deposit Plan Entity
CREATE TABLE fixed_deposit_plan (
    fd_plan_id INT AUTO_INCREMENT PRIMARY KEY,
    plan_name VARCHAR(50) NOT NULL UNIQUE,
    term_months INT NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL
);


-- Fixed Deposit Entity
CREATE TABLE fixed_deposit (
    fd_id INT AUTO_INCREMENT PRIMARY KEY,
    fd_number VARCHAR(20) NOT NULL UNIQUE,
    linked_account_id INT NOT NULL UNIQUE,
    fd_plan_id INT NOT NULL,
    deposit_amount DECIMAL(15,2) NOT NULL,
    start_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    next_payout_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    FOREIGN KEY (linked_account_id)
        REFERENCES savings_account(account_id),

    FOREIGN KEY (fd_plan_id)
        REFERENCES fixed_deposit_plan(fd_plan_id)
);

-- Interest Distribution Entity
CREATE TABLE interest_distribution (
    distribution_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fd_id INT NOT NULL,
    transaction_id BIGINT NOT NULL UNIQUE,
    cycle_number INT NOT NULL,
    cycle_start_date DATE NOT NULL,
    cycle_end_date DATE NOT NULL,
    interest_amount DECIMAL(15,2) NOT NULL,
    distributed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (fd_id)
        REFERENCES fixed_deposit(fd_id),

    FOREIGN KEY (transaction_id)
        REFERENCES account_transaction(transaction_id)
);

