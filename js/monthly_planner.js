/* ============================================================
   MONTHLY PLANNER — Role-based views
   Strategist: Excel spreadsheet
   Designer: Word document
   Admin: Toggle between both + manage approvals
   ============================================================ */

let plannerYear  = new Date().getFullYear();
let plannerMonth = new Date().getMonth();
let _plannerTab  = 'strategy';

function renderMonthlyPlanner() {
  _renderPlannerHeader();
  _applyPlannerRoleView();
  if (_plannerTab === 'strategy') renderStrategyView();
  else if (_plannerTab === 'design') renderDesignView();
  else if (_plannerTab === 'refs') renderReferencesInbox();
}

function _renderPlannerHeader() {
  const el = document.getElementById('plannerMonthLabel');
  if (el) el.textContent = new Date(plannerYear, plannerMonth, 1)
    .toLocaleDateString('en-IN', { month:'long', year:'numeric' });
}

function changePlannerMonth(dir) {
  plannerMonth += dir;
  if (plannerMonth > 11) { plannerMonth = 0; plannerYear++; }
  if (plannerMonth < 0)  { plannerMonth = 11; plannerYear--; }
  renderMonthlyPlanner();
}

function _getPlannerKey() { return `${plannerYear}-${plannerMonth}`; }

function _getPlannerData() {
  if (!state.monthlyPlans) state.monthlyPlans = {};
  const k = _getPlannerKey();
  if (!state.monthlyPlans[k]) state.monthlyPlans[k] = {
    spreadsheet: { cols:['Date','Platform','Caption','Hashtags','Notes'], rows:[] },
    approvals: {},
    approvalDays: 3,
    createdAt: new Date().toISOString(),
    designUploads: {},
    designApprovals: {},
  };
  return state.monthlyPlans[k];
}

/* ── Role detection ───────────────────────────────────────── */
function _isStrategist() { return currentUser && currentUser.role === 'strategist'; }
function _isDesigner()   { return currentUser && currentUser.role === 'designer'; }
function _isAdmin()      { return currentUser && currentUser.role === 'admin'; }

function _applyPlannerRoleView() {
  const tabs = document.getElementById('plannerViewTabs');
  if (!tabs) return;

  if (_isStrategist()) {
    // Strategist sees: Strategy + References
    tabs.innerHTML = `
      <button class="btn ${_plannerTab==='strategy'?'btn-primary':'btn-ghost'} btn-sm" onclick="switchPlannerTab('strategy')">📊 My Spreadsheet</button>
      <button class="btn ${_plannerTab==='refs'?'btn-primary':'btn-ghost'} btn-sm" onclick="switchPlannerTab('refs')">📌 References</button>`;
  } else if (_isDesigner()) {
    // Designer sees: Design view + References
    tabs.innerHTML = `
      <button class="btn ${_plannerTab==='design'?'btn-primary':'btn-ghost'} btn-sm" onclick="switchPlannerTab('design')">🎨 My Posts</button>
      <button class="btn ${_plannerTab==='refs'?'btn-primary':'btn-ghost'} btn-sm" onclick="switchPlannerTab('refs')">📌 References</button>`;
  } else {
    // Admin sees all
    tabs.innerHTML = `
      <button class="btn ${_plannerTab==='strategy'?'btn-primary':'btn-ghost'} btn-sm" onclick="switchPlannerTab('strategy')">📊 Strategy</button>
      <button class="btn ${_plannerTab==='design'?'btn-primary':'btn-ghost'} btn-sm" onclick="switchPlannerTab('design')">🎨 Design</button>
      <button class="btn ${_plannerTab==='refs'?'btn-primary':'btn-ghost'} btn-sm" onclick="switchPlannerTab('refs')">📌 References</button>`;
  }
}

function switchPlannerTab(tab) {
  _plannerTab = tab;
  ['strategy','design','refs'].forEach(t => {
    const el = document.getElementById('plannerTab-'+t);
    if (el) el.style.display = t === tab ? '' : 'none';
  });
  _applyPlannerRoleView();
  if (tab === 'strategy') renderStrategyView();
  else if (tab === 'design') renderDesignView();
  else renderReferencesInbox();
}

/* ══════════════════════════════════════════════════════════
   STRATEGY VIEW — Excel spreadsheet
══════════════════════════════════════════════════════════ */
function renderStrategyView() {
  const data     = _getPlannerData();
  const sheet    = data.spreadsheet;
  const locked   = _isSheetApproved(data);
  const canEdit  = !locked || _isAdmin();

  // Approval bar
  _renderStratApprovalBar(data);

  const el = document.getElementById('plannerSpreadsheet');
  if (!el) return;

  if (!sheet.cols || !sheet.cols.length) sheet.cols = ['Date','Platform','Caption','Hashtags','Notes'];
  if (!sheet.rows) sheet.rows = [];

  el.innerHTML = `
    <div style="overflow-x:auto;border-radius:16px;border:1px solid var(--border);box-shadow:var(--sh-sm)">
      <table style="border-collapse:collapse;min-width:100%;font-size:13px;background:var(--white)">
        <thead>
          <tr style="background:var(--beige)">
            <th style="padding:10px 8px;border:1px solid var(--border);width:36px;color:var(--text3);font-size:11px">#</th>
            ${sheet.cols.map((col,ci) => `
              <th style="padding:0;border:1px solid var(--border);min-width:130px;position:relative">
                <div style="display:flex;align-items:center">
                  <input value="${col}" style="padding:10px 8px;font-size:12px;font-weight:700;color:var(--text2);background:transparent;border:none;outline:none;width:100%;font-family:var(--font)"
                    ${!canEdit?'readonly':''}
                    onchange="renameSpreadsheetCol(${ci},this.value)"
                    onfocus="this.style.background='var(--brand-pale)'" onblur="this.style.background='transparent'">
                  ${canEdit?`<button onclick="deleteSpreadsheetCol(${ci})" style="padding:4px 6px;background:none;border:none;cursor:pointer;color:var(--text4);font-size:12px;flex-shrink:0" title="Delete column">✕</button>`:''}
                </div>
              </th>`).join('')}
            <th style="padding:10px 8px;border:1px solid var(--border);width:40px"></th>
          </tr>
        </thead>
        <tbody>
          ${sheet.rows.map((row,ri) => `
            <tr style="transition:background .1s" onmouseover="this.style.background='var(--beige)'" onmouseout="this.style.background=''">
              <td style="padding:8px;border:1px solid var(--border);text-align:center;color:var(--text3);font-size:11px;font-weight:600">${ri+1}</td>
              ${sheet.cols.map((col,ci) => `
                <td style="padding:0;border:1px solid var(--border)">
                  <textarea rows="1" style="width:100%;padding:8px;font-size:12px;border:none;outline:none;resize:none;font-family:var(--font);background:transparent;min-height:36px;line-height:1.4"
                    ${!canEdit?'readonly':''}
                    oninput="updateSpreadsheetCell(${ri},${ci},this.value);this.style.height='auto';this.style.height=this.scrollHeight+'px'"
                    onfocus="this.parentElement.style.outline='2px solid var(--brand)'" onblur="this.parentElement.style.outline=''"
                    >${(row[ci]||'')}</textarea>
                </td>`).join('')}
              <td style="padding:4px;border:1px solid var(--border);text-align:center">
                ${canEdit?`<button onclick="deleteSpreadsheetRow(${ri})" style="background:none;border:none;cursor:pointer;color:var(--text4);font-size:14px">🗑</button>`:''}
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;

  // Show/hide add row/col buttons
  const addBtns = el.nextElementSibling;
  if (addBtns) addBtns.style.display = canEdit ? 'flex' : 'none';

  if (locked && !_isAdmin()) {
    el.insertAdjacentHTML('beforebegin', `
      <div style="background:#ECFDF5;border:1px solid #6EE7B7;border-radius:12px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#065F46;font-weight:600">
        ✅ This sheet has been approved — locked for editing. Admins can still make changes.
      </div>`);
  }
}

function _isSheetApproved(data) {
  const ADMINS = ['anusha','anjani','tejasv'];
  return ADMINS.every(a => {
    const s = (data.approvals||{})[a];
    return s === 'approved' || _isAutoApproved(data, a);
  });
}

function _isAutoApproved(data, adminId) {
  if (!data.createdAt) return false;
  const days = data.approvalDays || 3;
  return Date.now() > new Date(data.createdAt).getTime() + days*24*60*60*1000;
}

function _renderStratApprovalBar(data) {
  const el = document.getElementById('stratApprovalBar');
  if (!el) return;
  const ADMINS = ['anusha','anjani','tejasv'];
  const approved = ADMINS.filter(a=>(data.approvals||{})[a]==='approved'||_isAutoApproved(data,a)).length;
  const rejected = ADMINS.some(a=>(data.approvals||{})[a]==='rejected');
  const allApproved = approved === 3;

  el.innerHTML = `
    <div style="background:var(--white);border:1px solid var(--border);border-radius:16px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div style="display:flex;align-items:center;gap:14px">
        <div style="display:flex;gap:6px">
          ${ADMINS.map(a => {
            const s = (data.approvals||{})[a];
            const status = s || (_isAutoApproved(data,a) ? 'auto' : 'pending');
            const bg = status==='approved'||status==='auto' ? '#10B981' : status==='rejected' ? '#EF4444' : '#E5E7EB';
            const icon = status==='approved'||status==='auto' ? '✓' : status==='rejected' ? '✕' : '';
            const u = TEAM_USERS[a];
            return `<div title="${u?u.name:a}" style="width:30px;height:30px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff;border:2px solid ${bg==='#E5E7EB'?'#D1D5DB':'transparent'}">${icon||''}</div>`;
          }).join('')}
        </div>
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--text)">
            ${rejected ? '❌ Changes requested' : allApproved ? '✅ Strategy approved' : `${approved}/3 approved`}
          </div>
          <div style="font-size:11px;color:var(--text3);margin-top:2px">
            Auto-approve after
            <input type="number" min="1" max="30" value="${data.approvalDays||3}"
              style="width:36px;padding:2px 5px;border:1px solid var(--border2);border-radius:6px;font-size:11px;font-family:var(--font);text-align:center;margin:0 3px"
              onchange="_updateApprovalDays(this.value)">
            days
          </div>
        </div>
      </div>
      ${_isAdmin() ? `
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${ADMINS.map(a => {
          const s = (data.approvals||{})[a];
          const u = TEAM_USERS[a];
          const name = u ? u.name : a;
          if (s==='approved') return `<span style="font-size:11px;padding:5px 12px;border-radius:20px;background:#ECFDF5;color:#065F46;font-weight:700">${name} ✅</span>`;
          if (s==='rejected') return `<span style="font-size:11px;padding:5px 12px;border-radius:20px;background:#FEF2F2;color:#991B1B;font-weight:700">${name} ❌</span>`;
          if (_isAutoApproved(data,a)) return `<span style="font-size:11px;padding:5px 12px;border-radius:20px;background:#F0FDF4;color:#166534;font-weight:700">${name} auto ✓</span>`;
          if (currentUser && currentUser.id === a) return `
            <div style="display:flex;gap:5px;align-items:center">
              <span style="font-size:11px;color:var(--text2);font-weight:600">${name}:</span>
              <button onclick="approveStrategy('${a}','approved')" style="padding:4px 12px;background:#ECFDF5;color:#065F46;border:1.5px solid #6EE7B7;border-radius:16px;font-size:11px;font-weight:700;cursor:pointer;font-family:var(--font)">✅ Approve</button>
              <button onclick="approveStrategy('${a}','rejected')" style="padding:4px 12px;background:#FEF2F2;color:#991B1B;border:1.5px solid #FCA5A5;border-radius:16px;font-size:11px;font-weight:700;cursor:pointer;font-family:var(--font)">❌ Reject</button>
            </div>`;
          return `<span style="font-size:11px;color:var(--text3)">${name}: pending</span>`;
        }).join('')}
      </div>` : ''}
    </div>`;
}

function approveStrategy(adminId, status) {
  const data = _getPlannerData();
  if (!data.approvals) data.approvals = {};
  data.approvals[adminId] = status;
  saveState();
  _renderStratApprovalBar(data);
  renderStrategyView();
  showToast(status==='approved'?'✅ Strategy approved!':'Changes requested', status==='approved'?'success':'error');
  // Push to designer view if all approved
  if (_isSheetApproved(data)) {
    showToast('📨 Strategy locked and sent to Designer!', 'success');
  }
}

function _updateApprovalDays(val) {
  const data = _getPlannerData();
  data.approvalDays = parseInt(val)||3;
  saveState();
}

/* ── Spreadsheet editing ─────────────────────────────────── */
function addSpreadsheetRow() {
  const data = _getPlannerData();
  const cols = data.spreadsheet.cols.length || 5;
  data.spreadsheet.rows.push(new Array(cols).fill(''));
  saveState();
  renderStrategyView();
}

function addSpreadsheetCol() {
  const data = _getPlannerData();
  const name = prompt('Column name:');
  if (!name) return;
  data.spreadsheet.cols.push(name);
  data.spreadsheet.rows.forEach(r => r.push(''));
  saveState();
  renderStrategyView();
}

function renameSpreadsheetCol(ci, name) {
  const data = _getPlannerData();
  data.spreadsheet.cols[ci] = name;
  saveState();
}

function deleteSpreadsheetCol(ci) {
  if (!confirm('Delete this column?')) return;
  const data = _getPlannerData();
  data.spreadsheet.cols.splice(ci, 1);
  data.spreadsheet.rows.forEach(r => r.splice(ci, 1));
  saveState();
  renderStrategyView();
}

function deleteSpreadsheetRow(ri) {
  const data = _getPlannerData();
  data.spreadsheet.rows.splice(ri, 1);
  saveState();
  renderStrategyView();
}

function updateSpreadsheetCell(ri, ci, value) {
  const data = _getPlannerData();
  if (!data.spreadsheet.rows[ri]) data.spreadsheet.rows[ri] = [];
  data.spreadsheet.rows[ri][ci] = value;
  clearTimeout(window._sheetSaveTimer);
  window._sheetSaveTimer = setTimeout(()=>{ DB.save(state); if(typeof syncPush==='function') syncPush(); }, 500);
}

/* ══════════════════════════════════════════════════════════
   DESIGN VIEW — Word document style
══════════════════════════════════════════════════════════ */
function renderDesignView() {
  const data   = _getPlannerData();
  const sheet  = data.spreadsheet;
  const rows   = sheet.rows || [];
  const cols   = sheet.cols || [];
  const locked = _isSheetApproved(data);
  const el     = document.getElementById('plannerDesignView');
  if (!el) return;

  if (!locked && !_isAdmin()) {
    el.innerHTML = `
      <div style="text-align:center;padding:48px;color:var(--text3)">
        <div style="font-size:48px;margin-bottom:12px">⏳</div>
        <div style="font-size:15px;font-weight:700;color:var(--text2)">Waiting for strategy approval</div>
        <div style="font-size:13px;margin-top:6px">The strategy sheet needs to be approved by admins before you can start designing</div>
      </div>`;
    return;
  }

  if (!rows.length) {
    el.innerHTML = `
      <div style="text-align:center;padding:48px;color:var(--text3)">
        <div style="font-size:48px;margin-bottom:12px">📄</div>
        <div style="font-size:15px;font-weight:700;color:var(--text2)">No posts in the strategy yet</div>
      </div>`;
    return;
  }

  // Find caption column index
  const captionIdx = cols.findIndex(c=>c.toLowerCase().includes('caption'));
  const dateIdx    = cols.findIndex(c=>c.toLowerCase().includes('date'));
  const platformIdx= cols.findIndex(c=>c.toLowerCase().includes('platform'));

  el.innerHTML = `
    <!-- Document header -->
    <div style="background:var(--white);border-radius:20px;padding:32px;margin-bottom:24px;box-shadow:var(--sh-sm);border:1px solid var(--border)">
      <div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">Content Plan</div>
      <h1 style="font-size:28px;font-weight:800;color:var(--text);margin-bottom:6px">${new Date(plannerYear, plannerMonth, 1).toLocaleDateString('en-IN',{month:'long',year:'numeric'})}</h1>
      <div style="font-size:13px;color:var(--text3)">${rows.length} post${rows.length!==1?'s':''} planned · Click ＋ to upload your design for each post</div>
      ${locked ? '<div style="margin-top:10px;display:inline-block;padding:5px 14px;background:#ECFDF5;color:#065F46;border-radius:20px;font-size:12px;font-weight:700">✅ Strategy approved</div>' : ''}
    </div>

    <!-- Posts as document sections -->
    ${rows.map((row, ri) => {
      const caption  = captionIdx>=0 ? row[captionIdx]||'' : '';
      const date     = dateIdx>=0    ? row[dateIdx]||''    : '';
      const platform = platformIdx>=0? row[platformIdx]||'': '';
      const upload   = (data.designUploads||{})[ri];
      const dApproval= (data.designApprovals||{})[ri];

      return `
      <div style="background:var(--white);border-radius:20px;padding:28px;margin-bottom:20px;box-shadow:var(--sh-sm);border:1px solid var(--border)" id="design-post-${ri}">

        <!-- Post header -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:36px;height:36px;border-radius:50%;background:var(--brand-pale);color:var(--brand);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px">${ri+1}</div>
            <div>
              <div style="font-size:16px;font-weight:800;color:var(--text)">Post ${ri+1}</div>
              <div style="font-size:11px;color:var(--text3)">${date?'📅 '+date:''} ${platform?'· '+platform:''}</div>
            </div>
          </div>
          ${dApproval==='approved' ? '<span style="padding:5px 14px;border-radius:20px;background:#ECFDF5;color:#065F46;font-size:12px;font-weight:700">✅ Design approved</span>' :
            dApproval==='rejected' ? '<span style="padding:5px 14px;border-radius:20px;background:#FEF2F2;color:#991B1B;font-size:12px;font-weight:700">❌ Changes needed</span>' :
            upload ? '<span style="padding:5px 14px;border-radius:20px;background:#FEF9C3;color:#92400E;font-size:12px;font-weight:700">⏳ Awaiting approval</span>' : ''}
        </div>

        <!-- Strategy details as bullet points -->
        <div style="margin-bottom:20px;padding:16px;background:var(--beige);border-radius:14px;border-left:3px solid var(--brand)">
          <div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px">From Strategist</div>
          ${cols.map((col,ci) => row[ci] ? `
            <div style="margin-bottom:6px;font-size:13px;color:var(--text);line-height:1.6">
              <span style="font-weight:700;color:var(--text2)">${col}:</span>
              <span style="margin-left:6px">${row[ci]}</span>
            </div>` : '').join('')}
        </div>

        <!-- Design upload -->
        ${upload ? `
          <div style="margin-bottom:16px">
            <div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px">My Design</div>
            <div style="border-radius:16px;overflow:hidden;border:1px solid var(--border);position:relative">
              ${_isVideoFile(upload.name)
                ? `<video src="${upload.url}" controls style="width:100%;max-height:400px;display:block"></video>`
                : `<img src="${upload.url}" style="width:100%;max-height:400px;object-fit:contain;display:block;background:#000">`}
              <div style="padding:12px 14px;background:var(--surface2);display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                <span style="font-size:12px;color:var(--text2);flex:1">${upload.name}</span>
                ${(_isDesigner()||_isAdmin()) && dApproval!=='approved' ? `
                  <label class="btn btn-ghost btn-sm" style="cursor:pointer">
                    <input type="file" accept="image/*,video/*,.pdf" style="display:none" onchange="uploadDesignForPost(this,${ri})">
                    🔄 Replace
                  </label>` : ''}
                <a href="${upload.url}" target="_blank" class="btn btn-ghost btn-sm" style="text-decoration:none">⬇ Download</a>
              </div>
            </div>
            ${_isAdmin() && !dApproval ? `
              <div style="display:flex;gap:8px;margin-top:10px">
                <button onclick="approveDesign(${ri},'approved')" style="padding:7px 18px;background:#ECFDF5;color:#065F46;border:1.5px solid #6EE7B7;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font)">✅ Approve design</button>
                <button onclick="approveDesign(${ri},'rejected')" style="padding:7px 18px;background:#FEF2F2;color:#991B1B;border:1.5px solid #FCA5A5;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font)">❌ Request changes</button>
              </div>` : ''}
            ${dApproval==='approved' ? `
              <div style="margin-top:10px">
                <button onclick="sendToPublishing(${ri})" class="btn btn-primary btn-sm">🚀 Send to Publishing</button>
              </div>` : ''}
          </div>` : ''}

        <!-- Upload button -->
        ${(_isDesigner()||_isAdmin()) && !upload ? `
          <label style="display:flex;align-items:center;justify-content:center;gap:10px;padding:20px;background:var(--brand-pale);border:2px dashed var(--brand-mid);border-radius:16px;cursor:pointer;transition:all .15s"
            onmouseover="this.style.background='var(--brand-light)'" onmouseout="this.style.background='var(--brand-pale)'">
            <input type="file" accept="image/*,video/*,.pdf" style="display:none" onchange="uploadDesignForPost(this,${ri})">
            <span style="font-size:24px">📁</span>
            <div>
              <div style="font-size:14px;font-weight:700;color:var(--brand)">Upload design for Post ${ri+1}</div>
              <div style="font-size:11px;color:var(--text3);margin-top:2px">From your device or Google Drive</div>
            </div>
          </label>` : ''}

      </div>`;
    }).join('')}`;
}

async function uploadDesignForPost(input, postIndex) {
  const file = input.files[0];
  if (!file) return;
  input.value = '';
  showToast('☁️ Uploading design…');
  try {
    const result = await uploadToCloudinary(file);
    const data = _getPlannerData();
    if (!data.designUploads) data.designUploads = {};
    data.designUploads[postIndex] = { url:result.url, name:file.name, source:'cloudinary', uploadedBy:currentUser?currentUser.name:'', uploadedAt:new Date().toISOString() };
    if (!data.designApprovals) data.designApprovals = {};
    delete data.designApprovals[postIndex]; // reset approval on new upload
    DB.save(state);
    if (typeof syncPush==='function') syncPush();
    renderDesignView();
    showToast('✅ Design uploaded!', 'success');
    if (typeof autoSaveToMediaLibrary==='function') autoSaveToMediaLibrary(result.url, file.name, 'cloudinary');
  } catch(e) {
    showToast('Upload failed','error');
  }
}

function approveDesign(postIndex, status) {
  const data = _getPlannerData();
  if (!data.designApprovals) data.designApprovals = {};
  data.designApprovals[postIndex] = status;
  DB.save(state);
  if (typeof syncPush==='function') syncPush();
  renderDesignView();
  showToast(status==='approved'?'✅ Design approved — ready to send to publishing!':'Changes requested', status==='approved'?'success':'error');
}

function sendToPublishing(postIndex) {
  const data   = _getPlannerData();
  const sheet  = data.spreadsheet;
  const row    = sheet.rows[postIndex] || [];
  const cols   = sheet.cols || [];
  const upload = (data.designUploads||{})[postIndex];
  if (!upload) { showToast('No design uploaded','error'); return; }

  const captionIdx  = cols.findIndex(c=>c.toLowerCase().includes('caption'));
  const dateIdx     = cols.findIndex(c=>c.toLowerCase().includes('date'));
  const platformIdx = cols.findIndex(c=>c.toLowerCase().includes('platform'));
  const hashIdx     = cols.findIndex(c=>c.toLowerCase().includes('hashtag'));

  if (!state.publishingQueue) state.publishingQueue = [];
  const id = `pub_${_getPlannerKey()}_${postIndex}`;
  // Remove if already exists
  state.publishingQueue = state.publishingQueue.filter(p=>p.id!==id);
  state.publishingQueue.push({
    id, plannerKey:_getPlannerKey(), postIndex,
    imageUrl: upload.url, imageName: upload.name,
    caption:  captionIdx>=0  ? row[captionIdx]||''  : '',
    hashtags: hashIdx>=0     ? row[hashIdx]||''     : '',
    date:     dateIdx>=0     ? row[dateIdx]||''     : '',
    platform: platformIdx>=0 ? row[platformIdx]||'' : '',
    status:   'ready',
    addedAt:  new Date().toISOString(),
  });
  DB.save(state);
  if (typeof syncPush==='function') syncPush();
  showToast('🚀 Sent to Publishing queue!', 'success');
}

function _isVideoFile(name) {
  return (name||'').match(/\.(mp4|mov|webm|avi|mkv)$/i);
}

/* ══════════════════════════════════════════════════════════
   REFERENCES INBOX
══════════════════════════════════════════════════════════ */
function renderReferencesInbox() {
  const el   = document.getElementById('referencesInbox');
  if (!el) return;
  const refs = state.references || [];

  if (!refs.length) {
    el.innerHTML = `
      <div style="text-align:center;padding:48px;color:var(--text3)">
        <div style="font-size:48px;margin-bottom:12px">📌</div>
        <div style="font-size:15px;font-weight:700;color:var(--text2)">No references yet</div>
        <div style="font-size:13px;margin-top:6px">Save Instagram posts, reels, and inspiration links here</div>
        <div style="font-size:12px;margin-top:12px;color:var(--brand)">📱 On your phone: Share any link → Save to SocialHub</div>
      </div>`;
    return;
  }

  el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">
    ${refs.map((ref,i) => `
      <div style="background:var(--white);border-radius:18px;overflow:hidden;box-shadow:var(--sh-sm);border:1px solid var(--border)">
        ${ref.imageUrl ? `<img src="${ref.imageUrl}" style="width:100%;height:180px;object-fit:cover;display:block">` :
          `<div style="height:180px;background:linear-gradient(135deg,var(--brand-pale),var(--brand-light));display:flex;align-items:center;justify-content:center;font-size:48px">🔗</div>`}
        <div style="padding:14px">
          <div style="font-size:11px;color:var(--text3);margin-bottom:6px">${new Date(ref.savedAt||Date.now()).toLocaleDateString('en-IN')}</div>
          ${ref.url ? `<a href="${ref.url}" target="_blank" style="font-size:12px;color:var(--brand);word-break:break-all;text-decoration:none">${ref.url.slice(0,60)}${ref.url.length>60?'…':''}</a>` : ''}
          <textarea class="form-input" rows="2" placeholder="Add notes…" style="margin-top:10px;font-size:12px;min-height:50px"
            oninput="updateRefNote(${i},this.value)">${ref.notes||''}</textarea>
          <div style="display:flex;gap:6px;margin-top:8px">
            <span style="flex:1;font-size:10px;padding:3px 8px;border-radius:10px;background:${ref.used?'#ECFDF5':'var(--beige)'};color:${ref.used?'#065F46':'var(--text3)'};font-weight:600">${ref.used?'✅ Used':'Pending'}</span>
            <button onclick="toggleRefUsed(${i})" class="btn btn-ghost btn-sm" style="font-size:10px;padding:3px 8px">${ref.used?'Unmark':'Mark used'}</button>
            <button onclick="deleteRef(${i})" class="btn btn-ghost btn-sm" style="font-size:10px;padding:3px 8px;color:var(--coral)">🗑</button>
          </div>
        </div>
      </div>`).join('')}
  </div>`;
}

function openAddReferenceModal() {
  document.getElementById('modalTitle').textContent = '📌 Add Reference';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group"><label class="form-label">Link (Instagram, Pinterest, etc.)</label>
      <input class="form-input" id="ref-url" placeholder="https://www.instagram.com/reel/..."></div>
    <div class="form-group"><label class="form-label">Notes</label>
      <textarea class="form-input" id="ref-notes" rows="3" placeholder="What do you like about this reference?"></textarea></div>`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveReference()">Save reference</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

function saveReference(url, notes) {
  const u = url || document.getElementById('ref-url')?.value?.trim();
  const n = notes || document.getElementById('ref-notes')?.value?.trim() || '';
  if (!u) { showToast('Add a link','error'); return; }
  if (!state.references) state.references = [];
  state.references.unshift({ url:u, notes:n, savedAt:new Date().toISOString(), used:false, savedBy:currentUser?currentUser.name:'' });
  DB.save(state);
  if (typeof syncPush==='function') syncPush();
  closeModal();
  renderReferencesInbox();
  showToast('📌 Reference saved!', 'success');
}

function updateRefNote(i, note) {
  if (!state.references||!state.references[i]) return;
  state.references[i].notes = note;
  clearTimeout(window._refSaveTimer);
  window._refSaveTimer = setTimeout(()=>{ DB.save(state); if(typeof syncPush==='function') syncPush(); }, 600);
}

function toggleRefUsed(i) {
  if (!state.references||!state.references[i]) return;
  state.references[i].used = !state.references[i].used;
  DB.save(state);
  if (typeof syncPush==='function') syncPush();
  renderReferencesInbox();
}

function deleteRef(i) {
  state.references = (state.references||[]).filter((_,idx)=>idx!==i);
  DB.save(state);
  if (typeof syncPush==='function') syncPush();
  renderReferencesInbox();
}

/* ══════════════════════════════════════════════════════════
   STICKY NOTES (calendar banner)
══════════════════════════════════════════════════════════ */
function addStickyNote() {
  const key = _getPlannerKey();
  if (!state.monthlyPlans) state.monthlyPlans = {};
  if (!state.monthlyPlans[key]) state.monthlyPlans[key] = {};
  if (!state.monthlyPlans[key].stickyNotes) state.monthlyPlans[key].stickyNotes = [];
  state.monthlyPlans[key].stickyNotes.push({ id:Date.now(), text:'', color:'#FEF9C3' });
  saveState(); _refreshCalStickyBanner();
}

function _ensureMonth(y, m) {
  const key = `${y}-${m}`;
  if (!state.monthlyPlans) state.monthlyPlans = {};
  if (!state.monthlyPlans[key]) state.monthlyPlans[key] = {};
  return state.monthlyPlans[key];
}

function _refreshCalStickyBanner() {
  const banner = document.getElementById('calStickyBanner');
  if (!banner) return;
  const plan  = _ensureMonth(typeof channelCalYear!=='undefined'?channelCalYear:plannerYear, typeof channelCalMonth!=='undefined'?channelCalMonth:plannerMonth);
  const notes = plan.stickyNotes || [];
  if (notes.length) {
    banner.innerHTML = notes.map(n => `
      <div class="cal-sticky-banner-note" style="background:${n.color||'#FEF9C3'};position:relative;padding-right:22px">
        <span class="sticky-pin-icon">📌</span>
        <span>${(n.text||'').trim()||'<em style="opacity:.5">empty note</em>'}</span>
        <button onclick="deleteStickyNoteFromBanner(${n.id})" style="position:absolute;top:3px;right:5px;background:none;border:none;cursor:pointer;font-size:12px;color:rgba(0,0,0,.35)">✕</button>
      </div>`).join('');
    banner.style.display = 'flex';
  } else banner.style.display = 'none';
}

function deleteStickyNoteFromBanner(noteId) {
  const plan = _ensureMonth(typeof channelCalYear!=='undefined'?channelCalYear:plannerYear, typeof channelCalMonth!=='undefined'?channelCalMonth:plannerMonth);
  plan.stickyNotes = (plan.stickyNotes||[]).filter(n=>n.id!==noteId);
  saveState(); _refreshCalStickyBanner();
}
