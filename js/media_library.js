/* ============================================================
   MEDIA LIBRARY  —  memory-safe upload
   
   CRITICAL FIX: Never use FileReader + base64 for images.
   Base64 inflates file size by 33% and storing multiple
   images in memory crashes Chrome ("Out of Memory").
   
   Solution: URL.createObjectURL() — creates a tiny pointer
   to the file in browser memory. No inflation, no crash.
   Works perfectly within the session.
   ============================================================ */

// Object URL store — tiny pointers, not base64 blobs
const _mediaBlobs = {};

/* ── RENDER ───────────────────────────────────────────────── */
function renderMediaLibrary() {
  _renderMediaStats();
  renderMediaGrid('all');
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

function renderMediaGrid(filter) {
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
        <div style="font-size:13px;margin-bottom:18px">Upload multiple images or videos at once, or import from Google Drive</div>
        <label class="btn btn-primary" style="cursor:pointer;display:inline-flex;align-items:center;gap:8px">
          <input type="file" accept="image/*,video/*" multiple style="display:none" onchange="handleDeviceUpload(this)">
          📁 Upload files
        </label>
      </div>`;
    return;
  }

  el.innerHTML = items.map(m => {
    const src  = _mediaBlobs[m.id] || (m.source === 'drive' ? m.url : null);
    const icon = m.type === 'video' ? '🎬' : '🖼️';
    // Use <img> tag — works with blob: URLs from file:// pages
    // CSS background-image does NOT work with blob: from file://
    const thumbInner = src
      ? `<img src="${src}" loading="lazy"
           style="width:100%;height:100%;object-fit:cover;display:block;border-radius:var(--r-md) var(--r-md) 0 0"
           onerror="this.style.display='none';this.parentElement.innerHTML+='<div style=\'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:4px\'><span style=\'font-size:28px\'>${icon}</span><span style=\'font-size:9px;color:var(--text3)\'>Re-upload</span></div>'">`
      : `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:4px;background:var(--surface3)">
           <span style="font-size:28px">${icon}</span>
           <span style="font-size:9px;color:var(--text3);text-align:center;padding:0 8px">Re-upload to preview</span>
         </div>`;

    return `<div class="media-card" onclick="toggleSelectMedia(${m.id})">
      <div class="media-thumb" style="position:relative;background:var(--surface3);overflow:hidden">
        ${thumbInner}
        <div class="media-overlay" style="position:absolute;inset:0;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .18s">
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();useMedia(${m.id})">Use in post</button>
        </div>
      </div>
      <div class="media-info">
        <div class="media-name" title="${m.name}">${m.name}</div>
        <div class="media-meta">${m.size||''} · ${m.source==='drive'?'☁️ Drive':'📱 Device'}</div>
        <div class="media-tags">${(m.tags||[]).map(t=>`<span class="media-tag">${t}</span>`).join('')}</div>
      </div>
      <button class="media-delete" onclick="event.stopPropagation();deleteMedia(${m.id})" title="Remove">✕</button>
    </div>`;
  }).join('');
}

function filterMedia(type, el) {
  document.querySelectorAll('#view-media .ftab').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  renderMediaGrid(type);
}

/* ── BULK DEVICE UPLOAD ─────────────────────────────────────
   Uses URL.createObjectURL — zero memory inflation, no crash.
   Works for 50+ images at once.
───────────────────────────────────────────────────────────── */
function handleDeviceUpload(input) {
  const files = Array.from(input.files || []);
  if (!files.length) return;

  showToast(`📁 Adding ${files.length} file${files.length>1?'s':''}…`);

  let added = 0;
  if (!state.mediaLibrary) state.mediaLibrary = [];

  files.forEach(file => {
    const isImg = file.type.startsWith('image/');
    const isVid = file.type.startsWith('video/');
    if (!isImg && !isVid) return;

    const id  = genId();
    // createObjectURL = tiny pointer, no base64, no memory issue
    const url = URL.createObjectURL(file);
    _mediaBlobs[id] = url;

    state.mediaLibrary.push({
      id,
      name:   file.name,
      type:   isVid ? 'video' : 'image',
      size:   _fmtSize(file.size),
      tags:   [],
      date:   new Date().toISOString().split('T')[0],
      source: 'upload',
      url:    null,   // never store blob in localStorage
      thumb:  null,
    });
    added++;
  });

  input.value = '';
  _saveMetadataOnly();
  renderMediaLibrary();
  _renderMediaStats();
  showToast(`✅ ${added} file${added>1?'s':''} added!`, 'success');
}

/* Save only metadata — never image data — to localStorage */
function _saveMetadataOnly() {
  try {
    const safe = {
      ...state,
      mediaLibrary: (state.mediaLibrary || []).map(m => ({
        id: m.id, name: m.name, type: m.type, size: m.size,
        tags: m.tags, date: m.date, source: m.source,
        // Only preserve Drive URLs (they are short strings, not blobs)
        url:   m.source === 'drive' ? m.url   : null,
        thumb: m.source === 'drive' ? m.thumb : null,
      }))
    };
    localStorage.setItem('socialhub_v2', JSON.stringify(safe));
  } catch(e) {
    console.warn('Storage full:', e);
    // Last resort — save state without media list
    try {
      localStorage.setItem('socialhub_v2', JSON.stringify({...state, mediaLibrary:[]}));
    } catch(e2) {}
  }
}

/* ── GOOGLE DRIVE IMPORT ──────────────────────────────────── */
function importFromDrive() {
  document.getElementById('modalTitle').textContent = '☁️ Import from Google Drive';
  document.getElementById('modalBody').innerHTML = `

    <!-- Big Open Drive button -->
    <div style="display:flex;align-items:center;gap:14px;padding:16px 18px;background:linear-gradient(135deg,#F0F9FF,#DBEAFE);border:2px solid #93C5FD;border-radius:var(--r-xl);margin-bottom:16px">
      <div style="width:48px;height:48px;background:#fff;border-radius:var(--r-lg);display:flex;align-items:center;justify-content:center;font-size:26px;box-shadow:var(--sh-sm);flex-shrink:0">☁️</div>
      <div style="flex:1">
        <div style="font-size:14px;font-weight:800;color:var(--text)">Step 1 — Open Google Drive</div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px">Find your image → right-click → Share → "Anyone with link" → Copy link</div>
      </div>
      <button onclick="window.open('https://drive.google.com/drive/my-drive','_blank')"
        style="padding:10px 18px;background:#1A73E8;color:#fff;border:none;border-radius:24px;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap;font-family:var(--font);box-shadow:0 3px 12px rgba(26,115,232,.35);flex-shrink:0">
        Open Drive ↗
      </button>
    </div>

    <!-- Step 2: Paste -->
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

    <!-- Live preview -->
    <div id="drive-modal-preview" style="margin-bottom:14px"></div>

    <!-- File details -->
    <div style="font-size:12px;font-weight:700;color:var(--text2);margin-bottom:8px">Step 3 — Confirm details</div>
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
      <label class="form-label">Tags (optional, comma-separated)</label>
      <input class="form-input" id="drive-tags" placeholder="summer, product, sale">
    </div>

    <!-- Bulk tip -->
    <div style="background:var(--amber-light);border:1.5px solid var(--amber);border-radius:var(--r-lg);padding:10px 14px;font-size:11px;color:#92400E;line-height:1.6">
      💡 <strong>Bulk import:</strong> Import files one at a time. After each import, click "Import from Drive" again for the next file.
    </div>`;

  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-ghost" onclick="window.open('https://drive.google.com/drive/my-drive','_blank')">☁️ Open Drive</button>
    <button class="btn btn-primary" onclick="saveDriveImport()">⬇ Import to library</button>`;
  document.getElementById('modalOverlay').classList.add('open');

  // Auto-paste if clipboard already has a Drive URL
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
  if (!m) {
    el.innerHTML = `<div style="padding:10px;background:var(--coral-light);border-radius:var(--r-md);font-size:12px;color:var(--coral)">
      ❌ This doesn't look like a Drive file link. Make sure the URL contains <code>/d/</code>
    </div>`;
    return;
  }

  const fileId = m[1];
  // Use thumbnail URL — much faster than full uc?export=view
  const thumb  = `https://drive.google.com/thumbnail?id=${fileId}&sz=w480`;
  const direct = `https://drive.google.com/uc?export=view&id=${fileId}`;

  // Auto-fill name
  const nameEl = document.getElementById('drive-name');
  if (nameEl && !nameEl.value) nameEl.value = `drive-file-${fileId.slice(0,8)}.jpg`;

  // Store the direct URL for import
  window._driveImportUrl = direct;

  el.innerHTML = `
    <div style="background:var(--surface2);border:1.5px solid var(--border);border-radius:var(--r-lg);padding:12px;text-align:center">
      <div style="font-size:11px;color:var(--text3);margin-bottom:8px">Preview loading…</div>
      <img src="${thumb}" alt="Drive preview"
        style="max-height:180px;max-width:100%;object-fit:contain;border-radius:var(--r-md);display:block;margin:0 auto;border:1.5px solid var(--border)"
        onload="this.previousSibling.textContent='✅ Preview loaded — ready to import';this.previousSibling.style.color='var(--green)';this.previousSibling.style.fontWeight='700'"
        onerror="this.style.display='none';this.previousSibling.innerHTML='❌ Could not load preview.<br><strong>Fix:</strong> In Drive → right-click file → Share → change to <strong>Anyone with the link</strong> → Copy → paste again.';this.previousSibling.style.color='var(--coral)'">
      <div style="margin-top:8px">
        <a href="${direct}" target="_blank" style="font-size:11px;color:var(--brand)">Open full size ↗</a>
      </div>
    </div>`;
}

function saveDriveImport() {
  const url  = (document.getElementById('drive-url').value  || '').trim();
  const name = (document.getElementById('drive-name').value || '').trim() || 'drive-file.jpg';
  if (!url) { showToast('Paste a Google Drive link first', 'error'); return; }

  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!m) { showToast('Not a valid Drive file link', 'error'); return; }

  const fileId   = m[1];
  const directUrl= `https://drive.google.com/uc?export=view&id=${fileId}`;
  const type     = document.getElementById('drive-type').value;
  const tags     = (document.getElementById('drive-tags').value||'').split(',').map(t=>t.trim()).filter(Boolean);
  const id       = genId();

  _mediaBlobs[id] = directUrl;

  if (!state.mediaLibrary) state.mediaLibrary = [];
  state.mediaLibrary.push({
    id, name, type,
    url: directUrl, thumb: directUrl,
    size: 'Drive', tags,
    date: new Date().toISOString().split('T')[0],
    source: 'drive'
  });

  saveState();
  closeModal();
  renderMediaLibrary();
  showToast('☁️ Drive file imported!', 'success');
}

/* ── ACTIONS ──────────────────────────────────────────────── */
function toggleSelectMedia(id) {
  const m = (state.mediaLibrary||[]).find(x=>x.id===id);
  if (m) { m._selected = !m._selected; renderMediaGrid('all'); }
}

function useMedia(id) {
  const m   = (state.mediaLibrary||[]).find(x=>x.id===id);
  const url = _mediaBlobs[id] || (m&&m.url);
  if (!url) { showToast('Image not available — re-upload it', 'error'); return; }

  const preview = document.getElementById('cadd-file-preview');
  if (preview) {
    preview.innerHTML = `<img src="${url}" style="width:100%;max-height:120px;object-fit:cover;border-radius:var(--r-lg);border:1.5px solid var(--border)">
      <div style="font-size:11px;color:var(--green);font-weight:600;margin-top:4px">✅ ${m?m.name:'Image'} selected</div>`;
    window._caddAttachment = { url, name: m?m.name:'image' };
    // Switch to device tab to show preview
    const devTab = document.querySelector('.mat-tab');
    if (devTab) switchMediaTab('device', devTab);
    showToast(`✅ "${m?m.name:'Image'}" ready`, 'success');
  } else {
    showToast('Open a post form first, then pick from Library tab', '');
  }
}

function deleteMedia(id) {
  if (!confirm('Remove from library?')) return;
  if (_mediaBlobs[id]) { URL.revokeObjectURL(_mediaBlobs[id]); delete _mediaBlobs[id]; }
  state.mediaLibrary = (state.mediaLibrary||[]).filter(m=>m.id!==id);
  _saveMetadataOnly();
  renderMediaLibrary();
  showToast('File removed');
}

/* ── MINI LIBRARY (inside add post modal) ─────────────────── */
function _populateMiniLibrary() {
  const el = document.getElementById('cadd-library-grid');
  if (!el) return;
  const lib = (state.mediaLibrary||[]).filter(m => _mediaBlobs[m.id] || (m.source==='drive'&&m.url));
  if (!lib.length) {
    el.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:12px;text-align:center;grid-column:1/-1">No images yet — upload some first</div>';
    return;
  }
  el.innerHTML = lib.map(m => {
    const src = _mediaBlobs[m.id] || m.url;
    return `<div class="media-mini-card" onclick="selectLibraryMedia(${m.id})" id="mmc-${m.id}" title="${m.name}"
      style="background:var(--surface3);min-height:60px;display:flex;align-items:center;justify-content:center">
      <img src="${src}" style="width:100%;height:60px;object-fit:cover;display:block"
        onerror="this.style.display='none';this.parentElement.innerHTML='<span style=\'font-size:18px\'>🖼️</span>'">
    </div>`;
  }).join('');
}

function selectLibraryMedia(id) {
  const m   = (state.mediaLibrary||[]).find(x=>x.id===id);
  const url = _mediaBlobs[id] || (m&&m.url);
  if (!url) { showToast('Image not available — re-upload it', 'error'); return; }
  document.querySelectorAll('.media-mini-card').forEach(c=>c.classList.remove('selected'));
  const card = document.getElementById('mmc-'+id);
  if (card) card.classList.add('selected');
  window._caddAttachment = { url, name: m?m.name:'image' };
  const lbl = document.getElementById('cadd-library-selected');
  if (lbl) { lbl.textContent=`✅ "${m?m.name:'Image'}" selected`; lbl.style.display=''; }
  showToast('✅ Image selected', 'success');
}

/* ── HELPERS ──────────────────────────────────────────────── */
function _fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024)         return bytes + ' B';
  if (bytes < 1024*1024)    return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/(1024*1024)).toFixed(1) + ' MB';
}
