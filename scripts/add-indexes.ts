import { sql } from "../lib/db";

async function main() {
    console.log("Adding indexes to database...");
    try {
        await sql`CREATE INDEX IF NOT EXISTS idx_sales_datetime ON sales (sale_datetime)`;
        console.log("Created index: idx_sales_datetime");

        await sql`CREATE INDEX IF NOT EXISTS idx_sales_worker_id ON sales (worker_id)`;
        console.log("Created index: idx_sales_worker_id");

        await sql`CREATE INDEX IF NOT EXISTS idx_sales_product_name ON sales (product_name)`;
        console.log("Created index: idx_sales_product_name");

        console.log("All indexes created successfully.");
    } catch (error) {
        console.error("Failed to create indexes:", error);
        process.exit(1);
    }
}

main();
