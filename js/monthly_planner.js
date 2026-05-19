/* ============================================================
   MONTHLY CONTENT PLANNER
   - Month selector
   - Content grid planning (what to post)
   - Product targeting
   - Channel themes (Social, WhatsApp, Email, Meta, Google)
   - Random braindump notes
   - Sticky notes that show on calendar
   ============================================================ */

const PLANNER_MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// Channel config for theme cards
const PLANNER_CHANNELS = [
  { key:'social',   label:'📸 Social Media',    color:'#2563EB', bg:'#DBEAFE', placeholder:'e.g. Summer sale launch, product reveals, BTS content, engagement posts…' },
  { key:'whatsapp', label:'💬 WhatsApp',         color:'#10B981', bg:'#ECFDF5', placeholder:'e.g. Exclusive member offers, early access drops, festive greetings…' },
  { key:'email',    label:'📧 Email Marketing',  color:'#6366F1', bg:'#EEF2FF', placeholder:'e.g. Monthly newsletter, abandoned cart recovery, re-engagement blast…' },
  { key:'meta',     label:'📊 Meta Ads',         color:'#7C3AED', bg:'#EDE9FE', placeholder:'e.g. Retargeting campaign, awareness push, lookalike audience sale…' },
  { key:'google',   label:'🔍 Google Ads',       color:'#EA4335', bg:'#FEE2E2', placeholder:'e.g. Search campaign for [product], YouTube pre-roll, Shopping ads…' },
];

// Initialise state for all 12 months
if (!state.monthlyPlans) {
  state.monthlyPlans = {};
}
function _ensureMonth(yr, mo) {
  const key = `${yr}-${mo}`;
  if (!state.monthlyPlans[key]) {
    state.monthlyPlans[key] = {
      products: '',        // target products this month
      contentGrid: '',     // what goes in the grid
      themes: {            // per-channel themes
        social:'', whatsapp:'', email:'', meta:'', google:''
      },
      braindump: '',       // random ideas textarea
      stickyNotes: [],     // sticky notes array [{id,text,color,x,y}]
      goals: '',           // monthly goals text
    };
  }
  return state.monthlyPlans[key];
}

// Current planner month
let plannerYear  = 2026;
let plannerMonth = 4; // May

/* ══════════════════════════════════════════════════════════
   RENDER
══════════════════════════════════════════════════════════ */
function renderMonthlyPlanner() {
  _renderPlannerHeader();
  _renderPlannerContent();
}

function _renderPlannerHeader() {
  const el = document.getElementById('plannerMonthLabel');
  if (el) el.textContent = PLANNER_MONTHS[plannerMonth] + ' ' + plannerYear;
}

function _renderPlannerContent() {
  const plan = _ensureMonth(plannerYear, plannerMonth);

  // Products
  const prod = document.getElementById('plannerProducts');
  if (prod) prod.value = plan.products || '';

  // Content grid
  const grid = document.getElementById('plannerContentGrid');
  if (grid) grid.value = plan.contentGrid || '';

  // Goals
  const goals = document.getElementById('plannerGoals');
  if (goals) goals.value = plan.goals || '';

  // Braindump
  const bd = document.getElementById('plannerBraindump');
  if (bd) bd.value = plan.braindump || '';

  // Channel themes
  PLANNER_CHANNELS.forEach(ch => {
    const el = document.getElementById(`theme-${ch.key}`);
    if (el) el.value = (plan.themes && plan.themes[ch.key]) || '';
  });

  // Sticky notes
  _renderStickyNotes();
}

function savePlannerField(field, value, channelKey) {
  const plan = _ensureMonth(plannerYear, plannerMonth);
  if (channelKey) {
    plan.themes[channelKey] = value;
  } else {
    plan[field] = value;
  }
  saveState();
  // If sticky notes exist, refresh calendar pills
  if (typeof renderChannelGrid === 'function') renderChannelGrid();
}

function changePlannerMonth(d) {
  plannerMonth += d;
  if (plannerMonth > 11) { plannerMonth = 0; plannerYear++; }
  if (plannerMonth < 0)  { plannerMonth = 11; plannerYear--; }
  _renderPlannerHeader();
  _renderPlannerContent();
}

/* ══════════════════════════════════════════════════════════
   STICKY NOTES
══════════════════════════════════════════════════════════ */
const STICKY_COLORS = [
  '#FEF9C3','#DBEAFE','#DCFCE7','#FCE7F3','#EDE9FE',
  '#FFEDD5','#F0FDFA','#FEE2E2','#F0F9FF','#FFFBEB'
];

function _renderStickyNotes() {
  const board = document.getElementById('stickyBoard');
  if (!board) return;
  const plan  = _ensureMonth(plannerYear, plannerMonth);
  const notes = plan.stickyNotes || [];

  // Keep the add button, render note cards
  const existingBtn = board.querySelector('.sticky-add-btn');
  board.innerHTML = '';

  // Re-add "+" button
  const addBtn = document.createElement('div');
  addBtn.className = 'sticky-add-btn';
  addBtn.innerHTML = `<span style="font-size:24px">+</span><div style="font-size:11px;font-weight:700;margin-top:4px">Add sticky note</div>`;
  addBtn.onclick = () => addStickyNote();
  board.appendChild(addBtn);

  notes.forEach(note => {
    const card = document.createElement('div');
    card.className = 'sticky-note';
    card.id = 'sticky-' + note.id;
    card.style.background = note.color || '#FEF9C3';

    // Drag position
    if (note.x !== undefined) {
      card.style.left  = note.x + 'px';
      card.style.top   = note.y + 'px';
    }

    card.innerHTML = `
      <div class="sticky-note-header">
        <div class="sticky-color-dots">
          ${STICKY_COLORS.map(c => `<div class="sticky-dot" style="background:${c}" onclick="changeStickyColor(${note.id},'${c}',event)"></div>`).join('')}
        </div>
        <button class="sticky-del" onclick="deleteStickyNote(${note.id})">✕</button>
      </div>
      <textarea class="sticky-textarea" placeholder="Write your note…"
        onchange="updateStickyText(${note.id},this.value)"
        oninput="autoResizeSticky(this)">${note.text || ''}</textarea>
      <div class="sticky-footer">
        <span style="font-size:10px;color:rgba(0,0,0,.35);font-weight:500">📌 shows on calendar</span>
      </div>`;

    // Make draggable inside board
    _makeStickyDraggable(card, note.id);
    board.appendChild(card);
  });
}

function addStickyNote() {
  const plan = _ensureMonth(plannerYear, plannerMonth);
  if (!plan.stickyNotes) plan.stickyNotes = [];
  const colors = STICKY_COLORS;
  const color  = colors[plan.stickyNotes.length % colors.length];
  // Place new notes slightly offset from each other
  const offset = plan.stickyNotes.length * 20;
  plan.stickyNotes.push({
    id: genId(), text: '', color,
    x: 20 + (offset % 180), y: 20 + (offset % 100)
  });
  saveState();
  _renderStickyNotes();
  _refreshCalStickyBanner();
  showToast('📌 Sticky note added!', 'success');
}

function deleteStickyNote(id) {
  const plan = _ensureMonth(plannerYear, plannerMonth);
  plan.stickyNotes = (plan.stickyNotes || []).filter(n => n.id !== id);
  saveState();
  _renderStickyNotes();
  _refreshCalStickyBanner();
}

function updateStickyText(id, text) {
  const plan = _ensureMonth(plannerYear, plannerMonth);
  const note = (plan.stickyNotes || []).find(n => n.id === id);
  if (note) {
    note.text = text;
    saveState();
    _refreshCalStickyBanner();
  }
}

function _refreshCalStickyBanner() {
  // Update the banner on the calendar view if it's visible
  const banner = document.getElementById('calStickyBanner');
  if (!banner) return;
  const notes = getStickyNotesForMonth(plannerYear, plannerMonth);
  if (notes.length) {
    banner.innerHTML = notes.map(n => `
      <div class="cal-sticky-banner-note" style="background:${n.color||'#FEF9C3'}">
        <span class="sticky-pin-icon">📌</span>
        <span>${(n.text||'').trim() || '<em style="opacity:.5">empty note</em>'}</span>
      </div>`).join('');
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }
}

function changeStickyColor(id, color, event) {
  event.stopPropagation();
  const plan = _ensureMonth(plannerYear, plannerMonth);
  const note = (plan.stickyNotes || []).find(n => n.id === id);
  if (note) {
    note.color = color;
    saveState();
    const card = document.getElementById('sticky-' + id);
    if (card) card.style.background = color;
  }
}

function autoResizeSticky(ta) {
  ta.style.height = 'auto';
  ta.style.height = Math.max(80, ta.scrollHeight) + 'px';
}

function _makeStickyDraggable(card, noteId) {
  let startX, startY, startLeft, startTop;

  card.addEventListener('mousedown', e => {
    // Don't drag when clicking textarea, buttons, dots
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON' || e.target.classList.contains('sticky-dot')) return;
    e.preventDefault();
    const board = document.getElementById('stickyBoard');
    const br    = board.getBoundingClientRect();
    startX    = e.clientX;
    startY    = e.clientY;
    startLeft = card.offsetLeft;
    startTop  = card.offsetTop;
    card.style.zIndex = 100;

    function onMove(e) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      card.style.left = Math.max(0, startLeft + dx) + 'px';
      card.style.top  = Math.max(0, startTop  + dy) + 'px';
    }
    function onUp() {
      card.style.zIndex = '';
      // Save position
      const plan = _ensureMonth(plannerYear, plannerMonth);
      const note = (plan.stickyNotes || []).find(n => n.id === noteId);
      if (note) {
        note.x = parseInt(card.style.left);
        note.y = parseInt(card.style.top);
        saveState();
      }
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

/* ══════════════════════════════════════════════════════════
   STICKY NOTES ON CALENDAR
   Called from channel_calendars.js renderChannelGrid()
   Shows a tiny sticky pin on days that have notes
══════════════════════════════════════════════════════════ */
function getStickyNotesForMonth(yr, mo) {
  const key  = `${yr}-${mo}`;
  const plan = state.monthlyPlans && state.monthlyPlans[key];
  return (plan && plan.stickyNotes) ? plan.stickyNotes.filter(n => n.text && n.text.trim()) : [];
}

/* ══════════════════════════════════════════════════════════
   CONTENT GRID QUICK FILL helpers
══════════════════════════════════════════════════════════ */
function fillContentGridTemplate() {
  const el = document.getElementById('plannerContentGrid');
  if (!el || el.value.trim()) return; // don't overwrite existing
  const mo = PLANNER_MONTHS[plannerMonth];
  el.value = `WEEK 1 (${mo} 1–7):
- Post 1: [Topic / product]
- Post 2: [Topic / product]
- Story: [Engagement / poll]

WEEK 2 (${mo} 8–14):
- Post 1: [Topic / product]
- Post 2: [Behind the scenes]
- Reel: [Trending format]

WEEK 3 (${mo} 15–21):
- Post 1: [Topic / product]
- Post 2: [Customer spotlight]
- Story: [Q&A or poll]

WEEK 4 (${mo} 22–end):
- Post 1: [Month recap / offer]
- Post 2: [Upcoming teaser]
- Reel: [Review / UGC]`;
  savePlannerField('contentGrid', el.value);
  autoResizeTA(el);
}

function autoResizeTA(ta) {
  if (!ta) return;
  ta.style.height = 'auto';
  ta.style.height = ta.scrollHeight + 'px';
}
