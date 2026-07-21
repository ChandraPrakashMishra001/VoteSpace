// =====================================================
// VOTESPACE — Firebase Data Layer
// js/store.js
// =====================================================

const Store = {

  // =============================================
  // POLLS (Firestore)
  // =============================================

  async createPoll(data) {
    const ref = db.collection('polls').doc();
    const poll = {
      ...data,
      id: ref.id,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      totalVotes: 0,
      status: 'active'
    };
    await ref.set(poll);
    return poll;
  },

  async getPollById(pollId) {
    const doc = await db.collection('polls').doc(pollId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  async getPollByCode(code) {
    const snap = await db.collection('polls')
      .where('code', '==', code.toUpperCase().trim())
      .limit(1)
      .get();
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  },

  async closePoll(pollId) {
    await db.collection('polls').doc(pollId).update({
      status: 'closed',
      closedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  },

  // Real-time listener on a poll document
  onPollUpdate(pollId, callback) {
    return db.collection('polls').doc(pollId)
      .onSnapshot(doc => {
        if (doc.exists) callback({ id: doc.id, ...doc.data() });
      });
  },

  // =============================================
  // VOTES (Firestore subcollection)
  // =============================================

  async castVote(pollId, voteData) {
    const batch   = db.batch();
    const voteRef = db.collection('polls').doc(pollId).collection('votes').doc();
    const pollRef = db.collection('polls').doc(pollId);

    batch.set(voteRef, {
      ...voteData,
      castedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    batch.update(pollRef, {
      totalVotes: firebase.firestore.FieldValue.increment(1)
    });

    await batch.commit();
    return voteRef.id;
  },

  async getVotes(pollId) {
    const snap = await db.collection('polls').doc(pollId).collection('votes')
      .orderBy('castedAt', 'desc')
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // Real-time listener on votes subcollection
  onVotesUpdate(pollId, callback) {
    return db.collection('polls').doc(pollId).collection('votes')
      .onSnapshot(snap => {
        const votes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(votes);
      });
  },

  // =============================================
  // MY POLLS (localStorage — just IDs + metadata)
  // =============================================

  saveMyPoll(poll, creatorToken) {
    const list = this.getMyPollsList();
    // avoid duplicates
    const deduped = list.filter(p => p.id !== poll.id);
    deduped.unshift({
      id:           poll.id,
      code:         poll.code,
      title:        poll.title,
      type:         poll.type,
      savedAt:      Date.now(),
      creatorToken
    });
    localStorage.setItem('vs_mypolls', JSON.stringify(deduped.slice(0, 50)));
  },

  getMyPollsList() {
    try { return JSON.parse(localStorage.getItem('vs_mypolls') || '[]'); }
    catch { return []; }
  },

  getCreatorToken(pollId) {
    const entry = this.getMyPollsList().find(p => p.id === pollId);
    return entry?.creatorToken || null;
  },

  isCreator(pollId, creatorTokenToCheck) {
    const stored = this.getCreatorToken(pollId);
    return !!(stored && stored === creatorTokenToCheck);
  },

  // =============================================
  // VOTED TRACKING (localStorage)
  // =============================================

  markVoted(pollId) {
    const v = this._getVoted();
    v[pollId] = Date.now();
    localStorage.setItem('vs_voted', JSON.stringify(v));
  },

  hasVoted(pollId) {
    return !!this._getVoted()[pollId];
  },

  _getVoted() {
    try { return JSON.parse(localStorage.getItem('vs_voted') || '{}'); }
    catch { return {}; }
  },

  // =============================================
  // VOTER IDENTITY (stable anonymous fingerprint)
  // =============================================

  getVoterId() {
    let id = localStorage.getItem('vs_voter_id');
    if (!id) {
      id = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('vs_voter_id', id);
    }
    return id;
  }
};
