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
    isTitleFight?: boolean;
    order: number;
    fighters: { fighterId: string; corner: number }[];
  }[];
}
