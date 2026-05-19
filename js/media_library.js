/* ============================================================
   MEDIA LIBRARY — IndexedDB storage
   
   WHY INDEXEDDB:
   - localStorage: 5MB limit → crashes on images
   - URL.createObjectURL: dies on page reload
   - IndexedDB: stores actual binary files, no size limit,
     survives reloads, works offline, built into every browser
   ============================================================ */

const DB_NAME    = 'socialhub_media';
const DB_VERSION = 1;
const STORE_NAME = 'files';
let   _idb       = null;

/* ── Open IndexedDB ─────────────────────────────────────────── */
function openMediaDB() {
  return new Promise((resolve, reject) => {
    if (_idb) { resolve(_idb); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = e => { _idb = e.target.result; resolve(_idb); };
    req.onerror   = e => reject(e.target.error);
  });
}

async function saveFileToIDB(id, file) {
  const db   = await openMediaDB();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const tx    = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ id, data: e.target.result, type: file.type, name: file.name });
      tx.oncomplete = () => resolve(e.target.result);
      tx.onerror    = err => reject(err);
    };
    reader.readAsDataURL(file);
  });
}

async function getFileFromIDB(id) {
  const db = await openMediaDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req   = store.get(id);
    req.onsuccess = e => resolve(e.target.result ? e.target.result.data : null);
    req.onerror   = e => reject(e.target.error);
  });
}

async function deleteFileFromIDB(id) {
  const db = await openMediaDB();
  return new Promise((resolve) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
  });
}

/* In-memory cache so we don't re-read IDB every render */
const _imgCache = {};

async function getThumb(m) {
  if (_imgCache[m.id]) return _imgCache[m.id];
  if (m.source === 'drive' && m.url) { _imgCache[m.id] = m.url; return m.url; }
  try {
    const data = await getFileFromIDB(m.id);
    if (data) { _imgCache[m.id] = data; return data; }
  } catch(e) {}
  return null;
}

/* ── RENDER ───────────────────────────────────────────────── */
function renderMediaLibrary() {
  _renderMediaStats();
  renderMediaGridAsync('all');
}

function _renderMediaStats() {
  const el = document.getElementById('mediaStats');
  if (!el) return;
  const lib    = state.mediaLibrary || [];
  const images = lib.filter(m => m.type === 'image').length;
  const videos = lib.filter(m => m.type === 'video').length;
  const drives = lib.filter(m => m.source === 'drive').length;
  el.innerHTML = `
    <div class="meta-stat-card"><div class="msc-label">Total files</div><div class="msc-val">${lib.length}</div><div class="msc-sub">In library</div></div>
    <div class="meta-stat-card"><div class="msc-label">Images</div><div class="msc-val">${images}</div><div class="msc-sub">Photos & graphics</div></div>
    <div class="meta-stat-card"><div class="msc-label">Videos</div><div class="msc-val">${videos}</div><div class="msc-sub">Reels & clips</div></div>
    <div class="meta-stat-card"><div class="msc-label">Drive imports</div><div class="msc-val">${drives}</div><div class="msc-sub">From Google Drive</div></div>`;
}

async function renderMediaGridAsync(filter) {
  const el = document.getElementById('mediaGrid');
  if (!el) return;
  const lib   = state.mediaLibrary || [];
  let   items = filter && filter !== 'all' ? lib.filter(m => m.type === filter) : [...lib];

  document.querySelectorAll('#view-media .ftab').forEach(b => b.classList.remove('active'));
  const tab = document.querySelector(`#view-media .ftab[data-filter="${filter}"]`);
  if (tab) tab.classList.add('active');

  if (!items.length) {
    el.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:50px;color:var(--text3)">
        <div style="font-size:48px;margin-bottom:14px">📁</div>
        <div style="font-size:16px;font-weight:800;color:var(--text2);margin-bottom:8px">Media library is empty</div>
        <div style="font-size:13px;margin-bottom:18px">Upload images or videos — they save permanently and survive page reloads</div>
        <label class="btn btn-primary" style="cursor:pointer;display:inline-flex;align-items:center;gap:8px">
          <input type="file" accept="image/*,video/*" multiple style="display:none" onchange="handleDeviceUpload(this)">
          📁 Upload files
        </label>
      </div>`;
    return;
  }

  // Show skeleton first
  el.innerHTML = items.map(m => `
    <div class="media-card" id="mc-${m.id}">
      <div class="media-thumb" style="background:var(--surface3);display:flex;align-items:center;justify-content:center">
        <div style="font-size:24px;opacity:.4">${m.type==='video'?'🎬':'🖼️'}</div>
      </div>
      <div class="media-info">
        <div class="media-name" title="${m.name}">${m.name}</div>
        <div class="media-meta">${m.size||''} · ${m.source==='drive'?'☁️ Drive':'📱 Device'}</div>
      </div>
    </div>`).join('');

  // Load thumbnails asynchronously
  for (const m of items) {
    const card = document.getElementById('mc-' + m.id);
    if (!card) continue;
    const src = await getThumb(m);
    const thumb = card.querySelector('.media-thumb');
    if (thumb) {
      if (src) {
        thumb.innerHTML = `
          <img src="${src}" style="width:100%;height:140px;object-fit:cover;display:block;border-radius:var(--r-md) var(--r-md) 0 0"
            onerror="this.parentElement.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;height:140px;font-size:28px\\'>🖼️</div>'">
          <div class="media-overlay">
            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();useMedia(${m.id})">Use in post</button>
          </div>`;
      } else {
        thumb.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:140px;gap:6px;background:var(--surface3)">
            <span style="font-size:28px">${m.type==='video'?'🎬':'🖼️'}</span>
            <span style="font-size:10px;color:var(--text3)">No preview</span>
          </div>
          <div class="media-overlay">
            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();useMedia(${m.id})">Use in post</button>
          </div>`;
      }
    }
    // Re-wire click and delete
    card.onclick = () => selectMediaCard(m.id, card);
    card.innerHTML += `<button class="media-delete" onclick="event.stopPropagation();deleteMedia(${m.id})" title="Remove">✕</button>`;
  }
}

function renderMediaGrid(filter) { renderMediaGridAsync(filter || 'all'); }
function filterMedia(type, el) {
  document.querySelectorAll('#view-media .ftab').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  renderMediaGridAsync(type);
}

/* ── UPLOAD ───────────────────────────────────────────────── */
async function handleDeviceUpload(input) {
  const files = Array.from(input.files || []);
  if (!files.length) return;
  input.value = '';

  showToast(`📁 Saving ${files.length} file${files.length>1?'s':''}…`);

  let added = 0;
  if (!state.mediaLibrary) state.mediaLibrary = [];

  for (const file of files) {
    const isImg = file.type.startsWith('image/');
    const isVid = file.type.startsWith('video/');
    if (!isImg && !isVid) continue;

    const id = genId();
    try {
      const dataUrl = await saveFileToIDB(id, file);
      _imgCache[id] = dataUrl; // cache immediately

      state.mediaLibrary.push({
        id, name: file.name,
        type: isVid ? 'video' : 'image',
        size: _fmtSize(file.size),
        tags: [], date: new Date().toISOString().split('T')[0],
        source: 'upload', url: null, thumb: null,
      });
      added++;
    } catch(e) {
      console.warn('Failed to save file:', file.name, e);
    }
  }

  _saveMetadataOnly();
  renderMediaLibrary();
  showToast(`✅ ${added} file${added>1?'s':''} saved permanently!`, 'success');
}

/* ── GOOGLE DRIVE IMPORT ──────────────────────────────────── */
function importFromDrive() {
  document.getElementById('modalTitle').textContent = '☁️ Import from Google Drive';
  document.getElementById('modalBody').innerHTML = `

    <div style="display:flex;align-items:center;gap:14px;padding:16px 18px;background:linear-gradient(135deg,#F0F9FF,#DBEAFE);border:2px solid #93C5FD;border-radius:var(--r-xl);margin-bottom:16px">
      <div style="font-size:28px">☁️</div>
      <div style="flex:1">
        <div style="font-size:14px;font-weight:800;color:var(--text)">Step 1 — Open Google Drive</div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px">Find your image → right-click → Share → "Anyone with link" → Copy link</div>
      </div>
      <button onclick="window.open('https://drive.google.com/drive/my-drive','_blank')"
        style="padding:10px 18px;background:#1A73E8;color:#fff;border:none;border-radius:24px;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap;font-family:var(--font);box-shadow:0 3px 12px rgba(26,115,232,.35);flex-shrink:0">
        Open Drive ↗
      </button>
    </div>

    <div style="font-size:12px;font-weight:700;color:var(--text2);margin-bottom:8px">Step 2 — Paste the link</div>
    <div style="position:relative;margin-bottom:10px">
      <input class="form-input" id="drive-url"
        placeholder="Paste Google Drive link here — preview appears automatically"
        style="padding-right:86px"
        oninput="previewDriveModalImage(this.value)"
        onpaste="setTimeout(()=>previewDriveModalImage(document.getElementById('drive-url').value),60)">
      <button onclick="(async()=>{try{const t=await navigator.clipboard.readText();const i=document.getElementById('drive-url');if(i){i.value=t;previewDriveModalImage(t);}}catch(e){showToast('Paste with Ctrl+V','');}})()"
        style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:var(--brand);color:#fff;border:none;border-radius:16px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:var(--font)">
        📋 Paste
      </button>
    </div>

    <div id="drive-modal-preview" style="margin-bottom:14px"></div>

    <div style="font-size:12px;font-weight:700;color:var(--text2);margin-bottom:8px">Step 3 — Name & save</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">File name</label>
        <input class="form-input" id="drive-name" placeholder="e.g. summer-banner.jpg">
      </div>
      <div class="form-group">
        <label class="form-label">Type</label>
        <select class="form-select" id="drive-type">
          <option value="image">🖼 Image</option>
          <option value="video">🎬 Video</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Tags (optional)</label>
      <input class="form-input" id="drive-tags" placeholder="summer, product, sale">
    </div>`;

  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-ghost" onclick="window.open('https://drive.google.com/drive/my-drive','_blank')">☁️ Open Drive</button>
    <button class="btn btn-primary" onclick="saveDriveImport()">⬇ Import</button>`;
  document.getElementById('modalOverlay').classList.add('open');

  setTimeout(async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (t && t.includes('drive.google.com')) {
        const inp = document.getElementById('drive-url');
        if (inp && !inp.value) { inp.value = t; previewDriveModalImage(t); }
      }
    } catch(e) {}
  }, 200);
}

function previewDriveModalImage(url) {
  const el = document.getElementById('drive-modal-preview');
  if (!el) return;
  if (!url || !url.includes('drive.google.com')) { el.innerHTML = ''; return; }
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!m) { el.innerHTML = `<div style="color:var(--coral);font-size:12px;padding:8px">Not a valid Drive file link</div>`; return; }
  const fileId = m[1];
  const thumb  = `https://drive.google.com/thumbnail?id=${fileId}&sz=w480`;
  const direct = `https://drive.google.com/uc?export=view&id=${fileId}`;
  const nameEl = document.getElementById('drive-name');
  if (nameEl && !nameEl.value) nameEl.value = `drive-file-${fileId.slice(0,8)}.jpg`;
  el.innerHTML = `
    <div style="background:var(--surface2);border:1.5px solid var(--border);border-radius:var(--r-lg);padding:12px;text-align:center">
      <div style="font-size:11px;color:var(--text3);margin-bottom:8px">Loading preview…</div>
      <img src="${thumb}" style="max-height:160px;max-width:100%;object-fit:contain;border-radius:var(--r-md);display:block;margin:0 auto;border:1.5px solid var(--border)"
        onload="this.previousSibling.textContent='✅ Preview loaded';this.previousSibling.style.color='var(--green)';this.previousSibling.style.fontWeight='700'"
        onerror="this.style.display='none';this.previousSibling.innerHTML='❌ Cannot load — make sure sharing is set to <strong>Anyone with the link</strong>';this.previousSibling.style.color='var(--coral)'">
    </div>`;
  window._driveImportUrl = direct;
}

function saveDriveImport() {
  const url  = (document.getElementById('drive-url').value || '').trim();
  const name = (document.getElementById('drive-name').value || '').trim() || 'drive-file.jpg';
  if (!url) { showToast('Paste a Google Drive link first', 'error'); return; }
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!m) { showToast('Not a valid Drive file link', 'error'); return; }
  const fileId    = m[1];
  const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
  const type      = document.getElementById('drive-type').value;
  const tags      = (document.getElementById('drive-tags').value||'').split(',').map(t=>t.trim()).filter(Boolean);
  const id        = genId();
  _imgCache[id]   = directUrl;
  if (!state.mediaLibrary) state.mediaLibrary = [];
  state.mediaLibrary.push({ id, name, type, url: directUrl, thumb: directUrl, size: 'Drive', tags, date: new Date().toISOString().split('T')[0], source: 'drive' });
  saveState(); closeModal(); renderMediaLibrary();
  showToast('☁️ Drive file imported!', 'success');
}

/* ── ACTIONS ──────────────────────────────────────────────── */
function selectMediaCard(id, card) {
  document.querySelectorAll('.media-card').forEach(c => c.classList.remove('selected'));
  card.classList.toggle('selected');
}

async function useMedia(id) {
  const m   = (state.mediaLibrary||[]).find(x=>x.id===id);
  const url = await getThumb(m) || (m&&m.url);
  if (!url) { showToast('Image not available', 'error'); return; }
  const preview = document.getElementById('cadd-file-preview');
  if (preview) {
    preview.innerHTML = `<img src="${url}" style="width:100%;max-height:120px;object-fit:cover;border-radius:var(--r-lg);border:1.5px solid var(--border)">
      <div style="font-size:11px;color:var(--green);font-weight:600;margin-top:4px">✅ ${m?m.name:'Image'} selected</div>`;
    window._caddAttachment = { url, name: m?m.name:'image' };
    const devTab = document.querySelector('.mat-tab');
    if (devTab) switchMediaTab('device', devTab);
    showToast(`✅ "${m?m.name:'Image'}" ready`, 'success');
  } else {
    showToast('Open a post form first, then pick from Library tab', '');
  }
}

async function deleteMedia(id) {
  await deleteFileFromIDB(id);
  delete _imgCache[id];
  state.mediaLibrary = (state.mediaLibrary||[]).filter(m=>m.id!==id);
  _saveMetadataOnly();
  renderMediaLibrary();
  showToast('File removed');
}

/* ── MINI LIBRARY (inside add post modal) ─────────────────── */
async function _populateMiniLibrary() {
  const el = document.getElementById('cadd-library-grid');
  if (!el) return;
  const lib = (state.mediaLibrary||[]).filter(m => m.source === 'drive' ? m.url : true);
  if (!lib.length) {
    el.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:12px;text-align:center;grid-column:1/-1">No images yet — upload some first</div>';
    return;
  }
  el.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:8px;grid-column:1/-1">Loading…</div>';
  const cards = [];
  for (const m of lib) {
    const src = await getThumb(m);
    if (src) cards.push({ m, src });
  }
  if (!cards.length) {
    el.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:12px;text-align:center;grid-column:1/-1">No previews available — upload images first</div>';
    return;
  }
  el.innerHTML = cards.map(({m, src}) =>
    `<div class="media-mini-card" onclick="selectLibraryMedia(${m.id})" id="mmc-${m.id}" title="${m.name}">
      <img src="${src}" style="width:100%;height:60px;object-fit:cover;display:block">
    </div>`
  ).join('');
}

async function selectLibraryMedia(id) {
  const m   = (state.mediaLibrary||[]).find(x=>x.id===id);
  const url = await getThumb(m);
  if (!url) { showToast('Image not available', 'error'); return; }
  document.querySelectorAll('.media-mini-card').forEach(c=>c.classList.remove('selected'));
  const card = document.getElementById('mmc-'+id);
  if (card) card.classList.add('selected');
  window._caddAttachment = { url, name: m?m.name:'image' };
  const lbl = document.getElementById('cadd-library-selected');
  if (lbl) { lbl.textContent=`✅ "${m?m.name:'Image'}" selected`; lbl.style.display=''; }
  showToast('✅ Image selected', 'success');
}

/* ── METADATA SAVE (no binary data in localStorage) ─────── */
function _saveMetadataOnly() {
  try {
    const safe = {
      ...state,
      mediaLibrary: (state.mediaLibrary||[]).map(m => ({
        id:m.id, name:m.name, type:m.type, size:m.size,
        tags:m.tags, date:m.date, source:m.source,
        url:   m.source==='drive' ? m.url   : null,
        thumb: m.source==='drive' ? m.thumb : null,
      }))
    };
    localStorage.setItem('socialhub_v2', JSON.stringify(safe));
  } catch(e) { console.warn('Save error:', e); }
}

/* ── HANDLE UPLOAD FROM ADD POST MODAL ───────────────────── */
async function handleCaddFile(input, source) {
  const file = input.files[0];
  if (!file) return;
  const id     = genId();
  const dataUrl = await saveFileToIDB(id, file);
  _imgCache[id] = dataUrl;
  window._caddAttachment = { url: dataUrl, name: file.name, id };

  const previewId = source === 'drive' ? 'cadd-drive-file-preview' : 'cadd-file-preview';
  const preview   = document.getElementById(previewId);
  if (preview) {
    if (file.type.startsWith('image/')) {
      preview.innerHTML = `<img src="${dataUrl}" style="width:100%;max-height:130px;object-fit:cover;border-radius:var(--r-lg);border:1.5px solid var(--border)">
        <div style="font-size:11px;color:var(--green);font-weight:600;margin-top:4px">✅ ${file.name} saved</div>`;
    } else {
      preview.innerHTML = `<div style="background:var(--surface2);border-radius:var(--r-lg);padding:10px;font-size:12px;color:var(--green);font-weight:600">🎬 ${file.name} ready</div>`;
    }
  }

  // Add to media library too
  if (!state.mediaLibrary) state.mediaLibrary = [];
  if (!state.mediaLibrary.find(m=>m.id===id)) {
    state.mediaLibrary.push({ id, name:file.name, type:file.type.startsWith('video/')?'video':'image', size:_fmtSize(file.size), tags:[], date:new Date().toISOString().split('T')[0], source:source||'upload', url:null, thumb:null });
    _saveMetadataOnly();
  }
  input.value = '';
}

/* ── HELPERS ──────────────────────────────────────────────── */
function _fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024)       return bytes + ' B';
  if (bytes < 1024*1024)  return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/(1024*1024)).toFixed(1) + ' MB';
}
