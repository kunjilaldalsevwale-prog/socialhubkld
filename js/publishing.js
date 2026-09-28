/* ============================================================
   PUBLISHING — Simple list with Mark as Published
   ============================================================ */

function renderPublishing() {
  const el = document.getElementById('publishingQueue');
  if (!el) return;
  const queue = state.publishingQueue || [];

  if (!queue.length) {
    el.innerHTML = `
      <div style="text-align:center;padding:60px;color:var(--text3)">
        <div style="font-size:48px;margin-bottom:12px">🚀</div>
        <div style="font-size:15px;font-weight:700;color:var(--text2);margin-bottom:6px">No posts yet</div>
        <div style="font-size:13px">Approve designs in Monthly Planner → Send to Publishing</div>
      </div>`;
    return;
  }

  const unpublished = queue.filter(p => p.status !== 'published');
  const published   = queue.filter(p => p.status === 'published');

  el.innerHTML = `
    <!-- Unpublished posts -->
    ${unpublished.length ? `
      <div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px">
        Ready to post · ${unpublished.length}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;margin-bottom:32px">
        ${unpublished.map(post => _renderPubCard(post)).join('')}
      </div>` : ''}

    <!-- Published posts -->
    ${published.length ? `
      <div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;margin-top:8px">
        Published · ${published.length}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">
        ${published.map(post => _renderPubCard(post, true)).join('')}
      </div>` : ''}`;
}

function _renderPubCard(post, isPublished) {
  return `
    <div style="background:var(--white);border-radius:18px;overflow:hidden;box-shadow:var(--sh-sm);border:1px solid var(--border);${isPublished?'opacity:.7':''}">

      <!-- Image -->
      ${post.imageUrl ? `
        <div style="background:#000;cursor:zoom-in" onclick="_openPubLightbox('${post.imageUrl}','${post.imageName||''}')">
          ${_pubIsVideo(post.imageName)
            ? `<video src="${post.imageUrl}" style="width:100%;max-height:320px;display:block;object-fit:contain"></video>`
            : `<img src="${post.imageUrl}" style="width:100%;max-height:320px;object-fit:contain;display:block">`}
        </div>` : ''}

      <div style="padding:16px">

        <!-- Date + Platform badge -->
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;flex-wrap:wrap">
          ${post.date?`<span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:#FEF9C3;color:#92400E">📅 ${post.date}</span>`:''}
          ${post.scheduleTime?`<span style="font-size:11px;padding:3px 8px;border-radius:20px;background:var(--surface2);color:var(--text3)">🕐 ${post.scheduleTime}</span>`:''}
          ${post.platform?`<span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:var(--brand-pale);color:var(--brand)">${post.platform}</span>`:''}
          ${isPublished?`<span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:#ECFDF5;color:#065F46">✅ Published</span>`:''}
        </div>

        <!-- Strategy details -->
        ${post.allDetails&&post.allDetails.length?`
          <div style="font-size:12px;color:var(--text);line-height:1.8;background:var(--beige);border-radius:10px;padding:10px 12px;margin-bottom:12px">
            ${post.allDetails.map(d=>`<div><span style="color:var(--text3);font-size:11px;font-weight:700">${d.label}:</span> <span>${d.value}</span></div>`).join('')}
          </div>` : ''}

        <!-- Caption editable -->
        ${!isPublished?`
          <div style="margin-bottom:10px">
            <div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px">Caption</div>
            <textarea rows="3" style="width:100%;font-size:13px;padding:8px 10px;border:1.5px solid var(--border);border-radius:10px;font-family:var(--font);resize:none;box-sizing:border-box;line-height:1.6"
              oninput="_pubUpdateField('${post.id}','caption',this.value)">${post.caption||''}</textarea>
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
            <span style="font-size:11px;color:var(--text3)">Post time:</span>
            <input type="time" value="${post.scheduleTime||'09:00'}" style="font-size:12px;padding:4px 8px;border:1px solid var(--border);border-radius:8px;font-family:var(--font)"
              oninput="_pubUpdateField('${post.id}','scheduleTime',this.value)">
          </div>` : `
          ${post.caption?`<div style="font-size:13px;color:var(--text);line-height:1.6;margin-bottom:12px">${post.caption}</div>`:''}
        `}

        <!-- Actions -->
        <div style="display:flex;gap:8px">
          ${!isPublished?`
            <button onclick="_pubMarkPublished('${post.id}')" class="btn btn-primary" style="flex:1">✅ Mark as published</button>
            <a href="${post.imageUrl||'#'}" download target="_blank" class="btn btn-ghost" style="text-decoration:none">⬇</a>
            <button onclick="_pubRemoveCard('${post.id}')" class="btn btn-ghost" style="color:var(--coral)">🗑</button>
          ` : `
            <button onclick="_pubMarkPublished('${post.id}')" class="btn btn-ghost btn-sm" style="flex:1">↩ Unmark</button>
            <button onclick="_pubRemoveCard('${post.id}')" class="btn btn-ghost btn-sm" style="color:var(--coral)">🗑</button>
          `}
        </div>

      </div>
    </div>`;
}

function _pubMarkPublished(postId) {
  const post = (state.publishingQueue||[]).find(p=>p.id===postId);
  if (!post) return;
  post.status = post.status === 'published' ? 'ready' : 'published';
  post.publishedAt = post.status === 'published' ? new Date().toISOString() : null;
  DB.save(state);
  if (typeof syncPush==='function') syncPush();
  renderPublishing();
  if (post.status==='published') showToast('✅ Marked as published!','success');
}

function _pubUpdateField(postId, field, value) {
  const post = (state.publishingQueue||[]).find(p=>p.id===postId);
  if (post) post[field] = value;
  clearTimeout(window._pubSaveTimer);
  window._pubSaveTimer = setTimeout(()=>{ DB.save(state); if(typeof syncPush==='function') syncPush(); }, 500);
}

function _pubRemoveCard(postId) {
  if (!confirm('Remove from publishing queue?')) return;
  state.publishingQueue = (state.publishingQueue||[]).filter(p=>p.id!==postId);
  DB.save(state);
  if (typeof syncPush==='function') syncPush();
  renderPublishing();
}

function _pubIsVideo(name) {
  return (name||'').match(/\.(mp4|mov|webm|avi|mkv)$/i);
}

function _openPubLightbox(url, name) {
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
