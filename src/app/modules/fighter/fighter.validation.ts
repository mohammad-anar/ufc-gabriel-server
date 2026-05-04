import { z } from "zod";

const createFighterZodSchema = z.object({
    name: z.string({ message: "Name is required" }),
    nationality: z.string({ message: "Nationality is required" }),
    divisionId: z.string({ message: "Division ID is required" }),
    nickname: z.string().optional(),
    rank: z.number().int().optional(),
    wins: z.number().int().optional(),
    losses: z.number().int().optional(),
    draws: z.number().int().optional(),
    avgL5: z.number().int().optional(),
    bio: z.string().optional(),
    avatarUrl: z.string().url().optional(),
    age: z.number().int().optional(),
    height: z.string().optional(),
    isActive: z.boolean().optional(),
});

const updateFighterZodSchema = z.object({
    name: z.string().optional(),
    nationality: z.string().optional(),
    divisionId: z.string().optional(),
    nickname: z.string().optional(),
    rank: z.number().int().nullable().optional(),
    wins: z.number().int().optional(),
    losses: z.number().int().optional(),
    draws: z.number().int().optional(),
    avgL5: z.number().int().optional(),
    bio: z.string().nullable().optional(),
    avatarUrl: z.string().url().nullable().optional(),
    age: z.number().int().nullable().optional(),
    height: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
});

export const FighterValidation = {
    createFighterZodSchema,
    updateFighterZodSchema,
};
