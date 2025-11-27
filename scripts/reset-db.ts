import { sql } from "../lib/db";
import bcrypt from "bcryptjs";

async function main() {
    console.log("Resetting database...");

    try {
        // Drop all tables
        await sql`DROP TABLE IF EXISTS suspicious_activity CASCADE`;
        await sql`DROP TABLE IF EXISTS audit_logs CASCADE`;
        await sql`DROP TABLE IF EXISTS price_history CASCADE`;
        await sql`DROP TABLE IF EXISTS sales CASCADE`;
        await sql`DROP TABLE IF EXISTS workers CASCADE`;
        await sql`DROP TABLE IF EXISTS products CASCADE`;
        await sql`DROP TABLE IF EXISTS clients CASCADE`;
        console.log("Dropped all tables.");

        // Create workers table
        await sql`
      CREATE TABLE workers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'worker')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
        console.log("Created workers table.");

        // Create clients table
        await sql`
      CREATE TABLE clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
        console.log("Created clients table.");

        // Create sales table
        await sql`
      CREATE TABLE sales (
        id SERIAL PRIMARY KEY,
        worker_id INTEGER REFERENCES workers(id),
        client_id INTEGER REFERENCES clients(id),
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_type VARCHAR(20) DEFAULT 'piece',
        unit_price DECIMAL(10, 2) NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        notes TEXT,
        sale_datetime TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
        console.log("Created sales table.");

        // Create price_history table
        await sql`
      CREATE TABLE price_history (
        id SERIAL PRIMARY KEY,
        product_name VARCHAR(255) NOT NULL,
        min_price DECIMAL(10, 2) NOT NULL,
        max_price DECIMAL(10, 2) NOT NULL,
        avg_price DECIMAL(10, 2) NOT NULL,
        sale_count INTEGER DEFAULT 0,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
        console.log("Created price_history table.");

        // Create audit_logs table
        await sql`
      CREATE TABLE audit_logs (
        id SERIAL PRIMARY KEY,
        worker_id INTEGER REFERENCES workers(id),
        action_type VARCHAR(50) NOT NULL,
        sale_id INTEGER REFERENCES sales(id),
        before_data JSONB,
        after_data JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
        console.log("Created audit_logs table.");

        // Create suspicious_activity table
        await sql`
      CREATE TABLE suspicious_activity (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER REFERENCES sales(id),
        worker_id INTEGER REFERENCES workers(id),
        reason TEXT NOT NULL,
        severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
        reviewed BOOLEAN DEFAULT FALSE,
        reviewed_by INTEGER REFERENCES workers(id),
        reviewed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
        console.log("Created suspicious_activity table.");

        // Create indexes
        await sql`CREATE INDEX idx_sales_datetime ON sales (sale_datetime)`;
        await sql`CREATE INDEX idx_sales_worker_id ON sales (worker_id)`;
        await sql`CREATE INDEX idx_sales_product_name ON sales (product_name)`;
        console.log("Created indexes.");

        // Create Admin User
        const email = "philipomchau1@gmail.com";
        const password = "Philip12";
        const hashedPassword = await bcrypt.hash(password, 10);

        await sql`
      INSERT INTO workers (name, email, password_hash, role)
      VALUES ('Philip Omchau', ${email}, ${hashedPassword}, 'admin')
    `;
        console.log(`Created admin user: ${email}`);

        console.log("Database reset complete.");
    } catch (error) {
        console.error("Failed to reset database:", error);
        process.exit(1);
    }
}

main();
