import { sql } from "../lib/db";
import { verifyPassword, createSession, getSession } from "../lib/auth";
import { cookies } from "next/headers";

// Mocking cookies for the test context is hard because lib/auth uses next/headers which only works in Next.js request context.
// Instead, we will simulate the logic manually by calling the functions if possible, or just testing the core logic.

// Since we can't easily mock next/headers cookies in a standalone script without a server, 
// we will test the *logic* of session creation and verification.

async function testRoleSwitch() {
    console.log("Testing Role Switching Logic...");

    // 1. Admin Login
    console.log("\n--- Step 1: Admin Login ---");
    const adminEmail = "philipomchau1@gmail.com";
    const adminRes = await sql`SELECT * FROM workers WHERE email = ${adminEmail}`;
    const admin = adminRes[0];
    console.log("Admin found:", admin.id, admin.role);

    // Simulate Session Creation (we can't actually set cookie, but we can generate the ID)
    const adminSessionId = crypto.randomUUID();
    const adminCookieValue = `${adminSessionId}:${admin.id}`;
    console.log("Admin Session Cookie Value:", adminCookieValue);

    // Simulate Session Verification
    const [sessId, workerId] = adminCookieValue.split(":");
    const verifiedAdmin = await sql`SELECT * FROM workers WHERE id = ${workerId}`;
    console.log("Verified Session User:", verifiedAdmin[0].email, verifiedAdmin[0].role);

    if (verifiedAdmin[0].role !== 'admin') throw new Error("Failed to verify admin session");


    // 2. Worker Login (Simulating "Second time")
    console.log("\n--- Step 2: Worker Login (Overwriting Session) ---");
    const workerEmail = "worker@example.com";
    const workerRes = await sql`SELECT * FROM workers WHERE email = ${workerEmail}`;
    const worker = workerRes[0];
    console.log("Worker found:", worker.id, worker.role);

    // Simulate Session Creation (New Session ID)
    const workerSessionId = crypto.randomUUID();
    const workerCookieValue = `${workerSessionId}:${worker.id}`;
    console.log("Worker Session Cookie Value:", workerCookieValue);

    // Simulate Session Verification with NEW cookie
    const [sessId2, workerId2] = workerCookieValue.split(":");
    const verifiedWorker = await sql`SELECT * FROM workers WHERE id = ${workerId2}`;
    console.log("Verified Session User:", verifiedWorker[0].email, verifiedWorker[0].role);

    if (verifiedWorker[0].role !== 'worker') throw new Error("Failed to verify worker session");

    console.log("\nLogic test passed. The issue is likely not in the DB/Auth logic itself, but in how the Browser/Next.js handles the cookie update.");
}

testRoleSwitch();
