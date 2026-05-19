/* ============ APP CORE ============ */
let currentView = 'channels';
let sidebarCollapsed = false;

const VIEW_TITLES = {
  channels:'Calendar', ideas:'Ideas Board', agenda:'Monthly Planner', integrations:'Integrations', meta:'Meta Ads Manager', whatsapp:'WhatsApp Marketing',
  email:'Email Marketing', media:'Media Library',
  reminders:'Reminders', agenda:'Monthly Agenda', analytics:'Analytics',
  team:'Team', settings:'Settings',
  // kept in ALL_VIEWS so views don't crash if navigated programmatically
  calendar:'Calendar', posts:'Posts', create:'Create Post',
};

const ALL_VIEWS = [
  'channels','calendar','posts','create',
  'meta','whatsapp','email','media','ideas',
  'reminders','agenda','analytics','integrations','team','settings'
];

function navigate(view, el) {
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
  // Add a sticky note
  if (typeof addStickyNote === 'function') {
    addStickyNote();
    // Show a toast pointing them to the planner
    showToast('📌 Note added! Open Monthly Planner to edit it.', 'success');
    // Refresh banner
    if (typeof _refreshCalStickyBanner === 'function') _refreshCalStickyBanner();
  }
}

function _syncInteraktNavBadge() {
  const badge = document.getElementById('interaktNavBadge');
  if (!badge || !state.interaktSettings) return;
  badge.innerHTML = state.interaktSettings.connected
    ? '<span class="badge badge-published">● Connected</span>'
    : '<span class="badge badge-draft">○ Not connected</span>';
}
