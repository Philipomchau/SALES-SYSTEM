import { sql } from "../lib/db";
import { verifyPassword } from "../lib/auth";
import { logAudit } from "../lib/audit";

async function simulateLogin(attempt: number) {
    console.log(`\n--- Login Attempt #${attempt} ---`);
    const email = "philipomchau1@gmail.com";
    const password = "Philip12";

    try {
        // 1. Fetch User
        const result = await sql`SELECT * FROM workers WHERE email = ${email}`;
        if (result.length === 0) throw new Error("User not found");
        const worker = result[0];

        // 2. Verify Password
        const valid = await verifyPassword(password, worker.password_hash);
        if (!valid) throw new Error("Invalid password");

        // 3. Log Audit (Simulating the part that might fail)
        console.log("Logging audit...");
        await logAudit(worker.id, "TEST_LOGIN", null, null, { email: worker.email, attempt });
        console.log("Audit logged successfully.");

        console.log(`Attempt #${attempt} SUCCESS`);
    } catch (error) {
        console.error(`Attempt #${attempt} FAILED:`, error);
    }
}

async function main() {
    console.log("Starting reproduction script...");

    // Run 5 attempts sequentially
    for (let i = 1; i <= 5; i++) {
        await simulateLogin(i);
        // Wait a bit between attempts
        await new Promise(r => setTimeout(r, 500));
    }

    console.log("\nReproduction script complete.");
}

main();
