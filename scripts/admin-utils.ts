import { sql } from "../lib/db";
import { hashPassword } from "../lib/auth";

const command = process.argv[2];
const args = process.argv.slice(3);

async function listAdmins() {
    console.log("Fetching admin users...");
    try {
        const admins = await sql`SELECT id, name, email, created_at FROM workers WHERE role = 'admin'`;
        if (admins.length === 0) {
            console.log("No admin users found.");
        } else {
            console.log(JSON.stringify(admins, null, 2));
        }
    } catch (error) {
        console.error("Failed to list admins:", error);
    }
}

async function createAdmin(name: string, email: string, password: string) {
    if (!name || !email || !password) {
        console.error("Usage: create <name> <email> <password>");
        return;
    }
    console.log(`Creating admin user: ${email}`);
    try {
        const hashedPassword = await hashPassword(password);
        const result = await sql`
      INSERT INTO workers (name, email, password_hash, role, created_at)
      VALUES (${name}, ${email}, ${hashedPassword}, 'admin', NOW())
      RETURNING id, name, email
    `;
        console.log("Admin created successfully:", result[0]);
    } catch (error) {
        console.error("Failed to create admin:", error);
    }
}

async function deleteAdmin(email: string) {
    if (!email) {
        console.error("Usage: delete <email>");
        return;
    }
    console.log(`Deleting admin user: ${email}`);
    try {
        const result = await sql`
      DELETE FROM workers WHERE email = ${email} AND role = 'admin'
      RETURNING id, name, email
    `;
        if (result.length === 0) {
            console.log("No admin found with that email.");
        } else {
            console.log("Admin deleted successfully:", result[0]);
        }
    } catch (error) {
        console.error("Failed to delete admin:", error);
    }
}

async function main() {
    switch (command) {
        case "list":
            await listAdmins();
            break;
        case "create":
            await createAdmin(args[0], args[1], args[2]);
            break;
        case "delete":
            await deleteAdmin(args[0]);
            break;
        default:
            console.log("Usage: npx tsx scripts/admin-utils.ts <list|create|delete> [args...]");
            break;
    }
    process.exit(0);
}

main();
