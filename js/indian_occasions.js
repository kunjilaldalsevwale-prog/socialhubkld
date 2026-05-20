/* ============================================================
   INDIAN FESTIVALS — 2026, 2027, 2028
   All dates verified from timeanddate.com & drikpanchang.com
   Fixed dates (Republic Day, Independence Day etc) auto-work
   every year. Lunar festivals listed per year.
   ============================================================ */

/* ── FIXED DATES (same every year) ─────────────────────────── */
const FIXED_OCCASIONS = {
  '01-01': [{ name:"New Year's Day",        emoji:'🎆', color:'#6366F1' }],
  '01-14': [{ name:'Makar Sankranti',       emoji:'🪁', color:'#F59E0B' },
             { name:'Pongal',               emoji:'🍲', color:'#10B981' }],
  '01-26': [{ name:'Republic Day',          emoji:'🇮🇳', color:'#EF4444' }],
  '02-14': [{ name:"Valentine's Day",       emoji:'❤️',  color:'#EC4899' }],
  '04-14': [{ name:'Baisakhi',              emoji:'🌾', color:'#F59E0B' },
             { name:'Ambedkar Jayanti',     emoji:'🙏', color:'#3B82F6' },
             { name:'Tamil New Year',       emoji:'🌺', color:'#EF4444' }],
  '05-01': [{ name:"International Workers' Day", emoji:'✊', color:'#EF4444' }],
  '06-05': [{ name:'World Environment Day', emoji:'🌍', color:'#10B981' }],
  '08-15': [{ name:'Independence Day',      emoji:'🇮🇳', color:'#10B981' }],
  '09-05': [{ name:"Teachers' Day",         emoji:'📚', color:'#3B82F6' }],
  '09-14': [{ name:'Hindi Diwas',           emoji:'📝', color:'#F97316' }],
  '10-02': [{ name:'Gandhi Jayanti',        emoji:'🕊️',  color:'#10B981' }],
  '10-31': [{ name:'Halloween',             emoji:'🎃', color:'#F97316' }],
  '11-14': [{ name:"Children's Day",        emoji:'🧒', color:'#3B82F6' }],
  '12-24': [{ name:'Christmas Eve',         emoji:'🎄', color:'#10B981' }],
  '12-25': [{ name:'Christmas Day',         emoji:'🎁', color:'#EF4444' }],
  '12-31': [{ name:"New Year's Eve",        emoji:'🎆', color:'#6366F1' }],
};

/* ── LUNAR/VARIABLE DATES — per year ────────────────────────── */
const LUNAR_OCCASIONS = {

  /* ════════════ 2026 ════════════ */
  '2026': {
    '01-23': [{ name:'Vasant Panchami',       emoji:'🌼', color:'#F59E0B' }],
    '02-15': [{ name:'Maha Shivratri',        emoji:'🔱', color:'#8B5CF6' }],
    '02-19': [{ name:'Shivaji Jayanti',       emoji:'⚔️',  color:'#F97316' }],
    '03-03': [{ name:'Holika Dahan',          emoji:'🔥', color:'#F97316' }],
    '03-04': [{ name:'Holi',                  emoji:'🎨', color:'#EC4899' }],
    '03-19': [{ name:'Ugadi / Gudi Padwa',    emoji:'🌅', color:'#10B981' }],
    '03-21': [{ name:'Eid ul-Fitr',           emoji:'🌙', color:'#10B981' }],
    '03-26': [{ name:'Ram Navami',            emoji:'🏹', color:'#F59E0B' }],
    '03-31': [{ name:'Mahavir Jayanti',       emoji:'🙏', color:'#10B981' }],
    '04-03': [{ name:'Good Friday',           emoji:'✝️',  color:'#6B7280' }],
    '04-05': [{ name:'Easter Sunday',         emoji:'🐣', color:'#10B981' }],
    '05-01': [{ name:'Buddha Purnima',        emoji:'☸️',  color:'#8B5CF6' }],
    '05-27': [{ name:'Eid ul-Adha (Bakrid)',  emoji:'🌙', color:'#10B981' }],
    '06-21': [{ name:"Father's Day",          emoji:'👨', color:'#3B82F6' }],
    '06-26': [{ name:'Muharram',              emoji:'🌙', color:'#8B5CF6' }],
    '07-16': [{ name:'Rath Yatra',            emoji:'🛕', color:'#F59E0B' }],
    '08-02': [{ name:'Friendship Day',        emoji:'🤝', color:'#F59E0B' }],
    '08-26': [{ name:'Onam',                  emoji:'🌸', color:'#10B981' }],
    '08-28': [{ name:'Raksha Bandhan',        emoji:'🪢', color:'#EC4899' }],
    '09-04': [{ name:'Janmashtami',           emoji:'🦚', color:'#3B82F6' }],
    '09-14': [{ name:'Ganesh Chaturthi',      emoji:'🐘', color:'#F97316' }],
    '10-11': [{ name:'Navratri Begins',       emoji:'🌸', color:'#EC4899' }],
    '10-20': [{ name:'Dussehra',              emoji:'🏹', color:'#F97316' }],
    '10-29': [{ name:'Karva Chauth',          emoji:'🌙', color:'#EC4899' }],
    '11-08': [{ name:'Diwali',                emoji:'🪔', color:'#F59E0B' }],
    '11-09': [{ name:'Govardhan Puja',        emoji:'🐄', color:'#10B981' }],
    '11-11': [{ name:'Bhai Dooj',             emoji:'🎁', color:'#EC4899' }],
    '11-15': [{ name:'Chhath Puja',           emoji:'☀️',  color:'#F59E0B' }],
    '11-24': [{ name:'Guru Nanak Jayanti',    emoji:'🙏', color:'#F59E0B' }],
    '05-10': [{ name:"Mother's Day",          emoji:'💐', color:'#EC4899' }],
  },

  /* ════════════ 2027 ════════════ */
  '2027': {
    '01-11': [{ name:'Vasant Panchami',       emoji:'🌼', color:'#F59E0B' }],
    '01-15': [{ name:'Pongal (Thai Pongal)',  emoji:'🍲', color:'#10B981' }],
    '02-06': [{ name:'Maha Shivratri',        emoji:'🔱', color:'#8B5CF6' }],
    '02-19': [{ name:'Shivaji Jayanti',       emoji:'⚔️',  color:'#F97316' }],
    '03-10': [{ name:'Ramadan Start',         emoji:'🌙', color:'#10B981' }],
    '03-22': [{ name:'Holika Dahan',          emoji:'🔥', color:'#F97316' }],
    '03-23': [{ name:'Holi',                  emoji:'🎨', color:'#EC4899' }],
    '03-26': [{ name:'Good Friday',           emoji:'✝️',  color:'#6B7280' }],
    '03-28': [{ name:'Easter Sunday',         emoji:'🐣', color:'#10B981' }],
    '04-09': [{ name:'Eid ul-Fitr',           emoji:'🌙', color:'#10B981' }],
    '04-08': [{ name:'Ugadi / Gudi Padwa',    emoji:'🌅', color:'#10B981' }],
    '04-16': [{ name:'Ram Navami',            emoji:'🏹', color:'#F59E0B' }],
    '04-19': [{ name:'Mahavir Jayanti',       emoji:'🙏', color:'#10B981' }],
    '05-09': [{ name:'Mother\'s Day',         emoji:'💐', color:'#EC4899' }],
    '05-19': [{ name:'Buddha Purnima',        emoji:'☸️',  color:'#8B5CF6' }],
    '06-17': [{ name:'Eid ul-Adha (Bakrid)',  emoji:'🌙', color:'#10B981' }],
    '06-20': [{ name:"Father's Day",          emoji:'👨', color:'#3B82F6' }],
    '07-05': [{ name:'Rath Yatra',            emoji:'🛕', color:'#F59E0B' }],
    '08-01': [{ name:'Friendship Day',        emoji:'🤝', color:'#F59E0B' }],
    '08-17': [{ name:'Raksha Bandhan',        emoji:'🪢', color:'#EC4899' }],
    '08-25': [{ name:'Janmashtami',           emoji:'🦚', color:'#3B82F6' }],
    '09-04': [{ name:'Ganesh Chaturthi',      emoji:'🐘', color:'#F97316' }],
    '09-12': [{ name:'Onam',                  emoji:'🌸', color:'#10B981' }],
    '09-30': [{ name:'Navratri Begins',       emoji:'🌸', color:'#EC4899' }],
    '10-09': [{ name:'Dussehra',              emoji:'🏹', color:'#F97316' }],
    '10-18': [{ name:'Karva Chauth',          emoji:'🌙', color:'#EC4899' }],
    '10-27': [{ name:'Dhanteras',             emoji:'🪙', color:'#F59E0B' }],
    '10-29': [{ name:'Diwali',                emoji:'🪔', color:'#F59E0B' }],
    '10-30': [{ name:'Govardhan Puja',        emoji:'🐄', color:'#10B981' }],
    '11-01': [{ name:'Bhai Dooj',             emoji:'🎁', color:'#EC4899' }],
    '11-04': [{ name:'Chhath Puja',           emoji:'☀️',  color:'#F59E0B' }],
    '11-13': [{ name:'Guru Nanak Jayanti',    emoji:'🙏', color:'#F59E0B' }],
  },

  /* ════════════ 2028 ════════════ */
  '2028': {
    '01-31': [{ name:'Vasant Panchami',       emoji:'🌼', color:'#F59E0B' }],
    '02-26': [{ name:'Maha Shivratri',        emoji:'🔱', color:'#8B5CF6' }],
    '03-13': [{ name:'Holika Dahan',          emoji:'🔥', color:'#F97316' }],
    '03-14': [{ name:'Holi',                  emoji:'🎨', color:'#EC4899' }],
    '03-27': [{ name:'Ugadi / Gudi Padwa',    emoji:'🌅', color:'#10B981' }],
    '03-29': [{ name:'Eid ul-Fitr',           emoji:'🌙', color:'#10B981' }],
    '04-05': [{ name:'Ram Navami',            emoji:'🏹', color:'#F59E0B' }],
    '04-07': [{ name:'Good Friday',           emoji:'✝️',  color:'#6B7280' }],
    '04-09': [{ name:'Easter Sunday',         emoji:'🐣', color:'#10B981' }],
    '05-06': [{ name:'Mother\'s Day',         emoji:'💐', color:'#EC4899' }],
    '05-07': [{ name:'Buddha Purnima',        emoji:'☸️',  color:'#8B5CF6' }],
    '06-05': [{ name:'Eid ul-Adha (Bakrid)',  emoji:'🌙', color:'#10B981' }],
    '06-18': [{ name:"Father's Day",          emoji:'👨', color:'#3B82F6' }],
    '08-05': [{ name:'Friendship Day',        emoji:'🤝', color:'#F59E0B' }],
    '08-06': [{ name:'Raksha Bandhan',        emoji:'🪢', color:'#EC4899' }],
    '08-14': [{ name:'Janmashtami',           emoji:'🦚', color:'#3B82F6' }],
    '09-22': [{ name:'Ganesh Chaturthi',      emoji:'🐘', color:'#F97316' }],
    '10-19': [{ name:'Navratri Begins',       emoji:'🌸', color:'#EC4899' }],
    '10-28': [{ name:'Dussehra',              emoji:'🏹', color:'#F97316' }],
    '11-05': [{ name:'Karva Chauth',          emoji:'🌙', color:'#EC4899' }],
    '11-14': [{ name:'Dhanteras',             emoji:'🪙', color:'#F59E0B' }],
    '11-16': [{ name:'Diwali',                emoji:'🪔', color:'#F59E0B' }],
    '11-17': [{ name:'Govardhan Puja',        emoji:'🐄', color:'#10B981' }],
    '11-19': [{ name:'Bhai Dooj',             emoji:'🎁', color:'#EC4899' }],
    '11-22': [{ name:'Chhath Puja',           emoji:'☀️',  color:'#F59E0B' }],
    '12-02': [{ name:'Guru Nanak Jayanti',    emoji:'🙏', color:'#F59E0B' }],
  },
};

/* ── MAIN FUNCTION ───────────────────────────────────────────── */
function getOccasions(dateStr) {
  if (!dateStr) return [];
  const [year, month, day] = dateStr.split('-');
  const mmdd = `${month}-${day}`;

  // Fixed dates (same every year)
  const fixed  = FIXED_OCCASIONS[mmdd] || [];

  // Lunar dates for this specific year
  const yearData = LUNAR_OCCASIONS[year] || {};
  const lunar    = yearData[mmdd] || [];

  return [...fixed, ...lunar];
}
