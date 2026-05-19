/* ============ ANALYTICS ============ */

function renderAnalytics() {
  renderAnalyticsStats();
  setTimeout(() => {
    drawPlatformChart();
    drawStatusChart();
    drawTimelineChart();
  }, 50);
}

function renderAnalyticsStats() {
  const el = document.getElementById('analyticsStats');
  if (!el) return;
  const total = state.posts.length;
  const published = state.posts.filter(p => p.status === 'published').length;
  const scheduled = state.posts.filter(p => p.status === 'scheduled').length;
  const drafts = state.posts.filter(p => p.status === 'draft').length;
  el.innerHTML = `
    <div class="meta-stat-card"><div class="msc-label">Total posts</div><div class="msc-val">${total}</div><div class="msc-sub">All time</div></div>
    <div class="meta-stat-card"><div class="msc-label">Published</div><div class="msc-val">${published}</div><div class="msc-sub"><span class="msc-trend up">↑ ${Math.round(published/Math.max(total,1)*100)}%</span> of total</div></div>
    <div class="meta-stat-card"><div class="msc-label">Scheduled</div><div class="msc-val">${scheduled}</div><div class="msc-sub">Upcoming</div></div>
    <div class="meta-stat-card"><div class="msc-label">Drafts</div><div class="msc-val">${drafts}</div><div class="msc-sub">Need attention</div></div>`;
}

function drawPlatformChart() {
  const canvas = document.getElementById('platformChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const platforms = {};
  state.posts.forEach(p => { platforms[p.platform] = (platforms[p.platform] || 0) + 1; });
  const labels = Object.keys(platforms);
  const values = Object.values(platforms);
  const colors = ['#FBEAF0','#E6F1FB','#EAF3DE','#E1F5EE','#EEEDFE','#FAEEDA'];
  const borderColors = ['#FF3D8A','#3B82F6','#10B981','#0D9488','#7C3AED','#F59E0B'];

  const w = canvas.offsetWidth || 380;
  canvas.width = w; canvas.height = 220;
  ctx.clearRect(0, 0, w, 220);

  if (!labels.length) {
    ctx.fillStyle = '#A09DB8'; ctx.font = '13px DM Sans'; ctx.textAlign = 'center';
    ctx.fillText('No posts yet', w/2, 110); return;
  }

  const total = values.reduce((s, v) => s + v, 0);
  const cx = w/2, cy = 100, r = 75, ir = 40;
  let angle = -Math.PI/2;

  values.forEach((v, i) => {
    const slice = (v / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = borderColors[i % borderColors.length];
    ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    angle += slice;
  });

  // donut hole
  ctx.beginPath(); ctx.arc(cx, cy, ir, 0, 2*Math.PI);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--surface') || '#fff';
  ctx.fill();

  // center text
  ctx.fillStyle = '#1A1825'; ctx.font = 'bold 20px DM Sans'; ctx.textAlign = 'center';
  ctx.fillText(total, cx, cy + 6);
  ctx.font = '11px DM Sans'; ctx.fillStyle = '#A09DB8';
  ctx.fillText('total', cx, cy + 20);

  // legend
  const legendY = 185;
  let lx = 20;
  labels.forEach((l, i) => {
    ctx.fillStyle = borderColors[i % borderColors.length];
    ctx.fillRect(lx, legendY, 10, 10);
    ctx.fillStyle = '#6B6880'; ctx.font = '11px DM Sans'; ctx.textAlign = 'left';
    ctx.fillText(l + ' (' + values[i] + ')', lx + 14, legendY + 9);
    lx += ctx.measureText(l + ' (' + values[i] + ')').width + 30;
    if (lx > w - 60) lx = 20;
  });
}

function drawStatusChart() {
  const canvas = document.getElementById('statusChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const statuses = { draft: 0, review: 0, scheduled: 0, published: 0 };
  state.posts.forEach(p => { if (statuses[p.status] !== undefined) statuses[p.status]++; });

  const labels = ['Draft', 'In Review', 'Scheduled', 'Published'];
  const values = [statuses.draft, statuses.review, statuses.scheduled, statuses.published];
  const colors = ['#BA7517','#993556','#185FA5','#639922'];

  const w = canvas.offsetWidth || 380;
  canvas.width = w; canvas.height = 220;
  ctx.clearRect(0, 0, w, 220);

  const barH = 30, gap = 12, maxVal = Math.max(...values, 1);
  const maxW = w - 100;

  labels.forEach((l, i) => {
    const y = 20 + i * (barH + gap);
    const bw = (values[i] / maxVal) * maxW;
    ctx.fillStyle = '#F4F3F8';
    ctx.fillRect(80, y, maxW, barH);
    ctx.fillStyle = colors[i];
    ctx.fillRect(80, y, bw, barH);
    ctx.fillStyle = '#6B6880'; ctx.font = '12px DM Sans'; ctx.textAlign = 'right';
    ctx.fillText(l, 74, y + 19);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = 'bold 13px DM Sans';
    if (bw > 30) ctx.fillText(values[i], 88, y + 20);
    else { ctx.fillStyle = '#1A1825'; ctx.fillText(values[i], 84 + bw, y + 20); }
  });
}

function drawTimelineChart() {
  const canvas = document.getElementById('timelineChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.offsetWidth || 760;
  canvas.width = w; canvas.height = 180;
  ctx.clearRect(0, 0, w, 180);

  // count by month
  const months = {};
  SHORT_MONTHS.forEach(m => months[m] = 0);
  state.posts.forEach(p => {
    if (p.date) {
      const m = parseInt(p.date.split('-')[1]) - 1;
      months[SHORT_MONTHS[m]]++;
    }
  });

  const labels = SHORT_MONTHS;
  const values = labels.map(l => months[l] || 0);
  const maxVal = Math.max(...values, 1);
  const padL = 40, padR = 20, padT = 20, padB = 40;
  const chartW = w - padL - padR;
  const chartH = 180 - padT - padB;
  const stepX = chartW / (labels.length - 1);

  // grid lines
  for (let i = 0; i <= 4; i++) {
    const y = padT + (chartH / 4) * i;
    ctx.strokeStyle = '#EEEDF5'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
    ctx.fillStyle = '#A09DB8'; ctx.font = '10px DM Sans'; ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxVal - (maxVal/4)*i), padL - 6, y + 4);
  }

  // area fill
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = padL + i * stepX;
    const y = padT + chartH - (v / maxVal) * chartH;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo(padL + (labels.length-1)*stepX, padT+chartH);
  ctx.lineTo(padL, padT+chartH); ctx.closePath();
  const grad = ctx.createLinearGradient(0, padT, 0, padT+chartH);
  grad.addColorStop(0, 'rgba(255,61,138,0.25)');
  grad.addColorStop(1, 'rgba(255,61,138,0)');
  ctx.fillStyle = grad; ctx.fill();

  // line
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = padL + i * stepX;
    const y = padT + chartH - (v / maxVal) * chartH;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#FF3D8A'; ctx.lineWidth = 2.5; ctx.stroke();

  // dots + labels
  values.forEach((v, i) => {
    const x = padL + i * stepX;
    const y = padT + chartH - (v / maxVal) * chartH;
    ctx.beginPath(); ctx.arc(x, y, 4, 0, 2*Math.PI);
    ctx.fillStyle = '#FF3D8A'; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 2, 0, 2*Math.PI); ctx.fill();
    ctx.fillStyle = '#6B6880'; ctx.font = '10px DM Sans'; ctx.textAlign = 'center';
    ctx.fillText(labels[i], x, 180 - 8);
  });
}
