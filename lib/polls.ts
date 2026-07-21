// =====================================================
// VOTESPACE — Poll Utilities
// lib/polls.ts
// =====================================================

import type { PollOption, PollType, Poll } from "./types";
import type { Timestamp } from "firebase/firestore";

export const POLL_TYPES: Record<PollType, { label: string; icon: string; desc: string }> = {
  single:   { label: "Single Choice",   icon: "⚡", desc: "Pick exactly one option" },
  multiple: { label: "Multiple Choice", icon: "☑️",  desc: "Select all that apply" },
  ranked:   { label: "Ranked Order",    icon: "🏆", desc: "Drag to rank by preference" },
  yesno:    { label: "Yes / No",        icon: "👍", desc: "Classic binary decision" },
};

export function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function generateCreatorToken(): string {
  return "ct_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
}

export function validatePoll(data: { title: string; type: PollType; options: string[] }): string[] {
  const errors: string[] = [];
  if (!data.title.trim())          errors.push("Poll title is required.");
  if (data.title.trim().length > 200) errors.push("Title must be 200 chars or fewer.");
  if (data.type !== "yesno") {
    const filled = data.options.filter((o) => o.trim());
    if (filled.length < 2)  errors.push("Add at least 2 options.");
    if (filled.length > 10) errors.push("Maximum 10 options allowed.");
  }
  return errors;
}

export function buildOptions(type: PollType, rawOptions: string[]): PollOption[] {
  if (type === "yesno") {
    return [
      { id: "yes", text: "👍  Yes" },
      { id: "no",  text: "👎  No"  },
    ];
  }
  return rawOptions
    .filter((o) => o.trim())
    .map((text) => ({ id: generateId(), text: text.trim() }));
}

export function isExpired(poll: Poll): boolean {
  if (!poll.expiresAt) return false;
  const ts = poll.expiresAt as Timestamp;
  const exp = ts.toDate ? ts.toDate() : new Date(ts as unknown as number);
  return Date.now() > exp.getTime();
}

export function isClosed(poll: Poll): boolean {
  return poll.status === "closed" || isExpired(poll);
}

export function statusBadge(poll: Poll): { text: string; className: string } {
  if (isClosed(poll)) return { text: "Closed", className: "bg-red-500/20 text-red-400 border-red-500/30" };
  return { text: "Active", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
}

export function typeBadge(type: PollType): string {
  const t = POLL_TYPES[type];
  return t ? `${t.icon} ${t.label}` : type;
}

export function expiryTimestamp(hours: number): Date | null {
  if (!hours || hours <= 0) return null;
  return new Date(Date.now() + hours * 3600 * 1000);
}

export function timeLeft(expiresAt: Timestamp | Date | null | undefined): string | null {
  if (!expiresAt) return null;
  const end  = (expiresAt as Timestamp).toDate ? (expiresAt as Timestamp).toDate() : new Date(expiresAt as unknown as number);
  const diff = (end.getTime() - Date.now()) / 1000;
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = Math.floor(diff % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function timeAgo(ts: Timestamp | Date | null | undefined): string {
  if (!ts) return "";
  const d    = (ts as Timestamp).toDate ? (ts as Timestamp).toDate() : new Date(ts as unknown as number);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function normaliseCode(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 6);
}
