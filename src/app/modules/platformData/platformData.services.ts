
import { prisma } from "../../../helpers/prisma.js";
import { IPlatformDataUpdatePayload } from "./platformData.interface.js";

const createPlatformData = async (payload: { platformFee: number; maximumJobRadius: number }) => {
  const existing = await prisma.platformData.findFirst();
  if (existing) {
    throw new Error("Platform data already exists");
  }

  const result = await prisma.platformData.create({
    data: payload,
  });

  return result;
};

const getPlatformData = async () => {
  const platformData = await prisma.platformData.findFirst();
  return platformData;
};

const updatePlatformData = async (payload: IPlatformDataUpdatePayload) => {
  const existing = await getPlatformData();
  if (!existing) {
    throw new Error("Platform data not found");
  }

  const result = await prisma.platformData.update({
    where: { id: existing.id },
    data: payload,
  });

  return result;
};

export const PlatformDataService = {
  createPlatformData,
  getPlatformData,
  updatePlatformData,
};
