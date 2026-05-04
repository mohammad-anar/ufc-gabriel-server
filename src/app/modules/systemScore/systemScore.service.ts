import { SystemScoringSetting } from "@prisma/client";
import { prisma } from "../../../helpers/prisma.js";

/**
 * Upsert system-wide scoring settings.
 * Since this is a global configuration, we only manage one record.
 */
const upsertSystemScoring = async (
  payload: Partial<SystemScoringSetting>
): Promise<SystemScoringSetting> => {
  const existing = await prisma.systemScoringSetting.findFirst();

  if (existing) {
    return await prisma.systemScoringSetting.update({
      where: { id: existing.id },
      data: payload,
    });
  } else {
    // If no record exists, create one with the provided payload
    // Prisma will use defaults for missing fields as defined in the schema
    return await prisma.systemScoringSetting.create({
      data: payload as any, // Cast to any to avoid strict type issues with missing required fields if they have defaults
    });
  }
};

/**
 * Get current system-wide scoring settings.
 */
const getSystemScoring = async (): Promise<SystemScoringSetting | null> => {
  const result = await prisma.systemScoringSetting.findFirst();
  return result;
};

export const SystemScoreService = {
  upsertSystemScoring,
  getSystemScoring,
};
