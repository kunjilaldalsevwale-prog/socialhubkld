/* ============================================================
   FIREBASE REAL-TIME SYNC
   Free plan supports unlimited reads/writes for small teams.
   
   SETUP STEPS (one-time, 10 minutes):
   1. Go to https://console.firebase.google.com
   2. Click "Create project" → name it "socialhub-yourteam"
   3. Click "Build" → "Realtime Database" → "Create database"
   4. Start in TEST mode (you'll secure it later)
   5. Click "Project settings" (gear icon) → "Your apps" → </>
   6. Register app → copy the firebaseConfig object
   7. Replace the FIREBASE_CONFIG below with your config
   8. Done! All 7 members will now sync in real-time.
   ============================================================ */

const FIREBASE_CONFIG = {
  // REPLACE THIS with your Firebase project config
  // Get it from: Firebase Console → Project Settings → Your apps → Web app
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  databaseURL:       "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId:         "YOUR_PROJECT",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
};

// Is Firebase configured?
const FIREBASE_READY = FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY";

/* ── SYNC STATE ────────────────────────────────────────────── */
let   _db            = null;
let   _syncRef       = null;
let   _syncEnabled   = false;
let   _lastPushTime  = 0;
let   _pushTimer     = null;
const SYNC_DEBOUNCE  = 1200; // ms — batch rapid changes

/* ── INIT ──────────────────────────────────────────────────── */
function initSync() {
  if (!FIREBASE_READY) {
    console.log('Firebase not configured — running in local mode');
    _showSyncBanner('local');
    return;
  }
  try {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    _db       = firebase.database();
    _syncRef  = _db.ref('socialhub/sharedState');
    _syncEnabled = true;
    _startListening();
    _showSyncBanner('connected');
    console.log('✅ Firebase sync connected');
  } catch(e) {
    console.warn('Firebase init failed:', e);
    _showSyncBanner('error');
  }
}

/* ── LISTEN FOR CHANGES FROM OTHER USERS ───────────────────── */
function _startListening() {
  if (!_syncRef) return;

  _syncRef.on('value', snapshot => {
    const remote = snapshot.val();
    if (!remote) return;

    // Ignore if we just pushed this data ourselves (within 2s)
    if (Date.now() - _lastPushTime < 2000) return;

    // Merge remote state — preserve local user session
    const localUser = currentUser;
    const merged = {
      ...state,
      posts:           remote.posts           || state.posts,
      emailCampaigns:  remote.emailCampaigns  || state.emailCampaigns,
      ads:             remote.ads             || state.ads,
      ideas:           remote.ideas           || state.ideas,
      monthlyPlans:    remote.monthlyPlans    || state.monthlyPlans,
      reminders:       remote.reminders       || state.reminders,
      customerLists:   remote.customerLists   || state.customerLists,
      googleAds:       remote.googleAds       || state.googleAds,
      teamPermissions: remote.teamPermissions || state.teamPermissions,
      teamPasswords:   remote.teamPasswords   || state.teamPasswords,
      settings:        remote.settings        || state.settings,
      notes:           remote.notes           || state.notes,
    };

    // Update state
    Object.assign(state, merged);

    // Re-render current view
    _rerenderCurrentView();

    // Show sync indicator
    _flashSyncIndicator();
  });

  // Connection status
  _db.ref('.info/connected').on('value', snap => {
    _showSyncBanner(snap.val() ? 'connected' : 'offline');
  });
}

/* ── PUSH STATE TO FIREBASE ────────────────────────────────── */
function syncPush() {
  if (!_syncEnabled || !_syncRef) return;

  // Debounce — don't push on every keystroke
  clearTimeout(_pushTimer);
  _pushTimer = setTimeout(_doPush, SYNC_DEBOUNCE);
}

function _doPush() {
  if (!_syncRef) return;
  _lastPushTime = Date.now();

  // Only sync shared data — not media blobs (too large)
  const shared = {
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
    _lastEditor:     currentUser ? currentUser.name : 'Unknown',
    _lastEditTime:   Date.now(),
  };

  _syncRef.set(shared)
    .then(() => _flashSyncIndicator(true))
    .catch(e => { console.warn('Sync push failed:', e); _showSyncBanner('error'); });
}

/* ── RE-RENDER CURRENT VIEW ─────────────────────────────────── */
function _rerenderCurrentView() {
  const renders = {
    channels: renderChannelCalendars, email: renderEmail,
    whatsapp: renderWhatsApp, meta: renderMetaAds,
    media: renderMediaLibrary, ideas: renderIdeasBoard,
    agenda: renderMonthlyPlanner, reminders: renderReminders,
    analytics: renderAnalytics, team: renderTeam,
  };
  const fn = renders[currentView];
  if (fn) try { fn(); } catch(e) {}
}

/* ── UI INDICATORS ─────────────────────────────────────────── */
function _showSyncBanner(status) {
  const el = document.getElementById('syncStatusBar');
  if (!el) return;

  const configs = {
    connected: { bg:'#ECFDF5', border:'#6EE7B7', color:'#065F46', text:'☁️ Live sync on — all team changes sync in real-time', dot:'#10B981' },
    local:     { bg:'#FFFBEB', border:'#FCD34D', color:'#92400E', text:'📴 Local mode — configure Firebase for team sync', dot:'#F59E0B' },
    offline:   { bg:'#FEF2F2', border:'#FCA5A5', color:'#991B1B', text:'📡 Offline — reconnecting…', dot:'#EF4444' },
    error:     { bg:'#FEF2F2', border:'#FCA5A5', color:'#991B1B', text:'⚠️ Sync error — check Firebase config', dot:'#EF4444' },
  };
  const cfg = configs[status] || configs.local;
  el.style.cssText = `display:flex;align-items:center;gap:8px;padding:7px 14px;background:${cfg.bg};border-bottom:1.5px solid ${cfg.border};font-size:11px;font-weight:600;color:${cfg.color}`;
  el.innerHTML = `<span style="width:7px;height:7px;border-radius:50%;background:${cfg.dot};flex-shrink:0;${status==='connected'?'animation:pulse 2s infinite':''}"></span>${cfg.text}
    ${status==='local'?`<a onclick="openSyncSetupModal()" style="margin-left:auto;color:var(--brand);font-weight:700;cursor:pointer;text-decoration:underline">Set up →</a>`:''}`;
}

function _flashSyncIndicator(isPush) {
  const el = document.getElementById('syncIndicator');
  if (!el) return;
  el.style.opacity = '1';
  el.textContent = isPush ? '↑ Saved' : '↓ Updated';
  el.style.color = isPush ? 'var(--green)' : 'var(--brand)';
  setTimeout(() => { el.style.opacity = '0'; }, 2000);
}

/* ── SETUP MODAL ─────────────────────────────────────────────── */
function openSyncSetupModal() {
  document.getElementById('modalTitle').textContent = '☁️ Set up Team Sync (Firebase)';
  document.getElementById('modalBody').innerHTML = `
    <div style="background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border-radius:var(--r-lg);padding:16px;margin-bottom:16px;text-align:center">
      <div style="font-size:28px;margin-bottom:6px">☁️</div>
      <div style="font-size:14px;font-weight:800;color:var(--text)">Free real-time sync for your entire team</div>
      <div style="font-size:12px;color:var(--text3);margin-top:4px">Firebase free plan — no credit card needed</div>
    </div>

    <div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:12px">Setup steps (10 minutes, one-time):</div>
    ${[
      ['Go to Firebase Console','<a href="https://console.firebase.google.com" target="_blank" style="color:var(--brand);font-weight:700">console.firebase.google.com</a> → Sign in with Google'],
      ['Create project',"Click \"Add project\" → Name it anything (e.g. \"socialhub-team\") → Continue"],
      ['Create database',"Build → Realtime Database → Create database → Start in TEST mode → Done"],
      ['Get config',"Project settings (⚙ gear) → Your apps → Click </> → Register app → Copy the <code>firebaseConfig</code> object"],
      ['Paste config',"Open <code>js/sync.js</code> in any text editor → replace the <code>FIREBASE_CONFIG</code> block at the top with your config"],
      ['Deploy on Netlify',"Drag your <code>socialhub</code> folder to <a href='https://app.netlify.com/drop' target='_blank' style='color:var(--brand)'>app.netlify.com/drop</a> → get a shareable URL → send to all 7 team members"],
    ].map(([title,desc],i)=>`
      <div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="width:24px;height:24px;border-radius:50%;background:var(--brand);color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">${i+1}</div>
        <div><div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:3px">${title}</div><div style="font-size:12px;color:var(--text2);line-height:1.6">${desc}</div></div>
      </div>`).join('')}

    <div style="margin-top:14px;padding:12px;background:var(--green-light);border-radius:var(--r-lg);font-size:12px;color:var(--green)">
      ✅ Once done, all 7 team members see the same posts, ideas, and calendar in real-time — from any device, any browser.
    </div>`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Close</button>
    <button class="btn btn-primary" onclick="window.open('https://console.firebase.google.com','_blank');closeModal()">Open Firebase →</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}
