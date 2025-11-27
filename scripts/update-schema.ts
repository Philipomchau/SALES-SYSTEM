import { sql } from "../lib/db";

async function main() {
    console.log("Updating database schema...");
    try {
        // Create clients table
        await sql`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
        console.log("Created clients table.");

        // Add unit_type to sales
        await sql`
      ALTER TABLE sales 
      ADD COLUMN IF NOT EXISTS unit_type VARCHAR(20) DEFAULT 'piece'
    `;
        console.log("Added unit_type to sales.");

        // Add client_id to sales
        await sql`
      ALTER TABLE sales 
      ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id)
    `;
        console.log("Added client_id to sales.");

        console.log("Schema update complete.");
    } catch (error) {
        console.error("Failed to update schema:", error);
        process.exit(1);
    }
}

main();
