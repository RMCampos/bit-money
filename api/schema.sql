CREATE TABLE IF NOT EXISTS users (
  id            SERIAL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  created_at    TIMESTAMP NULL DEFAULT NULL,
  updated_at    TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT users_pk PRIMARY KEY (id),
  CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS accounts (
  id            SERIAL,
  user_id       INTEGER,
  name          VARCHAR(100) NOT NULL,
  current_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at    TIMESTAMP NULL DEFAULT NULL,
  updated_at    TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT accounts_pk PRIMARY KEY (id),
  CONSTRAINT accounts_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

CREATE TABLE IF NOT EXISTS credit_cards (
  id            SERIAL,
  user_id       INTEGER,
  name          VARCHAR(100) NOT NULL,
  current_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  limit_value   DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  due_date      DATE NOT NULL,
  closing_date  DATE NOT NULL,
  paid          BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP NULL DEFAULT NULL,
  updated_at    TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT credit_cards_pk PRIMARY KEY (id),
  CONSTRAINT credit_cards_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON credit_cards(user_id);

CREATE TABLE IF NOT EXISTS categories (
  id              SERIAL,
  user_id         INTEGER,
  name            VARCHAR(100) NOT NULL,
  account_type    VARCHAR(1) NOT NULL, -- 'E' for expense, 'I' for income
  display_at_home BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP NULL DEFAULT NULL,
  updated_at      TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT categories_pk PRIMARY KEY (id),
  CONSTRAINT categories_name_unique UNIQUE (name),
  CONSTRAINT categories_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

CREATE TABLE IF NOT EXISTS transactions (
  id               SERIAL,
  user_id          INTEGER,
  transaction_type VARCHAR(1) NOT NULL, -- 'E' for expense, 'I' for income, 'T' for transfer
  amount           DECIMAL(10, 2) NOT NULL,
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid             BOOLEAN DEFAULT FALSE,
  comment          TEXT,
  -- expense or income
  account_id       INTEGER,
  category_id      INTEGER,
  -- transfer
  transfer_account_id INTEGER,

  created_at       TIMESTAMP NULL DEFAULT NULL,
  updated_at       TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT transactions_pk PRIMARY KEY (id),
  CONSTRAINT transactions_user_fk FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT transactions_account_fk FOREIGN KEY (account_id) REFERENCES accounts(id),
  CONSTRAINT transactions_category_fk FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
