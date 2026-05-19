/* ============ MODAL ============ */

function showModal(type) {
  const overlay = document.getElementById('modalOverlay');
  const body = document.getElementById('modalBody');
  const footer = document.getElementById('modalFooter');
  const title = document.getElementById('modalTitle');

  overlay.classList.add('open');

  const defs = {
    post: {
      title: 'New Post',
      body: `
        <div class="form-group"><label class="form-label">Title <span class="required">*</span></label><input class="form-input" id="m-title" placeholder="Post title"></div>
        <div class="form-group"><label class="form-label">Caption</label><textarea class="form-input" id="m-caption" rows="3" placeholder="Write your caption…"></textarea></div>
        <div class="form-group"><label class="form-label">Platform</label>
          <select class="form-select" id="m-platform">
            <option>Instagram</option><option>Facebook</option><option>WhatsApp</option><option>Twitter/X</option><option>LinkedIn</option><option>Meta Ad</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Date</label><input class="form-input" type="date" id="m-date"></div>
          <div class="form-group"><label class="form-label">Time</label><input class="form-input" type="time" id="m-time" value="09:00"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Status</label>
            <select class="form-select" id="m-status"><option value="draft">Draft</option><option value="review">In review</option><option value="scheduled">Scheduled</option></select>
          </div>
          <div class="form-group"><label class="form-label">Assign to</label>
            <select class="form-select" id="m-assign">
              <option value="">— unassigned —</option>
              ${state.team.map(m => `<option>${m.name}</option>`).join('')}
            </select>
          </div>
        </div>`,
      footer: `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
               <button class="btn btn-primary" onclick="saveModalPost()">Save post</button>`,
    },
    ad: {
      title: 'New Ad Campaign',
      body: `
        <div class="form-group"><label class="form-label">Campaign name <span class="required">*</span></label><input class="form-input" id="ad-title" placeholder="e.g. Summer sale conversion"></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Type</label>
            <select class="form-select" id="ad-type"><option>Conversion Campaign</option><option>Awareness Campaign</option><option>Traffic Campaign</option><option>Retargeting</option><option>Lead Generation</option></select>
          </div>
          <div class="form-group"><label class="form-label">Objective</label>
            <select class="form-select" id="ad-obj"><option>Purchases</option><option>Impressions</option><option>Link clicks</option><option>Add to cart</option><option>Leads</option></select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Budget (₹)</label><input class="form-input" type="number" id="ad-budget" placeholder="10000"></div>
          <div class="form-group"><label class="form-label">Status</label>
            <select class="form-select" id="ad-status"><option value="active">Active</option><option value="paused">Paused</option></select>
          </div>
        </div>
        <div class="form-group"><label class="form-label">Target audience</label><input class="form-input" id="ad-audience" placeholder="e.g. Women 18–35, Tier-1 cities"></div>`,
      footer: `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
               <button class="btn btn-primary" onclick="saveModalAd()">Create campaign</button>`,
    },
    contact: {
      title: 'New WhatsApp Contact / Group',
      body: `
        <div class="form-group"><label class="form-label">Name <span class="required">*</span></label><input class="form-input" id="wc-name" placeholder="e.g. Premium Customers"></div>
        <div class="form-group"><label class="form-label">Members / contacts</label><input class="form-input" id="wc-sub" placeholder="e.g. 150 members"></div>
        <div class="form-group"><label class="form-label">Type</label>
          <select class="form-select" id="wc-type"><option value="group">Group</option><option value="broadcast">Broadcast list</option></select>
        </div>`,
      footer: `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
               <button class="btn btn-primary" onclick="saveModalContact()">Add contact</button>`,
    },
    broadcast: {
      title: 'New Broadcast',
      body: `
        <div class="form-group"><label class="form-label">Select lists</label>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${state.waContacts.map(c => `<label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer"><input type="checkbox" value="${c.id}"> ${c.name} <span style="color:var(--text3);font-size:11px">${c.sub}</span></label>`).join('')}
          </div>
        </div>
        <div class="form-group"><label class="form-label">Message <span class="required">*</span></label><textarea class="form-input" id="bc-msg" rows="4" placeholder="Write your broadcast message…"></textarea></div>
        <div class="form-group"><label class="form-label">Schedule (optional)</label><input class="form-input" type="datetime-local" id="bc-schedule"></div>`,
      footer: `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
               <button class="btn btn-primary" onclick="sendBroadcast()">Send broadcast</button>`,
    },
    goal: {
      title: 'Add Monthly Goal',
      body: `
        <div class="form-group"><label class="form-label">Goal title <span class="required">*</span></label><input class="form-input" id="g-title" placeholder="e.g. Reach 10k followers"></div>
        <div class="form-group"><label class="form-label">Description</label><textarea class="form-input" id="g-desc" rows="3" placeholder="Describe the goal and strategy…"></textarea></div>
        <div class="form-group"><label class="form-label">Initial progress (%)</label><input class="form-input" type="number" id="g-progress" min="0" max="100" value="0"></div>
        <div class="form-group"><label class="form-label">Color</label>
          <select class="form-select" id="g-color">
            <option value="#7F77DD">Purple</option><option value="#639922">Green</option><option value="#BA7517">Amber</option><option value="#185FA5">Blue</option><option value="#A32D2D">Red</option>
          </select>
        </div>`,
      footer: `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
               <button class="btn btn-primary" onclick="saveModalGoal()">Add goal</button>`,
    },
    'agenda-item': {
      title: 'Add Event / Deadline',
      body: `
        <div class="form-group"><label class="form-label">Event title <span class="required">*</span></label><input class="form-input" id="ev-title" placeholder="e.g. Product photoshoot"></div>
        <div class="form-group"><label class="form-label">Details / sub-title</label><input class="form-input" id="ev-sub" placeholder="e.g. Studio booking confirmed"></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Day</label><input class="form-input" type="number" id="ev-day" min="1" max="31" placeholder="15"></div>
          <div class="form-group"><label class="form-label">Month</label>
            <select class="form-select" id="ev-month">
              ${MONTH_NAMES.map(m => `<option ${m==='May'?'selected':''}>${m}</option>`).join('')}
            </select>
          </div>
        </div>`,
      footer: `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
               <button class="btn btn-primary" onclick="saveModalEvent()">Add event</button>`,
    },
    member: {
      title: 'Invite Team Member',
      body: `
        <div class="form-group"><label class="form-label">Full name <span class="required">*</span></label><input class="form-input" id="tm-name" placeholder="e.g. Sarah Johnson"></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" id="tm-email" placeholder="sarah@brand.com"></div>
        <div class="form-group"><label class="form-label">Role</label>
          <select class="form-select" id="tm-role">
            <option>Content Lead</option><option>Designer</option><option>Strategist</option><option>Paid Ads Manager</option><option>Social Media Manager</option><option>Copywriter</option>
          </select>
        </div>`,
      footer: `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
               <button class="btn btn-primary" onclick="saveModalMember()">Send invite</button>`,
    },
  };

  const def = defs[type];
  if (!def) return;
  title.textContent = def.title;
  body.innerHTML = def.body;
  footer.innerHTML = def.footer;
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function closeModalOverlay(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

// Save functions
function saveModalPost() {
  const t = document.getElementById('m-title').value.trim();
  if (!t) { showToast('Enter a title', 'error'); return; }
  const p = document.getElementById('m-platform').value;
  const post = {
    id: genId(), title: t,
    caption: document.getElementById('m-caption').value,
    platform: p, platforms: [p],
    date: document.getElementById('m-date').value,
    time: document.getElementById('m-time').value,
    status: document.getElementById('m-status').value,
    assignee: document.getElementById('m-assign').value,
    priority: 'normal', type: 'Image post',
    hashtags: '', brief: '', notes: '',
    created: new Date().toISOString().split('T')[0],
  };
  state.posts.push(post); saveState(); updateBadge();
  if (currentView === 'calendar') buildCalendar();
  if (currentView === 'posts') renderPosts();
  closeModal(); showToast('Post created!', 'success');
}

function saveModalAd() {
  const t = document.getElementById('ad-title').value.trim();
  if (!t) { showToast('Enter a campaign name', 'error'); return; }
  const budget = parseInt(document.getElementById('ad-budget').value) || 5000;
  state.ads.push({
    id: genId(), title: t,
    type: document.getElementById('ad-type').value,
    objective: document.getElementById('ad-obj').value,
    audience: document.getElementById('ad-audience').value || 'All audiences',
    budget, spent: 0, reach: 0, clicks: 0, ctr: '0.00', cpc: '0.00',
    status: document.getElementById('ad-status').value,
  });
  saveState(); renderMetaAds(); closeModal(); showToast('Campaign created!', 'success');
}

function saveModalContact() {
  const n = document.getElementById('wc-name').value.trim();
  if (!n) { showToast('Enter a name', 'error'); return; }
  const initials = n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
  const colors = [['#EEEDFE','#3C3489'],['#EAF3DE','#27500A'],['#FAEEDA','#633806'],['#FBEAF0','#72243E'],['#E1F5EE','#0F6E56']];
  const c = colors[state.waContacts.length % colors.length];
  state.waContacts.push({
    id: genId(), name: n,
    sub: document.getElementById('wc-sub').value || '0 members',
    initials, color: c[0], textColor: c[1],
    lastMsg: 'No messages yet', time: 'Now',
    type: document.getElementById('wc-type').value,
  });
  saveState(); renderWAContacts(); closeModal(); showToast('Contact added!', 'success');
}

function sendBroadcast() {
  const msg = document.getElementById('bc-msg').value.trim();
  if (!msg) { showToast('Write a message', 'error'); return; }
  closeModal(); showToast('Broadcast sent to selected lists!', 'success');
}

function saveModalGoal() {
  const t = document.getElementById('g-title').value.trim();
  if (!t) { showToast('Enter a goal title', 'error'); return; }
  state.goals.push({
    id: genId(), title: t,
    desc: document.getElementById('g-desc').value,
    progress: parseInt(document.getElementById('g-progress').value) || 0,
    color: document.getElementById('g-color').value,
  });
  saveState(); renderGoals(); closeModal(); showToast('Goal added!', 'success');
}

function saveModalEvent() {
  const t = document.getElementById('ev-title').value.trim();
  if (!t) { showToast('Enter an event title', 'error'); return; }
  state.agendaEvents.push({
    id: genId(), title: t,
    sub: document.getElementById('ev-sub').value,
    day: document.getElementById('ev-day').value || '1',
    month: document.getElementById('ev-month').value,
    color: '#7F77DD',
  });
  saveState(); renderAgendaEvents(); renderAgendaTimeline(); closeModal(); showToast('Event added!', 'success');
}

function saveModalMember() {
  const n = document.getElementById('tm-name').value.trim();
  if (!n) { showToast('Enter a name', 'error'); return; }
  const initials = n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const colors = [['#EEEDFE','#3C3489'],['#EAF3DE','#27500A'],['#FAEEDA','#633806'],['#FBEAF0','#72243E'],['#E1F5EE','#0F6E56'],['#E6F1FB','#185FA5']];
  const c = colors[state.team.length % colors.length];
  state.team.push({
    id: genId(), name: n, initials,
    role: document.getElementById('tm-role').value,
    email: document.getElementById('tm-email').value,
    color: c[0], textColor: c[1], posts: 0, drafts: 0,
  });
  saveState(); renderTeam(); renderTeamShareList(); closeModal(); showToast('Invitation sent to ' + n + '!', 'success');
}

// ── Import customer list modal ─────────────────────────────
function showImportListModal() {
  document.getElementById('modalTitle').textContent = '📁 Import Customer List';
  document.getElementById('modalBody').innerHTML = `
    <div style="background:var(--green-light);border:1.5px solid var(--green);border-radius:var(--r-lg);padding:12px;margin-bottom:16px;font-size:12px;color:var(--green)">
      <strong>✅ Supported formats:</strong> Excel (.xlsx, .xls) and CSV (.csv)<br>
      <strong>Required column:</strong> email &nbsp;|&nbsp; <strong>Optional:</strong> name, phone, tags
    </div>
    <div class="upload-zone" onclick="document.getElementById('custFileInput').click()" style="margin-bottom:12px">
      <div class="upload-icon">📊</div>
      <div class="upload-text">Click to upload Excel or CSV</div>
      <div class="upload-sub">.xlsx, .xls, .csv supported</div>
      <input type="file" id="custFileInput" accept=".csv,.xlsx,.xls" style="display:none" onchange="handleCustomerFileUpload(this);closeModal()">
    </div>
    <div class="form-group"><label class="form-label">Or manually add a list</label></div>
    <div class="form-group"><label class="form-label">List name</label>
      <input class="form-input" id="ml-name" placeholder="e.g. Diwali Campaign List"></div>
    <div class="form-group"><label class="form-label">Estimated contact count</label>
      <input class="form-input" type="number" id="ml-count" placeholder="e.g. 250"></div>`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveManualList()">Save manual list</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

function saveManualList() {
  const name  = document.getElementById('ml-name').value.trim();
  const count = parseInt(document.getElementById('ml-count').value) || 0;
  if (!name) { showToast('Enter a list name', 'error'); return; }
  state.customerLists.push({ id: genId(), name, count, source: 'manual', tags: [], created: new Date().toISOString().split('T')[0] });
  saveState(); if(typeof _renderCustomerLists==="function")_renderCustomerLists(); closeModal(); showToast('List added!', 'success');
}

function showEmailSettingsModal() {
  document.getElementById('modalTitle').textContent = '⚙ Email Anti-Spam Settings';
  document.getElementById('modalBody').innerHTML = `
    <div style="background:var(--green-light);border:1.5px solid var(--green);border-radius:var(--r-lg);padding:12px;margin-bottom:16px;font-size:12px;color:var(--green)">
      These settings protect your sender reputation and prevent emails from landing in spam.
    </div>
    <div class="form-group"><label class="form-label">Sender name</label>
      <input class="form-input" id="es-name" value="${state.emailSettings.senderName}"></div>
    <div class="form-group"><label class="form-label">Sender email</label>
      <input class="form-input" type="email" id="es-email" value="${state.emailSettings.senderEmail}"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Batch size</label>
        <select class="form-select" id="es-batch">
          <option value="50" ${state.emailSettings.batchSize==50?'selected':''}>50 (recommended)</option>
          <option value="100" ${state.emailSettings.batchSize==100?'selected':''}>100</option>
          <option value="200" ${state.emailSettings.batchSize==200?'selected':''}>200</option>
        </select></div>
      <div class="form-group"><label class="form-label">Delay (minutes)</label>
        <select class="form-select" id="es-delay">
          <option value="15">15 min</option>
          <option value="30" ${state.emailSettings.batchDelay==30?'selected':''}>30 min (safe)</option>
          <option value="60">60 min (safest)</option>
        </select></div>
    </div>
    <div class="form-group"><label class="form-label">Email footer</label>
      <textarea class="form-input" id="es-footer" rows="3">${state.emailSettings.footer}</textarea></div>`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveEmailSettings()">Save settings</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

function saveEmailSettings() {
  state.emailSettings.senderName  = document.getElementById('es-name').value;
  state.emailSettings.senderEmail = document.getElementById('es-email').value;
  state.emailSettings.batchSize   = parseInt(document.getElementById('es-batch').value);
  state.emailSettings.batchDelay  = parseInt(document.getElementById('es-delay').value);
  state.emailSettings.footer      = document.getElementById('es-footer').value;
  saveState(); closeModal(); showToast('Email settings saved!', 'success');
}
