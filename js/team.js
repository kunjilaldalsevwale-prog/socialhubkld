/* ============ TEAM ============ */

function renderTeam() {
  renderTeamCards();
  renderAssignmentTable();
}

function renderTeamCards() {
  const grid = document.getElementById('teamGrid');
  if (!grid) return;
  grid.innerHTML = state.team.map(m => {
    const myPosts = state.posts.filter(p => p.assignee === m.name);
    const myDrafts = myPosts.filter(p => p.status === 'draft' || p.status === 'review').length;
    const myPublished = myPosts.filter(p => p.status === 'published').length;
    return `<div class="team-card">
      <div class="team-avatar-lg" style="background:${m.color};color:${m.textColor}">${m.initials}</div>
      <div class="team-name">${m.name}</div>
      <div class="team-role">${m.role}</div>
      <div class="team-stats">
        <div class="tstat"><div class="tstat-val">${myPosts.length}</div><div class="tstat-label">Posts</div></div>
        <div class="tstat"><div class="tstat-val">${myDrafts}</div><div class="tstat-label">Pending</div></div>
        <div class="tstat"><div class="tstat-val">${myPublished}</div><div class="tstat-label">Published</div></div>
      </div>
      <div class="team-actions">
        <button class="btn btn-ghost btn-sm" onclick="viewMemberPosts('${m.name}')">View posts</button>
        <button class="btn btn-ghost btn-sm" onclick="removeMember(${m.id})" style="color:var(--red)">Remove</button>
      </div>
    </div>`;
  }).join('');
}

function renderAssignmentTable() {
  const el = document.getElementById('assignmentTable');
  if (!el) return;
  el.innerHTML = `<div class="assignment-table">
    <div class="at-header">
      <div>Post title</div><div>Platform</div><div>Assigned to</div><div>Status</div><div>Date</div>
    </div>
    ${state.posts.filter(p => p.assignee).map(p => {
      const st = STATUS_MAP[p.status] || {};
      const pf = PLATFORM_COLORS[p.platform] || {};
      return `<div class="at-row">
        <div style="font-size:12px;font-weight:500;color:var(--text)">${p.title}</div>
        <div><span style="font-size:12px">${pf.icon || ''} ${p.platform}</span></div>
        <div style="font-size:12px;color:var(--text2)">${p.assignee}</div>
        <div><span class="badge ${st.cls}">${st.label}</span></div>
        <div style="font-size:11px;color:var(--text3)">${fmtDate(p.date)}</div>
      </div>`;
    }).join('') || '<div style="padding:16px;color:var(--text3);font-size:13px">No assigned posts yet.</div>'}
  </div>`;
}

function viewMemberPosts(name) {
  navigate('posts', document.querySelector('.nav-item[data-view="posts"]'));
  setTimeout(() => {
    const filtered = state.posts.filter(p => p.assignee === name);
    renderPostCards(filtered);
    showToast('Showing posts for ' + name);
  }, 50);
}

function removeMember(id) {
  if (!confirm('Remove this team member?')) return;
  state.team = state.team.filter(m => m.id !== id);
  saveState();
  renderTeam();
  renderTeamShareList();
  showToast('Member removed');
}
