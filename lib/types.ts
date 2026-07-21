// =====================================================
// VOTESPACE — TypeScript Interfaces
// lib/types.ts
// =====================================================

import type { Timestamp } from "firebase/firestore";

export type PollType = "single" | "multiple" | "ranked" | "yesno";
export type PollStatus = "active" | "closed";

export interface PollOption {
  id: string;
  text: string;
}

export interface Poll {
  id: string;
  code: string;
  title: string;
  description?: string;
  creatorName: string;
  creatorToken: string;
  type: PollType;
  options: PollOption[];
  status: PollStatus;
  createdAt: Timestamp | null;
  expiresAt?: Timestamp | null;
  closedAt?: Timestamp | null;
  totalVotes: number;
}

export interface Vote {
  id?: string;
  voterId: string;
  voterName: string;
  isAnonymous: boolean;
  choices: string[];
  rankings?: Record<string, number>;
  castedAt: Timestamp | null;
}

export interface MyPollEntry {
  id: string;
  code: string;
  title: string;
  type: PollType;
  savedAt: number;
  creatorToken: string;
}

export interface ResultItem {
  option: PollOption;
  votes: number;
  score: number;
  percentage: number;
  rank: number;
}
