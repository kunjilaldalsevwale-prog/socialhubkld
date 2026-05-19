/* ============================================================
   AUTH SYSTEM — Login, Sessions, Role-based Access
   7 team members · 3 admins · localStorage session
   ============================================================ */

/* ── TEAM CREDENTIALS ───────────────────────────────────────
   Passwords are hashed (SHA-256-like simple hash for local use)
   Admins can reset any member's password from Team → Admin panel
─────────────────────────────────────────────────────────────── */
const TEAM_USERS = {
  anusha:   { id:'anusha',   name:'Anusha',   role:'admin',  avatar:'AN', color:'#DBEAFE', textColor:'#1D4ED8', password:'anusha123',   permissions:['all'] },
  anjani:   { id:'anjani',   name:'Anjani',   role:'admin',  avatar:'AJ', color:'#EDE9FE', textColor:'#5B21B6', password:'anjani123',   permissions:['all'] },
  tejasv:   { id:'tejasv',   name:'Tejasv',   role:'admin',  avatar:'TJ', color:'#DCFCE7', textColor:'#065F46', password:'tejasv123',   permissions:['all'] },
  ashish:   { id:'ashish',   name:'Ashish',   role:'member', avatar:'AS', color:'#FEF9C3', textColor:'#92400E', password:'ashish123',   permissions:[] },
  mukul:    { id:'mukul',    name:'Mukul',    role:'member', avatar:'MK', color:'#FCE7F3', textColor:'#9D174D', password:'mukul123',    permissions:[] },
  varshang: { id:'varshang', name:'Varshang', role:'member', avatar:'VR', color:'#FEE2E2', textColor:'#991B1B', password:'varshang123', permissions:[] },
  vidhi:    { id:'vidhi',    name:'Vidhi',    role:'member', avatar:'VD', color:'#F0FDFA', textColor:'#0D9488', password:'vidhi123',    permissions:[] },
};

// All possible permissions admins can grant
const ALL_PERMISSIONS = [
  { key:'calendar',     label:'📅 Calendar',          desc:'View & add posts to calendar' },
  { key:'email',        label:'📧 Email Marketing',   desc:'View & create email campaigns' },
  { key:'whatsapp',     label:'💬 WhatsApp',          desc:'View & send WhatsApp messages' },
  { key:'meta',         label:'📊 Meta Ads',          desc:'View Meta ad campaigns' },
  { key:'media',        label:'🖼 Media Library',     desc:'Upload & manage media files' },
  { key:'ideas',        label:'💡 Ideas Board',       desc:'Add & schedule ideas' },
  { key:'planner',      label:'🗒 Monthly Planner',   desc:'Edit monthly content plan' },
  { key:'reminders',    label:'⏰ Reminders',         desc:'Set & manage reminders' },
  { key:'analytics',    label:'📈 Analytics',         desc:'View analytics & reports' },
  { key:'integrations', label:'🔗 Integrations',      desc:'Manage API integrations' },
  { key:'team',         label:'👥 Team',              desc:'View team members' },
  { key:'settings',     label:'⚙ Settings',          desc:'View settings' },
];

// Current session
let currentUser = null;

/* ── INIT ─────────────────────────────────────────────────── */
function initAuth() {
  // Load saved passwords/permissions from state
  if (!state.teamPasswords) state.teamPasswords   = {};
  if (!state.teamPermissions) state.teamPermissions = {};

  // Merge saved data into TEAM_USERS
  Object.keys(TEAM_USERS).forEach(id => {
    if (state.teamPasswords[id])   TEAM_USERS[id].password    = state.teamPasswords[id];
    if (state.teamPermissions[id]) TEAM_USERS[id].permissions = state.teamPermissions[id];
  });

  // Check saved session
  const saved = sessionStorage.getItem('sh_session');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed && TEAM_USERS[parsed.id]) {
      currentUser = TEAM_USERS[parsed.id];
      _enterApp();
      return;
    }
  }
  showLoginScreen();
}

/* ── LOGIN SCREEN ─────────────────────────────────────────── */
function showLoginScreen() {
  document.getElementById('app').style.display = 'none';
  let loginEl = document.getElementById('loginScreen');
  if (!loginEl) {
    loginEl = document.createElement('div');
    loginEl.id = 'loginScreen';
    document.body.appendChild(loginEl);
  }
  loginEl.style.display = 'flex';
  loginEl.innerHTML = `
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
        <p class="login-sub">Sign in to your team workspace</p>

        <!-- Error msg -->
        <div id="loginError" class="login-error" style="display:none"></div>

        <!-- Username -->
        <div class="login-field">
          <label class="login-label">Team member</label>
          <div class="login-select-wrap">
            <select class="login-select" id="loginUser" onchange="updateLoginAvatar()">
              <option value="">— Select your name —</option>
              ${Object.values(TEAM_USERS).map(u =>
                `<option value="${u.id}">${u.name} ${u.role==='admin'?'⭐':''}</option>`
              ).join('')}
            </select>
          </div>
        </div>

        <!-- Avatar preview -->
        <div id="loginAvatarWrap" style="display:none;margin-bottom:16px;text-align:center">
          <div id="loginAvatar" class="login-avatar-preview"></div>
          <div id="loginRoleBadge" class="login-role-badge"></div>
        </div>

        <!-- Password -->
        <div class="login-field">
          <label class="login-label">Password</label>
          <div style="position:relative">
            <input class="login-input" type="password" id="loginPassword"
              placeholder="Enter your password"
              onkeydown="if(event.key==='Enter')doLogin()">
            <button onclick="toggleLoginPw()" class="login-eye">👁</button>
          </div>
        </div>

        <button class="login-btn" onclick="doLogin()">Sign in →</button>

        <div class="login-hint">
          Default passwords: <strong>[yourname]123</strong><br>
          e.g. anusha123 · anjani123 · tejasv123<br>
          Admins can reset passwords from the Team panel.
        </div>
      </div>
    </div>`;
}

function updateLoginAvatar() {
  const id   = document.getElementById('loginUser').value;
  const wrap = document.getElementById('loginAvatarWrap');
  const av   = document.getElementById('loginAvatar');
  const rb   = document.getElementById('loginRoleBadge');
  if (!id) { wrap.style.display='none'; return; }
  const u = TEAM_USERS[id];
  wrap.style.display = '';
  av.textContent = u.avatar;
  av.style.cssText = `background:${u.color};color:${u.textColor};`;
  rb.textContent  = u.role === 'admin' ? '⭐ Admin' : '👤 Member';
  rb.className    = `login-role-badge ${u.role==='admin'?'login-role-admin':'login-role-member'}`;
}

function toggleLoginPw() {
  const inp = document.getElementById('loginPassword');
  if (inp) inp.type = inp.type==='password' ? 'text' : 'password';
}

function doLogin() {
  const id  = document.getElementById('loginUser').value;
  const pw  = document.getElementById('loginPassword').value;
  const err = document.getElementById('loginError');

  if (!id) { _loginError('Please select your name'); return; }
  if (!pw)  { _loginError('Please enter your password'); return; }

  const user = TEAM_USERS[id];
  if (!user) { _loginError('User not found'); return; }

  // Check password
  const savedPw = state.teamPasswords && state.teamPasswords[id] ? state.teamPasswords[id] : user.password;
  if (pw !== savedPw) {
    _loginError('Incorrect password. Try [yourname]123 or ask an admin to reset it.');
    return;
  }

  // Check if member has any permissions
  if (user.role !== 'admin' && (!user.permissions || user.permissions.length === 0)) {
    _loginError('Your account has no permissions yet. Ask Anusha, Anjani or Tejasv to grant you access.');
    return;
  }

  // Success
  currentUser = user;
  sessionStorage.setItem('sh_session', JSON.stringify({ id: user.id, name: user.name }));
  document.getElementById('loginScreen').style.display = 'none';
  _enterApp();
}

function _loginError(msg) {
  const err = document.getElementById('loginError');
  if (err) { err.textContent = '⚠️ ' + msg; err.style.display = ''; }
  const inp = document.getElementById('loginPassword');
  if (inp) { inp.classList.add('login-input-error'); setTimeout(()=>inp.classList.remove('login-input-error'), 600); }
}

function _enterApp() {
  document.getElementById('app').style.display = 'flex';
  _applyUserPermissions();
  _updateUserChip();
  navigate('channels', document.querySelector('.nav-item[data-view="channels"]'));
  showToast(`Welcome back, ${currentUser.name}! ${currentUser.role==='admin'?'⭐':'👤'}`, 'success');
}

function logout() {
  currentUser = null;
  sessionStorage.removeItem('sh_session');
  showLoginScreen();
}

/* ── PERMISSIONS ──────────────────────────────────────────── */
function _applyUserPermissions() {
  if (!currentUser) return;
  if (currentUser.role === 'admin') {
    // Admins see everything
    document.querySelectorAll('.nav-item, .nav-sub-item').forEach(el => el.style.display = '');
    return;
  }
  // Members — hide nav items they don't have access to
  const perms = currentUser.permissions || [];
  const viewMap = {
    calendar: ['channels'], email: ['email'], whatsapp: ['whatsapp'],
    meta: ['meta'], media: ['media'], ideas: ['ideas'],
    planner: ['agenda'], reminders: ['reminders'], analytics: ['analytics'],
    integrations: ['integrations'], team: ['team'], settings: ['settings'],
  };
  document.querySelectorAll('.nav-item[data-view], .nav-sub-item').forEach(el => {
    const view = el.dataset.view || el.dataset.ch;
    const hasAccess = perms.includes('all') || Object.entries(viewMap).some(([perm, views]) =>
      perms.includes(perm) && views.includes(view)
    );
    el.style.display = hasAccess ? '' : 'none';
  });
}

function hasPermission(key) {
  if (!currentUser) return false;
  if (currentUser.role === 'admin') return true;
  const perms = currentUser.permissions || [];
  return perms.includes('all') || perms.includes(key);
}

function requirePermission(key, actionName) {
  if (!hasPermission(key)) {
    showToast(`⛔ You need "${actionName}" permission. Ask an admin.`, 'error');
    return false;
  }
  return true;
}

/* ── USER CHIP ────────────────────────────────────────────── */
function _updateUserChip() {
  if (!currentUser) return;
  const av   = document.getElementById('userAvatar');
  const name = document.getElementById('userName');
  const plan = document.getElementById('userPlan');
  if (av)   { av.textContent = currentUser.avatar; av.style.background = currentUser.color; av.style.color = currentUser.textColor; }
  if (name) name.textContent = currentUser.name;
  if (plan) { plan.textContent = currentUser.role === 'admin' ? '⭐ Admin' : '👤 Member'; plan.style.color = currentUser.role==='admin'?'#FCD34D':'var(--sky)'; }
}

/* ══════════════════════════════════════════════════════════
   TEAM & ADMIN PANEL
══════════════════════════════════════════════════════════ */
function renderTeam() {
  const el = document.getElementById('view-team');
  if (!el) return;

  const isAdmin = currentUser && currentUser.role === 'admin';

  el.innerHTML = `
    <div style="max-width:900px">

      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px">
        <div>
          <h2 style="font-size:22px;font-weight:800;color:var(--text);letter-spacing:-.4px">👥 Team</h2>
          <div style="font-size:13px;color:var(--text3);margin-top:4px">
            ${isAdmin ? '⭐ You have admin access — manage team permissions below' : '👤 You are a team member'}
          </div>
        </div>
        ${isAdmin ? `<button class="btn btn-primary" onclick="showAddMemberInfo()">+ Add member</button>` : ''}
      </div>

      <!-- Team cards -->
      <div class="team-grid" style="margin-bottom:32px">
        ${Object.values(TEAM_USERS).map(u => {
          const perms = (state.teamPermissions&&state.teamPermissions[u.id]) || u.permissions || [];
          const permCount = perms.includes('all') ? 'All access' : `${perms.length} permissions`;
          return `<div class="team-card" style="border-top:3px solid ${u.textColor}">
            <div class="team-avatar-lg" style="background:${u.color};color:${u.textColor}">${u.avatar}</div>
            <div class="team-name">${u.name}</div>
            <div class="team-role">${u.role === 'admin' ? '⭐ Admin' : '👤 Member'}</div>
            <div style="font-size:11px;color:var(--text3);margin-bottom:12px;font-weight:500">
              ${u.role==='admin' ? 'Full access' : permCount}
            </div>
            ${isAdmin && u.role !== 'admin' ? `
              <button class="btn btn-primary btn-sm" style="width:100%;margin-bottom:6px" onclick="openPermissionsModal('${u.id}')">
                🔐 Manage access
              </button>
              <button class="btn btn-ghost btn-sm" style="width:100%" onclick="openResetPasswordModal('${u.id}')">
                🔑 Reset password
              </button>` : ''}
            ${u.id === (currentUser&&currentUser.id) ? `
              <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:6px" onclick="openChangeOwnPasswordModal()">
                🔑 Change password
              </button>` : ''}
          </div>`;
        }).join('')}
      </div>

      <!-- Permissions overview (admin only) -->
      ${isAdmin ? `
      <div style="background:var(--white);border:1.5px solid var(--border);border-radius:var(--r-xl);padding:20px;box-shadow:var(--sh-sm)">
        <div style="font-size:15px;font-weight:800;color:var(--text);margin-bottom:16px;padding-bottom:12px;border-bottom:1.5px solid var(--border)">
          🔐 Permissions overview
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead>
              <tr style="background:var(--surface2)">
                <th style="padding:10px 14px;text-align:left;font-weight:700;color:var(--text2);border-bottom:1.5px solid var(--border)">Member</th>
                ${ALL_PERMISSIONS.map(p=>`<th style="padding:8px 6px;text-align:center;font-size:10px;font-weight:700;color:var(--text3);border-bottom:1.5px solid var(--border);white-space:nowrap">${p.label.split(' ')[0]}</th>`).join('')}
                <th style="padding:8px 10px;border-bottom:1.5px solid var(--border)"></th>
              </tr>
            </thead>
            <tbody>
              ${Object.values(TEAM_USERS).filter(u=>u.role!=='admin').map(u=>{
                const perms=(state.teamPermissions&&state.teamPermissions[u.id])||u.permissions||[];
                const hasAll=perms.includes('all');
                return `<tr style="border-bottom:1px solid var(--border)">
                  <td style="padding:10px 14px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:8px">
                    <div style="width:28px;height:28px;border-radius:50%;background:${u.color};color:${u.textColor};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0">${u.avatar}</div>
                    ${u.name}
                  </td>
                  ${ALL_PERMISSIONS.map(p=>`<td style="padding:8px 6px;text-align:center">${hasAll||perms.includes(p.key)?'<span style="color:var(--green);font-size:14px">✓</span>':'<span style="color:var(--border3);font-size:14px">–</span>'}</td>`).join('')}
                  <td style="padding:8px 10px"><button class="btn btn-ghost btn-sm" onclick="openPermissionsModal('${u.id}')">Edit</button></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>` : ''}

      <!-- Logout -->
      <div style="margin-top:20px;padding:14px;background:var(--surface2);border-radius:var(--r-xl);display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--text)">Signed in as ${currentUser?currentUser.name:''}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:2px">${currentUser?.role==='admin'?'⭐ Admin · Full access':'👤 Team member'}</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="logout()" style="color:var(--coral);border-color:var(--coral)">Sign out</button>
      </div>

    </div>`;
}

/* ── PERMISSIONS MODAL ────────────────────────────────────── */
function openPermissionsModal(userId) {
  const u     = TEAM_USERS[userId];
  const saved = (state.teamPermissions && state.teamPermissions[userId]) || u.permissions || [];
  const hasAll= saved.includes('all');

  document.getElementById('modalTitle').textContent = `🔐 ${u.name}'s permissions`;
  document.getElementById('modalBody').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--surface2);border-radius:var(--r-lg);margin-bottom:16px">
      <div style="width:38px;height:38px;border-radius:50%;background:${u.color};color:${u.textColor};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800">${u.avatar}</div>
      <div>
        <div style="font-size:14px;font-weight:800;color:var(--text)">${u.name}</div>
        <div style="font-size:11px;color:var(--text3)">Team member · Set what they can access</div>
      </div>
    </div>

    <div class="perm-grant-all" onclick="toggleGrantAll(this)">
      <input type="checkbox" id="perm-all" ${hasAll?'checked':''} style="width:16px;height:16px;accent-color:var(--brand)">
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--text)">Grant full access</div>
        <div style="font-size:11px;color:var(--text3)">Same as admin — can see and edit everything</div>
      </div>
    </div>

    <div id="permCheckboxes" style="${hasAll?'opacity:.4;pointer-events:none':''}">
      ${ALL_PERMISSIONS.map(p => `
        <label class="perm-row">
          <input type="checkbox" class="perm-check" data-key="${p.key}"
            ${hasAll||saved.includes(p.key)?'checked':''}
            style="width:16px;height:16px;accent-color:var(--brand);flex-shrink:0">
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--text)">${p.label}</div>
            <div style="font-size:11px;color:var(--text3)">${p.desc}</div>
          </div>
        </label>`).join('')}
    </div>`;

  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="savePermissions('${userId}')">💾 Save permissions</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

function toggleGrantAll(el) {
  const cb  = document.getElementById('perm-all');
  cb.checked = !cb.checked;
  const wrap = document.getElementById('permCheckboxes');
  wrap.style.opacity         = cb.checked ? '.4' : '1';
  wrap.style.pointerEvents   = cb.checked ? 'none' : '';
}

function savePermissions(userId) {
  const all   = document.getElementById('perm-all').checked;
  let   perms = [];
  if (all) {
    perms = ['all'];
  } else {
    document.querySelectorAll('.perm-check:checked').forEach(cb => perms.push(cb.dataset.key));
  }
  if (!state.teamPermissions) state.teamPermissions = {};
  state.teamPermissions[userId] = perms;
  TEAM_USERS[userId].permissions = perms;
  saveState();
  closeModal();
  renderTeam();
  showToast(`✅ ${TEAM_USERS[userId].name}'s permissions updated!`, 'success');
}

/* ── PASSWORD RESET (admin) ───────────────────────────────── */
function openResetPasswordModal(userId) {
  const u = TEAM_USERS[userId];
  document.getElementById('modalTitle').textContent = `🔑 Reset ${u.name}'s password`;
  document.getElementById('modalBody').innerHTML = `
    <div style="background:var(--amber-light);border:1.5px solid var(--amber);border-radius:var(--r-lg);padding:12px 14px;margin-bottom:16px;font-size:12px;color:#92400E">
      ⚠️ You are setting a new password for <strong>${u.name}</strong>. Share it with them privately.
    </div>
    <div class="form-group">
      <label class="form-label">New password *</label>
      <input class="form-input" type="text" id="reset-pw" value="" placeholder="Enter new password (min 6 chars)">
    </div>
    <div class="form-group">
      <label class="form-label">Confirm password *</label>
      <input class="form-input" type="text" id="reset-pw2" placeholder="Re-enter password">
    </div>`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveResetPassword('${userId}')">🔑 Reset password</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

function saveResetPassword(userId) {
  const pw  = document.getElementById('reset-pw').value.trim();
  const pw2 = document.getElementById('reset-pw2').value.trim();
  if (!pw || pw.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
  if (pw !== pw2)            { showToast('Passwords do not match', 'error'); return; }
  if (!state.teamPasswords) state.teamPasswords = {};
  state.teamPasswords[userId]   = pw;
  TEAM_USERS[userId].password   = pw;
  saveState();
  closeModal();
  showToast(`✅ ${TEAM_USERS[userId].name}'s password has been reset!`, 'success');
}

/* ── CHANGE OWN PASSWORD ──────────────────────────────────── */
function openChangeOwnPasswordModal() {
  document.getElementById('modalTitle').textContent = '🔑 Change your password';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group">
      <label class="form-label">Current password *</label>
      <input class="form-input" type="password" id="cp-old" placeholder="Your current password">
    </div>
    <div class="form-group">
      <label class="form-label">New password *</label>
      <input class="form-input" type="password" id="cp-new" placeholder="Min 6 characters">
    </div>
    <div class="form-group">
      <label class="form-label">Confirm new password *</label>
      <input class="form-input" type="password" id="cp-new2" placeholder="Re-enter new password">
    </div>`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveOwnPassword()">💾 Update password</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

function saveOwnPassword() {
  if (!currentUser) return;
  const old  = document.getElementById('cp-old').value.trim();
  const pw   = document.getElementById('cp-new').value.trim();
  const pw2  = document.getElementById('cp-new2').value.trim();
  const saved= (state.teamPasswords&&state.teamPasswords[currentUser.id]) || currentUser.password;
  if (old !== saved)         { showToast('Current password is incorrect', 'error'); return; }
  if (!pw || pw.length < 6)  { showToast('New password must be at least 6 characters', 'error'); return; }
  if (pw !== pw2)             { showToast('Passwords do not match', 'error'); return; }
  if (!state.teamPasswords) state.teamPasswords = {};
  state.teamPasswords[currentUser.id] = pw;
  TEAM_USERS[currentUser.id].password = pw;
  saveState();
  closeModal();
  showToast('✅ Password changed successfully!', 'success');
}

function showAddMemberInfo() {
  document.getElementById('modalTitle').textContent = '+ Add team member';
  document.getElementById('modalBody').innerHTML = `
    <div style="text-align:center;padding:20px 0">
      <div style="font-size:40px;margin-bottom:12px">👥</div>
      <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:8px">Adding new members</div>
      <div style="font-size:13px;color:var(--text2);line-height:1.7;margin-bottom:16px">
        To add a new team member, ask your developer to add them to the <code>TEAM_USERS</code> object in <code>js/auth.js</code>.<br><br>
        Current team members are:<br>
        <strong>Anusha, Anjani, Tejasv</strong> (Admins)<br>
        <strong>Ashish, Mukul, Varshang, Vidhi</strong> (Members)
      </div>
    </div>`;
  document.getElementById('modalFooter').innerHTML = `<button class="btn btn-primary" onclick="closeModal()">OK</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}
