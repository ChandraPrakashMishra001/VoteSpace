// =====================================================
// VOTESPACE — Poll Utilities
// js/polls.js
// =====================================================

const Polls = {

  TYPES: {
    single:   { label:'Single Choice',   icon:'⚡', desc:'Pick exactly one option' },
    multiple: { label:'Multiple Choice', icon:'☑️',  desc:'Select all that apply' },
    ranked:   { label:'Ranked Order',    icon:'🏆', desc:'Drag to rank your preference' },
    yesno:    { label:'Yes / No',        icon:'👍', desc:'Classic binary decision' }
  },

  // --- ID / Code generators ---
  generateCode() {
    // Excludes visually confusing chars (0,O,1,I,l)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  },

  generateCreatorToken() {
    return 'ct_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  },

  // --- Validation ---
  validate({ title, type, options }) {
    const errors = [];
    if (!title?.trim())          errors.push('Poll title is required.');
    if (title?.trim().length > 200) errors.push('Title must be 200 chars or fewer.');
    if (!this.TYPES[type])       errors.push('Please select a valid poll type.');
    if (type !== 'yesno') {
      const filled = (options || []).filter(o => o?.trim());
      if (filled.length < 2)  errors.push('Add at least 2 options.');
      if (filled.length > 10) errors.push('Maximum 10 options allowed.');
    }
    return { valid: errors.length === 0, errors };
  },

  // --- Build options array ---
  buildOptions(type, rawOptions = []) {
    if (type === 'yesno') {
      return [
        { id: 'yes', text: '👍  Yes' },
        { id: 'no',  text: '👎  No'  }
      ];
    }
    return rawOptions
      .filter(o => o?.trim())
      .map(text => ({ id: this.generateId(), text: text.trim() }));
  },

  // --- Status helpers ---
  isExpired(poll) {
    if (!poll.expiresAt) return false;
    const exp = poll.expiresAt.toDate ? poll.expiresAt.toDate() : new Date(poll.expiresAt);
    return Date.now() > exp.getTime();
  },

  isClosed(poll) {
    return poll.status === 'closed' || this.isExpired(poll);
  },

  statusBadge(poll) {
    if (this.isClosed(poll)) return { text: 'Closed', cls: 'badge-red' };
    return { text: 'Active', cls: 'badge-emerald' };
  },

  typeBadge(type) {
    const t = this.TYPES[type];
    return t ? `${t.icon} ${t.label}` : type;
  },

  // --- Timer conversion ---
  expiryTimestamp(hours) {
    if (!hours || hours <= 0) return null;
    return new Date(Date.now() + hours * 3600 * 1000);
  }
};
