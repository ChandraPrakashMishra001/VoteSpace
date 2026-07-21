// =====================================================
// VOTESPACE — Firebase Firestore Data Layer
// lib/store.ts
// =====================================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  limit,
  orderBy,
  onSnapshot,
  increment,
  serverTimestamp,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Poll, Vote, MyPollEntry } from "./types";

// ============================================================
// POLLS
// ============================================================

export async function createPoll(data: Omit<Poll, "id" | "createdAt" | "totalVotes" | "status">): Promise<Poll> {
  const ref = await addDoc(collection(db, "polls"), {
    ...data,
    status: "active",
    totalVotes: 0,
    createdAt: serverTimestamp(),
  });
  return { ...data, id: ref.id, status: "active", totalVotes: 0, createdAt: null };
}

export async function getPollById(pollId: string): Promise<Poll | null> {
  const snap = await getDoc(doc(db, "polls", pollId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Poll;
}

export async function getPollByCode(code: string): Promise<Poll | null> {
  const q = query(collection(db, "polls"), where("code", "==", code.toUpperCase().trim()), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Poll;
}

export async function closePoll(pollId: string): Promise<void> {
  await updateDoc(doc(db, "polls", pollId), {
    status: "closed",
    closedAt: serverTimestamp(),
  });
}

export function onPollUpdate(pollId: string, callback: (poll: Poll) => void): Unsubscribe {
  return onSnapshot(doc(db, "polls", pollId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() } as Poll);
  });
}

// ============================================================
// VOTES
// ============================================================

export async function castVote(pollId: string, voteData: Omit<Vote, "id" | "castedAt">): Promise<string> {
  const batch = writeBatch(db);
  const voteRef = doc(collection(db, "polls", pollId, "votes"));
  const pollRef = doc(db, "polls", pollId);

  batch.set(voteRef, { ...voteData, castedAt: serverTimestamp() });
  batch.update(pollRef, { totalVotes: increment(1) });

  await batch.commit();
  return voteRef.id;
}

export async function getVotes(pollId: string): Promise<Vote[]> {
  const q = query(
    collection(db, "polls", pollId, "votes"),
    orderBy("castedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Vote));
}

export function onVotesUpdate(pollId: string, callback: (votes: Vote[]) => void): Unsubscribe {
  return onSnapshot(collection(db, "polls", pollId, "votes"), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Vote)));
  });
}

// ============================================================
// MY POLLS (localStorage)
// ============================================================

const LS_MY_POLLS = "vs_mypolls";
const LS_VOTED    = "vs_voted";
const LS_VOTER_ID = "vs_voter_id";

export function saveMyPoll(poll: Pick<Poll, "id" | "code" | "title" | "type">, creatorToken: string): void {
  const list = getMyPollsList();
  const deduped = list.filter((p) => p.id !== poll.id);
  deduped.unshift({ ...poll, savedAt: Date.now(), creatorToken });
  localStorage.setItem(LS_MY_POLLS, JSON.stringify(deduped.slice(0, 50)));
}

export function getMyPollsList(): MyPollEntry[] {
  try { return JSON.parse(localStorage.getItem(LS_MY_POLLS) ?? "[]"); }
  catch { return []; }
}

export function getCreatorToken(pollId: string): string | null {
  return getMyPollsList().find((p) => p.id === pollId)?.creatorToken ?? null;
}

export function markVoted(pollId: string): void {
  const v = getVotedMap();
  v[pollId] = Date.now();
  localStorage.setItem(LS_VOTED, JSON.stringify(v));
}

export function hasVoted(pollId: string): boolean {
  return !!getVotedMap()[pollId];
}

function getVotedMap(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(LS_VOTED) ?? "{}"); }
  catch { return {}; }
}

export function getVoterId(): string {
  let id = localStorage.getItem(LS_VOTER_ID);
  if (!id) {
    id = "v_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(LS_VOTER_ID, id);
  }
  return id;
}
