/* ============ AGENDA ============ */

function renderAgenda() {
  const now = new Date();
  document.getElementById('agendaMonthTitle').textContent =
    MONTH_NAMES[calMonth] + ' ' + calYear + ' — Monthly Plan';

  renderGoals();
  renderAgendaEvents();
  renderAgendaTimeline();

  const notes = document.getElementById('monthNotes');
  if (notes) notes.value = state.notes || '';
}

function renderGoals() {
  const list = document.getElementById('goalsList');
  if (!list) return;
  list.innerHTML = state.goals.map(g => `
    <div class="goal-card">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">
        <div>
          <div class="goal-title">${g.title}</div>
          <div class="goal-desc">${g.desc}</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="deleteGoal(${g.id})" style="flex-shrink:0;color:var(--text3)">✕</button>
      </div>
      <div class="goal-progress-row">
        <span>Progress</span>
        <span style="font-weight:600;color:${g.color}">${g.progress}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${g.progress}%;background:${g.color}"></div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:10px">
        <input type="range" min="0" max="100" value="${g.progress}"
          style="flex:1" oninput="updateGoalProgress(${g.id},this.value)">
        <span style="font-size:11px;color:var(--text3);min-width:28px" id="gp-${g.id}">${g.progress}%</span>
      </div>
    </div>`).join('') || '<div style="color:var(--text3);font-size:13px">No goals set yet.</div>';
}

function updateGoalProgress(id, val) {
  const g = state.goals.find(x => x.id === id);
  if (!g) return;
  g.progress = parseInt(val);
  saveState();
  const label = document.getElementById('gp-' + id);
  if (label) label.textContent = val + '%';
  // update progress bar
  const card = label.closest('.goal-card');
  if (card) {
    const fill = card.querySelector('.progress-fill');
    if (fill) { fill.style.width = val + '%'; fill.style.background = g.color; }
  }
}

function deleteGoal(id) {
  state.goals = state.goals.filter(g => g.id !== id);
  saveState(); renderGoals();
}

function renderAgendaEvents() {
  const list = document.getElementById('eventsList');
  if (!list) return;
  list.innerHTML = state.agendaEvents.map(e => `
    <div class="event-row">
      <div class="event-date-box" style="background:${e.color}22;color:${e.color}">
        <div class="event-day">${e.day}</div>
        <div class="event-mon">${e.month}</div>
      </div>
      <div class="event-info">
        <div class="event-title">${e.title}</div>
        <div class="event-sub">${e.sub}</div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="deleteEvent(${e.id})" style="color:var(--text3)">✕</button>
    </div>`).join('') || '<div style="color:var(--text3);font-size:13px">No events yet.</div>';
}

function deleteEvent(id) {
  state.agendaEvents = state.agendaEvents.filter(e => e.id !== id);
  saveState(); renderAgendaEvents(); renderAgendaTimeline();
}

function renderAgendaTimeline() {
  const tl = document.getElementById('agendaTimeline');
  if (!tl) return;
  const colors = ['var(--brand)', 'var(--green-mid)', 'var(--amber-mid)', 'var(--red)', 'var(--teal)'];
  tl.innerHTML = state.agendaEvents.map((e, i) => `
    <div class="tl-item">
      <div class="tl-dot" style="background:${e.color||colors[i%colors.length]}"></div>
      <div>
        <div class="tl-text">${e.title}</div>
        <div class="tl-date">${e.month} ${e.day}</div>
      </div>
    </div>`).join('') || '<div style="color:var(--text3);font-size:12px">No timeline items.</div>';
}

function addTheme() {
  const theme = prompt('Enter a content theme for this month:');
  if (!theme || !theme.trim()) return;
  const container = document.getElementById('themeChips');
  if (!container) return;
  const chip = document.createElement('span');
  chip.className = 'theme-chip';
  chip.textContent = theme.trim();
  chip.onclick = () => chip.remove();
  container.insertBefore(chip, container.lastElementChild);
}

function saveNotes(val) {
  state.notes = val;
  saveState();
}
