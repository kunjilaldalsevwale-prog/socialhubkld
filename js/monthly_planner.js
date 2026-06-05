/* ============================================================
   MONTHLY PLANNER — Campaign-based
   ============================================================ */

let plannerYear  = new Date().getFullYear();
let plannerMonth = new Date().getMonth();

function renderMonthlyPlanner() {
  _renderPlannerHeader();
  _renderCampaignsList();
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

function _getCampaigns() {
  if (!state.monthlyPlans) state.monthlyPlans = {};
  const k = _getPlannerKey();
  if (!state.monthlyPlans[k]) state.monthlyPlans[k] = { campaigns:[] };
  if (!state.monthlyPlans[k].campaigns) state.monthlyPlans[k].campaigns = [];
  return state.monthlyPlans[k].campaigns;
}

function _renderCampaignsList() {
  const el = document.getElementById('plannerCampaignsList');
  if (!el) return;
  const campaigns = _getCampaigns();
  el.innerHTML = campaigns.length ? campaigns.map(c => `
    <div class="campaign-card" onclick="openCampaignPopup('${c.id}')">
      <div class="campaign-card-thumb">
        ${c.stratImages&&c.stratImages[0]
          ? `<img src="${c.stratImages[0].url}" style="width:100%;height:100%;object-fit:cover">`
          : `<div style="font-size:28px;display:flex;align-items:center;justify-content:center;height:100%;background:var(--brand-pale)">📣</div>`}
      </div>
      <div class="campaign-card-body">
        <div style="font-size:15px;font-weight:800;color:var(--text)">${c.name}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:3px">${c.startDate||''}${c.endDate?' → '+c.endDate:''}</div>
        <div style="font-size:12px;color:var(--text2);margin-top:6px;line-height:1.5">${(c.brief||'').slice(0,80)}${(c.brief||'').length>80?'…':''}</div>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
          <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;background:var(--brand-pale);color:var(--brand)">${(c.stratImages||[]).length} refs</span>
          <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;background:var(--green-light);color:var(--green)">${(c.designImages||[]).length} designs</span>
          <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;background:${_allApproved(c)?'#ECFDF5':'#EFF6FF'};color:${_allApproved(c)?'#065F46':'#1D4ED8'}">${_approvalCount(c)}/3 approved</span>
        </div>
      </div>
      <div style="padding:14px;display:flex;flex-direction:column;gap:6px;justify-content:center">
        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openCampaignPopup('${c.id}')">Open →</button>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();deleteCampaign('${c.id}')" style="color:var(--coral);border-color:var(--coral)">Delete</button>
      </div>
    </div>`).join('')
  : `<div style="text-align:center;padding:48px;color:var(--text3)">
      <div style="font-size:48px;margin-bottom:12px">📋</div>
      <div style="font-size:15px;font-weight:700;color:var(--text2);margin-bottom:6px">No campaigns yet</div>
      <div style="font-size:13px;margin-bottom:20px">Add your first campaign for this month</div>
    </div>`;
}

function addNewCampaign() {
  const campaigns = _getCampaigns();
  const id = 'camp_' + Date.now();
  campaigns.push({
    id, name:'New Campaign', brief:'', startDate:'', endDate:'',
    stratImages:[], stratNotes:'', stratFeedback:'',
    designRefs:[], designImages:[], designNotes:'', designFeedback:'',
    driveFolderUrl:'', assignedDesigner:'',
    approvals:{}, approvalDays:3,
    createdAt: new Date().toISOString(),
    created: new Date().toISOString()
  });
  saveState();
  _renderCampaignsList();
  openCampaignPopup(id);
}

function deleteCampaign(id) {
  const k = _getPlannerKey();
  if (!state.monthlyPlans[k]) return;
  state.monthlyPlans[k].campaigns = state.monthlyPlans[k].campaigns.filter(c=>c.id!==id);
  saveState(); _renderCampaignsList();
}

/* ══════════════════════════════════════════════════════════
   APPROVAL HELPERS
══════════════════════════════════════════════════════════ */
function _approvalCount(c) {
  return ['anusha','anjani','tejasv'].filter(a => {
    const s = _getApprovalStatus(c,a);
    return s==='approved'||s==='auto';
  }).length;
}
function _allApproved(c) { return _approvalCount(c)===3; }

function _getApprovalStatus(c, adminId) {
  const approvals = c.approvals || {};
  if (approvals[adminId]) return approvals[adminId].status;
  if (c.createdAt) {
    const days = c.approvalDays || 3;
    const deadline = new Date(c.createdAt).getTime() + days*24*60*60*1000;
    if (Date.now() > deadline) return 'auto';
  }
  return 'pending';
}

function _getDeadlineText(c) {
  if (!c.createdAt) return '';
  const days = c.approvalDays || 3;
  const deadline = new Date(new Date(c.createdAt).getTime() + days*24*60*60*1000);
  const diff = Math.ceil((deadline - Date.now()) / (1000*60*60*24));
  if (diff <= 0) return '(deadline passed — auto-approved)';
  return `(${diff} day${diff!==1?'s':''} left)`;
}

function _renderApprovalBadge(c) {
  const rejected = ['anusha','anjani','tejasv'].some(a=>_getApprovalStatus(c,a)==='rejected');
  if (rejected) return `<span style="padding:5px 14px;border-radius:20px;background:#FEF2F2;color:#991B1B;font-size:12px;font-weight:700">❌ Changes requested</span>`;
  if (_allApproved(c)) return `<span style="padding:5px 14px;border-radius:20px;background:#ECFDF5;color:#065F46;font-size:12px;font-weight:700">✅ All approved</span>`;
  return `<span style="padding:5px 14px;border-radius:20px;background:#EFF6FF;color:#1D4ED8;font-size:12px;font-weight:700">${_approvalCount(c)}/3 approved</span>`;
}

function setCampaignApproval(campId, adminId, status) {
  const c = _getCampaigns().find(x=>x.id===campId);
  if (!c) return;
  if (!c.approvals) c.approvals = {};
  c.approvals[adminId] = { status, ts: new Date().toISOString(), by: currentUser?currentUser.name:adminId };
  saveState();
  openCampaignPopup(campId);
  showToast(status==='approved'?'✅ Approved!':'Changes requested', status==='approved'?'success':'error');
}

function updateApprovalDeadline(campId) {
  const c = _getCampaigns().find(x=>x.id===campId);
  if (!c) return;
  const el = document.getElementById('strat-deadline-'+campId);
  if (el) el.textContent = _getDeadlineText(c);
}

/* ══════════════════════════════════════════════════════════
   IMAGE HELPERS
══════════════════════════════════════════════════════════ */
function _renderCpImages(images, campId, section) {
  if (!images.length) return `<div style="color:var(--text3);font-size:12px;padding:8px 0">No images yet</div>`;
  return images.map((img,i) => `
    <div style="position:relative;border-radius:12px;overflow:hidden;aspect-ratio:1;background:var(--surface3)">
      <img src="${img.url}" style="width:100%;height:100%;object-fit:cover;cursor:zoom-in" onclick="_openCpLightbox('${img.url}')">
      <button onclick="removeCpImage('${campId}','${section}',${i})"
        style="position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;border:none;cursor:pointer;font-size:11px">✕</button>
    </div>`).join('');
}

function _renderCpImagesWithBrief(images, campId, section) {
  section = section || 'strat';
  if (!images.length) return `<div style="color:var(--text3);font-size:12px;padding:8px 0">No images yet</div>`;
  return images.map((img,i) => `
    <div style="background:var(--white);border:1px solid var(--border);border-radius:14px;overflow:hidden;display:flex;gap:0">
      <div style="width:90px;flex-shrink:0;cursor:zoom-in" onclick="_openCpLightbox('${img.url}')">
        <img src="${img.url}" style="width:100%;height:100%;object-fit:cover;display:block;min-height:80px">
      </div>
      <div style="flex:1;padding:10px 12px">
        <input class="form-input" value="${(img.brief||'').replace(/"/g,'&quot;')}"
          placeholder="Brief for this image (e.g. warm tones, festive mood)…"
          style="font-size:12px;padding:6px 10px"
          oninput="updateCpImageBrief('${campId}',${i},this.value,'${section}')">
      </div>
      <button onclick="removeCpImage('${campId}','${section}',${i})"
        style="width:30px;background:var(--coral-light);border:none;cursor:pointer;color:var(--coral);font-size:14px;flex-shrink:0">✕</button>
    </div>`).join('');
}

function updateCpImageBrief(campId, idx, brief, section) {
  const c = _getCampaigns().find(x=>x.id===campId);
  const key = section==='designRefs' ? 'designRefs' : 'stratImages';
  if (c && c[key] && c[key][idx]) {
    c[key][idx].brief = brief;
    clearTimeout(window._cpSaveTimer);
    window._cpSaveTimer = setTimeout(()=>saveState(), 800);
  }
}

async function uploadCpImages(input, campId, section) {
  const files = Array.from(input.files||[]);
  if (!files.length) return;
  input.value = '';
  const c = _getCampaigns().find(x=>x.id===campId);
  if (!c) return;
  const key = section==='strat' ? 'stratImages' : 'designImages';
  if (!c[key]) c[key] = [];
  showToast(`☁️ Uploading ${files.length} file${files.length>1?'s':''}…`);
  for (const file of files) {
    try {
      const result = await uploadToCloudinary(file);
      c[key].push({ url:result.url, name:file.name, brief:'' });
      if (typeof autoSaveToMediaLibrary==='function') autoSaveToMediaLibrary(result.url, file.name, 'cloudinary');
    } catch(e) { showToast('Upload failed: '+file.name,'error'); }
  }
  saveState();
  const grid = document.getElementById(`cp-${section}-images-${campId}`);
  if (grid) grid.innerHTML = section==='strat'
    ? _renderCpImagesWithBrief(c[key], campId, 'strat')
    : _renderCpImages(c[key], campId, section);
  showToast(`✅ Uploaded!`,'success');
}

async function uploadCpDesignRefs(input, campId) {
  const files = Array.from(input.files||[]);
  if (!files.length) return;
  input.value = '';
  const c = _getCampaigns().find(x=>x.id===campId);
  if (!c) return;
  if (!c.designRefs) c.designRefs = [];
  showToast(`☁️ Uploading ${files.length} file${files.length>1?'s':''}…`);
  for (const file of files) {
    try {
      const result = await uploadToCloudinary(file);
      c.designRefs.push({ url:result.url, name:file.name, brief:'' });
      if (typeof autoSaveToMediaLibrary==='function') autoSaveToMediaLibrary(result.url, file.name, 'cloudinary');
    } catch(e) { showToast('Upload failed: '+file.name,'error'); }
  }
  saveState();
  const grid = document.getElementById(`cp-design-refs-${campId}`);
  if (grid) grid.innerHTML = _renderCpImagesWithBrief(c.designRefs, campId, 'designRefs');
  showToast('✅ Uploaded!','success');
}

function removeCpImage(campId, section, idx) {
  const c = _getCampaigns().find(x=>x.id===campId);
  if (!c) return;
  const key = section==='strat' ? 'stratImages' : section==='designRefs' ? 'designRefs' : 'designImages';
  if (!c[key]) return;
  c[key].splice(idx, 1);
  saveState();
  const grid = section==='designRefs'
    ? document.getElementById(`cp-design-refs-${campId}`)
    : document.getElementById(`cp-${section}-images-${campId}`);
  if (grid) grid.innerHTML = (section==='strat'||section==='designRefs')
    ? _renderCpImagesWithBrief(c[key], campId, section)
    : _renderCpImages(c[key], campId, section);
}

function _openCpLightbox(url) {
  const lb = document.createElement('div');
  lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:3000;display:flex;align-items:center;justify-content:center;cursor:zoom-out';
  lb.onclick = () => lb.remove();
  lb.innerHTML = `<img src="${url}" style="max-width:90vw;max-height:90vh;object-fit:contain;border-radius:12px">`;
  document.body.appendChild(lb);
}

/* ══════════════════════════════════════════════════════════
   DRIVE SYNC
══════════════════════════════════════════════════════════ */
const GDRIVE_API_KEY = 'AIzaSyDd5G37VmvL3xg5Dtqty8Enl15v-Kh6KJ0';

async function syncDriveFolder(campId) {
  const c = _getCampaigns().find(x=>x.id===campId);
  if (!c) return;
  const input = document.getElementById('cp-drive-'+campId);
  const url = (input ? input.value.trim() : c.driveFolderUrl||'');
  if (!url) { showToast('Paste a Drive folder or file link','error'); return; }

  // Save the URL
  c.driveFolderUrl = url;

  // Check if it's a folder link
  const folderMatch = url.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) {
    const folderId = folderMatch[1];
    showToast('☁️ Syncing folder from Drive…');
    try {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType+contains+'image/'&key=${GDRIVE_API_KEY}&fields=files(id,name,mimeType)&pageSize=50`
      );
      const data = await res.json();
      if (data.error) { showToast('Drive API error: '+data.error.message,'error'); return; }
      if (!data.files||!data.files.length) { showToast('No images found in folder — make sure it is shared publicly','error'); return; }
      if (!c.designImages) c.designImages = [];
      let added = 0;
      data.files.forEach(file => {
        const viewUrl = `https://drive.google.com/uc?export=view&id=${file.id}`;
        if (!c.designImages.find(img=>img.url===viewUrl)) {
          c.designImages.push({ url:viewUrl, name:file.name, source:'drive' });
          added++;
        }
      });
      saveState();
      const grid = document.getElementById(`cp-design-images-${campId}`);
      if (grid) grid.innerHTML = _renderCpImages(c.designImages, campId, 'design');
      showToast(`✅ ${added} image${added!==1?'s':''} synced from Drive folder!`,'success');
    } catch(e) {
      showToast('Could not reach Drive — check folder is shared publicly','error');
    }
    return;
  }

  // Single file link
  const fileMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) {
    const fileId  = fileMatch[1];
    const viewUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    if (!c.designImages) c.designImages = [];
    if (c.designImages.find(img=>img.url===viewUrl)) { showToast('Already added',''); return; }
    c.designImages.push({ url:viewUrl, name:`drive-${fileId.slice(0,8)}.jpg`, source:'drive' });
    saveState();
    const grid = document.getElementById(`cp-design-images-${campId}`);
    if (grid) grid.innerHTML = _renderCpImages(c.designImages, campId, 'design');
    showToast('✅ Design added from Drive!','success');
    return;
  }
  showToast('Invalid Drive link','error');
}

/* ══════════════════════════════════════════════════════════
   CAMPAIGN POPUP
══════════════════════════════════════════════════════════ */
function openCampaignPopup(id) {
  const c = _getCampaigns().find(x=>x.id===id);
  if (!c) return;
  let popup = document.getElementById('campaignPopup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'campaignPopup';
    popup.style.cssText = 'position:fixed;inset:0;background:rgba(20,18,16,.55);z-index:2000;display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;backdrop-filter:blur(6px);animation:fadeIn .2s ease';
    document.body.appendChild(popup);
  }

  const ADMINS = ['anusha','anjani','tejasv'];

  popup.innerHTML = `
    <div style="background:var(--white);border-radius:24px;width:100%;max-width:780px;box-shadow:0 32px 80px rgba(0,0,0,.2);overflow:hidden;margin:auto">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,var(--brand),var(--brand-dark));padding:24px 28px;display:flex;align-items:center;gap:16px">
        <div style="flex:1">
          <input id="cp-name" value="${c.name}" placeholder="Campaign name…"
            style="background:rgba(255,255,255,.15);border:none;border-radius:10px;padding:8px 14px;font-size:20px;font-weight:800;color:#fff;font-family:var(--font);width:100%;outline:none"
            oninput="updateCampaignField('${id}','name',this.value)">
          <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">
            <input type="date" value="${c.startDate||''}"
              style="background:rgba(255,255,255,.15);border:none;border-radius:8px;padding:5px 10px;font-size:12px;color:#fff;font-family:var(--font);outline:none;color-scheme:dark"
              oninput="updateCampaignField('${id}','startDate',this.value)">
            <span style="color:rgba(255,255,255,.6);line-height:2">→</span>
            <input type="date" value="${c.endDate||''}"
              style="background:rgba(255,255,255,.15);border:none;border-radius:8px;padding:5px 10px;font-size:12px;color:#fff;font-family:var(--font);outline:none;color-scheme:dark"
              oninput="updateCampaignField('${id}','endDate',this.value)">
          </div>
        </div>
        <button onclick="closeCampaignPopup()"
          style="display:flex;align-items:center;gap:7px;padding:8px 16px;background:rgba(255,255,255,.2);border:none;color:#fff;font-size:14px;font-weight:700;cursor:pointer;border-radius:20px;font-family:var(--font)">
          ← Back
        </button>
      </div>

      <!-- Body -->
      <div style="padding:28px;display:flex;flex-direction:column;gap:24px">

        <!-- Brief -->
        <div>
          <div class="cp-section-label">📋 Campaign brief & reasoning</div>
          <textarea class="form-input form-textarea" rows="3" placeholder="Describe the campaign goal, target audience, key message, reasoning…"
            style="min-height:80px" oninput="updateCampaignField('${id}','brief',this.value)">${c.brief||''}</textarea>
        </div>

        <!-- ══ STRATEGIST ══ -->
        <div style="background:var(--beige);border-radius:18px;padding:20px;border:1px solid var(--border)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:36px;height:36px;border-radius:50%;background:#DBEAFE;color:#1D4ED8;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800">S</div>
              <div>
                <div style="font-size:14px;font-weight:800;color:var(--text)">Strategist</div>
                <div style="font-size:11px;color:var(--text3)">Upload references with brief · add consolidated thought</div>
              </div>
            </div>
            <div id="strat-approval-badge-${id}">${_renderApprovalBadge(c)}</div>
          </div>

          <!-- Reference images with briefs -->
          <div style="margin-bottom:14px">
            <div class="cp-field-label">Reference images <span style="font-weight:400;opacity:.6;text-transform:none;font-size:10px">(add a brief for each)</span></div>
            <div id="cp-strat-images-${id}" style="display:flex;flex-direction:column;gap:10px">
              ${_renderCpImagesWithBrief(c.stratImages||[], id, 'strat')}
            </div>
            <label class="cp-upload-btn" style="margin-top:10px">
              <input type="file" accept="image/*" multiple style="display:none" onchange="uploadCpImages(this,'${id}','strat')">
              ＋ Add reference images
            </label>
          </div>

          <!-- Consolidated thought -->
          <div style="margin-bottom:14px">
            <div class="cp-field-label">Consolidated thought / overall strategy</div>
            <textarea class="form-input form-textarea" rows="4"
              placeholder="Summarise the overall strategy — content angles, hooks, tone of voice, platform notes, key message…"
              oninput="updateCampaignField('${id}','stratNotes',this.value)">${c.stratNotes||''}</textarea>
          </div>

          <!-- Approval panel — single slab -->
          <div style="background:var(--white);border-radius:14px;padding:16px;border:1.5px solid var(--border)">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
              <div style="display:flex;align-items:center;gap:14px">
                <div style="display:flex;gap:6px">
                  ${ADMINS.map(a => {
                    const s = _getApprovalStatus(c,a);
                    const bg = s==='approved'||s==='auto' ? '#10B981' : s==='rejected' ? '#EF4444' : '#E5E7EB';
                    const icon = s==='approved'||s==='auto' ? '✓' : s==='rejected' ? '✕' : '';
                    const u = typeof TEAM_USERS!=='undefined'&&TEAM_USERS[a] ? TEAM_USERS[a].name : a;
                    return `<div style="width:32px;height:32px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff;border:2px solid ${bg==='#E5E7EB'?'#D1D5DB':'transparent'}" title="${u}">${icon}</div>`;
                  }).join('')}
                </div>
                <div>
                  <div>${_renderApprovalBadge(c)}</div>
                  <div style="font-size:11px;color:var(--text3);margin-top:3px">
                    Auto-approve after
                    <input type="number" min="1" max="30" value="${c.approvalDays||3}"
                      style="width:36px;padding:2px 6px;border:1px solid var(--border2);border-radius:6px;font-size:11px;font-family:var(--font);text-align:center;margin:0 3px"
                      onchange="updateCampaignField('${id}','approvalDays',parseInt(this.value));updateApprovalDeadline('${id}')">
                    days · <span id="strat-deadline-${id}">${_getDeadlineText(c)}</span>
                  </div>
                </div>
              </div>
              ${currentUser && ADMINS.includes(currentUser.id) && _getApprovalStatus(c,currentUser.id)==='pending' ? `
              <div style="display:flex;gap:8px">
                <button onclick="setCampaignApproval('${id}','${currentUser.id}','approved')"
                  style="padding:8px 18px;background:#ECFDF5;color:#065F46;border:1.5px solid #6EE7B7;border-radius:20px;font-size:13px;font-weight:700;cursor:pointer;font-family:var(--font)">✅ Approve</button>
                <button onclick="setCampaignApproval('${id}','${currentUser.id}','rejected')"
                  style="padding:8px 18px;background:#FEF2F2;color:#991B1B;border:1.5px solid #FCA5A5;border-radius:20px;font-size:13px;font-weight:700;cursor:pointer;font-family:var(--font)">❌ Reject</button>
              </div>` : `
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                ${ADMINS.map(a=>{
                  const u = typeof TEAM_USERS!=='undefined'&&TEAM_USERS[a] ? TEAM_USERS[a].name : a;
                  const s = _getApprovalStatus(c,a);
                  const show = s==='pending' ? `<div style="display:flex;gap:5px">
                    <button onclick="setCampaignApproval('${id}','${a}','approved')" style="padding:4px 10px;background:#ECFDF5;color:#065F46;border:1px solid #6EE7B7;border-radius:16px;font-size:11px;font-weight:700;cursor:pointer;font-family:var(--font)">✅</button>
                    <button onclick="setCampaignApproval('${id}','${a}','rejected')" style="padding:4px 10px;background:#FEF2F2;color:#991B1B;border:1px solid #FCA5A5;border-radius:16px;font-size:11px;font-weight:700;cursor:pointer;font-family:var(--font)">❌</button>
                  </div>` : `<span style="font-size:11px;color:var(--text3)">${s==='auto'?'auto ✓':s}</span>`;
                  return `<div style="font-size:11px;color:var(--text2);display:flex;align-items:center;gap:5px"><strong>${u}</strong>${show}</div>`;
                }).join('')}
              </div>`}
            </div>
            <!-- Feedback on strategy -->
            <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">
              <div class="cp-field-label">💬 Feedback on strategy</div>
              <textarea class="form-input form-textarea" rows="2" placeholder="Leave feedback for the strategist…"
                oninput="updateCampaignField('${id}','stratFeedback',this.value)">${c.stratFeedback||''}</textarea>
            </div>
          </div>
        </div>

        <!-- ══ DESIGNER ══ -->
        <div style="background:var(--beige);border-radius:18px;padding:20px;border:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
            <div style="width:36px;height:36px;border-radius:50%;background:#DCFCE7;color:#065F46;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800">D</div>
            <div style="flex:1">
              <div style="font-size:14px;font-weight:800;color:var(--text)">Designer</div>
              <div style="font-size:11px;color:var(--text3)">Upload references · add notes · upload designs · sync from Drive</div>
            </div>
          </div>

          <!-- 1. Assign designer -->
          <div style="margin-bottom:14px">
            <div class="cp-field-label">Assign designer</div>
            <select class="form-select" onchange="updateCampaignField('${id}','assignedDesigner',this.value)">
              <option value="">— select designer —</option>
              ${typeof TEAM_USERS!=='undefined' ? Object.values(TEAM_USERS).filter(u=>u.role!=='admin').map(u=>`<option value="${u.name}" ${c.assignedDesigner===u.name?'selected':''}>${u.name}</option>`).join('') : ''}
            </select>
          </div>

          <!-- 2. Reference images for drafts -->
          <div style="margin-bottom:14px">
            <div class="cp-field-label">Reference images for drafts <span style="font-weight:400;opacity:.6;text-transform:none;font-size:10px">(add brief for each)</span></div>
            <div id="cp-design-refs-${id}" style="display:flex;flex-direction:column;gap:10px">
              ${_renderCpImagesWithBrief(c.designRefs||[], id, 'designRefs')}
            </div>
            <label class="cp-upload-btn" style="margin-top:10px">
              <input type="file" accept="image/*" multiple style="display:none" onchange="uploadCpDesignRefs(this,'${id}')">
              ＋ Add reference images
            </label>
          </div>

          <!-- 3. Designer notes -->
          <div style="margin-bottom:14px">
            <div class="cp-field-label">Designer notes</div>
            <textarea class="form-input form-textarea" rows="3"
              placeholder="Design decisions, font choices, colour palette, revisions needed…"
              oninput="updateCampaignField('${id}','designNotes',this.value)">${c.designNotes||''}</textarea>
          </div>

          <!-- 4. Feedback on design -->
          <div style="margin-bottom:14px;background:var(--white);border-radius:14px;padding:14px;border:1.5px solid ${c.designFeedback?'var(--amber)':'var(--border)'}">
            <div class="cp-field-label">💬 Feedback on design</div>
            <textarea class="form-input form-textarea" rows="2" placeholder="Leave feedback for the designer…"
              oninput="updateCampaignField('${id}','designFeedback',this.value)">${c.designFeedback||''}</textarea>
          </div>

          <!-- 5. Design uploads -->
          <div style="margin-bottom:14px">
            <div class="cp-field-label">Design uploads</div>
            <div id="cp-design-images-${id}" class="cp-images-grid">
              ${_renderCpImages(c.designImages||[], id, 'design')}
            </div>
            <label class="cp-upload-btn" style="margin-top:10px">
              <input type="file" accept="image/*,video/*,.pdf" multiple style="display:none" onchange="uploadCpImages(this,'${id}','design')">
              ＋ Add designs
            </label>
          </div>

          <!-- 6. Google Drive sync -->
          <div style="background:var(--white);border-radius:12px;padding:12px 14px;border:1.5px solid var(--border)">
            <div class="cp-field-label">📁 Google Drive (paste individual file link)</div>
            <div style="display:flex;gap:8px">
              <input class="form-input" id="cp-drive-${id}" value="${c.driveFolderUrl||''}"
                placeholder="Open file in Drive → Share → Copy link → paste here"
                style="font-size:12px;flex:1"
                onchange="updateCampaignField('${id}','driveFolderUrl',this.value)">
              <button onclick="syncDriveFolder('${id}')"
                style="padding:8px 14px;background:var(--brand);color:#fff;border:none;border-radius:12px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:var(--font)">🔄 Add</button>
            </div>
            <div style="font-size:11px;color:var(--text3);margin-top:5px">Paste one file link at a time → click Add → appears in Design uploads above</div>
          </div>

        </div>

      </div>

      <!-- Footer -->
      <div style="padding:16px 28px;border-top:1px solid var(--border);background:var(--beige);display:flex;justify-content:space-between;align-items:center;border-radius:0 0 24px 24px">
        <button class="btn btn-ghost btn-sm" onclick="deleteCampaign('${id}');closeCampaignPopup()" style="color:var(--coral);border-color:var(--coral)">🗑 Delete</button>
        <button class="btn btn-primary" onclick="saveCampaignAndClose('${id}')">💾 Save & close</button>
      </div>
    </div>`;

  popup.style.display = 'flex';
}

function closeCampaignPopup() {
  const p = document.getElementById('campaignPopup');
  if (p) p.style.display = 'none';
  saveState(); _renderCampaignsList();
}

function saveCampaignAndClose(id) {
  saveState(); closeCampaignPopup();
  showToast('✅ Campaign saved!','success');
}

function updateCampaignField(id, field, value) {
  const c = _getCampaigns().find(x=>x.id===id);
  if (c) c[field] = value;
  clearTimeout(window._cpSaveTimer);
  window._cpSaveTimer = setTimeout(()=>saveState(), 800);
}

/* ══════════════════════════════════════════════════════════
   STICKY NOTES
══════════════════════════════════════════════════════════ */
function addStickyNote() {
  const key = _getPlannerKey();
  if (!state.monthlyPlans) state.monthlyPlans = {};
  if (!state.monthlyPlans[key]) state.monthlyPlans[key] = {};
  if (!state.monthlyPlans[key].stickyNotes) state.monthlyPlans[key].stickyNotes = [];
  const id = Date.now();
  state.monthlyPlans[key].stickyNotes.push({ id, text:'', color:'#FEF9C3' });
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
  const plan = _ensureMonth(
    typeof channelCalYear!=='undefined'?channelCalYear:plannerYear,
    typeof channelCalMonth!=='undefined'?channelCalMonth:plannerMonth
  );
  const notes = plan.stickyNotes || [];
  if (notes.length) {
    banner.innerHTML = notes.map(n => `
      <div class="cal-sticky-banner-note" style="background:${n.color||'#FEF9C3'};position:relative;padding-right:22px">
        <span class="sticky-pin-icon">📌</span>
        <span>${(n.text||'').trim() || '<em style="opacity:.5">empty note</em>'}</span>
        <button onclick="deleteStickyNoteFromBanner(${n.id})"
          style="position:absolute;top:3px;right:5px;background:none;border:none;cursor:pointer;font-size:12px;color:rgba(0,0,0,.35)">✕</button>
      </div>`).join('');
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }
}

function deleteStickyNoteFromBanner(noteId) {
  const plan = _ensureMonth(
    typeof channelCalYear!=='undefined'?channelCalYear:plannerYear,
    typeof channelCalMonth!=='undefined'?channelCalMonth:plannerMonth
  );
  plan.stickyNotes = (plan.stickyNotes||[]).filter(n=>n.id!==noteId);
  saveState(); _refreshCalStickyBanner();
}
