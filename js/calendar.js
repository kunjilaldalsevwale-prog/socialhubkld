/* ============================================================
   CALENDAR — with day drawer, Indian occasions, create form
   ============================================================ */
let calYear = 2026, calMonth = 4;
let selectedDate = null; // currently open date string YYYY-MM-DD

/* ── BUILD FULL CALENDAR ──────────────────────── */
function buildCalendar() {
  renderCalGrid();
  renderUpcoming();
}

/* ── RENDER MONTH GRID ────────────────────────── */
function renderCalGrid() {
  const grid = document.getElementById('calGrid');
  const label = document.getElementById('calMonthLabel');
  if (!grid) return;

  label.textContent = MONTH_NAMES[calMonth] + ' ' + calYear;
  grid.innerHTML = '';

  const firstDay  = new Date(calYear, calMonth, 1).getDay();
  const daysInMo  = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrev= new Date(calYear, calMonth, 0).getDate();
  const today     = new Date();

  const postsThisMo = state.posts.filter(p => {
    if (!p.date) return false;
    const [y, m] = p.date.split('-');
    return parseInt(y) === calYear && parseInt(m) - 1 === calMonth;
  });

  for (let i = 0; i < 42; i++) {
    let day, mo = calMonth, yr = calYear, other = false;

    if (i < firstDay) {
      day = daysInPrev - firstDay + i + 1;
      mo = calMonth - 1; if (mo < 0) { mo = 11; yr--; }
      other = true;
    } else if (i >= firstDay + daysInMo) {
      day = i - firstDay - daysInMo + 1;
      mo = calMonth + 1; if (mo > 11) { mo = 0; yr++; }
      other = true;
    } else {
      day = i - firstDay + 1;
    }

    const dateStr = `${yr}-${String(mo+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const cell = document.createElement('div');
    cell.className = 'cal-cell';
    if (other) cell.classList.add('other-month');
    if (!other && day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear())
      cell.classList.add('today');
    if (!other && dateStr === selectedDate) cell.classList.add('selected');

    const dayPosts = other ? [] : postsThisMo.filter(p => parseInt(p.date.split('-')[2]) === day);
    const occasions = other ? [] : getOccasions(dateStr);

    /* ── cell header ── */
    const numWrap = document.createElement('div');
    numWrap.className = 'cell-num-wrap';

    const numEl = document.createElement('div');
    numEl.className = 'cell-num';
    numEl.textContent = day;
    numWrap.appendChild(numEl);

    // occasion dot indicators (up to 2)
    if (!other && occasions.length) {
      const dots = document.createElement('div');
      dots.className = 'cell-occasion-dots';
      occasions.slice(0, 2).forEach(oc => {
        const d = document.createElement('span');
        d.className = 'oc-dot';
        d.style.background = oc.color;
        d.title = oc.name;
        dots.appendChild(d);
      });
      numWrap.appendChild(dots);
    }

    if (!other && dayPosts.length > 0) {
      const cnt = document.createElement('div');
      cnt.className = 'cell-post-count';
      cnt.textContent = dayPosts.length;
      numWrap.appendChild(cnt);
    }
    cell.appendChild(numWrap);

    /* ── occasions strip ── */
    if (!other && occasions.length) {
      occasions.slice(0, 1).forEach(oc => {
        const strip = document.createElement('div');
        strip.className = 'cell-occasion-strip';
        strip.style.background = oc.color + '22';
        strip.style.color = oc.color;
        strip.style.borderLeft = `3px solid ${oc.color}`;
        strip.innerHTML = `<span>${oc.emoji}</span> <span class="oc-name">${oc.name}</span>`;
        cell.appendChild(strip);
      });
    }

    /* ── posts pills ── */
    const postsWrap = document.createElement('div');
    postsWrap.className = 'cell-posts';
    if (!other) {
      dayPosts.slice(0, 2).forEach(p => {
        const pf = PLATFORM_COLORS[p.platform] || {};
        const pill = document.createElement('div');
        pill.className = 'cal-post-pill ' + (pf.pill || '');
        pill.innerHTML = `<span>${pf.icon||''}</span><span class="pill-text">${p.title}</span>`;
        pill.title = p.title + ' · ' + p.status;
        pill.onclick = e => { e.stopPropagation(); openDayDrawer(dateStr); };
        postsWrap.appendChild(pill);
      });
      if (dayPosts.length > 2) {
        const more = document.createElement('div');
        more.className = 'pill-more';
        more.textContent = '+' + (dayPosts.length - 2) + ' more';
        postsWrap.appendChild(more);
      }
    }
    cell.appendChild(postsWrap);

    if (!other) {
      cell.onclick = () => openDayDrawer(dateStr);
    }
    grid.appendChild(cell);
  }
}

/* ══════════════════════════════════════════════════
   DAY DRAWER — opens a full side panel when clicking a date
══════════════════════════════════════════════════ */
function openDayDrawer(dateStr) {
  selectedDate = dateStr;
  renderCalGrid(); // re-render to highlight selected

  const drawer = document.getElementById('dayDrawer');
  if (!drawer) return;
  drawer.classList.add('open');

  const [yr, mo, dy] = dateStr.split('-');
  const dateLabel = parseInt(dy) + ' ' + MONTH_NAMES[parseInt(mo)-1] + ' ' + yr;
  const occasions = getOccasions(dateStr);
  const dayPosts  = state.posts.filter(p => p.date === dateStr);

  document.getElementById('drawerDateLabel').textContent = dateLabel;

  // ── occasions section ──
  const ocEl = document.getElementById('drawerOccasions');
  if (occasions.length) {
    ocEl.innerHTML = occasions.map(oc => `
      <div class="drawer-occasion" style="border-left:3px solid ${oc.color};background:${oc.color}18">
        <span style="font-size:18px">${oc.emoji}</span>
        <div>
          <div class="doc-name">${oc.name}</div>
          <div class="doc-type">${capitalize(oc.type)} occasion</div>
        </div>
        <button class="btn btn-sm btn-primary" onclick="prefillOccasionPost('${dateStr}','${oc.name.replace(/'/g,"\\'")}','${oc.emoji}')" style="margin-left:auto">
          + Plan post
        </button>
      </div>`).join('');
    document.getElementById('drawerOccasionsSection').style.display = '';
  } else {
    document.getElementById('drawerOccasionsSection').style.display = 'none';
  }

  // ── existing posts for this date ──
  const postsEl = document.getElementById('drawerPosts');
  if (dayPosts.length) {
    postsEl.innerHTML = dayPosts.map(p => {
      const pf = PLATFORM_COLORS[p.platform] || {};
      const st = STATUS_MAP[p.status] || {};
      return `<div class="drawer-post-card">
        <div class="dpc-top">
          <div class="platform-icon" style="background:${pf.bg||'#eee'};width:32px;height:32px;font-size:14px">${pf.icon||'📝'}</div>
          <div style="flex:1;min-width:0">
            <div class="dpc-title">${p.title}</div>
            <div class="dpc-sub">${p.platform} · ${p.time||'09:00'}</div>
          </div>
          <span class="badge ${st.cls}">${st.label}</span>
        </div>
        ${p.caption ? `<div class="dpc-caption">${p.caption}</div>` : ''}
        <div class="dpc-actions">
          <button class="btn btn-ghost btn-sm" onclick="drawerEditPost(${p.id})">✏️ Edit</button>
          <button class="btn btn-ghost btn-sm" onclick="changePostStatus(${p.id});openDayDrawer('${dateStr}')">↻ Status</button>
          <button class="btn btn-ghost btn-sm" style="color:var(--coral)" onclick="deletePost(${p.id});openDayDrawer('${dateStr}')">🗑 Delete</button>
        </div>
      </div>`;
    }).join('');
    document.getElementById('drawerPostsSection').style.display = '';
  } else {
    document.getElementById('drawerPostsSection').style.display = 'none';
  }

  // ── inline create form ──
  renderDrawerForm(dateStr);
}

function closeDayDrawer() {
  const drawer = document.getElementById('dayDrawer');
  if (drawer) drawer.classList.remove('open');
  selectedDate = null;
  renderCalGrid();
}

function drawerEditPost(id) {
  closeDayDrawer();
  navigate('create', document.querySelector('.nav-item[data-view="create"]'));
  setTimeout(() => loadPostIntoForm(id), 60);
}

/* ── DRAWER INLINE CREATE FORM ─────────────── */
function renderDrawerForm(dateStr) {
  const formEl = document.getElementById('drawerCreateForm');
  if (!formEl) return;

  formEl.innerHTML = `
    <div class="dcf-section-title">+ Plan new post for this day</div>

    <div class="form-group">
      <label class="form-label">Post title *</label>
      <input class="form-input" id="dcf-title" placeholder="e.g. Diwali sale announcement">
    </div>

    <div class="form-group">
      <label class="form-label">Caption</label>
      <textarea class="form-input form-textarea" id="dcf-caption" rows="3"
        placeholder="Write your caption, hashtags…" style="min-height:70px"
        oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px'"></textarea>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="form-group">
        <label class="form-label">Platform</label>
        <select class="form-select" id="dcf-platform">
          <option>Instagram</option><option>Facebook</option>
          <option>WhatsApp</option><option>Twitter/X</option>
          <option>LinkedIn</option><option>Meta Ad</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Time</label>
        <input class="form-input" type="time" id="dcf-time" value="09:00">
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="form-group">
        <label class="form-label">Post type</label>
        <select class="form-select" id="dcf-type">
          <option>Image post</option><option>Video / Reel</option>
          <option>Carousel</option><option>Story</option><option>Text only</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-select" id="dcf-status">
          <option value="draft">Draft</option>
          <option value="review">In review</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Assign to</label>
      <select class="form-select" id="dcf-assign">
        <option value="">— unassigned —</option>
        ${state.team.map(m => `<option>${m.name}</option>`).join('')}
      </select>
    </div>

    <div class="dcf-actions">
      <button class="btn btn-ghost btn-sm" onclick="closeDayDrawer()">Cancel</button>
      <button class="btn btn-primary" onclick="saveDrawerPost('${dateStr}')">💾 Save post</button>
    </div>`;
}

function prefillOccasionPost(dateStr, occasionName, emoji) {
  openDayDrawer(dateStr);
  setTimeout(() => {
    const titleEl = document.getElementById('dcf-title');
    const capEl   = document.getElementById('dcf-caption');
    if (titleEl) titleEl.value = emoji + ' ' + occasionName + ' — post';
    if (capEl)   capEl.value   = `Wishing everyone a wonderful ${occasionName}! ${emoji}\n\n#${occasionName.replace(/[^a-zA-Z]/g,'')} #India #Festival`;
  }, 50);
}

function saveDrawerPost(dateStr) {
  const title = (document.getElementById('dcf-title').value || '').trim();
  if (!title) { showToast('Enter a post title', 'error'); return; }

  const platform = document.getElementById('dcf-platform').value;
  const post = {
    id: genId(), title,
    caption  : document.getElementById('dcf-caption').value,
    platform, platforms: [platform],
    date: dateStr,
    time     : document.getElementById('dcf-time').value,
    status   : document.getElementById('dcf-status').value,
    type     : document.getElementById('dcf-type').value,
    assignee : document.getElementById('dcf-assign').value,
    priority : 'normal', hashtags: '', brief: '', notes: '',
    created  : new Date().toISOString().split('T')[0],
  };
  state.posts.push(post);
  saveState();
  updateBadge();
  showToast('✨ Post saved!', 'success');
  openDayDrawer(dateStr); // refresh drawer to show new post
}

/* ── UPCOMING LIST ────────────────────────────── */
function renderUpcoming() {
  const list = document.getElementById('upcomingList');
  if (!list) return;
  const upcoming = state.posts
    .filter(p => p.date && p.status !== 'published')
    .sort((a, b) => a.date > b.date ? 1 : -1)
    .slice(0, 7);

  list.innerHTML = upcoming.map(p => {
    const pf = PLATFORM_COLORS[p.platform] || {};
    const st = STATUS_MAP[p.status] || {};
    return `<div class="upcoming-item" onclick="openDayDrawer('${p.date}')">
      <div class="upcoming-date">${fmtDate(p.date)} · ${p.platform}</div>
      <div class="upcoming-title">${pf.icon||''} ${p.title}</div>
      <span class="badge ${st.cls}" style="margin-top:4px">${st.label}</span>
    </div>`;
  }).join('') || '<div style="color:var(--text3);font-size:12px;font-weight:500;padding:6px 0">No upcoming posts</div>';
}

/* ── CONTROLS ─────────────────────────────────── */
function changeMonth(d) {
  calMonth += d;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0)  { calMonth = 11; calYear--; }
  closeDayDrawer();
  buildCalendar();
}
function goToday() {
  const n = new Date(); calYear = n.getFullYear(); calMonth = n.getMonth();
  closeDayDrawer(); buildCalendar();
}
function setCalView(v, el) {
  document.querySelectorAll('.vtbtn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

/* ── HELPERS ──────────────────────────────────── */
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

// legacy quickAdd kept for sidebar widget
function quickAdd() {
  const title    = document.getElementById('quickPostTitle').value.trim();
  const date     = document.getElementById('quickPostDate').value;
  const platform = document.getElementById('quickPostPlatform').value;
  if (!title || !date) { showToast('Enter a title and date', 'error'); return; }
  const post = {
    id: genId(), title, platform, platforms: [platform], date,
    time: (state.settings && state.settings.defaultTime) || '09:00',
    status: 'draft', type: 'Image post', caption: '',
    hashtags: '', brief: '', assignee: '', priority: 'normal',
    notes: '', created: new Date().toISOString().split('T')[0]
  };
  state.posts.push(post);
  saveState();
  document.getElementById('quickPostTitle').value = '';
  buildCalendar();
  updateBadge();
  openDayDrawer(date);
  showToast('✨ Added to calendar!', 'success');
}

// old showPostModal kept for any stray calls
function showPostModal(id) { const p = state.posts.find(x=>x.id===id); if(p) openDayDrawer(p.date); }
function editPostById(id) { drawerEditPost(id); }
