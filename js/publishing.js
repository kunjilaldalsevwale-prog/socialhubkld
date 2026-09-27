/* ============================================================
   PUBLISHING — Queue of approved designs ready to post
   ============================================================ */

function renderPublishing() {
  const el = document.getElementById('publishingQueue');
  if (!el) return;
  const queue = state.publishingQueue || [];

  if (!queue.length) {
    el.innerHTML = `
      <div style="text-align:center;padding:60px;color:var(--text3)">
        <div style="font-size:56px;margin-bottom:16px">🚀</div>
        <div style="font-size:17px;font-weight:800;color:var(--text2);margin-bottom:8px">No posts ready yet</div>
        <div style="font-size:13px;line-height:1.7;max-width:400px;margin:0 auto">
          When a designer uploads a final design and it gets approved in Monthly Planner,
          it will appear here ready to schedule and publish.
        </div>
      </div>`;
    return;
  }

  el.innerHTML = queue.map((post, i) => `
    <div style="background:var(--white);border-radius:22px;overflow:hidden;box-shadow:var(--sh-sm);border:1px solid var(--border);margin-bottom:24px">

      <!-- Image — large -->
      <div style="position:relative;background:#000;max-height:500px;overflow:hidden;cursor:zoom-in" onclick="_openPublishLightbox('${post.imageUrl}','${post.imageName||''}')">
        ${_pubIsVideo(post.imageName)
          ? `<video src="${post.imageUrl}" style="width:100%;max-height:500px;display:block;object-fit:contain"></video>`
          : `<img src="${post.imageUrl}" style="width:100%;max-height:500px;object-fit:contain;display:block">`}
        <!-- Status badge -->
        <div style="position:absolute;top:14px;right:14px">
          <span style="padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;background:${post.status==='published'?'#ECFDF5':post.status==='scheduled'?'#EFF6FF':'#FEF9C3'};color:${post.status==='published'?'#065F46':post.status==='scheduled'?'#1D4ED8':'#92400E'}">
            ${post.status==='published'?'✅ Published':post.status==='scheduled'?'🕐 Scheduled':'⏳ Ready to post'}
          </span>
        </div>
      </div>

      <!-- Details -->
      <div style="padding:24px">

        <!-- Caption (editable) -->
        <div style="margin-bottom:16px">
          <div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Caption</div>
          <textarea class="form-input" rows="4" style="font-size:14px;line-height:1.7;min-height:100px"
            placeholder="Add caption…"
            oninput="updatePublishField(${i},'caption',this.value)">${post.caption||''}</textarea>
        </div>

        <!-- Hashtags -->
        <div style="margin-bottom:16px">
          <div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Hashtags</div>
          <input class="form-input" value="${post.hashtags||''}" placeholder="#kunjilal #namkeen #snacks…"
            oninput="updatePublishField(${i},'hashtags',this.value)">
        </div>

        <!-- Schedule -->
        <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap">
          <div style="flex:1;min-width:140px">
            <div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Date</div>
            <input class="form-input" type="date" value="${post.scheduleDate||post.date||''}"
              oninput="updatePublishField(${i},'scheduleDate',this.value)">
          </div>
          <div style="flex:1;min-width:120px">
            <div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Time</div>
            <input class="form-input" type="time" value="${post.scheduleTime||'09:00'}"
              oninput="updatePublishField(${i},'scheduleTime',this.value)">
          </div>
          <div style="flex:1;min-width:140px">
            <div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Platform</div>
            <select class="form-select" onchange="updatePublishField(${i},'platform',this.value)">
              <option value="Instagram" ${post.platform==='Instagram'?'selected':''}>📸 Instagram</option>
              <option value="Facebook"  ${post.platform==='Facebook'?'selected':''}>📘 Facebook</option>
              <option value="Both"      ${post.platform==='Both'?'selected':''}>📸📘 Both</option>
            </select>
          </div>
        </div>

        <!-- Actions -->
        <div style="display:flex;gap:10px;flex-wrap:wrap;padding-top:16px;border-top:1px solid var(--border)">
          <button class="btn btn-primary" style="flex:1" onclick="markReadyToPost(${i})">
            ${post.status==='published' ? '✅ Published' : '🚀 Mark as Posted'}
          </button>
          <a href="${post.imageUrl}" download="${post.imageName||'post'}" target="_blank"
            class="btn btn-ghost" style="text-decoration:none">⬇ Download</a>
          <button class="btn btn-ghost" onclick="removeFromQueue(${i})" style="color:var(--coral);border-color:var(--coral)">🗑</button>
        </div>

        <!-- Added info -->
        <div style="margin-top:10px;font-size:11px;color:var(--text3)">
          Added ${post.addedAt ? new Date(post.addedAt).toLocaleDateString('en-IN') : ''}
        </div>

      </div>
    </div>`).join('');
}

function updatePublishField(i, field, value) {
  if (!state.publishingQueue||!state.publishingQueue[i]) return;
  state.publishingQueue[i][field] = value;
  clearTimeout(window._pubSaveTimer);
  window._pubSaveTimer = setTimeout(()=>{ DB.save(state); if(typeof syncPush==='function') syncPush(); }, 500);
}

function markReadyToPost(i) {
  if (!state.publishingQueue||!state.publishingQueue[i]) return;
  const post = state.publishingQueue[i];
  post.status = post.status==='published' ? 'ready' : 'published';
  post.publishedAt = post.status==='published' ? new Date().toISOString() : null;
  DB.save(state);
  if (typeof syncPush==='function') syncPush();
  renderPublishing();
  if (post.status==='published') showToast('✅ Marked as published!','success');
}

function removeFromQueue(i) {
  if (!confirm('Remove from publishing queue?')) return;
  state.publishingQueue.splice(i, 1);
  DB.save(state);
  if (typeof syncPush==='function') syncPush();
  renderPublishing();
}

function _pubIsVideo(name) {
  return (name||'').match(/\.(mp4|mov|webm|avi|mkv)$/i);
}

function _openPublishLightbox(url, name) {
  const existing = document.getElementById('pubLightbox');
  if (existing) existing.remove();
  const lb = document.createElement('div');
  lb.id = 'pubLightbox';
  lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.95);z-index:3000;display:flex;align-items:center;justify-content:center;padding:20px';
  lb.onclick = e => { if(e.target===lb) lb.remove(); };
  lb.innerHTML = `
    <button onclick="document.getElementById('pubLightbox').remove()" style="position:fixed;top:16px;right:16px;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.2);border:none;color:#fff;font-size:18px;cursor:pointer">✕</button>
    ${_pubIsVideo(name)
      ? `<video src="${url}" controls autoplay style="max-width:90vw;max-height:90vh;border-radius:12px"></video>`
      : `<img src="${url}" style="max-width:90vw;max-height:90vh;object-fit:contain;border-radius:12px">`}`;
  document.body.appendChild(lb);
}
