/* ============================================================
   INTERAKT WHATSAPP INTEGRATION
   - API key management
   - Image attachment support
   - Excel/CSV customer data upload
   - Scheduled send time picker
   - TWO-WAY calendar sync:
     * Save to calendar → shows on WhatsApp calendar tab
     * Schedule from Interakt modal → creates WhatsApp post on calendar
   ============================================================ */

if (!state.interaktSettings) {
  state.interaktSettings = {
    apiKey: '', senderNumber: '', connected: false, lastSaved: null,
  };
}

// In-memory store for uploaded customer lists (CSV/Excel parsed data)
window._ikCustomerLists = window._ikCustomerLists || {};
window._ikAttachmentUrl = null;

/* ══════════════════════════════════════════════════════════
   SETTINGS
══════════════════════════════════════════════════════════ */
function saveInteraktKey() {
  const key = (document.getElementById('interaktApiKey').value || '').trim();
  const num = (document.getElementById('interaktNumber').value || '').trim();
  if (!key) { showToast('Paste your API key first', 'error'); return; }
  state.interaktSettings.apiKey       = key;
  state.interaktSettings.senderNumber = num;
  state.interaktSettings.connected    = true;
  state.interaktSettings.lastSaved    = new Date().toISOString();
  saveState();
  renderInteraktSettings();
  _syncInteraktNavBadge();
  showToast('✅ Interakt API key saved!', 'success');
}

function disconnectInterakt() {
  state.interaktSettings.connected = false;
  state.interaktSettings.apiKey    = '';
  saveState(); renderInteraktSettings(); _syncInteraktNavBadge();
  showToast('Interakt disconnected');
}

function toggleApiKeyVisibility() {
  const inp = document.getElementById('interaktApiKey');
  if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
}

/* ══════════════════════════════════════════════════════════
   RENDER SETTINGS PANEL
══════════════════════════════════════════════════════════ */
function renderInteraktSettings() {
  const el = document.getElementById('interaktSettingsPanel');
  if (!el) return;
  const s = state.interaktSettings;
  el.innerHTML = `
    <div class="ik-status-bar ${s.connected ? 'ik-connected' : 'ik-disconnected'}">
      <span style="font-size:16px">${s.connected ? '✅' : '○'}</span>
      <div>
        <div style="font-weight:700;font-size:13px">${s.connected ? 'Connected · API key saved' : 'Not connected'}</div>
        ${s.lastSaved ? `<div style="font-size:11px;opacity:.7">Saved ${new Date(s.lastSaved).toLocaleString()}</div>` : ''}
      </div>
      ${s.connected ? `<button class="btn btn-ghost btn-sm" onclick="disconnectInterakt()" style="margin-left:auto;color:var(--coral)">Disconnect</button>` : ''}
    </div>
    <div class="ik-notice">
      ⚠️ <strong>Running as a local file</strong> — browsers block direct API calls from file:// URLs.
      Your key is saved here. Use <strong>Generate API payload</strong> to get a cURL command you can run in Terminal,
      or open via <strong>VS Code Live Server</strong> (localhost:5500) for live sending.
    </div>
    <div class="form-group" style="margin-top:14px">
      <label class="form-label">Interakt API key *</label>
      <div style="display:flex;gap:8px">
        <input class="form-input" id="interaktApiKey" type="password"
          value="${s.apiKey}" placeholder="Paste your Interakt API key"
          style="flex:1;font-family:var(--font-mono)">
        <button class="btn btn-ghost btn-sm" onclick="toggleApiKeyVisibility()">👁</button>
      </div>
      <div style="font-size:11px;color:var(--text3);margin-top:4px">
        Get from <a href="https://app.interakt.ai" target="_blank" style="color:var(--brand)">app.interakt.ai</a> → Settings → Developers → API Keys
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">WhatsApp business number</label>
      <input class="form-input" id="interaktNumber" value="${s.senderNumber}" placeholder="91XXXXXXXXXX">
    </div>
    <div style="display:flex;gap:10px;margin-bottom:16px">
      <button class="btn btn-primary" onclick="saveInteraktKey()">💾 Save API key</button>
      <button class="btn btn-ghost" onclick="window.open('https://app.interakt.ai','_blank')">Open Interakt ↗</button>
    </div>
    ${s.connected ? `
    <div style="border-top:1.5px solid var(--border);padding-top:16px">
      <div style="font-size:14px;font-weight:800;color:var(--text);margin-bottom:12px">Quick test</div>
      <div class="form-row" style="margin-bottom:8px">
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Test phone</label>
          <input class="form-input" id="ik-test-phone" placeholder="91XXXXXXXXXX">
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Template name</label>
          <input class="form-input" id="ik-test-template" placeholder="hello_world">
        </div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="generateTestPayload()">Generate test payload</button>
      <div id="ikPayloadOutput" style="margin-top:10px"></div>
    </div>` : ''}`;
}

function generateTestPayload() {
  const phone    = (document.getElementById('ik-test-phone').value    || '').trim();
  const template = (document.getElementById('ik-test-template').value || '').trim() || 'hello_world';
  const key      = state.interaktSettings.apiKey;
  if (!phone) { showToast('Enter a test phone number', 'error'); return; }
  const b64  = btoa(key + ':');
  const payload = { countryCode:'+91', phoneNumber:phone.replace(/\D/g,''), callbackData:'socialhub_test',
    type:'Template', template:{ name:template, languageCode:'en', bodyValues:['Test from SocialHub'] } };
  const curl = `curl -X POST https://api.interakt.ai/v1/public/message/ \\\n  -H "Authorization: Basic ${b64}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(payload)}'`;
  const out  = document.getElementById('ikPayloadOutput');
  if (!out) return;
  out.innerHTML = _curlBlock(curl, 'Copy test cURL');
  window._lastCurlPayload = curl;
}

/* ══════════════════════════════════════════════════════════
   WHATSAPP VIEW — Interakt button
══════════════════════════════════════════════════════════ */
function renderWAInteraktBanner() {
  const el = document.getElementById('waInteraktBanner');
  if (!el) return;
  const s = state.interaktSettings;
  if (s && s.connected && s.apiKey) {
    el.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 14px;margin:8px 14px 0;border-radius:var(--r-lg);border:1.5px solid #6EE7B7;background:linear-gradient(90deg,#ECFDF5,#D1FAE5);color:#065F46;cursor:pointer;font-size:12px';
    el.innerHTML = `<span>💬</span><span style="font-weight:700">Interakt connected</span><span style="opacity:.7">· Click Interakt button above to send via API</span><span style="margin-left:auto;opacity:.6;font-size:10px">Manage →</span>`;
  } else {
    el.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 14px;margin:8px 14px 0;border-radius:var(--r-lg);border:1.5px solid var(--border2);background:var(--brand-pale);color:var(--text2);cursor:pointer;font-size:12px';
    el.innerHTML = `<span>🔗</span><span style="font-size:12px">Connect Interakt to send WhatsApp via API</span><span style="margin-left:auto;color:var(--brand);font-weight:700;font-size:11px">Connect →</span>`;
  }
}

/* ══════════════════════════════════════════════════════════
   OPEN INTERAKT SEND MODAL
   - Image attachment
   - CSV/Excel customer data upload
   - Send time picker
   - Auto-creates a WhatsApp post on the calendar
══════════════════════════════════════════════════════════ */
function openInteraktFromWA(prefillPostId) {
  const s = state.interaktSettings;
  if (!s || !s.apiKey) {
    navigate('integrations', document.querySelector('.nav-item[data-view="integrations"]'));
    showToast('Set up your Interakt API key first', '');
    return;
  }

  // Pre-fill from post if called from a calendar post card
  const post = prefillPostId ? (state.posts||[]).find(p=>p.id===prefillPostId) : null;
  window._ikAttachmentUrl = post && post.mediaUrl ? post.mediaUrl : null;

  const today = new Date().toISOString().split('T')[0];

  document.getElementById('modalTitle').textContent = '💬 Send via Interakt';
  document.getElementById('modalBody').innerHTML = `

    <!-- Connection status -->
    <div class="ik-status-bar ik-connected" style="margin-bottom:14px">
      <span>✅</span>
      <div><div style="font-weight:700;font-size:13px">Interakt connected</div>
      <div style="font-size:11px;opacity:.75">API key: ${s.apiKey.slice(0,10)}…</div></div>
    </div>

    <!-- ── MESSAGE BODY ── -->
    <div class="form-group">
      <label class="form-label">Message / template body *</label>
      <textarea class="form-input form-textarea" id="ik-wa-body" rows="4" style="min-height:80px"
        placeholder="Type your message. This maps to {{1}} in your Interakt template.">${post ? (post.caption||post.title||'') : ''}</textarea>
    </div>

    <!-- ── TEMPLATE NAME ── -->
    <div class="form-group">
      <label class="form-label">Interakt template name *</label>
      <input class="form-input" id="ik-wa-template" value="${post && post.interaktTemplate ? post.interaktTemplate : ''}"
        placeholder="e.g. summer_sale_offer">
      <div style="font-size:11px;color:var(--text3);margin-top:4px">
        Pre-approved template from <a href="https://app.interakt.ai" target="_blank" style="color:var(--brand)">app.interakt.ai</a> → Templates
      </div>
    </div>

    <!-- ── IMAGE ATTACHMENT ── -->
    <div class="ik-section-label">📎 Attach image (optional)</div>
    <div style="border:1.5px solid var(--border);border-radius:var(--r-lg);overflow:hidden;margin-bottom:14px">
      <div style="display:flex;border-bottom:1px solid var(--border)">
        <button class="ik-img-tab active" onclick="switchIkImgTab('upload',this)">📱 Upload</button>
        <button class="ik-img-tab" onclick="switchIkImgTab('drive',this)">☁️ Drive link</button>
        <button class="ik-img-tab" onclick="switchIkImgTab('library',this)">🖼 Library</button>
      </div>
      <!-- Upload from device -->
      <div id="ik-img-upload" style="padding:12px">
        <label style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--brand-pale);border:2px dashed var(--brand-mid);border-radius:var(--r-lg);cursor:pointer">
          <input type="file" id="ikImgFile" accept="image/*" style="display:none" onchange="handleIkImageUpload(this)">
          <span style="font-size:20px">🖼️</span>
          <div>
            <div style="font-size:13px;font-weight:700;color:var(--brand-dark)">Click to pick image from device</div>
            <div style="font-size:11px;color:var(--text3)">JPG · PNG · max 5MB recommended for WhatsApp</div>
          </div>
          <div style="margin-left:auto;background:var(--brand);color:#fff;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700">Browse</div>
        </label>
        <div id="ik-img-preview" style="margin-top:8px">${window._ikAttachmentUrl ? `<img src="${window._ikAttachmentUrl}" style="max-height:80px;border-radius:var(--r-md);border:1.5px solid var(--border)"><div style="font-size:11px;color:var(--green);font-weight:600;margin-top:3px">✅ Image from post attached</div>` : ''}</div>
      </div>
      <!-- Drive link -->
      <div id="ik-img-drive" style="padding:12px;display:none">
        <input class="form-input" id="ikImgDriveUrl" placeholder="https://drive.google.com/file/d/…"
          oninput="previewIkDriveImg(this.value)">
        <div id="ik-drive-img-preview" style="margin-top:8px"></div>
      </div>
      <!-- Media library -->
      <div id="ik-img-library" style="padding:12px;display:none">
        <div id="ik-library-grid" class="media-mini-grid"></div>
      </div>
    </div>

    <!-- ── SCHEDULE DATE & TIME ── -->
    <div class="ik-section-label">📅 Schedule on calendar</div>
    <div style="border:1.5px solid var(--brand-mid);border-radius:var(--r-lg);padding:14px;background:var(--brand-pale);margin-bottom:14px">
      <div style="font-size:12px;color:var(--brand-dark);font-weight:600;margin-bottom:10px">
        This will create a WhatsApp post on your calendar at the chosen date & time.
      </div>
      <div class="form-row">
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Send date *</label>
          <input class="form-input" type="date" id="ik-send-date" value="${post ? post.date||today : today}">
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Send time *</label>
          <input class="form-input" type="time" id="ik-send-time" value="${post ? post.time||'09:00' : '09:00'}">
        </div>
      </div>
      <div class="form-group" style="margin-top:10px;margin-bottom:0">
        <label class="form-label">Post title (for calendar)</label>
        <input class="form-input" id="ik-post-title" value="${post ? post.title||'' : ''}"
          placeholder="e.g. Diwali sale WhatsApp blast">
      </div>
    </div>

    <!-- ── CUSTOMER DATA ── -->
    <div class="ik-section-label">👥 Recipients</div>
    <div style="border:1.5px solid var(--border);border-radius:var(--r-lg);overflow:hidden;margin-bottom:14px">
      <div style="display:flex;border-bottom:1px solid var(--border)">
        <button class="ik-img-tab active" onclick="switchIkRecipientsTab('manual',this)">✍️ Manual</button>
        <button class="ik-img-tab" onclick="switchIkRecipientsTab('excel',this)">📊 Excel / CSV</button>
        <button class="ik-img-tab" onclick="switchIkRecipientsTab('list',this)">👥 Saved lists</button>
      </div>
      <!-- Manual -->
      <div id="ik-rec-manual" style="padding:12px">
        <textarea class="form-input" id="ik-wa-phones" rows="4"
          placeholder="One phone number per line (with country code)&#10;919876543210&#10;918765432109"></textarea>
      </div>
      <!-- Excel / CSV upload -->
      <div id="ik-rec-excel" style="padding:12px;display:none">
        <div style="font-size:12px;color:var(--text2);margin-bottom:8px;line-height:1.6">
          Upload an Excel (.xlsx) or CSV file.<br>
          Required column: <strong>phone</strong> or <strong>mobile</strong> or <strong>number</strong>
        </div>
        <label style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--surface2);border:2px dashed var(--border2);border-radius:var(--r-lg);cursor:pointer">
          <input type="file" id="ikCustomerFile" accept=".csv,.xlsx,.xls" style="display:none"
            onchange="handleIkCustomerFile(this)">
          <span style="font-size:20px">📊</span>
          <div>
            <div style="font-size:13px;font-weight:700;color:var(--text2)">Upload customer Excel / CSV</div>
            <div style="font-size:11px;color:var(--text3)">.xlsx · .xls · .csv</div>
          </div>
          <div style="margin-left:auto;background:var(--brand);color:#fff;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700">Upload</div>
        </label>
        <div id="ik-excel-status" style="margin-top:8px"></div>
      </div>
      <!-- Saved customer lists -->
      <div id="ik-rec-list" style="padding:12px;display:none">
        ${(state.customerLists||[]).length
          ? `<div style="font-size:12px;color:var(--text2);margin-bottom:8px">Select a list to use their phone numbers:</div>
             ${(state.customerLists||[]).map(l=>`
               <div class="clist-card" onclick="selectIkList(${l.id},this)" style="cursor:pointer">
                 <div class="clist-icon">👥</div>
                 <div class="clist-info"><div class="clist-name">${l.name}</div><div class="clist-meta">${l.count} contacts</div></div>
                 <div style="margin-left:auto"><input type="checkbox" class="ik-list-check" data-list="${l.id}"></div>
               </div>`).join('')}`
          : '<div style="color:var(--text3);font-size:12px;padding:8px">No saved lists. Upload a CSV in Email Marketing first.</div>'}
        <div id="ik-list-status" style="margin-top:6px;font-size:12px;color:var(--brand);font-weight:600"></div>
      </div>
    </div>

    <div id="ik-wa-output"></div>`;

  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Close</button>
    <button class="btn btn-ghost" onclick="window.open('https://app.interakt.ai','_blank')">Open Interakt ↗</button>
    <button class="btn btn-primary" style="background:linear-gradient(135deg,#25D366,#128C7E)"
      onclick="saveToCalendarAndGeneratePayload()">
      📅 Save to calendar + Generate payload
    </button>`;
  document.getElementById('modalOverlay').classList.add('open');

  // Populate library grid
  _populateIkLibrary();
}

/* ── Tab switchers ───────────────────────────────────────── */
function switchIkImgTab(tab, el) {
  document.querySelectorAll('.ik-img-tab').forEach(b => {
    if (b.closest('#ik-img-upload,#ik-img-drive,#ik-img-library') === null) b.classList.remove('active');
  });
  // Find all tabs in first row
  const tabs = el.parentElement.querySelectorAll('.ik-img-tab');
  tabs.forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  ['upload','drive','library'].forEach(t => {
    const p = document.getElementById('ik-img-'+t);
    if (p) p.style.display = t === tab ? '' : 'none';
  });
  if (tab === 'library') _populateIkLibrary();
}

function switchIkRecipientsTab(tab, el) {
  const tabs = el.parentElement.querySelectorAll('.ik-img-tab');
  tabs.forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  ['manual','excel','list'].forEach(t => {
    const p = document.getElementById('ik-rec-'+t);
    if (p) p.style.display = t === tab ? '' : 'none';
  });
}

/* ── Image handlers ──────────────────────────────────────── */
function handleIkImageUpload(input) {
  const file = input.files[0]; if (!file) return;
  // Use createObjectURL — no base64, no memory crash
  const objUrl = URL.createObjectURL(file);
  window._ikAttachmentUrl = objUrl;
  const p = document.getElementById('ik-img-preview');
  if (p) p.innerHTML = `<img src="${objUrl}" style="max-height:80px;border-radius:var(--r-md);border:1.5px solid var(--border)">
    <div style="font-size:11px;color:var(--green);font-weight:600;margin-top:3px">✅ ${file.name} ready</div>`;
  input.value = '';
}

function previewIkDriveImg(url) {
  if (!url || !url.includes('drive.google.com')) return;
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!m) return;
  const direct = `https://drive.google.com/uc?export=view&id=${m[1]}`;
  window._ikAttachmentUrl = direct;
  const p = document.getElementById('ik-drive-img-preview');
  if (p) p.innerHTML = `<img src="${direct}" style="max-height:80px;border-radius:var(--r-md);border:1.5px solid var(--border)"
    onerror="this.style.display='none'">`;
}

function _populateIkLibrary() {
  const el = document.getElementById('ik-library-grid'); if (!el) return;
  const lib = (state.mediaLibrary||[]).filter(m => window._mediaBlobs && window._mediaBlobs[m.id] || (m.source==='drive'&&m.url));
  if (!lib.length) { el.innerHTML='<div style="color:var(--text3);font-size:12px;grid-column:1/-1">No images in library</div>'; return; }
  el.innerHTML = lib.map(m=>{
    const src = (window._mediaBlobs&&window._mediaBlobs[m.id]) || m.url;
    return `<div class="media-mini-card" onclick="selectIkLibImg('${src}',this)" title="${m.name}">
      <img src="${src}" style="width:100%;height:60px;object-fit:cover;display:block">
    </div>`;
  }).join('');
}

function selectIkLibImg(url, el) {
  window._ikAttachmentUrl = url;
  document.querySelectorAll('#ik-library-grid .media-mini-card').forEach(c=>c.classList.remove('selected'));
  el.classList.add('selected');
  showToast('✅ Image selected', 'success');
}

/* ── Customer file upload ────────────────────────────────── */
function handleIkCustomerFile(input) {
  const file = input.files[0]; if (!file) return;
  const ext  = file.name.split('.').pop().toLowerCase();
  if (ext === 'csv') {
    const r = new FileReader();
    r.onload = e => _parseIkCSV(e.target.result);
    r.readAsText(file);
  } else {
    // Excel: estimate from file size, prompt user to export as CSV for exact parsing
    const est = Math.max(10, Math.floor(file.size / 80));
    _showIkExcelStatus(null, file.name, est, true);
  }
  input.value = '';
}

function _parseIkCSV(text) {
  const lines   = text.trim().split(/\r?\n/);
  if (lines.length < 2) { showToast('CSV appears empty', 'error'); return; }
  const headers = lines[0].split(',').map(h=>h.trim().replace(/"/g,'').toLowerCase());
  const phoneIdx= headers.findIndex(h=>['phone','mobile','number','contact','tel','whatsapp'].some(k=>h.includes(k)));
  if (phoneIdx === -1) { showToast('No phone/mobile column found', 'error'); return; }
  const phones = [];
  for (let i=1;i<lines.length;i++) {
    const cols = lines[i].split(',').map(c=>c.trim().replace(/"/g,''));
    const ph   = cols[phoneIdx]?.replace(/\D/g,'');
    if (ph && ph.length >= 10) phones.push(ph);
  }
  _showIkExcelStatus(phones, `CSV (${lines.length-1} rows)`, phones.length, false);
}

function _showIkExcelStatus(phones, filename, count, isEstimate) {
  const el = document.getElementById('ik-excel-status'); if (!el) return;
  // Store parsed phones for payload generation
  window._ikParsedPhones = phones;
  el.innerHTML = `
    <div style="background:var(--green-light);border:1.5px solid var(--green);border-radius:var(--r-lg);padding:10px 12px;font-size:12px;color:var(--green)">
      ✅ ${isEstimate ? `~${count} contacts estimated from` : `${count} phone numbers parsed from`} <strong>${filename}</strong>
      ${isEstimate ? '<br><span style="opacity:.7">For exact parsing, export your Excel as CSV (File → Save as → CSV)</span>' : ''}
    </div>`;
  if (phones && phones.length) {
    // Auto-fill manual textarea too
    const ta = document.getElementById('ik-wa-phones');
    if (ta) ta.value = phones.join('\n');
  }
  showToast(`✅ ${count} contacts loaded!`, 'success');
}

function selectIkList(listId, el) {
  const check = el.querySelector('.ik-list-check');
  if (check) check.checked = !check.checked;
  const list  = (state.customerLists||[]).find(l=>l.id===listId);
  const lbl   = document.getElementById('ik-list-status');
  const selected = document.querySelectorAll('.ik-list-check:checked');
  if (lbl) lbl.textContent = selected.length ? `${selected.length} list(s) selected — will use stored contacts` : '';
}

/* ══════════════════════════════════════════════════════════
   SAVE TO CALENDAR + GENERATE PAYLOAD (two-way sync)
══════════════════════════════════════════════════════════ */
function saveToCalendarAndGeneratePayload() {
  const body     = (document.getElementById('ik-wa-body').value      ||'').trim();
  const template = (document.getElementById('ik-wa-template').value  ||'').trim();
  const date     = document.getElementById('ik-send-date').value;
  const time     = document.getElementById('ik-send-time').value  || '09:00';
  const title    = (document.getElementById('ik-post-title').value   ||'').trim() || (body.slice(0,40)+'…');
  const key      = state.interaktSettings.apiKey;

  if (!body)     { showToast('Enter a message body', 'error'); return; }
  if (!template) { showToast('Enter a template name', 'error'); return; }
  if (!date)     { showToast('Pick a send date', 'error'); return; }

  // ── COLLECT PHONE NUMBERS ──
  let phones = [];
  // Manual textarea
  const manualTA = document.getElementById('ik-wa-phones');
  if (manualTA && manualTA.value.trim()) {
    phones = manualTA.value.split(/[\n,]+/).map(p=>p.trim().replace(/\D/g,'')).filter(p=>p.length>=10);
  }
  // From parsed CSV
  if (!phones.length && window._ikParsedPhones && window._ikParsedPhones.length) {
    phones = window._ikParsedPhones;
  }
  // From selected lists (use count as placeholder)
  if (!phones.length) {
    const checked = document.querySelectorAll('.ik-list-check:checked');
    if (checked.length) {
      checked.forEach(c => {
        const l = (state.customerLists||[]).find(x=>x.id===parseInt(c.dataset.list));
        if (l) for (let i=0;i<l.count;i++) phones.push('91XXXXXXXXXX_'+i); // placeholders
      });
    }
  }
  if (!phones.length) { showToast('Add at least one phone number or upload customer data', 'error'); return; }

  // ── SAVE TO CALENDAR (two-way sync) ──
  const postId = genId();
  const newPost = {
    id: postId, title, caption: body,
    platform: 'WhatsApp', platforms: ['WhatsApp'],
    date, time, status: 'scheduled', type: 'Text only',
    hashtags:'', brief:'', assignee:'', priority:'normal', notes:'',
    mediaUrl: window._ikAttachmentUrl || null,
    interaktTemplate: template,
    interaktPhones: phones.filter(p=>!p.includes('_')), // real numbers only
    created: new Date().toISOString().split('T')[0],
  };
  if (!state.posts) state.posts = [];
  state.posts.push(newPost);
  saveState();
  updateBadge && updateBadge();
  // Refresh calendar if visible
  if (typeof renderChannelGrid === 'function') renderChannelGrid();
  showToast(`📅 WhatsApp post saved to calendar on ${fmtDate(date)}!`, 'success');

  // ── GENERATE API PAYLOAD ──
  const b64      = btoa(key + ':');
  const realNums = phones.filter(p=>!p.includes('_'));
  const curlCmds = realNums.map(phone => {
    const payload = {
      countryCode: '+91', phoneNumber: phone,
      callbackData: `socialhub_${postId}`,
      type: 'Template',
      template: {
        name: template, languageCode:'en', bodyValues:[body],
        ...(window._ikAttachmentUrl ? { headerValues:[{type:'image', imageLink: window._ikAttachmentUrl}] } : {})
      }
    };
    return `curl -X POST https://api.interakt.ai/v1/public/message/ \\\n  -H "Authorization: Basic ${b64}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(payload)}'`;
  }).join('\n\n');

  const out = document.getElementById('ik-wa-output');
  if (out) {
    out.innerHTML = `
      <div style="background:var(--green-light);border:1.5px solid var(--green);border-radius:var(--r-lg);padding:12px;margin-bottom:10px;font-size:13px;color:var(--green)">
        ✅ WhatsApp post added to calendar on <strong>${fmtDate(date)} at ${time}</strong><br>
        <span style="font-size:11px;opacity:.8">Visible on Calendar → WhatsApp tab</span>
      </div>
      ${realNums.length ? _curlBlock(curlCmds, `Copy ${realNums.length} API call${realNums.length>1?'s':''}`) : `
      <div style="background:var(--amber-light);border:1.5px solid var(--amber);border-radius:var(--r-lg);padding:10px;font-size:12px;color:var(--amber)">
        ⚠️ No individual phone numbers to generate cURL for (list contacts). Use Interakt dashboard to send to your list.
      </div>`}`;
  }
}

/* ══════════════════════════════════════════════════════════
   BROADCAST FROM CALENDAR POST CARD
══════════════════════════════════════════════════════════ */
function broadcastViaInterakt(postId) {
  const post = (state.posts||[]).find(p=>p.id===postId);
  if (!post) return;
  if (!state.interaktSettings.apiKey) {
    navigate('integrations', document.querySelector('.nav-item[data-view="integrations"]'));
    showToast('Set up Interakt API key first', '');
    return;
  }
  // Pre-fill and open the main send modal
  openInteraktFromWA(postId);
}

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function _curlBlock(curl, btnLabel) {
  return `<div style="background:#0F172A;border-radius:var(--r-lg);padding:14px;position:relative;margin-top:8px">
    <div style="font-size:10px;font-weight:700;color:#64748B;margin-bottom:8px;text-transform:uppercase;letter-spacing:.06em">${btnLabel}</div>
    <pre id="ikCurlOut" style="font-family:var(--font-mono);font-size:10.5px;color:#E2E8F0;line-height:1.6;overflow-x:auto;white-space:pre-wrap;margin:0;max-height:180px">${curl}</pre>
    <button onclick="navigator.clipboard.writeText(document.getElementById('ikCurlOut').textContent).then(()=>showToast('📋 Copied!','success'))"
      style="position:absolute;top:10px;right:10px;background:#1E40AF;color:#fff;border:none;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer">
      📋 Copy
    </button>
  </div>
  <div style="margin-top:6px;font-size:11px;color:var(--text3)">
    Run in Terminal / PowerShell · or use <a href="https://www.postman.com" target="_blank" style="color:var(--brand)">Postman</a> ·
    <a href="https://app.interakt.ai" target="_blank" style="color:var(--brand)">Interakt dashboard ↗</a>
  </div>`;
}

function copyPayload() {
  const el = document.getElementById('ikCurlOut') || document.getElementById('ikPayloadOutput');
  if (el) navigator.clipboard.writeText(el.textContent).then(()=>showToast('📋 Copied!','success'));
}

function _updateInteraktStatus(connected) {
  ['interaktStatusBadge','interaktNavBadge'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.innerHTML=connected ? '<span class="badge badge-published">● Connected</span>' : '<span class="badge badge-draft">○ Not connected</span>';
  });
}

function _syncInteraktNavBadge() {
  const badge=document.getElementById('interaktNavBadge');
  if(!badge||!state.interaktSettings) return;
  badge.innerHTML=state.interaktSettings.connected
    ? '<span class="badge badge-published">● Connected</span>'
    : '<span class="badge badge-draft">○ Not connected</span>';
}
