/* ============================================================
   MEDIA LIBRARY — Cloudinary cloud storage
   Cloud name: dtegieseu
   Auto-uploads images/videos → permanent URLs → shared across all team members
   ============================================================ */

const CLOUDINARY_CLOUD = 'dtegieseu';
const CLOUDINARY_PRESET = 'Media Library'; // unsigned upload preset

/* ── Upload a file to Cloudinary ────────────────────────────── */
async function uploadToCloudinary(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_PRESET);
  formData.append('folder', 'socialhub');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`);

    xhr.upload.onprogress = e => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        resolve({ url: res.secure_url, publicId: res.public_id, width: res.width, height: res.height });
      } else {
        reject(new Error('Upload failed: ' + xhr.status));
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(formData);
  });
}

/* ══════════════════════════════════════════════════════════
   RENDER
══════════════════════════════════════════════════════════ */
function renderMediaLibrary() {
  _renderMediaStats();
  _renderMediaGrid();
}

function _renderMediaStats() {
  const el  = document.getElementById('mediaStats');
  if (!el) return;
  const lib = state.mediaLibrary || [];
  el.innerHTML = `
    <div class="meta-stat-card"><div class="msc-label">Total files</div><div class="msc-val">${lib.length}</div><div class="msc-sub">In library</div></div>
    <div class="meta-stat-card"><div class="msc-label">Images</div><div class="msc-val">${lib.filter(m=>m.type==='image').length}</div><div class="msc-sub">Photos & graphics</div></div>
    <div class="meta-stat-card"><div class="msc-label">Videos</div><div class="msc-val">${lib.filter(m=>m.type==='video').length}</div><div class="msc-sub">Reels & clips</div></div>
    <div class="meta-stat-card"><div class="msc-label">Cloud stored</div><div class="msc-val">${lib.filter(m=>m.source==='cloudinary').length}</div><div class="msc-sub">On Cloudinary</div></div>`;
}

function _renderMediaGrid() {
  const el    = document.getElementById('mediaGrid');
  const items = state.mediaLibrary || [];
  if (!el) return;

  if (!items.length) {
    el.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:50px;color:var(--text3)">
        <div style="font-size:48px;margin-bottom:14px">📁</div>
        <div style="font-size:16px;font-weight:800;color:var(--text2);margin-bottom:8px">Media library is empty</div>
        <div style="font-size:13px;margin-bottom:18px">Upload images or videos — stored permanently on Cloudinary, shared with your whole team</div>
        <label class="btn btn-primary" style="cursor:pointer;display:inline-flex;align-items:center;gap:8px">
          <input type="file" accept="image/*,video/*" multiple style="display:none" onchange="handleDeviceUpload(this)">
          📁 Upload files
        </label>
      </div>`;
    return;
  }

  el.innerHTML = items.map(m => {
    const thumb = m.url
      ? (m.type === 'image'
          ? m.url.replace('/upload/', '/upload/w_400,h_280,c_fill/')
          : m.url.replace('/upload/', '/upload/so_0,w_400,h_280,c_fill/'))
      : null;
    return `<div class="media-card" id="mc-${m.id}" onclick="selectMediaCard(${m.id})">
      <div class="media-thumb" style="height:140px;overflow:hidden;position:relative;background:var(--surface3)">
        ${thumb
          ? `<img src="${thumb}" style="width:100%;height:140px;object-fit:cover;display:block"
              onerror="this.style.display='none'">`
          : `<div style="display:flex;align-items:center;justify-content:center;height:140px;font-size:32px">${m.type==='video'?'🎬':'🖼️'}</div>`}
        <div class="media-overlay">
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();useMedia(${m.id})">Use in post</button>
        </div>
        ${m.source==='cloudinary'?'<div style="position:absolute;top:6px;left:6px;background:rgba(0,0,0,.55);color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:10px">☁️ Cloud</div>':''}
      </div>
      <div class="media-info">
        <div class="media-name" title="${m.name}">${m.name}</div>
        <div class="media-meta">${m.size||''} · ${m.source==='cloudinary'?'☁️ Cloudinary':m.source==='drive'?'☁️ Drive':'📱 Device'}</div>
        <div class="media-tags">${(m.tags||[]).map(t=>`<span class="media-tag">${t}</span>`).join('')}</div>
      </div>
      <button class="media-delete" onclick="event.stopPropagation();deleteMedia(${m.id})" title="Remove">✕</button>
    </div>`;
  }).join('');
}

function filterMedia(type, el) {
  document.querySelectorAll('#view-media .ftab').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  const items = type && type !== 'all'
    ? (state.mediaLibrary||[]).filter(m => m.type === type)
    : (state.mediaLibrary||[]);
  // re-render with filter
  const orig = state.mediaLibrary;
  state.mediaLibrary = items;
  _renderMediaGrid();
  state.mediaLibrary = orig;
}

/* ══════════════════════════════════════════════════════════
   UPLOAD — auto uploads to Cloudinary, no URL pasting
══════════════════════════════════════════════════════════ */
async function handleDeviceUpload(input) {
  const files = Array.from(input.files || []);
  if (!files.length) return;
  input.value = '';

  if (CLOUDINARY_PRESET === 'PASTE_PRESET_NAME_HERE') {
    showToast('⚠️ Set up Cloudinary preset first — see Media Library settings', 'error');
    _showCloudinarySetup();
    return;
  }

  // Show progress UI
  const grid = document.getElementById('mediaGrid');
  const progressHtml = files.map((f, i) => `
    <div id="upload-prog-${i}" style="background:var(--white);border:1.5px solid var(--border);border-radius:var(--r-xl);padding:14px;box-shadow:var(--sh-sm)">
      <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.name}</div>
      <div style="background:var(--surface3);border-radius:4px;height:6px;overflow:hidden">
        <div id="bar-${i}" style="height:100%;background:var(--brand);border-radius:4px;width:0%;transition:width .3s"></div>
      </div>
      <div id="pct-${i}" style="font-size:11px;color:var(--text3);margin-top:4px">0%</div>
    </div>`).join('');

  if (grid) grid.innerHTML = `
    <div style="grid-column:1/-1;margin-bottom:12px;font-size:14px;font-weight:800;color:var(--text)">
      ☁️ Uploading ${files.length} file${files.length>1?'s':''} to Cloudinary…
    </div>
    ${progressHtml}`;

  let uploaded = 0;
  if (!state.mediaLibrary) state.mediaLibrary = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const isImg = file.type.startsWith('image/');
    const isVid = file.type.startsWith('video/');
    if (!isImg && !isVid) continue;

    try {
      const result = await uploadToCloudinary(file, pct => {
        const bar = document.getElementById('bar-' + i);
        const lbl = document.getElementById('pct-' + i);
        if (bar) bar.style.width = pct + '%';
        if (lbl) lbl.textContent = pct + '%';
      });

      // Mark complete
      const prog = document.getElementById('upload-prog-' + i);
      if (prog) prog.style.background = 'var(--green-light)';
      const lbl = document.getElementById('pct-' + i);
      if (lbl) { lbl.textContent = '✅ Done'; lbl.style.color = 'var(--green)'; lbl.style.fontWeight = '700'; }

      state.mediaLibrary.push({
        id:     genId(),
        name:   file.name,
        type:   isVid ? 'video' : 'image',
        size:   _fmtSize(file.size),
        url:    result.url,
        thumb:  result.url,
        tags:   [],
        date:   new Date().toISOString().split('T')[0],
        source: 'cloudinary',
        publicId: result.publicId,
      });
      uploaded++;
    } catch(err) {
      const lbl = document.getElementById('pct-' + i);
      if (lbl) { lbl.textContent = '❌ Failed — ' + err.message; lbl.style.color = 'var(--coral)'; }
    }
  }

  saveState();
  setTimeout(() => { renderMediaLibrary(); }, 1200);
  showToast(`✅ ${uploaded} file${uploaded>1?'s':''} uploaded to Cloudinary!`, 'success');
}

/* ── Upload from add post modal ─────────────────────────── */
async function handleCaddFile(input, source) {
  const file = input.files[0];
  if (!file) return;
  input.value = '';

  const previewId = source === 'drive' ? 'cadd-drive-file-preview' : 'cadd-file-preview';
  const preview   = document.getElementById(previewId);

  if (CLOUDINARY_PRESET === 'PASTE_PRESET_NAME_HERE') {
    // Fallback: use object URL for this session only
    const url = URL.createObjectURL(file);
    window._caddAttachment = { url, name: file.name };
    if (preview && file.type.startsWith('image/')) {
      preview.innerHTML = `<img src="${url}" style="width:100%;max-height:130px;object-fit:cover;border-radius:var(--r-lg);border:1.5px solid var(--border)">
        <div style="font-size:11px;color:var(--amber);font-weight:600;margin-top:4px">⚠️ Temporary — set up Cloudinary for permanent storage</div>`;
    }
    return;
  }

  if (preview) preview.innerHTML = `<div style="padding:10px;font-size:12px;color:var(--brand);font-weight:600">☁️ Uploading to Cloudinary…</div>`;

  try {
    const result = await uploadToCloudinary(file, pct => {
      if (preview) preview.innerHTML = `
        <div style="background:var(--surface2);border-radius:var(--r-lg);padding:10px">
          <div style="font-size:11px;color:var(--brand);font-weight:600;margin-bottom:6px">☁️ Uploading… ${pct}%</div>
          <div style="background:var(--border);border-radius:4px;height:4px"><div style="height:100%;background:var(--brand);border-radius:4px;width:${pct}%"></div></div>
        </div>`;
    });

    window._caddAttachment = { url: result.url, name: file.name, source: 'cloudinary' };

    if (preview) {
      preview.innerHTML = file.type.startsWith('image/')
        ? `<img src="${result.url}" style="width:100%;max-height:130px;object-fit:cover;border-radius:var(--r-lg);border:1.5px solid var(--border)">
           <div style="font-size:11px;color:var(--green);font-weight:600;margin-top:4px">✅ Uploaded to Cloudinary — permanent & shared</div>`
        : `<div style="background:var(--green-light);border-radius:var(--r-lg);padding:10px;font-size:12px;color:var(--green);font-weight:600">✅ ${file.name} uploaded to Cloudinary</div>`;
    }

    // Also add to media library
    if (!state.mediaLibrary) state.mediaLibrary = [];
    state.mediaLibrary.push({ id:genId(), name:file.name, type:file.type.startsWith('video/')?'video':'image', size:_fmtSize(file.size), url:result.url, thumb:result.url, tags:[], date:new Date().toISOString().split('T')[0], source:'cloudinary', publicId:result.publicId });
    saveState();
  } catch(err) {
    if (preview) preview.innerHTML = `<div style="color:var(--coral);font-size:12px;padding:8px">❌ Upload failed. Check your internet connection.</div>`;
  }
}

/* ══════════════════════════════════════════════════════════
   GOOGLE DRIVE IMPORT
══════════════════════════════════════════════════════════ */
function importFromDrive() {
  document.getElementById('modalTitle').textContent = '☁️ Import from Google Drive';
  document.getElementById('modalBody').innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;padding:16px;background:linear-gradient(135deg,#F0F9FF,#DBEAFE);border:2px solid #93C5FD;border-radius:var(--r-xl);margin-bottom:16px">
      <div style="font-size:28px">☁️</div>
      <div style="flex:1">
        <div style="font-size:14px;font-weight:800;color:var(--text)">Open Google Drive</div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px">Find file → Share → Anyone with link → Copy link</div>
      </div>
      <button onclick="window.open('https://drive.google.com/drive/my-drive','_blank')"
        style="padding:10px 18px;background:#1A73E8;color:#fff;border:none;border-radius:24px;font-size:13px;font-weight:800;cursor:pointer;font-family:var(--font)">
        Open Drive ↗
      </button>
    </div>
    <div style="position:relative;margin-bottom:10px">
      <input class="form-input" id="drive-url" placeholder="Paste Google Drive link"
        oninput="previewDriveModalImage(this.value)"
        onpaste="setTimeout(()=>previewDriveModalImage(document.getElementById('drive-url').value),60)">
      <button onclick="(async()=>{try{const t=await navigator.clipboard.readText();const i=document.getElementById('drive-url');if(i){i.value=t;previewDriveModalImage(t);}}catch(e){};})()"
        style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:var(--brand);color:#fff;border:none;border-radius:16px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:var(--font)">
        📋 Paste
      </button>
    </div>
    <div id="drive-modal-preview" style="margin-bottom:12px"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">File name</label>
        <input class="form-input" id="drive-name" placeholder="e.g. banner.jpg"></div>
      <div class="form-group"><label class="form-label">Type</label>
        <select class="form-select" id="drive-type">
          <option value="image">🖼 Image</option>
          <option value="video">🎬 Video</option>
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
  const thumb  = `https://drive.google.com/thumbnail?id=${fileId}&sz=w480`;
  const nameEl = document.getElementById('drive-name');
  if (nameEl && !nameEl.value) nameEl.value = `drive-${fileId.slice(0,8)}.jpg`;
  el.innerHTML = `<img src="${thumb}" style="max-height:140px;max-width:100%;object-fit:contain;border-radius:var(--r-lg);border:1.5px solid var(--border);display:block"
    onerror="this.style.display='none'">`;
  window._driveImportUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
}

function saveDriveImport() {
  const url  = (document.getElementById('drive-url').value||'').trim();
  const name = (document.getElementById('drive-name').value||'').trim() || 'drive-file.jpg';
  if (!url) { showToast('Paste a Drive link', 'error'); return; }
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!m) { showToast('Invalid Drive link', 'error'); return; }
  const directUrl = `https://drive.google.com/uc?export=view&id=${m[1]}`;
  const type = document.getElementById('drive-type').value;
  if (!state.mediaLibrary) state.mediaLibrary = [];
  state.mediaLibrary.push({ id:genId(), name, type, url:directUrl, thumb:directUrl, size:'Drive', tags:[], date:new Date().toISOString().split('T')[0], source:'drive' });
  saveState(); closeModal(); renderMediaLibrary();
  showToast('☁️ Drive file imported!', 'success');
}

/* ══════════════════════════════════════════════════════════
   ACTIONS
══════════════════════════════════════════════════════════ */
function selectMediaCard(id) {
  document.querySelectorAll('.media-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById('mc-' + id);
  if (card) card.classList.toggle('selected');
}

function useMedia(id) {
  const m = (state.mediaLibrary||[]).find(x=>x.id===id);
  if (!m || !m.url) { showToast('No URL for this file', 'error'); return; }
  const preview = document.getElementById('cadd-file-preview');
  if (preview) {
    preview.innerHTML = `<img src="${m.url}" style="width:100%;max-height:120px;object-fit:cover;border-radius:var(--r-lg);border:1.5px solid var(--border)">
      <div style="font-size:11px;color:var(--green);font-weight:600;margin-top:4px">✅ ${m.name} selected</div>`;
    window._caddAttachment = { url:m.url, name:m.name };
    const devTab = document.querySelector('.mat-tab');
    if (devTab) switchMediaTab('device', devTab);
    showToast(`✅ "${m.name}" ready`, 'success');
  } else {
    showToast('Open a post form first', '');
  }
}

function deleteMedia(id) {
  state.mediaLibrary = (state.mediaLibrary||[]).filter(m=>m.id!==id);
  saveState(); renderMediaLibrary(); showToast('File removed');
}

/* ── Mini library in add post modal ─────────────────────── */
function _populateMiniLibrary() {
  const el  = document.getElementById('cadd-library-grid');
  if (!el) return;
  const lib = (state.mediaLibrary||[]).filter(m=>m.url && m.type==='image');
  if (!lib.length) {
    el.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:12px;text-align:center;grid-column:1/-1">No images yet</div>';
    return;
  }
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
   CLOUDINARY SETUP GUIDE
══════════════════════════════════════════════════════════ */
function _showCloudinarySetup() {
  document.getElementById('modalTitle').textContent = '☁️ Set up Cloudinary';
  document.getElementById('modalBody').innerHTML = `
    <div style="text-align:center;padding:16px 0 8px">
      <div style="font-size:32px;margin-bottom:8px">☁️</div>
      <div style="font-size:15px;font-weight:800;color:var(--text);margin-bottom:4px">One-time setup needed</div>
      <div style="font-size:12px;color:var(--text3)">Takes 2 minutes · Free forever</div>
    </div>
    ${[
      ['Go to Cloudinary', 'Settings → Upload → Upload presets → Add upload preset'],
      ['Set signing mode', 'Change "Signing mode" to <strong>Unsigned</strong> → Save'],
      ['Copy preset name', 'Copy the preset name (e.g. <code>ml_default</code>)'],
      ['Paste in sync.js', 'Open <code>js/media_library.js</code> → line 5 → replace <code>PASTE_PRESET_NAME_HERE</code> with your preset name → push to GitHub'],
    ].map(([t,d],i)=>`
      <div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="width:24px;height:24px;border-radius:50%;background:var(--brand);color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">${i+1}</div>
        <div><div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:3px">${t}</div><div style="font-size:12px;color:var(--text2);line-height:1.6">${d}</div></div>
      </div>`).join('')}`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Close</button>
    <button class="btn btn-primary" onclick="window.open('https://console.cloudinary.com/settings/upload','_blank')">Open Cloudinary ↗</button>`;
  document.getElementById('modalOverlay').classList.add('open');
}

/* ── Helpers ─────────────────────────────────────────────── */
function _fmtSize(b) {
  if (!b) return '';
  if (b < 1024)       return b + ' B';
  if (b < 1024*1024)  return (b/1024).toFixed(1) + ' KB';
  return (b/(1024*1024)).toFixed(1) + ' MB';
}
