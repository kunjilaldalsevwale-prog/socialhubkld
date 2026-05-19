/* ============================================================
   REMINDERS MODULE — browser notifications + in-app list
   ============================================================ */

const REMINDER_TYPES = {
  post:     { label:'Social post',    emoji:'📸', color:'var(--pink)' },
  email:    { label:'Email campaign', emoji:'📧', color:'var(--blue)' },
  whatsapp: { label:'WhatsApp',       emoji:'💬', color:'var(--green)' },
  meta:     { label:'Meta Ad',        emoji:'📊', color:'var(--violet)' },
  meeting:  { label:'Meeting',        emoji:'🤝', color:'var(--amber)' },
  deadline: { label:'Deadline',       emoji:'⏰', color:'var(--coral)' },
  general:  { label:'General',        emoji:'📌', color:'var(--text2)' },
};

/* ── NOTIFICATION PERMISSION ─────────────────────────────── */
function requestNotificationPermission() {
  if (!('Notification' in window)) { showToast('Browser notifications not supported', 'error'); return; }
  Notification.requestPermission().then(p => {
    if (p === 'granted') {
      showToast('✅ Notifications enabled!', 'success');
      new Notification('SocialHub', { body: "You'll now get reminders for your campaigns!" });
    } else {
      showToast('Notifications blocked — enable in browser Settings › Site permissions', 'error');
    }
  });
}

function _fireNotification(title, body) {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}

/* ── AUTO-CHECK EVERY MINUTE ─────────────────────────────── */
function checkReminders() {
  const now     = new Date();
  const todayStr= now.toISOString().split('T')[0];
  const nowTime = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
  (state.reminders || []).forEach(r => {
    if (!r.done && r.date === todayStr && r.time === nowTime) {
      _fireNotification('⏰ ' + r.title, r.note || 'Reminder due now!');
      showToast('⏰ Reminder: ' + r.title, 'success');
    }
  });
}
setInterval(checkReminders, 60000);

/* ── RENDER ───────────────────────────────────────────────── */
function renderReminders() {
  _renderReminderStats();
  _renderReminderList('all');
  _checkNotifBanner();
}

function _checkNotifBanner() {
  ['notifPermBanner','notifPermBannerRem'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const supported = 'Notification' in window;
    el.style.display = (!supported || Notification.permission === 'granted') ? 'none' : '';
  });
}

function _renderReminderStats() {
  const el = document.getElementById('reminderStats');
  if (!el) return;
  const total   = (state.reminders||[]).length;
  const done    = (state.reminders||[]).filter(r=>r.done).length;
  const today   = new Date().toISOString().split('T')[0];
  const todayN  = (state.reminders||[]).filter(r=>r.date===today&&!r.done).length;
  el.innerHTML = `
    <div class="meta-stat-card"><div class="msc-label">Total</div><div class="msc-val">${total}</div><div class="msc-sub">All reminders</div></div>
    <div class="meta-stat-card"><div class="msc-label">Pending</div><div class="msc-val">${total-done}</div><div class="msc-sub">Need attention</div></div>
    <div class="meta-stat-card"><div class="msc-label">Today</div><div class="msc-val">${todayN}</div><div class="msc-sub">Due today</div></div>
    <div class="meta-stat-card"><div class="msc-label">Done</div><div class="msc-val">${done}</div><div class="msc-sub">Completed</div></div>`;
}

function _renderReminderList(filter) {
  const el = document.getElementById('reminderList');
  if (!el) return;
  const today = new Date().toISOString().split('T')[0];
  let items = [...(state.reminders||[])].sort((a,b) => (a.date+a.time) > (b.date+b.time) ? 1 : -1);
  if (filter === 'today')   items = items.filter(r => r.date === today);
  else if (filter === 'pending') items = items.filter(r => !r.done);
  else if (filter === 'done')    items = items.filter(r => r.done);

  if (!items.length) {
    el.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text3)"><div style="font-size:32px;margin-bottom:8px">✅</div><div style="font-weight:600">No reminders here</div></div>`;
    return;
  }
  el.innerHTML = items.map(r => {
    const t        = REMINDER_TYPES[r.type] || REMINDER_TYPES.general;
    const isOverdue= !r.done && r.date < today;
    return `<div class="reminder-card ${r.done?'reminder-done':''} ${isOverdue?'reminder-overdue':''}">
      <div class="rem-check" onclick="toggleReminder(${r.id})" title="${r.done?'Mark pending':'Mark done'}">${r.done?'✅':'⭕'}</div>
      <div class="rem-body">
        <div class="rem-title">${r.title}</div>
        <div class="rem-meta">
          <span class="rem-type" style="color:${t.color}">${t.emoji} ${t.label}</span>
          <span class="rem-date">📅 ${fmtDate(r.date)} at ${r.time}</span>
          ${isOverdue ? '<span style="color:var(--coral);font-weight:700;font-size:11px">⚠️ Overdue</span>' : ''}
        </div>
        ${r.note ? `<div class="rem-note">${r.note}</div>` : ''}
      </div>
      <div class="rem-actions">
        <button class="btn btn-ghost btn-sm" onclick="editReminder(${r.id})">✏️</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteReminder(${r.id})" style="color:var(--coral)">🗑</button>
      </div>
    </div>`;
  }).join('');
}

/* ── FILTER ───────────────────────────────────────────────── */
function filterReminders(f, el) {
  document.querySelectorAll('#reminderFilterTabs .ftab').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  _renderReminderList(f);
}

/* ── ACTIONS ──────────────────────────────────────────────── */
function toggleReminder(id) {
  const r = (state.reminders||[]).find(x=>x.id===id);
  if (r) { r.done = !r.done; saveState(); renderReminders(); updateReminderBadge(); }
}

function deleteReminder(id) {
  state.reminders = (state.reminders||[]).filter(r=>r.id!==id);
  saveState(); renderReminders(); updateReminderBadge(); showToast('Reminder deleted');
}

function editReminder(id) {
  const r = (state.reminders||[]).find(x=>x.id===id);
  if (r) showReminderModal(r);
}

/* ── MODAL ────────────────────────────────────────────────── */
function showReminderModal(existing) {
  const isEdit = !!existing;
  const r = existing || { title:'', type:'post', date:new Date().toISOString().split('T')[0], time:'09:00', note:'', done:false };
  document.getElementById('modalTitle').textContent = isEdit ? '✏️ Edit Reminder' : '⏰ New Reminder';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group"><label class="form-label">Title *</label>
      <input class="form-input" id="rem-title" value="${r.title}" placeholder="e.g. Post Diwali content"></div>
    <div class="form-group"><label class="form-label">Type</label>
      <select class="form-select" id="rem-type">
        ${Object.entries(REMINDER_TYPES).map(([k,v])=>`<option value="${k}" ${r.type===k?'selected':''}>${v.emoji} ${v.label}</option>`).join('')}
      </select></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Date *</label>
        <input class="form-input" type="date" id="rem-date" value="${r.date}"></div>
      <div class="form-group"><label class="form-label">Time *</label>
        <input class="form-input" type="time" id="rem-time" value="${r.time}"></div>
    </div>
    <div class="form-group"><label class="form-label">Note</label>
      <textarea class="form-input" id="rem-note" rows="3" placeholder="Any details or instructions…">${r.note||''}</textarea></div>
    <div style="background:var(--blue-light);border:1.5px solid var(--blue);border-radius:var(--r-lg);padding:12px;font-size:12px;color:var(--blue);display:flex;align-items:center;gap:10px">
      💡 Enable browser notifications so we can alert you even when the app is in the background.
      <button class="btn btn-ghost btn-sm" style="color:var(--blue);border-color:var(--blue);white-space:nowrap" onclick="requestNotificationPermission()">Enable</button>
    </div>`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveReminder(${isEdit?r.id:'null'})">💾 Save</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

function saveReminder(existingId) {
  const title = (document.getElementById('rem-title').value||'').trim();
  if (!title) { showToast('Enter a title', 'error'); return; }
  const data = {
    title, type: document.getElementById('rem-type').value,
    date: document.getElementById('rem-date').value,
    time: document.getElementById('rem-time').value,
    note: document.getElementById('rem-note').value,
    done: false,
  };
  if (!state.reminders) state.reminders = [];
  if (existingId) {
    const idx = state.reminders.findIndex(r=>r.id===existingId);
    if (idx>=0) state.reminders[idx] = { ...state.reminders[idx], ...data };
    showToast('Reminder updated!', 'success');
  } else {
    state.reminders.push({ id:genId(), ...data });
    showToast('⏰ Reminder set!', 'success');
  }
  saveState(); closeModal(); renderReminders(); updateReminderBadge();
}

/* ── QUICK REMINDER (called from other modules) ───────────── */
function quickReminder(title, date, type='general') {
  if (!state.reminders) state.reminders = [];
  state.reminders.push({ id:genId(), title, type, date, time:'09:00', note:'', done:false });
  saveState(); updateReminderBadge(); showToast('⏰ Reminder added!', 'success');
}
