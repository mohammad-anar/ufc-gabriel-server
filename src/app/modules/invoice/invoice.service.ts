import { Prisma } from "@prisma/client";
import { prisma } from "../../../helpers/prisma.js";
import { generateInvoicePDFBuffer, IInvoicePDFData } from "../../shared/utils/pdf.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { paginationHelper } from "../../../helpers/paginationHelper.js";

const generateMonthlyInvoices = async (month?: string) => {
  const now = new Date();
  let startOfMonth: Date;
  let endOfMonth: Date;

  if (month) {
    // Expected format: "YYYY-MM"
    const [yearPart, monthPart] = month.split("-").map(Number);
    if (!yearPart || !monthPart || monthPart < 1 || monthPart > 12) {
      throw new Error("Invalid month format. Please use YYYY-MM.");
    }
    startOfMonth = new Date(yearPart, monthPart - 1, 1);
    endOfMonth = new Date(yearPart, monthPart, 0, 23, 59, 59, 999);
  } else {
    // Default to the previous month
    let previousMonth = now.getMonth() - 1;
    let year = now.getFullYear();

    if (previousMonth < 0) {
      previousMonth = 11;
      year -= 1;
    }

    startOfMonth = new Date(year, previousMonth, 1);
    endOfMonth = new Date(year, previousMonth + 1, 0, 23, 59, 59, 999);
  }

  // Fetch platform data for default platform fee
  const platformData = await prisma.platformData.findFirst();
  if (!platformData) {
    throw new Error("Platform data not found. Please set platform fee first.");
  }

  // Fetch all completed & paid bookings in the specified month
  const completedBookings = await prisma.booking.findMany({
    where: {
      status: "COMPLETED",
      paymentStatus: "PAID",
      scheduleEnd: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    include: {
      offer: true,
      workshop: {
        select: {
          platformFees: true,
        },
      },
    },
  });

  // Group bookings by workshopId
  const workshopInvoiceData: Record<
    string,
    { totalJobs: number; totalJobAmount: number; platformFee: number }
  > = {};

  completedBookings.forEach((booking) => {
    const workshopId = booking.workshopId;
    const price = booking.offer.price || 0;
    const effectiveFee =
      booking.workshop.platformFees ?? platformData.platformFee;
    const fee = price * (effectiveFee / 100);

    if (!workshopInvoiceData[workshopId]) {
      workshopInvoiceData[workshopId] = {
        totalJobs: 0,
        totalJobAmount: 0,
        platformFee: 0,
      };
    }

    workshopInvoiceData[workshopId].totalJobs += 1;
    workshopInvoiceData[workshopId].totalJobAmount += price;
    workshopInvoiceData[workshopId].platformFee += fee;
  });

  // Build title and due date
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const billingMonthName = monthNames[startOfMonth.getMonth()];
  const billingYear = startOfMonth.getFullYear();
  const title = `Invoice for ${billingMonthName} ${billingYear}`;
  const dueDate = new Date(now.getFullYear(), now.getMonth(), 15);

  const invoicesCreated = [];

  for (const workshopId in workshopInvoiceData) {
    const data = workshopInvoiceData[workshopId];
    const workshopRevenue = data.totalJobAmount - data.platformFee;

    const result = await prisma.invoice.upsert({
      where: {
        workshopId_billingMonth: {
          workshopId,
          billingMonth: startOfMonth,
        },
      },
      update: {
        title,
        totalJobs: data.totalJobs,
        totalJobAmount: data.totalJobAmount,
        platformFee: data.platformFee,
        workshopRevenue,
        totalAmount: data.platformFee,
        dueDate,
        status: "SENT",
      },
      create: {
        title,
        workshopId,
        billingMonth: startOfMonth,
        totalJobs: data.totalJobs,
        totalJobAmount: data.totalJobAmount,
        platformFee: data.platformFee,
        workshopRevenue,
        totalAmount: data.platformFee,
        dueDate,
        status: "SENT",
      },
      include: {
        workshop: {
          select: {
            id: true,
            workshopName: true,
            ownerName: true,
            email: true,
            address: true,
          },
        },
      },
    });

    invoicesCreated.push(result);
  }

  return {
    month: `${billingMonthName} ${billingYear}`,
    totalInvoices: invoicesCreated.length,
    invoices: invoicesCreated,
  };
};

const getMonthlyInvoices = async (
  month: string,
  filters: { searchTerm?: string; status?: string },
  options: IPaginationOptions,
) => {
  if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new Error("Invalid month format. Please use YYYY-MM.");
  }

  const { searchTerm, status } = filters;
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const [year, monthPart] = month.split("-").map(Number);
  const startDate = new Date(year, monthPart - 1, 1);
  const endDate = new Date(year, monthPart, 0, 23, 59, 59, 999);

  const where: Prisma.InvoiceWhereInput = {
    billingMonth: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (status) {
    where.status = status as any;
  }

  if (searchTerm) {
    where.OR = [
      { title: { contains: searchTerm, mode: "insensitive" } },
      {
        workshop: {
          workshopName: { contains: searchTerm, mode: "insensitive" },
        },
      },
      {
        workshop: {
          email: { contains: searchTerm, mode: "insensitive" },
        },
      },
    ];
  }

  const invoices = await prisma.invoice.findMany({
    where,
    skip,
    take: limit,
    include: {
      workshop: {
        select: {
          id: true,
          workshopName: true,
          ownerName: true,
          email: true,
          address: true,
          phone: true,
          platformFees: true,
          avgRating: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      [sortBy || "createdAt"]: sortOrder || "desc",
    },
  });

  const total = await prisma.invoice.count({ where });
  const totalPage = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    data: invoices,
  };
};

const downloadMonthlyInvoicesPDF = async (month: string): Promise<Buffer> => {
  if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new Error("Invalid month format. Please use YYYY-MM.");
  }

  const [year, monthPart] = month.split("-").map(Number);
  const startDate = new Date(year, monthPart - 1, 1);
  const endDate = new Date(year, monthPart, 0, 23, 59, 59, 999);

  const invoices = await prisma.invoice.findMany({
    where: {
      billingMonth: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      workshop: {
        select: {
          workshopName: true,
          email: true,
          address: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (invoices.length === 0) {
    throw new Error(`No invoices found for month: ${month}.`);
  }

  const pdfDataList: IInvoicePDFData[] = invoices.map((invoice) => ({
    title: invoice.title,
    invoiceId: invoice.id,
    workshopName: invoice.workshop.workshopName,
    workshopEmail: invoice.workshop.email,
    workshopAddress: invoice.workshop.address ?? undefined,
    billingMonth: invoice.billingMonth.toISOString().split("T")[0],
    totalJobs: invoice.totalJobs,
    totalJobAmount: invoice.totalJobAmount,
    platformFee: invoice.platformFee,
    workshopRevenue: invoice.workshopRevenue,
    totalAmount: invoice.totalAmount,
    dueDate: invoice.dueDate.toISOString().split("T")[0],
  }));

  return generateInvoicePDFBuffer(pdfDataList);
};

const updateInvoiceStatus = async (id: string, status: "PAID" | "SENT" | "CANCELLED") => {
  const result = await prisma.invoice.update({
    where: { id },
    data: { status },
  });
  return result;
};

const getInvoicePDFById = async (id: string): Promise<Buffer> => {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      workshop: {
        select: {
          workshopName: true,
          email: true,
          address: true,
        },
      },
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const pdfData: IInvoicePDFData = {
    title: invoice.title,
    invoiceId: invoice.id,
    workshopName: invoice.workshop.workshopName,
    workshopEmail: invoice.workshop.email,
    workshopAddress: invoice.workshop.address ?? undefined,
    billingMonth: invoice.billingMonth.toISOString().split("T")[0],
    totalJobs: invoice.totalJobs,
    totalJobAmount: invoice.totalJobAmount,
    platformFee: invoice.platformFee,
    workshopRevenue: invoice.workshopRevenue,
    totalAmount: invoice.totalAmount,
    dueDate: invoice.dueDate.toISOString().split("T")[0],
  };

  return generateInvoicePDFBuffer(pdfData);
};

const getWorkshopInvoicePDF = async (workshopId: string, month: string): Promise<Buffer> => {
  if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new Error("Invalid month format. Please use YYYY-MM.");
  }

  const [year, monthPart] = month.split("-").map(Number);
  const startDate = new Date(year, monthPart - 1, 1);
  const endDate = new Date(year, monthPart, 0, 23, 59, 59, 999);

  const invoice = await prisma.invoice.findFirst({
    where: {
      workshopId,
      billingMonth: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      workshop: {
        select: {
          workshopName: true,
          email: true,
          address: true,
        },
      },
    },
  });

  if (!invoice) {
    throw new Error(`No invoice found for workshop ${workshopId} for month ${month}.`);
  }

  const pdfData: IInvoicePDFData = {
    title: invoice.title,
    invoiceId: invoice.id,
    workshopName: invoice.workshop.workshopName,
    workshopEmail: invoice.workshop.email,
    workshopAddress: invoice.workshop.address ?? undefined,
    billingMonth: invoice.billingMonth.toISOString().split("T")[0],
    totalJobs: invoice.totalJobs,
    totalJobAmount: invoice.totalJobAmount,
    platformFee: invoice.platformFee,
    workshopRevenue: invoice.workshopRevenue,
    totalAmount: invoice.totalAmount,
    dueDate: invoice.dueDate.toISOString().split("T")[0],
  };

  return generateInvoicePDFBuffer(pdfData);
};

const recalculateWorkshopInvoice = async (workshopId: string, month?: string) => {
  const now = new Date();
  let startOfMonth: Date;
  let endOfMonth: Date;

  if (month) {
    // Expected format: "YYYY-MM"
    const [yearPart, monthPart] = month.split("-").map(Number);
    if (!yearPart || !monthPart || monthPart < 1 || monthPart > 12) {
      throw new Error("Invalid month format. Please use YYYY-MM.");
    }
    startOfMonth = new Date(yearPart, monthPart - 1, 1);
    endOfMonth = new Date(yearPart, monthPart, 0, 23, 59, 59, 999);
  } else {
    // Default to the current month for "this month" requirement
    startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  // Fetch platform data for default platform fee
  const platformData = await prisma.platformData.findFirst();
  if (!platformData) {
    throw new Error("Platform data not found.");
  }

  // Fetch the workshop to get its platformFees
  const workshop = await prisma.workshop.findUnique({
    where: { id: workshopId },
    select: { platformFees: true },
  });

  if (!workshop) {
    throw new Error("Workshop not found.");
  }

  // Fetch all completed & paid bookings for this workshop in specified month
  const completedBookings = await prisma.booking.findMany({
    where: {
      workshopId,
      status: "COMPLETED",
      paymentStatus: "PAID",
      scheduleEnd: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    include: {
      offer: true,
    },
  });

  // Calculate totals
  let totalJobs = 0;
  let totalJobAmount = 0;
  let platformFeeTotal = 0;

  completedBookings.forEach((booking) => {
    const price = booking.offer.price || 0;
    const effectiveFee = workshop.platformFees ?? platformData.platformFee;
    const fee = price * (effectiveFee / 100);

    totalJobs += 1;
    totalJobAmount += price;
    platformFeeTotal += fee;
  });

  const workshopRevenue = totalJobAmount - platformFeeTotal;

  // Find existing invoice for this month
  const existingInvoice = await prisma.invoice.findUnique({
    where: {
      workshopId_billingMonth: {
        workshopId,
        billingMonth: startOfMonth,
      },
    },
  });

  // If invoice exists, update it. If not, do nothing (wait for next generation).
  if (existingInvoice) {
    await prisma.invoice.update({
      where: { id: existingInvoice.id },
      data: {
        totalJobs,
        totalJobAmount,
        platformFee: platformFeeTotal,
        workshopRevenue,
        totalAmount: platformFeeTotal, // totalAmount matches platformFee in this system
      },
    });
  }
};

export const InvoiceService = {
  generateMonthlyInvoices,
  getMonthlyInvoices,
  downloadMonthlyInvoicesPDF,
  updateInvoiceStatus,
  getInvoicePDFById,
  getWorkshopInvoicePDF,
  recalculateWorkshopInvoice,
};
