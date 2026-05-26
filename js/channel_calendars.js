/* ============================================================
   CHANNEL CALENDARS
   Social Media · Email · WhatsApp · Meta Ads · Google Ads
   ============================================================ */

let channelCalYear  = 2026;
let channelCalMonth = 4;
let activeChannel   = 'social';

const CHANNEL_CONFIG = {
  social:  { label:'Social Media',    emoji:'📸', color:'#FF3D8A', bg:'#FFE8F2', platforms:['Instagram','Facebook','Twitter/X','LinkedIn'] },
  email:   { label:'Email Marketing', emoji:'📧', color:'#3B82F6', bg:'#EFF6FF', platforms:['Email'] },
  whatsapp:{ label:'WhatsApp',        emoji:'💬', color:'#10B981', bg:'#ECFDF5', platforms:['WhatsApp'] },
  meta:    { label:'Meta Ads',        emoji:'📊', color:'#7C3AED', bg:'#EDE9FE', platforms:['Meta Ad','Facebook'] },
  google:  { label:'Google Ads',      emoji:'🔍', color:'#EA4335', bg:'#FEE8E7', platforms:['Google Ads'] },
};

const STATUS_COLORS = {
  scheduled:'#3B82F6', draft:'#F59E0B', published:'#10B981',
  sent:'#10B981', active:'#10B981', review:'#7C3AED', paused:'#F59E0B'
};

/* ══════════════════════════════════════════════════════════
   RENDER
══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   DAY VIEW MODAL — click date to see all posts for that day
══════════════════════════════════════════════════════════ */
function openDayView(dateStr) {
  const items = _getChannelItems(dateStr);
  const occasions = typeof getOccasions === 'function' ? getOccasions(dateStr) : [];
  const cfg = CHANNEL_CONFIG[activeChannel] || CHANNEL_CONFIG.social;
  const d = new Date(dateStr + 'T00:00:00');
  const dayLabel = d.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  document.getElementById('modalTitle').textContent = '📅 ' + dayLabel;
  document.getElementById('modalBody').innerHTML = `

    ${occasions.length ? `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
      ${occasions.map(o=>`<span style="padding:4px 12px;border-radius:20px;background:${o.color}18;color:${o.color};font-size:12px;font-weight:700;border:1.5px solid ${o.color}40">${o.emoji} ${o.name}</span>`).join('')}
    </div>` : ''}

    ${!items.length ? `
    <div style="text-align:center;padding:30px;color:var(--text3)">
      <div style="font-size:36px;margin-bottom:10px">📭</div>
      <div style="font-size:14px;font-weight:700">No posts scheduled</div>
      <div style="font-size:12px;margin-top:6px">Click + on the calendar to add one</div>
    </div>` : `
    <div style="display:flex;flex-direction:column;gap:10px">
      ${items.map(item => {
        const st = STATUS_MAP[item.status] || {};
        const hasImg = item.mediaUrl;
        return `<div style="background:var(--white);border:1.5px solid var(--border);border-radius:var(--r-xl);overflow:hidden;box-shadow:var(--sh-sm);cursor:pointer"
          onclick="closeModal();setTimeout(()=>openChannelItemDrawer('${dateStr}',${JSON.stringify(item).replace(/'/g,"\'")}),100)">
          ${hasImg ? `<img src="${item.mediaUrl}" style="width:100%;max-height:140px;object-fit:cover;display:block">` : ''}
          <div style="padding:12px 14px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              <span style="font-size:15px">${cfg.emoji}</span>
              <div style="font-size:14px;font-weight:800;color:var(--text);flex:1">${item.title}</div>
              <span class="badge ${st.cls||''}" style="flex-shrink:0">${st.label||item.status||''}</span>
            </div>
            ${item.caption ? `<div style="font-size:12px;color:var(--text2);line-height:1.5;margin-bottom:6px">${item.caption.slice(0,100)}${item.caption.length>100?'…':''}</div>` : ''}
            <div style="display:flex;align-items:center;gap:10px">
              ${item.time ? `<span style="font-size:11px;color:var(--text3)">🕐 ${item.time}</span>` : ''}
              ${item.assignee ? `<span style="font-size:11px;color:var(--text3)">👤 ${item.assignee}</span>` : ''}
              ${hasImg ? `<a href="${item.mediaUrl}" download="${item.title||'image'}" target="_blank" onclick="event.stopPropagation()"
                style="margin-left:auto;font-size:11px;font-weight:700;color:var(--brand);text-decoration:none;padding:3px 10px;background:var(--brand-pale);border-radius:12px">⬇ Download</a>` : ''}
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`}`;

  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Close</button>
    <button class="btn btn-primary" onclick="closeModal();openChannelAddModal('${dateStr}')">+ Add post on this day</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

function renderChannelCalendars() {
  document.querySelectorAll('.ch-tab,.ch-subtab').forEach(b => b.classList.remove('active'));
  const tab = document.querySelector(`.ch-tab[data-ch="${activeChannel}"], .ch-subtab[data-ch="${activeChannel}"]`);
  if (tab) tab.classList.add('active');
  _updateChannelHeader();
  renderChannelGrid();
  renderChannelFestivalSidebar();
  renderChannelList();
}

function setChannel(ch, el) {
  activeChannel = ch;
  // Update both tab styles (old ch-tab and new ch-subtab)
  document.querySelectorAll('.ch-tab,.ch-subtab').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  // Also sync nav sub-items
  document.querySelectorAll('.nav-sub-item').forEach(i => {
    i.classList.toggle('active', i.dataset.ch === ch);
  });
  _updateChannelHeader();
  renderChannelGrid();
  renderChannelFestivalSidebar();
  renderChannelList();
}

function _updateChannelHeader() {
  const header = document.getElementById('channelCalHeader');
  const cfg    = CHANNEL_CONFIG[activeChannel];
  if (header) header.style.borderTop = `3px solid ${cfg.color}`;
  const addBtn = document.getElementById('channelAddBtn');
  if (addBtn) {
    const labels = {
      social:'+ Social post', email:'+ Email campaign',
      whatsapp:'+ Broadcast', meta:'+ Meta Ad', google:'+ Google Ad'
    };
    addBtn.textContent = labels[activeChannel] || '+ Add';
    addBtn.style.background = cfg.color;
    addBtn.style.borderColor = cfg.color;
  }
}

/* ══════════════════════════════════════════════════════════
   CALENDAR GRID
══════════════════════════════════════════════════════════ */
function renderChannelGrid() {
  const grid  = document.getElementById('channelCalGrid');
  const label = document.getElementById('channelCalLabel');
  if (!grid) return;
  label.textContent = MONTH_NAMES[channelCalMonth] + ' ' + channelCalYear;

  // Keep bottom nav prev/next labels in sync
  const prevMo = channelCalMonth === 0 ? 11 : channelCalMonth - 1;
  const nextMo = channelCalMonth === 11 ? 0  : channelCalMonth + 1;
  const prevLbl = document.getElementById('calPrevMonthLabel');
  const nextLbl = document.getElementById('calNextMonthLabel');
  if (prevLbl) prevLbl.textContent = MONTH_NAMES[prevMo].slice(0,3);
  if (nextLbl) nextLbl.textContent = MONTH_NAMES[nextMo].slice(0,3);
  grid.innerHTML = '';

  // Show sticky notes banner for this month if any exist
  const _stickyBanner = document.getElementById('calStickyBanner');
  if (_stickyBanner && typeof getStickyNotesForMonth === 'function') {
    const _notes = getStickyNotesForMonth(channelCalYear, channelCalMonth);
    if (_notes.length) {
      _stickyBanner.innerHTML = _notes.map(n =>
        `<div class="cal-sticky-banner-note" style="background:${n.color||'#FEF9C3'}">
          <span style="font-size:12px">📌</span>
          <span>${n.text.trim() || '(empty note)'}</span>
        </div>`
      ).join('');
      _stickyBanner.style.display = 'flex';
    } else {
      _stickyBanner.style.display = 'none';
    }
  }

  const cfg        = CHANNEL_CONFIG[activeChannel];
  const firstDay   = new Date(channelCalYear, channelCalMonth, 1).getDay();
  const daysInMo   = new Date(channelCalYear, channelCalMonth + 1, 0).getDate();
  const daysInPrev = new Date(channelCalYear, channelCalMonth, 0).getDate();
  const today      = new Date();

  for (let i = 0; i < 42; i++) {
    let day, other = false;
    if (i < firstDay)                { day = daysInPrev - firstDay + i + 1; other = true; }
    else if (i >= firstDay+daysInMo) { day = i - firstDay - daysInMo + 1;  other = true; }
    else                             { day = i - firstDay + 1; }

    const cell = document.createElement('div');
    cell.className = 'cal-cell';

    if (other) {
      cell.classList.add('other-month');
      cell.innerHTML = `<div class="cell-num-wrap"><div class="cell-num">${day}</div></div>`;
      grid.appendChild(cell);
      continue;
    }

    const dateStr   = `${channelCalYear}-${String(channelCalMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const items     = _getChannelItems(dateStr);
    const occasions = typeof getOccasions === 'function' ? getOccasions(dateStr) : [];
    if (day === today.getDate() && channelCalMonth === today.getMonth() && channelCalYear === today.getFullYear())
      cell.classList.add('today');

    /* number row */
    const numWrap = document.createElement('div');
    numWrap.className = 'cell-num-wrap';
    const numEl = document.createElement('div');
    numEl.className = 'cell-num';
    numEl.textContent = day;
    numWrap.appendChild(numEl);
    if (items.length) {
      const cnt = document.createElement('span');
      cnt.style.cssText = `font-size:9px;font-weight:700;padding:1px 5px;border-radius:10px;background:${cfg.color};color:#fff;margin-left:auto`;
      cnt.textContent = items.length;
      numWrap.appendChild(cnt);
    }
    cell.appendChild(numWrap);

    /* occasion strip */
    if (occasions.length) {
      const strip = document.createElement('div');
      strip.className = 'cell-occasion-strip';
      strip.style.cssText = `border-left:3px solid ${occasions[0].color};background:${occasions[0].color}18;color:${occasions[0].color}`;
      strip.innerHTML = `${occasions[0].emoji} <span class="oc-name">${occasions[0].name}</span>`;
      cell.appendChild(strip);
    }

    /* clicking date number opens day view */
    numEl.style.cursor = 'pointer';
    numEl.title = 'Click to see all posts for this day';
    numEl.onclick = e => { e.stopPropagation(); openDayView(dateStr); };

    /* pills - title first, time small */
    const postsWrap = document.createElement('div');
    postsWrap.className = 'cell-posts';
    items.slice(0,3).forEach(item => {
      const pill = document.createElement('div');
      pill.className = 'cal-post-pill';
      if (item.type === 'idea') {
        pill.style.cssText = 'background:#EDE9FE;color:#5B21B6;border-left:2.5px solid #7C3AED';
      } else {
        pill.style.cssText = `background:${cfg.bg};color:${cfg.color};border-left:2.5px solid ${STATUS_COLORS[item.status]||'#ccc'}`;
      }
      const timeHtml = item.time && item.type !== 'idea'
        ? `<span style="font-size:9px;opacity:.65;display:block;margin-top:1px">${item.time.slice(0,5)}</span>` : '';
      pill.innerHTML = `<span style="flex-shrink:0;font-size:11px">${item.type==='idea'?'💡':cfg.emoji}</span>
        <span style="flex:1;min-width:0">
          <span style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:700;font-size:11px">${item.title}</span>
          ${timeHtml}
        </span>`;
      pill.title = item.title + (item.time ? ' at ' + item.time : '');
      pill.onclick = e => { e.stopPropagation(); openChannelItemDrawer(dateStr, item); };
      postsWrap.appendChild(pill);
    });
    if (items.length > 3) {
      const m = document.createElement('div');
      m.className = 'pill-more';
      m.style.cursor = 'pointer';
      m.title = 'Click to see all posts';
      m.textContent = `+${items.length-3} more`;
      m.onclick = e => { e.stopPropagation(); openDayView(dateStr); };
      postsWrap.appendChild(m);
    }
    if (!items.length) {
      const add = document.createElement('div');
      add.className = 'cell-add-btn';
      add.textContent = '+';
      add.title = 'Add for this day';
      add.onclick = e => { e.stopPropagation(); openChannelAddModal(dateStr); };
      postsWrap.appendChild(add);
    }
    cell.appendChild(postsWrap);
    cell.dataset.date = dateStr;
    cell.onclick = () => openChannelAddModal(dateStr);

    grid.appendChild(cell);
  }
}

function _getChannelItems(dateStr) {
  // Ideas filtered to ONLY the active channel — no bleed across channels
  const ideaPills = (state.ideas||[])
    .filter(i => i.date === dateStr && i.platform === activeChannel)
    .map(i => ({id:i.id, title:'💡 '+i.title, status:'draft', time:'', type:'idea', platform:i.platform}));

  switch (activeChannel) {
    case 'social':
      return [
        ...(state.posts||[])
          .filter(p => p.date===dateStr && ['Instagram','Facebook','Twitter/X','LinkedIn'].includes(p.platform))
          .map(p => ({id:p.id,title:p.title,status:p.status,time:p.time,type:'post',platform:p.platform})),
        ...ideaPills
      ];
    case 'whatsapp':
      return [
        ...(state.posts||[])
          .filter(p => p.date===dateStr && p.platform==='WhatsApp')
          .map(p => ({id:p.id,title:p.title,status:p.status,time:p.time,type:'post',platform:'WhatsApp'})),
        ...ideaPills
      ];
    case 'email':
      return [
        ...(state.emailCampaigns||[]).filter(c => c.date===dateStr).map(c => ({id:c.id,title:c.name,status:c.status,time:c.time,type:'email'})),
        ...ideaPills
      ];
    case 'meta': {
      const ads = (state.ads||[]).filter(a=>a.startDate===dateStr)
        .map(a => ({id:a.id,title:a.title,status:a.status,time:'09:00',type:'ad'}));
      const fb  = (state.posts||[]).filter(p=>p.date===dateStr&&(p.platform==='Facebook'||p.platform==='Meta Ad'))
        .map(p => ({id:p.id,title:p.title,status:p.status,time:p.time,type:'post',platform:p.platform}));
      return [...ads,...fb,...ideaPills];
    }
    case 'google':
      return [
        ...(state.googleAds||[]).filter(a=>a.date===dateStr).map(a=>({id:a.id,title:a.title,status:a.status,time:'09:00',type:'gad'})),
        ...ideaPills
      ];
    default: return [];
  }
}

/* ══════════════════════════════════════════════════════════
   FESTIVAL SIDEBAR
══════════════════════════════════════════════════════════ */
function renderChannelFestivalSidebar() {
  const el = document.getElementById('channelSidebarContent');
  if (!el) return;
  const daysInMo = new Date(channelCalYear, channelCalMonth+1, 0).getDate();
  const occasions = [];
  for (let d=1; d<=daysInMo; d++) {
    const ds = `${channelCalYear}-${String(channelCalMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    (typeof getOccasions==='function' ? getOccasions(ds) : [])
      .forEach(o => occasions.push({...o, date:ds, day:d}));
  }
  if (!occasions.length) {
    el.innerHTML = `<div style="color:var(--text3);font-size:12px;padding:8px 0">No occasions this month</div>`;
    return;
  }
  el.innerHTML = occasions.map(o => `
    <div class="festival-sidebar-item" title="Click to plan a post">
      <div class="fsi-dot" style="background:${o.color}"></div>
      <div class="fsi-body">
        <div class="fsi-name">${o.emoji} ${o.name}</div>
        <div class="fsi-date">${fmtDate(o.date)}</div>
      </div>
      <button class="fsi-plan-btn" style="color:${o.color};border-color:${o.color}20;background:${o.color}10"
        onclick="openChannelAddModal('${o.date}','${o.name.replace(/'/g,"\\'")}','${o.emoji}')">
        + Plan
      </button>
    </div>`).join('');
}

/* ══════════════════════════════════════════════════════════
   ADD MODAL  —  image FIRST, then post details
   Google Drive tab = direct file upload via input[capture]
══════════════════════════════════════════════════════════ */
function openChannelAddModal(dateStr, occasionName, occasionEmoji) {
  const cfg = CHANNEL_CONFIG[activeChannel];

  if (activeChannel === 'email') {
    showEmailModal(null);
    setTimeout(() => { const d=document.getElementById('ec-date'); if(d) d.value=dateStr; }, 80);
    return;
  }
  if (activeChannel === 'meta') { showModal('ad'); return; }
  if (activeChannel === 'google') { _showGoogleAdModal(dateStr, occasionName, occasionEmoji); return; }

  const prefillTitle   = occasionName ? `${occasionEmoji} ${occasionName} — post` : '';
  const prefillCaption = occasionName
    ? `Wishing everyone a wonderful ${occasionName}! ${occasionEmoji}\n\n#${occasionName.replace(/[^a-zA-Z]/g,'')} #India #Festival`
    : '';
  const isWA = activeChannel === 'whatsapp';

  window._caddAttachment = null;

  document.getElementById('modalTitle').textContent = `${cfg.emoji} New ${cfg.label} Post`;
  document.getElementById('modalBody').innerHTML = `

    ${occasionName ? `<div style="background:${cfg.bg};border-left:4px solid ${cfg.color};border-radius:var(--r-lg);padding:10px 14px;margin-bottom:14px;font-size:13px;color:${cfg.color};font-weight:600">${occasionEmoji} Planning for: ${occasionName}</div>` : ''}

    <!-- ══ TITLE & CAPTION FIRST — so they're visible without scrolling ══ -->
    <div class="form-group"><label class="form-label">Title *</label>
      <input class="form-input" id="cadd-title" value="${prefillTitle}" placeholder="Post title" autofocus></div>

    <div class="form-group"><label class="form-label">Caption</label>
      <textarea class="form-input form-textarea" id="cadd-caption" rows="3" style="min-height:65px">${prefillCaption}</textarea></div>

    <!-- Hidden platform field — uses active channel -->
    <input type="hidden" id="cadd-platform" value="${isWA ? 'WhatsApp' : cfg.label}">

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">🕐 Send time</label>
        <div style="display:flex;gap:6px;align-items:center">
          <input class="form-input" type="time" id="cadd-time" value="09:00"
            style="flex:1;font-size:15px;font-weight:700;color:var(--brand);cursor:pointer"
            title="Click to pick time">
          <!-- Quick time presets -->
        </div>
        <div style="display:flex;gap:5px;margin-top:7px;flex-wrap:wrap">
          ${['08:00','09:00','10:00','12:00','15:00','18:00','20:00'].map(t =>
            `<button type="button" onclick="document.getElementById('cadd-time').value='${t}'"
              style="padding:4px 10px;border-radius:14px;border:1.5px solid var(--border2);background:var(--white);font-size:11px;font-weight:700;cursor:pointer;color:var(--text2);font-family:var(--font);transition:all .13s"
              onmouseover="this.style.background='var(--brand)';this.style.color='#fff';this.style.borderColor='var(--brand)'"
              onmouseout="this.style.background='var(--white)';this.style.color='var(--text2)';this.style.borderColor='var(--border2)'">${t}</button>`
          ).join('')}
        </div>
      </div>
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-select" id="cadd-status">
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="review">In review</option>
        </select></div>
    </div>

    <div class="form-row">
      <div class="form-group"><label class="form-label">Post type</label>
        <select class="form-select" id="cadd-type">
          <option>Image post</option><option>Video / Reel</option>
          <option>Carousel</option><option>Story</option><option>Text only</option>
        </select></div>
      <div class="form-group"><label class="form-label">Assign to</label>
        <select class="form-select" id="cadd-assign">
          <option value="">— unassigned —</option>
          ${Object.values(typeof TEAM_USERS!=='undefined'?TEAM_USERS:{})
            .map(m=>`<option value="${m.name}">${m.name} ${m.role==='admin'?'⭐':''}</option>`).join('')}
        </select></div>
    </div>

    <!-- ══ MEDIA ATTACHMENT ══ -->
    <div class="media-attach-block">
      <div class="media-attach-label" onclick="toggleMediaSection()">
        <span>📎 Attach image / video</span>
        <span class="media-attach-chevron" id="mediaChevron">▾ expand</span>
      </div>

      <div id="mediaAttachBody" style="display:none;margin-top:10px">
        <div class="media-attach-tabs" style="margin-bottom:10px">
          <button class="mat-tab active" onclick="switchMediaTab('device',this)">📱 Device</button>
          <button class="mat-tab" onclick="switchMediaTab('drive',this)">☁️ Google Drive</button>
          <button class="mat-tab" onclick="switchMediaTab('library',this)">🖼 Library</button>
        </div>

        <!-- Device -->
        <div id="mat-device" class="mat-panel">
          <label style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--brand-pale);border:2px dashed var(--brand-mid);border-radius:var(--r-lg);cursor:pointer;transition:all .15s"
            onmouseover="this.style.background='var(--brand-light)'" onmouseout="this.style.background='var(--brand-pale)'">
            <input type="file" id="cadd-file-input" accept="image/*,video/*" style="display:none" onchange="handleCaddFile(this)">
            <span style="font-size:24px">📁</span>
            <div>
              <div style="font-size:13px;font-weight:700;color:var(--brand-dark)">Click to pick from your gallery or file browser</div>
              <div style="font-size:11px;color:var(--text3);margin-top:2px">JPG · PNG · GIF · MP4 · MOV — any size</div>
            </div>
            <div style="margin-left:auto;background:var(--brand);color:#fff;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap">Browse files</div>
          </label>
          <div id="cadd-file-preview" style="margin-top:8px"></div>
        </div>

        <!-- Google Drive -->
        <div id="mat-drive" class="mat-panel" style="display:none">

        <!-- Step 1: Open Drive -->
        <div class="drive-step">
          <div class="drive-step-num">1</div>
          <div class="drive-step-body">
            <div class="drive-step-title">Open Google Drive</div>
            <div class="drive-step-sub">Click the button to open your Drive in a new tab</div>
          </div>
          <button class="drive-open-btn" onclick="window.open('https://drive.google.com','_blank')">
            <img src="https://www.google.com/images/about/get-started-with-google-drive-logo.png"
              onerror="this.style.display='none'"
              style="width:18px;height:18px;object-fit:contain;margin-right:4px">
            Open Google Drive ↗
          </button>
        </div>

        <!-- Step 2: Share the file -->
        <div class="drive-step">
          <div class="drive-step-num">2</div>
          <div class="drive-step-body">
            <div class="drive-step-title">Right-click your file → Share → "Anyone with link"</div>
            <div class="drive-step-sub">Then click Copy link</div>
          </div>
        </div>

        <!-- Step 3: Paste -->
        <div class="drive-step" style="margin-bottom:12px">
          <div class="drive-step-num">3</div>
          <div class="drive-step-body">
            <div class="drive-step-title">Paste the link here and preview</div>
          </div>
        </div>

        <div style="display:flex;gap:8px;align-items:center">
          <input class="form-input" id="cadd-drive-url"
            placeholder="https://drive.google.com/file/d/…"
            style="flex:1" oninput="autoDrivePreview(this.value)">
          <button class="btn btn-primary btn-sm" onclick="previewDriveImage()" style="white-space:nowrap;flex-shrink:0">
            👁 Preview
          </button>
        </div>
        <div id="cadd-drive-preview" style="margin-top:10px"></div>

        <!-- Fallback: also allow direct file upload from local Drive folder -->
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
          <div style="font-size:11px;color:var(--text3);font-weight:600;margin-bottom:8px">
            — or if Google Drive is synced on this PC, pick the file directly —
          </div>
          <label class="drive-local-btn">
            <input type="file" id="cadd-drive-file" accept="image/*,video/*"
              style="display:none" onchange="handleCaddFile(this,'drive')">
            📂 Pick from local Drive folder
          </label>
            <div id="cadd-drive-file-preview" style="margin-top:8px"></div>
          </div>
        </div>

        <!-- Media library -->
        <div id="mat-library" class="mat-panel" style="display:none">
          <div id="cadd-library-grid" class="media-mini-grid"></div>
          <div id="cadd-library-selected" style="margin-top:8px;font-size:11px;color:var(--green);font-weight:600;display:none">✅ Image selected</div>
        </div>

      </div><!-- end mediaAttachBody -->
    </div><!-- end media-attach-block -->

  `;

  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveChannelPost('${dateStr}')">💾 Save post</button>`;
  document.getElementById('modalOverlay').classList.add('open');
  _populateMiniLibrary();
}

/* ── Google Ads modal ────────────────────────────────────── */
function _showGoogleAdModal(dateStr, occasionName, occasionEmoji) {
  if (!state.googleAds) state.googleAds = [];
  const prefill = occasionName ? `${occasionEmoji} ${occasionName} — search ad` : '';
  document.getElementById('modalTitle').textContent = '🔍 New Google Ad Campaign';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group"><label class="form-label">Campaign name *</label>
      <input class="form-input" id="gad-title" value="${prefill}" placeholder="e.g. Diwali Sale — Search"></div>
    <div class="form-group"><label class="form-label">Campaign type</label>
      <select class="form-select" id="gad-type">
        <option>Search</option><option>Display</option><option>Shopping</option>
        <option>Video (YouTube)</option><option>Performance Max</option>
      </select></div>
    <div class="form-group"><label class="form-label">Ad headline</label>
      <input class="form-input" id="gad-headline" placeholder="e.g. Diwali Sale — Up to 40% Off! Shop Now"></div>
    <div class="form-group"><label class="form-label">Ad description</label>
      <textarea class="form-input" id="gad-desc" rows="3" placeholder="Your ad description (max 90 chars recommended)"></textarea></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Daily budget (₹)</label>
        <input class="form-input" type="number" id="gad-budget" placeholder="500" min="1"></div>
      <div class="form-group"><label class="form-label">Target keywords</label>
        <input class="form-input" id="gad-keywords" placeholder="diwali sale, ethnic wear online"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Start date</label>
        <input class="form-input" type="date" id="gad-date" value="${dateStr}"></div>
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-select" id="gad-status">
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="active">Active</option>
        </select></div>
    </div>
    <div class="form-group"><label class="form-label">Target URL</label>
      <input class="form-input" id="gad-url" placeholder="https://yourbrand.com/sale"></div>`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveGoogleAd('${dateStr}')">💾 Save ad</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

function saveGoogleAd(dateStr) {
  const title = (document.getElementById('gad-title').value||'').trim();
  if (!title) { showToast('Enter a campaign name', 'error'); return; }
  if (!state.googleAds) state.googleAds = [];
  state.googleAds.push({
    id: genId(), title,
    type:     document.getElementById('gad-type').value,
    headline: document.getElementById('gad-headline').value,
    desc:     document.getElementById('gad-desc').value,
    budget:   parseInt(document.getElementById('gad-budget').value)||0,
    keywords: document.getElementById('gad-keywords').value,
    date:     document.getElementById('gad-date').value,
    url:      document.getElementById('gad-url').value,
    status:   document.getElementById('gad-status').value,
    spent: 0, clicks: 0, impressions: 0, created: new Date().toISOString().split('T')[0],
  });
  saveState(); closeModal(); renderChannelCalendars();
  showToast('🔍 Google Ad saved!', 'success');
}

/* ── Media tab helpers ───────────────────────────────────── */
function switchMediaTab(tab, el) {
  document.querySelectorAll('.mat-tab').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  ['device','drive','library'].forEach(t => {
    const p = document.getElementById('mat-'+t);
    if (p) p.style.display = t===tab ? '' : 'none';
  });
  if (tab==='library') _populateMiniLibrary();
}

function _populateMiniLibrary() {
  const el = document.getElementById('cadd-library-grid');
  if (!el) return;
  const lib = (state.mediaLibrary||[]).filter(m=>m.thumb);
  if (!lib.length) {
    el.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:12px;text-align:center;grid-column:1/-1">No images in library yet — upload some first</div>';
    return;
  }
  el.innerHTML = lib.map(m => `
    <div class="media-mini-card" onclick="selectLibraryMedia(${m.id})" id="mmc-${m.id}" title="${m.name}">
      <img src="${m.thumb}" style="width:100%;height:60px;object-fit:cover;display:block">
    </div>`).join('');
}

function selectLibraryMedia(id) {
  const m = (state.mediaLibrary||[]).find(x=>x.id===id);
  if (!m||!m.thumb) return;
  document.querySelectorAll('.media-mini-card').forEach(c=>c.classList.remove('selected'));
  const card = document.getElementById('mmc-'+id);
  if (card) card.classList.add('selected');
  window._caddAttachment = { url:m.thumb, name:m.name };
  const lbl = document.getElementById('cadd-library-selected');
  if (lbl) { lbl.textContent = `✅ "${m.name}" selected`; lbl.style.display=''; }
  showToast('✅ Image selected from library', 'success');
}

function handleCaddFile(input, source) {
  const file = input.files[0];
  if (!file) return;

  // Use createObjectURL — no base64, no memory crash
  const objUrl = URL.createObjectURL(file);
  window._caddAttachment = { url: objUrl, name: file.name, size: file.size };

  // Show preview
  const previewId = source === 'drive' ? 'cadd-drive-file-preview' : 'cadd-file-preview';
  const preview   = document.getElementById(previewId);
  if (preview) {
    if (file.type.startsWith('image/')) {
      preview.innerHTML = `<img src="${objUrl}" style="width:100%;max-height:130px;object-fit:cover;border-radius:var(--r-lg);border:1.5px solid var(--border)">
        <div style="font-size:11px;color:var(--green);font-weight:600;margin-top:4px">✅ ${file.name} ready</div>`;
    } else {
      preview.innerHTML = `<div style="background:var(--surface2);border-radius:var(--r-lg);padding:10px;font-size:12px;color:var(--green);font-weight:600;border:1.5px solid var(--border)">🎬 ${file.name} attached</div>`;
    }
  }

  // Add metadata to media library (no blob stored in state)
  if (!state.mediaLibrary) state.mediaLibrary = [];
  if (!state.mediaLibrary.find(m => m.name === file.name)) {
    const id = genId();
    _mediaBlobs[id] = objUrl; // store in memory
    state.mediaLibrary.push({
      id, name: file.name,
      type: file.type.startsWith('video/') ? 'video' : 'image',
      size: _fmtSz(file.size), tags: [],
      date: new Date().toISOString().split('T')[0],
      source: source || 'upload',
      url: null, thumb: null, // never in localStorage
    });
    // Save only metadata
    try {
      const safe = { ...state, mediaLibrary: (state.mediaLibrary||[]).map(m=>({...m, url: m.source==='drive'?m.url:null, thumb: m.source==='drive'?m.thumb:null})) };
      localStorage.setItem('socialhub_v2', JSON.stringify(safe));
    } catch(e) {}
  }

  input.value = '';
}

function previewDriveImage() {
  const url=(document.getElementById('cadd-drive-url').value||'').trim();
  if (!url) { showToast('Paste a Google Drive link first','error'); return; }
  _loadDrivePreview(url);
}

function autoDrivePreview(val) {
  if (val && val.includes('drive.google.com') && val.includes('/d/')) {
    clearTimeout(window._drivePreviewTimer);
    window._drivePreviewTimer = setTimeout(() => _loadDrivePreview(val), 400);
  }
}

function _loadDrivePreview(url) {
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!m) return;
  const fileId  = m[1];
  const direct  = `https://drive.google.com/uc?export=view&id=${fileId}`;
  const thumb   = `https://drive.google.com/thumbnail?id=${fileId}&sz=w480`;

  window._caddAttachment = { url: direct, name: 'drive-image-'+fileId.slice(0,8)+'.jpg', source:'drive' };

  const p = document.getElementById('cadd-drive-preview');
  if (!p) return;
  p.innerHTML = `
    <div style="background:var(--surface2);border:1.5px solid var(--border);border-radius:var(--r-lg);padding:10px;text-align:center">
      <img src="${thumb}" alt="Drive preview"
        style="max-height:160px;max-width:100%;object-fit:contain;border-radius:var(--r-md);display:block;margin:0 auto"
        onload="document.getElementById('cdp-ok').style.display='flex'"
        onerror="this.src='${direct}';this.onerror=function(){this.style.display='none';document.getElementById('cdp-err').style.display=''}">
      <div id="cdp-ok" style="display:none;align-items:center;justify-content:center;gap:6px;margin-top:8px;font-size:11px;color:var(--green);font-weight:700">
        ✅ Image ready — will be attached to this post
      </div>
      <div id="cdp-err" style="display:none;font-size:12px;color:var(--coral);margin-top:8px;padding:8px;background:var(--coral-light);border-radius:var(--r-md)">
        ❌ Could not load. Make sure sharing is set to <strong>"Anyone with link"</strong> in Google Drive.
      </div>
    </div>`;
}

function _fmtSz(b) {
  if (!b) return '';
  if (b<1024*1024) return (b/1024).toFixed(1)+' KB';
  return (b/(1024*1024)).toFixed(1)+' MB';
}

/* ── Save post ───────────────────────────────────────────── */

function toggleMediaSection() {
  const body    = document.getElementById('mediaAttachBody');
  const chevron = document.getElementById('mediaChevron');
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : '';
  if (chevron) chevron.textContent = isOpen ? '▾ expand' : '▴ collapse';
  if (!isOpen) _populateMiniLibrary();
}
function saveChannelPost(dateStr) {
  const title=(document.getElementById('cadd-title').value||'').trim();
  if (!title) { showToast('Enter a post title','error'); return; }
  const platform=document.getElementById('cadd-platform').value;
  const att=window._caddAttachment||null;
  if (att&&att.source==='drive'&&!state.mediaLibrary.find(m=>m.url===att.url)) {
    if (!state.mediaLibrary) state.mediaLibrary=[];
    state.mediaLibrary.push({id:genId(),name:att.name||'drive-image',type:'image',url:att.url,thumb:att.url,size:'Drive',tags:[],date:new Date().toISOString().split('T')[0],source:'drive'});
  }
  if (!state.posts) state.posts=[];
  state.posts.push({
    id:genId(), title,
    caption:  document.getElementById('cadd-caption').value,
    platform, platforms:[platform], date:dateStr,
    time:     document.getElementById('cadd-time').value,
    status:   document.getElementById('cadd-status').value,
    type:     document.getElementById('cadd-type').value,
    assignee: document.getElementById('cadd-assign').value,
    priority:'normal', hashtags:'', brief:'', notes:'',
    mediaUrl: att?att.url:null, mediaName:att?att.name:null,
    created:  new Date().toISOString().split('T')[0],
  });
  window._caddAttachment=null;
  saveState(); closeModal(); updateBadge();
  renderChannelGrid(); renderChannelFestivalSidebar(); renderChannelList();
  showToast('✨ Post saved!','success');
}

/* ── Edit existing post ──────────────────────────────────── */
function openChannelItemDrawer(dateStr, item) {
  if (item.type==='email') { editEmailCampaign(item.id); return; }
  if (item.type==='ad'||item.type==='gad') { showToast('Edit from Meta/Google Ads section'); return; }
  if (item.type==='idea') { _showIdeaViewModal(item.id); return; }
  const p=(state.posts||[]).find(x=>x.id===item.id);
  if (p) _showEditPostModal(p);
}

function _showIdeaViewModal(ideaId) {
  const idea = (state.ideas||[]).find(i => i.id === ideaId);
  if (!idea) { showToast('Idea not found', 'error'); return; }

  const IDEA_CATS = {
    idea:     { label:'💡 Idea',     color:'#1D4ED8', bg:'#DBEAFE' },
    video:    { label:'🎬 Video',    color:'#DC2626', bg:'#FEE2E2' },
    caption:  { label:'✍️ Caption', color:'#1E40AF', bg:'#EFF6FF' },
    campaign: { label:'📣 Campaign', color:'#5B21B6', bg:'#EDE9FE' },
    hashtag:  { label:'# Hashtag',  color:'#065F46', bg:'#ECFDF5' },
    trend:    { label:'🔥 Trend',    color:'#92400E', bg:'#FFFBEB' },
  };
  const CHAN_LABELS = {
    social:'📸 Social Media', email:'📧 Email Marketing',
    whatsapp:'💬 WhatsApp', meta:'📊 Meta Ads', google:'🔍 Google Ads'
  };
  const cat = IDEA_CATS[idea.category] || IDEA_CATS.idea;

  document.getElementById('modalTitle').textContent = '💡 Idea details';
  document.getElementById('modalBody').innerHTML = `

    <!-- Idea card header -->
    <div style="background:${idea.color||cat.bg};border-left:4px solid ${cat.color};border-radius:var(--r-lg);padding:14px 16px;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;background:${cat.color}22;color:${cat.color}">${cat.label}</span>
        <span style="font-size:11px;color:var(--text3);font-weight:600">${CHAN_LABELS[idea.platform]||idea.platform}</span>
      </div>
      <div style="font-size:16px;font-weight:800;color:var(--text);margin-bottom:${idea.body?'8px':'0'}">${idea.title}</div>
      ${idea.body ? `<div style="font-size:13px;color:var(--text2);line-height:1.6">${idea.body}</div>` : ''}
    </div>

    <!-- Scheduled date -->
    ${idea.date ? `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--brand-light);border-radius:var(--r-lg);margin-bottom:14px">
      <span style="font-size:18px">📅</span>
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--brand-dark)">Scheduled for ${fmtDate(idea.date)}</div>
        <div style="font-size:11px;color:var(--brand);margin-top:1px">Click "→ Convert to post" to make it a real scheduled post</div>
      </div>
    </div>` : `
    <div style="padding:10px 14px;background:var(--amber-light);border-radius:var(--r-lg);margin-bottom:14px;font-size:12px;color:var(--amber);font-weight:600">
      ⚡ Not yet scheduled — pick a date below to schedule it
    </div>`}

    <!-- Quick reschedule -->
    <div class="form-group">
      <label class="form-label">Schedule / change date</label>
      <input class="form-input" type="date" id="iv-date" value="${idea.date||new Date().toISOString().split('T')[0]}">
    </div>

    <div class="form-group">
      <label class="form-label">Notes (editable)</label>
      <textarea class="form-input form-textarea" id="iv-body" rows="3" style="min-height:60px">${idea.body||''}</textarea>
    </div>`;

  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost btn-sm btn-danger" onclick="deleteIdeaFromModal(${ideaId})">🗑 Delete</button>
    <button class="btn btn-ghost btn-sm" onclick="unscheduleIdeaFromModal(${ideaId})" ${!idea.date?'style="display:none"':''}>📤 Unschedule</button>
    <button class="btn btn-ghost" onclick="closeModal()">Close</button>
    <button class="btn btn-primary btn-sm" onclick="saveIdeaFromModal(${ideaId})" style="margin-right:4px">💾 Save</button>
    <button class="btn btn-primary" onclick="convertIdeaToPostFromModal(${ideaId})" style="background:linear-gradient(135deg,#10B981,#065F46)">→ Convert to post</button>`;

  document.getElementById('modalOverlay').classList.add('open');
}

function saveIdeaFromModal(ideaId) {
  const idea = (state.ideas||[]).find(i=>i.id===ideaId);
  if (!idea) return;
  idea.date = document.getElementById('iv-date').value;
  idea.body = document.getElementById('iv-body').value;
  saveState();
  closeModal();
  renderChannelGrid();
  renderSidebarIdeas && renderSidebarIdeas();
  showToast('💡 Idea updated!', 'success');
}

function deleteIdeaFromModal(ideaId) {
  if (!confirm('Delete this idea?')) return;
  state.ideas = (state.ideas||[]).filter(i=>i.id!==ideaId);
  saveState(); closeModal(); renderChannelGrid();
  renderSidebarIdeas && renderSidebarIdeas();
  showToast('Idea deleted');
}

function unscheduleIdeaFromModal(ideaId) {
  const idea = (state.ideas||[]).find(i=>i.id===ideaId);
  if (!idea) return;
  idea.date = null;
  saveState(); closeModal(); renderChannelGrid();
  renderSidebarIdeas && renderSidebarIdeas();
  showToast('Idea moved back to board');
}

function convertIdeaToPostFromModal(ideaId) {
  // Save any edits first
  const idea = (state.ideas||[]).find(i=>i.id===ideaId);
  if (!idea) return;
  const newDate = document.getElementById('iv-date').value;
  if (newDate) idea.date = newDate;
  idea.body = document.getElementById('iv-body').value;
  closeModal();
  convertIdeaToPost(ideaId);
}

function _showEditPostModal(p) {
  const pf = PLATFORM_COLORS[p.platform]||{};
  const st = STATUS_MAP[p.status]||{};
  window._editPostMedia = p.mediaUrl || null;

  const CHANNELS = {
    'Instagram':'📸 Social Media','Facebook':'📸 Social Media',
    'WhatsApp':'💬 WhatsApp','Email':'📧 Email',
    'Meta Ad':'📊 Meta Ads','Google Ad':'🔍 Google Ads',
    'Twitter/X':'📸 Social Media','LinkedIn':'📸 Social Media'
  };

  document.getElementById('modalTitle').textContent='✏️ Edit Post';
  document.getElementById('modalBody').innerHTML=`

    <!-- Header: platform + status -->
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface2);border-radius:var(--r-lg);margin-bottom:14px">
      <div class="platform-icon" style="background:${pf.bg||'var(--pink-light)'};width:34px;height:34px;font-size:15px">${pf.icon||'📝'}</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:700">${p.platform}</div>
        <div style="font-size:11px;color:var(--text3)">${fmtDate(p.date)} at ${p.time||'09:00'}</div>
      </div>
      <span class="badge ${st.cls}" style="margin-left:auto">${st.label}</span>
    </div>

    <!-- Media section -->
    <div style="margin-bottom:14px">
      <div id="ep-media-preview">
        ${window._editPostMedia ? `
        <div style="position:relative;border-radius:var(--r-lg);overflow:hidden;border:1.5px solid var(--border)">
          <img src="${window._editPostMedia}" style="width:100%;max-height:200px;object-fit:cover;display:block">
          <div style="display:flex;gap:6px;padding:8px 10px;background:var(--surface2);flex-wrap:wrap">
            <a href="${window._editPostMedia}" download="${p.title||'image'}" target="_blank"
              style="display:inline-flex;align-items:center;gap:4px;padding:5px 12px;background:var(--brand);color:#fff;border-radius:16px;font-size:11px;font-weight:700;text-decoration:none">
              ⬇ Download
            </a>
            <button onclick="navigator.clipboard.writeText('${window._editPostMedia}').then(()=>showToast('📋 Copied!','success'))"
              style="padding:5px 12px;background:var(--surface3);color:var(--text2);border:1px solid var(--border);border-radius:16px;font-size:11px;font-weight:700;cursor:pointer;font-family:var(--font)">
              📋 Copy URL
            </button>
            <a href="${window._editPostMedia}" target="_blank"
              style="padding:5px 12px;background:var(--surface3);color:var(--text2);border:1px solid var(--border);border-radius:16px;font-size:11px;font-weight:700;text-decoration:none">
              ↗ Full size
            </a>
            <button onclick="clearEditPostMedia(${p.id})"
              style="padding:5px 12px;background:var(--coral-light);color:var(--coral);border:1px solid var(--coral);border-radius:16px;font-size:11px;font-weight:700;cursor:pointer;font-family:var(--font)">
              🗑 Remove
            </button>
          </div>
        </div>` : `<div style="background:var(--surface2);border:2px dashed var(--border2);border-radius:var(--r-lg);padding:16px;text-align:center;color:var(--text3);font-size:13px">No image attached</div>`}
      </div>
      <!-- Change / Add media button -->
      <label style="display:flex;align-items:center;gap:8px;margin-top:8px;padding:8px 14px;background:var(--brand-pale);border:1.5px dashed var(--brand-mid);border-radius:var(--r-lg);cursor:pointer;transition:all .15s"
        onmouseover="this.style.background='var(--brand-light)'" onmouseout="this.style.background='var(--brand-pale)'">
        <input type="file" accept="image/*,video/*" style="display:none" onchange="handleEditPostMedia(this,${p.id})">
        <span style="font-size:16px">🖼️</span>
        <span style="font-size:12px;font-weight:700;color:var(--brand)">${window._editPostMedia ? '🔄 Change image / video' : '📎 Attach image / video'}</span>
      </label>
    </div>

    <!-- Fields -->
    <div class="form-group"><label class="form-label">Title</label>
      <input class="form-input" id="ep-title" value="${(p.title||'').replace(/"/g,'&quot;')}"></div>
    <div class="form-group"><label class="form-label">Caption</label>
      <textarea class="form-input form-textarea" id="ep-caption" rows="3">${p.caption||''}</textarea></div>

    <div class="form-row">
      <div class="form-group"><label class="form-label">Date</label>
        <input class="form-input" type="date" id="ep-date" value="${p.date}"></div>
      <div class="form-group"><label class="form-label">Time</label>
        <input class="form-input" type="time" id="ep-time" value="${p.time||'09:00'}"></div>
    </div>

    <div class="form-row">
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-select" id="ep-status">
          <option value="draft" ${p.status==='draft'?'selected':''}>Draft</option>
          <option value="scheduled" ${p.status==='scheduled'?'selected':''}>Scheduled</option>
          <option value="review" ${p.status==='review'?'selected':''}>In review</option>
          <option value="published" ${p.status==='published'?'selected':''}>Published</option>
        </select></div>
      <div class="form-group"><label class="form-label">Move to channel</label>
        <select class="form-select" id="ep-channel" title="Move this post to a different channel calendar">
          <option value="social"    ${(!p.platform||p.platform==='Instagram'||p.platform==='Facebook'||p.platform==='Twitter/X'||p.platform==='LinkedIn')?'selected':''}>📸 Social Media</option>
          <option value="whatsapp"  ${p.platform==='WhatsApp'?'selected':''}>💬 WhatsApp</option>
          <option value="email"     ${p.platform==='Email'?'selected':''}>📧 Email</option>
          <option value="meta"      ${(p.platform==='Meta Ad'||p.platform==='Facebook')?'selected':''}>📊 Meta Ads</option>
          <option value="google"    ${p.platform==='Google Ad'?'selected':''}>🔍 Google Ads</option>
        </select></div>
    </div>

    <div class="form-group"><label class="form-label">Assign to</label>
      <select class="form-select" id="ep-assign">
        <option value="">— unassigned —</option>
        ${Object.values(typeof TEAM_USERS!=='undefined'?TEAM_USERS:{})
          .map(m=>`<option value="${m.name}" ${p.assignee===m.name?'selected':''}>${m.name} ${m.role==='admin'?'⭐':''}</option>`).join('')}
      </select></div>`;

  document.getElementById('modalFooter').innerHTML=`
    <button class="btn btn-ghost btn-sm btn-danger" onclick="deletePost(${p.id});closeModal();renderChannelCalendars()">🗑 Delete</button>
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="updateChannelPost(${p.id})">💾 Update</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

/* Change media in edit modal */
async function handleEditPostMedia(input, postId) {
  const file = input.files[0]; if (!file) return;
  const preview = document.getElementById('ep-media-preview');
  if (preview) preview.innerHTML = `<div style="padding:12px;background:var(--brand-pale);border-radius:var(--r-lg);font-size:12px;color:var(--brand);font-weight:600">☁️ Uploading new image…</div>`;
  try {
    const result = await uploadToCloudinary(file, pct => {
      if (preview) preview.innerHTML = `<div style="padding:12px;background:var(--brand-pale);border-radius:var(--r-lg);font-size:12px;color:var(--brand);font-weight:600">☁️ Uploading… ${pct}%</div>`;
    });
    window._editPostMedia = result.url;
    if (typeof autoSaveToMediaLibrary === 'function') autoSaveToMediaLibrary(result.url, file.name, 'cloudinary');
    if (preview) preview.innerHTML = `
      <div style="position:relative;border-radius:var(--r-lg);overflow:hidden;border:1.5px solid var(--border)">
        <img src="${result.url}" style="width:100%;max-height:200px;object-fit:cover;display:block">
        <div style="padding:8px 10px;background:var(--green-light);font-size:11px;color:var(--green);font-weight:700">✅ New image uploaded — click Update to save</div>
      </div>`;
  } catch(e) {
    if (preview) preview.innerHTML = `<div style="color:var(--coral);font-size:12px;padding:10px">❌ Upload failed. Try again.</div>`;
  }
  input.value = '';
}

function clearEditPostMedia(postId) {
  window._editPostMedia = null;
  const preview = document.getElementById('ep-media-preview');
  if (preview) preview.innerHTML = `<div style="background:var(--surface2);border:2px dashed var(--border2);border-radius:var(--r-lg);padding:16px;text-align:center;color:var(--text3);font-size:13px">No image attached</div>`;
  showToast('Image removed — click Update to save', '');
}

const CHANNEL_PLATFORM_MAP = {
  social:'Instagram', whatsapp:'WhatsApp', email:'Email',
  meta:'Meta Ad', google:'Google Ad'
};

function updateChannelPost(id) {
  const p=(state.posts||[]).find(x=>x.id===id); if(!p) return;
  p.title    = document.getElementById('ep-title').value;
  p.caption  = document.getElementById('ep-caption').value;
  p.date     = document.getElementById('ep-date').value;
  p.time     = document.getElementById('ep-time').value;
  p.status   = document.getElementById('ep-status').value;
  p.assignee = document.getElementById('ep-assign')?.value || p.assignee;
  p.mediaUrl = window._editPostMedia;
  // Move to different channel
  const newCh = document.getElementById('ep-channel')?.value;
  if (newCh && CHANNEL_PLATFORM_MAP[newCh]) p.platform = CHANNEL_PLATFORM_MAP[newCh];
  saveState(); closeModal(); updateBadge(); renderChannelCalendars();
  showToast('✅ Post updated!','success');
}

/* ══════════════════════════════════════════════════════════
   ITEMS LIST
══════════════════════════════════════════════════════════ */
function renderChannelList() {
  const el=document.getElementById('channelItemsList'); if(!el) return;
  let html='';
  switch(activeChannel) {
    case 'social': {
      const items=(state.posts||[]).filter(p=>['Instagram','Facebook','Twitter/X','LinkedIn'].includes(p.platform));
      if(!items.length){el.innerHTML=_empty('📭','No social posts yet','Click any calendar date to add your first post');return;}
      html=items.sort((a,b)=>a.date>b.date?1:-1).map(p=>{
        const pf=PLATFORM_COLORS[p.platform]||{};const st=STATUS_MAP[p.status]||{};
        return `<div class="channel-list-item">
          <div class="platform-icon" style="background:${pf.bg||'#eee'};width:34px;height:34px;font-size:15px;flex-shrink:0">${pf.icon||'📝'}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:var(--text)">${p.title}</div>
            <div style="font-size:11px;color:var(--text3)">${p.platform} · ${fmtDate(p.date)} ${p.time?'at '+p.time:''}</div>
            ${p.caption?`<div style="font-size:11px;color:var(--text2);margin-top:3px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical">${p.caption}</div>`:''}
            ${p.mediaUrl?`<img src="${p.mediaUrl}" style="height:28px;width:auto;border-radius:4px;margin-top:4px;object-fit:cover;border:1px solid var(--border)">`:''}
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0">
            <span class="badge ${st.cls}">${st.label}</span>
            <div style="display:flex;gap:4px">
              <button class="btn btn-ghost btn-sm" onclick="_showEditPostModal(((state.posts||[]).find(x=>x.id===${p.id})))">Edit</button>
              <button class="btn btn-ghost btn-sm" onclick="deletePost(${p.id});renderChannelCalendars()" style="color:var(--coral)">Del</button>
            </div>
          </div>
        </div>`; }).join('');break;}

    case 'whatsapp': {
      const items=(state.posts||[]).filter(p=>p.platform==='WhatsApp');
      if(!items.length){el.innerHTML=_empty('💬','No WhatsApp broadcasts yet','Click any calendar date or + Broadcast');return;}
      html=items.sort((a,b)=>a.date>b.date?1:-1).map(p=>{
        const st=STATUS_MAP[p.status]||{};
        return `<div class="channel-list-item">
          <div style="width:34px;height:34px;border-radius:50%;background:var(--green-light);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">💬</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:var(--text)">${p.title}</div>
            ${p.caption?`<div style="font-size:11px;color:var(--text2);margin-top:2px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${p.caption}</div>`:''}
            <div style="font-size:11px;color:var(--text3);margin-top:3px">${fmtDate(p.date)} · ${p.assignee||'Unassigned'}</div>
            ${p.mediaUrl?`<img src="${p.mediaUrl}" style="height:28px;width:auto;border-radius:4px;margin-top:4px;object-fit:cover;border:1px solid var(--border)">`:''}
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0">
            <span class="badge ${st.cls}">${st.label}</span>
            <div style="display:flex;gap:4px">
              <button class="btn btn-ghost btn-sm" onclick="_showEditPostModal((state.posts||[]).find(x=>x.id===${p.id}))">Edit</button>
              <button class="btn btn-ghost btn-sm" onclick="deletePost(${p.id});renderChannelCalendars()" style="color:var(--coral)">Del</button>
            </div>
          </div>
        </div>`; }).join('');break;}

    case 'email': {
      const items=state.emailCampaigns||[];
      if(!items.length){el.innerHTML=_empty('📧','No email campaigns yet','Click + Email campaign to start');return;}
      html=items.sort((a,b)=>a.date>b.date?1:-1).map(c=>{
        const sc={'sent':'badge-published','scheduled':'badge-scheduled','draft':'badge-draft','paused':'badge-paused'}[c.status]||'badge-normal';
        const sl={'sent':'Sent','scheduled':'Scheduled','draft':'Draft','paused':'Paused'}[c.status]||c.status;
        return `<div class="channel-list-item">
          <div style="width:34px;height:34px;border-radius:8px;background:var(--blue-light);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">📧</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:var(--text)">${c.name}</div>
            <div style="font-size:11px;color:var(--text2);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.subject}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:2px">${fmtDate(c.date)} · ${c.recipients||0} recipients</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0">
            <span class="badge ${sc}">${sl}</span>
            <div style="display:flex;gap:4px">
              <button class="btn btn-ghost btn-sm" onclick="editEmailCampaign(${c.id})">Edit</button>
              <button class="btn btn-ghost btn-sm" onclick="deleteEmailCampaign(${c.id})" style="color:var(--coral)">Del</button>
            </div>
          </div>
        </div>`; }).join('');break;}

    case 'meta': {
      const items=state.ads||[];
      if(!items.length){el.innerHTML=_empty('📊','No Meta ad campaigns yet','Go to Meta Ads Manager');return;}
      html=items.map(a=>{
        const pct=Math.min(100,Math.round(((a.spent||0)/(a.budget||1))*100));
        const fc=pct>90?'var(--coral)':pct>60?'var(--green)':'#7C3AED';
        return `<div class="channel-list-item">
          <div style="width:34px;height:34px;border-radius:8px;background:var(--violet-light);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">📊</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:var(--text)">${a.title}</div>
            <div style="font-size:11px;color:var(--text3)">${a.type} · ${a.objective}</div>
            <div style="display:flex;gap:10px;font-size:11px;color:var(--text2);margin-top:3px">
              <span>₹${(a.budget||0).toLocaleString()}</span><span>Spent ₹${(a.spent||0).toLocaleString()}</span><span>CTR ${a.ctr}%</span>
            </div>
            <div class="progress-bar" style="margin-top:5px;height:4px"><div class="progress-fill" style="width:${pct}%;background:${fc}"></div></div>
          </div>
          <div style="flex-shrink:0"><span class="badge ${a.status==='active'?'badge-published':'badge-paused'}">${a.status}</span></div>
        </div>`; }).join('');break;}

    case 'google': {
      const items=state.googleAds||[];
      if(!items.length){el.innerHTML=_empty('🔍','No Google Ad campaigns yet','Click any date or + Google Ad');return;}
      html=items.sort((a,b)=>a.date>b.date?1:-1).map(a=>{
        const sc={'active':'badge-published','scheduled':'badge-scheduled','draft':'badge-draft','paused':'badge-paused'}[a.status]||'badge-normal';
        return `<div class="channel-list-item">
          <div style="width:34px;height:34px;border-radius:8px;background:#FEE8E7;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">🔍</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:var(--text)">${a.title}</div>
            <div style="font-size:11px;color:var(--text3)">${a.type} · ₹${(a.budget||0).toLocaleString()}/day</div>
            ${a.headline?`<div style="font-size:11px;color:var(--text2);margin-top:2px">"${a.headline}"</div>`:''}
            ${a.keywords?`<div style="font-size:10px;color:var(--text3);margin-top:2px">🔑 ${a.keywords}</div>`:''}
          </div>
          <div style="flex-shrink:0"><span class="badge ${sc}">${a.status}</span></div>
        </div>`; }).join('');break;}
  }
  el.innerHTML=html;
}

function _empty(icon,title,sub) {
  return `<div style="text-align:center;padding:36px;color:var(--text3)"><div style="font-size:32px;margin-bottom:10px">${icon}</div><div style="font-size:14px;font-weight:700;color:var(--text2);margin-bottom:4px">${title}</div><div style="font-size:12px">${sub}</div></div>`;
}

/* ── Month nav ───────────────────────────────────────────── */
function changeChannelMonth(d) {
  channelCalMonth+=d;
  if(channelCalMonth>11){channelCalMonth=0;channelCalYear++;}
  if(channelCalMonth<0){channelCalMonth=11;channelCalYear--;}
  renderChannelGrid(); renderChannelFestivalSidebar();
}
