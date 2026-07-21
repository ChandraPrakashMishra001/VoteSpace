// =====================================================
// VOTESPACE — UI Helpers
// js/ui.js
// =====================================================

const UI = {

  // ---- TOAST ----
  toast(message, type = 'info', duration = 3800) {
    const icons = { success:'✅', error:'❌', info:'💬', warning:'⚠️' };
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-slide-right`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || '💬'}</span>
      <span class="toast-message">${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('hide');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, duration);
  },

  // ---- MODAL ----
  showModal({ title, body, actions = [], closeOnBackdrop = true } = {}) {
    const actionsHtml = actions.map(a =>
      `<button id="${a.id || ''}" class="btn ${a.cls || 'btn-glass'}">${a.label}</button>`
    ).join('');

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'vs-modal';
    overlay.innerHTML = `
      <div class="modal">
        <h3 class="modal-title">${title || ''}</h3>
        <p class="modal-body">${body || ''}</p>
        <div class="modal-actions">${actionsHtml}</div>
      </div>
    `;
    if (closeOnBackdrop) {
      overlay.addEventListener('click', e => { if (e.target === overlay) this.hideModal(); });
    }
    document.body.appendChild(overlay);

    // bind action callbacks
    actions.forEach(a => {
      if (a.id && a.onClick) {
        const btn = overlay.querySelector(`#${a.id}`);
        if (btn) btn.addEventListener('click', () => a.onClick());
      }
    });
    return overlay;
  },

  hideModal() {
    const overlay = document.getElementById('vs-modal');
    if (!overlay) return;
    overlay.classList.add('animate-fade-out');
    overlay.addEventListener('animationend', () => overlay.remove(), { once: true });
  },

  // ---- CONFETTI ----
  showConfetti(duration = 3200) {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    const colors = ['#7c3aed','#06b6d4','#e879f9','#f59e0b','#10b981','#f1f5f9','#ef4444'];
    for (let i = 0; i < 90; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      const color    = colors[Math.floor(Math.random() * colors.length)];
      const left     = Math.random() * 100;
      const animDur  = 1.8 + Math.random() * 2;
      const delay    = Math.random() * 1.2;
      const size     = 6 + Math.random() * 9;
      const isCircle = Math.random() > 0.5;
      piece.style.cssText = `
        left:${left}%;
        width:${size}px; height:${size}px;
        background:${color};
        animation-duration:${animDur}s;
        animation-delay:${delay}s;
        border-radius:${isCircle ? '50%' : '2px'};
        transform:rotate(${Math.random()*360}deg);
      `;
      container.appendChild(piece);
    }
    setTimeout(() => container.remove(), duration + 1500);
  },

  // ---- COPY ----
  async copyToClipboard(text, btnEl = null) {
    try {
      await navigator.clipboard.writeText(text);
      if (btnEl) {
        const orig = btnEl.textContent;
        btnEl.textContent = '✓ Copied!';
        btnEl.classList.add('copied');
        setTimeout(() => { btnEl.textContent = orig; btnEl.classList.remove('copied'); }, 2200);
      }
      this.toast('Copied to clipboard!', 'success', 2000);
    } catch {
      this.toast('Copy failed — try manually', 'error');
    }
  },

  // ---- LOADING STATE ON BUTTON ----
  setLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn._html = btn.innerHTML;
      btn.innerHTML = '<span class="spinner spinner-sm"></span>';
      btn.disabled = true;
    } else {
      if (btn._html !== undefined) btn.innerHTML = btn._html;
      btn.disabled = false;
    }
  },

  // ---- DATE FORMATTING ----
  timeAgo(timestamp) {
    if (!timestamp) return '';
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = (Date.now() - d) / 1000;
    if (diff < 60)    return 'just now';
    if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  },

  timeLeft(expiresAt) {
    if (!expiresAt) return null;
    const end  = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
    const diff = (end - Date.now()) / 1000;
    if (diff <= 0) return 'Expired';
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = Math.floor(diff % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  },

  formatDate(timestamp) {
    if (!timestamp) return '';
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  },

  // ---- ANIMATED COUNTER ----
  animateCounter(el, target, duration = 1100) {
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3); // ease-out-cubic
      el.textContent = Math.round(start + (target - start) * e);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },

  // ---- SKELETON GRID ----
  skeletonGrid(count = 3) {
    return Array(count).fill('<div class="skeleton skeleton-card"></div>').join('');
  }
};
