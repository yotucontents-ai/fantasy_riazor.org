export type Position = 'POR' | 'LD' | 'DC1' | 'DC2' | 'LI' | 'MCD' | 'MC1' | 'MC2' | 'MCO' | 'DEL1' | 'DEL2';

export type PlayerCategory = 'porteros' | 'defensas' | 'centrocampistas' | 'delanteros';

export interface Player {
  d: number;
  n: string;
  cat: PlayerCategory;
}

export interface Score {
  home: number;
  away: number;
}

export interface Prediction {
  userId: string;
  roundId: string;
  lineup: number[]; // dorsals, 11 items
  mvp: number; // dorsal
  score: Score;
  points: number | null;
  submittedAt: Date;
}

export type RoundStatus = 'open' | 'locked' | 'completed';

export interface Round {
  id: string;
  number: number;
  season: string;
  status: RoundStatus;
  opponent: string;
  homeGame: boolean;
  deadline: Date;
  officialLineup: number[] | null;
  officialMVP: number | null;
  officialScore: Score | null;
}

export type UserRole = 'user' | 'admin';

export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  totalPoints: number;
  createdAt: Date;
}

export interface RankingEntry {
  uid: string;
  displayName: string;
  totalPoints: number;
  roundsPlayed: number;
  mvpHits: number;
  scoreHits: number;
  lastRoundPoints: number | null;
  trend: 'up' | 'dn' | 'eq';
}

export interface LineupState {
  picked: Partial<Record<Position, Player>>;
  mvp: Player | null;
  score: Score;
}
