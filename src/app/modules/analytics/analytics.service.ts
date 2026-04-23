
import { prisma } from "../../../helpers/prisma.js";
import { convertToCSV } from "../../shared/utils/csv.js";

const getUserAnalytics = async (userId: string) => {
  const totalJobs = await prisma.job.count({ where: { userId } });
  
  const bookings = await prisma.booking.findMany({
    where: { userId },
    include: {
      offer: true,
    }
  });

  const totalBookings = bookings.length;
  
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED");
  const totalCompletedBookings = completedBookings.length;
  
  const totalSpent = completedBookings.reduce((sum, b) => sum + (b.offer?.price || 0), 0);
  
  const reviewsGiven = await prisma.review.count({ where: { userId } });

  return {
    totalJobs,
    totalBookings,
    totalCompletedBookings,
    totalSpent,
    reviewsGiven,
  };
};

const getWorkshopAnalytics = async (workshopId: string) => {
  const workshop = await prisma.workshop.findUnique({
    where: { id: workshopId },
    select: { avgRating: true, reviewsCount: true, platformFees: true }
  });

  const platformData = await prisma.platformData.findFirst();
  const globalFee = platformData?.platformFee || 0;
  const effectiveFeeRate = workshop?.platformFees ?? globalFee;

  const totalOffersMade = await prisma.jobOffer.count({ where: { workshopId } });
  
  const bookings = await prisma.booking.findMany({
    where: { workshopId },
    include: {
      offer: true,
    }
  });

  const totalBookings = bookings.length;
  const conversionRate = totalOffersMade > 0 ? (totalBookings / totalOffersMade) * 100 : 0;
  
  const activeBookings = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "IN_PROGRESS").length;
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED");
  const completedBookingsCount = completedBookings.length;
  
  const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.offer?.price || 0), 0);
  const avgJobValue = completedBookingsCount > 0 ? totalRevenue / completedBookingsCount : 0;

  const platformFees = totalRevenue * (effectiveFeeRate / 100);
  const workshopRevenue = totalRevenue - platformFees;

  return {
    totalOffersMade,
    totalBookings,
    conversionRate: parseFloat(conversionRate.toFixed(2)),
    activeBookings,
    completedBookings: completedBookingsCount,
    totalRevenue,
    avgJobValue: parseFloat(avgJobValue.toFixed(2)),
    platformFees: parseFloat(platformFees.toFixed(2)),
    workshopRevenue: parseFloat(workshopRevenue.toFixed(2)),
    avgRating: workshop?.avgRating || 0,
    reviewsCount: workshop?.reviewsCount || 0,
  };
};

const getAdminAnalytics = async () => {
  const now = new Date();
  const startOfToday = new Date(new Date(now).setHours(0, 0, 0, 0));
  
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(new Date(now).setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);

  const totalUsers = await prisma.user.count({ where: { role: "USER" } });
  const activeUsers = await prisma.user.count({ where: { role: "USER", status: "ACTIVE" } });
  
  const totalWorkshops = await prisma.workshop.count();
  const approvedWorkshops = await prisma.workshop.count({ where: { approvalStatus: "APPROVED" } });
  const pendingWorkshops = await prisma.workshop.count({ where: { approvalStatus: "PENDING" } });

  const totalJobs = await prisma.job.count();
  const jobsToday = await prisma.job.count({ where: { createdAt: { gte: startOfToday } } });
  const jobsThisWeek = await prisma.job.count({ where: { createdAt: { gte: startOfWeek } } });

  const totalBookings = await prisma.booking.count();
  const bookingsCompletedThisWeek = await prisma.booking.count({ 
    where: { status: "COMPLETED", updatedAt: { gte: startOfWeek } } 
  });
  
  const completedBookings = await prisma.booking.findMany({
    where: { status: "COMPLETED" },
    include: { offer: true }
  });
  const totalPlatformRevenue = completedBookings.reduce((sum, b) => sum + (b.offer?.price || 0), 0);

  // Status Breakdowns
  const workshopsByStatusRaw = await prisma.workshop.groupBy({
    by: ['approvalStatus'],
    _count: { approvalStatus: true }
  });
  const workshopsByStatus = workshopsByStatusRaw.reduce((acc, curr) => {
    acc[curr.approvalStatus] = curr._count.approvalStatus;
    return acc;
  }, {} as Record<string, number>);

  const jobsByStatusRaw = await prisma.job.groupBy({
    by: ['status'],
    _count: { status: true }
  });
  const jobsByStatus = jobsByStatusRaw.reduce((acc, curr) => {
    acc[curr.status] = curr._count.status;
    return acc;
  }, {} as Record<string, number>);

  const bookingsByStatusRaw = await prisma.booking.groupBy({
    by: ['status'],
    _count: { status: true }
  });
  const bookingsByStatus = bookingsByStatusRaw.reduce((acc, curr) => {
    acc[curr.status] = curr._count.status;
    return acc;
  }, {} as Record<string, number>);

  return {
    overview: {
      totalUsers,
      activeUsers,
      totalWorkshops,
      approvedWorkshops,
      pendingWorkshops,
      totalJobs,
      totalBookings,
      bookingsCompletedThisWeek,
      totalPlatformRevenue,
    },
    jobBreakdown: {
      today: jobsToday,
      thisWeek: jobsThisWeek,
      total: totalJobs,
    },
    statusBreakdowns: {
      workshops: workshopsByStatus,
      jobs: jobsByStatus,
      bookings: bookingsByStatus,
    }
  };
};


const getMonthlyReport = async (year: number, month: number) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const prevStartDate = new Date(year, month - 2, 1);
  const prevEndDate = new Date(year, month - 1, 0, 23, 59, 59, 999);

  const getMetrics = async (start: Date, end: Date) => {
    const newUserCount = await prisma.user.count({ 
      where: { role: "USER", createdAt: { gte: start, lte: end } } 
    });
    const newWorkshopCount = await prisma.workshop.count({ 
      where: { createdAt: { gte: start, lte: end } } 
    });
    const bookingCount = await prisma.booking.count({ 
      where: { createdAt: { gte: start, lte: end } } 
    });
    
    const completedBookings = await prisma.booking.findMany({
      where: { 
        status: "COMPLETED", 
        createdAt: { gte: start, lte: end } 
      },
      include: { offer: true }
    });
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.offer?.price || 0), 0);

    return { newUserCount, newWorkshopCount, bookingCount, totalRevenue };
  };

  const currentMetrics = await getMetrics(startDate, endDate);
  const prevMetrics = await getMetrics(prevStartDate, prevEndDate);

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return parseFloat(((current - previous) / previous * 100).toFixed(2));
  };

  const summary = {
    users: { total: currentMetrics.newUserCount, growth: calculateGrowth(currentMetrics.newUserCount, prevMetrics.newUserCount) },
    workshops: { total: currentMetrics.newWorkshopCount, growth: calculateGrowth(currentMetrics.newWorkshopCount, prevMetrics.newWorkshopCount) },
    bookings: { total: currentMetrics.bookingCount, growth: calculateGrowth(currentMetrics.bookingCount, prevMetrics.bookingCount) },
    revenue: { total: currentMetrics.totalRevenue, growth: calculateGrowth(currentMetrics.totalRevenue, prevMetrics.totalRevenue) },
  };

  // Daily Data
  const dailyData = [];
  const daysInMonth = endDate.getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    const dayStart = new Date(year, month - 1, i, 0, 0, 0, 0);
    const dayEnd = new Date(year, month - 1, i, 23, 59, 59, 999);
    
    const dayBookings = await prisma.booking.count({
      where: { createdAt: { gte: dayStart, lte: dayEnd } }
    });
    
    const dayRevenueRaw = await prisma.booking.findMany({
      where: { 
        status: "COMPLETED", 
        createdAt: { gte: dayStart, lte: dayEnd } 
      },
      include: { offer: true }
    });
    const dayRevenue = dayRevenueRaw.reduce((sum, b) => sum + (b.offer?.price || 0), 0);

    dailyData.push({
      day: i,
      bookings: dayBookings,
      revenue: dayRevenue
    });
  }

  // Top Workshops
  const topWorkshopsRaw = await prisma.booking.groupBy({
    by: ['workshopId'],
    where: { 
      status: "COMPLETED",
      createdAt: { gte: startDate, lte: endDate }
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5
  });

  const topWorkshops = await Promise.all(topWorkshopsRaw.map(async (item) => {
    const workshop = await prisma.workshop.findUnique({
      where: { id: item.workshopId },
      select: { id: true, workshopName: true, avatar: true }
    });
    
    const revenueSum = await prisma.booking.findMany({
      where: {
        workshopId: item.workshopId,
        status: "COMPLETED",
        createdAt: { gte: startDate, lte: endDate }
      },
      include: { offer: true }
    });
    
    const totalRevenue = revenueSum.reduce((sum, b) => sum + (b.offer?.price || 0), 0);
    
    return {
      ...workshop,
      bookingCount: item._count.id,
      totalRevenue
    };
  }));

  return {
    month,
    year,
    summary,
    dailyData,
    topWorkshops
  };
};

const exportUsersCSV = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      city: true,
      isVerified: true,
      createdAt: true
    }
  });
  return convertToCSV(users);
};

const exportWorkshopsCSV = async () => {
  const workshops = await prisma.workshop.findMany({
    select: {
      id: true,
      workshopName: true,
      email: true,
      phone: true,
      ownerName: true,
      cvrNumber: true,
      city: true,
      approvalStatus: true,
      avgRating: true,
      isVerified: true,
      createdAt: true
    }
  });
  return convertToCSV(workshops);
};

const exportJobsCSV = async () => {
  const jobs = await prisma.job.findMany({
    select: {
      id: true,
      title: true,
      bikeName: true,
      bikeType: true,
      city: true,
      urgency: true,
      status: true,
      createdAt: true
    }
  });
  return convertToCSV(jobs);
};

const exportBookingsCSV = async () => {
  const bookings = await prisma.booking.findMany({
    select: {
      id: true,
      userId: true,
      workshopId: true,
      status: true,
      paymentStatus: true,
      scheduleStart: true,
      scheduleEnd: true,
      createdAt: true
    }
  });
  return convertToCSV(bookings);
};

const getWeeklyBookingCount = async (workshopId: string) => {
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const bookings = await prisma.booking.findMany({
    where: {
      workshopId,
      createdAt: {
        gte: last7Days,
      },
    },
    select: {
      createdAt: true,
    },
  });

  const dayNames = [
    "sunDay",
    "monDay",
    "tuesDay",
    "wednesDay",
    "thursDay",
    "friDay",
    "saturDay",
  ];

  const counts: Record<string, number> = {
    sunDay: 0,
    monDay: 0,
    tuesDay: 0,
    wednesDay: 0,
    thursDay: 0,
    friDay: 0,
    saturDay: 0,
  };

  bookings.forEach((b) => {
    const dayIndex = b.createdAt.getDay();
    const dayName = dayNames[dayIndex];
    counts[dayName]++;
  });

  return counts;
};

export const AnalyticsService = {
  getUserAnalytics,
  getWorkshopAnalytics,
  getAdminAnalytics,
  getMonthlyReport,
  exportUsersCSV,
  exportWorkshopsCSV,
  exportJobsCSV,
  exportBookingsCSV,
  getWeeklyBookingCount,
};
