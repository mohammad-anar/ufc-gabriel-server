export interface IEventFilterRequest {
  searchTerm?: string;
  status?: string;
}

export interface ICreateEventPayload {
  name: string;
  location: string;
  date: string;
  posterUrl?: string;
  bouts: {
    weightClass: string;
    rounds: number;
    isMainEvent?: boolean;
    isCoMainEvent?: boolean;
    fighters: { fighterId: string }[];
  }[];
}

export interface ICreateBoutPayload {
  eventId: string;
  weightClass: string;
  rounds?: number;
  isMainEvent?: boolean;
  isCoMainEvent?: boolean;
  fighters: { fighterId: string }[];
}

export interface IPostBoutResultPayload {
  winnerId: string;
  winPoint: boolean;
  finishBonus: boolean;
  winningChampionshipBout: boolean;
  championVsChampionWin: boolean;
  winningAgainstRankedOpponent: boolean;
  winningFiveRoundFight: boolean;
}
