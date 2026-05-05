export interface ILeagueFilterRequest {
  searchTerm?: string;
  status?: string;
  leagueType?: "PUBLIC" | "PRIVATE";
  managerId?: string;
  isSystemGenerated?: boolean | string;
  code?: string;
  fighterSearchTerm?: string;
  divisionId?: string;
}


export interface ICreateLeaguePayload {
  name: string;
  leagueType: "PUBLIC" | "PRIVATE";
  passcode?: string;
  memberLimit?: number;
  rosterSize?: number;
  draftTime: string;
  secondsPerPick?: number;
  scoringSettings?: {
    winPoints?: number;
    finishBonus?: number;
    winningChampionshipBout?: number;
    championVsChampionWin?: number;
    winningAgainstRankedOpponent?: number;
    winningFiveRoundFight?: number;
  };
}

export interface IJoinLeaguePayload {
  code: string;
  passcode?: string;
  teamName: string;
}

export interface IAddFighterPayload {
  fighterId: string;
}

