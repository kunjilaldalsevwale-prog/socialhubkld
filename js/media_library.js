/* ============================================================
   MEDIA LIBRARY — Google Drive-style
   Big folder icons · Drag images into folders · Breadcrumb nav
   Cloudinary storage · Permanent URLs
   ============================================================ */

const CLOUDINARY_CLOUD  = 'dtegieseu';
const CLOUDINARY_PRESET = 'Media Library';

let _activeFolder    = null;  // null = root, string = folder id
let _mediaView       = 'grid';
let _mediaFilter     = 'all';
let _mediaSearchTerm = '';
let _dragMediaId     = null;  // id of image being dragged

/* ══════════════════════════════════════════════════════════
   CLOUDINARY UPLOAD
══════════════════════════════════════════════════════════ */
async function uploadToCloudinary(file, onProgress) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_PRESET);
  fd.append('folder', 'socialhub');
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`);
    xhr.upload.onprogress = e => { if (e.lengthComputable && onProgress) onProgress(Math.round(e.loaded/e.total*100)); };
    xhr.onload = () => {
      if (xhr.status === 200) { const r = JSON.parse(xhr.responseText); resolve({ url:r.secure_url, publicId:r.public_id }); }
      else reject(new Error('Upload failed: ' + xhr.status));
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(fd);
  });
}

/* ══════════════════════════════════════════════════════════
   RENDER — main entry point
══════════════════════════════════════════════════════════ */
function renderMediaLibrary() {
  _renderMediaStats();
  _renderFoldersRow();
  _renderMediaGrid();
  _renderBreadcrumb();
}

/* ── Stats ────────────────────────────────────────────── */
function _renderMediaStats() {
  const el  = document.getElementById('mediaStats');
  if (!el) return;
  const lib = state.mediaLibrary || [];
  const folders = state.mediaFolders || [];
  el.innerHTML = `
    <div class="meta-stat-card"><div class="msc-label">Total files</div><div class="msc-val">${lib.length}</div><div class="msc-sub">In library</div></div>
    <div class="meta-stat-card"><div class="msc-label">Images</div><div class="msc-val">${lib.filter(m=>m.type==='image').length}</div><div class="msc-sub">Photos & graphics</div></div>
    <div class="meta-stat-card"><div class="msc-label">Videos</div><div class="msc-val">${lib.filter(m=>m.type==='video').length}</div><div class="msc-sub">Clips & reels</div></div>
    <div class="meta-stat-card"><div class="msc-label">Folders</div><div class="msc-val">${folders.length}</div><div class="msc-sub">Organised sets</div></div>`;
}

/* ── Breadcrumb ───────────────────────────────────────── */
function _renderBreadcrumb() {
  const el = document.getElementById('mediaBreadcrumb');
  if (!el) return;
  if (!_activeFolder) {
    el.innerHTML = `<span style="color:var(--text2);font-weight:700">📸 All photos</span>`;
  } else {
    const folder = (state.mediaFolders||[]).find(f=>f.id===_activeFolder);
    el.innerHTML = `
      <span onclick="selectMediaFolder(null,null)" style="cursor:pointer;color:var(--brand)">📸 All photos</span>
      <span style="color:var(--text3);margin:0 4px">›</span>
      <span style="color:var(--text2);font-weight:700">📁 ${folder?folder.name:'Folder'}</span>`;
  }
}

/* ── Folders Row (Google Drive style) ────────────────── */
function _renderFoldersRow() {
  const el      = document.getElementById('mediaFoldersRow');
  if (!el) return;
  const folders = state.mediaFolders || [];

  // Show folder section header
  let html = '';

  if (!_activeFolder) {
    // We're at root — show all folders as big tiles
    html += `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <div style="font-size:13px;font-weight:700;color:var(--text2)">Folders</div>
      <button class="btn btn-ghost btn-sm" onclick="createMediaFolder()" style="border-style:dashed;font-size:11px;gap:5px">＋ New folder</button>
    </div>`;

    if (!folders.length) {
      html += `<div style="display:flex;align-items:center;gap:12px;padding:16px;background:var(--surface2);border-radius:var(--r-xl);border:2px dashed var(--border2);margin-bottom:8px;color:var(--text3);font-size:13px">
        <span style="font-size:24px">📁</span>
        <div>
          <div style="font-weight:700;color:var(--text2)">No folders yet</div>
          <div style="font-size:12px">Create folders to organise your photos. Then drag images onto a folder.</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="createMediaFolder()" style="margin-left:auto">＋ New folder</button>
      </div>`;
    } else {
      html += `<div class="media-folders-grid">`;
      folders.forEach(f => {
        const count = (state.mediaLibrary||[]).filter(m=>m.folderId===f.id).length;
        const thumbs = (state.mediaLibrary||[]).filter(m=>m.folderId===f.id&&m.url).slice(0,4);
        html += `<div class="media-folder-card" id="folder-card-${f.id}"
          onclick="openFolder('${f.id}')"
          ondragover="event.preventDefault();document.getElementById('folder-card-${f.id}').classList.add('folder-dragover')"
          ondragleave="document.getElementById('folder-card-${f.id}').classList.remove('folder-dragover')"
          ondrop="event.preventDefault();document.getElementById('folder-card-${f.id}').classList.remove('folder-dragover');dropMediaIntoFolder(event,'${f.id}')">
          <!-- Folder icon SVG -->
          <div class="media-folder-icon">
            <svg viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:72px;height:54px">
              <path d="M4 14C4 10.686 6.686 8 10 8H32L38 14H70C73.314 14 76 16.686 76 20V52C76 55.314 73.314 58 70 58H10C6.686 58 4 55.314 4 52V14Z" fill="#FCD34D"/>
              <path d="M4 22H76V52C76 55.314 73.314 58 70 58H10C6.686 58 4 55.314 4 52V22Z" fill="#FBBF24"/>
              ${thumbs.length > 0 ? `
              <clipPath id="fc-${f.id}"><rect x="10" y="26" width="60" height="28" rx="4"/></clipPath>
              ${thumbs.map((m,i)=>`<image href="${m.url}" x="${10+i*16}" y="26" width="18" height="28" clip-path="url(#fc-${f.id})" preserveAspectRatio="xMidYMid slice"/>`).join('')}` : ''}
            </svg>
          </div>
          <div class="media-folder-name">${f.name}</div>
          <div class="media-folder-count">${count} item${count!==1?'s':''}</div>
          <!-- Folder actions -->
          <div class="media-folder-actions" onclick="event.stopPropagation()">
            <button onclick="renameFolderPrompt('${f.id}')" title="Rename" style="background:none;border:none;cursor:pointer;font-size:13px;padding:3px">✏️</button>
            <button onclick="deleteFolderPrompt('${f.id}')" title="Delete" style="background:none;border:none;cursor:pointer;font-size:13px;padding:3px">🗑</button>
          </div>
        </div>`;
      });
      html += `</div>`;
    }
    // Section header for files below folders
    const filesInRoot = (state.mediaLibrary||[]).filter(m=>!m.folderId);
    if (filesInRoot.length || folders.length) {
      html += `<div style="font-size:13px;font-weight:700;color:var(--text2);margin:20px 0 12px">Files</div>`;
    }
  } else {
    // Inside a folder — show "back" + folder actions
    const folder = folders.find(f=>f.id===_activeFolder);
    html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      <button class="btn btn-ghost btn-sm" onclick="selectMediaFolder(null,null)" style="gap:6px">← Back</button>
      <div style="font-size:15px;font-weight:800;color:var(--text)">📁 ${folder?folder.name:''}</div>
      <div style="margin-left:auto;display:flex;gap:6px">
        <button class="btn btn-ghost btn-sm" onclick="renameFolderPrompt('${_activeFolder}')">✏️ Rename</button>
        <label class="btn btn-primary btn-sm" style="cursor:pointer">
          <input type="file" multiple accept="image/*,video/*" style="display:none" onchange="handleDeviceUploadToFolder(this,'${_activeFolder}')">
          ＋ Add to folder
        </label>
      </div>
    </div>`;
  }

  el.innerHTML = html;
}

/* ── Files Grid ───────────────────────────────────────── */
function _renderMediaGrid() {
  const el  = document.getElementById('mediaGrid');
  if (!el)  return;
  let items = state.mediaLibrary || [];

  // Filter by folder
  if (_activeFolder) {
    items = items.filter(m => m.folderId === _activeFolder);
  } else {
    items = items.filter(m => !m.folderId); // root = unfiled only
  }

  // Filter by type
  if (_mediaFilter && _mediaFilter !== 'all') items = items.filter(m => m.type === _mediaFilter);

  // Filter by search
  if (_mediaSearchTerm) items = items.filter(m => (m.name||'').toLowerCase().includes(_mediaSearchTerm));

  el.className = _mediaView === 'list' ? 'media-list' : 'media-grid';

  if (!items.length) {
    el.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text3)">
        <div style="font-size:48px;margin-bottom:12px">${_activeFolder?'📭':'📤'}</div>
        <div style="font-size:15px;font-weight:700;color:var(--text2);margin-bottom:6px">
          ${_activeFolder ? 'This folder is empty' : 'No files yet'}
        </div>
        <div style="font-size:12px;margin-bottom:18px">
          ${_activeFolder ? 'Upload files or drag images from the root into this folder' : 'Upload images to get started'}
        </div>
        <label class="btn btn-primary" style="cursor:pointer;display:inline-flex;align-items:center;gap:7px">
          <input type="file" multiple accept="image/*,video/*" style="display:none" onchange="${_activeFolder?`handleDeviceUploadToFolder(this,'${_activeFolder}')`:'handleDeviceUpload(this)'}">
          📁 Upload files
        </label>
      </div>`;
    return;
  }

  el.innerHTML = items.map(m => {
    const thumb = m.url ? (m.type==='image' ? m.url.replace('/upload/','/upload/w_400,h_280,c_fill/') : m.url) : null;
    return `<div class="media-card" id="mc-${m.id}"
      draggable="true"
      ondragstart="startDragMedia(event,${m.id})"
      ondragend="endDragMedia(event)"
      onclick="openMediaLightbox(${m.id})">
      <div class="media-thumb" style="height:150px;overflow:hidden;position:relative;background:var(--surface3);cursor:zoom-in">
        ${thumb
          ? `<img src="${thumb}" style="width:100%;height:150px;object-fit:cover;display:block;pointer-events:none"
              onerror="this.style.display='none'">`
          : `<div style="display:flex;align-items:center;justify-content:center;height:150px;font-size:36px;pointer-events:none">${m.type==='video'?'🎬':'🖼️'}</div>`}
        ${m.source==='cloudinary' ? '<div style="position:absolute;top:7px;left:7px;background:rgba(0,0,0,.5);color:#fff;font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px">☁️</div>' : ''}
        <div class="media-overlay" style="pointer-events:none">
          <button class="btn btn-primary btn-sm" style="pointer-events:all" onclick="event.stopPropagation();useMedia(${m.id})">Use in post</button>
        </div>
      </div>
      <div class="media-info">
        <div class="media-name" title="${m.name}">${m.name}</div>
        <div class="media-meta">${m.size||''} · ${m.source==='cloudinary'?'☁️ Cloud':'📱 Device'}</div>
<div style="display:flex;gap:5px;margin-top:7px;flex-wrap:wrap">
          <button class="media-action-btn" onclick="event.stopPropagation();downloadMedia(${m.id})">⬇ Download</button>
          <button class="media-action-btn" onclick="event.stopPropagation();moveToFolderPicker(${m.id})">📁 Move</button>
          <button class="media-action-btn" onclick="event.stopPropagation();copyMediaUrl(${m.id})">📋 Copy</button>
          <button class="media-action-btn" onclick="event.stopPropagation();addMediaToPlanner(${m.id})" style="color:var(--brand);border-color:var(--brand-mid)">🗒 Add to Planner</button>
        </div>
      </div>
      <button class="media-delete" onclick="event.stopPropagation();deleteMedia(${m.id})" title="Remove">✕</button>
    </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════════════════
   DRAG & DROP — image to folder
══════════════════════════════════════════════════════════ */
function startDragMedia(e, id) {
  _dragMediaId = id;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(id));
  const card = document.getElementById('mc-' + id);
  if (card) { card.style.opacity = '.5'; card.style.transform = 'scale(.96)'; }
}

function endDragMedia(e) {
  if (_dragMediaId) {
    const card = document.getElementById('mc-' + _dragMediaId);
    if (card) { card.style.opacity = ''; card.style.transform = ''; }
  }
  _dragMediaId = null;
}

function dropMediaIntoFolder(e, folderId) {
  const id = parseInt(e.dataTransfer.getData('text/plain') || _dragMediaId);
  if (!id) return;
  const m = (state.mediaLibrary||[]).find(x=>x.id===id);
  if (!m) return;
  m.folderId = folderId;
  saveState();
  renderMediaLibrary();
  const folder = (state.mediaFolders||[]).find(f=>f.id===folderId);
  showToast(`✅ "${m.name}" moved to ${folder?folder.name:'folder'}!`, 'success');
}

/* ══════════════════════════════════════════════════════════
   FOLDER NAVIGATION
══════════════════════════════════════════════════════════ */
function openFolder(id) {
  _activeFolder = id;
  renderMediaLibrary();
}

function selectMediaFolder(id) {
  _activeFolder = id || null;
  _mediaSearchTerm = '';
  const inp = document.getElementById('mediaSearchInput');
  if (inp) inp.value = '';
  renderMediaLibrary();
}

function createMediaFolder() {
  const name = prompt('Folder name:');
  if (!name || !name.trim()) return;
  if (!state.mediaFolders) state.mediaFolders = [];
  const id = 'folder_' + genId();
  state.mediaFolders.push({ id, name: name.trim() });
  saveState();
  renderMediaLibrary();
  showToast(`📁 Folder "${name.trim()}" created!`, 'success');
}

function renameFolderPrompt(id) {
  const folder = (state.mediaFolders||[]).find(f=>f.id===id);
  if (!folder) return;
  const name = prompt('Rename folder:', folder.name);
  if (!name || !name.trim()) return;
  folder.name = name.trim();
  saveState();
  renderMediaLibrary();
}

function deleteFolderPrompt(id) {
  const folder = (state.mediaFolders||[]).find(f=>f.id===id);
  const count  = (state.mediaLibrary||[]).filter(m=>m.folderId===id).length;
  if (!confirm(`Delete folder "${folder?folder.name:''}"?\n\n${count} file${count!==1?'s':''} inside will be moved back to All photos.`)) return;
  // Unfile all items in folder
  (state.mediaLibrary||[]).forEach(m => { if (m.folderId===id) m.folderId = null; });
  state.mediaFolders = (state.mediaFolders||[]).filter(f=>f.id!==id);
  if (_activeFolder === id) _activeFolder = null;
  saveState();
  renderMediaLibrary();
  showToast('Folder deleted, files moved to All photos');
}

/* ══════════════════════════════════════════════════════════
   UPLOAD
══════════════════════════════════════════════════════════ */
async function handleDeviceUpload(input) {
  const files = Array.from(input.files || []);
  if (!files.length) return;
  if (input.value !== undefined) input.value = '';
  await _uploadFiles(files, _activeFolder);
}

async function handleDeviceUploadToFolder(input, folderId) {
  const files = Array.from(input.files || []);
  if (!files.length) return;
  if (input.value !== undefined) input.value = '';
  await _uploadFiles(files, folderId);
}

async function _uploadFiles(files, folderId) {
  if (!state.mediaLibrary) state.mediaLibrary = [];
  const grid = document.getElementById('mediaGrid');

  // Show progress
  if (grid) {
    grid.className = 'media-grid';
    grid.innerHTML = `
      <div style="grid-column:1/-1;background:var(--white);border-radius:var(--r-xl);padding:24px;border:1px solid var(--border)">
        <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:16px">☁️ Uploading ${files.length} file${files.length>1?'s':''}…</div>
        ${files.map((f,i)=>`
          <div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;margin-bottom:5px">
              <span style="font-size:12px;font-weight:600;color:var(--text2)">${f.name}</span>
              <span id="pct-${i}" style="font-size:11px;color:var(--text3)">0%</span>
            </div>
            <div style="height:5px;background:var(--surface3);border-radius:4px;overflow:hidden">
              <div id="bar-${i}" style="height:100%;background:linear-gradient(90deg,var(--brand),var(--sky));border-radius:4px;width:0%;transition:width .3s"></div>
            </div>
          </div>`).join('')}
      </div>`;
  }

  let uploaded = 0;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue;
    try {
      const result = await uploadToCloudinary(file, pct => {
        const bar = document.getElementById('bar-'+i);
        const lbl = document.getElementById('pct-'+i);
        if (bar) bar.style.width = pct+'%';
        if (lbl) lbl.textContent = pct+'%';
      });
      const lbl = document.getElementById('pct-'+i);
      if (lbl) { lbl.textContent = '✅'; lbl.style.color = 'var(--green)'; }
      state.mediaLibrary.push({
        id: genId(), name: file.name,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        size: _fmtSize(file.size), url: result.url, thumb: result.url,
        tags: [], date: new Date().toISOString().split('T')[0],
        source: 'cloudinary', publicId: result.publicId,
        folderId: folderId || null,
      });
      uploaded++;
      if (typeof autoSaveToMediaLibrary === 'function') {} // already added above
    } catch(err) {
      const lbl = document.getElementById('pct-'+i);
      if (lbl) { lbl.textContent = '❌'; lbl.style.color = 'var(--coral)'; }
    }
  }

  saveState();
  if (typeof logActivity === 'function') logActivity('Media uploaded', `${uploaded} file${uploaded>1?'s':''} uploaded`, 'media');
  setTimeout(() => renderMediaLibrary(), 800);
  showToast(`✅ ${uploaded} file${uploaded>1?'s':''} uploaded!`, 'success');
}

/* ══════════════════════════════════════════════════════════
   LIGHTBOX
══════════════════════════════════════════════════════════ */
function openMediaLightbox(id) {
  const m = (state.mediaLibrary||[]).find(x=>x.id===id);
  if (!m || !m.url) return;
  const existing = document.getElementById('mediaLightbox');
  if (existing) existing.remove();
  const lb = document.createElement('div');
  lb.id = 'mediaLightbox';
  lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s ease';
  lb.onclick = e => { if(e.target===lb) lb.remove(); };
  lb.innerHTML = `
    <button onclick="document.getElementById('mediaLightbox').remove()"
      style="position:fixed;top:20px;right:24px;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.15);border:1.5px solid rgba(255,255,255,.3);color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:var(--font)">✕</button>
    ${m.type==='video'
      ? `<video src="${m.url}" controls style="max-width:90vw;max-height:75vh;border-radius:var(--r-lg);box-shadow:0 20px 60px rgba(0,0,0,.5)"></video>`
      : `<img src="${m.url}" style="max-width:90vw;max-height:75vh;object-fit:contain;border-radius:var(--r-lg);box-shadow:0 20px 60px rgba(0,0,0,.5);display:block">`}
    <div style="margin-top:16px;display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.1);backdrop-filter:blur(10px);padding:10px 20px;border-radius:30px;border:1px solid rgba(255,255,255,.15)">
      <div style="color:#fff;font-size:13px;font-weight:700">${m.name}</div>
      <div style="color:rgba(255,255,255,.5);font-size:12px">${m.size||''}</div>
      <a href="${m.url}" download="${m.name}" target="_blank"
        style="color:#FCD34D;font-size:12px;font-weight:700;text-decoration:none;padding:5px 12px;background:rgba(252,211,77,.15);border-radius:20px;border:1px solid rgba(252,211,77,.3)">⬇ Download</a>
      <button onclick="copyMediaUrl(${m.id})"
        style="color:#34D399;font-size:12px;font-weight:700;background:rgba(52,211,153,.15);border:1px solid rgba(52,211,153,.3);border-radius:20px;padding:5px 12px;cursor:pointer;font-family:var(--font)">📋 Copy URL</button>
    </div>`;
  document.body.appendChild(lb);
}

/* ══════════════════════════════════════════════════════════
   ACTIONS
══════════════════════════════════════════════════════════ */
function downloadMedia(id) {
  const m = (state.mediaLibrary||[]).find(x=>x.id===id);
  if (!m || !m.url) { showToast('No URL available', 'error'); return; }
  const a = document.createElement('a'); a.href=m.url; a.download=m.name||'image'; a.target='_blank';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  showToast(`⬇ Downloading ${m.name}…`, 'success');
}

function copyMediaUrl(id) {
  const m = (state.mediaLibrary||[]).find(x=>x.id===id);
  if (!m || !m.url) return;
  navigator.clipboard.writeText(m.url).then(() => showToast('📋 URL copied!', 'success')).catch(() => showToast('Copy from lightbox', ''));
}

function deleteMedia(id) {
  state.mediaLibrary = (state.mediaLibrary||[]).filter(m=>m.id!==id);
  saveState(); renderMediaLibrary();
  if (typeof logActivity === 'function') logActivity('Media deleted', `ID ${id}`, 'media');
  showToast('File removed');
}

function useMedia(id) {
  const m = (state.mediaLibrary||[]).find(x=>x.id===id);
  if (!m||!m.url) { showToast('No URL','error'); return; }
  const preview = document.getElementById('cadd-file-preview');
  if (preview) {
    preview.innerHTML = `<img src="${m.url}" style="width:100%;max-height:120px;object-fit:cover;border-radius:var(--r-lg);border:1.5px solid var(--border)">
      <div style="font-size:11px;color:var(--green);font-weight:600;margin-top:4px">✅ ${m.name} selected</div>`;
    window._caddAttachment = { url:m.url, name:m.name };
    showToast(`✅ "${m.name}" ready`, 'success');
  } else { showToast('Open a post form first', ''); }
}

function moveToFolderPicker(id) {
  const folders = state.mediaFolders || [];
  const m = (state.mediaLibrary||[]).find(x=>x.id===id);
  if (!m) return;
  if (!folders.length) { if(confirm('No folders yet. Create one?')) createMediaFolder(); return; }
  document.getElementById('modalTitle').textContent = '📁 Move to folder';
  document.getElementById('modalBody').innerHTML = `
    <div style="font-size:13px;color:var(--text2);margin-bottom:14px">Moving: <strong>${m.name}</strong></div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <button class="btn btn-ghost" style="text-align:left" onclick="moveToFolder(${id},null);closeModal();renderMediaLibrary()">📸 All photos (remove from folder)</button>
      ${folders.map(f=>`
        <button class="btn ${m.folderId===f.id?'btn-primary':'btn-ghost'}" style="text-align:left"
          onclick="moveToFolder(${id},'${f.id}');closeModal();renderMediaLibrary();showToast('Moved to ${f.name}','success')">
          📁 ${f.name} ${m.folderId===f.id?'✓':''}
        </button>`).join('')}
    </div>`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-ghost" onclick="createMediaFolder();closeModal()">＋ New folder</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

function moveToFolder(mediaId, folderId) {
  const m = (state.mediaLibrary||[]).find(x=>x.id===mediaId);
  if (m) { m.folderId = folderId; saveState(); renderMediaLibrary(); }
}

/* ══════════════════════════════════════════════════════════
   FILTER / SEARCH / VIEW
══════════════════════════════════════════════════════════ */
function filterMedia(type, el) {
  _mediaFilter = type;
  document.querySelectorAll('#view-media .ftab').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  _renderMediaGrid();
}

function filterMediaBySearch(term) { _mediaSearchTerm = term.toLowerCase().trim(); _renderMediaGrid(); }

function setMediaView(mode, el) {
  _mediaView = mode;
  document.querySelectorAll('#viewGrid,#viewList').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  _renderMediaGrid();
}

function renderMediaFolders() { _renderFoldersRow(); }

/* ══════════════════════════════════════════════════════════
   GOOGLE DRIVE IMPORT
══════════════════════════════════════════════════════════ */
function importFromDrive() {
  document.getElementById('modalTitle').textContent = '☁️ Import from Google Drive';
  document.getElementById('modalBody').innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;padding:14px;background:var(--brand-pale);border:1.5px solid var(--brand-light);border-radius:var(--r-xl);margin-bottom:16px">
      <span style="font-size:28px">☁️</span>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:700">Open Google Drive → Share → Anyone with link → Copy</div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px">Then paste the link below</div>
      </div>
      <button onclick="window.open('https://drive.google.com/drive/my-drive','_blank')"
        style="padding:8px 16px;background:#1A73E8;color:#fff;border:none;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font)">Open Drive ↗</button>
    </div>
    <div style="position:relative;margin-bottom:10px">
      <input class="form-input" id="drive-url" placeholder="Paste Google Drive link…"
        oninput="previewDriveModalImage(this.value)"
        onpaste="setTimeout(()=>previewDriveModalImage(document.getElementById('drive-url').value),60)">
      <button onclick="(async()=>{try{const t=await navigator.clipboard.readText();const i=document.getElementById('drive-url');if(i){i.value=t;previewDriveModalImage(t);}}catch(e){}})()"
        style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:var(--brand);color:#fff;border:none;border-radius:16px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:var(--font)">📋 Paste</button>
    </div>
    <div id="drive-modal-preview" style="margin-bottom:12px"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">File name</label><input class="form-input" id="drive-name" placeholder="e.g. banner.jpg"></div>
      <div class="form-group"><label class="form-label">Save to folder</label>
        <select class="form-select" id="drive-folder">
          <option value="">No folder (All photos)</option>
          ${(state.mediaFolders||[]).map(f=>`<option value="${f.id}">${f.name}</option>`).join('')}
        </select></div>
    </div>`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveDriveImport()">Import</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

function previewDriveModalImage(url) {
  const el = document.getElementById('drive-modal-preview');
  if (!el || !url) return;
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!m) return;
  const fileId = m[1];
  const nameEl = document.getElementById('drive-name');
  if (nameEl && !nameEl.value) nameEl.value = `drive-${fileId.slice(0,8)}.jpg`;
  el.innerHTML = `<img src="https://drive.google.com/thumbnail?id=${fileId}&sz=w480"
    style="max-height:130px;max-width:100%;object-fit:contain;border-radius:var(--r-lg);border:1px solid var(--border);display:block"
    onerror="this.style.display='none'">`;
}

function saveDriveImport() {
  const url  = (document.getElementById('drive-url').value||'').trim();
  const name = (document.getElementById('drive-name').value||'').trim() || 'drive-file.jpg';
  const folderId = document.getElementById('drive-folder')?.value || null;
  if (!url) { showToast('Paste a Drive link', 'error'); return; }
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!m) { showToast('Invalid Drive link', 'error'); return; }
  const directUrl = `https://drive.google.com/uc?export=view&id=${m[1]}`;
  if (!state.mediaLibrary) state.mediaLibrary = [];
  state.mediaLibrary.push({ id:genId(), name, type:'image', url:directUrl, thumb:directUrl, size:'Drive', tags:[], date:new Date().toISOString().split('T')[0], source:'drive', folderId:folderId||null });
  saveState(); closeModal(); renderMediaLibrary();
  showToast('☁️ Drive file imported!', 'success');
}

/* ══════════════════════════════════════════════════════════
   URL IMPORT
══════════════════════════════════════════════════════════ */
function openUrlImportModal() {
  document.getElementById('modalTitle').textContent = '🔗 Import from URL';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group"><label class="form-label">Image URL *</label>
      <input class="form-input" id="url-import-src" placeholder="https://example.com/image.jpg" oninput="previewUrlImport(this.value)"></div>
    <div id="url-import-preview" style="margin-bottom:12px"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Name</label><input class="form-input" id="url-import-name" placeholder="image.jpg"></div>
      <div class="form-group"><label class="form-label">Folder</label>
        <select class="form-select" id="url-import-folder">
          <option value="">No folder</option>
          ${(state.mediaFolders||[]).map(f=>`<option value="${f.id}">${f.name}</option>`).join('')}
        </select></div>
    </div>`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveUrlImport()">Import</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

function previewUrlImport(url) {
  const el = document.getElementById('url-import-preview');
  if (!el || !url.startsWith('http')) return;
  const nameEl = document.getElementById('url-import-name');
  if (nameEl && !nameEl.value) nameEl.value = url.split('/').pop().split('?')[0] || 'image.jpg';
  el.innerHTML = `<img src="${url}" style="max-height:120px;max-width:100%;object-fit:contain;border-radius:var(--r-lg);border:1px solid var(--border);display:block" onerror="this.style.display='none'">`;
}

function saveUrlImport() {
  const url      = (document.getElementById('url-import-src').value||'').trim();
  const name     = (document.getElementById('url-import-name').value||'image').trim();
  const folderId = document.getElementById('url-import-folder').value;
  if (!url||!url.startsWith('http')) { showToast('Paste a valid URL','error'); return; }
  if (!state.mediaLibrary) state.mediaLibrary=[];
  state.mediaLibrary.push({ id:genId(), name, type:'image', size:'URL', url, thumb:url, tags:[], date:new Date().toISOString().split('T')[0], source:'url', folderId:folderId||null });
  saveState(); closeModal(); renderMediaLibrary();
  showToast('✅ Image imported!','success');
}

/* ══════════════════════════════════════════════════════════
   MINI LIBRARY (in add post modal)
══════════════════════════════════════════════════════════ */
function _populateMiniLibrary() {
  const el  = document.getElementById('cadd-library-grid');
  if (!el) return;
  const lib = (state.mediaLibrary||[]).filter(m=>m.url&&m.type==='image');
  if (!lib.length) { el.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:12px;text-align:center;grid-column:1/-1">No images yet</div>'; return; }
  el.innerHTML = lib.map(m => {
    const thumb = m.url.includes('cloudinary') ? m.url.replace('/upload/','/upload/w_120,h_80,c_fill/') : m.url;
    return `<div class="media-mini-card" onclick="selectLibraryMedia(${m.id})" id="mmc-${m.id}" title="${m.name}">
      <img src="${thumb}" style="width:100%;height:60px;object-fit:cover;display:block"
        onerror="this.parentElement.innerHTML='<div style=\\'font-size:18px;text-align:center;padding:12px\\'>🖼️</div>'">
    </div>`;
  }).join('');
}

function selectLibraryMedia(id) {
  const m = (state.mediaLibrary||[]).find(x=>x.id===id);
  if (!m||!m.url) { showToast('No URL available','error'); return; }
  document.querySelectorAll('.media-mini-card').forEach(c=>c.classList.remove('selected'));
  const card = document.getElementById('mmc-'+id);
  if (card) card.classList.add('selected');
  window._caddAttachment = { url:m.url, name:m.name };
  const lbl = document.getElementById('cadd-library-selected');
  if (lbl) { lbl.textContent=`✅ "${m.name}" selected`; lbl.style.display=''; }
  showToast('✅ Image selected','success');
}

/* ══════════════════════════════════════════════════════════
   AUTO-SAVE
══════════════════════════════════════════════════════════ */
function autoSaveToMediaLibrary(url, name, source) {
  if (!url) return;
  if (!state.mediaLibrary) state.mediaLibrary = [];
  if (state.mediaLibrary.find(m=>m.url===url)) return;
  state.mediaLibrary.push({ id:genId(), name:name||'image', type:'image', size:'', url, thumb:url, tags:[], date:new Date().toISOString().split('T')[0], source:source||'cloudinary', folderId:_activeFolder||null });
  saveState();
}

/* ══════════════════════════════════════════════════════════
   MODAL IMAGE UPLOAD (used by modal.js)
══════════════════════════════════════════════════════════ */
async function handleModalImageUpload(input) {
  const file = input.files[0]; if (!file) return;
  const preview = document.getElementById('m-image-preview');
  if (preview) preview.innerHTML = `<div style="padding:10px;background:var(--brand-pale);border-radius:var(--r-lg);font-size:12px;color:var(--brand);font-weight:600">☁️ Uploading…</div>`;
  try {
    const result = await uploadToCloudinary(file, pct => {
      if (preview) preview.innerHTML = `<div style="padding:10px;background:var(--brand-pale);border-radius:var(--r-lg);font-size:12px;color:var(--brand);font-weight:600">☁️ ${pct}%…</div>`;
    });
    window._modalImageUrl = result.url;
    autoSaveToMediaLibrary(result.url, file.name, 'cloudinary');
    if (preview) preview.innerHTML = `
      <img src="${result.url}" style="width:100%;max-height:120px;object-fit:cover;border-radius:var(--r-lg);border:1px solid var(--border)">
      <div style="font-size:11px;color:var(--green);font-weight:600;margin-top:4px">✅ ${file.name} — saved to Photos library</div>`;
  } catch(e) {
    if (preview) preview.innerHTML = `<div style="color:var(--coral);font-size:12px;padding:8px">❌ Upload failed</div>`;
  }
  input.value = '';
}

async function handleCaddFile(input) {
  const file = input.files[0]; if (!file) return;
  const preview = document.getElementById('cadd-file-preview');
  if (preview) preview.innerHTML = `<div style="padding:10px;background:var(--brand-pale);border-radius:var(--r-lg);font-size:12px;color:var(--brand);font-weight:600">☁️ Uploading…</div>`;
  try {
    const result = await uploadToCloudinary(file, pct => {
      if (preview) preview.innerHTML = `<div style="padding:10px;background:var(--brand-pale);border-radius:var(--r-lg);font-size:12px;color:var(--brand);font-weight:600">☁️ ${pct}%…</div>`;
    });
    window._caddAttachment = { url:result.url, name:file.name, source:'cloudinary' };
    autoSaveToMediaLibrary(result.url, file.name, 'cloudinary');
    if (preview) preview.innerHTML = `
      <img src="${result.url}" style="width:100%;max-height:130px;object-fit:cover;border-radius:var(--r-lg);border:1px solid var(--border)">
      <div style="font-size:11px;color:var(--green);font-weight:600;margin-top:4px">✅ ${file.name} — saved to Photos</div>`;
  } catch(e) {
    if (preview) preview.innerHTML = `<div style="color:var(--coral);font-size:12px;padding:8px">❌ Upload failed</div>`;
  }
  input.value = '';
}

/* ── Helpers ──────────────────────────────────────────── */
function _fmtSize(b) {
  if (!b) return '';
  if (b < 1024)       return b + ' B';
  if (b < 1024*1024)  return (b/1024).toFixed(1) + ' KB';
  return (b/(1024*1024)).toFixed(1) + ' MB';
}

function addMediaToPlanner(mediaId) {
  const m = (state.mediaLibrary||[]).find(x=>x.id===mediaId);
  if (!m || !m.url) return;

  // Get current campaigns
  if (!state.monthlyPlans) state.monthlyPlans = {};
  const now = new Date();
  const key = `${now.getFullYear()}-${now.getMonth()}`;
  if (!state.monthlyPlans[key]) state.monthlyPlans[key] = { campaigns:[] };
  const campaigns = state.monthlyPlans[key].campaigns || [];

  if (!campaigns.length) {
    showToast('No campaigns this month — create one in Monthly Planner first', 'error');
    return;
  }

  // Show campaign picker
  document.getElementById('modalTitle').textContent = '🗒 Add to Monthly Planner';
  document.getElementById('modalBody').innerHTML = `
    <div style="font-size:13px;color:var(--text2);margin-bottom:14px">
      Adding: <strong>${m.name}</strong><br>
      <span style="font-size:11px;color:var(--text3)">Select which campaign to add this image to</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${campaigns.map(c => `
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--surface2);border-radius:14px;border:1px solid var(--border)">
          <div style="font-size:13px;font-weight:700;color:var(--text);flex:1">${c.name}</div>
          <div style="display:flex;gap:6px">
            <button class="btn btn-ghost btn-sm" onclick="addToPlanner('${mediaId}','${c.id}','strat');closeModal()">📌 Strat refs</button>
            <button class="btn btn-primary btn-sm" onclick="addToPlanner('${mediaId}','${c.id}','design');closeModal()">🎨 Designs</button>
          </div>
        </div>`).join('')}
    </div>`;
  document.getElementById('modalFooter').innerHTML = `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

function addToPlanner(mediaId, campId, section) {
  const m = (state.mediaLibrary||[]).find(x=>x.id===mediaId);
  if (!m) return;
  const now = new Date();
  const key = `${now.getFullYear()}-${now.getMonth()}`;
  const campaigns = state.monthlyPlans[key].campaigns || [];
  const c = campaigns.find(x=>x.id===campId);
  if (!c) return;
  const field = section==='strat' ? 'stratImages' : 'designImages';
  if (!c[field]) c[field] = [];
  if (c[field].find(img=>img.url===m.url)) { showToast('Already in this campaign',''); return; }
  c[field].push({ url:m.url, name:m.name, brief:'' });
  saveState();
  showToast(`✅ Added to ${c.name} — ${section==='strat'?'Strategy refs':'Designs'}!`, 'success');
}
