import type { Vote, PollOption, PollType, ResultItem } from "./types";

export function calculateResults(
  votes: Vote[],
  options: PollOption[],
  type: PollType
): ResultItem[] {
  const map: Record<string, { option: PollOption; score: number; votes: number }> = {};
  options.forEach((o) => { map[o.id] = { option: o, score: 0, votes: 0 }; });

  if (type === "ranked") {
    const N = options.length;
    votes.forEach((v) => {
      if (!v.rankings) return;
      Object.entries(v.rankings).forEach(([id, rank]) => {
        if (map[id]) { map[id].score += N - rank + 1; map[id].votes++; }
      });
    });
    const maxScore = Math.max(...Object.values(map).map((t) => t.score), 1);
    return Object.values(map)
      .sort((a, b) => b.score - a.score)
      .map((t, i) => ({ ...t, percentage: Math.round((t.score / maxScore) * 100), rank: i + 1 }));
  }

  votes.forEach((v) => {
    (v.choices ?? []).forEach((id) => { if (map[id]) map[id].votes++; });
  });

  const total = Object.values(map).reduce((s, t) => s + t.votes, 0) || 1;
  return Object.values(map)
    .sort((a, b) => b.votes - a.votes)
    .map((t, i) => ({ ...t, percentage: Math.round((t.votes / total) * 100), rank: i + 1 }));
}

export function findWinner(results: ResultItem[]): ResultItem | null {
  if (!results.length) return null;
  const top = results[0];
  if (top.votes === 0 && top.score === 0) return null;
  // tie?
  if (results.length > 1 && results[1].votes === top.votes && results[1].score === top.score) {
    return { ...top };
  }
  return top;
}

export function escHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
