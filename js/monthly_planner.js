/* ============================================================
   MONTHLY PLANNER — Campaign-based content planning
   Each month has campaigns. Each campaign opens as a full popup.
   Strategist uploads refs → Admin feedback → Designer uploads → Admin feedback
   ============================================================ */

let plannerYear  = new Date().getFullYear();
let plannerMonth = new Date().getMonth();

function renderMonthlyPlanner() {
  _renderPlannerHeader();
  _renderCampaignsList();
}

/* ── Header ─────────────────────────────────────────────── */
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

/* ── State helpers ───────────────────────────────────────── */
function _getPlannerKey() { return `${plannerYear}-${plannerMonth}`; }

function _getCampaigns() {
  if (!state.monthlyPlans) state.monthlyPlans = {};
  if (!state.monthlyPlans[_getPlannerKey()]) state.monthlyPlans[_getPlannerKey()] = { campaigns:[] };
  if (!state.monthlyPlans[_getPlannerKey()].campaigns) state.monthlyPlans[_getPlannerKey()].campaigns = [];
  return state.monthlyPlans[_getPlannerKey()].campaigns;
}

/* ── Campaigns List ─────────────────────────────────────── */
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
          ${c.stratFeedback?`<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;background:var(--amber-light);color:#92400E">💬 Feedback</span>`:''}
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

/* ── Add Campaign ────────────────────────────────────────── */
function addNewCampaign() {
  const campaigns = _getCampaigns();
  const id = 'camp_' + Date.now();
  campaigns.push({
    id, name:'New Campaign', brief:'', startDate:'', endDate:'',
    stratImages:[], stratNotes:'', stratFeedback:'',
    designImages:[], designNotes:'', designFeedback:'',
    created: new Date().toISOString()
  });
  saveState();
  _renderCampaignsList();
  openCampaignPopup(id);
}

function deleteCampaign(id) {
  const key = _getPlannerKey();
  if (!state.monthlyPlans[key]) return;
  state.monthlyPlans[key].campaigns = state.monthlyPlans[key].campaigns.filter(c=>c.id!==id);
  saveState();
  _renderCampaignsList();
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

  popup.innerHTML = `
    <div style="background:var(--white);border-radius:24px;width:100%;max-width:780px;box-shadow:0 32px 80px rgba(0,0,0,.2);overflow:hidden;margin:auto">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,var(--brand),var(--brand-dark));padding:24px 28px;display:flex;align-items:center;gap:16px">
        <div style="flex:1">
          <input id="cp-name" value="${c.name}" placeholder="Campaign name…"
            style="background:rgba(255,255,255,.15);border:none;border-radius:10px;padding:8px 14px;font-size:20px;font-weight:800;color:#fff;font-family:var(--font);width:100%;outline:none"
            oninput="updateCampaignField('${id}','name',this.value)">
          <div style="display:flex;gap:10px;margin-top:10px">
            <input type="date" id="cp-start" value="${c.startDate||''}"
              style="background:rgba(255,255,255,.15);border:none;border-radius:8px;padding:5px 10px;font-size:12px;color:#fff;font-family:var(--font);outline:none;color-scheme:dark"
              oninput="updateCampaignField('${id}','startDate',this.value)">
            <span style="color:rgba(255,255,255,.6);line-height:2">→</span>
            <input type="date" id="cp-end" value="${c.endDate||''}"
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

        <!-- Campaign Brief -->
        <div>
          <div class="cp-section-label">📋 Campaign brief & reasoning</div>
          <textarea class="form-input form-textarea" rows="3" placeholder="Describe the campaign goal, target audience, key message, reasoning…"
            style="min-height:80px" oninput="updateCampaignField('${id}','brief',this.value)">${c.brief||''}</textarea>
        </div>

        <!-- STRATEGIST SECTION -->
        <div style="background:var(--beige);border-radius:18px;padding:20px;border:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
            <div style="width:36px;height:36px;border-radius:50%;background:#DBEAFE;color:#1D4ED8;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800">S</div>
            <div>
              <div style="font-size:14px;font-weight:800;color:var(--text)">Strategist</div>
              <div style="font-size:11px;color:var(--text3)">Upload reference images & add strategy notes</div>
            </div>
          </div>

          <!-- Strat images -->
          <div style="margin-bottom:14px">
            <div class="cp-field-label">Reference images</div>
            <div id="cp-strat-images-${id}" class="cp-images-grid">
              ${_renderCpImages(c.stratImages||[], id, 'strat')}
            </div>
            <label class="cp-upload-btn" style="margin-top:10px">
              <input type="file" accept="image/*" multiple style="display:none" onchange="uploadCpImages(this,'${id}','strat')">
              ＋ Add reference images
            </label>
          </div>

          <!-- Strat notes -->
          <div>
            <div class="cp-field-label">Strategy notes</div>
            <textarea class="form-input form-textarea" rows="3" placeholder="Content angles, hooks, tone of voice, platform notes…"
              oninput="updateCampaignField('${id}','stratNotes',this.value)">${c.stratNotes||''}</textarea>
          </div>

          <!-- Admin feedback on strategy -->
          <div style="margin-top:14px;background:var(--white);border-radius:14px;padding:14px;border:1.5px solid ${c.stratFeedback?'var(--amber)':'var(--border)'}">
            <div style="font-size:11px;font-weight:700;color:var(--amber);margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em">💬 Admin feedback on strategy</div>
            <textarea class="form-input form-textarea" rows="2" placeholder="Leave feedback for the strategist…"
              oninput="updateCampaignField('${id}','stratFeedback',this.value)">${c.stratFeedback||''}</textarea>
          </div>
        </div>

        <!-- DESIGNER SECTION -->
        <div style="background:var(--beige);border-radius:18px;padding:20px;border:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
            <div style="width:36px;height:36px;border-radius:50%;background:#DCFCE7;color:#065F46;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800">D</div>
            <div>
              <div style="font-size:14px;font-weight:800;color:var(--text)">Designer</div>
              <div style="font-size:11px;color:var(--text3)">Upload design files & add notes</div>
            </div>
          </div>

          <!-- Design images -->
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

          <!-- Design notes -->
          <div>
            <div class="cp-field-label">Designer notes</div>
            <textarea class="form-input form-textarea" rows="3" placeholder="Design decisions, font choices, colour palette, revisions needed…"
              oninput="updateCampaignField('${id}','designNotes',this.value)">${c.designNotes||''}</textarea>
          </div>

          <!-- Admin feedback on design -->
          <div style="margin-top:14px;background:var(--white);border-radius:14px;padding:14px;border:1.5px solid ${c.designFeedback?'var(--amber)':'var(--border)'}">
            <div style="font-size:11px;font-weight:700;color:var(--amber);margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em">💬 Admin feedback on design</div>
            <textarea class="form-input form-textarea" rows="2" placeholder="Leave feedback for the designer…"
              oninput="updateCampaignField('${id}','designFeedback',this.value)">${c.designFeedback||''}</textarea>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div style="padding:16px 28px;border-top:1px solid var(--border);background:var(--beige);display:flex;justify-content:space-between;align-items:center;border-radius:0 0 24px 24px">
        <button class="btn btn-ghost btn-sm" onclick="deleteCampaign('${id}');closeCampaignPopup()" style="color:var(--coral);border-color:var(--coral)">🗑 Delete campaign</button>
        <button class="btn btn-primary" onclick="saveCampaignAndClose('${id}')">💾 Save & close</button>
      </div>
    </div>`;

  popup.style.display = 'flex';
}

function closeCampaignPopup() {
  const p = document.getElementById('campaignPopup');
  if (p) p.style.display = 'none';
  saveState();
  _renderCampaignsList();
}

function saveCampaignAndClose(id) {
  saveState();
  closeCampaignPopup();
  showToast('✅ Campaign saved!', 'success');
}

function updateCampaignField(id, field, value) {
  const c = _getCampaigns().find(x=>x.id===id);
  if (c) { c[field] = value; }
  // Debounce save
  clearTimeout(window._cpSaveTimer);
  window._cpSaveTimer = setTimeout(() => saveState(), 800);
}

/* ── Image helpers ───────────────────────────────────────── */
function _renderCpImages(images, campId, section) {
  if (!images.length) return `<div style="color:var(--text3);font-size:12px;padding:8px 0">No images yet</div>`;
  return images.map((img, i) => `
    <div style="position:relative;border-radius:12px;overflow:hidden;aspect-ratio:1;background:var(--surface3)">
      <img src="${img.url}" style="width:100%;height:100%;object-fit:cover;cursor:zoom-in"
        onclick="_openCpLightbox('${img.url}')">
      <button onclick="removeCpImage('${campId}','${section}',${i})"
        style="position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;border:none;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center">✕</button>
    </div>`).join('');
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
      c[key].push({ url: result.url, name: file.name });
      if (typeof autoSaveToMediaLibrary==='function') autoSaveToMediaLibrary(result.url, file.name, 'cloudinary');
    } catch(e) { showToast('Upload failed: '+file.name, 'error'); }
  }

  saveState();
  const grid = document.getElementById(`cp-${section}-images-${campId}`);
  if (grid) grid.innerHTML = _renderCpImages(c[key], campId, section);
  showToast(`✅ ${files.length} image${files.length>1?'s':''} uploaded!`, 'success');
}

function removeCpImage(campId, section, idx) {
  const c = _getCampaigns().find(x=>x.id===campId);
  if (!c) return;
  const key = section==='strat' ? 'stratImages' : 'designImages';
  c[key].splice(idx, 1);
  saveState();
  const grid = document.getElementById(`cp-${section}-images-${campId}`);
  if (grid) grid.innerHTML = _renderCpImages(c[key], campId, section);
}

function _openCpLightbox(url) {
  const lb = document.createElement('div');
  lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:3000;display:flex;align-items:center;justify-content:center;cursor:zoom-out';
  lb.onclick = () => lb.remove();
  lb.innerHTML = `<img src="${url}" style="max-width:90vw;max-height:90vh;object-fit:contain;border-radius:12px">`;
  document.body.appendChild(lb);
}

/* ── Sticky notes (kept for calendar banner) ─────────────── */
function addStickyNote() {
  const key = _getPlannerKey();
  if (!state.monthlyPlans) state.monthlyPlans = {};
  if (!state.monthlyPlans[key]) state.monthlyPlans[key] = {};
  if (!state.monthlyPlans[key].stickyNotes) state.monthlyPlans[key].stickyNotes = [];
  const id = Date.now();
  state.monthlyPlans[key].stickyNotes.push({ id, text:'', color:'#FEF9C3' });
  saveState();
  _refreshCalStickyBanner();
  setTimeout(() => {
    const ta = document.querySelector('.sticky-note:last-child .sticky-textarea');
    if (ta) ta.focus();
  }, 50);
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
  const plan  = _ensureMonth(typeof channelCalYear!=='undefined'?channelCalYear:plannerYear,
                              typeof channelCalMonth!=='undefined'?channelCalMonth:plannerMonth);
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
  const plan = _ensureMonth(typeof channelCalYear!=='undefined'?channelCalYear:plannerYear,
                             typeof channelCalMonth!=='undefined'?channelCalMonth:plannerMonth);
  plan.stickyNotes = (plan.stickyNotes||[]).filter(n=>n.id!==noteId);
  saveState();
  _refreshCalStickyBanner();
}
