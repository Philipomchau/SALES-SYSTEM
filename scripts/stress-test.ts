import { sql } from "../lib/db";

async function stressTest() {
    console.log("Starting stress test...");
    const iterations = 20;
    const concurrency = 5;

    // Test 1: Simple DB Query (Suspicious Activities)
    console.log("\n--- Testing Suspicious Activities Query ---");
    for (let i = 0; i < iterations; i += concurrency) {
        const promises = [];
        for (let j = 0; j < concurrency; j++) {
            promises.push(
                sql`SELECT * FROM suspicious_activity LIMIT 1`
                    .then(() => process.stdout.write("."))
                    .catch((e) => process.stdout.write("X"))
            );
        }
        await Promise.all(promises);
    }

    // Test 2: Audit Log Insertion (Simulating Login/Worker Update)
    console.log("\n\n--- Testing Audit Log Insertion ---");
    for (let i = 0; i < iterations; i += concurrency) {
        const promises = [];
        for (let j = 0; j < concurrency; j++) {
            promises.push(
                sql`
          INSERT INTO audit_logs (worker_id, action_type, sale_id, before_data, after_data)
          VALUES (1, 'STRESS_TEST', NULL, NULL, NULL)
        `
                    .then(() => process.stdout.write("."))
                    .catch((e) => {
                        console.error("\nError:", e.message);
                        process.stdout.write("X");
                    })
            );
        }
        await Promise.all(promises);
    }

    console.log("\n\nStress test complete.");
}

stressTest();
