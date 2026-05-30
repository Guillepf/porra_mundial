import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  role: 'user' | 'admin';
  totalPoints: number;
  exactPredictions: number;
  totalPredictions: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MatchTeam {
  name: string;
  code: string;
  flag: string;
}

export interface MatchResult {
  homeGoals: number;
  awayGoals: number;
}

export interface Match {
  id: string;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  scheduledAt: Timestamp;
  status: 'upcoming' | 'live' | 'finished' | 'postponed';
  stage: 'group' | 'round_of_16' | 'quarter' | 'semi' | 'final';
  group: string | null; // "A", "B", etc. o null para eliminatorias
  result: MatchResult | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Prediction {
  id: string; // formato: "{userId}_{matchId}"
  userId: string;
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  points: number | null;
  isLocked: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RankingEntry {
  userId: string;
  displayName: string;
  photoURL: string | null;
  totalPoints: number;
  exactPredictions: number;
  totalPredictions: number;
  position: number;
}

export interface Ranking {
  id: string; // generalmente "current"
  entries: RankingEntry[];
  updatedAt: Timestamp;
}
