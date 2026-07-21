// =====================================================
// VOTESPACE — App Bootstrap / URL Helpers
// js/app.js
// =====================================================

const App = {

  // ---- URL helpers ----
  getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  },

  go(page, params = {}) {
    const url = new URL(page, window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/'));
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    window.location.href = url.toString();
  },

  buildUrl(page, params = {}) {
    const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
    const url  = new URL(page, base);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return url.toString();
  },

  // ---- Countdown timer helper ----
  startCountdown(poll, displayEl, onExpire) {
    if (!poll.expiresAt) return null;
    const update = () => {
      const left = UI.timeLeft(poll.expiresAt);
      if (displayEl) displayEl.textContent = left || '—';
      if (left === 'Expired' || left === null) {
        clearInterval(interval);
        if (onExpire) onExpire();
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return interval;
  },

  // ---- Join-code normalisation ----
  normaliseCode(raw) {
    return (raw || '').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6);
  }
};
