-- Sales Management System Database Schema
-- All timestamps use Africa/Dar_es_Salaam timezone

-- Workers table
CREATE TABLE IF NOT EXISTS workers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'worker' CHECK (role IN ('worker', 'admin')),
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Africa/Dar_es_Salaam')
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    worker_id INTEGER NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12, 2) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    sale_datetime TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Africa/Dar_es_Salaam'),
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Africa/Dar_es_Salaam'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Africa/Dar_es_Salaam')
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    worker_id INTEGER REFERENCES workers(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,
    sale_id INTEGER,
    before_data JSONB,
    after_data JSONB,
    timestamp TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Africa/Dar_es_Salaam')
);

-- Price history table for suspicious price detection
CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    min_price DECIMAL(12, 2) NOT NULL,
    max_price DECIMAL(12, 2) NOT NULL,
    avg_price DECIMAL(12, 2) NOT NULL,
    sale_count INTEGER DEFAULT 1,
    last_updated TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Africa/Dar_es_Salaam'),
    UNIQUE(product_name)
);

-- Suspicious activities table
CREATE TABLE IF NOT EXISTS suspicious_activities (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    worker_id INTEGER REFERENCES workers(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    reviewed BOOLEAN DEFAULT FALSE,
    reviewed_by INTEGER REFERENCES workers(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Africa/Dar_es_Salaam')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_worker_id ON sales(worker_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_datetime ON sales(sale_datetime);
CREATE INDEX IF NOT EXISTS idx_sales_product_name ON sales(product_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_worker_id ON audit_log(worker_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_worker_id ON suspicious_activities(worker_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_reviewed ON suspicious_activities(reviewed);

-- Insert default admin account (password: admin123)
-- Using a proper bcrypt hash for 'admin123'
INSERT INTO workers (name, email, password_hash, role)
VALUES ('Admin', 'admin@sales.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.Rl1LQvVKaZOJG6K3Gm', 'admin')
ON CONFLICT (email) DO NOTHING;
