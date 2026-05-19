/* ============================================================
   DATA STORE  —  localStorage persistence
   All state lives here. Every module reads/writes state.*
   ============================================================ */

const DB = {
  _key: 'socialhub_v2',
  defaults: {
    posts: [
      { id:1, title:'Summer sale launch reel', platform:'Instagram', date:'2026-05-08', time:'10:00', status:'scheduled', type:'Video / Reel', caption:'Summer is here! 🌞 Up to 40% off everything. Swipe → 👉 #SummerSale #Fashion', hashtags:'#SummerSale #Fashion', brief:'Upbeat reel with trending audio', assignee:'Priya Sharma', priority:'high', notes:'Use trending IG audio', platforms:['Instagram'], created:'2026-04-28' },
      { id:2, title:'Product teaser', platform:'Instagram', date:'2026-05-05', time:'09:00', status:'scheduled', type:'Image post', caption:'Something exciting is coming… 👀 #ComingSoon #NewCollection', hashtags:'#ComingSoon', brief:'Dark moody teaser image', assignee:'Arjun Mehta', priority:'normal', notes:'', platforms:['Instagram'], created:'2026-04-25' },
      { id:3, title:'Facebook sale kick-off', platform:'Facebook', date:'2026-05-08', time:'11:00', status:'review', type:'Image post', caption:'Big news! Our Summer Sale starts today 🎉 Shop → bit.ly/sale26', hashtags:'#SummerSale', brief:'Bright banner with sale %', assignee:'Priya Sharma', priority:'high', notes:'Needs legal sign-off', platforms:['Facebook'], created:'2026-04-26' },
      { id:4, title:'WhatsApp May newsletter', platform:'WhatsApp', date:'2026-05-12', time:'10:00', status:'draft', type:'Text only', caption:"Hey [Name]! May edition is here 🌸 Grab your exclusive member discount.", hashtags:'', brief:'Friendly personal tone', assignee:'Neha Gupta', priority:'normal', notes:'', platforms:['WhatsApp'], created:'2026-04-30' },
      { id:5, title:'Mid-month engagement poll', platform:'Twitter/X', date:'2026-05-15', time:'12:00', status:'draft', type:'Text only', caption:"What's your go-to summer look? 🏖 Drop a reply 👇 #SummerStyle", hashtags:'#SummerStyle', brief:'Short punchy tweet', assignee:'', priority:'normal', notes:'', platforms:['Twitter/X'], created:'2026-05-01' },
      { id:6, title:'Behind the scenes story', platform:'Instagram', date:'2026-05-20', time:'16:00', status:'draft', type:'Story', caption:'A look at how the magic happens ✨ #BTS #TeamWork', hashtags:'#BTS', brief:'Candid studio shots', assignee:'Arjun Mehta', priority:'normal', notes:'', platforms:['Instagram'], created:'2026-05-02' },
      { id:7, title:'Spring lookbook', platform:'Facebook', date:'2026-04-28', time:'10:00', status:'published', type:'Carousel', caption:'Our spring lookbook is out! 🌸 Which look is your favourite?', hashtags:'#SpringLookbook', brief:'', assignee:'Priya Sharma', priority:'normal', notes:'', platforms:['Facebook'], created:'2026-04-20' },
      { id:8, title:'LinkedIn thought leadership', platform:'LinkedIn', date:'2026-05-22', time:'09:00', status:'scheduled', type:'Text only', caption:'5 lessons from growing our brand on social 📈 #Marketing', hashtags:'#Marketing', brief:'Professional tone', assignee:'Neha Gupta', priority:'high', notes:'', platforms:['LinkedIn'], created:'2026-05-01' },
    ],
    ads: [
      { id:1, title:'Summer Sale — Conversion', type:'Conversion Campaign', objective:'Purchases', audience:'Women 18–35, Tier-1 cities', budget:15000, spent:9200, reach:48200, clicks:1240, ctr:'2.57', cpc:'7.42', status:'active', startDate:'2026-05-08' },
      { id:2, title:'Brand Awareness — Reels', type:'Awareness Campaign', objective:'Impressions', audience:'All genders 18–45', budget:8000, spent:3500, reach:92400, clicks:460, ctr:'0.50', cpc:'7.61', status:'active', startDate:'2026-05-01' },
      { id:3, title:'Retargeting — Cart visitors', type:'Retargeting', objective:'Add to cart', audience:'Website visitors (30d)', budget:6000, spent:5800, reach:12100, clicks:890, ctr:'7.35', cpc:'6.52', status:'active', startDate:'2026-05-05' },
      { id:4, title:'New Collection Launch', type:'Traffic Campaign', objective:'Link clicks', audience:'Lookalike 2%', budget:10000, spent:2100, reach:31000, clicks:620, ctr:'2.00', cpc:'3.39', status:'paused', startDate:'2026-05-20' },
    ],
    waContacts: [
      { id:1, name:'Customers Group', sub:'324 members', initials:'CG', color:'#EAF3DE', textColor:'#27500A', lastMsg:'Summer sale is live! 🎉', time:'10:24', type:'group' },
      { id:2, name:'VIP Members', sub:'87 members', initials:'VIP', color:'#EEEDFE', textColor:'#3C3489', lastMsg:'Early access link sent', time:'Yesterday', type:'group' },
      { id:3, name:'Newsletter Subscribers', sub:'512 contacts', initials:'NL', color:'#FAEEDA', textColor:'#633806', lastMsg:'May edition draft ready', time:'May 1', type:'broadcast' },
      { id:4, name:'Re-engagement List', sub:'203 contacts', initials:'RE', color:'#FBEAF0', textColor:'#72243E', lastMsg:'We miss you! 👋', time:'Apr 28', type:'broadcast' },
    ],
    waMessages: {
      1: [
        { id:1, text:"Hey, when is the summer sale starting? 👀", type:'recv', time:'9:45 AM' },
        { id:2, text:'Summer sale is live NOW! 🎉 Get up to 40% off. Shop: bit.ly/sale2026', type:'sent', time:'10:24 AM' },
        { id:3, text:'Amazing! Thank you 🙌', type:'recv', time:'10:26 AM' },
      ],
      2: [
        { id:1, text:'Welcome to the VIP club! 🌟 Early access to new collection inside.', type:'sent', time:'Yesterday 9:00 AM' },
        { id:2, text:'Thank you so much! Excited 😍', type:'recv', time:'Yesterday 9:05 AM' },
      ],
      3: [], 4: [],
    },
    goals: [
      { id:1, title:'Brand awareness campaign', desc:'Launch summer collection with 3 reels and a Meta campaign targeting 18–35 in tier-1 cities.', progress:60, color:'#FF3D8A' },
      { id:2, title:'WhatsApp subscriber growth', desc:'Grow WhatsApp marketing list to 1,000 subscribers with opt-in landing page.', progress:42, color:'#10B981' },
      { id:3, title:'Instagram engagement target', desc:'Achieve 5% engagement rate with consistent 4× per week posting and story polls.', progress:75, color:'#F59E0B' },
    ],
    agendaEvents: [
      { id:1, title:'Summer sale Meta ad campaign goes live', sub:'Paid campaign · all ad sets active', day:'8', month:'May', color:'#FF3D8A' },
      { id:2, title:'WhatsApp broadcast — May edition', sub:'Newsletter blast to all subscribers', day:'12', month:'May', color:'#10B981' },
      { id:3, title:'Mid-month content review with team', sub:'Weekly sync · 60 min', day:'15', month:'May', color:'#F59E0B' },
      { id:4, title:'Instagram reel — behind the scenes', sub:'Film & edit day', day:'20', month:'May', color:'#FF3D8A' },
      { id:5, title:'End of month performance report', sub:'Analytics & learnings', day:'31', month:'May', color:'#EF4444' },
    ],
    team: [
      { id:1, name:'Priya Sharma', role:'Content Lead', initials:'PS', color:'#FFE8F2', textColor:'#D4006A', email:'priya@brand.com' },
      { id:2, name:'Arjun Mehta', role:'Designer', initials:'AM', color:'#EAF3DE', textColor:'#27500A', email:'arjun@brand.com' },
      { id:3, name:'Neha Gupta', role:'Strategist', initials:'NG', color:'#FAEEDA', textColor:'#633806', email:'neha@brand.com' },
      { id:4, name:'Rahul Das', role:'Paid Ads Manager', initials:'RD', color:'#EDE9FE', textColor:'#5B21B6', email:'rahul@brand.com' },
    ],
    emailCampaigns: [
      { id:1, name:'May Newsletter', subject:'🌸 May deals just for you!', status:'sent', date:'2026-05-01', time:'09:00', recipients:245, opens:98, clicks:34, template:'newsletter', body:'Hi {{name}},\n\nHope you are doing great! Check out our latest deals for May.\n\nShop now → yourbrand.com/sale\n\nWarm regards,\nYour Brand Team', tags:['newsletter','may'] },
      { id:2, name:'Summer Sale Blast', subject:'☀️ Summer Sale — Up to 40% off!', status:'scheduled', date:'2026-05-10', time:'10:00', recipients:512, opens:0, clicks:0, template:'promo', body:"Hi {{name}},\n\nOur biggest summer sale is HERE!\n\nUse code SUMMER40 for 40% off.\n\nShop → yourbrand.com\n\nTeam YourBrand", tags:['sale','summer'] },
      { id:3, name:'Re-engagement Campaign', subject:'We miss you 💌', status:'draft', date:'2026-05-20', time:'11:00', recipients:180, opens:0, clicks:0, template:'reengagement', body:"Hi {{name}},\n\nWe noticed you haven't visited in a while. Here's 20% off!\n\nCode: COMEBACK20\n\nCome back → yourbrand.com", tags:['reengagement'] },
    ],
    customerLists: [
      { id:1, name:'All Customers', count:512, source:'manual', tags:['all'], created:'2026-01-01' },
      { id:2, name:'VIP Members', count:87, source:'import', tags:['vip'], created:'2026-02-15' },
      { id:3, name:'Newsletter Subscribers', count:245, source:'import', tags:['newsletter'], created:'2026-03-01' },
    ],
    emailSettings: {
      senderName:'Your Brand', senderEmail:'hello@yourbrand.com',
      dailyLimit:500, batchSize:50, batchDelay:30,
      unsubscribeLink:true, footer:'You received this because you subscribed.\nUnsubscribe: {{unsubscribe_link}}'
    },
    reminders: [
      { id:1, title:'Post Diwali content', type:'post', date:'2026-11-01', time:'08:00', note:'Schedule reel 2 days before', done:false },
      { id:2, title:'Summer sale email blast', type:'email', date:'2026-05-10', time:'09:30', note:'Check subject line before sending', done:false },
      { id:3, title:'WhatsApp broadcast — May', type:'whatsapp', date:'2026-05-12', time:'10:00', note:'Confirm list segmentation', done:true },
    ],
    mediaLibrary: [
      { id:1, name:'summer-sale-banner.jpg', type:'image', url:null, thumb:null, size:'1.2 MB', tags:['sale','summer'], date:'2026-05-01', source:'upload' },
      { id:2, name:'product-teaser.mp4', type:'video', url:null, thumb:null, size:'8.4 MB', tags:['product','teaser'], date:'2026-04-28', source:'upload' },
      { id:3, name:'brand-logo.png', type:'image', url:null, thumb:null, size:'340 KB', tags:['brand'], date:'2026-04-01', source:'upload' },
    ],
    settings: { brandName:'Your Brand', industry:'Fashion & Apparel', timezone:'Asia/Kolkata (IST)', defaultTime:'09:00' },
    notes: '',
  },

  load() {
    try {
      const raw = localStorage.getItem(this._key);
      if (raw) {
        const saved = JSON.parse(raw);
        // Deep merge: keep defaults for any missing keys
        const merged = { ...this.defaults };
        Object.keys(saved).forEach(k => { merged[k] = saved[k]; });
        return merged;
      }
    } catch(e) { console.warn('State load error:', e); }
    return JSON.parse(JSON.stringify(this.defaults)); // deep clone
  },

  save(data) {
    try { localStorage.setItem(this._key, JSON.stringify(data)); }
    catch(e) { console.warn('State save error:', e); }
  },

  clear() { localStorage.removeItem(this._key); }
};

// ── Global state (single source of truth) ─────────────────
const state = DB.load();
function saveState() {
  DB.save(state);
  // Push to Firebase if sync is enabled
  if (typeof syncPush === 'function') syncPush();
}

// ── Helpers used everywhere ────────────────────────────────
const PLATFORM_COLORS = {
  Instagram:  { bg:'#FFE8F2', text:'#D4006A', pill:'pill-ig',   chip:'chip-ig',   icon:'📸' },
  Facebook:   { bg:'#EFF6FF', text:'#1D4ED8', pill:'pill-fb',   chip:'chip-fb',   icon:'📘' },
  WhatsApp:   { bg:'#ECFDF5', text:'#065F46', pill:'pill-wa',   chip:'chip-wa',   icon:'💬' },
  'Twitter/X':{ bg:'#F0FDFA', text:'#0F766E', pill:'pill-tw',   chip:'chip-tw',   icon:'🐦' },
  LinkedIn:   { bg:'#EFF6FF', text:'#1E40AF', pill:'pill-li',   chip:'chip-li',   icon:'💼' },
  'Meta Ad':  { bg:'#EDE9FE', text:'#5B21B6', pill:'pill-meta', chip:'chip-meta', icon:'📊' },
};

const STATUS_MAP = {
  draft:     { label:'Draft',       cls:'badge-draft' },
  scheduled: { label:'Scheduled',   cls:'badge-scheduled' },
  review:    { label:'In Review',   cls:'badge-review' },
  published: { label:'Published',   cls:'badge-published' },
};

const MONTH_NAMES  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${SHORT_MONTHS[parseInt(m)-1]} ${parseInt(d)}, ${y}`;
}

function genId() { return Date.now() + Math.floor(Math.random() * 9999); }
