import { sql } from "../lib/db";

async function checkDriver() {
    console.log("Type of sql:", typeof sql);
    console.log("Properties of sql:", Object.keys(sql));

    try {
        // @ts-ignore
        if (typeof sql.query === 'function') {
            console.log("sql.query exists and is a function");
        } else {
            console.log("sql.query does NOT exist");
        }
    } catch (e) {
        console.log("Error checking sql.query:", e);
    }

    try {
        const result = await sql`SELECT 1 as val`;
        console.log("Standard tagged template result:", result);
        console.log("Is array?", Array.isArray(result));

        console.log("\n--- Testing sql.query ---");
        // @ts-ignore
        const queryResult = await sql.query("SELECT 1 as val");
        console.log("sql.query result:", queryResult);
        console.log("Is sql.query result an array?", Array.isArray(queryResult));
        if (!Array.isArray(queryResult)) {
            // @ts-ignore
            console.log("Does it have rows?", Array.isArray(queryResult.rows));
        }
    } catch (e) {
        console.error("Standard query failed:", e);
    }
}

checkDriver();
