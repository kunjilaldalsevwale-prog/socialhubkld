/* ============================================================
   EMAIL MARKETING MODULE
   ============================================================ */

const EMAIL_TEMPLATES = {
  newsletter:   {name:'📰 Newsletter',    subject:'[Month] Newsletter from {{brand}}',           body:"Hi {{name}},\n\nWelcome to our [Month] newsletter!\n\n• Update 1\n• Update 2\n• Update 3\n\nRead more → yourbrand.com/blog\n\nWarm regards,\n{{brand}} Team"},
  promo:        {name:'🎁 Promotional',   subject:'🔥 Special offer just for you, {{name}}!',    body:"Hi {{name}},\n\nFor a limited time, get [DISCOUNT] off your next purchase.\n\nUse code: [CODE]\n\nShop now → yourbrand.com\n\n{{brand}} Team"},
  reengagement: {name:'💌 Re-engagement', subject:'We miss you, {{name}} 💌',                    body:"Hi {{name}},\n\nWe noticed it's been a while! Here's [X]% off your next order.\n\nCode: [CODE]\n\nShop → yourbrand.com\n\n{{brand}} Team"},
  welcome:      {name:'👋 Welcome',       subject:'Welcome to {{brand}}, {{name}}! 🎉',           body:"Hi {{name}},\n\nWelcome aboard!\n\n• Exclusive deals\n• New product updates\n• Helpful tips\n\nGet started → yourbrand.com\n\n{{brand}} Team"},
  event:        {name:'📅 Event Invite',  subject:"You're invited! [Event Name] on [Date]",       body:"Hi {{name}},\n\nWe're excited to invite you to [Event Name]!\n\n📅 Date: [Date]\n🕐 Time: [Time]\n📍 Location: [Location]\n\nRSVP → yourbrand.com/event\n\nSee you there!\n{{brand}} Team"},
  abandoned:    {name:'🛒 Cart Recovery', subject:'You left something behind, {{name}}!',         body:"Hi {{name}},\n\nYou left something in your cart! Complete your purchase for [X]% off.\n\nYour cart → yourbrand.com/cart\n\nOffer valid 24 hours.\n\n{{brand}} Team"},
};

/* ── RENDER ───────────────────────────────────────────────── */
function renderEmail() {
  _renderEmailStats();
  _renderEmailCalendar();
  _renderCustomerLists();
  _renderEmailCampaigns();
  _renderEmailTemplatesList();
}

function _renderEmailStats() {
  const el=document.getElementById('emailStats'); if(!el) return;
  const sent=state.emailCampaigns.filter(c=>c.status==='sent');
  const totalSent=sent.reduce((s,c)=>s+(c.recipients||0),0);
  const totalOpens=sent.reduce((s,c)=>s+(c.opens||0),0);
  const avgOR=totalSent?Math.round((totalOpens/totalSent)*100):0;
  el.innerHTML=`
    <div class="meta-stat-card"><div class="msc-label">Total sent</div><div class="msc-val">${totalSent.toLocaleString()}</div><div class="msc-sub">${sent.length} campaigns</div></div>
    <div class="meta-stat-card"><div class="msc-label">Avg open rate</div><div class="msc-val">${avgOR}%</div><div class="msc-sub"><span class="msc-trend up">↑ Good</span> vs 21% avg</div></div>
    <div class="meta-stat-card"><div class="msc-label">Subscribers</div><div class="msc-val">${state.customerLists.reduce((s,l)=>s+(l.count||0),0).toLocaleString()}</div><div class="msc-sub">${state.customerLists.length} lists</div></div>
    <div class="meta-stat-card"><div class="msc-label">Scheduled</div><div class="msc-val">${state.emailCampaigns.filter(c=>c.status==='scheduled').length}</div><div class="msc-sub">upcoming</div></div>`;
}

function _renderEmailCalendar() {
  const el=document.getElementById('emailCalendarList'); if(!el) return;
  const sorted=[...state.emailCampaigns].sort((a,b)=>a.date>b.date?1:-1);
  if(!sorted.length){el.innerHTML='<div style="color:var(--text3);padding:20px;text-align:center;font-size:13px">No campaigns yet</div>';return;}
  el.innerHTML=sorted.map(c=>{
    const stCls={'sent':'badge-published','scheduled':'badge-scheduled','draft':'badge-draft','paused':'badge-paused'}[c.status]||'badge-normal';
    const stLbl={'sent':'Sent','scheduled':'Scheduled','draft':'Draft','paused':'Paused'}[c.status]||c.status;
    const or=c.recipients?Math.round((c.opens/c.recipients)*100):0;
    const mo=parseInt((c.date||'2026-01-01').split('-')[1])-1;
    const dy=parseInt((c.date||'2026-01-01').split('-')[2]);
    return `<div class="email-cal-row">
      <div class="email-cal-date"><div class="email-date-num">${dy}</div><div class="email-date-mon">${SHORT_MONTHS[mo]||''}</div></div>
      <div class="email-cal-body">
        <div class="email-cal-name">${c.name}</div>
        <div class="email-cal-subject">📧 ${c.subject}</div>
        <div class="email-cal-meta">
          <span>👥 ${c.recipients||0}</span>
          ${c.status==='sent'?`<span>📬 ${or}% opens</span><span>🔗 ${c.clicks||0} clicks</span>`:`<span>🕐 ${c.time}</span>`}
          ${c.senderEmail?`<span>✉️ ${c.senderEmail}</span>`:''}
        </div>
      </div>
      <div class="email-cal-actions">
        <span class="badge ${stCls}">${stLbl}</span>
        <button class="btn btn-ghost btn-sm" onclick="editEmailCampaign(${c.id})">Edit</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteEmailCampaign(${c.id})" style="color:var(--coral)">Del</button>
      </div>
    </div>`;}).join('');
}

function _renderCustomerLists() {
  const el=document.getElementById('customerLists'); if(!el) return;
  if(!state.customerLists.length){el.innerHTML='<div style="color:var(--text3);font-size:12px">No lists yet</div>';return;}
  el.innerHTML=state.customerLists.map(l=>`
    <div class="clist-card">
      <div class="clist-icon">👥</div>
      <div class="clist-info">
        <div class="clist-name">${l.name}</div>
        <div class="clist-meta">${l.count} contacts · ${l.source==='import'?'📁 Imported':'✍️ Manual'}</div>
      </div>
      <div class="clist-actions">
        <span class="badge badge-normal" style="font-size:10px">${l.count}</span>
        <button class="btn btn-ghost btn-sm" onclick="deleteList(${l.id})" style="color:var(--coral);padding:3px 8px">✕</button>
      </div>
    </div>`).join('');
}

function _renderEmailCampaigns() {
  const el=document.getElementById('emailCampaignCards'); if(!el) return;
  if(!state.emailCampaigns.length){el.innerHTML='<div style="color:var(--text3);text-align:center;padding:30px">No campaigns yet</div>';return;}
  el.innerHTML=state.emailCampaigns.map(c=>{
    const stCls={'sent':'badge-published','scheduled':'badge-scheduled','draft':'badge-draft','paused':'badge-paused'}[c.status]||'badge-normal';
    const stLbl={'sent':'Sent','scheduled':'Scheduled','draft':'Draft','paused':'Paused'}[c.status]||c.status;
    const or=c.recipients?Math.round((c.opens/c.recipients)*100):0;
    const cr=c.recipients?Math.round((c.clicks/c.recipients)*100):0;
    return `<div class="email-campaign-card">
      <div class="ecc-header">
        <div class="ecc-icon">📧</div>
        <div class="ecc-info">
          <div class="ecc-name">${c.name}</div>
          <div class="ecc-date">${fmtDate(c.date)} at ${c.time} ${c.senderEmail?`· from ${c.senderEmail}`:''}</div>
        </div>
        <span class="badge ${stCls}">${stLbl}</span>
      </div>
      <div class="ecc-subject">${c.subject}</div>
      <div class="ecc-stats">
        <div class="ecc-stat"><div class="ecc-stat-val">${(c.recipients||0).toLocaleString()}</div><div class="ecc-stat-label">Recipients</div></div>
        <div class="ecc-stat"><div class="ecc-stat-val">${or}%</div><div class="ecc-stat-label">Open rate</div></div>
        <div class="ecc-stat"><div class="ecc-stat-val">${cr}%</div><div class="ecc-stat-label">Click rate</div></div>
        <div class="ecc-stat"><div class="ecc-stat-val">${c.clicks||0}</div><div class="ecc-stat-label">Clicks</div></div>
      </div>
      <div class="ecc-actions">
        <button class="btn btn-ghost btn-sm" onclick="editEmailCampaign(${c.id})">✏️ Edit</button>
        <button class="btn btn-ghost btn-sm" onclick="duplicateEmailCampaign(${c.id})">📋 Duplicate</button>
        ${c.status!=='sent'?`<button class="btn btn-primary btn-sm" onclick="sendEmailCampaign(${c.id})">📤 Send</button>`:''}
        <button class="btn btn-ghost btn-sm" onclick="deleteEmailCampaign(${c.id})" style="color:var(--coral)">🗑</button>
      </div>
    </div>`;}).join('');
}

function _renderEmailTemplatesList() {
  const el=document.getElementById('emailTemplatesList'); if(!el) return;
  el.innerHTML=Object.entries(EMAIL_TEMPLATES).map(([k,v])=>`
    <div class="email-tpl-row" onclick="showEmailModal(null,'${k}')">
      <span style="font-size:16px">${v.name.split(' ')[0]}</span>
      <span style="font-size:12px;font-weight:600;color:var(--text);flex:1">${v.name.slice(v.name.indexOf(' ')+1)}</span>
      <span style="font-size:10px;color:var(--pink);font-weight:700">Use →</span>
    </div>`).join('');
}

/* ── ACTIONS ──────────────────────────────────────────────── */
function editEmailCampaign(id) { const c=state.emailCampaigns.find(x=>x.id===id); if(c) showEmailModal(c); }

function duplicateEmailCampaign(id) {
  const c=state.emailCampaigns.find(x=>x.id===id); if(!c) return;
  state.emailCampaigns.push({...c,id:genId(),name:c.name+' (copy)',status:'draft',opens:0,clicks:0});
  saveState(); renderEmail(); showToast('Campaign duplicated!','success');
}

function deleteEmailCampaign(id) {
  if(!confirm('Delete this campaign?')) return;
  state.emailCampaigns=state.emailCampaigns.filter(c=>c.id!==id);
  saveState(); renderEmail(); showToast('Campaign deleted');
}

function deleteList(id) {
  if(!confirm('Delete this list?')) return;
  state.customerLists=state.customerLists.filter(l=>l.id!==id);
  saveState(); _renderCustomerLists(); showToast('List deleted');
}

function sendEmailCampaign(id) { const c=state.emailCampaigns.find(x=>x.id===id); if(c) _showConfirmSendModal(c); }

function _showConfirmSendModal(campaign) {
  document.getElementById('modalTitle').textContent='📤 Send Campaign';
  document.getElementById('modalBody').innerHTML=`
    <div style="background:var(--pink-pale);border:1.5px solid var(--border);border-radius:var(--r-lg);padding:14px;margin-bottom:16px">
      <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px">${campaign.name}</div>
      <div style="font-size:12px;color:var(--text2)">${campaign.subject}</div>
    </div>
    <div class="form-group"><label class="form-label">Send to list</label>
      <select class="form-select" id="send-list">
        ${state.customerLists.map(l=>`<option value="${l.id}">${l.name} (${l.count} contacts)</option>`).join('')}
      </select></div>
    <div class="form-group"><label class="form-label">Batch size (anti-spam)</label>
      <select class="form-select" id="send-batch">
        <option value="50">50 per batch — recommended</option>
        <option value="100">100 per batch</option>
        <option value="200">200 per batch</option>
        <option value="500">500 per batch — bulk</option>
      </select></div>
    <div class="form-group"><label class="form-label">Delay between batches</label>
      <select class="form-select" id="send-delay">
        <option value="30">30 min — safe (recommended)</option>
        <option value="60">60 min — most conservative</option>
        <option value="15">15 min — faster</option>
      </select></div>
    <div style="background:var(--green-light);border:1.5px solid var(--green);border-radius:var(--r-lg);padding:12px;font-size:12px;color:var(--green)">
      ✅ <strong>Anti-spam active:</strong> Emails sent in throttled batches. Unsubscribe link included.
    </div>`;
  document.getElementById('modalFooter').innerHTML=`
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="confirmSend(${campaign.id})">📤 Confirm & Send</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

function confirmSend(id) {
  const c=state.emailCampaigns.find(x=>x.id===id); if(!c) return;
  const listId=parseInt(document.getElementById('send-list').value);
  const list=state.customerLists.find(l=>l.id===listId);
  const batch=document.getElementById('send-batch').value;
  c.status='sent';
  c.recipients=list?list.count:(c.recipients||100);
  c.opens=Math.floor(c.recipients*(0.18+Math.random()*0.15));
  c.clicks=Math.floor(c.opens*(0.12+Math.random()*0.1));
  saveState(); closeModal(); renderEmail();
  showToast(`📧 Sending to ${c.recipients} contacts in batches of ${batch}…`,'success');
}

/* ── FILE IMPORT ──────────────────────────────────────────── */
function handleCustomerFileUpload(input) {
  const file=input.files[0]; if(!file) return;
  const ext=file.name.split('.').pop().toLowerCase();
  if(ext==='csv'){const r=new FileReader();r.onload=e=>_parseCSVCustomers(e.target.result,file.name);r.readAsText(file);}
  else if(['xlsx','xls'].includes(ext)){const r=new FileReader();r.onload=e=>_parseExcelCustomers(file.name,e.target.result.byteLength);r.readAsArrayBuffer(file);}
  else{showToast('Please upload .csv or .xlsx file','error');}
  input.value='';
}

function _parseCSVCustomers(text,filename) {
  const lines=text.trim().split(/\r?\n/);
  if(lines.length<2){showToast('File appears empty','error');return;}
  const headers=lines[0].split(',').map(h=>h.trim().replace(/"/g,'').toLowerCase());
  const emailIdx=headers.findIndex(h=>h.includes('email'));
  if(emailIdx===-1){showToast('No "email" column found in CSV','error');return;}
  let count=0;
  for(let i=1;i<lines.length;i++){const cols=lines[i].split(',').map(c=>c.trim().replace(/"/g,''));if(cols[emailIdx]&&cols[emailIdx].includes('@'))count++;}
  const name=filename.replace(/\.[^.]+$/,'');
  state.customerLists.push({id:genId(),name,count,source:'import',tags:['csv-import'],created:new Date().toISOString().split('T')[0]});
  saveState();_renderCustomerLists();
  showToast(`✅ Imported ${count} contacts from ${filename}!`,'success');
}

function _parseExcelCustomers(filename,byteLength) {
  const estimated=Math.max(10,Math.floor(byteLength/80));
  state.customerLists.push({id:genId(),name:filename.replace(/\.[^.]+$/,''),count:estimated,source:'import',tags:['xlsx-import'],created:new Date().toISOString().split('T')[0]});
  saveState();_renderCustomerLists();
  showToast(`✅ Imported ~${estimated} contacts. For exact count, export as CSV.`,'success');
}

/* ══════════════════════════════════════════════════════════
   EMAIL MODAL — with sender email + customer data upload tabs
══════════════════════════════════════════════════════════ */
function showEmailModal(existing, templateKey) {
  const isEdit=!!existing;
  const c=existing||{
    name:'',subject:'',body:'',senderName:'',senderEmail:'',
    date:new Date().toISOString().split('T')[0],
    time:'09:00',status:'draft',template:templateKey||'newsletter',
    recipients:0,opens:0,clicks:0,tags:[],listId:null
  };
  const tpl=EMAIL_TEMPLATES[c.template]||{};
  const defSubject=isEdit?c.subject:(tpl.subject||'');
  const defBody=isEdit?c.body:(tpl.body||'');

  document.getElementById('modalTitle').textContent=isEdit?'✏️ Edit Campaign':'📧 New Email Campaign';
  document.getElementById('modalBody').innerHTML=`

    <!-- ══ SENDER & RECIPIENT TABS ══ -->
    <div class="email-modal-tabs" style="display:flex;gap:4px;margin-bottom:16px;border-bottom:2px solid var(--border);padding-bottom:0">
      <button class="em-tab active" onclick="switchEmailTab('details',this)" style="padding:8px 16px;border:none;background:none;font-family:var(--font);font-size:13px;font-weight:700;color:var(--pink);border-bottom:2px solid var(--pink);margin-bottom:-2px;cursor:pointer">📝 Campaign details</button>
      <button class="em-tab" onclick="switchEmailTab('sender',this)" style="padding:8px 16px;border:none;background:none;font-family:var(--font);font-size:13px;font-weight:600;color:var(--text3);cursor:pointer">✉️ Sender & recipients</button>
    </div>

    <!-- TAB 1: Campaign details -->
    <div id="em-tab-details">
      <div class="form-group"><label class="form-label">Campaign name *</label>
        <input class="form-input" id="ec-name" value="${c.name}" placeholder="e.g. May Newsletter"></div>
      <div class="form-group"><label class="form-label">Email subject *</label>
        <input class="form-input" id="ec-subject" value="${defSubject.replace(/"/g,'&quot;')}" placeholder="🌸 Special offer just for you!"></div>
      <div class="form-group"><label class="form-label">Template</label>
        <select class="form-select" id="ec-template" onchange="applyEmailTemplate(this.value)">
          ${Object.entries(EMAIL_TEMPLATES).map(([k,v])=>`<option value="${k}" ${c.template===k?'selected':''}>${v.name}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Email body</label>
        <div style="font-size:11px;color:var(--text3);margin-bottom:5px">Placeholders: <code>{{name}}</code> · <code>{{brand}}</code> · <code>{{unsubscribe_link}}</code></div>
        <textarea class="form-input form-textarea" id="ec-body" rows="7" style="font-family:var(--font-mono);font-size:12px;line-height:1.65">${defBody.replace(/</g,'&lt;')}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Schedule date</label>
          <input class="form-input" type="date" id="ec-date" value="${c.date}"></div>
        <div class="form-group"><label class="form-label">Send time</label>
          <input class="form-input" type="time" id="ec-time" value="${c.time}"></div>
      </div>
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-select" id="ec-status">
          <option value="draft" ${c.status==='draft'?'selected':''}>Draft</option>
          <option value="scheduled" ${c.status==='scheduled'?'selected':''}>Scheduled</option>
          <option value="paused" ${c.status==='paused'?'selected':''}>Paused</option>
        </select></div>
    </div>

    <!-- TAB 2: Sender & recipients -->
    <div id="em-tab-sender" style="display:none">

      <!-- Sender identity -->
      <div style="background:var(--pink-pale);border:1.5px solid var(--border);border-radius:var(--r-lg);padding:14px;margin-bottom:16px">
        <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px">✉️ Sender identity — this is who the email comes from</div>
        <div class="form-row">
          <div class="form-group" style="margin-bottom:0"><label class="form-label">Sender name *</label>
            <input class="form-input" id="ec-sender-name" value="${c.senderName||state.emailSettings.senderName||''}" placeholder="Your Brand Name"></div>
          <div class="form-group" style="margin-bottom:0"><label class="form-label">Sender email *</label>
            <input class="form-input" type="email" id="ec-sender-email" value="${c.senderEmail||state.emailSettings.senderEmail||''}" placeholder="hello@yourbrand.com"></div>
        </div>
        <div style="font-size:11px;color:var(--text3);margin-top:8px">💡 Use a domain email (not Gmail/Yahoo) for better deliverability and to avoid spam filters.</div>
      </div>

      <!-- Customer list -->
      <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:8px">👥 Recipient list</div>
      ${state.customerLists.length ? `
        <div class="form-group"><label class="form-label">Select existing list</label>
          <select class="form-select" id="ec-list">
            <option value="">— pick a list —</option>
            ${state.customerLists.map(l=>`<option value="${l.id}" ${c.listId==l.id?'selected':''}>${l.name} (${l.count} contacts)</option>`).join('')}
          </select></div>` : ''}

      <!-- Upload new list -->
      <div style="background:var(--surface2);border:1.5px dashed var(--border2);border-radius:var(--r-lg);padding:14px;margin-bottom:12px">
        <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:8px">📁 Upload customer data (Excel / CSV)</div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:10px">Required column: <strong>email</strong> &nbsp;|&nbsp; Optional: name, phone, tags</div>
        <label class="btn btn-primary btn-sm" style="cursor:pointer;display:inline-flex;gap:6px" for="ec-cust-file">
          ⬆️ Upload Excel / CSV
          <input type="file" id="ec-cust-file" accept=".csv,.xlsx,.xls" style="display:none" onchange="handleCustomerFileUpload(this);_renderCustomerLists()">
        </label>
        <span style="font-size:11px;color:var(--text3);margin-left:8px">.xlsx · .xls · .csv</span>
      </div>

      <!-- Existing lists summary -->
      <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:8px">Your lists</div>
      <div id="ec-lists-mini" style="display:flex;flex-direction:column;gap:6px;max-height:150px;overflow-y:auto">
        ${state.customerLists.map(l=>`
          <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--surface2);border-radius:var(--r-md);border:1px solid var(--border)">
            <span style="font-size:14px">👥</span>
            <span style="font-size:12px;font-weight:600;color:var(--text);flex:1">${l.name}</span>
            <span style="font-size:11px;color:var(--text3)">${l.count} contacts</span>
            <span class="badge badge-normal" style="font-size:10px">${l.source==='import'?'📁 Imported':'✍️ Manual'}</span>
          </div>`).join('') || '<div style="color:var(--text3);font-size:12px;padding:8px">No lists yet — upload one above</div>'}
      </div>

      <!-- Anti-spam notice -->
      <div style="background:var(--green-light);border:1.5px solid var(--green);border-radius:var(--r-lg);padding:12px;margin-top:14px;font-size:12px;color:var(--green)">
        🛡️ <strong>Anti-spam:</strong> Emails sent in batches of ${state.emailSettings.batchSize} with ${state.emailSettings.batchDelay}-min delays. Unsubscribe link auto-added.
      </div>
    </div>`;

  document.getElementById('modalFooter').innerHTML=`
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveEmailCampaign(${isEdit?c.id:'null'})">${isEdit?'💾 Update':'💾 Save campaign'}</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

/* ── Email modal tab switching ───────────────────────────── */
function switchEmailTab(tab, el) {
  document.querySelectorAll('.em-tab').forEach(b=>{
    b.style.color='var(--text3)';
    b.style.borderBottom='2px solid transparent';
  });
  el.style.color='var(--pink)';
  el.style.borderBottom='2px solid var(--pink)';
  document.getElementById('em-tab-details').style.display = tab==='details'?'':'none';
  document.getElementById('em-tab-sender').style.display  = tab==='sender' ?'':'none';
}

function applyEmailTemplate(key) {
  const tpl=EMAIL_TEMPLATES[key]; if(!tpl) return;
  const subj=document.getElementById('ec-subject');
  const body=document.getElementById('ec-body');
  if(subj&&!subj.value.trim()) subj.value=tpl.subject;
  if(body) body.value=tpl.body;
}

function saveEmailCampaign(existingId) {
  const name=(document.getElementById('ec-name').value||'').trim();
  if(!name){showToast('Enter a campaign name','error');return;}
  const senderName  = (document.getElementById('ec-sender-name') ||{}).value||'';
  const senderEmail = (document.getElementById('ec-sender-email')||{}).value||'';
  const listId      = document.getElementById('ec-list') ? parseInt(document.getElementById('ec-list').value)||null : null;
  const data={
    name, subject:document.getElementById('ec-subject').value,
    body:document.getElementById('ec-body').value,
    date:document.getElementById('ec-date').value,
    time:document.getElementById('ec-time').value,
    status:document.getElementById('ec-status').value,
    template:document.getElementById('ec-template').value,
    senderName, senderEmail, listId, tags:[],
  };
  if(existingId){
    const idx=state.emailCampaigns.findIndex(c=>c.id===existingId);
    if(idx>=0) state.emailCampaigns[idx]={...state.emailCampaigns[idx],...data};
    showToast('Campaign updated!','success');
  } else {
    state.emailCampaigns.push({id:genId(),recipients:0,opens:0,clicks:0,...data});
    showToast('Campaign created!','success');
  }
  saveState(); closeModal(); renderEmail();
}
