import { Prisma } from "@prisma/client";
import { JobStatus, Urgency } from "../../../types/enum.js";
import { prisma } from "../../../helpers/prisma.js";
import { createAndEmitNotification } from "../../../helpers/socketHelper.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { paginationHelper } from "../../../helpers/paginationHelper.js";
import unlinkFile, { extractPathFromUrl } from "../../shared/unlinkFile.js";

// const createJob = async (userId: string, payload: any) => {
//   const { categories, ...jobData } = payload;

//   // 1️⃣ Create Job
//   const job = await prisma.job.create({
//     data: {
//       ...jobData,
//       userId,
//       status: JobStatus.OPEN,
//     },
//   });

//   // 2️⃣ Create Job Categories
//   if (categories && categories.length > 0) {
//     await prisma.jobCategory.createMany({
//       data: categories?.map((cat: any) => ({
//         jobId: job.id,
//         categoryId: cat.categoryId,
//         description: cat.description,
//       })),
//     });
//   }

//   // 3️⃣ Find Nearby Workshops (PostGIS)
//   const nearbyWorkshops = await prisma.$queryRaw<{ id: string }[]>`
//     SELECT id FROM "Workshop"
//     WHERE "approvalStatus" = 'APPROVED'
//     AND ST_DWithin(
//       ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
//       ST_SetSRID(ST_MakePoint(${job.longitude}, ${job.latitude}), 4326)::geography,
//       ${job.radius * 1000}
//     )
//   `;

//   const workshopIds = nearbyWorkshops.map((w) => w.id);

//   // 4️⃣ Send Notifications via Socket
//   if (workshopIds.length > 0) {
//     await createAndEmitNotification({
//       workshopIds,
//       jobId: job.id,
//       title: "New Job Nearby",
//       body: "A new bike service job is available in your area.",
//       eventType: "NEW_JOB_POSTED",
//     });
//   }

//   return job;
// };

const createJob = async (userId: string, payload: any) => {
  const { categories, ...jobData } = payload;
  let workshopIds: string[] = [];

  const job = await prisma.$transaction(async (tx) => {
    // 1️⃣ Create Job
    const job = await tx.job.create({
      data: {
        ...jobData,
        userId,
        status: JobStatus.OPEN,
      },
    });

    const admin = await tx.user.findFirst({
      where: { role: "ADMIN" },
    });

    await createAndEmitNotification({
      receiverUserId: admin?.id,
      triggeredById: job.userId,
      title: "New Job Posted",
      jobId: job.id,
      body: `A new job has been posted: ${job.title}`,
      eventType: "JOB_POSTED",
    });

    // 2️⃣ Create Job Categories
    if (categories && categories.length > 0) {
      await tx.jobCategory.createMany({
        data: categories.map((cat: any) => ({
          jobId: job.id,
          categoryId: cat.categoryId,
          description: cat.description,
        })),
      });
    }

    // 3️⃣ Find Nearby Workshops (PostGIS)
    const nearbyWorkshops = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Workshop"
      WHERE "approvalStatus" = 'APPROVED'
      AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${job.longitude}, ${job.latitude}), 4326)::geography,
        ${job.radius * 1000}
      )
    `;

    workshopIds = nearbyWorkshops.map((w) => w.id);

    return job;
  });

  // 4️⃣ Send Notifications via Socket (Moved outside transaction)
  if (workshopIds.length > 0) {
    Promise.all(
      workshopIds.map((workshopId: string) =>
        createAndEmitNotification({
          receiverWorkshopId: workshopId,
          jobId: job.id,
          title: "New Job Nearby",
          body: "A new bike service job is available in your area.",
          eventType: "NEW_JOB_POSTED",
        }),
      ),
    ).catch((error) => {
      console.error("Failed to send notifications:", error);
    });
  }

  return job;
};

const getAllJobs = async (
  filter: {
    searchTerm?: string | undefined;
    urgency?: Urgency;
    status?: JobStatus;
  },
  options: IPaginationOptions,
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filter;

  const andConditions: Prisma.JobWhereInput[] = [];
  if (filter.searchTerm) {
    andConditions.push({
      OR: ["title", "description"].map((field) => ({
        [field]: {
          contains: filter.searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  const whereConditions: Prisma.JobWhereInput = { AND: andConditions };

  const result = await prisma.job.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },
    select: {
      id: true,
      title: true,
      description: true,
      address: true,
      bikeName: true,
      bikeType: true,
      bikeBrand: true,
      bikeId: true,
      bike: true,
      city: true,
      categories: {
        select: {
          description: true,
          category: true,
        },
      },
      latitude: true,
      bookings: true,
      createdAt: true,
      longitude: true,
      offers: true,
      photos: true,
      postalCode: true,
      radius: true,
      status: true,
      urgency: true,
      preferredTime: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
        },
      },
    },
  });

  const total = await prisma.job.count({
    where: whereConditions,
  });

  const totalPage = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    data: result,
  };
};

const getJobById = async (id: string) => {
  const result = await prisma.job.findUniqueOrThrow({
    where: { id },
    include: {
      user: true,
      categories: true,
      offers: true,
      bookings: true,
      bike: true,
    },
  });
  return result;
};
// get jobs by user id
const getJobsByUserId = async (userId: string) => {
  const result = await prisma.job.findMany({
    where: { userId },
    include: {
      user: true,
      categories: true,
      offers: true,
      bookings: true,
      bike: true,
    },
  });
  return result;
};
const getOffersByJobId = async (
  jobId: string,
  userId: string,
  options: IPaginationOptions,
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);

  const result = await prisma.jobOffer.findMany({
    where: { jobId, job: { userId: userId } },
    include: { workshop: true },
  });

  const total = result.length;
  if (total === 0) {
    return {
      meta: {
        page,
        limit,
        total,
        totalPage: 0,
      },
      data: [],
    };
  }

  // Calculate best value in memory across all offers for this job
  const now = new Date();
  let bestOfferId: string | null = null;
  let minScore = Infinity;

  // this estimated time will be string now, write logic so calculate from "1 hours" or "2 days" or "30 minutes" or "1 week" or "1 month" etc
  const timeInHours = (timeString: string) => {
    const [value, unit] = timeString.split(" ");
    const numValue = parseInt(value);
    if (unit === "hours") return numValue;
    if (unit === "days") return numValue * 24;
    if (unit === "minutes") return numValue / 60;
    if (unit === "weeks") return numValue * 24 * 7;
    if (unit === "month") return numValue * 24 * 30;
    return 0;
  };
  const scoredOffers = result.map((offer: any) => {
    const hoursToComplete = timeInHours(offer.estimatedTime);
    const dist = offer.distance || 0;

    // Score: price is primary, distance and time are tie-breakers/adjusters
    const score = offer.price * 0.5 + dist * 10 * 0.3 + hoursToComplete * 0.2;

    if (score < minScore) {
      minScore = score;
      bestOfferId = offer.id;
    }
    return { ...offer, score };
  });

  const finalResult = scoredOffers
    .map((offer) => ({
      ...offer,
      isBestValue: offer.id === bestOfferId,
    }))
    .slice(skip, skip + limit);

  const totalPage = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    data: finalResult,
  };
};
const updateJobById = async (
  id: string,
  userId: string,
  payload: Prisma.JobUpdateInput,
) => {
  const result = await prisma.job.update({
    where: { id, userId },
    data: payload,
  });
  return result;
};
const deleteJob = async (id: string, userId: string) => {
  // 1. Fetch the job to get the photos
  const job = await prisma.job.findUnique({
    where: { id, userId },
    select: { photos: true },
  });

  if (job && job.photos && job.photos.length > 0) {
    // 2. Unlink each photo
    job.photos.forEach((photoUrl: string) => {
      try {
        const path = extractPathFromUrl(photoUrl);
        unlinkFile(path);
      } catch (error) {
        console.error(`Failed to unlink file: ${photoUrl}`, error);
      }
    });
  }

  // 3. Delete the job from database
  const result = await prisma.job.delete({ where: { id, userId } });
  return result;
};

export const JobService = {
  createJob,
  getAllJobs,
  getJobById,
  getOffersByJobId,
  updateJobById,
  deleteJob,
  getJobsByUserId,
};
