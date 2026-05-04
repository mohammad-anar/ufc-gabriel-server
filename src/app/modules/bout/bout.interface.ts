export interface ICreateBoutPayload {
  eventId: string;
  weightClass: string;
  rounds?: number;
  isMainEvent?: boolean;
  isCoMainEvent?: boolean;
  isTitleFight?: boolean;
  isChampionVsChampion?: boolean;
  order?: number;
  fighters: { fighterId: string; corner: number }[];
}

export interface IPostBoutResultPayload {
  winnerId: string;
  result: string;
  isFinish?: boolean;
  isTitleFight?: boolean;
  isChampionVsChampion?: boolean;
  isWinnerAgainstRanked?: boolean;
  isFiveRoundFight?: boolean;
}
