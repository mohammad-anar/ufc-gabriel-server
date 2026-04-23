import { ActivityService } from "../src/app/modules/activity/activity.service.js";
import { AnalyticsService } from "../src/app/modules/analytics/analytics.service.js";
import { prisma } from "../src/helpers.ts/prisma.js";

async function test() {
  try {
    const workshop = await prisma.workshop.findFirst();
    if (!workshop) {
      console.log("No workshop found in database. Cannot test.");
      return;
    }

    console.log(`Testing for workshop: ${workshop.workshopName} (${workshop.id})`);
    
    const activities = await ActivityService.getWorkshopActivities(workshop.id);
    console.log("Workshop activities found:", activities.length);
    console.log("Activity samples:", JSON.stringify(activities.slice(0, 3), null, 2));

    const analytics = await AnalyticsService.getWeeklyBookingCount(workshop.id);
    console.log("Weekly booking analytics:", JSON.stringify(analytics, null, 2));

  } catch (error) {
    console.error("Error during verification:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
