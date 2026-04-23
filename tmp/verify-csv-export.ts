import { AnalyticsService } from "../src/app/modules/analytics/analytics.service.js";
import { prisma } from "../src/helpers.ts/prisma.js";

async function main() {
  console.log("Verifying CSV Exports...");

  try {
    // 1. Export Users
    console.log("\n--- Exporting Users ---");
    const usersCSV = await AnalyticsService.exportUsersCSV();
    console.log("First 3 lines of Users CSV:");
    console.log(usersCSV.split('\n').slice(0, 3).join('\n'));

    // 2. Export Workshops
    console.log("\n--- Exporting Workshops ---");
    const workshopsCSV = await AnalyticsService.exportWorkshopsCSV();
    console.log("First 3 lines of Workshops CSV:");
    console.log(workshopsCSV.split('\n').slice(0, 3).join('\n'));

    // 3. Export Jobs
    console.log("\n--- Exporting Jobs ---");
    const jobsCSV = await AnalyticsService.exportJobsCSV();
    console.log("First 3 lines of Jobs CSV:");
    console.log(jobsCSV.split('\n').slice(0, 3).join('\n'));

    // 4. Export Bookings
    console.log("\n--- Exporting Bookings ---");
    const bookingsCSV = await AnalyticsService.exportBookingsCSV();
    console.log("First 3 lines of Bookings CSV:");
    console.log(bookingsCSV.split('\n').slice(0, 3).join('\n'));

    console.log("\nVerification finished successfully.");

  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
