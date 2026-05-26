/* ============================================================
   IDEAS BOARD
   - Sticky-note idea cards
   - Drag onto calendar to schedule
   - Sidebar quick-add panel inside calendar view
   ============================================================ */

if (!state.ideas) state.ideas = [
  { id:1, title:'Diwali behind-the-scenes reel', body:'Show packaging process with festive music', category:'video', color:'#DBEAFE', date:null, platform:'social' },
  { id:2, title:'Customer spotlight series', body:'"Tag us in your look" — repost best customer photos weekly', category:'campaign', color:'#EDE9FE', date:null, platform:'social' },
  { id:3, title:'#MondayMotivation posts', body:'Weekly inspirational quote with brand aesthetic', category:'hashtag', color:'#ECFDF5', date:null, platform:'social' },
  { id:4, title:'Summer OOTDs carousel', body:'5-slide carousel of summer outfits using our pieces', category:'caption', color:'#FEE2E2', date:null, platform:'social' },
  { id:5, title:'WhatsApp exclusive early access', body:'Send 24hr early access link to VIP list before any sale', category:'campaign', color:'#EDE9FE', date:null, platform:'whatsapp' },
];

const IDEA_CATEGORIES = {
  idea:     { label:'💡 Idea',     color:'#DBEAFE', text:'#1D4ED8' },
  video:    { label:'🎬 Video',    color:'#FEE2E2', text:'#DC2626' },
  caption:  { label:'✍️ Caption', color:'#EFF6FF', text:'#1E40AF' },
  campaign: { label:'📣 Campaign', color:'#EDE9FE', text:'#5B21B6' },
  hashtag:  { label:'# Hashtag',  color:'#ECFDF5', text:'#065F46' },
  trend:    { label:'🔥 Trend',    color:'#FFFBEB', text:'#92400E' },
};

// The 5 channel categories — matches the calendar tabs exactly
const IDEA_CHANNELS = {
  social:   { label:'📸 Social Media',    key:'social'   },
  email:    { label:'📧 Email Marketing', key:'email'    },
  whatsapp: { label:'💬 WhatsApp',        key:'whatsapp' },
  meta:     { label:'📊 Meta Ads',        key:'meta'     },
  google:   { label:'🔍 Google Ads',      key:'google'   },
};
// Keep IDEA_PLATFORMS as alias for any legacy selects
const IDEA_PLATFORMS = Object.values(IDEA_CHANNELS).map(c => c.key);

/* ══════════════════════════════════════════════════════════
   SCHEDULE IDEA — single source of truth
   Called by: drag-drop, modal confirm, sidebar schedule btn
══════════════════════════════════════════════════════════ */
function scheduleIdea(ideaId, dateStr, platform) {
  const idea = (state.ideas || []).find(i => i.id === ideaId);
  if (!idea) return;
  idea.date = dateStr;
  if (platform) idea.platform = platform;
  saveState();

  // Refresh all relevant UI
  renderSidebarIdeas();
  if (currentView === 'ideas') renderIdeasBoard();

  // Re-render the calendar grid so the idea pill appears
  if (typeof renderChannelGrid === 'function') renderChannelGrid();
  if (typeof renderChannelFestivalSidebar === 'function') renderChannelFestivalSidebar();
  if (typeof renderChannelList === 'function') renderChannelList();

  showToast(`📅 "${idea.title}" → ${fmtDate(dateStr)}`, 'success');
}

/* ══════════════════════════════════════════════════════════
   RENDER — full Ideas Board page
══════════════════════════════════════════════════════════ */
function renderIdeasBoard() {
  _renderIdeaStats();
  _renderIdeaCards();
  _renderScheduledIdeas();
}

function _renderIdeaStats() {
  const el = document.getElementById('ideaStats');
  if (!el) return;
  const total       = (state.ideas || []).length;
  const scheduled   = (state.ideas || []).filter(i => i.date).length;
  const unscheduled = total - scheduled;
  el.innerHTML = `
    <div class="meta-stat-card"><div class="msc-label">Total ideas</div><div class="msc-val">${total}</div><div class="msc-sub">All your ideas</div></div>
    <div class="meta-stat-card"><div class="msc-label">Unscheduled</div><div class="msc-val">${unscheduled}</div><div class="msc-sub">Waiting to be planned</div></div>
    <div class="meta-stat-card"><div class="msc-label">Scheduled</div><div class="msc-val">${scheduled}</div><div class="msc-sub">On the calendar</div></div>
    <div class="meta-stat-card"><div class="msc-label">Categories</div><div class="msc-val">${Object.keys(IDEA_CATEGORIES).length}</div><div class="msc-sub">Types available</div></div>`;
}

function _renderIdeaCards() {
  const el = document.getElementById('ideaBoardGrid');
  if (!el) return;
  const unscheduled = (state.ideas || []).filter(i => !i.date);

  if (!unscheduled.length) {
    el.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text3)">
      <div style="font-size:36px;margin-bottom:10px">💡</div>
      <div style="font-size:15px;font-weight:700;color:var(--text2);margin-bottom:6px">No unscheduled ideas</div>
      <div style="font-size:13px">All ideas scheduled, or click "+ New idea" to add one</div>
    </div>`;
    return;
  }

  el.innerHTML = unscheduled.map(idea => {
    const cat = IDEA_CATEGORIES[idea.category] || IDEA_CATEGORIES.idea;
    const pf  = PLATFORM_COLORS[idea.platform] || {};
    const hasScheme = idea.colorScheme && idea.colorScheme.length > 0;
    const hasRef    = !!idea.refImageUrl;
    return `<div class="idea-card" id="idea-${idea.id}"
      draggable="true"
      ondragstart="ideaDragStart(event,${idea.id})"
      ondragend="ideaDragEnd(event)"
      style="background:${idea.color || cat.color}">
      <div class="idea-card-top">
        <span class="idea-cat-badge" style="background:${cat.text}22;color:${cat.text}">${cat.label}</span>
        <div class="idea-card-actions">
          <button class="idea-btn" onclick="showIdeaModal((state.ideas||[]).find(x=>x.id===${idea.id}))" title="Edit">✏️</button>
          <button class="idea-btn" onclick="deleteIdea(${idea.id})" title="Delete">🗑</button>
        </div>
      </div>
      <div class="idea-title">${idea.title}</div>
      ${idea.body ? `<div class="idea-body">${idea.body}</div>` : ''}

      ${hasRef ? `
      <div style="margin:8px 0;border-radius:var(--r-md);overflow:hidden;max-height:100px;cursor:zoom-in" onclick="event.stopPropagation();_openIdeaRefLightbox('${idea.refImageUrl}')">
        <img src="${idea.refImageUrl}" style="width:100%;object-fit:cover;display:block;max-height:100px"
          onerror="this.parentElement.style.display='none'">
      </div>` : ''}

      ${hasScheme ? `
      <div style="display:flex;gap:4px;margin:6px 0;flex-wrap:wrap">
        ${idea.colorScheme.map(c=>`<div title="${c}" style="width:18px;height:18px;border-radius:4px;background:${c};border:1.5px solid rgba(0,0,0,.1);box-shadow:var(--sh-sm)"></div>`).join('')}
      </div>` : ''}

      <div class="idea-footer">
        <span class="idea-platform" style="font-size:11px;color:var(--text2);font-weight:600">${(IDEA_CHANNELS[idea.platform]||{}).label||idea.platform}</span>
        <button class="idea-schedule-btn" onclick="scheduleIdeaModal(${idea.id})">📅 Schedule</button>
      </div>
      <div class="idea-drag-hint">⠿ drag to calendar date</div>
    </div>`;
  }).join('');
}

function _renderScheduledIdeas() {
  const el = document.getElementById('scheduledIdeasList');
  if (!el) return;
  const scheduled = (state.ideas || []).filter(i => i.date).sort((a,b)=>a.date>b.date?1:-1);
  if (!scheduled.length) {
    el.innerHTML = `<div style="color:var(--text3);font-size:13px;padding:12px 0">No ideas scheduled yet — drag a card onto any calendar date.</div>`;
    return;
  }
  el.innerHTML = scheduled.map(idea => {
    const cat = IDEA_CATEGORIES[idea.category] || IDEA_CATEGORIES.idea;
    const pf  = PLATFORM_COLORS[idea.platform] || {};
    return `<div class="scheduled-idea-row">
      <div class="si-color" style="background:${cat.text}"></div>
      <div class="si-body">
        <div class="si-title">${pf.icon||''} ${idea.title}</div>
        <div class="si-date">📅 ${fmtDate(idea.date)} · ${idea.platform}</div>
      </div>
      <div class="si-actions">
        <span class="idea-cat-badge" style="background:${cat.text}22;color:${cat.text};font-size:10px">${cat.label}</span>
        <button class="btn btn-primary btn-sm" onclick="convertIdeaToPost(${idea.id})">→ Post</button>
        <button class="btn btn-ghost btn-sm" onclick="unscheduleIdea(${idea.id})">Unschedule</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteIdea(${idea.id})" style="color:var(--coral)">Del</button>
      </div>
    </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════════════════
   DRAG & DROP
══════════════════════════════════════════════════════════ */
let _draggingIdeaId = null;

function ideaDragStart(event, ideaId) {
  _draggingIdeaId = ideaId;
  event.dataTransfer.setData('text/plain', String(ideaId));
  event.dataTransfer.effectAllowed = 'move';

  // Dim the dragging card
  const card = document.getElementById('idea-'+ideaId) || document.getElementById('sic-card-'+ideaId);
  if (card) { card.style.opacity = '0.5'; card.style.transform = 'rotate(2deg) scale(0.96)'; }

  // Attach drop listeners to all visible calendar cells
  setTimeout(_enableCalendarDrop, 0);
}

function ideaDragEnd(event) {
  // Restore card appearance
  if (_draggingIdeaId) {
    const card = document.getElementById('idea-'+_draggingIdeaId) || document.getElementById('sic-card-'+_draggingIdeaId);
    if (card) { card.style.opacity = ''; card.style.transform = ''; }
  }
  _disableCalendarDrop();
  _draggingIdeaId = null;
}

function _enableCalendarDrop() {
  document.querySelectorAll('.cal-cell:not(.other-month)').forEach(cell => {
    cell.addEventListener('dragover',  _onDragOver,  false);
    cell.addEventListener('dragleave', _onDragLeave, false);
    cell.addEventListener('drop',      _onDrop,      false);
    cell.classList.add('drop-target');
  });
}

function _disableCalendarDrop() {
  document.querySelectorAll('.cal-cell').forEach(cell => {
    cell.removeEventListener('dragover',  _onDragOver,  false);
    cell.removeEventListener('dragleave', _onDragLeave, false);
    cell.removeEventListener('drop',      _onDrop,      false);
    cell.classList.remove('drop-target', 'drop-hover');
  });
}

function _onDragOver(e)  { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; this.classList.add('drop-hover'); }
function _onDragLeave(e) { this.classList.remove('drop-hover'); }

function _onDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  this.classList.remove('drop-hover');

  const ideaId = parseInt(e.dataTransfer.getData('text/plain'));
  if (!ideaId) return;

  // Read the date from the cell's data attribute (most reliable)
  let dateStr = this.dataset.date;

  // Fallback: build date from the cell number + current calendar year/month
  if (!dateStr) {
    const numEl = this.querySelector('.cell-num');
    if (!numEl) return;
    const day   = parseInt(numEl.textContent.trim());
    const year  = (typeof channelCalYear  !== 'undefined') ? channelCalYear  : (typeof calYear  !== 'undefined' ? calYear  : new Date().getFullYear());
    const month = (typeof channelCalMonth !== 'undefined') ? channelCalMonth : (typeof calMonth !== 'undefined' ? calMonth : new Date().getMonth());
    dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  }

  scheduleIdea(ideaId, dateStr);
}

/* ══════════════════════════════════════════════════════════
   SCHEDULE MODAL
══════════════════════════════════════════════════════════ */
function scheduleIdeaModal(ideaId) {
  const idea = (state.ideas || []).find(i => i.id === ideaId);
  if (!idea) return;
  const cat = IDEA_CATEGORIES[idea.category] || IDEA_CATEGORIES.idea;
  document.getElementById('modalTitle').textContent = '📅 Schedule idea';
  document.getElementById('modalBody').innerHTML = `
    <div style="background:${idea.color||cat.color};border-radius:var(--r-lg);padding:12px 14px;margin-bottom:14px;border-left:4px solid ${cat.text}">
      <div style="font-size:14px;font-weight:700;color:var(--text)">${idea.title}</div>
      ${idea.body ? `<div style="font-size:12px;color:var(--text2);margin-top:3px">${idea.body}</div>` : ''}
    </div>
    <div class="form-group"><label class="form-label">Pick a date *</label>
      <input class="form-input" type="date" id="si-date" value="${idea.date || new Date().toISOString().split('T')[0]}"></div>
    <div class="form-group"><label class="form-label">Channel *</label>
      <select class="form-select" id="si-platform">
        ${Object.entries(IDEA_CHANNELS).map(([k,v])=>`<option value="${k}" ${idea.platform===k?'selected':''}>${v.label}</option>`).join('')}
      </select></div>`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="confirmScheduleIdea(${ideaId})">📅 Add to calendar</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

function confirmScheduleIdea(ideaId) {
  const date     = document.getElementById('si-date').value;
  const platform = document.getElementById('si-platform').value;
  if (!date) { showToast('Pick a date', 'error'); return; }
  closeModal();
  scheduleIdea(ideaId, date, platform);
}

function unscheduleIdea(id) {
  const idea = (state.ideas || []).find(i => i.id === id);
  if (!idea) return;
  idea.date = null;
  saveState();
  renderSidebarIdeas();
  if (currentView === 'ideas') renderIdeasBoard();
  if (typeof renderChannelGrid === 'function') renderChannelGrid();
  showToast('Idea moved back to board');
}

/* Convert idea → real post */
// Map idea channel key → proper post platform name
const _IDEA_CHANNEL_TO_PLATFORM = {
  social:    'Instagram',
  whatsapp:  'WhatsApp',
  email:     'Email',
  meta:      'Meta Ad',
  google:    'Google Ad',
  Instagram: 'Instagram',
  WhatsApp:  'WhatsApp',
};

function convertIdeaToPost(ideaId) {
  const idea = (state.ideas || []).find(i => i.id === ideaId);
  if (!idea || !idea.date) { showToast('Set a date on the idea first', 'error'); return; }

  // Map channel key to proper platform name
  const platform = _IDEA_CHANNEL_TO_PLATFORM[idea.platform] || 'Instagram';

  if (!state.posts) state.posts = [];
  const newPost = {
    id: genId(),
    title:    idea.title,
    caption:  idea.body || '',
    platform, platforms: [platform],
    date:     idea.date,
    time:     idea.time || '09:00',
    status:   'draft',
    type:     'Image post',
    hashtags: '', brief: idea.body || '', assignee: '',
    priority: 'normal', notes: '',
    mediaUrl: idea.refImageUrl || null,  // carry over reference image
    created:  new Date().toISOString().split('T')[0],
  };
  state.posts.push(newPost);

  // Remove from ideas
  state.ideas = (state.ideas || []).filter(i => i.id !== ideaId);
  saveState();
  renderSidebarIdeas();
  if (currentView === 'ideas') renderIdeasBoard();
  if (typeof renderChannelGrid === 'function') renderChannelGrid();
  updateBadge();

  // Switch calendar to the right channel so user sees it
  if (typeof setChannel === 'function') {
    const chMap = { Instagram:'social', WhatsApp:'whatsapp', Email:'email', 'Meta Ad':'meta', 'Google Ad':'google' };
    const ch = chMap[platform] || 'social';
    setChannel(ch, document.querySelector(`.ch-subtab[data-ch="${ch}"]`));
  }

  showToast(`✨ Idea converted to post on ${platform} calendar!`, 'success');
}

/* ══════════════════════════════════════════════════════════
   CRUD
══════════════════════════════════════════════════════════ */
function showIdeaModal(existing) {
  const isEdit = !!existing;
  const idea   = existing || { title:'', body:'', category:'idea', platform:'social', color:'', date:null };

  // Reset ref image
  window._ideaRefImageUrl  = idea.refImageUrl  || null;
  window._ideaRefImageName = idea.refImageName || null;
  window._ideaColorScheme  = idea.colorScheme  || [];

  document.getElementById('modalTitle').textContent = isEdit ? '✏️ Edit idea' : '💡 New idea';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group"><label class="form-label">Title *</label>
      <input class="form-input" id="ni-title" value="${(idea.title||'').replace(/"/g,'&quot;')}" placeholder="e.g. Diwali sale countdown reel" autofocus></div>

    <div class="form-group"><label class="form-label">Notes / details</label>
      <textarea class="form-input form-textarea" id="ni-body" rows="3" placeholder="Concept, tone, visual direction…" style="min-height:70px">${idea.body||''}</textarea></div>

    <div class="form-row">
      <div class="form-group"><label class="form-label">Category</label>
        <select class="form-select" id="ni-cat">
          ${Object.entries(IDEA_CATEGORIES).map(([k,v])=>`<option value="${k}" ${idea.category===k?'selected':''}>${v.label}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Channel</label>
        <select class="form-select" id="ni-platform">
          ${Object.entries(IDEA_CHANNELS).map(([k,v])=>`<option value="${k}" ${idea.platform===k?'selected':''}>${v.label}</option>`).join('')}
        </select></div>
    </div>

    <!-- ── CARD COLOUR ── -->
    <div class="form-group"><label class="form-label">Card colour</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${['#DBEAFE','#EFF6FF','#ECFDF5','#EDE9FE','#FFFBEB','#FEE2E2','#F0FDFA','#FEF3C7','#F5F3FF','#FDF2F8'].map(c=>`
          <div onclick="selectIdeaColor('${c}',this)" class="color-swatch ${(idea.color||'#DBEAFE')===c?'selected':''}"
            style="width:28px;height:28px;border-radius:50%;background:${c};cursor:pointer;border:2.5px solid ${(idea.color||'#DBEAFE')===c?'var(--brand)':'var(--border)'}"></div>`).join('')}
      </div>
    </div>

    <!-- ── COLOUR SCHEME ── -->
    <div class="form-group">
      <label class="form-label">🎨 Colour scheme <span style="font-size:10px;font-weight:400;opacity:.6;text-transform:none">— pick brand/mood colours for this idea</span></label>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap" id="colorSchemeRow">
        ${(idea.colorScheme||[]).map((c,i)=>`
          <div style="position:relative">
            <div style="width:36px;height:36px;border-radius:8px;background:${c};border:2px solid var(--border);cursor:pointer;box-shadow:var(--sh-sm)"
              title="${c}" onclick="removeIdeaSchemeColor(${i})">
              <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s;background:rgba(0,0,0,.3);border-radius:6px;color:#fff;font-size:12px"
                onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0">✕</div>
            </div>
          </div>`).join('')}
        <label style="width:36px;height:36px;border-radius:8px;border:2px dashed var(--border2);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;color:var(--text3);transition:all .15s"
          title="Add colour" onmouseover="this.style.borderColor='var(--brand)'" onmouseout="this.style.borderColor='var(--border2)'">
          <input type="color" style="opacity:0;position:absolute;width:36px;height:36px;cursor:pointer" onchange="addIdeaSchemeColor(this.value)">
          +
        </label>
        ${(idea.colorScheme||[]).length ? `<div style="font-size:11px;color:var(--text3)">Click a colour to remove it</div>` : ''}
      </div>
      <!-- Preset palettes -->
      <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
        ${[
          { name:'Festive',  colors:['#FF6B35','#F7C59F','#EFEFD0','#004E89','#1A936F'] },
          { name:'Minimal',  colors:['#1A1A1A','#F5F5F5','#D4AF37','#2C3E50','#E8E8E8'] },
          { name:'Pastel',   colors:['#FFB3BA','#FFDFBA','#FFFFBA','#BAFFC9','#BAE1FF'] },
          { name:'Bold',     colors:['#E63946','#F4A261','#2A9D8F','#264653','#E9C46A'] },
          { name:'Earth',    colors:['#8B4513','#D2691E','#F4A460','#DEB887','#FFDEAD'] },
          { name:'Diwali',   colors:['#FF9933','#FFCC00','#FF3333','#8B0000','#FFD700'] },
        ].map(p=>`
          <button onclick="applyIdeaPalette(${JSON.stringify(p.colors)})"
            style="display:flex;align-items:center;gap:4px;padding:4px 10px 4px 6px;border-radius:20px;border:1.5px solid var(--border2);background:var(--white);cursor:pointer;font-size:11px;font-weight:600;color:var(--text2);font-family:var(--font);transition:all .13s"
            onmouseover="this.style.borderColor='var(--brand)'" onmouseout="this.style.borderColor='var(--border2)'">
            <div style="display:flex;gap:2px">${p.colors.map(c=>`<div style="width:10px;height:10px;border-radius:2px;background:${c}"></div>`).join('')}</div>
            ${p.name}
          </button>`).join('')}
      </div>
    </div>

    <!-- ── REFERENCE IMAGE ── -->
    <div class="form-group">
      <label class="form-label">🖼 Reference image <span style="font-size:10px;font-weight:400;opacity:.6;text-transform:none">— visual direction for your team</span></label>
      <div style="border:1.5px solid var(--border);border-radius:var(--r-lg);overflow:hidden">
        <div style="display:flex;border-bottom:1px solid var(--border)">
          <button class="ik-img-tab active" onclick="switchIdeaImgTab('upload',this)">📱 Upload</button>
          <button class="ik-img-tab" onclick="switchIdeaImgTab('drive',this)">☁️ Drive link</button>
          <button class="ik-img-tab" onclick="switchIdeaImgTab('url',this)">🔗 Paste URL</button>
        </div>
        <!-- Upload -->
        <div id="idea-img-upload" style="padding:10px">
          <label style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--brand-pale);border:2px dashed var(--brand-mid);border-radius:var(--r-lg);cursor:pointer">
            <input type="file" id="ideaImgFileInput" accept="image/*" style="display:none" onchange="handleIdeaImageFile(this)">
            <span style="font-size:20px">🖼️</span>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:700;color:var(--brand-dark)">Click to upload reference image</div>
              <div style="font-size:11px;color:var(--text3)">Any image format</div>
            </div>
            <div style="background:var(--brand);color:#fff;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;flex-shrink:0">Browse</div>
          </label>
        </div>
        <!-- Drive -->
        <div id="idea-img-drive" style="padding:10px;display:none">
          <input class="form-input" id="ideaDriveUrl" placeholder="Paste Google Drive link"
            oninput="previewIdeaDriveImg(this.value)"
            onpaste="setTimeout(()=>previewIdeaDriveImg(document.getElementById('ideaDriveUrl').value),60)">
        </div>
        <!-- URL -->
        <div id="idea-img-url" style="padding:10px;display:none">
          <input class="form-input" id="ideaDirectUrl" placeholder="Paste any image URL (https://...)"
            onpaste="setTimeout(()=>previewIdeaDirectUrl(document.getElementById('ideaDirectUrl').value),60)"
            oninput="previewIdeaDirectUrl(this.value)">
        </div>
      </div>
      <!-- Preview -->
      <div id="ideaImgPreview" style="margin-top:8px">
        ${window._ideaRefImageUrl ? `
          <div style="position:relative;display:inline-block">
            <img src="${window._ideaRefImageUrl}" style="max-height:140px;max-width:100%;object-fit:contain;border-radius:var(--r-lg);border:1.5px solid var(--border);display:block">
            <button onclick="clearIdeaRefImage()"
              style="position:absolute;top:5px;right:5px;background:rgba(0,0,0,.6);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center">✕</button>
          </div>
          <div style="font-size:11px;color:var(--green);font-weight:600;margin-top:4px">✅ ${window._ideaRefImageName||'Reference image attached'}</div>` : ''}
      </div>
    </div>`;

  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveIdea(${isEdit?idea.id:'null'})">${isEdit?'💾 Update':'💡 Add idea'}</button>`;
  window._ideaColor = idea.color || '#DBEAFE';
  document.getElementById('modalOverlay').classList.add('open');
}

/* ── Colour scheme helpers ── */
function addIdeaSchemeColor(hex) {
  if (!window._ideaColorScheme) window._ideaColorScheme = [];
  if (window._ideaColorScheme.length >= 8) { showToast('Max 8 colours', 'error'); return; }
  window._ideaColorScheme.push(hex);
  _refreshColorSchemeRow();
}

function removeIdeaSchemeColor(idx) {
  if (!window._ideaColorScheme) return;
  window._ideaColorScheme.splice(idx, 1);
  _refreshColorSchemeRow();
}

function applyIdeaPalette(colors) {
  window._ideaColorScheme = [...colors];
  _refreshColorSchemeRow();
  showToast('🎨 Palette applied!', 'success');
}

function _refreshColorSchemeRow() {
  const row = document.getElementById('colorSchemeRow');
  if (!row) return;
  const colors = window._ideaColorScheme || [];
  row.innerHTML = colors.map((c,i)=>`
    <div style="position:relative">
      <div style="width:36px;height:36px;border-radius:8px;background:${c};border:2px solid var(--border);cursor:pointer;box-shadow:var(--sh-sm);position:relative;overflow:hidden"
        title="${c}" onclick="removeIdeaSchemeColor(${i})">
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.3);border-radius:6px;color:#fff;font-size:12px;opacity:0;transition:opacity .15s"
          onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0">✕</div>
      </div>
    </div>`).join('') + `
    <label style="width:36px;height:36px;border-radius:8px;border:2px dashed var(--border2);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;color:var(--text3)">
      <input type="color" style="opacity:0;position:absolute;width:36px;height:36px;cursor:pointer" onchange="addIdeaSchemeColor(this.value)">+
    </label>
    ${colors.length ? `<div style="font-size:11px;color:var(--text3)">Click colour to remove</div>` : ''}`;
}

/* ── Reference image helpers ── */
function switchIdeaImgTab(tab, el) {
  el.parentElement.querySelectorAll('.ik-img-tab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  ['upload','drive','url'].forEach(t => {
    const p = document.getElementById('idea-img-'+t);
    if (p) p.style.display = t===tab ? '' : 'none';
  });
}

function handleIdeaImageFile(input) {
  const file = input.files[0]; if (!file) return;
  const url  = URL.createObjectURL(file);
  window._ideaRefImageUrl  = url;
  window._ideaRefImageName = file.name;
  _showIdeaImgPreview(url, file.name);
  input.value = '';
}

function previewIdeaDriveImg(url) {
  const m = url && url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!m) return;
  const direct = `https://drive.google.com/uc?export=view&id=${m[1]}`;
  const thumb  = `https://drive.google.com/thumbnail?id=${m[1]}&sz=w400`;
  window._ideaRefImageUrl  = direct;
  window._ideaRefImageName = 'Drive image';
  _showIdeaImgPreview(thumb, 'Drive image');
}

function previewIdeaDirectUrl(url) {
  if (!url || !url.startsWith('http')) return;
  window._ideaRefImageUrl  = url;
  window._ideaRefImageName = 'Reference image';
  _showIdeaImgPreview(url, 'Reference image');
}

function _showIdeaImgPreview(src, name) {
  const el = document.getElementById('ideaImgPreview');
  if (!el) return;
  el.innerHTML = `
    <div style="position:relative;display:inline-block">
      <img src="${src}" style="max-height:140px;max-width:100%;object-fit:contain;border-radius:var(--r-lg);border:1.5px solid var(--border);display:block"
        onerror="this.style.display='none'">
      <button onclick="clearIdeaRefImage()"
        style="position:absolute;top:5px;right:5px;background:rgba(0,0,0,.6);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:12px">✕</button>
    </div>
    <div style="font-size:11px;color:var(--green);font-weight:600;margin-top:4px">✅ ${name}</div>`;
}

function clearIdeaRefImage() {
  window._ideaRefImageUrl  = null;
  window._ideaRefImageName = null;
  const el = document.getElementById('ideaImgPreview');
  if (el) el.innerHTML = '';
}

function selectIdeaColor(color, el) {
  window._ideaColor = color;
  document.querySelectorAll('.color-swatch').forEach(s => { s.style.borderColor = 'var(--border)'; s.classList.remove('selected'); });
  el.style.borderColor = 'var(--brand)'; el.classList.add('selected');
}

function saveIdea(existingId) {
  const title = (document.getElementById('ni-title').value || '').trim();
  if (!title) { showToast('Enter a title', 'error'); return; }
  const data = {
    title, body: document.getElementById('ni-body').value,
    category: document.getElementById('ni-cat').value,
    platform: document.getElementById('ni-platform').value,
    color: window._ideaColor || '#DBEAFE',
    colorScheme:  window._ideaColorScheme  || [],
    refImageUrl:  window._ideaRefImageUrl  || null,
    refImageName: window._ideaRefImageName || null,
  };
  if (!state.ideas) state.ideas = [];
  if (existingId) {
    const idx = state.ideas.findIndex(i => i.id === existingId);
    if (idx >= 0) state.ideas[idx] = { ...state.ideas[idx], ...data };
    showToast('Idea updated!', 'success');
  } else {
    state.ideas.push({ id: genId(), date: null, ...data });
    showToast('💡 Idea added!', 'success');
  }
  // Reset globals
  window._ideaColorScheme  = [];
  window._ideaRefImageUrl  = null;
  window._ideaRefImageName = null;
  saveState(); closeModal(); renderIdeasBoard(); renderSidebarIdeas();
}

function _openIdeaRefLightbox(url) {
  const lb = document.createElement('div');
  lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;animation:fadeIn .2s ease';
  lb.onclick = () => lb.remove();
  lb.innerHTML = `<img src="${url}" style="max-width:90vw;max-height:90vh;object-fit:contain;border-radius:var(--r-lg);box-shadow:0 20px 60px rgba(0,0,0,.5)">`;
  document.body.appendChild(lb);
}

function editIdea(id) { const idea = (state.ideas||[]).find(i=>i.id===id); if (idea) showIdeaModal(idea); }

function deleteIdea(id) {
  state.ideas = (state.ideas || []).filter(i => i.id !== id);
  saveState(); renderIdeasBoard(); renderSidebarIdeas();
  if (typeof renderChannelGrid === 'function') renderChannelGrid();
  showToast('Idea deleted');
}

function filterIdeas(cat, el) {
  document.querySelectorAll('.idea-filter-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  const all = state.ideas || [];
  const backup = state.ideas;
  state.ideas = cat === 'all' ? all : all.filter(i => i.category === cat || i.date);
  _renderIdeaCards();
  state.ideas = backup;
}

/* ══════════════════════════════════════════════════════════
   SIDEBAR IDEAS PANEL (inside calendar right sidebar)
══════════════════════════════════════════════════════════ */
function switchCalSidebarTab(tab, el) {
  document.querySelectorAll('.cst-tab').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  document.querySelectorAll('.cal-sidebar-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('csp-' + tab);
  if (panel) panel.classList.add('active');
  if (tab === 'ideas') renderSidebarIdeas();
  if (tab === 'festivals' && typeof renderChannelFestivalSidebar === 'function') renderChannelFestivalSidebar();
}

function renderSidebarIdeas() {
  const el = document.getElementById('sidebarIdeaCards');
  if (!el) return;
  const unscheduled = (state.ideas || []).filter(i => !i.date);

  if (!unscheduled.length) {
    el.innerHTML = `<div style="text-align:center;padding:16px;color:var(--text3)">
      <div style="font-size:22px;margin-bottom:6px">💡</div>
      <div style="font-size:12px;font-weight:600">No ideas yet</div>
      <div style="font-size:11px;margin-top:2px">Use the form above</div>
    </div>`;
    return;
  }

  el.innerHTML = unscheduled.map(idea => {
    const cat = IDEA_CATEGORIES[idea.category] || IDEA_CATEGORIES.idea;
    return `<div class="sidebar-idea-card"
      id="sic-card-${idea.id}"
      draggable="true"
      style="background:${idea.color || cat.color}"
      ondragstart="ideaDragStart(event,${idea.id})"
      ondragend="ideaDragEnd(event)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
        <div class="sic-cat" style="color:${cat.text}">${cat.label}</div>
        <div style="font-size:9px;font-weight:700;color:var(--text3)">${(IDEA_CHANNELS[idea.platform]||{}).label||idea.platform}</div>
      </div>
      <div class="sic-title">${idea.title}</div>
      ${idea.body ? `<div class="sic-body">${idea.body}</div>` : ''}
      <div class="sic-drag">⠿ drag to a calendar date to schedule</div>
      <div class="sic-actions">
        <button class="sic-btn" onclick="scheduleIdeaModal(${idea.id})">📅 Schedule</button>
        <button class="sic-btn danger" onclick="deleteIdea(${idea.id})">🗑</button>
      </div>
    </div>`;
  }).join('');
}

function quickAddSidebarIdea() {
  const title = (document.getElementById('sic-title').value || '').trim();
  if (!title) { showToast('Enter an idea title', 'error'); return; }
  const catColors = { idea:'#DBEAFE', video:'#FEE2E2', caption:'#EFF6FF', campaign:'#EDE9FE', hashtag:'#ECFDF5', trend:'#FFFBEB' };
  const cat  = document.getElementById('sic-cat').value;
  if (!state.ideas) state.ideas = [];
  state.ideas.push({
    id: genId(), title,
    body:     document.getElementById('sic-body').value,
    category: cat,
    platform: document.getElementById('sic-platform').value,
    color:    catColors[cat] || '#DBEAFE',
    date:     null,
  });
  saveState();
  document.getElementById('sic-title').value = '';
  document.getElementById('sic-body').value  = '';
  renderSidebarIdeas();
  if (currentView === 'ideas') renderIdeasBoard();
  showToast('💡 Idea added!', 'success');
}

/* ══════════════════════════════════════════════════════════
   BOARD-LEVEL REFERENCE IMAGES PANEL
══════════════════════════════════════════════════════════ */
const _boardRefBlobs = {};

function toggleIdeaRefPanel() {
  const panel = document.getElementById('ideaBoardRefPanel');
  if (!panel) return;
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : '';
  if (!isOpen) _renderBoardRefImages();
}

function addBoardRefImages(input) {
  const files = Array.from(input.files || []);
  if (!files.length) return;
  if (!state.boardRefImages) state.boardRefImages = [];
  files.forEach(file => {
    const id  = genId();
    const url = URL.createObjectURL(file);
    _boardRefBlobs[id] = url;
    state.boardRefImages.push({ id, name: file.name, note: '', date: new Date().toISOString().split('T')[0] });
  });
  saveState();
  _renderBoardRefImages();
  showToast(`✅ ${files.length} image${files.length>1?'s':''} added!`, 'success');
  input.value = '';
}

function _renderBoardRefImages() {
  const el   = document.getElementById('boardRefGrid');
  const refs = state.boardRefImages || [];
  if (!el) return;

  if (!refs.length) {
    el.innerHTML = `<div style="color:var(--text3);font-size:12px;padding:8px 0;grid-column:1/-1">
      No reference images yet — click "+ Add images" to upload mood board or brand references
    </div>`;
    return;
  }

  el.innerHTML = refs.map(r => {
    const src = _boardRefBlobs[r.id] || r.url || null;
    return `<div class="planner-ref-card" id="brc-${r.id}">
      ${src
        ? `<img src="${src}" style="width:100%;height:120px;object-fit:cover;border-radius:var(--r-lg) var(--r-lg) 0 0;display:block;cursor:zoom-in"
            onclick="_openIdeaRefLightbox('${src}')"
            onerror="this.style.display='none'">`
        : `<div style="height:120px;background:var(--surface3);border-radius:var(--r-lg) var(--r-lg) 0 0;display:flex;align-items:center;justify-content:center;font-size:28px">🖼️</div>`}
      <input class="planner-ref-note" value="${r.note||''}"
        placeholder="Add a note (e.g. warm tones, festive mood)"
        onchange="updateBoardRefNote(${r.id}, this.value)">
      <button class="planner-ref-del" onclick="deleteBoardRefImage(${r.id})">✕</button>
    </div>`;
  }).join('');
}

function updateBoardRefNote(id, note) {
  const ref = (state.boardRefImages||[]).find(r=>r.id==id);
  if (ref) { ref.note = note; saveState(); }
}

function deleteBoardRefImage(id) {
  delete _boardRefBlobs[id];
  state.boardRefImages = (state.boardRefImages||[]).filter(r=>r.id!=id);
  saveState();
  _renderBoardRefImages();
}
