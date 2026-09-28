/* ============================================================
   PUBLISHING — Kanban board style like Buffer
   Columns: Queue → In Progress → Ready → Published
   ============================================================ */

const PUB_COLUMNS = [
  { id:'queue',      label:'Queue',       color:'#6366F1' },
  { id:'in_progress',label:'In Progress', color:'#F59E0B' },
  { id:'ready',      label:'Ready to Post',color:'#10B981' },
  { id:'published',  label:'Published',   color:'#2563EB' },
];

function renderPublishing() {
  const el = document.getElementById('publishingQueue');
  if (!el) return;

  const queue = state.publishingQueue || [];

  el.innerHTML = `
    <!-- Board header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px">
      <div style="display:flex;gap:6px">
        ${PUB_COLUMNS.map(col => `
          <span style="font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;background:${col.color}22;color:${col.color}">
            ${col.label} ${queue.filter(p=>(p.status||'queue')===col.id).length}
          </span>`).join('')}
      </div>
    </div>

    <!-- Kanban board -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;align-items:start">
      ${PUB_COLUMNS.map(col => {
        const posts = queue.filter(p => (p.status||'queue') === col.id);
        return `
          <div style="background:var(--surface2);border-radius:16px;padding:14px;min-height:200px"
            ondragover="event.preventDefault();this.style.background='var(--brand-pale)'"
            ondragleave="this.style.background='var(--surface2)'"
            ondrop="event.preventDefault();this.style.background='var(--surface2)';_pubDropCard(event,'${col.id}')">

            <!-- Column header -->
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <div style="display:flex;align-items:center;gap:8px">
                <div style="width:10px;height:10px;border-radius:50%;background:${col.color}"></div>
                <span style="font-size:13px;font-weight:700;color:var(--text)">${col.label}</span>
                <span style="font-size:11px;font-weight:700;color:var(--text3);background:var(--white);padding:1px 7px;border-radius:10px">${posts.length}</span>
              </div>
            </div>

            <!-- Cards -->
            ${posts.length ? posts.map(post => `
              <div draggable="true"
                ondragstart="event.dataTransfer.setData('text/plain','${post.id}')"
                style="background:var(--white);border-radius:14px;padding:14px;margin-bottom:10px;box-shadow:var(--sh-sm);border:1px solid var(--border);cursor:grab;transition:all .15s"
                onmouseover="this.style.boxShadow='var(--sh-md)';this.style.transform='translateY(-2px)'"
                onmouseout="this.style.boxShadow='var(--sh-sm)';this.style.transform=''">

                <!-- Image preview -->
                ${post.imageUrl ? `
                  <div style="border-radius:10px;overflow:hidden;margin-bottom:10px;aspect-ratio:1;background:#000;cursor:zoom-in" onclick="_openPubLightbox('${post.imageUrl}','${post.imageName||''}')">
                    ${_pubIsVideo(post.imageName)
                      ? `<video src="${post.imageUrl}" style="width:100%;height:100%;object-fit:cover;display:block" muted></video>`
                      : `<img src="${post.imageUrl}" style="width:100%;height:100%;object-fit:cover;display:block">`}
                  </div>` : ''}

                <!-- Caption -->
                ${post.caption ? `<div style="font-size:12px;color:var(--text);line-height:1.5;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${post.caption}</div>` : ''}

                <!-- Meta + all strategy details -->
                <div style="margin-bottom:10px">
                  <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:6px">
                    ${post.platform?`<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;background:var(--brand-pale);color:var(--brand)">${post.platform}</span>`:''}
                    ${post.date?`<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;background:#FEF9C3;color:#92400E">📅 ${post.date}</span>`:''}
                  </div>
                  ${post.allDetails&&post.allDetails.length?`
                  <div style="font-size:11px;color:var(--text2);line-height:1.8;background:var(--beige);border-radius:8px;padding:8px 10px">
                    ${post.allDetails.map(d=>`<div><span style="color:var(--text3);font-weight:700">${d.label}:</span> ${d.value}</div>`).join('')}
                  </div>`:''}
                </div>

                <!-- Edit caption inline -->
                <textarea rows="2" placeholder="Edit caption…" style="width:100%;font-size:11px;padding:6px 8px;border:1px solid var(--border);border-radius:8px;font-family:var(--font);resize:none;margin-bottom:8px;box-sizing:border-box"
                  oninput="_pubUpdateField('${post.id}','caption',this.value)">${post.caption||''}</textarea>

                <!-- Time only - date comes from strategy -->
                <div style="display:flex;gap:6px;margin-bottom:10px;align-items:center">
                  <span style="font-size:11px;color:var(--text3)">Post at:</span>
                  <input type="time" value="${post.scheduleTime||'09:00'}" style="font-size:11px;padding:4px 6px;border:1px solid var(--border);border-radius:8px;font-family:var(--font)"
                    oninput="_pubUpdateField('${post.id}','scheduleTime',this.value)">
                </div>

                <!-- Move buttons -->
                <div style="display:flex;gap:4px;flex-wrap:wrap">
                  ${PUB_COLUMNS.filter(c=>c.id!==col.id).map(c=>`
                    <button onclick="_pubMoveCard('${post.id}','${c.id}')"
                      style="flex:1;padding:4px 6px;font-size:10px;font-weight:700;border-radius:8px;cursor:pointer;font-family:var(--font);border:1.5px solid ${c.color}33;background:${c.color}11;color:${c.color};white-space:nowrap">
                      → ${c.label}
                    </button>`).join('')}
                  <button onclick="_pubRemoveCard('${post.id}')"
                    style="padding:4px 8px;font-size:10px;font-weight:700;border-radius:8px;cursor:pointer;font-family:var(--font);border:1.5px solid var(--coral-light);background:var(--coral-light);color:var(--coral)">🗑</button>
                </div>

              </div>`).join('')
            : `<div style="text-align:center;padding:24px 12px;color:var(--text3);font-size:12px">
                <div style="font-size:24px;margin-bottom:6px">＋</div>
                Drag cards here
              </div>`}

          </div>`;
      }).join('')}
    </div>

    ${!queue.length ? `
      <div style="text-align:center;padding:60px;color:var(--text3);margin-top:20px">
        <div style="font-size:48px;margin-bottom:12px">🚀</div>
        <div style="font-size:15px;font-weight:700;color:var(--text2);margin-bottom:6px">No posts yet</div>
        <div style="font-size:13px">Approve designs in Monthly Planner → Send to Publishing</div>
      </div>` : ''}`;
}

function _pubUpdateField(postId, field, value) {
  const post = (state.publishingQueue||[]).find(p=>p.id===postId);
  if (post) post[field] = value;
  clearTimeout(window._pubSaveTimer);
  window._pubSaveTimer = setTimeout(()=>{ DB.save(state); if(typeof syncPush==='function') syncPush(); }, 500);
}

function _pubMoveCard(postId, newStatus) {
  const post = (state.publishingQueue||[]).find(p=>p.id===postId);
  if (post) { post.status = newStatus; }
  DB.save(state);
  if (typeof syncPush==='function') syncPush();
  renderPublishing();
}

function _pubDropCard(event, colId) {
  const postId = event.dataTransfer.getData('text/plain');
  if (postId) _pubMoveCard(postId, colId);
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
