import { prisma } from "../src/helpers.ts/prisma.js";
import { JobOfferServices } from "../src/app/modules/jobOffer/jobOffer.services.js";

async function main() {
  console.log("Starting Booking Auto-Creation and Notification Verification...");

  try {
    // 1. Get or create User
    let user = await prisma.user.findFirst({ where: { role: "USER" } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `test_user_booking_${Date.now()}@example.com`,
          password: "password123",
          name: "Test User Booking",
          role: "USER"
        }
      });
    }

    // 2. Get or create Workshop
    let workshop = await prisma.workshop.findFirst();
    if (!workshop) {
      workshop = await prisma.workshop.create({
        data: {
          email: `test_workshop_booking_${Date.now()}@example.com`,
          password: "password123",
          workshopName: "Test Workshop Booking",
          ownerName: "Owner Name",
          cvrNumber: "87654321",
          city: "Copenhagen",
          postalCode: "2000",
          role: "WORKSHOP"
        }
      });
    }

    // 3. Create Job
    const job = await prisma.job.create({
      data: {
        userId: user.id,
        title: "Booking Test Job",
        description: "Testing auto booking and notifications",
        address: "Test Address",
        city: "Copenhagen",
        postalCode: "2000",
        latitude: 55.6761,
        longitude: 12.5683,
        radius: 10,
        bikeName: "Test Bike",
        bikeType: "ROAD",
        preferredTime: new Date()
      }
    });

    // 4. Create two Job Offers
    const offer1 = await prisma.jobOffer.create({
      data: {
        jobId: job.id,
        workshopId: workshop.id,
        price: 150,
        estimatedTime: new Date(Date.now() + 172800000), // 2 days later
        message: "Offer 1"
      }
    });

    // Create another workshop for second offer
    const workshop2 = await prisma.workshop.create({
      data: {
        email: `test_workshop2_booking_${Date.now()}@example.com`,
        password: "password123",
        workshopName: "Workshop 2",
        ownerName: "Owner 2",
        cvrNumber: "12341234",
        city: "Copenhagen",
        postalCode: "2000",
        role: "WORKSHOP"
      }
    });

    const offer2 = await prisma.jobOffer.create({
      data: {
        jobId: job.id,
        workshopId: workshop2.id,
        price: 200,
        estimatedTime: new Date(Date.now() + 172800000),
        message: "Offer 2"
      }
    });

    console.log(`Created Job: ${job.id} and Offers: ${offer1.id}, ${offer2.id}`);

    // 5. Accept Offer 1
    console.log("Accepting offer 1...");
    const result = await JobOfferServices.acceptOffer(offer1.id);

    console.log("Result of acceptOffer 1:", JSON.stringify({
      offerStatus: result.offer.status,
      bookingId: result.booking.id,
      roomCreated: !!result.room
    }, null, 2));

    // 6. Try to accept Offer 2 (Should fail)
    console.log("Trying to accept offer 2 (expect failure)...");
    try {
      await JobOfferServices.acceptOffer(offer2.id);
      console.error("FAIL: Accepted second offer!");
    } catch (err: any) {
      console.log("Correctly caught error for second acceptance:", err.message);
    }

    // 7. Verify Job Status
    const updatedJob = await prisma.job.findUnique({ where: { id: job.id } });
    console.log("Updated Job Status (expected IN_PROGRESS):", updatedJob?.status);

    // 8. Verify Notification Creation
    const notification = await prisma.notification.findFirst({
      where: { jobId: job.id, eventType: "OFFER_ACCEPTED" }
    });
    console.log("Notification Record Created:", !!notification);
    if (notification) {
      console.log("Notification details:", { title: notification.title, body: notification.body });
    }

    console.log("\nVerification finished successfully.");

  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
