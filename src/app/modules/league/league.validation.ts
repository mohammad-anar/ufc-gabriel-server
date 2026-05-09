import { z } from "zod";

const scoringSettingsSchema = z.object({
  winPoints: z.number().int().optional(),
  finishBonus: z.number().int().optional(),
  winningChampionshipBout: z.number().int().optional(),
  championVsChampionWin: z.number().int().optional(),
  winningAgainstRankedOpponent: z.number().int().optional(),
  winningFiveRoundFight: z.number().int().optional(),
});

const createLeagueZodSchema = z.object({

  name: z.string({ message: "League name is required" }),
  leagueType: z.enum(["PUBLIC", "PRIVATE"]),
  passcode: z.string().optional(),
  memberLimit: z.number().int().min(2).max(20).optional(),
  rosterSize: z.number().int().min(1).max(10).optional(),
  draftTime: z.string({ message: "Draft time is required" }),
  secondsPerPick: z.number().int().min(30).max(300).optional(),
  scoringSettings: scoringSettingsSchema.optional(),

});

const updateLeagueZodSchema = z.object({

  name: z.string().optional(),
  draftTime: z.string().optional(),
  secondsPerPick: z.number().int().min(30).max(300).optional(),

});

const joinLeagueZodSchema = z.object({

  code: z.string({ message: "League code is required" }),
  passcode: z.string().optional(),
  teamName: z.string({ message: "Team name is required" }),

});

const addFighterZodSchema = z.object({
  fighterId: z.string({ message: "Fighter ID is required" }),
});

const removeFighterZodSchema = z.object({
  fighterId: z.string({ message: "Fighter ID is required" }),
});

const updatePreDraftZodSchema = z.object({
  orderedFighterIds: z.array(z.string()),
});

const toggleAutoPickZodSchema = z.object({
  enabled: z.boolean({ message: "Enabled status (true/false) is required" }),
});

export const LeagueValidation = {
  createLeagueZodSchema,
  updateLeagueZodSchema,
  joinLeagueZodSchema,
  addFighterZodSchema,
  removeFighterZodSchema,
  updatePreDraftZodSchema,
  toggleAutoPickZodSchema,
};

