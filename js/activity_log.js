/* ============================================================
   ACTIVITY LOG — Admin only
   Records every action: login/logout, post create/edit/delete,
   idea changes, permission changes, media uploads, etc.
   Stored in state.activityLog (syncs via Firebase)
   Only visible to admins (Anusha, Anjani, Tejasv)
   ============================================================ */

/* ── Log an action ──────────────────────────────────────────── */
function logActivity(action, detail, category) {
  if (!state.activityLog) state.activityLog = [];

  const entry = {
    id:       Date.now(),
    ts:       new Date().toISOString(),
    user:     currentUser ? currentUser.name : 'System',
    role:     currentUser ? currentUser.role  : 'system',
    action,
    detail:   detail || '',
    category: category || 'general',  // login | post | idea | media | team | settings | data
  };

  state.activityLog.unshift(entry); // newest first

  // Keep only last 500 entries to avoid bloat
  if (state.activityLog.length > 500) state.activityLog = state.activityLog.slice(0, 500);

  // Save silently (don't trigger full sync on every log)
  try {
    localStorage.setItem('socialhub_v2', JSON.stringify({
      ...state,
      mediaLibrary: (state.mediaLibrary||[]).map(m=>({
        ...m,
        url:   m.source==='cloudinary'||m.source==='drive' ? m.url   : null,
        thumb: m.source==='cloudinary'||m.source==='drive' ? m.thumb : null,
      }))
    }));
  } catch(e) {}

  // Also sync to Firebase (debounced via syncPush)
  if (typeof syncPush === 'function') syncPush();
}

/* ── RENDER ACTIVITY LOG VIEW ────────────────────────────────── */
function renderActivityLog() {
  const el = document.getElementById('view-activity-log');
  if (!el) return;

  // Admin-only guard
  if (!currentUser || currentUser.role !== 'admin') {
    el.innerHTML = `<div style="text-align:center;padding:60px;color:var(--text3)">
      <div style="font-size:48px;margin-bottom:12px">🔒</div>
      <div style="font-size:16px;font-weight:700">Admin access only</div>
    </div>`;
    return;
  }

  const logs    = state.activityLog || [];
  const filter  = window._logFilter  || 'all';
  const search  = window._logSearch  || '';
  const user    = window._logUser    || 'all';

  // Filter
  let filtered = logs.filter(e => {
    if (filter !== 'all' && e.category !== filter) return false;
    if (user   !== 'all' && e.user !== user)       return false;
    if (search && !`${e.action} ${e.detail} ${e.user}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Category icons
  const CAT_ICONS = {
    login:'🔐', logout:'🚪', post:'📅', idea:'💡', media:'🖼',
    team:'👥', settings:'⚙', data:'💾', general:'📋', idea_board:'💡',
    planner:'🗒', interakt:'💬', email:'📧', whatsapp:'💬',
  };

  const CAT_COLORS = {
    login:'#DCFCE7', logout:'#FEE2E2', post:'#DBEAFE', idea:'#EDE9FE',
    media:'#FEF9C3', team:'#FCE7F3', settings:'#F1F5F9', data:'#FFF7ED',
  };

  el.innerHTML = `
    <div style="max-width:1000px">

      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <div>
          <h2 style="font-size:22px;font-weight:800;color:var(--text);letter-spacing:-.4px;margin-bottom:4px">🔍 Activity Log</h2>
          <div style="font-size:13px;color:var(--text3)">${logs.length} total events · ${filtered.length} shown · Admin only</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm" onclick="clearActivityLog()">🗑 Clear log</button>
          <button class="btn btn-ghost btn-sm" onclick="exportActivityLog()">⬇ Export CSV</button>
        </div>
      </div>

      <!-- Filters -->
      <div style="background:var(--white);border:1.5px solid var(--border);border-radius:var(--r-xl);padding:14px 16px;margin-bottom:16px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;box-shadow:var(--sh-sm)">
        <!-- Search -->
        <div style="position:relative;flex:1;min-width:180px">
          <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text3)">🔍</span>
          <input style="width:100%;padding:8px 10px 8px 30px;border:1.5px solid var(--border2);border-radius:var(--r-lg);font-family:var(--font);font-size:12px;outline:none"
            placeholder="Search actions…" value="${search}"
            oninput="window._logSearch=this.value;renderActivityLog()">
        </div>
        <!-- Category filter -->
        <select style="padding:8px 12px;border:1.5px solid var(--border2);border-radius:var(--r-lg);font-family:var(--font);font-size:12px;background:var(--white)"
          onchange="window._logFilter=this.value;renderActivityLog()">
          <option value="all" ${filter==='all'?'selected':''}>All categories</option>
          <option value="login"    ${filter==='login'?'selected':''}>🔐 Login/Logout</option>
          <option value="post"     ${filter==='post'?'selected':''}>📅 Posts</option>
          <option value="idea"     ${filter==='idea'?'selected':''}>💡 Ideas</option>
          <option value="media"    ${filter==='media'?'selected':''}>🖼 Media</option>
          <option value="team"     ${filter==='team'?'selected':''}>👥 Team</option>
          <option value="settings" ${filter==='settings'?'selected':''}>⚙ Settings</option>
          <option value="data"     ${filter==='data'?'selected':''}>💾 Data</option>
        </select>
        <!-- User filter -->
        <select style="padding:8px 12px;border:1.5px solid var(--border2);border-radius:var(--r-lg);font-family:var(--font);font-size:12px;background:var(--white)"
          onchange="window._logUser=this.value;renderActivityLog()">
          <option value="all">All members</option>
          ${Object.values(TEAM_USERS).map(u=>`<option value="${u.name}" ${user===u.name?'selected':''}>${u.name}</option>`).join('')}
        </select>
      </div>

      <!-- Stats row -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-bottom:16px">
        ${[
          { label:'Logins today',  val: logs.filter(e=>e.category==='login'&&e.ts.startsWith(new Date().toISOString().slice(0,10))).length, icon:'🔐', color:'#DCFCE7' },
          { label:'Posts created', val: logs.filter(e=>e.category==='post'&&e.action.includes('created')).length, icon:'📅', color:'#DBEAFE' },
          { label:'Posts deleted', val: logs.filter(e=>e.category==='post'&&e.action.includes('deleted')).length, icon:'🗑', color:'#FEE2E2' },
          { label:'Media uploads', val: logs.filter(e=>e.category==='media').length, icon:'🖼', color:'#FEF9C3' },
          { label:'Ideas added',   val: logs.filter(e=>e.category==='idea'&&e.action.includes('added')).length, icon:'💡', color:'#EDE9FE' },
        ].map(s=>`
          <div style="background:${s.color};border-radius:var(--r-xl);padding:12px 14px;text-align:center">
            <div style="font-size:20px;margin-bottom:4px">${s.icon}</div>
            <div style="font-size:20px;font-weight:800;color:var(--text)">${s.val}</div>
            <div style="font-size:10px;color:var(--text3);font-weight:600">${s.label}</div>
          </div>`).join('')}
      </div>

      <!-- Log table -->
      <div style="background:var(--white);border:1.5px solid var(--border);border-radius:var(--r-xl);overflow:hidden;box-shadow:var(--sh-sm)">
        ${!filtered.length ? `
          <div style="padding:40px;text-align:center;color:var(--text3)">
            <div style="font-size:32px;margin-bottom:10px">📋</div>
            <div style="font-size:14px;font-weight:700">No activity recorded yet</div>
            <div style="font-size:12px;margin-top:4px">Actions by all team members will appear here</div>
          </div>` : `
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead>
              <tr style="background:var(--surface2);border-bottom:2px solid var(--border)">
                <th style="padding:10px 14px;text-align:left;font-weight:700;color:var(--text2);white-space:nowrap">Time</th>
                <th style="padding:10px 10px;text-align:left;font-weight:700;color:var(--text2)">Member</th>
                <th style="padding:10px 10px;text-align:left;font-weight:700;color:var(--text2)">Action</th>
                <th style="padding:10px 14px;text-align:left;font-weight:700;color:var(--text2)">Details</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map((e,i) => {
                const u = Object.values(TEAM_USERS).find(u=>u.name===e.user);
                const bg = i%2===0 ? 'var(--white)' : 'var(--surface2)';
                const catColor = CAT_COLORS[e.category] || '#F1F5F9';
                const catIcon  = CAT_ICONS[e.category]  || '📋';
                const ts = new Date(e.ts);
                const timeStr = ts.toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', hour12:true });
                return `<tr style="background:${bg};border-bottom:1px solid var(--border);transition:background .12s"
                  onmouseover="this.style.background='var(--brand-pale)'" onmouseout="this.style.background='${bg}'">
                  <td style="padding:10px 14px;color:var(--text3);white-space:nowrap;font-size:11px">${timeStr}</td>
                  <td style="padding:10px 10px">
                    <div style="display:flex;align-items:center;gap:7px">
                      ${u ? `<div style="width:24px;height:24px;border-radius:50%;background:${u.color};color:${u.textColor};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;flex-shrink:0">${u.avatar}</div>` : '<div style="width:24px;height:24px;border-radius:50%;background:var(--surface3);flex-shrink:0"></div>'}
                      <div>
                        <div style="font-weight:700;color:var(--text);font-size:12px">${e.user}</div>
                        <div style="font-size:9px;color:var(--text3)">${e.role==='admin'?'⭐ Admin':'👤 Member'}</div>
                      </div>
                    </div>
                  </td>
                  <td style="padding:10px 10px">
                    <span style="display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:12px;background:${catColor};font-size:11px;font-weight:700;white-space:nowrap">
                      ${catIcon} ${e.action}
                    </span>
                  </td>
                  <td style="padding:10px 14px;color:var(--text2);max-width:300px">
                    <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${e.detail}">${e.detail||'—'}</div>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>`}
      </div>

    </div>`;
}

/* ── EXPORT LOG as CSV ───────────────────────────────────────── */
function exportActivityLog() {
  const logs = state.activityLog || [];
  const csv  = ['Time,Member,Role,Action,Details,Category']
    .concat(logs.map(e => `"${new Date(e.ts).toLocaleString()}","${e.user}","${e.role}","${e.action}","${(e.detail||'').replace(/"/g,'""')}","${e.category}"`))
    .join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `socialhub-activity-${new Date().toISOString().split('T')[0]}.csv`;
  a.click(); URL.revokeObjectURL(url);
  showToast('📊 Activity log exported!', 'success');
}

function clearActivityLog() {
  if (!confirm('Clear all activity log entries? This cannot be undone.')) return;
  state.activityLog = [];
  saveState(); renderActivityLog();
  showToast('Activity log cleared');
}

/* ══════════════════════════════════════════════════════════
   HOOK INTO ALL ACTIONS — patch key functions to log
══════════════════════════════════════════════════════════ */
function _initActivityLogging() {
  // Patch saveState to log changes
  const _origSaveState = window.saveState;
  // We don't patch saveState itself — instead we hook specific actions below

  // ── Posts ──
  window._origDeletePost = window.deletePost;
  window.deletePost = function(id) {
    const p = (state.posts||[]).find(x=>x.id===id);
    logActivity('Post deleted', p ? `"${p.title}" on ${p.date}` : `ID ${id}`, 'post');
    if (window._origDeletePost) window._origDeletePost(id);
  };

  // ── Ideas ──
  window._origDeleteIdea = window.deleteIdea;
  window.deleteIdea = function(id) {
    const idea = (state.ideas||[]).find(i=>i.id===id);
    logActivity('Idea deleted', idea ? `"${idea.title}"` : `ID ${id}`, 'idea');
    if (window._origDeleteIdea) window._origDeleteIdea(id);
  };

  // ── Media ──
  window._origDeleteMedia = window.deleteMedia;
  window.deleteMedia = function(id) {
    const m = (state.mediaLibrary||[]).find(x=>x.id===id);
    logActivity('Media deleted', m ? `"${m.name}"` : `ID ${id}`, 'media');
    if (window._origDeleteMedia) window._origDeleteMedia(id);
  };

  console.log('✅ Activity logging initialised');
}
