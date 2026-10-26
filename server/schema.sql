CREATE DATABASE IF NOT EXISTS portfolio CHARACTER SET utf8mb4;
USE portfolio;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,          -- one profile per email
  consent_at TIMESTAMP NULL,                   -- when they agreed to storage
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  rating TINYINT NOT NULL,
  body TEXT NOT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status_created (status, created_at)
);

-- Least privilege: the API user can only do what it needs, nothing else.
-- CREATE USER 'portfolio_app'@'%' IDENTIFIED BY 'a-long-random-password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON portfolio.* TO 'portfolio_app'@'%';
