import { prisma } from "../../../helpers/prisma.js";

const getActivityFeed = async (date?: string) => {
  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(startOfDay.getDate() + 1);

  // 1. Fetch data from different models
  const [
    registeredWorkshops,
    approvedWorkshops,
    postedJobs,
    createdBookings,
    completedBookings,
    platformSettings,
  ] = await Promise.all([
    // Workshop Registered
    prisma.workshop.findMany({
      where: { createdAt: { gte: startOfDay, lt: endOfDay } },
      select: { id: true, workshopName: true, createdAt: true },
    }),
    // Workshop Approved
    prisma.workshop.findMany({
      where: {
        approvalStatus: "APPROVED",
        updatedAt: { gte: startOfDay, lt: endOfDay },
      },
      select: { id: true, workshopName: true, updatedAt: true },
    }),
    // Job Posted
    prisma.job.findMany({
      where: { createdAt: { gte: startOfDay, lt: endOfDay } },
      select: { id: true, title: true, createdAt: true, bikeName: true },
    }),
    // Booking Created
    prisma.booking.findMany({
      where: { createdAt: { gte: startOfDay, lt: endOfDay } },
      select: { id: true, createdAt: true, workshop: { select: { workshopName: true } } },
    }),
    // Booking Completed (Revenue)
    prisma.booking.findMany({
      where: {
        status: "COMPLETED",
        updatedAt: { gte: startOfDay, lt: endOfDay },
      },
      include: {
        offer: true,
        workshop: { select: { workshopName: true, platformFees: true } },
      },
    }),
    // Platform Data Updated
    prisma.platformData.findMany({
      where: { updatedAt: { gte: startOfDay, lt: endOfDay } },
    }),
  ]);

  const platformData = await prisma.platformData.findFirst();
  const globalFee = platformData?.platformFee || 0;

  // 2. Map to common Activity shape
  const activities: any[] = [];

  registeredWorkshops.forEach((w) => {
    activities.push({
      type: "WORKSHOP_REGISTERED",
      timestamp: w.createdAt,
      message: `Workshop "${w.workshopName}" has registered.`,
      details: { id: w.id, name: w.workshopName },
    });
  });

  approvedWorkshops.forEach((w) => {
    activities.push({
      type: "WORKSHOP_APPROVED",
      timestamp: w.updatedAt,
      message: `Workshop "${w.workshopName}" has been approved.`,
      details: { id: w.id, name: w.workshopName },
    });
  });

  postedJobs.forEach((j) => {
    activities.push({
      type: "JOB_POSTED",
      timestamp: j.createdAt,
      message: `New job posted: "${j.title}" for ${j.bikeName}.`,
      details: { id: j.id, title: j.title },
    });
  });

  createdBookings.forEach((b) => {
    activities.push({
      type: "BOOKING_CREATED",
      timestamp: b.createdAt,
      message: `A new booking was created with ${b.workshop.workshopName}.`,
      details: { id: b.id },
    });
  });

  completedBookings.forEach((b) => {
    const feeRate = b.workshop?.platformFees ?? globalFee;
    const feeAmount = (b.offer?.price || 0) * (feeRate / 100);
    activities.push({
      type: "BOOKING_COMPLETED",
      timestamp: b.updatedAt,
      message: `Booking completed with ${b.workshop.workshopName}. Platform fee received: $${feeAmount.toFixed(2)}.`,
      details: { id: b.id, amount: b.offer?.price, fee: feeAmount },
    });
  });

  platformSettings.forEach((ps) => {
    activities.push({
      type: "PLATFORM_SETTINGS_UPDATED",
      timestamp: ps.updatedAt,
      message: `Platform settings (fee: ${ps.platformFee}%, radius: ${ps.maximumJobRadius}km) have been updated.`,
      details: { fee: ps.platformFee, radius: ps.maximumJobRadius },
    });
  });

  // 3. Sort by timestamp descending
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return activities;
};

const getMyActivities = async (userId: string) => {
  const [jobs, bookings, reviews, receivedOffers] = await Promise.all([
    // User's Jobs
    prisma.job.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    // User's Bookings
    prisma.booking.findMany({
      where: { userId },
      include: { workshop: { select: { workshopName: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    // User's Reviews
    prisma.review.findMany({
      where: { userId },
      include: { booking: { include: { workshop: { select: { workshopName: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    // Offers received for User's Jobs
    prisma.jobOffer.findMany({
      where: { job: { userId } },
      include: {
        workshop: { select: { workshopName: true } },
        job: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const activities: any[] = [];

  jobs.forEach((j) => {
    activities.push({
      type: "JOB_POSTED",
      timestamp: j.createdAt,
      message: `You posted a new job: "${j.title}".`,
      details: { id: j.id, title: j.title },
    });
  });

  bookings.forEach((b) => {
    activities.push({
      type: "BOOKING_MADE",
      timestamp: b.createdAt,
      message: `You made a booking with "${b.workshop.workshopName}".`,
      details: { id: b.id, workshopName: b.workshop.workshopName },
    });

    if (b.status === "COMPLETED") {
      activities.push({
        type: "BOOKING_COMPLETED",
        timestamp: b.updatedAt,
        message: `Your booking with "${b.workshop.workshopName}" was completed.`,
        details: { id: b.id, workshopName: b.workshop.workshopName },
      });
    }
  });

  reviews.forEach((r) => {
    activities.push({
      type: "REVIEW_LEFT",
      timestamp: r.createdAt,
      message: `You left a review for "${r.booking.workshop.workshopName}".`,
      details: { id: r.id, rating: r.rating },
    });
  });

  receivedOffers.forEach((o) => {
    activities.push({
      type: "OFFER_RECEIVED",
      timestamp: o.createdAt,
      message: `You received an offer of $${o.price} from "${o.workshop.workshopName}" for "${o.job.title}".`,
      details: { id: o.id, price: o.price, workshopName: o.workshop.workshopName },
    });
  });

  // Sort by timestamp descending
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return activities;
};

const getWorkshopActivities = async (workshopId: string) => {
  const workshop = await prisma.workshop.findUniqueOrThrow({
    where: { id: workshopId },
    select: { city: true },
  });

  const [relevantJobs, sentOffers, bookings] = await Promise.all([
    // Jobs in the workshop's city (New job available)
    prisma.job.findMany({
      where: {
        city: workshop.city,
        status: { in: ["PENDING", "OPEN"] },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    // Offers sent by the workshop
    prisma.jobOffer.findMany({
      where: { workshopId },
      include: { job: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    // Bookings for the workshop (includes accepted offers and completions)
    prisma.booking.findMany({
      where: { workshopId },
      include: {
        job: { select: { title: true } },
        user: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  const activities: any[] = [];

  relevantJobs.forEach((j) => {
    activities.push({
      type: "JOB_AVAILABLE",
      timestamp: j.createdAt,
      message: `New job available in ${j.city}: "${j.title}".`,
      details: { id: j.id, title: j.title },
    });
  });

  sentOffers.forEach((o) => {
    activities.push({
      type: "OFFER_SENT",
      timestamp: o.createdAt,
      message: `You sent an offer for "${o.job.title}".`,
      details: { id: o.id, price: o.price },
    });
  });

  bookings.forEach((b) => {
    if (b.status === "CONFIRMED") {
      activities.push({
        type: "OFFER_ACCEPTED",
        timestamp: b.createdAt,
        message: `Your offer for "${b.job.title}" was accepted by ${b.user.name}.`,
        details: { id: b.id, userName: b.user.name },
      });
    } else if (b.status === "COMPLETED") {
      activities.push({
        type: "BOOKING_COMPLETED",
        timestamp: b.updatedAt,
        message: `Booking for "${b.job.title}" with ${b.user.name} has been completed.`,
        details: { id: b.id, userName: b.user.name },
      });
    }
  });

  // Sort by timestamp descending
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return activities;
};

export const ActivityService = {
  getActivityFeed,
  getMyActivities,
  getWorkshopActivities,
};
