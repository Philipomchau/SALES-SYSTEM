import { sql } from "../lib/db";

async function main() {
    console.log("Checking database timezone settings...");
    try {
        // Check column type
        const schema = await sql`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'sales' AND column_name = 'sale_datetime'
    `;
        console.log("Column Schema:", schema);

        // Check current DB time
        const dbTime = await sql`SELECT NOW() as db_now, NOW() AT TIME ZONE 'Africa/Dar_es_Salaam' as eat_now`;
        console.log("DB Time:", dbTime);

        // Fetch a sample sale
        const sale = await sql`SELECT sale_datetime FROM sales LIMIT 1`;
        console.log("Sample Sale:", sale);

    } catch (error) {
        console.error("Failed to check timezone:", error);
    }
}

main();
