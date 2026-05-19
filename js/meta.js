/* ============ META ADS ============ */

function renderMetaAds() {
  renderMetaStats();
  renderAdCards();
}

function renderMetaStats() {
  const row = document.getElementById('metaStatsRow');
  if (!row) return;
  const totalBudget = state.ads.reduce((s, a) => s + a.budget, 0);
  const totalSpent = state.ads.reduce((s, a) => s + a.spent, 0);
  const totalReach = state.ads.reduce((s, a) => s + a.reach, 0);
  const totalClicks = state.ads.reduce((s, a) => s + a.clicks, 0);
  const avgCTR = state.ads.length ? (state.ads.reduce((s, a) => s + parseFloat(a.ctr), 0) / state.ads.length).toFixed(2) : '0.00';

  row.innerHTML = `
    <div class="meta-stat-card">
      <div class="msc-label">Total budget</div>
      <div class="msc-val">₹${(totalBudget/1000).toFixed(0)}k</div>
      <div class="msc-sub">${state.ads.length} active campaigns</div>
    </div>
    <div class="meta-stat-card">
      <div class="msc-label">Total spent</div>
      <div class="msc-val">₹${(totalSpent/1000).toFixed(1)}k</div>
      <div class="msc-sub"><span class="msc-trend up">↑ 18%</span> vs last month</div>
    </div>
    <div class="meta-stat-card">
      <div class="msc-label">Total reach</div>
      <div class="msc-val">${(totalReach/1000).toFixed(0)}k</div>
      <div class="msc-sub"><span class="msc-trend up">↑ 24%</span> vs last month</div>
    </div>
    <div class="meta-stat-card">
      <div class="msc-label">Avg. CTR</div>
      <div class="msc-val">${avgCTR}%</div>
      <div class="msc-sub">${totalClicks.toLocaleString()} total clicks</div>
    </div>`;
}

function renderAdCards() {
  const grid = document.getElementById('adsGrid');
  if (!grid) return;
  if (!state.ads.length) {
    grid.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text3);grid-column:1/-1">
      <div style="font-size:32px;margin-bottom:8px">📊</div>
      <div>No campaigns yet. Create your first Meta Ad campaign.</div>
    </div>`;
    return;
  }
  grid.innerHTML = state.ads.map(a => {
    const pct = Math.min(100, Math.round((a.spent / a.budget) * 100));
    const fillColor = pct > 90 ? 'var(--red)' : pct > 70 ? 'var(--green-mid)' : 'var(--brand)';
    const statusBadge = a.status === 'active'
      ? `<span class="badge badge-published">● Active</span>`
      : `<span class="badge badge-draft">⏸ Paused</span>`;
    return `<div class="ad-card">
      <div class="ad-card-header">
        <div class="ad-icon-box">📊</div>
        <div>
          <div class="ad-title">${a.title}</div>
          <div class="ad-type">${a.type}</div>
        </div>
        ${statusBadge}
      </div>
      <div class="ad-stat-row"><span class="asr-label">Objective</span><span class="asr-val">${a.objective}</span></div>
      <div class="ad-stat-row"><span class="asr-label">Audience</span><span class="asr-val" style="font-size:11px">${a.audience}</span></div>
      <div class="ad-stat-row"><span class="asr-label">Budget</span><span class="asr-val">₹${a.budget.toLocaleString()}</span></div>
      <div class="ad-stat-row"><span class="asr-label">Spent</span><span class="asr-val">₹${a.spent.toLocaleString()}</span></div>
      <div class="ad-stat-row"><span class="asr-label">Reach</span><span class="asr-val">${a.reach.toLocaleString()}</span></div>
      <div class="ad-stat-row"><span class="asr-label">Clicks</span><span class="asr-val">${a.clicks.toLocaleString()}</span></div>
      <div class="ad-stat-row"><span class="asr-label">CTR</span><span class="asr-val">${a.ctr}%</span></div>
      <div class="ad-stat-row"><span class="asr-label">CPC</span><span class="asr-val">₹${a.cpc}</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${fillColor}"></div></div>
      <div class="progress-label">${pct}% of budget used</div>
      <div class="ad-actions">
        <button class="btn btn-ghost btn-sm" onclick="toggleAdStatus(${a.id})">${a.status==='active'?'⏸ Pause':'▶ Resume'}</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteAd(${a.id})" style="color:var(--red)">Delete</button>
      </div>
    </div>`;
  }).join('');
}

function toggleAdStatus(id) {
  const a = state.ads.find(x => x.id === id);
  if (!a) return;
  a.status = a.status === 'active' ? 'paused' : 'active';
  saveState();
  renderAdCards();
  showToast('Campaign ' + (a.status === 'active' ? 'resumed' : 'paused'), 'success');
}

function deleteAd(id) {
  if (!confirm('Delete this campaign?')) return;
  state.ads = state.ads.filter(a => a.id !== id);
  saveState();
  renderMetaAds();
  showToast('Campaign deleted');
}
