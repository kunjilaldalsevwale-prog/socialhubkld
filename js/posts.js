/* ============ POSTS ============ */
let postFilter = 'all', postSort = 'date-desc', postViewMode = 'list';

function renderPosts() {
  let filtered = [...state.posts];
  if (postFilter !== 'all') filtered = filtered.filter(p => p.status === postFilter);
  if (postSort === 'date-desc') filtered.sort((a,b)=>(b.date||'')>(a.date||'')?1:-1);
  else if (postSort === 'date-asc') filtered.sort((a,b)=>(a.date||'')>(b.date||'')?1:-1);
  else if (postSort === 'platform') filtered.sort((a,b)=>a.platform.localeCompare(b.platform));
  renderPostCards(filtered);
}

function renderPostCards(posts) {
  const list = document.getElementById('postsList');
  if (!list) return;
  list.className = postViewMode === 'grid' ? 'posts-grid' : 'posts-list';
  if (!posts.length) {
    list.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text3)"><div style="font-size:32px;margin-bottom:8px">📭</div><div style="font-size:14px;font-weight:500">No posts found</div><div style="font-size:12px;margin-top:4px">Create your first post to get started</div></div>`;
    return;
  }
  list.innerHTML = posts.map(p => {
    const pf = PLATFORM_COLORS[p.platform] || {};
    const st = STATUS_MAP[p.status] || {};
    const priorityDot = p.priority==='urgent'?'dot-urgent':p.priority==='high'?'dot-high':'dot-normal';
    return `<div class="post-card">
      <div class="post-card-header">
        <div class="platform-icon" style="background:${pf.bg||'#eee'}">${pf.icon||'📝'}</div>
        <div class="post-meta">
          <div class="post-title">${p.title}</div>
          <div class="post-platform-date">${p.platform} · ${fmtDate(p.date)} ${p.time?'at '+p.time:''}</div>
        </div>
        <span class="badge ${st.cls}">${st.label}</span>
      </div>
      ${p.caption?`<div class="post-caption-preview">${p.caption}</div>`:''}
      <div class="post-footer">
        <span class="post-priority-dot ${priorityDot}" title="${p.priority} priority"></span>
        <span class="chip ${pf.chip||''}" style="font-size:10px">${p.type||'Post'}</span>
        ${p.assignee?`<span style="font-size:11px;color:var(--text3)">👤 ${p.assignee}</span>`:''}
        <div class="post-actions">
          <button onclick="editPostFromList(${p.id})">Edit</button>
          <button onclick="duplicatePost(${p.id})">Duplicate</button>
          <button onclick="changePostStatus(${p.id})" style="color:var(--brand-dark)">Status ↻</button>
          <button onclick="deletePost(${p.id})" style="color:var(--red)">Delete</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function filterPosts(f,el){postFilter=f;document.querySelectorAll('.ftab').forEach(b=>b.classList.remove('active'));el.classList.add('active');renderPosts();}
function sortPosts(v){postSort=v;renderPosts();}
function setPostView(v,el){postViewMode=v;document.querySelectorAll('#view-posts .vtbtn').forEach(b=>b.classList.remove('active'));el.classList.add('active');renderPosts();}

function editPostFromList(id){navigate('create',document.querySelector('.nav-item[data-view="create"]'));setTimeout(()=>loadPostIntoForm(id),50);}

function duplicatePost(id){
  const p=state.posts.find(x=>x.id===id);if(!p)return;
  const copy={...p,id:genId(),title:p.title+' (copy)',status:'draft',created:new Date().toISOString().split('T')[0]};
  state.posts.push(copy);saveState();renderPosts();updateBadge();showToast('Post duplicated!','success');
}

function changePostStatus(id){
  const p=state.posts.find(x=>x.id===id);if(!p)return;
  const cycle={draft:'review',review:'scheduled',scheduled:'published',published:'draft'};
  p.status=cycle[p.status]||'draft';saveState();renderPosts();updateBadge();
  showToast('Status → '+STATUS_MAP[p.status].label,'success');
}

function deletePost(id){
  if(!confirm('Delete this post?'))return;
  state.posts=state.posts.filter(p=>p.id!==id);saveState();renderPosts();updateBadge();
  if(currentView==='calendar')buildCalendar();showToast('Post deleted');
}

/* ============ CREATE POST ============ */
let editingPostId=null,selectedPlatforms=[];

function onCaptionInput(el){document.getElementById('charCount').textContent=el.value.length+' / 2200';updatePreview();}

function updatePreview(){
  const cap=document.getElementById('createCaption');
  const tags=document.getElementById('createHashtags');
  const pv=document.getElementById('previewCaptionText');
  if(!cap||!pv)return;
  pv.textContent=(cap.value+(tags&&tags.value?' '+tags.value:''))||'Your caption will appear here…';
}

function togglePlatform(el){
  el.classList.toggle('selected');
  const p=el.dataset.platform;
  if(el.classList.contains('selected')){if(!selectedPlatforms.includes(p))selectedPlatforms.push(p);}
  else{selectedPlatforms=selectedPlatforms.filter(x=>x!==p);}
}

function insertEmoji(emoji){
  const ta=document.getElementById('createCaption');if(!ta)return;
  const pos=ta.selectionStart;ta.value=ta.value.slice(0,pos)+emoji+ta.value.slice(pos);
  ta.selectionStart=ta.selectionEnd=pos+emoji.length;ta.focus();onCaptionInput(ta);
}

function setPreviewPlatform(p,el){document.querySelectorAll('.pvtab').forEach(b=>b.classList.remove('active'));el.classList.add('active');}

function renderTeamShareList(){
  const list=document.getElementById('teamShareList');if(!list)return;
  const avatarColors=[{bg:'#EEEDFE',tc:'#3C3489'},{bg:'#EAF3DE',tc:'#27500A'},{bg:'#FAEEDA',tc:'#633806'},{bg:'#FBEAF0',tc:'#72243E'}];
  list.innerHTML=state.team.map((m,i)=>{const c=avatarColors[i%avatarColors.length];return `<div class="share-row"><div class="share-avatar" style="background:${c.bg};color:${c.tc}">${m.initials}</div><div class="share-name">${m.name}</div><div class="share-role">${m.role}</div><input type="checkbox" ${i<2?'checked':''}></div>`;}).join('');
}

function loadPostIntoForm(id){
  const p=state.posts.find(x=>x.id===id);if(!p)return;
  editingPostId=id;
  document.getElementById('createTitle').value=p.title||'';
  document.getElementById('createCaption').value=p.caption||'';
  document.getElementById('createHashtags').value=p.hashtags||'';
  document.getElementById('createBrief').value=p.brief||'';
  document.getElementById('createDate').value=p.date||'';
  document.getElementById('createTime').value=p.time||'09:00';
  document.getElementById('createStatus').value=p.status||'draft';
  document.getElementById('createAssign').value=p.assignee||'';
  document.getElementById('createPriority').value=p.priority||'normal';
  document.getElementById('createNotes').value=p.notes||'';
  selectedPlatforms=p.platforms||[p.platform];
  document.querySelectorAll('.pcheck').forEach(el=>el.classList.toggle('selected',selectedPlatforms.includes(el.dataset.platform)));
  const cc=document.getElementById('charCount');if(cc)cc.textContent=(p.caption||'').length+' / 2200';
  updatePreview();renderTeamShareList();showToast('Post loaded for editing');
}

function clearForm(){
  editingPostId=null;selectedPlatforms=[];
  ['createTitle','createCaption','createHashtags','createBrief','createNotes'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('createStatus').value='draft';
  document.getElementById('createAssign').value='';
  document.getElementById('createPriority').value='normal';
  document.querySelectorAll('.pcheck').forEach(el=>el.classList.remove('selected'));
  updatePreview();showToast('Form cleared');
}

function saveDraft(){savePostInternal('draft');}
function savePost(){const t=document.getElementById('createTitle').value.trim();if(!t){showToast('Enter a title','error');return;}savePostInternal(document.getElementById('createStatus').value);}

function savePostInternal(status){
  const title=document.getElementById('createTitle').value.trim();
  if(!title){showToast('Enter a post title','error');return;}
  const platform=selectedPlatforms[0]||'Instagram';
  const postData={
    id:editingPostId||genId(),title,platform,
    platforms:selectedPlatforms.length?selectedPlatforms:[platform],
    date:document.getElementById('createDate').value,
    time:document.getElementById('createTime').value,
    status,type:document.getElementById('createType').value,
    caption:document.getElementById('createCaption').value,
    hashtags:document.getElementById('createHashtags').value,
    brief:document.getElementById('createBrief').value,
    assignee:document.getElementById('createAssign').value,
    priority:document.getElementById('createPriority').value,
    notes:document.getElementById('createNotes').value,
    created:new Date().toISOString().split('T')[0],
  };
  if(editingPostId){const idx=state.posts.findIndex(p=>p.id===editingPostId);if(idx!==-1)state.posts[idx]=postData;showToast('Post updated!','success');}
  else{state.posts.push(postData);showToast('Post saved!','success');}
  saveState();updateBadge();editingPostId=null;clearForm();
  navigate('posts',document.querySelector('.nav-item[data-view="posts"]'));
}

function handleMedia(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=(e)=>{
    const preview=document.getElementById('mediaPreview');
    if(preview){
      if(file.type.startsWith('image/')){
        preview.innerHTML=`<img src="${e.target.result}" style="width:100%;border-radius:var(--radius);margin-top:8px">`;
        const pvImg=document.querySelector('.preview-image-placeholder');
        if(pvImg)pvImg.innerHTML=`<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-sm)">`;
      }else{preview.innerHTML=`<div style="font-size:12px;color:var(--green);margin-top:8px">✓ Video: ${file.name}</div>`;}
    }
  };reader.readAsDataURL(file);
}

document.addEventListener('DOMContentLoaded',()=>{renderTeamShareList();updatePreview();});
