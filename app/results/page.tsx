"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getPollByCode, getVotes, onVotesUpdate, closePoll, deletePoll, hasVoted, getCreatorToken } from "@/lib/store";
import { isClosed, timeAgo, timeLeft, POLL_TYPES, statusBadge } from "@/lib/polls";
import { calculateResults, findWinner } from "@/lib/results";
import type { Poll, Vote, ResultItem } from "@/lib/types";
import Navbar from "@/components/Navbar";
import { Share2, Lock, Plus, Trophy, Clock, Zap, Trash2 } from "lucide-react";
import type { Unsubscribe } from "firebase/firestore";

// ─── Loading ──────────────────────────────────────────────────
function LoadingView() {
  return (
    <div className="flex flex-col items-center gap-5 py-32">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-yellow-400/20 border-t-yellow-400" />
      <p className="text-sm text-white/35">Loading results…</p>
    </div>
  );
}

// ─── Error ────────────────────────────────────────────────────
function ErrorView({ msg }: { msg: string }) {
  return (
    <div className="flex flex-col items-center gap-5 py-32 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-yellow-400/15 bg-yellow-400/[0.05] text-4xl">😕</div>
      <p className="font-heading text-2xl font-black text-white">Poll not found</p>
      <p className="max-w-xs text-sm text-white/40">{msg}</p>
      <Link href="/" className="btn-yellow flex items-center gap-2 rounded-xl px-6 py-3 text-sm mt-2">Go Home</Link>
    </div>
  );
}

// ─── Waiting ──────────────────────────────────────────────────
function WaitingView({ poll, isCreator, onClose }: { poll: Poll; isCreator: boolean; onClose: () => void }) {
  const [tl, setTl] = useState<string | null>(null);
  useEffect(() => {
    if (!poll.expiresAt) return;
    const id = setInterval(() => setTl(timeLeft(poll.expiresAt!)), 1000);
    setTl(timeLeft(poll.expiresAt));
    return () => clearInterval(id);
  }, [poll.expiresAt]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-yellow-400/25 bg-yellow-400/[0.07] text-yellow-400">
        <Clock size={36} className="animate-pulse" />
      </div>
      <h2 className="font-heading text-3xl font-black text-white">Waiting for results…</h2>
      <p className="max-w-xs text-sm text-white/45 leading-relaxed">
        Your vote is in! Results appear here the moment the creator closes the poll.
      </p>

      {tl && (
        <div className="flex items-center gap-2.5 rounded-xl border border-yellow-400/20 bg-yellow-400/[0.07] px-5 py-3">
          <span className="live-dot h-2 w-2 rounded-full bg-yellow-400" />
          <span className="text-sm font-bold text-yellow-300">{tl} remaining</span>
        </div>
      )}

      <span className="font-mono-code rounded-xl border border-yellow-400/20 bg-yellow-400/[0.06] px-5 py-2 text-sm font-black tracking-[0.25em] text-yellow-300">
        {poll.code}
      </span>

      <div className="flex gap-3 flex-wrap justify-center">
        <Link href={`/vote?code=${poll.code}`} className="btn-ghost-yellow flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm">← View Poll</Link>
        <Link href="/" className="btn-ghost-yellow flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm">🏠 Dashboard</Link>
      </div>

      {isCreator && (
        <button
          onClick={onClose}
          className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500/20"
        >
          <Lock size={14} /> Close Poll &amp; Reveal Results
        </button>
      )}
    </div>
  );
}

// ─── Not Voted Yet ────────────────────────────────────────────
function NotVotedView({ poll, isCreator, onClose }: { poll: Poll; isCreator: boolean; onClose: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/[0.06] text-4xl">🗳️</div>
      <h2 className="font-heading text-3xl font-black text-white">Poll still open</h2>
      <p className="text-sm text-white/45">Results are hidden until the poll closes. Cast your vote first!</p>
      <Link href={`/vote?code=${poll.code}`} className="btn-yellow flex items-center gap-2 rounded-xl px-7 py-3.5 font-bold">
        <Zap size={15} fill="currentColor" /> Vote Now
      </Link>
      {isCreator && (
        <button onClick={onClose} className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.08] px-5 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/15 transition">
          <Lock size={13} /> Close Poll &amp; Reveal Results
        </button>
      )}
    </div>
  );
}

// ─── Result Bar ───────────────────────────────────────────────
function ResultBar({ item, isWinner, isFirst, type }: { item: ResultItem; isWinner: boolean; isFirst: boolean; type: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setWidth(item.percentage), 120); return () => clearTimeout(t); }, [item.percentage]);

  const scoreLabel = type === "ranked"
    ? `${item.score} pts · ${item.percentage}%`
    : `${item.votes} vote${item.votes !== 1 ? "s" : ""} · ${item.percentage}%`;

  return (
    <div className={cn(
      "rounded-2xl border p-5 transition-all",
      isFirst && isWinner
        ? "border-yellow-400/35 bg-yellow-400/[0.06] shadow-[0_0_40px_rgba(250,204,21,0.12)]"
        : "border-white/[0.07] bg-white/[0.02]"
    )}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {isFirst && isWinner && <span className="crown-anim shrink-0 text-lg">👑</span>}
          {item.option.imageUrl && (
            <img
              src={item.option.imageUrl}
              alt={item.option.text}
              className="h-9 w-9 shrink-0 rounded-lg object-cover border border-white/10"
            />
          )}
          <span className={cn("font-semibold truncate text-sm", isFirst && isWinner ? "text-white" : "text-white/80")}>{item.option.text}</span>
          {isFirst && isWinner && (
            <span className="shrink-0 rounded-lg border border-yellow-400/35 bg-yellow-400/12 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-yellow-400">
              Winner
            </span>
          )}
        </div>
        <span className="shrink-0 text-xs font-bold text-white/45">{scoreLabel}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.05]">
        <div className="result-bar-fill h-full rounded-full" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

// ─── Close Confirm Modal ──────────────────────────────────────
function ConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
      <div className="relative mx-auto max-w-sm w-full rounded-2xl border border-white/10 bg-[#0d0d1f] p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-yellow-400/70">Irreversible action</p>
        <h3 className="font-heading text-xl font-black text-white mb-2">Close this poll?</h3>
        <p className="text-sm text-white/45 mb-7 leading-relaxed">Voting will end immediately and results will be revealed to all voters. This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onCancel}  className="btn-ghost-yellow flex-1 rounded-xl py-2.5 text-sm">Cancel</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-yellow-400 py-2.5 text-sm font-bold text-black hover:bg-yellow-300 transition">Close Poll</button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────
function DeleteConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
      <div className="relative mx-auto max-w-sm w-full rounded-2xl border border-red-500/20 bg-[#0d0d1f] p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-red-400">Irreversible action</p>
        <h3 className="font-heading text-xl font-black text-white mb-2">Delete this poll?</h3>
        <p className="text-sm text-white/45 mb-7 leading-relaxed">This poll and all recorded votes will be deleted permanently. This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost-yellow flex-1 rounded-xl py-2.5 text-sm">Cancel</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-500 transition">Delete Poll</button>
        </div>
      </div>
    </div>
  );
}

// ─── Results View ─────────────────────────────────────────────
function ResultsView({ poll, votes, isCreator, onClose, onDelete }: { poll: Poll; votes: Vote[]; isCreator: boolean; onClose: () => void; onDelete: () => void }) {
  const results = calculateResults(votes, poll.options, poll.type);
  const winner  = findWinner(results);
  const closed  = isClosed(poll);
  const typeInfo = POLL_TYPES[poll.type];

  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const copyShare = () => {
    navigator.clipboard.writeText(shareUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2200); });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-yellow-400/[0.12] bg-black/55 p-8 backdrop-blur-2xl shadow-2xl shadow-black/60">

        {/* Header */}
        <div className="mb-8 border-b border-white/[0.06] pb-8">
          {poll.imageUrl && (
            <div className="relative mb-5 overflow-hidden rounded-2xl border border-yellow-400/20 max-h-56">
              <img src={poll.imageUrl} alt={poll.title} className="w-full h-full max-h-56 object-cover" />
            </div>
          )}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className={cn("rounded-lg px-3 py-1 text-[11px] font-black uppercase tracking-wider",
              closed ? "bg-white/8 text-white/40" : "bg-yellow-400/15 text-yellow-400"
            )}>
              {closed ? "Closed" : "• Live"}
            </span>
            <span className="rounded-lg border border-yellow-400/20 bg-yellow-400/[0.06] px-3 py-1 text-[11px] font-bold text-yellow-300">
              {typeInfo?.icon} {typeInfo?.label}
            </span>
            {!closed && (
              <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/40">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-yellow-400" />
                Live
              </span>
            )}
          </div>

          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="min-w-0 flex-1">
              <h1 className="font-heading text-2xl font-black text-white leading-snug">{poll.title}</h1>
              {poll.description && <p className="mt-2 text-sm text-white/45">{poll.description}</p>}
              <p className="mt-2 text-xs text-white/25">by {poll.creatorName} · {timeAgo(poll.createdAt)}</p>
            </div>
            <div className="shrink-0 text-center">
              <p className="font-heading text-4xl font-black text-white">{votes.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">Total Votes</p>
            </div>
          </div>
        </div>

        {/* Winner callout */}
        {winner && (
          <div className="mb-6 flex items-center gap-4 rounded-2xl border border-yellow-400/30 bg-yellow-400/[0.08] p-4 sm:p-5"
            style={{ animation: "pulse-glow-yellow 3s ease-in-out infinite" }}>
            {winner.option.imageUrl ? (
              <img
                src={winner.option.imageUrl}
                alt={winner.option.text}
                className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl object-cover border border-yellow-400/40 shrink-0 shadow-lg"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400/15 text-yellow-400 shrink-0">
                <Trophy size={24} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400/70 mb-0.5">🏆 Winner</p>
              <p className="font-heading text-lg sm:text-xl font-black text-white truncate">{winner.option.text}</p>
              <p className="text-xs text-white/45 mt-0.5">
                {winner.votes} votes ({winner.percentage}%)
              </p>
            </div>
          </div>
        )}

        {/* Result bars */}
        <div className="mb-8">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">Results</p>
          {results.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/35">No votes recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {results.map((r, i) => (
                <ResultBar key={r.option.id} item={r} isWinner={!!winner && r.option.id === winner.option.id} isFirst={i === 0} type={poll.type} />
              ))}
            </div>
          )}
        </div>

        {/* Voter list */}
        <div className="mb-8 border-t border-white/[0.06] pt-7">
          <div className="mb-4 flex items-center gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">Who Voted</p>
            <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-xs font-bold text-white/40">{votes.length}</span>
          </div>
          {votes.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/25">No votes yet.</p>
          ) : (
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {votes.slice(0, 50).map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.04] px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-base">{v.isAnonymous ? "🎭" : "👤"}</span>
                    <span className="text-sm font-medium text-white/75">{v.voterName || "Anonymous"}</span>
                  </div>
                  <span className="text-xs text-white/25">{timeAgo(v.castedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 border-t border-white/[0.06] pt-6">
          <button
            onClick={copyShare}
            className={cn("flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-bold transition",
              copied ? "border-green-500/30 bg-green-500/10 text-green-400" : "btn-ghost-yellow"
            )}
          >
            <Share2 size={14} /> {copied ? "Copied!" : "Share"}
          </button>

          <Link href={`/vote?code=${poll.code}`} className="btn-ghost-yellow flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold">
            ← Vote Page
          </Link>

          <Link href="/create" className="btn-yellow ml-auto flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm">
            <Plus size={14} strokeWidth={2.5} /> New Poll
          </Link>
        </div>

        {/* Creator controls */}
        {isCreator && (
          <div className="mt-4 border-t border-white/[0.06] pt-5">
            <div className="flex gap-3">
              {!closed && (
                <button
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-yellow-400/25 bg-yellow-400/[0.08] py-2.5 text-sm font-bold text-yellow-400 transition hover:bg-yellow-400/15"
                >
                  <Lock size={14} /> Close Poll
                </button>
              )}
              <button
                onClick={onDelete}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.08] py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500/15"
              >
                <Trash2 size={14} /> Delete Poll
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-white/20">Only you can see creator controls.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Inner ────────────────────────────────────────────────────
function ResultsInner() {
  const params = useSearchParams();
  const router = useRouter();
  const code   = (params.get("code") ?? "").toUpperCase().trim();
  const [poll,            setPoll]            = useState<Poll | null>(null);
  const [votes,           setVotes]           = useState<Vote[]>([]);
  const [view,            setView]            = useState<"loading"|"error"|"waiting"|"notvoted"|"results">("loading");
  const [errMsg,          setErrMsg]          = useState("");
  const [showModal,       setShowModal]       = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const unsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!code) { setView("error"); setErrMsg("No poll code provided."); return; }
    getPollByCode(code).then((p) => {
      if (!p) { setView("error"); setErrMsg(`No poll found with code "${code}".`); return; }
      setPoll(p);
      if (!isClosed(p)) {
        setView(hasVoted(p.id) ? "waiting" : "notvoted");
        return;
      }
      setView("results");
      getVotes(p.id).then(setVotes);
      unsubRef.current = onVotesUpdate(p.id, setVotes);
    }).catch(() => { setView("error"); setErrMsg("Failed to load. Check your connection."); });
    return () => { unsubRef.current?.(); };
  }, [code]);

  const handleClosePoll = useCallback(async () => {
    if (!poll) return;
    setShowModal(false);
    try {
      await closePoll(poll.id);
      const updated = await getPollByCode(code);
      if (updated) {
        setPoll(updated);
        setView("results");
        const v = await getVotes(updated.id);
        setVotes(v);
        unsubRef.current?.();
        unsubRef.current = onVotesUpdate(updated.id, setVotes);
      }
    } catch (e) { console.error(e); alert("Failed to close poll."); }
  }, [poll, code]);

  const handleDeletePoll = useCallback(async () => {
    if (!poll) return;
    setShowDeleteModal(false);
    try {
      await deletePoll(poll.id);
      router.push("/");
    } catch (e) {
      console.error(e);
      alert("Failed to delete poll.");
    }
  }, [poll, router]);

  const isCreator = poll ? !!getCreatorToken(poll.id) : false;

  return (
    <>
      {showModal && <ConfirmModal onConfirm={handleClosePoll} onCancel={() => setShowModal(false)} />}
      {showDeleteModal && <DeleteConfirmModal onConfirm={handleDeletePoll} onCancel={() => setShowDeleteModal(false)} />}
      {view === "loading"  && <LoadingView />}
      {view === "error"    && <ErrorView msg={errMsg} />}
      {view === "waiting"  && poll && <WaitingView  poll={poll} isCreator={isCreator} onClose={() => setShowModal(true)} />}
      {view === "notvoted" && poll && <NotVotedView poll={poll} isCreator={isCreator} onClose={() => setShowModal(true)} />}
      {view === "results"  && poll && <ResultsView  poll={poll} votes={votes} isCreator={isCreator} onClose={() => setShowModal(true)} onDelete={() => setShowDeleteModal(true)} />}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function ResultsPage() {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.12)_0%,transparent_60%)]" />
      <Navbar />
      <main className="relative z-10 pt-36 pb-20 px-6">
        <Suspense fallback={<LoadingView />}>
          <ResultsInner />
        </Suspense>
      </main>
    </div>
  );
}
