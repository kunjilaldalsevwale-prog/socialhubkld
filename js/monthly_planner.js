/* ============================================================
   MONTHLY PLANNER
   - Strategist → real Excel spreadsheet (Handsontable)
   - Designer   → document view, upload per post
   - Admin      → both views + approvals
   ============================================================ */

let plannerYear  = new Date().getFullYear();
let plannerMonth = new Date().getMonth();
let _hotInstance = null; // Handsontable instance

function renderMonthlyPlanner() {
  _renderPlannerMonth();
  const role = currentUser ? currentUser.role : 'admin';
  if (role === 'strategist') {
    const t = document.getElementById('plannerTopActions');
    if (t) t.innerHTML = `
      <button class="btn btn-ghost btn-sm" onclick="_showRefsPanel()">📌 Refs</button>
      <button class="btn btn-primary btn-sm" onclick="_saveHot();showToast('✅ Sheet saved!','success')">💾 Save</button>`;
    _renderStrategistView();
  } else if (role === 'designer') {
    const t = document.getElementById('plannerTopActions');
    if (t) t.innerHTML = `<button class="btn btn-ghost btn-sm" onclick="_showRefsPanel()">📌 References</button>`;
    _renderDesignerView();
  } else {
    _renderAdminView();
  }
}

function _renderPlannerMonth() {
  const el = document.getElementById('plannerMonthLabel');
  if (el) el.textContent = new Date(plannerYear, plannerMonth, 1)
    .toLocaleDateString('en-IN', { month:'long', year:'numeric' });
  // Render sheet name input
  const data = _getPlannerData();
  const nameEl = document.getElementById('plannerSheetName');
  if (nameEl) {
    nameEl.value = data.sheetName || '';
    nameEl.oninput = () => {
      data.sheetName = nameEl.value;
      clearTimeout(window._sheetNameTimer);
      window._sheetNameTimer = setTimeout(()=>{ DB.save(state); if(typeof syncPush==='function') syncPush(); }, 500);
    };
  }
}

function changePlannerMonth(dir) {
  plannerMonth += dir;
  if (plannerMonth > 11) { plannerMonth = 0; plannerYear++; }
  if (plannerMonth < 0)  { plannerMonth = 11; plannerYear--; }
  if (_hotInstance) { _hotInstance.destroy(); _hotInstance = null; }
  renderMonthlyPlanner();
}

function _getPlannerKey() { return `${plannerYear}-${plannerMonth}`; }

function _getPlannerData() {
  if (!state.monthlyPlans) state.monthlyPlans = {};
  const k = _getPlannerKey();
  if (!state.monthlyPlans[k]) state.monthlyPlans[k] = {
    hotData: null, hotColHeaders: null,
    sheetName: new Date(plannerYear, plannerMonth, 1).toLocaleDateString('en-IN',{month:'long',year:'numeric'}),
    approvals: {}, approvalDays: 3,
    createdAt: new Date().toISOString(),
    designUploads: {}, designApprovals: {},
  };
  return state.monthlyPlans[k];
}

/* ══════════════════════════════════════════════════════════
   STRATEGIST VIEW — Real Excel via Handsontable
══════════════════════════════════════════════════════════ */
function _renderStrategistView() {
  const data    = _getPlannerData();
  const locked  = _isSheetApproved(data);
  const content = document.getElementById('plannerContent');
  const topActs = document.getElementById('plannerTopActions');
  if (!content) return;

  // Approval bar
  _renderStratApprovalBar(data);

  if (locked) {
    content.insertAdjacentHTML('afterbegin', `
      <div style="padding:6px 14px;background:#ECFDF5;border-bottom:1px solid #6EE7B7;font-size:12px;color:#065F46;font-weight:600;flex-shrink:0">
        ✅ This sheet is approved and locked. Admins can still make changes.
      </div>`);
  }

  // Spreadsheet container
  content.innerHTML = `<div id="hotContainer" style="width:100%;height:100%"></div>`;

  // Default data
  const colHeaders = data.hotColHeaders || Array.from({length:8},(_,i)=>'Col '+(i+1));
  const rawData    = data.hotData || Array.from({length:30},()=>new Array(8).fill(''));

  if (!_hotInstance) {
    _hotInstance = new Handsontable(document.getElementById('hotContainer'), {
      data: rawData,
      colHeaders,
      rowHeaders: true,
      height: '100%',
      width:  '100%',
      stretchH: 'all',
      autoWrapRow: true,
      autoWrapCol: true,
      readOnly: locked,
      contextMenu: locked ? false : {
        items: {
          row_above:    { name:'Insert row above' },
          row_below:    { name:'Insert row below' },
          remove_row:   { name:'Delete row' },
          separator1:   Handsontable.plugins.ContextMenu.SEPARATOR,
          col_left:     { name:'Insert column left' },
          col_right:    { name:'Insert column right' },
          remove_col:   { name:'Delete column' },
          separator2:   Handsontable.plugins.ContextMenu.SEPARATOR,
          clear_column: { name:'Clear column' },
          separator3:   Handsontable.plugins.ContextMenu.SEPARATOR,
          copy:         { name:'Copy' },
          cut:          { name:'Cut' },
        }
      },
      manualColumnResize: true,
      manualRowResize:    true,
      fillHandle:         true,
      undo:               true,
      columnSorting:      true,
      search:             true,
      licenseKey: 'non-commercial-and-evaluation',
      afterChange: (changes) => {
        if (!changes) return;
        clearTimeout(window._hotSaveTimer);
        window._hotSaveTimer = setTimeout(() => {
          const d = _getPlannerData();
          d.hotData       = _hotInstance.getData();
          d.hotColHeaders = _hotInstance.getColHeader();
          DB.save(state);
          if (typeof syncPush === 'function') syncPush();
        }, 800);
      },
      afterCreateRow:    () => _saveHot(),
      afterRemoveRow:    () => _saveHot(),
      afterCreateCol:    () => _saveHot(),
      afterRemoveCol:    () => _saveHot(),
      afterColumnSort:   () => _saveHot(),
    });
  }
}

function _saveHot() {
  if (!_hotInstance) return;
  const d = _getPlannerData();
  d.hotData       = _hotInstance.getData();
  d.hotColHeaders = _hotInstance.getColHeader();
  DB.save(state);
  if (typeof syncPush === 'function') syncPush();
}

/* ══════════════════════════════════════════════════════════
   DESIGNER VIEW — Document / brief style
══════════════════════════════════════════════════════════ */
function _renderDesignerView() {
  const data    = _getPlannerData();
  const locked  = _isSheetApproved(data);
  const content = document.getElementById('plannerContent');
  const topActs = document.getElementById('plannerTopActions');
  if (!content) return;

  if (_hotInstance) { _hotInstance.destroy(); _hotInstance = null; }

  if (topActs) topActs.innerHTML = `<button class="btn btn-ghost btn-sm" onclick="_showRefsPanel()">📌 References</button>`;

  _renderStratApprovalBar(data);

  const colHeaders = data.hotColHeaders || ['Col 1','Col 2','Col 3','Col 4','Col 5','Col 6','Col 7','Col 8'];
  const rows       = data.hotData || [];

  // Use row 1 as data headers if filled, otherwise use colHeaders
  // Each subsequent row = one post
  const allFilledRows = rows.filter(r=>r.some(c=>c&&c.toString().trim()));

  // Check if first row looks like headers (short text, no long content)
  const firstRow = allFilledRows[0] || [];
  const isFirstRowHeader = firstRow.length && firstRow.every(c => !c || c.toString().trim().length < 30);
  const headers = isFirstRowHeader && allFilledRows.length > 1
    ? firstRow.map((h,i) => h||colHeaders[i]||('Col '+(i+1)))
    : colHeaders;
  const dataRows = isFirstRowHeader && allFilledRows.length > 1
    ? allFilledRows.slice(1)
    : allFilledRows;

  if (!dataRows.length) {
    content.innerHTML = `<div style="padding:24px">
      <div style="background:var(--white);border-radius:16px;padding:28px;text-align:center;border:1px solid var(--border);margin-bottom:20px">
        <div style="font-size:36px;margin-bottom:10px">📄</div>
        <div style="font-size:14px;font-weight:700;color:var(--text2);margin-bottom:4px">No posts in strategy yet</div>
        <div style="font-size:12px;color:var(--text3)">Strategist needs to fill the spreadsheet first</div>
      </div>
      <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:12px">Upload your designs</div>
      ${Array.from({length:5},(_,i)=>`
        <div style="background:var(--white);border-radius:14px;padding:16px;margin-bottom:10px;border:1px solid var(--border)">
          <div style="font-size:13px;font-weight:700;margin-bottom:10px;color:var(--text)">Post ${i+1}</div>
          ${(data.designUploads||{})[i] ? `
            <img src="${(data.designUploads||{})[i].url}" style="width:100%;max-height:200px;object-fit:contain;border-radius:10px;display:block;margin-bottom:8px">
            <a href="${(data.designUploads||{})[i].url}" target="_blank" class="btn btn-ghost btn-sm" style="text-decoration:none">⬇ Download</a>
          ` : `
            <label style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--brand-pale);border:2px dashed var(--brand-mid);border-radius:12px;cursor:pointer">
              <input type="file" accept="image/*,video/*,.pdf" style="display:none" onchange="uploadDesignForPost(this,${i})">
              <span>📁</span><span style="font-size:13px;font-weight:700;color:var(--brand)">Upload design for Post ${i+1}</span>
            </label>`}
        </div>`).join('')}
    </div>`;
    return;
  }

  content.innerHTML = `<div style="padding:16px">` +
    dataRows.map((row, ri) => {
      const upload    = (data.designUploads||{})[ri];
      const dApproval = (data.designApprovals||{})[ri];
      return `<div style="background:var(--white);border-radius:16px;padding:20px;margin-bottom:16px;border:1px solid var(--border);box-shadow:var(--sh-sm)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
          <div style="width:28px;height:28px;border-radius:50%;background:var(--brand-pale);color:var(--brand);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0">${ri+1}</div>
          <div style="font-size:13px;font-weight:700;color:var(--text)">${row[0]||'Post '+(ri+1)}</div>
          <div style="margin-left:auto">
            ${dApproval==='approved'?'<span style="padding:3px 10px;border-radius:20px;background:#ECFDF5;color:#065F46;font-size:11px;font-weight:700">✅ Approved</span>':
              dApproval==='rejected'?'<span style="padding:3px 10px;border-radius:20px;background:#FEF2F2;color:#991B1B;font-size:11px;font-weight:700">❌ Changes needed</span>':
              upload?'<span style="padding:3px 10px;border-radius:20px;background:#FEF9C3;color:#92400E;font-size:11px;font-weight:700">⏳ Awaiting approval</span>':''}
          </div>
        </div>
        <div style="margin-bottom:14px;font-size:13px;color:var(--text);line-height:1.9">
          ${headers.map((h,ci) => row[ci]&&row[ci].toString().trim() ? `<div><span style="color:var(--text3);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em">${h}</span><span style="margin-left:8px">${row[ci]}</span></div>` : '').join('')}
        </div>
        ${upload ? `
          <div style="margin-bottom:12px;border-radius:12px;overflow:hidden;border:1px solid var(--border)">
            ${_isVideoFile(upload.name)
              ? `<video src="${upload.url}" controls style="width:100%;max-height:360px;display:block"></video>`
              : `<img src="${upload.url}" style="width:100%;max-height:360px;object-fit:contain;display:block;background:#f0f0f0">`}
            <div style="padding:8px 12px;background:var(--surface2);display:flex;gap:8px;align-items:center">
              <span style="font-size:12px;color:var(--text2);flex:1">${upload.name}</span>
              <a href="${upload.url}" target="_blank" class="btn btn-ghost btn-sm" style="text-decoration:none;font-size:11px">⬇</a>
              ${dApproval!=='approved'?`<label class="btn btn-ghost btn-sm" style="cursor:pointer;font-size:11px"><input type="file" accept="image/*,video/*,.pdf" style="display:none" onchange="uploadDesignForPost(this,${ri})">🔄</label>`:''}
            </div>
          </div>` : ''}
        ${!upload?`
          <label style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--brand-pale);border:2px dashed var(--brand-mid);border-radius:12px;cursor:pointer">
            <input type="file" accept="image/*,video/*,.pdf" style="display:none" onchange="uploadDesignForPost(this,${ri})">
            <span>📁</span><span style="font-size:13px;font-weight:700;color:var(--brand)">Upload design for Post ${ri+1}</span>
          </label>`:''}
        ${dApproval==='approved'?`<button onclick="sendToPublishing(${ri})" class="btn btn-primary btn-sm" style="margin-top:10px">🚀 Send to Publishing</button>`:''}
      </div>`;
    }).join('') + `</div>`;
}

/* ══════════════════════════════════════════════════════════
   ADMIN VIEW — toggle between strategy, design, refs
══════════════════════════════════════════════════════════ */
let _adminPlannerView = 'strategy';

function _renderAdminView() {
  const topActs = document.getElementById('plannerTopActions');
  if (topActs) topActs.innerHTML = `
    <button class="btn ${_adminPlannerView==='strategy'?'btn-primary':'btn-ghost'} btn-sm" onclick="_adminPlannerView='strategy';renderMonthlyPlanner()">📊 Strategy</button>
    <button class="btn ${_adminPlannerView==='design'?'btn-primary':'btn-ghost'} btn-sm" onclick="_adminPlannerView='design';renderMonthlyPlanner()">🎨 Design</button>
    <button class="btn ${_adminPlannerView==='refs'?'btn-primary':'btn-ghost'} btn-sm" onclick="_adminPlannerView='refs';renderMonthlyPlanner()">📌 Refs</button>
    <button class="btn btn-primary btn-sm" onclick="_saveHot();showToast('✅ Saved!','success')">💾 Save</button>`;

  if (_adminPlannerView === 'strategy') _renderStrategistView();
  else if (_adminPlannerView === 'design') _renderDesignerView();
  else _showRefsPanel();
}

/* ══════════════════════════════════════════════════════════
   APPROVAL
══════════════════════════════════════════════════════════ */
function _isSheetApproved(data) {
  const admins = Object.values(TEAM_USERS).filter(u=>u.role==='admin');
  if (!admins.length) return false;
  return admins.every(u =>
    (data.approvals||{})[u.id]==='approved' || _isAutoApproved(data,u.id)
  );
}

function _isAutoApproved(data, adminId) {
  if (!data.createdAt) return false;
  return Date.now() > new Date(data.createdAt).getTime() + (data.approvalDays||3)*24*60*60*1000;
}

function _renderStratApprovalBar(data) {
  const el = document.getElementById('stratApprovalBar');
  if (!el) return;
  const ADMINS   = Object.values(TEAM_USERS).filter(u=>u.role==='admin');
  const approved = ADMINS.filter(a=>(data.approvals||{})[a.id]==='approved'||_isAutoApproved(data,a.id)).length;
  const rejected = ADMINS.some(a=>(data.approvals||{})[a.id]==='rejected');
  const allOk    = ADMINS.length > 0 && approved===ADMINS.length;

  // Show approve buttons for ANY admin (not just anusha/anjani/tejasv)
  const isAdminUser = currentUser && currentUser.role === 'admin';
  const myApproval = isAdminUser ? (data.approvals||{})[currentUser.id] : null;
  const showMyBtns = isAdminUser && !myApproval && !_isAutoApproved(data, currentUser.id);

  el.innerHTML = `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
    <span style="font-size:11px;font-weight:700;color:${rejected?'#991B1B':allOk?'#065F46':'var(--text3)'}">
      ${rejected?'❌ Changes requested':allOk?'✅ Strategy approved':`${approved}/3 approved`}
    </span>
    ${showMyBtns?`
    <button onclick="approveStrategy('${currentUser.id}','approved')" style="padding:3px 12px;background:#ECFDF5;color:#065F46;border:1px solid #6EE7B7;border-radius:14px;font-size:11px;font-weight:700;cursor:pointer;font-family:var(--font)">✅ Approve</button>
    <button onclick="approveStrategy('${currentUser.id}','rejected')" style="padding:3px 12px;background:#FEF2F2;color:#991B1B;border:1px solid #FCA5A5;border-radius:14px;font-size:11px;font-weight:700;cursor:pointer;font-family:var(--font)">❌ Reject</button>`:''}
  </div>`;
}

function approveStrategy(adminId, status) {
  const data = _getPlannerData();
  if (!data.approvals) data.approvals = {};
  data.approvals[adminId] = status;
  DB.save(state);
  if (typeof syncPush==='function') syncPush();
  _renderStratApprovalBar(data);
  renderMonthlyPlanner();
  showToast(status==='approved'?'✅ Approved!':'Changes requested', status==='approved'?'success':'error');
}

function approveDesign(postIndex, status) {
  const data = _getPlannerData();
  if (!data.designApprovals) data.designApprovals={};
  data.designApprovals[postIndex] = status;
  DB.save(state);
  if (typeof syncPush==='function') syncPush();
  renderMonthlyPlanner();
  showToast(status==='approved'?'✅ Design approved!':'Changes requested', status==='approved'?'success':'error');
}

/* ══════════════════════════════════════════════════════════
   DESIGN UPLOAD + PUBLISHING
══════════════════════════════════════════════════════════ */
async function uploadDesignForPost(input, postIndex) {
  const file = input.files[0];
  if (!file) return;
  input.value='';
  showToast('☁️ Uploading…');
  try {
    const result = await uploadToCloudinary(file);
    const data = _getPlannerData();
    if (!data.designUploads) data.designUploads={};
    data.designUploads[postIndex] = { url:result.url, name:file.name, source:'cloudinary', uploadedAt:new Date().toISOString() };
    if (!data.designApprovals) data.designApprovals={};
    delete data.designApprovals[postIndex];
    DB.save(state);
    if (typeof syncPush==='function') syncPush();
    renderMonthlyPlanner();
    showToast('✅ Design uploaded!','success');
    if (typeof autoSaveToMediaLibrary==='function') autoSaveToMediaLibrary(result.url, file.name, 'cloudinary');
  } catch(e) { showToast('Upload failed','error'); }
}

function sendToPublishing(postIndex) {
  const data = _getPlannerData();
  const upload = (data.designUploads||{})[postIndex];
  if (!upload) { showToast('No design uploaded','error'); return; }
  const colHeaders = data.hotColHeaders||['Date','Platform','Post Type','Caption','Hashtags','Reference Link','Notes','Status'];
  const rows       = data.hotData||[];
  const filledRows = rows.filter(r=>r.some(c=>c&&c.toString().trim()));
  const row        = filledRows[postIndex]||[];
  const captionIdx = colHeaders.findIndex(h=>h.toLowerCase().includes('caption'));
  const dateIdx    = colHeaders.findIndex(h=>h.toLowerCase().includes('date'));
  const platformIdx= colHeaders.findIndex(h=>h.toLowerCase().includes('platform'));
  const hashIdx    = colHeaders.findIndex(h=>h.toLowerCase().includes('hashtag'));
  if (!state.publishingQueue) state.publishingQueue=[];
  const id = `pub_${_getPlannerKey()}_${postIndex}`;
  state.publishingQueue = state.publishingQueue.filter(p=>p.id!==id);
  state.publishingQueue.push({
    id, postIndex,
    imageUrl:  upload.url, imageName: upload.name,
    caption:   captionIdx>=0  ? row[captionIdx]||''  : '',
    hashtags:  hashIdx>=0     ? row[hashIdx]||''     : '',
    date:      dateIdx>=0     ? row[dateIdx]||''     : '',
    platform:  platformIdx>=0 ? row[platformIdx]||'' : 'Instagram',
    status:    'ready', addedAt: new Date().toISOString(),
  });
  DB.save(state);
  if (typeof syncPush==='function') syncPush();
  showToast('🚀 Sent to Publishing!','success');
}

function _isVideoFile(name) { return (name||'').match(/\.(mp4|mov|webm|avi|mkv)$/i); }

/* ══════════════════════════════════════════════════════════
   REFERENCES
══════════════════════════════════════════════════════════ */
function _showRefsPanel() {
  const content = document.getElementById('plannerContent');
  if (!content) return;
  if (_hotInstance) { _hotInstance.destroy(); _hotInstance=null; }
  const refs = state.references||[];
  content.innerHTML = `
    <div style="padding:14px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <span style="font-size:13px;font-weight:700;color:var(--text)">📌 References Inbox</span>
        <button class="btn btn-primary btn-sm" onclick="openAddReferenceModal()">＋ Add</button>
      </div>
      ${!refs.length ? `<div style="text-align:center;padding:40px;color:var(--text3)">
        <div style="font-size:36px;margin-bottom:10px">📌</div>
        <div style="font-weight:700;color:var(--text2)">No references yet</div>
        <div style="font-size:12px;margin-top:6px">📱 Share any Instagram/Pinterest link to SocialHub from your phone</div>
      </div>` :
      `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px">
        ${refs.map((ref,i)=>`
          <div style="background:var(--white);border-radius:14px;overflow:hidden;border:1px solid var(--border);box-shadow:var(--sh-sm)">
            <div style="height:140px;background:var(--brand-pale);display:flex;align-items:center;justify-content:center;font-size:36px">🔗</div>
            <div style="padding:10px 12px">
              ${ref.url?`<a href="${ref.url}" target="_blank" style="font-size:11px;color:var(--brand);word-break:break-all;text-decoration:none">${ref.url.slice(0,50)}…</a>`:''}
              <textarea class="form-input" rows="2" placeholder="Notes…" style="margin-top:8px;font-size:11px;min-height:40px"
                oninput="updateRefNote(${i},this.value)">${ref.notes||''}</textarea>
              <div style="display:flex;gap:6px;margin-top:6px">
                <button onclick="toggleRefUsed(${i})" class="btn btn-ghost btn-sm" style="font-size:10px;flex:1">${ref.used?'✅ Used':'Mark used'}</button>
                <button onclick="deleteRef(${i})" class="btn btn-ghost btn-sm" style="font-size:10px;color:var(--coral)">🗑</button>
              </div>
            </div>
          </div>`).join('')}
      </div>`}
    </div>`;
}

function openAddReferenceModal() {
  document.getElementById('modalTitle').textContent='📌 Add Reference';
  document.getElementById('modalBody').innerHTML=`
    <div class="form-group"><label class="form-label">Link</label>
      <input class="form-input" id="ref-url" placeholder="https://www.instagram.com/reel/..."></div>
    <div class="form-group"><label class="form-label">Notes</label>
      <textarea class="form-input" id="ref-notes" rows="3" placeholder="What do you like about this?"></textarea></div>`;
  document.getElementById('modalFooter').innerHTML=`
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveReference()">Save</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

function saveReference() {
  const u=(document.getElementById('ref-url').value||'').trim();
  const n=(document.getElementById('ref-notes').value||'').trim();
  if (!u){showToast('Add a link','error');return;}
  if (!state.references) state.references=[];
  state.references.unshift({url:u,notes:n,savedAt:new Date().toISOString(),used:false,savedBy:currentUser?currentUser.name:''});
  DB.save(state);if(typeof syncPush==='function')syncPush();
  closeModal();_showRefsPanel();showToast('📌 Saved!','success');
}

function updateRefNote(i,note){
  if(!state.references||!state.references[i])return;
  state.references[i].notes=note;
  clearTimeout(window._refSaveTimer);
  window._refSaveTimer=setTimeout(()=>{DB.save(state);if(typeof syncPush==='function')syncPush();},600);
}

function toggleRefUsed(i){
  if(!state.references||!state.references[i])return;
  state.references[i].used=!state.references[i].used;
  DB.save(state);if(typeof syncPush==='function')syncPush();_showRefsPanel();
}

function deleteRef(i){
  state.references=(state.references||[]).filter((_,idx)=>idx!==i);
  DB.save(state);if(typeof syncPush==='function')syncPush();_showRefsPanel();
}

/* ══════════════════════════════════════════════════════════
   STICKY NOTES (calendar banner)
══════════════════════════════════════════════════════════ */
function _ensureMonth(y,m){
  const key=`${y}-${m}`;
  if(!state.monthlyPlans)state.monthlyPlans={};
  if(!state.monthlyPlans[key])state.monthlyPlans[key]={};
  return state.monthlyPlans[key];
}

function _refreshCalStickyBanner(){
  const banner=document.getElementById('calStickyBanner');
  if(!banner)return;
  const plan=_ensureMonth(typeof channelCalYear!=='undefined'?channelCalYear:plannerYear,typeof channelCalMonth!=='undefined'?channelCalMonth:plannerMonth);
  const notes=plan.stickyNotes||[];
  if(notes.length){
    banner.innerHTML=notes.map(n=>`
      <div class="cal-sticky-banner-note" style="background:${n.color||'#FEF9C3'};position:relative;padding-right:22px">
        <span class="sticky-pin-icon">📌</span>
        <span>${(n.text||'').trim()||'<em style="opacity:.5">empty note</em>'}</span>
        <button onclick="deleteStickyNoteFromBanner(${n.id})" style="position:absolute;top:3px;right:5px;background:none;border:none;cursor:pointer;font-size:12px;color:rgba(0,0,0,.35)">✕</button>
      </div>`).join('');
    banner.style.display='flex';
  } else banner.style.display='none';
}

function deleteStickyNoteFromBanner(noteId){
  const plan=_ensureMonth(typeof channelCalYear!=='undefined'?channelCalYear:plannerYear,typeof channelCalMonth!=='undefined'?channelCalMonth:plannerMonth);
  plan.stickyNotes=(plan.stickyNotes||[]).filter(n=>n.id!==noteId);
  saveState();_refreshCalStickyBanner();
}

function addStickyNote(){
  const key=_getPlannerKey();
  if(!state.monthlyPlans)state.monthlyPlans={};
  if(!state.monthlyPlans[key])state.monthlyPlans[key]={};
  if(!state.monthlyPlans[key].stickyNotes)state.monthlyPlans[key].stickyNotes=[];
  state.monthlyPlans[key].stickyNotes.push({id:Date.now(),text:'',color:'#FEF9C3'});
  saveState();_refreshCalStickyBanner();
}

/* ══════════════════════════════════════════════════════════
   ALL SHEETS MODAL
══════════════════════════════════════════════════════════ */
function openAllSheetsModal() {
  const plans = state.monthlyPlans || {};
  const sheets = Object.entries(plans)
    .filter(([k, v]) => v.hotData || v.sheetName)
    .sort(([a],[b]) => b.localeCompare(a))
    .map(([k, v]) => {
      const [y, m] = k.split('-');
      const monthName = new Date(parseInt(y), parseInt(m), 1)
        .toLocaleDateString('en-IN', {month:'long', year:'numeric'});
      const rowCount = (v.hotData||[]).filter(r=>r.some(c=>c&&c.toString().trim())).length;
      const approved = _isSheetApproved(v);
      return { k, y:parseInt(y), m:parseInt(m), name:v.sheetName||monthName, monthName, rowCount, approved };
    });

  document.getElementById('modalTitle').textContent = '📋 All Sheets';
  document.getElementById('modalBody').innerHTML = !sheets.length
    ? `<div style="text-align:center;padding:32px;color:var(--text3)">No sheets yet — start adding content to the planner</div>`
    : `<div style="display:flex;flex-direction:column;gap:8px">
        ${sheets.map(s => `
          <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--surface2);border-radius:12px;border:1px solid var(--border);cursor:pointer"
            onclick="plannerYear=${s.y};plannerMonth=${s.m};if(_hotInstance){_hotInstance.destroy();_hotInstance=null;}renderMonthlyPlanner();closeModal()">
            <div style="flex:1">
              <div style="font-size:13px;font-weight:700;color:var(--text)">${s.name}</div>
              <div style="font-size:11px;color:var(--text3);margin-top:2px">${s.monthName} · ${s.rowCount} row${s.rowCount!==1?'s':''}</div>
            </div>
            <span style="font-size:11px;padding:3px 10px;border-radius:20px;font-weight:700;background:${s.approved?'#ECFDF5':'#EFF6FF'};color:${s.approved?'#065F46':'#1D4ED8'}">
              ${s.approved?'✅ Approved':'Pending'}
            </span>
          </div>`).join('')}
      </div>`;
  document.getElementById('modalFooter').innerHTML = `<button class="btn btn-ghost" onclick="closeModal()">Close</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}
     
