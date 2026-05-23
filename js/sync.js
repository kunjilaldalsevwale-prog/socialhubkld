/* ============================================================
   FIREBASE REALTIME DATABASE SYNC
   Project: socialhubkld
   All 7 team members share the same data in real-time
   ============================================================ */

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCazqp3np3B5ZXQAppBRBvGad-pdsIx5ko",
  authDomain:        "socialhubkld.firebaseapp.com",
  databaseURL:       "https://socialhubkld-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "socialhubkld",
  storageBucket:     "socialhubkld.firebasestorage.app",
  messagingSenderId: "306827234211",
  appId:             "1:306827234211:web:b792c5685be6f99eabe816"
};

let _db          = null;
let _syncRef     = null;
let _syncEnabled = false;
let _pushTimer   = null;
let _lastPush    = 0;

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */
function initSync() {
  // Wait for Firebase SDK to be available
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK not loaded yet — retrying in 500ms');
    setTimeout(initSync, 500);
    return;
  }
  try {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    _db       = firebase.database();
    _syncRef  = _db.ref('socialhub/state');
    _syncEnabled = true;
    _startListening();
    _showBanner('connecting');
    console.log('✅ Firebase initialised');
  } catch(e) {
    console.warn('Firebase init error:', e);
    _showBanner('error');
  }
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
    if (Date.now() - _lastPush < 3000) return; // ignore our own push

    const fields = ['posts','emailCampaigns','ads','ideas','monthlyPlans',
                    'reminders','customerLists','googleAds','teamPermissions',
                    'teamPasswords','settings','notes','attachedDocs',
                    'mediaLibrary','mediaFolders'];

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
    }
  });
}

/* ══════════════════════════════════════════════════════════
   PUSH — send our changes to Firebase
══════════════════════════════════════════════════════════ */
function syncPush() {
  if (!_syncEnabled) return;
  clearTimeout(_pushTimer);
  _pushTimer = setTimeout(_doPush, 1500);
}

function _doPush() {
  if (!_syncRef) return;
  _lastPush = Date.now();

  const data = {
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
    mediaLibrary:    (state.mediaLibrary||[]).map(m=>({
      // Only sync metadata + cloudinary/drive URLs, never base64
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

  _syncRef.set(data)
    .then(() => _flash('↑ Saved', '#10B981'))
    .catch(e => { console.warn('Push failed:', e); _showBanner('offline'); });
}

/* ══════════════════════════════════════════════════════════
   UI
══════════════════════════════════════════════════════════ */
function _showBanner(status) {
  const el = document.getElementById('syncStatusBar');
  if (!el) return;
  const map = {
    connected:  ['#ECFDF5','#6EE7B7','#065F46','#10B981','☁️ Firebase connected — all changes sync in real-time across all devices', true],
    connecting: ['#EFF6FF','#93C5FD','#1D4ED8','#3B82F6','☁️ Connecting to Firebase…', false],
    offline:    ['#FEF2F2','#FCA5A5','#991B1B','#EF4444','📡 Offline — changes saved locally, will sync when reconnected', false],
    error:      ['#FEF2F2','#FCA5A5','#991B1B','#EF4444','⚠️ Firebase error — check console', false],
  };
  const [bg,border,color,dot,text,pulse] = map[status]||map.offline;
  el.style.cssText = `display:flex;align-items:center;gap:8px;padding:7px 16px;background:${bg};border-bottom:1.5px solid ${border};font-size:11px;font-weight:600;color:${color}`;
  el.innerHTML = `<span style="width:7px;height:7px;border-radius:50%;background:${dot};flex-shrink:0;${pulse?'animation:pulse 2s infinite':''}"></span>${text}`;
}

function _flash(msg, color) {
  const el = document.getElementById('syncIndicator');
  if (!el) return;
  el.textContent = msg; el.style.color = color; el.style.opacity = '1';
  setTimeout(() => el.style.opacity = '0', 2500);
}

function _rerender() {
  const map = {
    channels:renderChannelCalendars, email:renderEmail,
    whatsapp:renderWhatsApp, meta:renderMetaAds,
    ideas:renderIdeasBoard, agenda:renderMonthlyPlanner,
    reminders:renderReminders, team:renderTeam,
    media:renderMediaLibrary,
  };
  try { if (map[currentView]) map[currentView](); } catch(e) {}
}

function openSyncSetupModal() {
  showToast('✅ Firebase is already connected!', 'success');
}
