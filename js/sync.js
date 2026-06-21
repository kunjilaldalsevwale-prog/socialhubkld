/* ============================================================
   FIREBASE SYNC — Real-time sync across all team members
   ============================================================ */

let _syncRef     = null;
let _syncEnabled = false;
let _pushTimer   = null;
let _lastPush    = 0;

const FIREBASE_CONFIG = {
  apiKey:      'AIzaSyCazqp3np3B5ZXQAppBRBvGad-pdsIx5ko',
  databaseURL: 'https://socialhubkld-default-rtdb.asia-southeast1.firebasedatabase.app',
};

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */
function initSync() {
  // Force push before tab closes
  window.addEventListener('beforeunload', () => {
    if (_syncRef && _syncEnabled) {
      const data = _buildPushData();
      _syncRef.set(data);
    }
  });

  let attempts = 0;
  const tryInit = () => {
    if (typeof firebase === 'undefined') {
      if (attempts++ < 20) setTimeout(tryInit, 300);
      return;
    }
    try {
      if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      _syncRef     = firebase.database().ref('socialhub/state');
      _syncEnabled = true;
      _startListening();
      console.log('✅ Firebase initialised');
    } catch(e) {
      console.warn('Firebase init error:', e);
      _showBanner('offline');
    }
  };
  tryInit();
}

/* ══════════════════════════════════════════════════════════
   LISTEN — real-time updates from other users
══════════════════════════════════════════════════════════ */
function _startListening() {
  if (!_syncRef) return;

  // Connection status
  firebase.database().ref('.info/connected').on('value', snap => {
    _showBanner(snap.val() ? 'connected' : 'offline');
  });

  // Data changes
  _syncRef.on('value', snap => {
    const remote = snap.val();
    if (!remote) return;
    if (Date.now() - _lastPush < 800) return; // ignore our own push

    const fields = [
      'posts','emailCampaigns','ads','ideas','monthlyPlans',
      'reminders','customerLists','googleAds','teamPermissions',
      'teamPasswords','settings','notes',
      'mediaLibrary','mediaFolders','ideaFolders',
      'activityLog','attachedDocs'
    ];

    let changed = false;
    fields.forEach(f => {
      if (remote[f] !== undefined &&
          JSON.stringify(remote[f]) !== JSON.stringify(state[f])) {
        state[f] = remote[f];
        changed  = true;
      }
    });

    if (changed) {
      DB.save(state);
      _rerender();
      _flash('↓ Updated', '#2563EB');
      // Re-render current view with fresh data
      if (typeof currentView !== 'undefined') {
        if (currentView === 'ideas'    && typeof renderIdeasBoard     === 'function') renderIdeasBoard();
        if (currentView === 'agenda'   && typeof renderMonthlyPlanner === 'function') renderMonthlyPlanner();
        if (currentView === 'channels' && typeof renderChannelGrid    === 'function') renderChannelGrid();
        if (currentView === 'media'    && typeof renderMediaLibrary   === 'function') renderMediaLibrary();
        if (currentView === 'home'     && typeof renderHomePage       === 'function') renderHomePage();
      }
      // Always refresh docs panel
      if (typeof renderAttachedDocs === 'function') renderAttachedDocs();
    }
  });
}

/* ══════════════════════════════════════════════════════════
   PUSH — send our changes to Firebase
══════════════════════════════════════════════════════════ */
function syncPush() {
  if (!_syncEnabled) return;
  clearTimeout(_pushTimer);
  _pushTimer = setTimeout(_doPush, 300);
}

function _buildPushData() {
  return {
    posts:           state.posts           || [],
    emailCampaigns:  state.emailCampaigns  || [],
    ads:             state.ads             || [],
    ideas:           state.ideas           || [],
    monthlyPlans:    state.monthlyPlans    || {},
    reminders:       state.reminders       || [],
    customerLists:   state.customerLists   || [],
    googleAds:       state.googleAds       || [],
    teamPermissions: state.teamPermissions || {},
    teamPasswords:   state.teamPasswords   || {},
    settings:        state.settings        || {},
    notes:           state.notes           || '',
    attachedDocs:    state.attachedDocs    || [],
    ideaFolders:     state.ideaFolders     || [],
    activityLog:     state.activityLog     || [],
    mediaLibrary:    (state.mediaLibrary||[]).map(m=>({
      id:m.id, name:m.name, type:m.type, size:m.size,
      tags:m.tags||[], date:m.date, source:m.source,
      folderId: m.folderId||null,
      url:   (m.source==='cloudinary'||m.source==='drive') ? m.url   : null,
      thumb: (m.source==='cloudinary'||m.source==='drive') ? m.thumb : null,
    })),
    mediaFolders:    state.mediaFolders    || [],
    _editor:         currentUser ? currentUser.name : 'Unknown',
    _time:           Date.now(),
  };
}

function _doPush() {
  if (!_syncRef) return;
  _lastPush = Date.now();
  _syncRef.set(_buildPushData())
    .then(() => _flash('↑ Saved', '#10B981'))
    .catch(e => { console.warn('Push failed:', e); _showBanner('offline'); });
}

/* ══════════════════════════════════════════════════════════
   UI HELPERS
══════════════════════════════════════════════════════════ */
function _showBanner(status) {
  let bar = document.getElementById('syncStatusBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'syncStatusBar';
    bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;font-size:11px;font-weight:700;text-align:center;padding:4px;transition:all .3s';
    document.body.appendChild(bar);
  }
  const styles = {
    connected:  { bg:'transparent', color:'transparent', text:'' },
    offline:    { bg:'#FEF2F2', color:'#991B1B', text:'⚠️ Offline — changes saved locally' },
    connecting: { bg:'#FEF9C3', color:'#92400E', text:'⏳ Connecting…' },
    error:      { bg:'#FEF2F2', color:'#991B1B', text:'❌ Sync error' },
  };
  const s = styles[status] || styles.connecting;
  bar.style.background = s.bg;
  bar.style.color      = s.color;
  bar.textContent      = s.text;
}

function _flash(msg, color) {
  const el = document.getElementById('syncIndicator');
  if (!el) return;
  el.textContent = msg;
  el.style.color = color;
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 2000);
}

function _rerender() {
  if (typeof updateBadge        === 'function') updateBadge();
  if (typeof renderSidebarIdeas === 'function') renderSidebarIdeas();
}
