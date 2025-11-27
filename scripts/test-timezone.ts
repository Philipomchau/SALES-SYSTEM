import { formatDateTime, formatDate, formatTime, TIMEZONE } from "../lib/timezone";

const testDate = new Date("2025-11-26T12:00:00Z"); // 12:00 UTC should be 15:00 EAT

console.log("Configured Timezone:", TIMEZONE);
console.log("Test Date (UTC):", testDate.toISOString());
console.log("Formatted DateTime:", formatDateTime(testDate));
console.log("Formatted Date:", formatDate(testDate));
console.log("Formatted Time:", formatTime(testDate));
