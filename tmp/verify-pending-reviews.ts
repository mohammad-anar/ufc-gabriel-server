import { ReviewService } from "../src/app/modules/review/review.services.js";
import { prisma } from "../src/helpers.ts/prisma.js";

async function test() {
  try {
    const booking = await prisma.booking.findFirst({
      where: {
        status: "COMPLETED",
        review: { is: null }
      },
      select: { userId: true }
    });

    if (!booking) {
      console.log("No pending reviews found in database. Cannot test.");
      return;
    }

    console.log(`Testing pending reviews for user: ${booking.userId}`);
    const pendingReviews = await ReviewService.getPendingReviews(booking.userId);
    console.log("Pending reviews found:", pendingReviews.length);
    console.log(JSON.stringify(pendingReviews.slice(0, 5), null, 2));
  } catch (error) {
    console.error("Error during verification:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
