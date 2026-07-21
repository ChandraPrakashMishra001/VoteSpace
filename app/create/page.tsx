"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { generateCode, generateCreatorToken, validatePoll, buildOptions, expiryTimestamp, POLL_TYPES } from "@/lib/polls";
import { createPoll, saveMyPoll } from "@/lib/store";
import type { PollType } from "@/lib/types";
import { Plus, X, Check, ArrowLeft, ArrowRight, Rocket, Copy, Zap } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────
const TIMERS = [
  { label: "No timer", hours: 0 },
  { label: "1 hour",   hours: 1 },
  { label: "6 hours",  hours: 6 },
  { label: "24 hours", hours: 24 },
  { label: "2 days",   hours: 48 },
  { label: "1 week",   hours: 168 },
];
const STEPS = ["Topic", "Type", "Options", "Settings", "Share"];

interface FormState {
  title: string; description: string; creatorName: string;
  type: PollType; options: string[]; timerHours: number;
}

// ─── Shared Navbar ────────────────────────────────────────────
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
      <Link href="/" className="btn-ghost-yellow flex items-center gap-2 rounded-xl px-4 py-2 text-sm">
        <ArrowLeft size={14} /> Back
      </Link>
    </nav>
  );
}

// ─── Progress Indicator ───────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={label} className="flex items-center">
            <div
              title={label}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300",
                done   && "border-yellow-400 bg-yellow-400 text-black",
                active && "border-yellow-400 bg-yellow-400/15 text-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.35)]",
                !done && !active && "border-white/15 text-white/25"
              )}
            >
              {done ? <Check size={13} strokeWidth={3} /> : n}
            </div>
            {n < STEPS.length && (
              <div className={cn("h-px w-10 sm:w-14 transition-all duration-500", done ? "bg-yellow-400/60" : "bg-white/8")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-yellow-400/[0.12] bg-black/55 p-8 backdrop-blur-2xl shadow-2xl shadow-black/60">
      {children}
    </div>
  );
}

// ─── Input component ──────────────────────────────────────────
function Input({ label, optional, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; optional?: boolean }) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
        {label}
        {optional && <span className="font-normal normal-case tracking-normal text-white/20">optional</span>}
      </label>
      <input
        {...props}
        className={cn(
          "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder:text-white/20 transition focus:border-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/15",
          props.className
        )}
      />
    </div>
  );
}

// ─── Step 1 — Topic ───────────────────────────────────────────
function StepTopic({ form, setForm, onNext }: { form: FormState; setForm: (f: FormState) => void; onNext: () => void }) {
  const [err, setErr] = useState("");
  return (
    <Card>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-400/70">Step 1 of 4</p>
      <h2 className="mb-1 font-heading text-2xl font-black text-white">What's the topic?</h2>
      <p className="mb-7 text-sm text-white/40">Give your poll a clear, punchy title.</p>

      <div className="space-y-5">
        <div>
          <Input
            label="Poll Title"
            value={form.title}
            onChange={(e) => { setForm({ ...form, title: e.target.value }); setErr(""); }}
            placeholder='e.g. "Best pizza topping for Friday night?"'
            maxLength={200}
          />
          <div className="mt-1.5 flex justify-between">
            {err ? <p className="text-xs text-red-400">{err}</p> : <span />}
            <p className="text-xs text-white/25">{form.title.length}/200</p>
          </div>
        </div>
        <div>
          <label className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
            Description <span className="font-normal normal-case tracking-normal text-white/20">optional</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Add context or rules for your voters…"
            maxLength={500}
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder:text-white/20 resize-none transition focus:border-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/15"
          />
        </div>
        <Input
          label="Your name"
          optional
          value={form.creatorName}
          onChange={(e) => setForm({ ...form, creatorName: e.target.value })}
          placeholder="Leave blank to be anonymous"
          maxLength={60}
        />
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={() => { if (!form.title.trim()) { setErr("Please enter a poll title"); return; } onNext(); }}
          className="btn-yellow flex items-center gap-2 rounded-xl px-7 py-3"
        >
          Next <ArrowRight size={15} strokeWidth={2.5} />
        </button>
      </div>
    </Card>
  );
}

// ─── Step 2 — Type ────────────────────────────────────────────
function StepType({ form, setForm, onBack, onNext }: { form: FormState; setForm: (f: FormState) => void; onBack: () => void; onNext: () => void }) {
  return (
    <Card>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-400/70">Step 2 of 4</p>
      <h2 className="mb-1 font-heading text-2xl font-black text-white">Pick a poll type</h2>
      <p className="mb-7 text-sm text-white/40">How do you want your crew to vote?</p>

      <div className="grid grid-cols-2 gap-3">
        {(Object.entries(POLL_TYPES) as [PollType, typeof POLL_TYPES[PollType]][]).map(([key, t]) => (
          <button
            key={key}
            onClick={() => setForm({ ...form, type: key })}
            className={cn(
              "flex flex-col items-center gap-3 rounded-xl border-2 p-5 text-center transition-all duration-200",
              form.type === key
                ? "border-yellow-400/60 bg-yellow-400/[0.07] shadow-[0_0_24px_rgba(250,204,21,0.18)]"
                : "border-white/[0.08] bg-white/[0.02] hover:border-yellow-400/25 hover:bg-yellow-400/[0.03]"
            )}
          >
            <span className="text-3xl">{t.icon}</span>
            <div>
              <p className={cn("font-heading font-bold text-sm", form.type === key ? "text-yellow-300" : "text-white/80")}>{t.label}</p>
              <p className="mt-0.5 text-[11px] text-white/35 leading-snug">{t.desc}</p>
            </div>
            {form.type === key && (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400">
                <Check size={11} strokeWidth={3} className="text-black" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-between">
        <button onClick={onBack} className="btn-ghost-yellow flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm"><ArrowLeft size={14} /> Back</button>
        <button onClick={onNext} className="btn-yellow flex items-center gap-2 rounded-xl px-7 py-3 text-sm">Next <ArrowRight size={15} strokeWidth={2.5} /></button>
      </div>
    </Card>
  );
}

// ─── Step 3 — Options ─────────────────────────────────────────
function StepOptions({ form, setForm, onBack, onNext }: { form: FormState; setForm: (f: FormState) => void; onBack: () => void; onNext: () => void }) {
  const [err, setErr] = useState("");

  const setOpt = (i: number, val: string) => { const o = [...form.options]; o[i] = val; setForm({ ...form, options: o }); };
  const addOpt = () => { if (form.options.length >= 10) return; setForm({ ...form, options: [...form.options, ""] }); };
  const removeOpt = (i: number) => { if (form.options.length <= 2) return; setForm({ ...form, options: form.options.filter((_, idx) => idx !== i) }); };

  if (form.type === "yesno") return (
    <Card>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-400/70">Step 3 of 4</p>
      <h2 className="mb-1 font-heading text-2xl font-black text-white">Options</h2>
      <p className="mb-7 text-sm text-white/40">Yes / No is all set automatically.</p>
      <div className="flex gap-4">
        {[{ e: "👍", l: "Yes" }, { e: "👎", l: "No" }].map((o) => (
          <div key={o.l} className="flex flex-1 flex-col items-center gap-3 rounded-xl border border-yellow-400/15 bg-yellow-400/[0.04] py-8 text-center">
            <span className="text-4xl">{o.e}</span>
            <span className="font-heading font-bold text-white/80">{o.l}</span>
          </div>
        ))}
      </div>
      <div className="mt-8 flex justify-between">
        <button onClick={onBack} className="btn-ghost-yellow flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm"><ArrowLeft size={14} /> Back</button>
        <button onClick={onNext} className="btn-yellow flex items-center gap-2 rounded-xl px-7 py-3 text-sm">Next <ArrowRight size={15} strokeWidth={2.5} /></button>
      </div>
    </Card>
  );

  return (
    <Card>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-400/70">Step 3 of 4</p>
      <h2 className="mb-1 font-heading text-2xl font-black text-white">Add options</h2>
      <p className="mb-7 text-sm text-white/40">
        {form.type === "ranked" ? "Voters will drag these into their preferred order." : "Add the choices your crew picks from."}
      </p>

      <div className="space-y-2.5">
        {form.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="w-6 shrink-0 text-center text-xs font-bold text-yellow-400/60">{i + 1}</span>
            <input
              value={opt}
              onChange={(e) => setOpt(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              maxLength={120}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/20 transition focus:border-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/15"
            />
            <button
              onClick={() => removeOpt(i)}
              disabled={form.options.length <= 2}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/[0.08] text-red-400 transition hover:bg-red-500/20 disabled:opacity-25 disabled:cursor-not-allowed"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>

      {form.options.length < 10 && (
        <button
          onClick={addOpt}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-yellow-400/15 px-4 py-2.5 text-sm font-medium text-white/35 transition hover:border-yellow-400/35 hover:text-yellow-400/70"
        >
          <Plus size={14} /> Add another option
        </button>
      )}

      {err && <p className="mt-3 text-sm text-red-400">{err}</p>}

      <div className="mt-8 flex justify-between">
        <button onClick={onBack} className="btn-ghost-yellow flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm"><ArrowLeft size={14} /> Back</button>
        <button
          onClick={() => {
            const errs = validatePoll({ title: form.title, type: form.type, options: form.options });
            if (errs.length) { setErr(errs[0]); return; }
            setErr(""); onNext();
          }}
          className="btn-yellow flex items-center gap-2 rounded-xl px-7 py-3 text-sm"
        >
          Next <ArrowRight size={15} strokeWidth={2.5} />
        </button>
      </div>
    </Card>
  );
}

// ─── Step 4 — Settings ────────────────────────────────────────
function StepSettings({ form, setForm, onBack, onCreate, creating }: {
  form: FormState; setForm: (f: FormState) => void;
  onBack: () => void; onCreate: () => void; creating: boolean;
}) {
  return (
    <Card>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-400/70">Step 4 of 4</p>
      <h2 className="mb-1 font-heading text-2xl font-black text-white">Settings</h2>
      <p className="mb-7 text-sm text-white/40">Set a duration or leave it open indefinitely.</p>

      <div>
        <label className="mb-3 block text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">Poll Duration</label>
        <div className="flex flex-wrap gap-2">
          {TIMERS.map((t) => (
            <button
              key={t.hours}
              onClick={() => setForm({ ...form, timerHours: t.hours })}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                form.timerHours === t.hours
                  ? "border-yellow-400/60 bg-yellow-400/15 text-yellow-300"
                  : "border-white/[0.08] bg-white/[0.03] text-white/40 hover:border-yellow-400/25 hover:text-white/70"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-white/25">Results are revealed automatically when the poll closes.</p>
      </div>

      <div className="mt-8 flex justify-between">
        <button onClick={onBack} className="btn-ghost-yellow flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm"><ArrowLeft size={14} /> Back</button>
        <button
          onClick={onCreate}
          disabled={creating}
          className="btn-yellow flex items-center gap-2 rounded-xl px-7 py-3 text-sm disabled:opacity-50"
        >
          {creating
            ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" /> Creating…</>
            : <><Rocket size={15} /> Launch Poll</>
          }
        </button>
      </div>
    </Card>
  );
}

// ─── Step 5 — Share ───────────────────────────────────────────
function StepShare({ code }: { code: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 2200); });
  };
  const voteUrl    = `${origin}/vote?code=${code}`;
  const resultsUrl = `${origin}/results?code=${code}`;

  return (
    <Card>
      <div className="mb-8 text-center">
        <div className="mb-5 text-6xl" style={{ animation: "bounce-in 0.5s cubic-bezier(.34,1.56,.64,1)" }}>🎉</div>
        <h2 className="font-heading text-3xl font-black text-white">Poll is Live!</h2>
        <p className="mt-2 text-sm text-white/45">Share the code below with your crew.</p>
      </div>

      {/* Big code display */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-yellow-400/25 bg-yellow-400/[0.07] p-5">
        <div className="flex-1 text-center font-mono-code text-3xl font-black tracking-[0.3em] text-gradient">
          {code}
        </div>
        <button
          onClick={() => copy(code, "code")}
          className={cn("rounded-xl border px-4 py-2 text-xs font-bold transition",
            copied === "code" ? "border-green-500/40 bg-green-500/10 text-green-400" : "border-yellow-400/25 bg-yellow-400/10 text-yellow-300 hover:bg-yellow-400/20"
          )}
        >
          {copied === "code" ? "✓ Copied" : <Copy size={13} />}
        </button>
      </div>

      {/* Links */}
      <div className="space-y-3 mb-7">
        {[{ label: "Vote Link", url: voteUrl, key: "vote" }, { label: "Results Link", url: resultsUrl, key: "results" }].map(({ label, url, key }) => (
          <div key={key}>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">{label}</p>
            <div className="flex gap-2">
              <input value={url} readOnly className="flex-1 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 font-mono-code text-xs text-white/45 focus:outline-none" />
              <button onClick={() => copy(url, key)} className={cn("shrink-0 rounded-xl border px-3 py-2.5 text-xs font-bold transition",
                copied === key ? "border-green-500/40 bg-green-500/10 text-green-400" : "border-yellow-400/20 bg-yellow-400/[0.06] text-yellow-300/70 hover:text-yellow-300"
              )}>
                <Copy size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Link href={`/vote?code=${code}`}    className="btn-yellow flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm">🗳️ Vote Now</Link>
        <Link href={`/results?code=${code}`} className="btn-ghost-yellow flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm">📊 Results</Link>
        <Link href="/create"                 className="btn-ghost-yellow flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm"><Plus size={13} /> New</Link>
      </div>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function CreatePage() {
  const [step, setStep]         = useState(1);
  const [creating, setCreating] = useState(false);
  const [createdCode, setCode]  = useState<string | null>(null);
  const confettiRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<FormState>({
    title: "", description: "", creatorName: "",
    type: "single", options: ["", ""], timerHours: 0,
  });

  const go = (n: number) => { setStep(n); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const showConfetti = () => {
    const c = confettiRef.current; if (!c) return;
    const colors = ["#FACC15","#FDE047","#F59E0B","#ffffff","#a855f7","#7c3aed"];
    for (let i = 0; i < 90; i++) {
      const p = document.createElement("div");
      p.className = "confetti-piece absolute top-0";
      const col = colors[Math.floor(Math.random() * colors.length)];
      const s = 5 + Math.random() * 7;
      p.style.cssText = `left:${Math.random()*100}%;width:${s}px;height:${s}px;background:${col};border-radius:${Math.random()>.5?"50%":"3px"};animation-duration:${1.8+Math.random()*2}s;animation-delay:${Math.random()*.8}s;`;
      c.appendChild(p);
    }
    setTimeout(() => { if (c) c.innerHTML = ""; }, 5000);
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const options      = buildOptions(form.type, form.options);
      const code         = generateCode();
      const creatorToken = generateCreatorToken();
      const expiresAt    = expiryTimestamp(form.timerHours);
      const poll = await createPoll({
        code, title: form.title, description: form.description,
        creatorName: form.creatorName || "Anonymous",
        creatorToken, type: form.type, options,
        expiresAt: expiresAt ?? null,
      });
      saveMyPoll(poll, creatorToken);
      setCode(code);
      showConfetti();
      go(5);
    } catch (e) {
      console.error(e);
      alert("Failed to create poll. Check your Firebase config.");
    } finally { setCreating(false); }
  };

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.15)_0%,transparent_60%)]" />
      <div ref={confettiRef} className="confetti-container" />
      <Navbar />

      <main className="relative z-10 pt-28 pb-20 px-6">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/[0.06] px-4 py-2 text-xs font-bold uppercase tracking-widest text-yellow-400/80 mb-4">
            <Zap size={11} fill="currentColor" /> New Poll
          </div>
          <h1 className="font-heading text-4xl font-black text-white">
            Create a <span className="text-gradient">Poll</span>
          </h1>
          <p className="mt-2 text-sm text-white/35">Fill in the steps and share with your crew.</p>
        </div>

        <StepIndicator current={step} />

        <div className="step-enter" key={step}>
          {step === 1 && <StepTopic    form={form} setForm={setForm} onNext={() => go(2)} />}
          {step === 2 && <StepType     form={form} setForm={setForm} onBack={() => go(1)} onNext={() => go(3)} />}
          {step === 3 && <StepOptions  form={form} setForm={setForm} onBack={() => go(2)} onNext={() => go(4)} />}
          {step === 4 && <StepSettings form={form} setForm={setForm} onBack={() => go(3)} onCreate={handleCreate} creating={creating} />}
          {step === 5 && createdCode && <StepShare code={createdCode} />}
        </div>
      </main>
    </div>
  );
}
