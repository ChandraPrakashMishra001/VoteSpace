// =====================================================
// VOTESPACE — Vote Logic & Drag-Drop
// js/vote.js
// =====================================================

const Vote = {
  poll: null,
  selectedOptions: [],
  rankOrder: [],      // [optId, optId, ...] in user's chosen order

  // ---- Initialise for a given poll ----
  init(poll) {
    this.poll = poll;
    this.selectedOptions = [];
    this.rankOrder = poll.options ? poll.options.map(o => o.id) : [];
  },

  // ---- Toggle selection (single / multiple / yesno) ----
  toggle(optId, type) {
    if (type === 'single' || type === 'yesno') {
      this.selectedOptions = [optId];
    } else {
      const idx = this.selectedOptions.indexOf(optId);
      if (idx === -1) this.selectedOptions.push(optId);
      else            this.selectedOptions.splice(idx, 1);
    }
    this._syncUI(type);
  },

  _syncUI(type) {
    if (type === 'yesno') {
      document.querySelectorAll('.yesno-card').forEach(c => {
        c.classList.remove('selected-yes', 'selected-no');
        if (this.selectedOptions.includes(c.dataset.optId)) {
          c.classList.add(c.dataset.optId === 'yes' ? 'selected-yes' : 'selected-no');
        }
      });
    } else {
      document.querySelectorAll('.option-card').forEach(c => {
        const sel = this.selectedOptions.includes(c.dataset.optId);
        c.classList.toggle('selected', sel);
      });
    }
    this._updateSubmitBtn();
  },

  _updateSubmitBtn() {
    const btn = document.getElementById('submit-vote-btn');
    if (!btn) return;
    btn.disabled = !this.isValid();
  },

  // ---- Validity check ----
  isValid() {
    if (!this.poll) return false;
    if (this.poll.type === 'ranked') return this.rankOrder.length > 0;
    return this.selectedOptions.length > 0;
  },

  // ---- Build vote payload ----
  getVoteData(voterName) {
    const name = voterName?.trim() || '';
    const data = {
      voterId:     Store.getVoterId(),
      voterName:   name || 'Anonymous',
      isAnonymous: !name
    };

    if (this.poll.type === 'ranked') {
      data.rankings = {};
      this.rankOrder.forEach((id, idx) => { data.rankings[id] = idx + 1; });
      data.choices = [...this.rankOrder];
    } else {
      data.choices = [...this.selectedOptions];
    }

    return data;
  },

  // ============================================
  // DRAG & DROP — Ranked voting
  // ============================================
  initDragDrop(listId = 'ranked-options-list') {
    // Use a small delay so the DOM is painted first
    setTimeout(() => this._bindDragDrop(listId), 120);
  },

  _bindDragDrop(listId) {
    const list = document.getElementById(listId);
    if (!list) return;

    let dragging = null;

    const items = () => [...list.querySelectorAll('.option-card[draggable="true"]')];

    items().forEach(item => {
      item.addEventListener('dragstart', e => {
        dragging = item;
        requestAnimationFrame(() => item.classList.add('dragging'));
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.dataset.optId);
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        list.querySelectorAll('.option-card').forEach(c => c.classList.remove('drag-over'));
        dragging = null;
        this._syncRankLabels(list);
        this.rankOrder = items().map(c => c.dataset.optId);
      });

      item.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (item === dragging) return;
        list.querySelectorAll('.option-card').forEach(c => c.classList.remove('drag-over'));
        item.classList.add('drag-over');
      });

      item.addEventListener('dragleave', () => item.classList.remove('drag-over'));

      item.addEventListener('drop', e => {
        e.preventDefault();
        item.classList.remove('drag-over');
        if (!dragging || dragging === item) return;

        const allItems = items();
        const srcIdx  = allItems.indexOf(dragging);
        const dstIdx  = allItems.indexOf(item);

        if (srcIdx < dstIdx) list.insertBefore(dragging, item.nextSibling);
        else                  list.insertBefore(dragging, item);
      });
    });

    // Touch fallback — simple up/down buttons
    this._addUpDownButtons(list);
  },

  _syncRankLabels(list) {
    list.querySelectorAll('.rank-number').forEach((el, i) => {
      el.textContent = `#${i + 1}`;
    });
  },

  // Mobile-friendly up/down move buttons inside each ranked card
  _addUpDownButtons(list) {
    list.querySelectorAll('.option-card[draggable]').forEach(item => {
      // already added?
      if (item.querySelector('.rank-move-btns')) return;

      const wrap = document.createElement('div');
      wrap.className = 'rank-move-btns';
      wrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;';

      const makeBtn = (label, delta) => {
        const b = document.createElement('button');
        b.textContent = label;
        b.title = delta < 0 ? 'Move up' : 'Move down';
        b.style.cssText = `
          background:var(--glass-bg-hover);border:1px solid var(--glass-border);
          border-radius:4px;color:var(--text-secondary);font-size:0.65rem;
          padding:1px 5px;cursor:pointer;line-height:1.4;
        `;
        b.addEventListener('click', e => {
          e.stopPropagation();
          const items = [...list.querySelectorAll('.option-card[draggable]')];
          const idx = items.indexOf(item);
          const target = items[idx + delta];
          if (!target) return;
          if (delta < 0) list.insertBefore(item, target);
          else           list.insertBefore(target, item);
          this._syncRankLabels(list);
          this.rankOrder = [...list.querySelectorAll('.option-card[draggable]')].map(c => c.dataset.optId);
        });
        return b;
      };

      wrap.appendChild(makeBtn('▲', -1));
      wrap.appendChild(makeBtn('▼',  1));
      item.appendChild(wrap);
    });
  }
};
