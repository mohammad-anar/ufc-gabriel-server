export interface IFighter {
  id: string;
  name: string;
  nickname: string;
  nationality: string;
  divisionId: string;
  division?: { id: string; name: string };
  rank: number | null;
  wins: number;
  losses: number;
  draws: number;
  avgL5: number;
  bio: string | null;
  avatarUrl: string | null;
  age: number | null;
  height: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IFighterFilterRequest {
  searchTerm?: string;
  divisionId?: string;
  isActive?: boolean;
  nationality?: string;
  minRank?: number;
  maxRank?: number;
}

export type IPaginationOptions = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
};
