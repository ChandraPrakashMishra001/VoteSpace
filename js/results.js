// =====================================================
// VOTESPACE — Results Engine
// js/results.js
// =====================================================

const Results = {

  // ---- Calculate results from raw votes ----
  calculate(votes, options, type) {
    // Build totals map
    const map = {};
    options.forEach(o => { map[o.id] = { option: o, score: 0, votes: 0 }; });

    if (type === 'ranked') {
      const N = options.length;
      // Borda count: rank 1 → N points, rank N → 1 point
      votes.forEach(v => {
        if (!v.rankings) return;
        Object.entries(v.rankings).forEach(([id, rank]) => {
          if (map[id]) {
            map[id].score += (N - rank + 1);
            map[id].votes++;
          }
        });
      });
      const maxScore = Math.max(...Object.values(map).map(t => t.score), 1);
      return Object.values(map)
        .sort((a, b) => b.score - a.score)
        .map((t, i) => ({ ...t, percentage: Math.round((t.score / maxScore) * 100), rank: i + 1 }));
    }

    // single / multiple / yesno — count by choices
    votes.forEach(v => {
      (v.choices || []).forEach(id => {
        if (map[id]) map[id].votes++;
      });
    });

    const totalChoices = Object.values(map).reduce((s, t) => s + t.votes, 0) || 1;
    return Object.values(map)
      .sort((a, b) => b.votes - a.votes)
      .map((t, i) => ({ ...t, percentage: Math.round((t.votes / totalChoices) * 100), rank: i + 1 }));
  },

  // ---- Determine winner ----
  findWinner(results) {
    if (!results?.length) return null;
    const top = results[0];
    const hasVotes = top.votes > 0 || top.score > 0;
    if (!hasVotes) return null;
    // Tie: if second place has same score, mark as tie
    if (results.length > 1) {
      const second = results[1];
      if (top.votes === second.votes && top.score === second.score) {
        return { ...top, isTie: true };
      }
    }
    return { ...top, isTie: false };
  },

  // ---- Render results into a container element ----
  render(results, container, type) {
    if (!container) return;
    const winner = this.findWinner(results);
    container.innerHTML = '';

    if (!results || results.length === 0) {
      container.innerHTML = `<div class="empty-state"><p class="text-muted">No votes yet.</p></div>`;
      return;
    }

    const list = document.createElement('div');
    list.className = 'results-list stagger';
    container.appendChild(list);

    results.forEach((r, idx) => {
      const isWinner = !!(winner && r.option.id === winner.option.id && idx === 0);
      const scoreLabel = type === 'ranked'
        ? `${r.score} pts`
        : `${r.votes} vote${r.votes !== 1 ? 's' : ''}`;

      const item = document.createElement('div');
      item.className = `result-item ${isWinner ? 'is-winner' : ''}`;

      item.innerHTML = `
        <div class="result-header">
          <span class="result-label">
            ${isWinner ? '<span class="winner-crown-badge">👑</span>' : ''}
            ${this._escHtml(r.option.text)}
            ${isWinner && !winner.isTie ? '<span class="badge badge-amber" style="margin-left:6px">Winner!</span>' : ''}
            ${isWinner && winner.isTie  ? '<span class="badge badge-cyan"  style="margin-left:6px">Tied!</span>'  : ''}
          </span>
          <div class="flex items-center gap-3">
            <span class="result-count">${scoreLabel}</span>
            <span class="result-pct">${r.percentage}%</span>
          </div>
        </div>
        <div class="result-bar-track">
          <div class="result-bar-fill" data-pct="${r.percentage}" style="width:0%"></div>
        </div>
      `;
      list.appendChild(item);
    });

    // Animate bars after next tick
    requestAnimationFrame(() => {
      setTimeout(() => {
        container.querySelectorAll('.result-bar-fill').forEach(bar => {
          bar.style.width = bar.dataset.pct + '%';
        });
      }, 80);
    });
  },

  // ---- Render voter list ----
  renderVoterList(votes, container) {
    if (!container) return;
    if (!votes?.length) {
      container.innerHTML = '<p class="text-muted text-sm text-center" style="padding:16px 0">No votes recorded.</p>';
      return;
    }

    container.innerHTML = votes.slice(0, 50).map(v => `
      <div class="voter-row animate-fade-in">
        <div class="flex items-center gap-3">
          <div class="voter-avatar">${v.isAnonymous ? '🎭' : '👤'}</div>
          <span class="font-medium text-sm">${this._escHtml(v.voterName || 'Anonymous')}</span>
        </div>
        <span class="text-xs text-muted">${UI.timeAgo(v.castedAt)}</span>
      </div>
    `).join('');
  },

  // ---- Safe HTML escape ----
  _escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }
};
