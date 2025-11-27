import { sql } from "../lib/db";
import bcrypt from "bcryptjs";

async function main() {
    console.log("Creating worker user...");
    const email = "worker@example.com";
    const password = "Worker123";
    const name = "Test Worker";

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await sql`
      INSERT INTO workers (name, email, password_hash, role)
      VALUES (${name}, ${email}, ${hashedPassword}, 'worker')
      ON CONFLICT (email) DO UPDATE SET
        password_hash = ${hashedPassword},
        role = 'worker'
    `;
        console.log(`Created/Updated worker: ${email} / ${password}`);
    } catch (error) {
        console.error("Failed to create worker:", error);
    }
}

main();
