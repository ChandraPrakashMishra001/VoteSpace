"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPollById, getMyPollsList, deletePoll } from "@/lib/store";
import { normaliseCode, POLL_TYPES, timeAgo, timeLeft, isClosed, statusBadge } from "@/lib/polls";
import type { Poll, MyPollEntry } from "@/lib/types";
import { Zap, BarChart3, Link2, Users, Plus, ArrowRight, Trash2 } from "lucide-react";

// ── Navbar ────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-2xl bg-black/50 border-b border-yellow-400/10">
      {/* IEEE VSSUT Banner */}
      <div className="flex items-center justify-center gap-2 border-b border-yellow-400/10 py-1.5 px-4 bg-yellow-400/[0.06]">
        <span className="text-sm">⚡</span>
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-yellow-300/80">
          IEEE VSSUT Student Branch
        </span>
        <span className="text-sm">⚡</span>
      </div>
      {/* Main nav row */}
      <div className="flex items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400/15 border border-yellow-400/25">
            <span className="text-lg">🗳️</span>
          </div>
          <span className="font-heading text-xl font-black tracking-tight">
            Vote<span className="text-gradient">Space</span>
          </span>
        </Link>
        <Link
          href="/create"
          className="btn-yellow flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm"
        >
          <Plus size={15} strokeWidth={2.5} /> Create Poll
        </Link>
      </div>
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────
function Hero() {
  const router = useRouter();
  const [code, setCode] = useState("");

  const handleJoin = useCallback(() => {
    const c = normaliseCode(code);
    if (c.length < 6) return;
    router.push(`/vote?code=${c}`);
  }, [code, router]);

  return (
    <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pb-16 pt-36 text-center">

      {/* Floating badge */}
      <div
        className="mb-10 inline-flex items-center gap-2.5 rounded-full border border-yellow-400/25 bg-yellow-400/10 px-5 py-2.5 text-sm font-semibold text-yellow-300"
        style={{ animation: "float 3.5s ease-in-out infinite, fade-in 0.6s ease both" }}
      >
        <Zap size={13} className="text-yellow-400" fill="currentColor" />
        Live voting for your crew
      </div>

      {/* Headline */}
      <h1
        className="mb-6 font-heading text-[clamp(3.2rem,10vw,7rem)] font-black leading-[1.02] tracking-tight"
        style={{ animation: "slide-up 0.7s cubic-bezier(.34,1.56,.64,1) 0.1s both" }}
      >
        <span className="text-white block">Your Vote.</span>
        <span className="text-gradient block">Their Answer.</span>
      </h1>

      {/* Subtitle */}
      <p
        className="mb-12 max-w-[480px] text-[1.05rem] leading-relaxed text-white/55"
        style={{ animation: "slide-up 0.7s cubic-bezier(.34,1.56,.64,1) 0.2s both" }}
      >
        Create a poll on any topic, share a 6-char code,
        and find out what your people really think — instantly.
      </p>

      {/* Join card */}
      <div
        className="w-full max-w-[420px] rounded-2xl border border-yellow-400/[0.14] bg-black/55 p-7 shadow-2xl backdrop-blur-2xl"
        style={{ animation: "slide-up 0.7s cubic-bezier(.34,1.56,.64,1) 0.3s both" }}
      >
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
          Enter a poll code to join
        </p>

        <div className="flex gap-2.5">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(normaliseCode(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="ABC123"
            maxLength={6}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-center font-mono-code text-base font-bold uppercase tracking-[0.25em] text-white placeholder:tracking-normal placeholder:text-white/20 transition focus:border-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/15"
          />
          <button
            onClick={handleJoin}
            disabled={code.length < 6}
            className="btn-yellow flex items-center gap-1.5 rounded-xl px-5 py-3.5 text-sm"
          >
            Join <ArrowRight size={14} strokeWidth={2.5} />
          </button>
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/8" />
          <span className="text-xs text-white/25">or</span>
          <div className="h-px flex-1 bg-white/8" />
        </div>

        <Link
          href="/create"
          className="btn-ghost-yellow flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm"
        >
          <Plus size={14} /> Create a new poll
        </Link>
      </div>
    </section>
  );
}

// ── Poll Card ─────────────────────────────────────────────────
function PollCard({ poll, index, onDelete }: { poll: Poll; index: number; onDelete: (pollId: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const closed = isClosed(poll);
  const type   = POLL_TYPES[poll.type];
  const href   = closed ? `/results?code=${poll.code}` : `/vote?code=${poll.code}`;
  const tl     = !closed ? timeLeft(poll.expiresAt) : null;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirming) {
      onDelete(poll.id);
    } else {
      setConfirming(true);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirming(false);
  };

  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-2xl border border-yellow-400/[0.10] bg-black/45 p-5 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-yellow-400/[0.28] hover:bg-black/55 hover:shadow-xl hover:shadow-yellow-400/[0.08]"
      style={{ animationDelay: `${index * 55}ms` }}
    >
      {/* Top row */}
      <div className="mb-3.5 flex items-start justify-between gap-3">
        <p className="font-semibold leading-snug text-white line-clamp-2 pr-1">{poll.title}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
            closed
              ? "bg-white/8 text-white/40"
              : "bg-yellow-400/15 text-yellow-400"
          }`}>
            {closed ? "Closed" : "• Live"}
          </span>

          {confirming ? (
            <div className="flex items-center gap-1 z-20">
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-md bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-red-500 transition"
                title="Confirm delete"
              >
                Delete?
              </button>
              <button
                type="button"
                onClick={handleCancelDelete}
                className="rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-bold text-white/60 hover:bg-white/20 hover:text-white transition"
                title="Cancel"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/15 transition duration-150"
              title="Delete poll"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-white/40">
        <span>{type?.icon} {type?.label}</span>
        <span className="text-white/15">·</span>
        <span>{poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}</span>
        {tl && (
          <>
            <span className="text-white/15">·</span>
            <span className="text-yellow-400/80">⏱ {tl}</span>
          </>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="font-mono-code rounded-lg border border-yellow-400/20 bg-yellow-400/[0.06] px-2.5 py-1 text-[11px] font-bold tracking-widest text-yellow-300">
          {poll.code}
        </span>
        <span className="text-[11px] text-white/25">{timeAgo(poll.createdAt)}</span>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-yellow-400/25 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

// ── My Polls ──────────────────────────────────────────────────
function MyPolls() {
  const [polls, setPolls]     = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const entries: MyPollEntry[] = getMyPollsList();
    if (!entries.length) { setLoading(false); return; }
    Promise.allSettled(entries.map((e) => getPollById(e.id))).then((results) => {
      setPolls(results.flatMap((r) => (r.status === "fulfilled" && r.value ? [r.value] : [])));
      setLoading(false);
    });
  }, []);

  const handleDeletePoll = useCallback(async (pollId: string) => {
    setPolls((prev) => prev.filter((p) => p.id !== pollId));
    await deletePoll(pollId);
  }, []);

  return (
    <section className="relative z-10 border-t border-yellow-400/[0.07] bg-black/50 backdrop-blur-xl px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl font-black text-white">My Polls</h2>
            <p className="mt-0.5 text-sm text-white/40">Your polls and recent activity</p>
          </div>
          <Link
            href="/create"
            className="btn-ghost-yellow flex items-center gap-2 rounded-xl px-4 py-2 text-sm"
          >
            <Plus size={14} /> New Poll
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/[0.03]" />
            ))}
          </div>
        ) : polls.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-yellow-400/15 bg-yellow-400/[0.06] text-4xl">
              🗳️
            </div>
            <p className="text-xl font-bold font-heading text-white/70">No polls yet</p>
            <p className="max-w-xs text-sm text-white/35">
              Create your first poll and invite your crew!
            </p>
            <Link href="/create" className="btn-yellow mt-2 flex items-center gap-2 rounded-xl px-6 py-3 text-sm">
              <Plus size={15} /> Create a Poll
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {polls.map((poll, i) => (
              <PollCard key={poll.id} poll={poll} index={i} onDelete={handleDeletePoll} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────
const FEATURES = [
  { icon: <Zap size={20} fill="currentColor" />,     title: "4 Poll Types",       desc: "Single · Multiple · Ranked · Yes/No" },
  { icon: <Link2 size={20} />,                        title: "Instant Share",      desc: "6-char code or direct link. Zero accounts." },
  { icon: <Users size={20} />,                        title: "Named or Anonymous", desc: "Each voter decides how they appear." },
  { icon: <BarChart3 size={20} />,                    title: "Live Results",       desc: "Real-time charts the moment polls close." },
];

function Features() {
  return (
    <section className="relative z-10 border-t border-yellow-400/[0.07] bg-black/65 backdrop-blur-xl px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-10 text-center font-heading text-2xl font-black text-white/80">
          Why <span className="text-gradient">VoteSpace?</span>
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group flex flex-col gap-4 rounded-2xl border border-yellow-400/[0.09] bg-black/40 p-6 text-center transition hover:border-yellow-400/[0.22] hover:bg-yellow-400/[0.03]"
            >
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400 transition group-hover:bg-yellow-400/20">
                {f.icon}
              </div>
              <div>
                <p className="font-heading font-bold text-white/90 text-sm leading-tight">{f.title}</p>
                <p className="mt-1.5 text-[12px] text-white/38 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      {/* Bottom fade */}
      <div className="fixed inset-0 z-[1] bg-gradient-to-b from-transparent via-transparent to-[#05050f]/85 pointer-events-none" />

      <Navbar />
      <Hero />
      <MyPolls />
      <Features />

      <footer className="relative z-10 border-t border-yellow-400/[0.07] bg-black/70 py-8 text-center text-sm text-white/25">
        <p>
          Made with ⚡ · VoteSpace ·{" "}
          <Link href="/create" className="text-yellow-400/70 underline-offset-4 hover:text-yellow-400 hover:underline transition">
            Start a poll
          </Link>
        </p>
        <p className="mt-2 text-[12px] text-white/20">
          Made by{" "}
          <span className="text-yellow-400/50 font-semibold">Chandra Prakash Mishra</span>
          {" "}· IEEE VSSUT Student Branch
        </p>
      </footer>
    </div>
  );
}
