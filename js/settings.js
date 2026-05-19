/* ============ SETTINGS ============ */

function renderSettings() {
  renderPlatformConnections();
  renderRolesTable();
  // populate profile fields
  const s = state.settings || {};
  const bn = document.getElementById('sBrandName');
  if (bn) bn.value = s.brandName || 'Your Brand';
}

function setSettingsTab(tab, el) {
  document.querySelectorAll('.stab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.snav-item').forEach(n => n.classList.remove('active'));
  const tabEl = document.getElementById('stab-' + tab);
  if (tabEl) tabEl.classList.add('active');
  el.classList.add('active');
}

function renderPlatformConnections() {
  const el = document.getElementById('platformConnections');
  if (!el) return;
  const platforms = [
    { name: 'Instagram', icon: '📸', connected: true },
    { name: 'Facebook / Meta', icon: '📘', connected: true },
    { name: 'WhatsApp Business', icon: '💬', connected: false },
    { name: 'Twitter / X', icon: '🐦', connected: false },
    { name: 'LinkedIn', icon: '💼', connected: false },
  ];
  el.innerHTML = platforms.map(p => `
    <div class="platform-conn">
      <div class="conn-icon" style="background:var(--surface2)">${p.icon}</div>
      <div class="conn-name">${p.name}</div>
      <span class="conn-status ${p.connected ? 'connected' : 'disconnected'}">
        ${p.connected ? '● Connected' : '○ Not connected'}
      </span>
      <button class="btn btn-ghost btn-sm" onclick="toggleConnection(this, '${p.name}')">
        ${p.connected ? 'Disconnect' : 'Connect'}
      </button>
    </div>`).join('');
}

function toggleConnection(btn, name) {
  const statusEl = btn.previousElementSibling;
  const isConnected = statusEl.classList.contains('connected');
  if (isConnected) {
    statusEl.classList.remove('connected'); statusEl.classList.add('disconnected');
    statusEl.textContent = '○ Not connected';
    btn.textContent = 'Connect';
    showToast(name + ' disconnected');
  } else {
    statusEl.classList.remove('disconnected'); statusEl.classList.add('connected');
    statusEl.textContent = '● Connected';
    btn.textContent = 'Disconnect';
    showToast(name + ' connected!', 'success');
  }
}

function renderRolesTable() {
  const el = document.getElementById('rolesTable');
  if (!el) return;
  el.innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:13px">
    <thead>
      <tr style="border-bottom:1px solid var(--border)">
        <th style="text-align:left;padding:8px;font-weight:600;color:var(--text2)">Member</th>
        <th style="text-align:left;padding:8px;font-weight:600;color:var(--text2)">Role</th>
        <th style="padding:8px;font-weight:600;color:var(--text2)">Create posts</th>
        <th style="padding:8px;font-weight:600;color:var(--text2)">Publish</th>
        <th style="padding:8px;font-weight:600;color:var(--text2)">Manage ads</th>
        <th style="padding:8px;font-weight:600;color:var(--text2)">Admin</th>
      </tr>
    </thead>
    <tbody>
      ${state.team.map(m => `<tr style="border-bottom:1px solid var(--border)">
        <td style="padding:10px 8px;font-weight:500">${m.name}</td>
        <td style="padding:10px 8px;color:var(--text2)">${m.role}</td>
        <td style="padding:10px 8px;text-align:center"><input type="checkbox" checked></td>
        <td style="padding:10px 8px;text-align:center"><input type="checkbox" ${m.role.includes('Lead')||m.role.includes('Manager')?'checked':''}></td>
        <td style="padding:10px 8px;text-align:center"><input type="checkbox" ${m.role.includes('Paid')?'checked':''}></td>
        <td style="padding:10px 8px;text-align:center"><input type="checkbox" ${m.role.includes('Lead')?'checked':''}></td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

function saveSettings() {
  state.settings = state.settings || {};
  const bn = document.getElementById('sBrandName');
  if (bn) state.settings.brandName = bn.value;
  const dt = document.getElementById('sDefaultTime');
  if (dt) state.settings.defaultTime = dt.value;
  saveState();
  // update brand name in UI
  const brandEl = document.querySelector('.brand-name');
  if (brandEl && bn) brandEl.textContent = bn.value || 'SocialHub';
  showToast('Settings saved!', 'success');
}

function exportPosts(format) {
  if (format === 'json') {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'socialhub-export.json'; a.click();
    showToast('JSON exported!', 'success');
  } else if (format === 'csv') {
    const headers = 'Title,Platform,Date,Time,Status,Caption,Assignee,Priority\n';
    const rows = state.posts.map(p =>
      [p.title, p.platform, p.date, p.time, p.status, '"' + (p.caption || '').replace(/"/g, '""') + '"', p.assignee || '', p.priority || ''].join(',')
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'socialhub-posts.csv'; a.click();
    showToast('CSV exported!', 'success');
  } else {
    showToast('PDF report coming soon', '');
  }
}

function clearAllData() {
  if (!confirm('This will delete ALL your posts, campaigns, and settings. Are you sure?')) return;
  if (!confirm('FINAL WARNING — this cannot be undone. Continue?')) return;
  DB.clear();
  location.reload();
}
