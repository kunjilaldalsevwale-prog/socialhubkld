/* ============================================================
   AUTH — Login, logout, team management
   Roles: admin | strategist | designer | member
   ============================================================ */

const TEAM_USERS = {}; // populated from state.teamMembers

// Bootstrap: always ensure at least one admin exists
function _ensureBootstrapAdmin() {
  if (!state.teamMembers || !state.teamMembers.length) {
    // No team yet — add default bootstrap admin
    const bootstrap = { id:'admin_bootstrap', name:'Admin', email:'admin@socialhub.com', role:'admin', avatar:'AD', color:'#DBEAFE', textColor:'#1D4ED8', permissions:['all'] };
    if (!state.teamMembers) state.teamMembers = [];
    state.teamMembers.push(bootstrap);
    if (!state.teamPasswords) state.teamPasswords = {};
    state.teamPasswords['admin_bootstrap'] = 'admin123';
    saveState();
  }
}

let currentUser = null;

/* ── PASSWORDS ────────────────────────────────────────────── */
const DEFAULT_PASSWORDS = {};

function _getPassword(userId) {
  return (state.teamPasswords && state.teamPasswords[userId]) || DEFAULT_PASSWORDS[userId] || '123456';
}

/* ── LOGIN SCREEN ─────────────────────────────────────────── */
function showLoginScreen() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  // Merge dynamic team members from state
  _mergeStateTeam();
}

function _mergeStateTeam() {
  _ensureBootstrapAdmin();
  if (state.teamMembers) {
    state.teamMembers.forEach(m => {
      if (!TEAM_USERS[m.id]) TEAM_USERS[m.id] = m;
      else Object.assign(TEAM_USERS[m.id], m);
    });
  }
}

function doLogin(emailInput, pwInput) {
  const email = (emailInput || document.getElementById('loginEmail').value).trim().toLowerCase();
  const pw    = pwInput    || document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');

  const user = Object.values(TEAM_USERS).find(u => u.email.toLowerCase() === email);
  if (!user) { if(errEl) errEl.textContent = 'Email not found'; return; }
  if (pw !== _getPassword(user.id)) { if(errEl) errEl.textContent = 'Incorrect password'; return; }

  currentUser = user;
  localStorage.setItem('sh_session', JSON.stringify({ id: user.id }));
  document.getElementById('loginScreen').style.display = 'none';
  if (typeof logActivity === 'function') setTimeout(()=>logActivity('Logged in', user.email, 'login'), 100);
  _enterApp();
}

function logout() {
  if (currentUser && typeof logActivity === 'function') logActivity('Logged out', currentUser.email, 'login');
  currentUser = null;
  localStorage.removeItem('sh_session');
  showLoginScreen();
}

function _enterApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';  document.getElementById('app').style.display = 'flex';
  _applyUserPermissions();
  _updateSidebarUser();
  if (typeof initSync === 'function') initSync();
  if (typeof renderChannelCalendars === 'function') renderChannelCalendars();
  if (typeof renderSidebarIdeas === 'function') renderSidebarIdeas();
  if (typeof renderAttachedDocs === 'function') renderAttachedDocs();
  if (typeof _refreshCalStickyBanner === 'function') _refreshCalStickyBanner();
  if (typeof _initActivityLogging === 'function') _initActivityLogging();
  // Navigate to calendar
  const calNav = document.querySelector('.nav-item[data-view="channels"]');
  navigate('channels', calNav);
  // Force show view-channels
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const cv = document.getElementById('view-channels');
  if (cv) cv.classList.add('active');
}

function _updateSidebarUser() {
  if (!currentUser) return;
  const av = document.getElementById('sidebarAvatar');
  const nm = document.getElementById('sidebarUserName');
  const rl = document.getElementById('sidebarUserRole');
  if (av) { av.textContent = currentUser.avatar; av.style.background = currentUser.color; av.style.color = currentUser.textColor; }
  if (nm) nm.textContent = currentUser.name;
  if (rl) rl.textContent = _roleLabel(currentUser.role);
}

function _roleLabel(role) {
  const map = { admin:'⭐ Admin', strategist:'📊 Strategist', designer:'🎨 Designer', member:'👤 Member' };
  return map[role] || '👤 Member';
}

/* ── PERMISSIONS ──────────────────────────────────────────── */
function _applyUserPermissions() {
  if (!currentUser) return;
  const isAdmin = currentUser.role === 'admin';
  // Show/hide admin-only nav
  document.querySelectorAll('.admin-only-nav').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
  if (isAdmin && typeof _initActivityLogging === 'function') _initActivityLogging();
}

/* ── SESSION RESTORE ──────────────────────────────────────── */
function tryRestoreSession() {
  _mergeStateTeam();
  const sess = localStorage.getItem('sh_session');
  if (sess) {
    try {
      const { id } = JSON.parse(sess);
      const user = TEAM_USERS[id];
      if (user) { currentUser = user; _enterApp(); return; }
    } catch(e) {}
  }
  showLoginScreen();
}

/* ── TEAM SETTINGS ────────────────────────────────────────── */
function renderTeamSettings() {
  const el = document.getElementById('rolesTable');
  if (!el) return;

  _mergeStateTeam();
  const allUsers = Object.values(TEAM_USERS);

  const PERM_COLS = [
    { key:'calendar', label:'📅 Calendar' },
    { key:'media',    label:'📸 Photos' },
    { key:'planner',  label:'🗒 Planner' },
    { key:'settings', label:'⚙ Settings' },
  ];

  el.innerHTML = `
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead>
          <tr style="background:var(--surface2)">
            <th style="padding:12px 14px;text-align:left;font-weight:700;color:var(--text2);border-bottom:2px solid var(--border)">Member</th>
            <th style="padding:10px 8px;text-align:center;font-weight:700;color:var(--text2);border-bottom:2px solid var(--border)">Role</th>
            ${PERM_COLS.map(p=>`<th style="padding:10px 6px;text-align:center;font-size:10px;font-weight:700;color:var(--text3);border-bottom:2px solid var(--border)">${p.label}</th>`).join('')}
            <th style="padding:10px 8px;border-bottom:2px solid var(--border)">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${allUsers.map(u => {
            const perms = (state.teamPermissions&&state.teamPermissions[u.id]) || u.permissions || [];
            const hasAll = u.role==='admin' || perms.includes('all');
            return `<tr style="border-bottom:1px solid var(--border)">
              <td style="padding:12px 14px">
                <div style="display:flex;align-items:center;gap:10px">
                  <div style="width:32px;height:32px;border-radius:50%;background:${u.color};color:${u.textColor};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800">${u.avatar}</div>
                  <div>
                    <div style="font-weight:700;color:var(--text)">${u.name}</div>
                    <div style="font-size:10px;color:var(--text3)">${u.email}</div>
                  </div>
                </div>
              </td>
              <td style="padding:10px 8px;text-align:center">
                <span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${u.role==='admin'?'#FEF9C3':u.role==='strategist'?'#EFF6FF':u.role==='designer'?'#F0FDF4':'var(--surface2)'};color:${u.role==='admin'?'#92400E':u.role==='strategist'?'#1D4ED8':u.role==='designer'?'#065F46':'var(--text2)'}">
                  ${_roleLabel(u.role)}
                </span>
              </td>
              ${PERM_COLS.map(p => {
                const checked = hasAll || perms.includes(p.key);
                if (u.role === 'admin') return `<td style="padding:10px 6px;text-align:center"><span style="color:var(--green)">✓</span></td>`;
                return `<td style="padding:10px 6px;text-align:center">
                  <input type="checkbox" ${checked?'checked':''} style="width:16px;height:16px;accent-color:var(--brand);cursor:pointer"
                    onchange="toggleMemberPerm('${u.id}','${p.key}',this.checked)">
                </td>`;
              }).join('')}
              <td style="padding:10px 8px;text-align:center">
                <div style="display:flex;gap:4px;justify-content:center">
                  <button class="btn btn-ghost btn-sm" onclick="openEditTeamMemberModal('${u.id}')" style="font-size:10px;padding:3px 8px">✏️</button>
                  ${u.role !== 'admin' ? `<button class="btn btn-ghost btn-sm" onclick="deleteTeamMember('${u.id}')" style="font-size:10px;padding:3px 8px;color:var(--coral)">🗑</button>` : ''}
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

function toggleMemberPerm(userId, permKey, checked) {
  if (!state.teamPermissions) state.teamPermissions = {};
  if (!state.teamPermissions[userId]) state.teamPermissions[userId] = [...(TEAM_USERS[userId]?.permissions || [])];
  const perms = state.teamPermissions[userId];
  const allIdx = perms.indexOf('all');
  if (allIdx > -1) perms.splice(allIdx, 1);
  if (checked && !perms.includes(permKey)) perms.push(permKey);
  else if (!checked) { const i = perms.indexOf(permKey); if(i>-1) perms.splice(i,1); }
  TEAM_USERS[userId].permissions = perms;
  saveState();
  showToast(`✅ Permissions updated`, 'success');
}

/* ── ADD / EDIT / DELETE TEAM MEMBER ─────────────────────── */
function openAddTeamMemberModal() {
  document.getElementById('modalTitle').textContent = '➕ Add Team Member';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group"><label class="form-label">Full name *</label>
      <input class="form-input" id="tm-name" placeholder="e.g. Priya Sharma"></div>
    <div class="form-group"><label class="form-label">Email *</label>
      <input class="form-input" id="tm-email" placeholder="priya@kunjilal.com" type="email"></div>
    <div class="form-group"><label class="form-label">Password *</label>
      <input class="form-input" id="tm-pw" placeholder="Login password" type="password"></div>
    <div class="form-group"><label class="form-label">Role *</label>
      <select class="form-select" id="tm-role">
        <option value="member">👤 Member</option>
        <option value="strategist">📊 Strategist</option>
        <option value="designer">🎨 Designer</option>
        <option value="admin">⭐ Admin</option>
      </select></div>`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveNewTeamMember()">Add member</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

function saveNewTeamMember() {
  const name  = document.getElementById('tm-name').value.trim();
  const email = document.getElementById('tm-email').value.trim().toLowerCase();
  const pw    = document.getElementById('tm-pw').value;
  const role  = document.getElementById('tm-role').value;
  if (!name||!email||!pw) { showToast('Fill all fields','error'); return; }
  const id = name.toLowerCase().replace(/\s+/g,'_') + '_' + Date.now();
  const initials = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const colors = [['#DBEAFE','#1D4ED8'],['#EDE9FE','#5B21B6'],['#DCFCE7','#065F46'],['#FEF9C3','#92400E'],['#FCE7F3','#9D174D'],['#FFF7ED','#92400E']];
  const [bg,tc] = colors[Math.floor(Math.random()*colors.length)];
  const member = { id, name, email, role, avatar:initials, color:bg, textColor:tc, permissions:role==='admin'?['all']:['calendar','media','planner'] };
  TEAM_USERS[id] = member;
  if (!state.teamMembers) state.teamMembers = [];
  state.teamMembers = state.teamMembers.filter(m=>m.id!==id);
  state.teamMembers.push(member);
  if (!state.teamPasswords) state.teamPasswords = {};
  state.teamPasswords[id] = pw;
  saveState();
  closeModal();
  renderTeamSettings();
  showToast(`✅ ${name} added!`, 'success');
}

function openEditTeamMemberModal(userId) {
  const u = TEAM_USERS[userId];
  if (!u) return;
  document.getElementById('modalTitle').textContent = `✏️ Edit ${u.name}`;
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group"><label class="form-label">Full name</label>
      <input class="form-input" id="tm-name" value="${u.name}"></div>
    <div class="form-group"><label class="form-label">Email</label>
      <input class="form-input" id="tm-email" value="${u.email}" type="email"></div>
    <div class="form-group"><label class="form-label">New password (leave blank to keep current)</label>
      <input class="form-input" id="tm-pw" placeholder="New password" type="password"></div>
    <div class="form-group"><label class="form-label">Role</label>
      <select class="form-select" id="tm-role">
        <option value="member" ${u.role==='member'?'selected':''}>👤 Member</option>
        <option value="strategist" ${u.role==='strategist'?'selected':''}>📊 Strategist</option>
        <option value="designer" ${u.role==='designer'?'selected':''}>🎨 Designer</option>
        <option value="admin" ${u.role==='admin'?'selected':''}>⭐ Admin</option>
      </select></div>`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="updateTeamMember('${userId}')">Save changes</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

function updateTeamMember(userId) {
  const u = TEAM_USERS[userId];
  if (!u) return;
  u.name  = document.getElementById('tm-name').value.trim() || u.name;
  u.email = document.getElementById('tm-email').value.trim().toLowerCase() || u.email;
  u.role  = document.getElementById('tm-role').value;
  const pw = document.getElementById('tm-pw').value;
  if (pw) { if (!state.teamPasswords) state.teamPasswords={}; state.teamPasswords[userId]=pw; }
  if (!state.teamMembers) state.teamMembers = [];
  const idx = state.teamMembers.findIndex(m=>m.id===userId);
  if (idx>=0) state.teamMembers[idx] = {...state.teamMembers[idx],...u};
  else state.teamMembers.push(u);
  saveState(); closeModal(); renderTeamSettings();
  showToast(`✅ ${u.name} updated!`, 'success');
}

function deleteTeamMember(userId) {
  const u = TEAM_USERS[userId];
  if (!u) return;
  if (!confirm(`Delete ${u.name}? They will no longer be able to log in.`)) return;
  delete TEAM_USERS[userId];
  if (state.teamMembers) state.teamMembers = state.teamMembers.filter(m=>m.id!==userId);
  saveState(); renderTeamSettings();
  showToast(`${u.name} removed`, 'success');
}

/* ── PROFILE MODAL ────────────────────────────────────────── */
function openProfileModal() {
  if (!currentUser) return;
  document.getElementById('modalTitle').textContent = '👤 My Profile';
  document.getElementById('modalBody').innerHTML = `
    <div style="text-align:center;padding:16px 0">
      <div style="width:64px;height:64px;border-radius:50%;background:${currentUser.color};color:${currentUser.textColor};display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;margin:0 auto 12px">${currentUser.avatar}</div>
      <div style="font-size:17px;font-weight:800;color:var(--text)">${currentUser.name}</div>
      <div style="font-size:12px;color:var(--text3);margin-top:3px">${currentUser.email}</div>
      <div style="margin-top:8px">${_roleLabel(currentUser.role)}</div>
    </div>
    <div class="form-group" style="margin-top:16px"><label class="form-label">Change password</label>
      <input class="form-input" id="profile-pw" type="password" placeholder="New password"></div>`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Close</button>
    <button class="btn btn-primary" onclick="saveProfilePassword()">Save password</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

function saveProfilePassword() {
  const pw = document.getElementById('profile-pw').value;
  if (!pw||pw.length<4) { showToast('Password too short','error'); return; }
  if (!state.teamPasswords) state.teamPasswords = {};
  state.teamPasswords[currentUser.id] = pw;
  saveState(); closeModal();
  showToast('✅ Password updated!', 'success');
}
