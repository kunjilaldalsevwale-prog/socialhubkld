/* ============================================================
   AUTH SYSTEM
   Email + password login · Role-based access · Change password
   ============================================================ */

const DOMAIN = 'kunjilal.com';

const TEAM_USERS = {
  anusha:   { id:'anusha',   name:'Anusha',   email:`anusha@${DOMAIN}`,   role:'admin',  avatar:'AN', color:'#DBEAFE', textColor:'#1D4ED8', password:'anusha123',   permissions:['all'] },
  anjani:   { id:'anjani',   name:'Anjani',   email:`anjani@${DOMAIN}`,   role:'admin',  avatar:'AJ', color:'#EDE9FE', textColor:'#5B21B6', password:'anjani123',   permissions:['all'] },
  tejasv:   { id:'tejasv',   name:'Tejasv',   email:`tejasv@${DOMAIN}`,   role:'admin',  avatar:'TJ', color:'#DCFCE7', textColor:'#065F46', password:'tejasv123',   permissions:['all'] },
  ashish:   { id:'ashish',   name:'Ashish',   email:`ashish@${DOMAIN}`,   role:'member', avatar:'AS', color:'#FEF9C3', textColor:'#92400E', password:'ashish123',   permissions:['calendar','ideas','media','planner','reminders','team'] },
  mukul:    { id:'mukul',    name:'Mukul',    email:`mukul@${DOMAIN}`,    role:'member', avatar:'MK', color:'#FCE7F3', textColor:'#9D174D', password:'mukul123',    permissions:['calendar','ideas','media','planner','reminders','team'] },
  varshang: { id:'varshang', name:'Varshang', email:`varshang@${DOMAIN}`, role:'member', avatar:'VR', color:'#FEE2E2', textColor:'#991B1B', password:'varshang123', permissions:['calendar','ideas','media','planner','reminders','team'] },
  vidhi:    { id:'vidhi',    name:'Vidhi',    email:`vidhi@${DOMAIN}`,    role:'member', avatar:'VD', color:'#F0FDFA', textColor:'#0D9488', password:'vidhi123',    permissions:['calendar','ideas','media','planner','reminders','team'] },
};

const ALL_PERMISSIONS = [
  { key:'calendar',     label:'📅 Calendar',         desc:'View & add posts to calendar' },
  { key:'email',        label:'📧 Email Marketing',  desc:'View & create email campaigns' },
  { key:'whatsapp',     label:'💬 WhatsApp',         desc:'View & send WhatsApp messages' },
  { key:'meta',         label:'📊 Meta Ads',         desc:'View Meta ad campaigns' },
  { key:'media',        label:'🖼 Media Library',    desc:'Upload & manage media files' },
  { key:'ideas',        label:'💡 Ideas Board',      desc:'Add & schedule ideas' },
  { key:'planner',      label:'🗒 Monthly Planner',  desc:'Edit monthly content plan' },
  { key:'reminders',    label:'⏰ Reminders',        desc:'Set & manage reminders' },
  { key:'analytics',    label:'📈 Analytics',        desc:'View analytics & reports' },
  { key:'integrations', label:'🔗 Integrations',     desc:'Manage API integrations' },
  { key:'team',         label:'👥 Team',             desc:'View team members' },
  { key:'settings',     label:'⚙ Settings',         desc:'View settings' },
];

let currentUser = null;

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */
function initAuth() {
  if (!state.teamPasswords)    state.teamPasswords    = {};
  if (!state.teamPermissions)  state.teamPermissions  = {};

  Object.keys(TEAM_USERS).forEach(id => {
    if (state.teamPasswords[id])   TEAM_USERS[id].password    = state.teamPasswords[id];
    if (state.teamPermissions[id]) TEAM_USERS[id].permissions = state.teamPermissions[id];
  });

  const saved = sessionStorage.getItem('sh_session');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && TEAM_USERS[parsed.id]) {
        currentUser = TEAM_USERS[parsed.id];
        _enterApp();
        return;
      }
    } catch(e) {}
  }
  showLoginScreen();
}

/* ══════════════════════════════════════════════════════════
   LOGIN SCREEN — email + password
══════════════════════════════════════════════════════════ */
function showLoginScreen() {
  document.getElementById('app').style.display = 'none';
  let el = document.getElementById('loginScreen');
  if (!el) { el = document.createElement('div'); el.id = 'loginScreen'; document.body.appendChild(el); }
  el.style.display = 'flex';

  el.innerHTML = `
    <div class="login-bg">
      <div class="login-card">

        <!-- Logo -->
        <div class="login-logo">
          <div class="login-logo-icon">SH</div>
          <div>
            <div class="login-logo-name">SocialHub</div>
            <div class="login-logo-tag">Content Command Center</div>
          </div>
        </div>

        <h2 class="login-title">Welcome back 👋</h2>
        <p class="login-sub">Sign in with your work email</p>

        <!-- Error / Success -->
        <div id="loginError" class="login-error" style="display:none"></div>
        <div id="loginSuccess" class="login-success" style="display:none"></div>

        <!-- Email -->
        <div class="login-field">
          <label class="login-label">Work email</label>
          <input class="login-input" type="email" id="loginEmail"
            placeholder="yourname@kunjilal.com"
            onkeydown="if(event.key==='Enter')document.getElementById('loginPassword').focus()"
            oninput="previewUserFromEmail(this.value)">
        </div>

        <!-- Avatar preview (auto shows when email matched) -->
        <div id="loginAvatarWrap" style="display:none;margin-bottom:14px;align-items:center;gap:10px;padding:8px 12px;background:var(--brand-pale);border-radius:var(--r-lg)">
          <div id="loginAvatar" class="login-avatar-sm"></div>
          <div>
            <div id="loginUserName" style="font-size:13px;font-weight:700;color:var(--text)"></div>
            <div id="loginRoleBadge" style="font-size:11px;font-weight:600;margin-top:1px"></div>
          </div>
        </div>

        <!-- Password -->
        <div class="login-field">
          <label class="login-label">Password</label>
          <div style="position:relative">
            <input class="login-input" type="password" id="loginPassword"
              placeholder="Enter your password"
              onkeydown="if(event.key==='Enter')doLogin()">
            <button onclick="toggleLoginPw('loginPassword')" class="login-eye">👁</button>
          </div>
        </div>

        <button class="login-btn" onclick="doLogin()">Sign in →</button>

        <div class="login-hint">
          <strong>Email:</strong> yourname@kunjilal.com &nbsp;·&nbsp; <strong>Password:</strong> yourname123
        </div>

      </div>
    </div>`;
}

/* ── Email → auto-show user avatar ──────────────────────── */
function previewUserFromEmail(email) {
  const wrap = document.getElementById('loginAvatarWrap');
  const av   = document.getElementById('loginAvatar');
  const nm   = document.getElementById('loginUserName');
  const rb   = document.getElementById('loginRoleBadge');
  if (!wrap) return;

  const user = Object.values(TEAM_USERS).find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) { wrap.style.display = 'none'; return; }

  wrap.style.display = 'flex';
  av.textContent = user.avatar;
  av.style.cssText = `background:${user.color};color:${user.textColor};width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0`;
  nm.textContent = user.name;
  rb.textContent = user.role === 'admin' ? '⭐ Admin' : '👤 Member';
  rb.style.color = user.role === 'admin' ? '#92400E' : 'var(--brand)';
}

function toggleLoginPw(id) {
  const inp = document.getElementById(id);
  if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
}

/* ── Sign in ─────────────────────────────────────────────── */
function doLogin() {
  const email = (document.getElementById('loginEmail').value || '').trim().toLowerCase();
  const pw    = (document.getElementById('loginPassword').value || '');

  if (!email) { _loginError('Enter your work email'); return; }
  if (!pw)    { _loginError('Enter your password'); return; }

  // Find user by email
  const user = Object.values(TEAM_USERS).find(u => u.email.toLowerCase() === email);
  if (!user) {
    _loginError(`No account found for ${email}. Check your email address.`);
    return;
  }

  // Check password
  const savedPw = (state.teamPasswords && state.teamPasswords[user.id]) || user.password;
  if (pw !== savedPw) {
    _loginError('Incorrect password. Try your default or contact an admin.');
    return;
  }

  // ✅ Success
  currentUser = user;
  sessionStorage.setItem('sh_session', JSON.stringify({ id: user.id }));
  document.getElementById('loginScreen').style.display = 'none';
  _enterApp();
}

/* ── Change password from login screen ───────────────────── */
function changePasswordFromLogin() {
  const email = (document.getElementById('cpEmail').value || '').trim().toLowerCase();
  const old   = (document.getElementById('cpOld').value  || '');
  const pw    = (document.getElementById('cpNew').value  || '');
  const pw2   = (document.getElementById('cpNew2').value || '');

  const user  = Object.values(TEAM_USERS).find(u => u.email.toLowerCase() === email);
  if (!user)         { _loginError('Email not found');               return; }

  const savedPw = (state.teamPasswords && state.teamPasswords[user.id]) || user.password;
  if (old !== savedPw)      { _loginError('Current password is incorrect');  return; }
  if (!pw || pw.length < 6) { _loginError('New password must be 6+ characters'); return; }
  if (pw !== pw2)            { _loginError('Passwords do not match');          return; }

  if (!state.teamPasswords) state.teamPasswords = {};
  state.teamPasswords[user.id]   = pw;
  TEAM_USERS[user.id].password   = pw;
  saveState();

  // Show success then go to sign in
  _loginSuccess('✅ Password updated! Sign in with your new password.');
  setTimeout(() => showLoginScreen('signin'), 2000);
}

function _loginError(msg) {
  const err = document.getElementById('loginError');
  const suc = document.getElementById('loginSuccess');
  if (err) { err.textContent = '⚠️ ' + msg; err.style.display = ''; }
  if (suc) suc.style.display = 'none';
  const inputs = document.querySelectorAll('.login-input');
  inputs.forEach(i => { i.classList.add('login-input-error'); setTimeout(()=>i.classList.remove('login-input-error'),500); });
}

function _loginSuccess(msg) {
  const suc = document.getElementById('loginSuccess');
  const err = document.getElementById('loginError');
  if (suc) { suc.textContent = msg; suc.style.display = ''; }
  if (err) err.style.display = 'none';
}

/* ══════════════════════════════════════════════════════════
   ENTER APP
══════════════════════════════════════════════════════════ */
function _enterApp() {
  document.getElementById('app').style.display = 'flex';
  _applyUserPermissions();
  _updateUserChip();
  navigate('channels', document.querySelector('.nav-item[data-view="channels"]'));
  showToast(`Welcome, ${currentUser.name}! ${currentUser.role==='admin'?'⭐':'👤'}`, 'success');
}

function logout() {
  currentUser = null;
  sessionStorage.removeItem('sh_session');
  showLoginScreen();
}

/* ══════════════════════════════════════════════════════════
   PERMISSIONS
══════════════════════════════════════════════════════════ */
function _applyUserPermissions() {
  if (!currentUser) return;
  if (currentUser.role === 'admin') {
    document.querySelectorAll('.nav-item, .nav-sub-item').forEach(el => el.style.display = '');
    return;
  }
  const perms  = currentUser.permissions || [];
  const viewMap = {
    calendar:['channels'], email:['email'], whatsapp:['whatsapp'],
    meta:['meta'], media:['media'], ideas:['ideas'],
    planner:['agenda'], reminders:['reminders'], analytics:['analytics'],
    integrations:['integrations'], team:['team'], settings:['settings'],
  };
  document.querySelectorAll('.nav-item[data-view], .nav-sub-item').forEach(el => {
    const view = el.dataset.view || el.dataset.ch;
    const ok   = perms.includes('all') || Object.entries(viewMap).some(([p,vs]) => perms.includes(p) && vs.includes(view));
    el.style.display = ok ? '' : 'none';
  });
}

function hasPermission(key) {
  if (!currentUser) return false;
  if (currentUser.role === 'admin') return true;
  const p = currentUser.permissions || [];
  return p.includes('all') || p.includes(key);
}

function _updateUserChip() {
  if (!currentUser) return;
  const av   = document.getElementById('userAvatar');
  const name = document.getElementById('userName');
  const plan = document.getElementById('userPlan');
  if (av)   { av.textContent = currentUser.avatar; av.style.background = currentUser.color; av.style.color = currentUser.textColor; }
  if (name) name.textContent = currentUser.name;
  if (plan) { plan.textContent = currentUser.role==='admin' ? '⭐ Admin' : '👤 Member'; plan.style.color = currentUser.role==='admin'?'#FCD34D':'var(--sky)'; }
}

/* ══════════════════════════════════════════════════════════
   TEAM PAGE
══════════════════════════════════════════════════════════ */
function renderTeam() {
  const el      = document.getElementById('view-team');
  if (!el) return;
  const isAdmin = currentUser && currentUser.role === 'admin';

  el.innerHTML = `<div style="max-width:900px">

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px">
      <div>
        <h2 style="font-size:22px;font-weight:800;color:var(--text);letter-spacing:-.4px">👥 Team</h2>
        <div style="font-size:13px;color:var(--text3);margin-top:4px">
          ${isAdmin ? '⭐ Admin — manage team permissions and reset passwords below' : '👤 Team member'}
        </div>
      </div>
    </div>

    <!-- Team cards -->
    <div class="team-grid" style="margin-bottom:32px">
      ${Object.values(TEAM_USERS).map(u => {
        const perms = (state.teamPermissions&&state.teamPermissions[u.id]) || u.permissions || [];
        const permLabel = u.role==='admin' ? 'Full access' : perms.includes('all') ? 'All access' : `${perms.length} permissions`;
        return `<div class="team-card" style="border-top:3px solid ${u.textColor}">
          <div class="team-avatar-lg" style="background:${u.color};color:${u.textColor}">${u.avatar}</div>
          <div class="team-name">${u.name}</div>
          <div style="font-size:11px;color:var(--text3);margin-bottom:4px">${u.email}</div>
          <div class="team-role">${u.role==='admin'?'⭐ Admin':'👤 Member'}</div>
          <div style="font-size:11px;color:var(--text3);margin-bottom:12px">${permLabel}</div>
          ${isAdmin && u.role !== 'admin' ? `
            <button class="btn btn-primary btn-sm" style="width:100%;margin-bottom:6px" onclick="openPermissionsModal('${u.id}')">🔐 Manage access</button>
            <button class="btn btn-ghost btn-sm" style="width:100%;margin-bottom:6px" onclick="openAdminResetPasswordModal('${u.id}')">🔑 Reset password</button>` : ''}
          ${u.id===(currentUser&&currentUser.id) ? `
            <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:4px" onclick="openChangeOwnPasswordModal()">🔑 Change my password</button>` : ''}
        </div>`;
      }).join('')}
    </div>

    <!-- Permissions table (admin only) -->
    ${isAdmin ? `
    <div style="background:var(--white);border:1.5px solid var(--border);border-radius:var(--r-xl);padding:20px;box-shadow:var(--sh-sm);margin-bottom:20px">
      <div style="font-size:15px;font-weight:800;color:var(--text);margin-bottom:16px;padding-bottom:12px;border-bottom:1.5px solid var(--border)">🔐 Permissions overview</div>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="background:var(--surface2)">
              <th style="padding:10px 14px;text-align:left;font-weight:700;color:var(--text2);border-bottom:1.5px solid var(--border)">Member</th>
              ${ALL_PERMISSIONS.map(p=>`<th style="padding:8px 4px;text-align:center;font-size:9px;font-weight:700;color:var(--text3);border-bottom:1.5px solid var(--border);white-space:nowrap">${p.label.split(' ')[0]}</th>`).join('')}
              <th style="border-bottom:1.5px solid var(--border);padding:8px"></th>
            </tr>
          </thead>
          <tbody>
            ${Object.values(TEAM_USERS).filter(u=>u.role!=='admin').map(u=>{
              const perms=(state.teamPermissions&&state.teamPermissions[u.id])||u.permissions||[];
              const hasAll=perms.includes('all');
              return `<tr style="border-bottom:1px solid var(--border)">
                <td style="padding:10px 14px">
                  <div style="display:flex;align-items:center;gap:8px">
                    <div style="width:28px;height:28px;border-radius:50%;background:${u.color};color:${u.textColor};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800">${u.avatar}</div>
                    <div>
                      <div style="font-weight:700;color:var(--text);font-size:12px">${u.name}</div>
                      <div style="font-size:10px;color:var(--text3)">${u.email}</div>
                    </div>
                  </div>
                </td>
                ${ALL_PERMISSIONS.map(p=>`<td style="padding:8px 4px;text-align:center">${hasAll||perms.includes(p.key)?'<span style="color:var(--green);font-size:14px">✓</span>':'<span style="color:var(--border3);font-size:14px">–</span>'}</td>`).join('')}
                <td style="padding:8px 10px"><button class="btn btn-ghost btn-sm" onclick="openPermissionsModal('${u.id}')">Edit</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>` : ''}

    <!-- Sign out -->
    <div style="padding:14px 16px;background:var(--surface2);border-radius:var(--r-xl);display:flex;align-items:center;justify-content:space-between">
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--text)">${currentUser?currentUser.name:''} · ${currentUser?currentUser.email:''}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px">${currentUser?.role==='admin'?'⭐ Admin · Full access':'👤 Team member'}</div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="logout()" style="color:var(--coral);border-color:var(--coral)">Sign out</button>
    </div>
  </div>`;
}

/* ── Permissions modal ───────────────────────────────────── */
function openPermissionsModal(userId) {
  const u     = TEAM_USERS[userId];
  const saved = (state.teamPermissions&&state.teamPermissions[userId])||u.permissions||[];
  const hasAll= saved.includes('all');
  document.getElementById('modalTitle').textContent = `🔐 ${u.name}'s permissions`;
  document.getElementById('modalBody').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--surface2);border-radius:var(--r-lg);margin-bottom:14px">
      <div style="width:36px;height:36px;border-radius:50%;background:${u.color};color:${u.textColor};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800">${u.avatar}</div>
      <div><div style="font-size:14px;font-weight:800;color:var(--text)">${u.name}</div><div style="font-size:11px;color:var(--text3)">${u.email}</div></div>
    </div>
    <label class="perm-grant-all" onclick="toggleGrantAll(this)">
      <input type="checkbox" id="perm-all" ${hasAll?'checked':''} style="width:16px;height:16px;accent-color:var(--brand)">
      <div><div style="font-size:13px;font-weight:700;color:var(--text)">Grant full access</div><div style="font-size:11px;color:var(--text3)">Can see and edit everything</div></div>
    </label>
    <div id="permCheckboxes" style="${hasAll?'opacity:.4;pointer-events:none':''}">
      ${ALL_PERMISSIONS.map(p=>`
        <label class="perm-row">
          <input type="checkbox" class="perm-check" data-key="${p.key}" ${hasAll||saved.includes(p.key)?'checked':''} style="width:16px;height:16px;accent-color:var(--brand);flex-shrink:0">
          <div><div style="font-size:13px;font-weight:600;color:var(--text)">${p.label}</div><div style="font-size:11px;color:var(--text3)">${p.desc}</div></div>
        </label>`).join('')}
    </div>`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="savePermissions('${userId}')">💾 Save</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

function toggleGrantAll(el) {
  const cb   = document.getElementById('perm-all');
  cb.checked = !cb.checked;
  const wrap = document.getElementById('permCheckboxes');
  wrap.style.opacity       = cb.checked ? '.4' : '1';
  wrap.style.pointerEvents = cb.checked ? 'none' : '';
}

function savePermissions(userId) {
  const all   = document.getElementById('perm-all').checked;
  const perms = all ? ['all'] : [...document.querySelectorAll('.perm-check:checked')].map(c=>c.dataset.key);
  if (!state.teamPermissions) state.teamPermissions = {};
  state.teamPermissions[userId]   = perms;
  TEAM_USERS[userId].permissions  = perms;
  saveState(); closeModal(); renderTeam();
  showToast(`✅ ${TEAM_USERS[userId].name}'s access updated!`, 'success');
}

/* ── Admin reset password ────────────────────────────────── */
function openAdminResetPasswordModal(userId) {
  const u = TEAM_USERS[userId];
  document.getElementById('modalTitle').textContent = `🔑 Reset ${u.name}'s password`;
  document.getElementById('modalBody').innerHTML = `
    <div style="background:var(--amber-light);border:1.5px solid var(--amber);border-radius:var(--r-lg);padding:12px 14px;margin-bottom:14px;font-size:12px;color:#92400E">
      ⚠️ You're setting a new password for <strong>${u.name}</strong> (${u.email}). Share it privately.
    </div>
    <div class="form-group"><label class="form-label">New password *</label>
      <input class="form-input" type="text" id="reset-pw" placeholder="Min 6 characters"></div>
    <div class="form-group"><label class="form-label">Confirm *</label>
      <input class="form-input" type="text" id="reset-pw2" placeholder="Re-enter"></div>`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveAdminResetPassword('${userId}')">🔑 Reset password</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

function saveAdminResetPassword(userId) {
  const pw  = (document.getElementById('reset-pw').value||'').trim();
  const pw2 = (document.getElementById('reset-pw2').value||'').trim();
  if (!pw||pw.length<6) { showToast('Min 6 characters','error'); return; }
  if (pw!==pw2)          { showToast('Passwords do not match','error'); return; }
  if (!state.teamPasswords) state.teamPasswords={};
  state.teamPasswords[userId]=pw; TEAM_USERS[userId].password=pw;
  saveState(); closeModal();
  showToast(`✅ ${TEAM_USERS[userId].name}'s password reset!`,'success');
}

/* ── Change own password (from Team page) ────────────────── */
function openChangeOwnPasswordModal() {
  document.getElementById('modalTitle').textContent = '🔑 Change your password';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group"><label class="form-label">Current password *</label>
      <input class="form-input" type="password" id="cp-old" placeholder="Your current password"></div>
    <div class="form-group"><label class="form-label">New password *</label>
      <input class="form-input" type="password" id="cp-new" placeholder="Min 6 characters"></div>
    <div class="form-group"><label class="form-label">Confirm new password *</label>
      <input class="form-input" type="password" id="cp-new2" placeholder="Re-enter"></div>`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveOwnPassword()">💾 Update password</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

function saveOwnPassword() {
  if (!currentUser) return;
  const old  = (document.getElementById('cp-old').value||'');
  const pw   = (document.getElementById('cp-new').value||'');
  const pw2  = (document.getElementById('cp-new2').value||'');
  const saved= (state.teamPasswords&&state.teamPasswords[currentUser.id])||currentUser.password;
  if (old!==saved)          { showToast('Current password incorrect','error'); return; }
  if (!pw||pw.length<6)     { showToast('Min 6 characters','error'); return; }
  if (pw!==pw2)              { showToast('Passwords do not match','error'); return; }
  if (!state.teamPasswords) state.teamPasswords={};
  state.teamPasswords[currentUser.id]=pw; TEAM_USERS[currentUser.id].password=pw;
  saveState(); closeModal();
  showToast('✅ Password changed!','success');
}

/* ══════════════════════════════════════════════════════════
   PROFILE MODAL — accessible from sidebar user chip
   Contains: profile info + change password
══════════════════════════════════════════════════════════ */
function openProfileModal() {
  if (!currentUser) return;
  const u = currentUser;

  document.getElementById('modalTitle').textContent = '👤 My Profile';
  document.getElementById('modalBody').innerHTML = `

    <!-- Profile card -->
    <div style="display:flex;align-items:center;gap:16px;padding:16px;background:linear-gradient(135deg,${u.color},${u.color}99);border-radius:var(--r-xl);margin-bottom:20px">
      <div style="width:56px;height:56px;border-radius:50%;background:${u.color};color:${u.textColor};display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;border:3px solid rgba(255,255,255,.6);box-shadow:var(--sh-md);flex-shrink:0">${u.avatar}</div>
      <div>
        <div style="font-size:18px;font-weight:800;color:var(--text)">${u.name}</div>
        <div style="font-size:13px;color:var(--text2);margin-top:2px">${u.email}</div>
        <div style="margin-top:6px">
          <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:${u.role==='admin'?'#FEF9C3':'var(--brand-light)'};color:${u.role==='admin'?'#92400E':'var(--brand-dark)'}">
            ${u.role === 'admin' ? '⭐ Admin' : '👤 Member'}
          </span>
        </div>
      </div>
    </div>

    <!-- Change password section -->
    <div style="border:1.5px solid var(--border);border-radius:var(--r-xl);overflow:hidden">
      <div style="padding:14px 16px;background:var(--surface2);border-bottom:1.5px solid var(--border);font-size:14px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:8px">
        🔑 Change password
      </div>
      <div style="padding:16px">
        <div class="form-group">
          <label class="form-label">Current password</label>
          <div style="position:relative">
            <input class="form-input" type="password" id="prof-old" placeholder="Enter current password" style="padding-right:44px">
            <button onclick="toggleProfPw('prof-old')" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:15px;color:var(--text3)">👁</button>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">New password</label>
            <div style="position:relative">
              <input class="form-input" type="password" id="prof-new" placeholder="Min 6 characters" style="padding-right:44px">
              <button onclick="toggleProfPw('prof-new')" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:15px;color:var(--text3)">👁</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Confirm new</label>
            <div style="position:relative">
              <input class="form-input" type="password" id="prof-new2" placeholder="Re-enter" style="padding-right:44px">
              <button onclick="toggleProfPw('prof-new2')" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:15px;color:var(--text3)">👁</button>
            </div>
          </div>
        </div>
        <div id="profPwMsg" style="display:none;font-size:12px;font-weight:600;padding:8px 12px;border-radius:var(--r-md);margin-bottom:8px"></div>
        <button class="btn btn-primary" style="width:100%" onclick="saveProfilePassword()">🔑 Update password</button>
      </div>
    </div>

    <!-- Sign out -->
    <div style="margin-top:14px;text-align:center">
      <button class="btn btn-ghost btn-sm" onclick="closeModal();logout()" style="color:var(--coral);border-color:var(--coral)">
        ⏻ Sign out
      </button>
    </div>`;

  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Close</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

function toggleProfPw(id) {
  const el = document.getElementById(id);
  if (el) el.type = el.type === 'password' ? 'text' : 'password';
}

function saveProfilePassword() {
  if (!currentUser) return;
  const old  = (document.getElementById('prof-old').value  || '');
  const pw   = (document.getElementById('prof-new').value  || '');
  const pw2  = (document.getElementById('prof-new2').value || '');
  const msg  = document.getElementById('profPwMsg');

  const showMsg = (text, ok) => {
    msg.textContent = text;
    msg.style.display = '';
    msg.style.background = ok ? 'var(--green-light)' : 'var(--coral-light)';
    msg.style.color = ok ? 'var(--green)' : 'var(--coral)';
  };

  const saved = (state.teamPasswords && state.teamPasswords[currentUser.id]) || currentUser.password;
  if (old !== saved)          { showMsg('⚠️ Current password is incorrect', false); return; }
  if (!pw || pw.length < 6)  { showMsg('⚠️ New password must be at least 6 characters', false); return; }
  if (pw !== pw2)             { showMsg('⚠️ Passwords do not match', false); return; }

  if (!state.teamPasswords) state.teamPasswords = {};
  state.teamPasswords[currentUser.id] = pw;
  TEAM_USERS[currentUser.id].password = pw;
  saveState();

  // Clear fields
  ['prof-old','prof-new','prof-new2'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  showMsg('✅ Password updated successfully!', true);
  showToast('✅ Password changed!', 'success');
}

/* ══════════════════════════════════════════════════════════
   SETTINGS → TEAM & PERMISSIONS TABLE
══════════════════════════════════════════════════════════ */
function renderTeamSettings() {
  const el = document.getElementById('rolesTable');
  if (!el) return;
  const isAdmin = currentUser && currentUser.role === 'admin';

  const PERM_COLS = [
    { key:'calendar',     label:'📅 Calendar' },
    { key:'email',        label:'📧 Email' },
    { key:'whatsapp',     label:'💬 WhatsApp' },
    { key:'meta',         label:'📊 Meta Ads' },
    { key:'media',        label:'🖼 Photos' },
    { key:'ideas',        label:'💡 Ideas' },
    { key:'planner',      label:'🗒 Planner' },
    { key:'analytics',    label:'📈 Analytics' },
    { key:'integrations', label:'🔗 Integrations' },
    { key:'settings',     label:'⚙ Settings' },
  ];

  el.innerHTML = `
    <div style="overflow-x:auto;margin-top:8px">
      <table style="width:100%;border-collapse:collapse;font-size:12px;min-width:700px">
        <thead>
          <tr style="background:var(--surface2)">
            <th style="padding:12px 14px;text-align:left;font-weight:700;color:var(--text2);border-bottom:2px solid var(--border);white-space:nowrap;position:sticky;left:0;background:var(--surface2);z-index:2">
              👤 Member
            </th>
            <th style="padding:10px 8px;text-align:center;font-weight:700;color:var(--text2);border-bottom:2px solid var(--border)">Role</th>
            ${PERM_COLS.map(p=>`
              <th style="padding:10px 6px;text-align:center;font-size:10px;font-weight:700;color:var(--text3);border-bottom:2px solid var(--border);white-space:nowrap">
                ${p.label}
              </th>`).join('')}
            ${isAdmin ? `<th style="padding:10px 8px;border-bottom:2px solid var(--border)"></th>` : ''}
          </tr>
        </thead>
        <tbody>
          ${Object.values(TEAM_USERS).map(u => {
            const perms = (state.teamPermissions&&state.teamPermissions[u.id]) || u.permissions || [];
            const hasAll = u.role==='admin' || perms.includes('all');
            return `<tr style="border-bottom:1px solid var(--border);transition:background .12s" onmouseover="this.style.background='var(--brand-pale)'" onmouseout="this.style.background=''">
              <!-- Member info -->
              <td style="padding:12px 14px;position:sticky;left:0;background:inherit;z-index:1">
                <div style="display:flex;align-items:center;gap:10px">
                  <div style="width:32px;height:32px;border-radius:50%;background:${u.color};color:${u.textColor};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0">${u.avatar}</div>
                  <div>
                    <div style="font-weight:700;color:var(--text);font-size:13px">${u.name}</div>
                    <div style="font-size:10px;color:var(--text3)">${u.email}</div>
                  </div>
                </div>
              </td>
              <!-- Role badge -->
              <td style="padding:10px 8px;text-align:center">
                <span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${u.role==='admin'?'#FEF9C3':'var(--brand-light)'};color:${u.role==='admin'?'#92400E':'var(--brand-dark)'}">
                  ${u.role==='admin'?'⭐ Admin':'👤 Member'}
                </span>
              </td>
              <!-- Permission checkboxes -->
              ${PERM_COLS.map(p => {
                const checked = hasAll || perms.includes(p.key);
                if (u.role === 'admin') {
                  return `<td style="padding:10px 6px;text-align:center"><span style="color:var(--green);font-size:16px">✓</span></td>`;
                }
                if (!isAdmin) {
                  return `<td style="padding:10px 6px;text-align:center">${checked?'<span style="color:var(--green);font-size:16px">✓</span>':'<span style="color:var(--border3);font-size:14px">—</span>'}</td>`;
                }
                return `<td style="padding:10px 6px;text-align:center">
                  <label style="cursor:pointer;display:inline-flex;align-items:center;justify-content:center">
                    <input type="checkbox" ${checked?'checked':''} ${hasAll?'disabled':''}
                      style="width:16px;height:16px;accent-color:var(--brand);cursor:pointer"
                      onchange="toggleMemberPerm('${u.id}','${p.key}',this.checked)">
                  </label>
                </td>`;
              }).join('')}
              <!-- Actions -->
              ${isAdmin ? `
              <td style="padding:10px 8px;text-align:center;white-space:nowrap">
                ${u.role !== 'admin' ? `
                <div style="display:flex;gap:4px;justify-content:center">
                  <button class="btn btn-ghost btn-sm" onclick="quickGrantAll('${u.id}')" title="Grant full access" style="font-size:10px;padding:3px 8px">All ✓</button>
                  <button class="btn btn-ghost btn-sm" onclick="quickRevokeAll('${u.id}')" title="Revoke all access" style="font-size:10px;padding:3px 8px;color:var(--coral)">None ✗</button>
                  <button class="btn btn-ghost btn-sm" onclick="openAdminResetPasswordModal('${u.id}')" title="Reset password" style="font-size:10px;padding:3px 8px">🔑</button>
                </div>` : ''}
              </td>` : ''}
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    ${isAdmin ? `
    <div style="margin-top:16px;padding:12px 14px;background:var(--brand-pale);border-radius:var(--r-lg);font-size:12px;color:var(--brand);line-height:1.7">
      💡 <strong>Tip:</strong> Check/uncheck any box to grant or revoke access instantly.
      Changes take effect the next time that member logs in or refreshes the page.
      Click <strong>All ✓</strong> to give full access · <strong>None ✗</strong> to revoke everything.
    </div>` : `
    <div style="margin-top:16px;padding:12px 14px;background:var(--surface2);border-radius:var(--r-lg);font-size:12px;color:var(--text3)">
      Contact Anusha, Anjani or Tejasv to change your permissions.
    </div>`}`;
}

function toggleMemberPerm(userId, permKey, checked) {
  if (!state.teamPermissions) state.teamPermissions = {};
  if (!state.teamPermissions[userId]) {
    state.teamPermissions[userId] = [...(TEAM_USERS[userId]?.permissions || [])];
  }
  const perms = state.teamPermissions[userId];
  // Remove 'all' if individual perm is being toggled
  const allIdx = perms.indexOf('all');
  if (allIdx > -1) perms.splice(allIdx, 1);

  if (checked && !perms.includes(permKey)) {
    perms.push(permKey);
  } else if (!checked) {
    const idx = perms.indexOf(permKey);
    if (idx > -1) perms.splice(idx, 1);
  }
  TEAM_USERS[userId].permissions = perms;
  saveState();
  showToast(`✅ ${TEAM_USERS[userId].name}'s permissions updated`, 'success');
}

function quickGrantAll(userId) {
  if (!state.teamPermissions) state.teamPermissions = {};
  state.teamPermissions[userId]   = ['all'];
  TEAM_USERS[userId].permissions  = ['all'];
  saveState();
  renderTeamSettings();
  showToast(`✅ Full access granted to ${TEAM_USERS[userId].name}`, 'success');
}

function quickRevokeAll(userId) {
  if (!state.teamPermissions) state.teamPermissions = {};
  state.teamPermissions[userId]   = [];
  TEAM_USERS[userId].permissions  = [];
  saveState();
  renderTeamSettings();
  showToast(`${TEAM_USERS[userId].name}'s access revoked`, 'success');
}
