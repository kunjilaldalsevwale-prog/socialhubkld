/* ============ WHATSAPP ============ */

let activeWAContact = 1;

function renderWhatsApp() {
  renderWAContacts();
  loadWAChat(activeWAContact);
}

function renderWAContacts(filter = '') {
  const list = document.getElementById('waContactList');
  if (!list) return;
  const contacts = filter
    ? state.waContacts.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()))
    : state.waContacts;

  list.innerHTML = contacts.map(c => `
    <div class="wa-contact ${c.id === activeWAContact ? 'active' : ''}" onclick="loadWAChat(${c.id})">
      <div class="wa-avatar" style="background:${c.color};color:${c.textColor}">${c.initials}</div>
      <div class="wa-contact-info">
        <div class="wa-contact-name">${c.name}</div>
        <div class="wa-contact-preview">${c.lastMsg}</div>
      </div>
      <div class="wa-contact-time">${c.time}</div>
    </div>`).join('');
}

function filterWAContacts(q) {
  renderWAContacts(q);
}

function loadWAChat(id) {
  activeWAContact = id;
  const contact = state.waContacts.find(c => c.id === id);
  if (!contact) return;

  // update header
  document.getElementById('waActiveAvatar').textContent = contact.initials;
  document.getElementById('waActiveAvatar').style.background = contact.color;
  document.getElementById('waActiveAvatar').style.color = contact.textColor;
  document.getElementById('waActiveName').textContent = contact.name;
  document.getElementById('waActiveSub').textContent = contact.sub;

  // render messages
  const msgs = state.waMessages[id] || [];
  const msgContainer = document.getElementById('waMessages');
  if (!msgContainer) return;

  msgContainer.innerHTML = msgs.length
    ? msgs.map(m => `
      <div class="wa-msg ${m.type}">
        ${m.text}
        <div class="wa-msg-time">${m.time}${m.type === 'sent' ? ' ✓✓' : ''}</div>
      </div>`).join('')
    : `<div style="text-align:center;color:var(--text3);font-size:13px;margin:auto">No messages yet. Start a conversation!</div>`;

  msgContainer.scrollTop = msgContainer.scrollHeight;

  // re-render contacts to show active
  renderWAContacts();
}

function sendWAMessage() {
  const input = document.getElementById('waInput');
  if (!input || !input.value.trim()) return;
  const text = input.value.trim();
  const now = new Date();
  const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

  if (!state.waMessages[activeWAContact]) state.waMessages[activeWAContact] = [];
  state.waMessages[activeWAContact].push({ id: genId(), text, type: 'sent', time });

  // update last message in contact
  const contact = state.waContacts.find(c => c.id === activeWAContact);
  if (contact) { contact.lastMsg = text.slice(0, 40); contact.time = 'Now'; }

  input.value = '';
  input.style.height = 'auto';
  saveState();
  loadWAChat(activeWAContact);
}

function waKeyHandler(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendWAMessage();
  }
  // auto-resize textarea
  const ta = e.target;
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 100) + 'px';
}

function useTemplate(t) {
  const templates = {
    sale: '🎉 Big sale alert! Get [X]% off everything at [Store Name]. Shop now: [link] Reply STOP to opt out.',
    welcome: '👋 Welcome to [Brand Name]! We\'re so glad you\'re here. Reply YES to receive exclusive offers and updates.',
    followup: 'Hi [Name]! Just checking in — did you find what you were looking for? We\'re here to help 😊 Reply anytime.',
    event: '📅 You\'re invited! Join us for [Event Name] on [Date] at [Time]. Reply RSVP to confirm your spot!',
    feedback: '⭐ Hi [Name]! How would you rate your recent experience with us? Reply with a number 1–5. Your feedback means a lot!',
    offer: '💸 Exclusive offer just for you, [Name]! Use code [CODE] for [X]% off your next order. Valid till [Date]. Shop: [link]',
  };
  const input = document.getElementById('waInput');
  if (input) { input.value = templates[t] || ''; input.focus(); }
}

function attachWAFile() {
  showToast('File attachment feature — connect to your WhatsApp Business API', '');
}
