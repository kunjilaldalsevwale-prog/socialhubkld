/* ============================================================
   SUPABASE REAL-TIME SYNC
   Project: kunjilaldalsevwale-prog's Project
   
   PASTE YOUR VALUES BELOW:
   - SUPABASE_URL: from Settings → API Keys → Project URL
   - SUPABASE_KEY: the sb_publishable_... key (copy icon)
   ============================================================ */

const SUPABASE_URL = 'https://hmnwguaanosjwbrrresv.supabase.co';
const SUPABASE_KEY = 'PASTE_YOUR_PUBLISHABLE_KEY_HERE';

// ── Is Supabase configured? ──────────────────────────────────
const SUPABASE_READY = SUPABASE_KEY !== 'PASTE_YOUR_PUBLISHABLE_KEY_HERE'
                    && SUPABASE_URL.includes('supabase.co');

let _syncEnabled  = false;
let _pushTimer    = null;
let _lastPushTime = 0;
let _pollInterval = null;
const SYNC_DEBOUNCE = 1500; // ms
const POLL_INTERVAL = 8000; // poll every 8 seconds for updates

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */
async function initSync() {
  if (!SUPABASE_READY) {
    console.log('Supabase not configured — running in local mode');
    _showSyncBanner('local');
    return;
  }
  try {
    // Test connection by fetching the row
    const res = await _sbFetch('GET');
    if (res.ok || res.status === 200) {
      _syncEnabled = true;
      _showSyncBanner('connected');
      // Pull latest data on load
      await _pullState();
      // Start polling for other users' changes
      _startPolling();
      console.log('✅ Supabase sync connected');
    } else {
      // Table might not exist yet — create it
      await _initTable();
    }
  } catch(e) {
    console.warn('Supabase init error:', e);
    _showSyncBanner('error');
  }
}

/* ══════════════════════════════════════════════════════════
   DATABASE TABLE SETUP
   Run this SQL in Supabase → SQL Editor → New query:

   CREATE TABLE IF NOT EXISTS socialhub_state (
     id TEXT PRIMARY KEY DEFAULT 'shared',
     data JSONB,
     updated_at TIMESTAMPTZ DEFAULT NOW(),
     updated_by TEXT
   );
   INSERT INTO socialhub_state (id, data) 
   VALUES ('shared', '{}') 
   ON CONFLICT (id) DO NOTHING;

══════════════════════════════════════════════════════════ */
async function _initTable() {
  // Try to create and insert via RPC isn't possible from client
  // Guide user to run the SQL
  _showSyncBanner('setup');
  console.log('Run the SQL setup query in Supabase SQL Editor');
}

/* ══════════════════════════════════════════════════════════
   FETCH HELPERS (Supabase REST API)
══════════════════════════════════════════════════════════ */
async function _sbFetch(method, body) {
  const url = `${SUPABASE_URL}/rest/v1/socialhub_state?id=eq.shared`;
  const opts = {
    method,
    headers: {
      'apikey':        SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type':  'application/json',
      'Prefer':        method === 'POST' ? 'return=minimal' : 'return=representation',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(url, opts);
}

async function _sbUpsert(body) {
  const url = `${SUPABASE_URL}/rest/v1/socialhub_state`;
  return fetch(url, {
    method: 'POST',
    headers: {
      'apikey':        SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type':  'application/json',
      'Prefer':        'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(body),
  });
}

/* ══════════════════════════════════════════════════════════
   PULL (receive other users' changes)
══════════════════════════════════════════════════════════ */
async function _pullState() {
  try {
    const res  = await _sbFetch('GET');
    if (!res.ok) return;
    const rows = await res.json();
    if (!rows || !rows.length || !rows[0].data) return;

    const remote   = rows[0].data;
    const remoteTs = rows[0].updated_at ? new Date(rows[0].updated_at).getTime() : 0;

    // Don't apply if we just pushed (within 3s)
    if (Date.now() - _lastPushTime < 3000) return;

    // Merge shared fields into local state
    const fields = ['posts','emailCampaigns','ads','ideas','monthlyPlans',
                    'reminders','customerLists','googleAds','teamPermissions',
                    'teamPasswords','settings','notes'];
    let changed = false;
    fields.forEach(f => {
      if (remote[f] !== undefined) {
        const remoteStr = JSON.stringify(remote[f]);
        const localStr  = JSON.stringify(state[f]);
        if (remoteStr !== localStr) { state[f] = remote[f]; changed = true; }
      }
    });

    if (changed) {
      DB.save(state);
      _rerenderCurrentView();
      _flashSyncIndicator(false);
    }
  } catch(e) { /* silent — offline */ }
}

/* ══════════════════════════════════════════════════════════
   PUSH (send our changes)
══════════════════════════════════════════════════════════ */
function syncPush() {
  if (!_syncEnabled) return;
  clearTimeout(_pushTimer);
  _pushTimer = setTimeout(_doPush, SYNC_DEBOUNCE);
}

async function _doPush() {
  if (!_syncEnabled) return;
  _lastPushTime = Date.now();

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
  };

  try {
    const res = await _sbUpsert({
      id:         'shared',
      data:       shared,
      updated_at: new Date().toISOString(),
      updated_by: currentUser ? currentUser.name : 'Unknown',
    });
    if (res.ok || res.status === 201) {
      _flashSyncIndicator(true);
      _showSyncBanner('connected');
    } else {
      const err = await res.text();
      if (err.includes('does not exist')) {
        _showSyncBanner('setup');
      }
    }
  } catch(e) {
    _showSyncBanner('offline');
  }
}

/* ══════════════════════════════════════════════════════════
   POLLING (check for other users' changes)
══════════════════════════════════════════════════════════ */
function _startPolling() {
  _pollInterval = setInterval(_pullState, POLL_INTERVAL);
  // Also pull immediately when tab becomes visible again
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) _pullState();
  });
}

/* ══════════════════════════════════════════════════════════
   UI
══════════════════════════════════════════════════════════ */
function _showSyncBanner(status) {
  const el = document.getElementById('syncStatusBar');
  if (!el) return;

  const configs = {
    connected: { bg:'#ECFDF5', border:'#6EE7B7', color:'#065F46',
      text:'☁️ Supabase sync active — all team changes sync automatically', dot:'#10B981', anim:true },
    local:     { bg:'#FFFBEB', border:'#FCD34D', color:'#92400E',
      text:'📴 Local mode — paste your Supabase key in js/sync.js to enable team sync', dot:'#F59E0B' },
    offline:   { bg:'#FEF2F2', border:'#FCA5A5', color:'#991B1B',
      text:'📡 Offline — changes saved locally, will sync when reconnected', dot:'#EF4444' },
    error:     { bg:'#FEF2F2', border:'#FCA5A5', color:'#991B1B',
      text:'⚠️ Sync error — check Supabase key in js/sync.js', dot:'#EF4444' },
    setup:     { bg:'#EFF6FF', border:'#93C5FD', color:'#1D4ED8',
      text:'🔧 Supabase table not set up yet — click to see instructions', dot:'#3B82F6' },
  };

  const cfg = configs[status] || configs.local;
  el.style.cssText = `display:flex;align-items:center;gap:8px;padding:7px 16px;
    background:${cfg.bg};border-bottom:1.5px solid ${cfg.border};
    font-size:11px;font-weight:600;color:${cfg.color};cursor:${status==='setup'?'pointer':'default'}`;
  el.onclick = status === 'setup' ? openSyncSetupModal : null;
  el.innerHTML = `
    <span style="width:7px;height:7px;border-radius:50%;background:${cfg.dot};flex-shrink:0;${cfg.anim?'animation:pulse 2s infinite':''}"></span>
    ${cfg.text}
    ${status === 'local' ? `<button onclick="openSyncSetupModal()" style="margin-left:auto;background:var(--brand);color:#fff;border:none;border-radius:12px;padding:3px 10px;font-size:10px;font-weight:700;cursor:pointer;font-family:var(--font)">Set up →</button>` : ''}
    ${status === 'setup' ? `<span style="margin-left:auto;font-weight:700;text-decoration:underline">View instructions →</span>` : ''}`;
}

function _flashSyncIndicator(isPush) {
  const el = document.getElementById('syncIndicator');
  if (!el) return;
  el.style.opacity = '1';
  el.textContent   = isPush ? '↑ Synced' : '↓ Updated';
  el.style.color   = isPush ? '#10B981' : '#2563EB';
  setTimeout(() => { el.style.opacity = '0'; }, 2500);
}

function _rerenderCurrentView() {
  const renders = {
    channels:renderChannelCalendars, email:renderEmail, whatsapp:renderWhatsApp,
    meta:renderMetaAds, media:renderMediaLibrary, ideas:renderIdeasBoard,
    agenda:renderMonthlyPlanner, reminders:renderReminders, team:renderTeam,
  };
  const fn = renders[currentView];
  if (fn) try { fn(); } catch(e) {}
}

/* ══════════════════════════════════════════════════════════
   SETUP MODAL
══════════════════════════════════════════════════════════ */
function openSyncSetupModal() {
  document.getElementById('modalTitle').textContent = '☁️ Supabase Sync Setup';
  document.getElementById('modalBody').innerHTML = `

    <div style="background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border-radius:var(--r-lg);padding:16px;margin-bottom:16px;text-align:center">
      <div style="font-size:24px;margin-bottom:6px">☁️</div>
      <div style="font-size:14px;font-weight:800;color:var(--text)">Enable real-time sync for your team</div>
      <div style="font-size:12px;color:var(--text3);margin-top:3px">Supabase free plan — no credit card needed</div>
    </div>

    <div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:10px">Step 1 — Run this SQL in Supabase</div>
    <div style="background:#0F172A;border-radius:var(--r-lg);padding:14px;margin-bottom:14px;position:relative">
      <pre id="sqlBlock" style="font-family:var(--font-mono);font-size:11px;color:#E2E8F0;line-height:1.7;margin:0;white-space:pre-wrap">CREATE TABLE IF NOT EXISTS socialhub_state (
  id TEXT PRIMARY KEY DEFAULT 'shared',
  data JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);
INSERT INTO socialhub_state (id, data)
VALUES ('shared', '{}')
ON CONFLICT (id) DO NOTHING;</pre>
      <button onclick="navigator.clipboard.writeText(document.getElementById('sqlBlock').textContent).then(()=>showToast('SQL copied!','success'))"
        style="position:absolute;top:10px;right:10px;background:#1E40AF;color:#fff;border:none;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer">
        📋 Copy
      </button>
    </div>
    <div style="font-size:12px;color:var(--text2);line-height:1.7;margin-bottom:14px">
      In Supabase → click <strong>SQL Editor</strong> (left sidebar) → <strong>New query</strong> → paste the SQL above → click <strong>Run</strong>
    </div>

    <div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:10px">Step 2 — Paste your key into sync.js</div>
    <div style="font-size:12px;color:var(--text2);line-height:1.7;margin-bottom:6px">
      Open <code style="background:var(--surface2);padding:1px 5px;border-radius:4px">js/sync.js</code> → find line 8 → replace <code>PASTE_YOUR_PUBLISHABLE_KEY_HERE</code> with your <strong>sb_publishable_...</strong> key
    </div>

    <div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:10px">Step 3 — Disable Row Level Security (RLS)</div>
    <div style="font-size:12px;color:var(--text2);line-height:1.7">
      In Supabase → <strong>Table Editor</strong> → <strong>socialhub_state</strong> → click the 🔒 lock icon → <strong>Disable RLS</strong><br>
      <em style="color:var(--text3)">(This lets the app read/write without authentication headers)</em>
    </div>`;

  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Close</button>
    <button class="btn btn-primary" onclick="window.open('https://supabase.com/dashboard','_blank')">Open Supabase ↗</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}
