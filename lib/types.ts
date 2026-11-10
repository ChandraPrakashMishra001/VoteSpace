// =====================================================
// VOTESPACE — TypeScript Interfaces
// lib/types.ts
// =====================================================

import type { Timestamp } from "firebase/firestore";

export type PollType = "single" | "multiple" | "ranked" | "yesno" | "participant";
export type PollStatus = "active" | "closed";

export interface PollOption {
  id: string;
  text: string;
  imageUrl?: string;
}

export interface Poll {
  id: string;
  code: string;
  title: string;
  description?: string;
  imageUrl?: string;
  creatorName: string;
  creatorToken: string;
  type: PollType;
  options: PollOption[];
  status: PollStatus;
  createdAt: any;
  expiresAt?: any;
  closedAt?: any;
  totalVotes: number;
}

export interface Vote {
  id?: string;
  voterId: string;
  voterName: string;
  isAnonymous: boolean;
  choices: string[];
  rankings?: Record<string, number>;
  castedAt: any;
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
