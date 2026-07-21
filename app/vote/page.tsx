"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getPollByCode, castVote, hasVoted, markVoted, getVoterId } from "@/lib/store";
import { isClosed, timeLeft, POLL_TYPES } from "@/lib/polls";
import type { Poll, PollOption } from "@/lib/types";
import { ArrowLeft, Check, GripVertical, ChevronUp, ChevronDown, Zap, Plus } from "lucide-react";

// ─── Navbar ───────────────────────────────────────────────────
function Navbar() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-2xl bg-black/50 border-b border-yellow-400/10">
      <Link href="/" className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400/15 border border-yellow-400/25">
          <span className="text-lg">🗳️</span>
        </div>
        <span className="font-heading text-xl font-black tracking-tight">
          Vote<span className="text-gradient">Space</span>
        </span>
      </Link>
      <Link href="/create" className="btn-yellow flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm">
        <Plus size={14} strokeWidth={2.5} /> New Poll
      </Link>
    </nav>
  );
}

// ─── Loading ──────────────────────────────────────────────────
function LoadingView() {
  return (
    <div className="flex flex-col items-center gap-5 py-32 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-yellow-400/20 border-t-yellow-400" />
      <p className="text-white/40 text-sm">Loading poll…</p>
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
      <Link href="/" className="btn-yellow flex items-center gap-2 rounded-xl px-6 py-3 text-sm mt-2">
        <ArrowLeft size={14} /> Go Home
      </Link>
    </div>
  );
}

// ─── Closed ───────────────────────────────────────────────────
function ClosedView({ code }: { code: string }) {
  return (
    <div className="flex flex-col items-center gap-5 py-32 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/[0.06] text-4xl">🔒</div>
      <p className="font-heading text-2xl font-black text-white">Poll is closed</p>
      <p className="text-sm text-white/40">Voting has ended. Check out the results!</p>
      <Link href={`/results?code=${code}`} className="btn-yellow flex items-center gap-2 rounded-xl px-7 py-3 mt-2">
        📊 See Results
      </Link>
    </div>
  );
}

// ─── Already Voted ────────────────────────────────────────────
function VotedView({ code }: { code: string }) {
  return (
    <div className="flex flex-col items-center gap-5 py-32 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-yellow-400/30 bg-yellow-400/10 text-4xl" style={{ animation: "bounce-in .5s cubic-bezier(.34,1.56,.64,1)" }}>
        ✅
      </div>
      <p className="font-heading text-2xl font-black text-white">Already voted!</p>
      <p className="max-w-xs text-sm text-white/40">You've cast your vote. Results appear once the poll closes.</p>
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        <Link href={`/results?code=${code}`} className="btn-yellow flex items-center gap-2 rounded-xl px-6 py-3 text-sm">📊 Check Results</Link>
        <Link href="/" className="btn-ghost-yellow flex items-center gap-2 rounded-xl px-6 py-3 text-sm">🏠 Dashboard</Link>
      </div>
    </div>
  );
}

// ─── Success ──────────────────────────────────────────────────
function SuccessView({ code, voterName }: { code: string; voterName: string }) {
  return (
    <div className="flex flex-col items-center gap-5 py-32 text-center">
      <div className="text-6xl" style={{ animation: "bounce-in .5s cubic-bezier(.34,1.56,.64,1)" }}>🎉</div>
      <p className="font-heading text-3xl font-black text-white">Vote cast!</p>
      <p className="max-w-sm text-sm text-white/45 leading-relaxed">
        Your vote is recorded{voterName ? `, ${voterName}` : ""}!
        Results appear once the creator closes the poll.
      </p>
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        <Link href={`/results?code=${code}`} className="btn-yellow flex items-center gap-2 rounded-xl px-6 py-3 text-sm">📊 View Results</Link>
        <Link href="/" className="btn-ghost-yellow flex items-center gap-2 rounded-xl px-6 py-3 text-sm">🏠 Dashboard</Link>
      </div>
    </div>
  );
}

// ─── Single / Multiple Options ────────────────────────────────
function OptionList({ options, selected, type, onToggle }: {
  options: PollOption[]; selected: string[];
  type: "single" | "multiple"; onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-2.5">
      {options.map((opt) => {
        const active = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            onClick={() => onToggle(opt.id)}
            className={cn(
              "group flex w-full items-center gap-4 rounded-xl border-2 px-5 py-4 text-left transition-all duration-200",
              active
                ? "option-active border-yellow-400/60"
                : "border-white/[0.08] bg-white/[0.02] hover:border-yellow-400/25 hover:bg-yellow-400/[0.03] hover:translate-x-1"
            )}
          >
            <div className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center border-2 transition-all",
              type === "multiple" ? "rounded-md" : "rounded-full",
              active ? "border-yellow-400 bg-yellow-400" : "border-white/20 group-hover:border-yellow-400/40"
            )}>
              {active && <Check size={10} strokeWidth={3} className="text-black" />}
            </div>
            <span className={cn("font-medium text-sm", active ? "text-white" : "text-white/75")}>{opt.text}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Yes / No ─────────────────────────────────────────────────
function YesNoList({ selected, onSelect }: { selected: string[]; onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[
        { id: "yes", emoji: "👍", label: "Yes", active: "border-yellow-400/70 bg-yellow-400/[0.08] shadow-[0_0_32px_rgba(250,204,21,0.22)]" },
        { id: "no",  emoji: "👎", label: "No",  active: "border-red-400/70 bg-red-500/[0.08] shadow-[0_0_32px_rgba(239,68,68,0.22)]" },
      ].map(({ id, emoji, label, active: activeCls }) => {
        const active = selected.includes(id);
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={cn(
              "flex flex-col items-center gap-4 rounded-2xl border-2 py-10 transition-all duration-200 hover:-translate-y-1",
              active ? activeCls : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
            )}
          >
            <span className="text-5xl">{emoji}</span>
            <span className={cn("font-heading text-xl font-black", active ? "text-white" : "text-white/60")}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Ranked ───────────────────────────────────────────────────
function RankedList({ options, order, setOrder }: { options: PollOption[]; order: string[]; setOrder: (o: string[]) => void }) {
  const dragSrc = useRef<number | null>(null);
  const optMap  = Object.fromEntries(options.map((o) => [o.id, o]));
  const ordered = order.map((id) => optMap[id]).filter(Boolean);

  const move = (from: number, to: number) => {
    const next = [...order]; const [item] = next.splice(from, 1); next.splice(to, 0, item); setOrder(next);
  };

  return (
    <div className="space-y-2.5">
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-yellow-400/15 bg-yellow-400/[0.04] px-4 py-3">
        <GripVertical size={13} className="text-yellow-400/70" />
        <span className="text-xs font-semibold text-yellow-300/70">Drag to reorder · Use ▲▼ buttons on mobile</span>
      </div>
      {ordered.map((opt, i) => (
        <div
          key={opt.id}
          draggable
          onDragStart={() => { dragSrc.current = i; }}
          onDragOver={(e) => { e.preventDefault(); if (dragSrc.current === null || dragSrc.current === i) return; move(dragSrc.current, i); dragSrc.current = i; }}
          onDragEnd={() => { dragSrc.current = null; }}
          className="flex items-center gap-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 cursor-grab active:cursor-grabbing active:opacity-50 transition hover:border-yellow-400/20 hover:bg-yellow-400/[0.03]"
        >
          <span className="font-mono-code w-7 text-center text-xs font-black text-yellow-400">#{i + 1}</span>
          <GripVertical size={15} className="text-white/20 shrink-0" />
          <span className="flex-1 text-sm font-medium text-white/85">{opt.text}</span>
          <div className="flex flex-col gap-1">
            <button onClick={() => i > 0 && move(i, i - 1)} disabled={i === 0} className="rounded-lg bg-white/5 p-1 text-white/35 hover:text-yellow-400 disabled:opacity-20 transition"><ChevronUp size={12} /></button>
            <button onClick={() => i < ordered.length - 1 && move(i, i + 1)} disabled={i === ordered.length - 1} className="rounded-lg bg-white/5 p-1 text-white/35 hover:text-yellow-400 disabled:opacity-20 transition"><ChevronDown size={12} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Vote Form ────────────────────────────────────────────────
function VoteForm({ poll, code }: { poll: Poll; code: string }) {
  const [voterName, setVoterName]   = useState("");
  const [selected, setSelected]     = useState<string[]>([]);
  const [rankOrder, setRankOrder]   = useState<string[]>(poll.options.map((o) => o.id));
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [timer, setTimer]           = useState<string | null>(null);

  useEffect(() => {
    if (!poll.expiresAt) return;
    const id = setInterval(() => setTimer(timeLeft(poll.expiresAt!)), 1000);
    setTimer(timeLeft(poll.expiresAt));
    return () => clearInterval(id);
  }, [poll.expiresAt]);

  const toggleOption = useCallback((id: string) => {
    if (poll.type === "single" || poll.type === "yesno") { setSelected([id]); }
    else { setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]); }
  }, [poll.type]);

  const isValid = poll.type === "ranked" ? rankOrder.length > 0 : selected.length > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      await castVote(poll.id, {
        voterId: getVoterId(),
        voterName: voterName.trim() || "Anonymous",
        isAnonymous: !voterName.trim(),
        choices: poll.type === "ranked" ? rankOrder : selected,
        ...(poll.type === "ranked" && { rankings: Object.fromEntries(rankOrder.map((id, i) => [id, i + 1])) }),
      });
      markVoted(poll.id);
      setSuccess(true);
    } catch (e) {
      console.error(e);
      alert("Failed to cast vote. Please try again.");
      setSubmitting(false);
    }
  };

  if (success) return <SuccessView code={code} voterName={voterName.trim()} />;

  const typeInfo = POLL_TYPES[poll.type];

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl border border-yellow-400/[0.12] bg-black/55 p-8 backdrop-blur-2xl shadow-2xl shadow-black/60">

        {/* Header */}
        <div className="mb-7 border-b border-white/[0.06] pb-7">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-yellow-400/25 bg-yellow-400/[0.08] px-3 py-1 text-xs font-bold text-yellow-300">
              {typeInfo.icon} {typeInfo.label}
            </span>
            {timer && (
              <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-white/55">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-yellow-400" />
                {timer}
              </span>
            )}
          </div>
          <h1 className="font-heading text-xl font-black text-white leading-snug">{poll.title}</h1>
          {poll.description && <p className="mt-2 text-sm text-white/45 leading-relaxed">{poll.description}</p>}
        </div>

        {/* Name */}
        <div className="mb-6">
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-white/35">
            Your name <span className="font-normal normal-case tracking-normal text-white/20">optional — leave blank to stay anonymous</span>
          </label>
          <input
            type="text"
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            placeholder="e.g. Alex"
            maxLength={60}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/20 transition focus:border-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/15"
          />
        </div>

        {/* Options */}
        <div className="mb-7">
          <label className="mb-3 block text-[10px] font-bold uppercase tracking-[0.15em] text-white/35">
            {poll.type === "multiple" ? "Select all that apply" : poll.type === "ranked" ? "Drag into your preferred order" : "Pick one"}
          </label>
          {(poll.type === "single" || poll.type === "multiple") && <OptionList options={poll.options} selected={selected} type={poll.type} onToggle={toggleOption} />}
          {poll.type === "yesno"   && <YesNoList selected={selected} onSelect={toggleOption} />}
          {poll.type === "ranked"  && <RankedList options={poll.options} order={rankOrder} setOrder={setRankOrder} />}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className="btn-yellow flex w-full items-center justify-center gap-3 rounded-xl py-4 text-base font-bold disabled:opacity-40"
        >
          {submitting
            ? <><span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" /> Submitting…</>
            : <><Zap size={16} fill="currentColor" /> Cast My Vote</>
          }
        </button>
        <p className="mt-3 text-center text-xs text-white/20">One vote per poll.</p>
      </div>
    </div>
  );
}

// ─── Inner ────────────────────────────────────────────────────
function VoteInner() {
  const params = useSearchParams();
  const code   = (params.get("code") ?? "").toUpperCase().trim();
  const [poll,  setPoll]  = useState<Poll | null>(null);
  const [state, setState] = useState<"loading"|"error"|"closed"|"voted"|"vote">("loading");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    if (!code) { setState("error"); setErrMsg("No poll code provided."); return; }
    getPollByCode(code)
      .then((p) => {
        if (!p) { setState("error"); setErrMsg(`No poll found with code "${code}".`); return; }
        setPoll(p);
        if (isClosed(p))      { setState("closed");  return; }
        if (hasVoted(p.id))   { setState("voted");   return; }
        setState("vote");
      })
      .catch(() => { setState("error"); setErrMsg("Failed to load. Check your connection."); });
  }, [code]);

  return (
    <>
      {state === "loading" && <LoadingView />}
      {state === "error"   && <ErrorView  msg={errMsg} />}
      {state === "closed"  && <ClosedView code={code} />}
      {state === "voted"   && <VotedView  code={code} />}
      {state === "vote"    && poll && <VoteForm poll={poll} code={code} />}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function VotePage() {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.12)_0%,transparent_60%)]" />
      <Navbar />
      <main className="relative z-10 pt-28 pb-20 px-6">
        <Suspense fallback={<LoadingView />}>
          <VoteInner />
        </Suspense>
      </main>
    </div>
  );
}
