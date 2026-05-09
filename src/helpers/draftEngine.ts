import { prisma } from "./prisma.js";
import { DraftService } from "../app/modules/draft/draft.service.js";
import { getIO } from "./socketHelper.js";

// Keep track of running interval
let draftEngineInterval: NodeJS.Timeout | null = null;

export const startDraftEngine = () => {
  if (draftEngineInterval) return;

  console.log("⚙️ Starting Draft Engine Heartbeat...");

  draftEngineInterval = setInterval(async () => {
    try {
      // Find all draft sessions currently in DRAFTING state
      const activeDrafts = await prisma.draftSession.findMany({
        where: { status: "DRAFTING" },
        include: {
          draftOrder: {
            orderBy: { overallPick: "asc" },
            include: { team: true },
          },
        },
      });

      for (const session of activeDrafts) {
        if (!session.turnStartedAt) continue;

        const currentOrderSlot = session.draftOrder[session.currentPickIndex];
        if (!currentOrderSlot) continue;

        const now = new Date().getTime();
        const turnStart = session.turnStartedAt.getTime();
        const elapsedSeconds = Math.floor((now - turnStart) / 1000);

        // Check if user has Auto-pick enabled
        const member = await prisma.leagueMember.findUnique({
          where: {
            leagueId_userId: {
              leagueId: session.leagueId,
              userId: currentOrderSlot.team.ownerId,
            },
          },
        });

        const isAutoPick = member?.isAutoPickEnabled;

        // If Auto-pick is ON, pick after 1 second. Otherwise, wait for secondsPerPick.
        const shouldAutoPick = isAutoPick
          ? elapsedSeconds >= 1
          : elapsedSeconds >= session.secondsPerPick;

        if (shouldAutoPick && session.status === "DRAFTING") {
          console.log(
            `⏱️ ${isAutoPick ? "Auto Pick (Toggle ON)" : "Draft Timer Expired"} for League ${
              session.leagueId
            }. Picking...`
          );
          try {
            await DraftService.autoPick(session.leagueId, currentOrderSlot.teamId);
          } catch (error) {
            console.error(`Failed to auto-pick for league ${session.leagueId}:`, error);
          }
        }

      }

    } catch (error) {
      console.error("Draft Engine Heartbeat Error:", error);
    }
  }, 1000); // Check every second
};

export const stopDraftEngine = () => {
  if (draftEngineInterval) {
    clearInterval(draftEngineInterval);
    draftEngineInterval = null;
    console.log("🛑 Draft Engine Heartbeat stopped.");
  }
};
