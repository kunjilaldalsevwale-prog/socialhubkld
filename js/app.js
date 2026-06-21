/* ============ APP CORE ============ */
let currentView = 'channels';
let sidebarCollapsed = false;

const VIEW_TITLES = {
  channels:'Calendar', ideas:'Ideas Board', agenda:'Monthly Planner', home:'Home', integrations:'Integrations', 'activity-log':'Activity Log', meta:'Meta Ads Manager', whatsapp:'WhatsApp Marketing',
  email:'Email Marketing', media:'Media Library',
  reminders:'Reminders', agenda:'Monthly Agenda', analytics:'Analytics',
  team:'Team', settings:'Settings',
  // kept in ALL_VIEWS so views don't crash if navigated programmatically
  calendar:'Calendar', posts:'Posts', create:'Create Post',
};

const ALL_VIEWS = [
  'home','channels','calendar','posts','create',
  'meta','whatsapp','email','media','ideas',
  'reminders','agenda','analytics','integrations','activity-log','team','settings'
];

function navigate(view, el) {
  if (view === 'home') setTimeout(renderHomePage, 50);
  _updateMobileNav(view);
  ALL_VIEWS.forEach(n => {
    const v = document.getElementById('view-' + n);
    if (v) v.classList.toggle('active', n === view);
  });
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  else {
    const match = document.querySelector(`.nav-item[data-view="${view}"]`);
    if (match) match.classList.add('active');
  }
  document.getElementById('pageTitle').textContent = VIEW_TITLES[view] || view;
  currentView = view;

  const renders = {
    channels: renderChannelCalendars,
    calendar: buildCalendar,
    posts: renderPosts,
    meta: renderMetaAds,
    whatsapp: () => { renderWhatsApp(); setTimeout(renderWAInteraktBanner, 50); },
    agenda: renderMonthlyPlanner,
    analytics: renderAnalytics,
    team: renderTeam,
    settings: renderSettings,
    email: renderEmail,
    media: renderMediaLibrary,
    ideas: renderIdeasBoard,
    integrations: () => { renderInteraktSettings(); _syncInteraktNavBadge(); },
    reminders: renderReminders,
  };
  if (renders[view]) renders[view]();
  updateBadge();
  updateReminderBadge();
}

function updateBadge() {
  const drafts = (state.posts||[]).filter(p => p.status === 'draft' || p.status === 'review').length;
  const badge = document.getElementById('badge-posts');
  if (badge) { badge.textContent = drafts; badge.style.display = drafts ? '' : 'none'; }
}

function updateReminderBadge() {
  const today = new Date().toISOString().split('T')[0];
  const due = (state.reminders||[]).filter(r => !r.done && r.date <= today).length;
  const badge = document.getElementById('badge-reminders');
  if (badge) { badge.textContent = due; badge.style.display = due ? '' : 'none'; }
}

function toggleSidebar() {
  const sidebar   = document.getElementById('sidebar');
  const expandBtn = document.getElementById('sidebarExpandBtn');
  if (window.innerWidth <= 640) {
    sidebar.classList.toggle('mobile-open');
  } else {
    sidebarCollapsed = !sidebarCollapsed;
    sidebar.classList.toggle('collapsed', sidebarCollapsed);
    document.getElementById('sidebarToggle').textContent = sidebarCollapsed ? '›' : '‹';
    // Show/hide the persistent expand button
    if (expandBtn) expandBtn.style.display = sidebarCollapsed ? 'flex' : 'none';
  }
}
// Both buttons call toggleSidebar (onclick already set in HTML for expand btn)
document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);

function globalSearch(q) {
  if (!q.trim()) return;
  // search across posts - show in channels view
  navigate('channels', document.querySelector('.nav-item[data-view="channels"]'));
}

let toastTimer = null;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

function exportData() {
  const data = JSON.stringify({ posts: state.posts, emailCampaigns: state.emailCampaigns }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'socialhub-export.json'; a.click();
  showToast('Data exported!', 'success');
}

window.addEventListener('DOMContentLoaded', () => {
  initSync();   // Firebase real-time sync
  initAuth();   // Login & session
  checkReminders && checkReminders();
});

/* ── Nav group dropdown toggle ── */
function toggleNavGroup(groupId) {
  const dropdown = document.getElementById('dropdown-calendar');
  const chevron  = document.getElementById('chevron-calendar');
  if (!dropdown) return;
  const isOpen = dropdown.classList.contains('open');
  dropdown.classList.toggle('open', !isOpen);
  if (chevron) chevron.textContent = isOpen ? '▸' : '▾';
}

/* ── Navigate to Calendar + set channel ── */
function navigateToChannel(ch, el) {
  // Mark sub-item active
  document.querySelectorAll('.nav-sub-item').forEach(i => i.classList.remove('active'));
  if (el) el.classList.add('active');
  // Navigate to channels view
  navigate('channels', document.querySelector('.nav-item[data-view="channels"]'));
  // Switch the channel
  setTimeout(() => {
    setChannel(ch, document.querySelector(`.ch-subtab[data-ch="${ch}"]`));
    document.querySelectorAll('.ch-subtab').forEach(b => b.classList.remove('active'));
    const tab = document.querySelector(`.ch-subtab[data-ch="${ch}"]`);
    if (tab) tab.classList.add('active');
  }, 30);
}

/* ── Click month label → open planner for that month ── */
function openPlannerForCurrentMonth() {
  // Sync planner month to the calendar month currently showing
  if (typeof plannerYear  !== 'undefined') plannerYear  = channelCalYear;
  if (typeof plannerMonth !== 'undefined') plannerMonth = channelCalMonth;
  navigate('agenda', document.querySelector('.nav-item[data-view="agenda"]'));
}

/* ── Add sticky note directly from calendar sticky banner area ── */
function addStickyNoteFromCalendar() {
  // Sync planner month to current calendar month
  if (typeof plannerYear  !== 'undefined') plannerYear  = channelCalYear;
  if (typeof plannerMonth !== 'undefined') plannerMonth = channelCalMonth;

  // Show inline quick-type popup right on the calendar
  const existing = document.getElementById('calStickyQuickAdd');
  if (existing) { existing.remove(); return; }

  const banner = document.getElementById('calStickyBanner') || document.querySelector('.cal-sticky-banner-row');
  if (!banner) return;

  const popup = document.createElement('div');
  popup.id = 'calStickyQuickAdd';
  popup.style.cssText = `
    background:#FEF9C3;border:2px solid #F59E0B;border-radius:12px;
    padding:10px 12px;margin-top:8px;display:flex;align-items:center;gap:8px;
    box-shadow:0 4px 20px rgba(245,158,11,.25);animation:fadeUp .2s ease;
  `;
  popup.innerHTML = `
    <span style="font-size:18px;flex-shrink:0">📌</span>
    <textarea id="calStickyQuickText" rows="1"
      placeholder="Type your sticky note and press Enter…"
      style="flex:1;border:none;background:transparent;font-family:var(--font);font-size:13px;
             font-weight:600;color:#78350F;outline:none;resize:none;min-height:28px;line-height:1.4"
      onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();saveCalStickyQuick();}
                 if(event.key==='Escape'){document.getElementById('calStickyQuickAdd').remove();}"
      oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px'"></textarea>
    <button onclick="saveCalStickyQuick()"
      style="background:#F59E0B;color:#fff;border:none;border-radius:8px;padding:6px 14px;
             font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font);white-space:nowrap">
      Add ✓
    </button>
    <button onclick="document.getElementById('calStickyQuickAdd').remove()"
      style="background:none;border:none;cursor:pointer;font-size:16px;color:#92400E;padding:2px 4px">✕</button>`;

  banner.parentNode.insertBefore(popup, banner.nextSibling);

  // Auto-focus
  setTimeout(() => {
    const ta = document.getElementById('calStickyQuickText');
    if (ta) ta.focus();
  }, 30);
}

function saveCalStickyQuick() {
  const ta   = document.getElementById('calStickyQuickText');
  const text = ta ? ta.value.trim() : '';
  if (!text) { document.getElementById('calStickyQuickAdd')?.remove(); return; }

  // Sync month and add note with text
  if (typeof plannerYear  !== 'undefined') plannerYear  = channelCalYear;
  if (typeof plannerMonth !== 'undefined') plannerMonth = channelCalMonth;

  if (typeof addStickyNote === 'function') {
    addStickyNote(); // creates the note
    // Find the just-created note and set its text
    const plan = typeof _ensureMonth === 'function'
      ? _ensureMonth(plannerYear, plannerMonth)
      : null;
    if (plan && plan.stickyNotes && plan.stickyNotes.length) {
      plan.stickyNotes[plan.stickyNotes.length - 1].text = text;
      if (typeof saveState === 'function') saveState();
      if (typeof _refreshCalStickyBanner === 'function') _refreshCalStickyBanner();
    }
  }

  document.getElementById('calStickyQuickAdd')?.remove();
  showToast('📌 Sticky note saved!', 'success');
}

function _syncInteraktNavBadge() {
  const badge = document.getElementById('interaktNavBadge');
  if (!badge || !state.interaktSettings) return;
  badge.innerHTML = state.interaktSettings.connected
    ? '<span class="badge badge-published">● Connected</span>'
    : '<span class="badge badge-draft">○ Not connected</span>';
}

/* ══════════════════════════════════════════════════════════
   GOOGLE DOCS PANEL
══════════════════════════════════════════════════════════ */
if (!state.attachedDocs) state.attachedDocs = [];

const DOC_ICONS = {
  doc:    { icon:'📄', color:'#4285F4', label:'Google Doc' },
  sheet:  { icon:'📊', color:'#0F9D58', label:'Google Sheet' },
  slides: { icon:'📑', color:'#F4B400', label:'Google Slides' },
  form:   { icon:'📋', color:'#AB47BC', label:'Google Form' },
  drive:  { icon:'📁', color:'#1E88E5', label:'Drive folder' },
};

function addGoogleDoc() {
  const title = (document.getElementById('doc-title').value || '').trim();
  const url   = (document.getElementById('doc-url').value   || '').trim();
  const type  = document.getElementById('doc-type').value;

  if (!title) { showToast('Enter a name for this doc', 'error'); return; }
  if (!url)   { showToast('Paste the Google Doc link', 'error'); return; }
  if (!url.includes('google.com') && !url.includes('docs.') && !url.startsWith('http')) {
    showToast('Paste a valid Google link', 'error'); return;
  }

  if (!state.attachedDocs) state.attachedDocs = [];
  state.attachedDocs.push({
    id: genId(), title, url, type,
    date: new Date().toISOString().split('T')[0],
    addedBy: currentUser ? currentUser.name : 'You',
  });
  saveState();

  // Clear form
  document.getElementById('doc-title').value = '';
  document.getElementById('doc-url').value   = '';

  renderAttachedDocs();
  showToast('📄 Doc attached!', 'success');
}

function renderAttachedDocs() {
  const el = document.getElementById('attachedDocsList');
  if (!el) return;
  const docs = state.attachedDocs || [];

  if (!docs.length) {
    el.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text3)">
      <div style="font-size:28px;margin-bottom:8px">📄</div>
      <div style="font-size:12px;font-weight:600">No docs attached yet</div>
      <div style="font-size:11px;margin-top:3px">Paste any Google Doc, Sheet or Slides link above</div>
    </div>`;
    return;
  }

  el.innerHTML = docs.map(doc => {
    const cfg = DOC_ICONS[doc.type] || DOC_ICONS.doc;
    return `<div class="attached-doc-card">
      <div class="adc-icon" style="background:${cfg.color}22;color:${cfg.color}">${cfg.icon}</div>
      <div class="adc-body">
        <div class="adc-title">${doc.title}</div>
        <div class="adc-meta">${cfg.label} · Added by ${doc.addedBy}</div>
      </div>
      <div class="adc-actions">
        <button class="adc-open" onclick="window.open('${doc.url}','_blank')" title="Open">↗</button>
        <button class="adc-del" onclick="removeDoc(${doc.id})" title="Remove">✕</button>
      </div>
    </div>`;
  }).join('');
}

function removeDoc(id) {
  state.attachedDocs = (state.attachedDocs || []).filter(d => d.id !== id);
  saveState();
  renderAttachedDocs();
  showToast('Doc removed');
}

// Extend switchCalSidebarTab to handle docs panel
const _origSwitchTab = switchCalSidebarTab;
function switchCalSidebarTab(tab, el) {
  document.querySelectorAll('.cst-tab').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  document.querySelectorAll('.cal-sidebar-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('csp-' + tab);
  if (panel) panel.classList.add('active');
  if (tab === 'ideas') renderSidebarIdeas && renderSidebarIdeas();
  if (tab === 'festivals') renderChannelFestivalSidebar && renderChannelFestivalSidebar();
  if (tab === 'docs') renderAttachedDocs();
}

/* ══════════════════════════════════════════════════════════
   MOBILE BOTTOM NAV
══════════════════════════════════════════════════════════ */
function _updateMobileNav(view) {
  const items = document.querySelectorAll('.mbn-item');
  items.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
}

function toggleMobileMenu() {
  const menu     = document.getElementById('mobileMoreMenu');
  const backdrop = document.getElementById('mmmBackdrop');
  const isOpen   = menu && menu.style.display !== 'none';
  if (menu)     menu.style.display     = isOpen ? 'none' : 'block';
  if (backdrop) backdrop.style.display = isOpen ? 'none' : 'block';

  // Update user info in more menu
  if (!isOpen && currentUser) {
    const av   = document.getElementById('mbnAvatar');
    const nm   = document.getElementById('mbnName');
    const rl   = document.getElementById('mbnRole');
    if (av) { av.textContent = currentUser.avatar; av.style.background = currentUser.color; av.style.color = currentUser.textColor; }
    if (nm) nm.textContent = currentUser.name;
    if (rl) rl.textContent = currentUser.role==='admin' ? '⭐ Admin' : '👤 Member';
    // Hide activity log for non-admins
    const actBtn = document.getElementById('mmm-activity');
    if (actBtn) actBtn.style.display = currentUser.role==='admin' ? '' : 'none';
  }
}
