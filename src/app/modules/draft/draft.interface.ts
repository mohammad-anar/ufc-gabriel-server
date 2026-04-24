export interface IDraftFilterRequest {
  searchTerm?: string;
  divisionId?: string;
}

export interface IPickFighterPayload {
  fighterId: string;
}

export interface ISetQueuePayload {
  orderedFighterIds: string[];
}
