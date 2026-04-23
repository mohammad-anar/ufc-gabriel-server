import { ActivityService } from "../src/app/modules/activity/activity.service.js";
import { prisma } from "../src/helpers.ts/prisma.js";

async function test() {
  try {
    const job = await prisma.job.findFirst({ select: { userId: true } });
    if (!job) {
      console.log("No job found in database. Cannot test activity.");
      return;
    }

    console.log(`Testing activity for user with job: ${job.userId}`);
    const activities = await ActivityService.getMyActivities(job.userId);
    console.log("Activities found:", activities.length);
    console.log(JSON.stringify(activities.slice(0, 5), null, 2));
  } catch (error) {
    console.error("Error during verification:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
