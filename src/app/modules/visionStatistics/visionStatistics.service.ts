import { prisma } from "../../../helpers/prisma.js";

const getVisionStatistics = async () => {
  const [
    totalJobs,
    totalReviews,
    totalJobsCompleted,
    totalApprovedWorkshops,
    avgRatingResult,
    jobRequestsEveryYear,
    totalBookingsCompleted,
  ] = await Promise.all([
    // Total jobs
    prisma.job.count(),
    
    // Total reviews
    prisma.review.count(),
    
    // Total jobs completed
    prisma.job.count({
      where: {
        status: "COMPLETED",
      },
    }),
    
    // Total approved workshops
    prisma.workshop.count({
      where: {
        approvalStatus: "APPROVED",
      },
    }),
    
    // Average rating
    prisma.review.aggregate({
      _avg: {
        rating: true,
      },
    }),
    
    // Job requests every year
    prisma.$queryRaw<Array<{ year: number; count: bigint }>>`
      SELECT EXTRACT(YEAR FROM "createdAt")::INT as "year", COUNT(*)::BIGINT as "count"
      FROM "Job"
      GROUP BY "year"
      ORDER BY "year" DESC
    `,
    
    // Total bookings completed
    prisma.booking.count({
      where: {
        status: "COMPLETED",
      },
    }),
  ]);

  // Calculate average job requests per year
  const totalJobRequests = jobRequestsEveryYear.reduce(
    (acc, curr) => acc + Number(curr.count),
    0
  );
  const numberOfYears = jobRequestsEveryYear.length;
  const avgJobRequestsPerYear =
    numberOfYears > 0 ? totalJobRequests / numberOfYears : 0;

  return {
    totalJobs,
    totalReviews,
    totalJobsCompleted,
    totalApprovedWorkshops,
    averageRating: avgRatingResult._avg.rating || 0,
    jobRequestsEveryYear: jobRequestsEveryYear.map((item) => ({
      year: item.year,
      count: Number(item.count),
    })),
    avgJobRequestsPerYear: Number(avgJobRequestsPerYear.toFixed(2)),
    totalBookingsCompleted,
  };
};

export const VisionStatisticsService = {
  getVisionStatistics,
};
