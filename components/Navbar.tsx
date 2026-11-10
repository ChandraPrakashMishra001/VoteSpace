"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { POLL_TYPES, normaliseCode } from "@/lib/polls";
import type { PollType } from "@/lib/types";
import {
  Menu,
  X,
  Plus,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Zap,
  Users,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

interface NavbarProps {
  showBack?: boolean;
  backHref?: string;
  activeType?: PollType;
}

const POLL_TYPE_DETAILS: Record<
  PollType,
  { tag: string; description: string; featured?: boolean }
> = {
  participant: {
    tag: "Popular • Events & Elections",
    description: "Vote for favourite participants, nominees, performers, or groups.",
    featured: true,
  },
  single: {
    tag: "Classic Standard",
    description: "Each voter picks exactly one favourite choice from the list.",
  },
  multiple: {
    tag: "Multi-select",
    description: "Allow voters to select all options that apply to them.",
  },
  ranked: {
    tag: "Consensus",
    description: "Voters drag and rank choices in order of preference from #1 to last.",
  },
  yesno: {
    tag: "Instant Binary",
    description: "Quick and simple yes/no agreement for fast decisions.",
  },
};

export default function Navbar({ showBack = false, backHref = "/" }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const router = useRouter();

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Prevent background scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleJoin = useCallback(() => {
    const c = normaliseCode(joinCode);
    if (c.length < 6) return;
    setIsOpen(false);
    router.push(`/vote?code=${c}`);
  }, [joinCode, router]);

  const handleSelectType = useCallback(
    (type: PollType) => {
      setIsOpen(false);
      router.push(`/create?type=${type}`);
    },
    [router]
  );

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 backdrop-blur-2xl bg-black/60 border-b border-yellow-400/10">
        {/* IEEE VSSUT Student Branch Top Banner */}
        <div className="flex items-center justify-center gap-2 border-b border-yellow-400/10 py-1.5 px-4 bg-yellow-400/[0.06]">
          <span className="text-sm">⚡</span>
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-yellow-300/85">
            IEEE VSSUT Student Branch
          </span>
          <span className="text-sm">⚡</span>
        </div>

        {/* Main Nav Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400/15 border border-yellow-400/25 transition group-hover:scale-105 group-hover:border-yellow-400/40">
              <span className="text-lg">🗳️</span>
            </div>
            <span className="font-heading text-xl font-black tracking-tight">
              Vote<span className="text-gradient">Space</span>
            </span>
          </Link>

          {/* Action Area */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Pancake / Hamburger Menu Button */}
            <button
              onClick={() => setIsOpen(true)}
              aria-label="Open poll types menu"
              className="flex items-center gap-2 rounded-xl border border-yellow-400/20 bg-yellow-400/[0.08] hover:bg-yellow-400/[0.16] hover:border-yellow-400/35 px-3 sm:px-4 py-2 text-sm font-semibold text-yellow-300 transition shadow-sm"
            >
              <div className="flex flex-col gap-1 items-center justify-center w-4">
                <span className="h-0.5 w-4 bg-yellow-300 rounded-full"></span>
                <span className="h-0.5 w-3.5 bg-yellow-300 rounded-full"></span>
                <span className="h-0.5 w-4 bg-yellow-300 rounded-full"></span>
              </div>
              <span className="hidden sm:inline">Choose Poll</span>
              <span className="sm:hidden text-xs">Menu</span>
            </button>

            {/* Back or Create Button */}
            {showBack ? (
              <Link
                href={backHref}
                className="btn-ghost-yellow flex items-center gap-1.5 rounded-xl px-3.5 sm:px-4 py-2 text-sm"
              >
                <ArrowLeft size={14} /> Back
              </Link>
            ) : (
              <Link
                href="/create"
                className="btn-yellow flex items-center gap-1.5 rounded-xl px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span className="hidden xs:inline">Create Poll</span>
                <span className="xs:hidden">Create</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Pancake Slide-over / Modal Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in"
            onClick={() => setIsOpen(false)}
          />

          {/* Pancake Menu Dialog Box */}
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-yellow-400/25 bg-[#0a0a16] p-6 sm:p-8 shadow-2xl shadow-yellow-500/10 backdrop-blur-2xl animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/25 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-300 mb-2">
                  <span>🥞</span>
                  <span>Pancake Poll Selector</span>
                </div>
                <h2 className="font-heading text-2xl font-black text-white">
                  What poll do you want to create?
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-white/50">
                  Select your poll format below to jump directly into the setup.
                </p>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Poll Types List / Grid */}
            <div className="mt-5 space-y-3">
              {(Object.keys(POLL_TYPES) as PollType[]).map((typeKey) => {
                const info = POLL_TYPES[typeKey];
                const detail = POLL_TYPE_DETAILS[typeKey];
                const isFeatured = detail?.featured;

                return (
                  <button
                    key={typeKey}
                    onClick={() => handleSelectType(typeKey)}
                    className={cn(
                      "group w-full flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200",
                      isFeatured
                        ? "border-yellow-400/40 bg-yellow-400/[0.08] hover:border-yellow-400/80 hover:bg-yellow-400/[0.14] shadow-[0_0_20px_rgba(250,204,21,0.12)]"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-yellow-400/30 hover:bg-yellow-400/[0.04]"
                    )}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-yellow-400/20 bg-yellow-400/10 text-2xl transition group-hover:scale-110">
                      {info.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-bold text-white text-base group-hover:text-yellow-300 transition">
                          {info.label}
                        </span>
                        {detail?.tag && (
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                              isFeatured
                                ? "bg-yellow-400 text-black font-extrabold"
                                : "border border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
                            )}
                          >
                            {detail.tag}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-white/50 leading-relaxed">
                        {detail?.description || info.desc}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-yellow-400/60 group-hover:text-yellow-300 group-hover:translate-x-1 transition">
                      <span className="hidden sm:inline">Start</span>
                      <ChevronRight size={16} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Join By Code */}
            <div className="mt-6 rounded-2xl border border-white/[0.08] bg-black/40 p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                Or join an existing poll with a 6-letter code
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(normaliseCode(e.target.value))}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  placeholder="e.g. ABC123"
                  maxLength={6}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-center font-mono-code text-sm font-bold uppercase tracking-[0.2em] text-white placeholder:tracking-normal placeholder:text-white/20 focus:border-yellow-400/50 focus:outline-none"
                />
                <button
                  onClick={handleJoin}
                  disabled={joinCode.length < 6}
                  className="btn-yellow flex items-center gap-1 rounded-xl px-4 py-2.5 text-xs font-bold disabled:opacity-40"
                >
                  Join <ArrowRight size={13} />
                </button>
              </div>
            </div>

            {/* Footer Attribution in Pancake Menu */}
            <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-white/35 flex-wrap gap-2">
              <span className="text-yellow-400/70 font-semibold">
                ⚡ IEEE VSSUT Student Branch
              </span>
              <span>Made by Chandra Prakash Mishra</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
