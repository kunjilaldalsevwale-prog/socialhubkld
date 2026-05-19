/* ============================================================
   INDIAN FESTIVALS, HOLIDAYS & SPECIAL OCCASIONS 2026
   Covers: National holidays, major Hindu, Muslim, Sikh,
   Christian, Jain, Buddhist festivals + important days
   ============================================================ */

const INDIAN_OCCASIONS = {
  // ── JANUARY ──
  '2026-01-01': [{ name: "New Year's Day", emoji: '🎆', type: 'national', color: '#FF3D8A' }],
  '2026-01-06': [{ name: 'Guru Gobind Singh Jayanti', emoji: '🙏', type: 'sikh', color: '#FF9500' }],
  '2026-01-13': [{ name: 'Lohri', emoji: '🔥', type: 'festival', color: '#FF6B35' }],
  '2026-01-14': [{ name: 'Makar Sankranti / Pongal / Uttarayan', emoji: '🪁', type: 'festival', color: '#FF9500' }],
  '2026-01-23': [{ name: 'Netaji Subhas Chandra Bose Jayanti', emoji: '🇮🇳', type: 'national', color: '#138808' }],
  '2026-01-26': [{ name: 'Republic Day', emoji: '🇮🇳', type: 'national', color: '#FF9933' }],

  // ── FEBRUARY ──
  '2026-02-02': [{ name: 'Vasant Panchami / Saraswati Puja', emoji: '🌼', type: 'festival', color: '#FFD60A' }],
  '2026-02-14': [{ name: "Valentine's Day", emoji: '❤️', type: 'occasion', color: '#FF3D8A' }],
  '2026-02-19': [{ name: 'Chhatrapati Shivaji Maharaj Jayanti', emoji: '⚔️', type: 'national', color: '#FF9933' }],
  '2026-02-26': [{ name: 'Maha Shivratri', emoji: '🕉️', type: 'festival', color: '#7C3AED' }],

  // ── MARCH ──
  '2026-03-03': [{ name: 'Holi (Holika Dahan)', emoji: '🔥', type: 'festival', color: '#FF6B35' }],
  '2026-03-04': [{ name: 'Holi', emoji: '🎨', type: 'festival', color: '#FF3D8A' }],
  '2026-03-08': [{ name: "International Women's Day", emoji: '👩', type: 'occasion', color: '#FF3D8A' }],
  '2026-03-20': [{ name: 'Ugadi / Gudi Padwa', emoji: '🪔', type: 'festival', color: '#FF9500' }],
  '2026-03-22': [{ name: 'World Water Day', emoji: '💧', type: 'occasion', color: '#3B82F6' }],
  '2026-03-29': [{ name: 'Good Friday', emoji: '✝️', type: 'christian', color: '#6B7280' }],
  '2026-03-31': [{ name: 'Easter', emoji: '🐣', type: 'christian', color: '#10B981' }],

  // ── APRIL ──
  '2026-04-05': [{ name: 'Ram Navami', emoji: '🙏', type: 'festival', color: '#FF9500' }],
  '2026-04-06': [{ name: 'Mahavir Jayanti', emoji: '🕉️', type: 'jain', color: '#FF9500' }],
  '2026-04-13': [{ name: 'Baisakhi / Vishu', emoji: '🌾', type: 'festival', color: '#FFD60A' }],
  '2026-04-14': [{ name: 'Dr. Ambedkar Jayanti / Tamil New Year', emoji: '📚', type: 'national', color: '#3B82F6' }],
  '2026-04-22': [{ name: 'Earth Day', emoji: '🌍', type: 'occasion', color: '#10B981' }],

  // ── MAY ──
  '2026-05-01': [{ name: 'Maharashtra Day / Labour Day', emoji: '✊', type: 'national', color: '#FF9933' }],
  '2026-05-10': [{ name: "Mother's Day", emoji: '👩‍👧', type: 'occasion', color: '#FF3D8A' }],
  '2026-05-23': [{ name: 'Buddha Purnima', emoji: '☸️', type: 'buddhist', color: '#FFD60A' }],

  // ── JUNE ──
  '2026-06-05': [{ name: 'World Environment Day', emoji: '🌱', type: 'occasion', color: '#10B981' }],
  '2026-06-15': [{ name: "Father's Day", emoji: '👨‍👧', type: 'occasion', color: '#3B82F6' }],
  '2026-06-21': [{ name: 'International Yoga Day', emoji: '🧘', type: 'occasion', color: '#FF9500' }],

  // ── JULY ──
  '2026-07-01': [{ name: "Rath Yatra", emoji: '🛕', type: 'festival', color: '#FFD60A' }],

  // ── AUGUST ──
  '2026-08-15': [{ name: 'Independence Day', emoji: '🇮🇳', type: 'national', color: '#138808' }],
  '2026-08-19': [{ name: 'Raksha Bandhan', emoji: '🧣', type: 'festival', color: '#FF3D8A' }],
  '2026-08-21': [{ name: 'Onam begins', emoji: '🌸', type: 'festival', color: '#FF9500' }],
  '2026-08-26': [{ name: 'Janmashtami', emoji: '🦚', type: 'festival', color: '#7C3AED' }],

  // ── SEPTEMBER ──
  '2026-09-05': [{ name: "Teachers' Day", emoji: '📚', type: 'occasion', color: '#3B82F6' }],
  '2026-09-14': [{ name: 'Hindi Diwas', emoji: '🔤', type: 'national', color: '#FF9933' }],
  '2026-09-19': [{ name: 'Ganesh Chaturthi', emoji: '🐘', type: 'festival', color: '#FF9500' }],

  // ── OCTOBER ──
  '2026-10-02': [{ name: 'Gandhi Jayanti', emoji: '🕊️', type: 'national', color: '#138808' }],
  '2026-10-04': [{ name: 'Navratri begins', emoji: '🪔', type: 'festival', color: '#FF3D8A' }],
  '2026-10-13': [{ name: 'Dussehra / Vijayadashami', emoji: '🏹', type: 'festival', color: '#FF9500' }],
  '2026-10-20': [{ name: 'Karwa Chauth', emoji: '🌙', type: 'festival', color: '#FF3D8A' }],

  // ── NOVEMBER ──
  '2026-11-01': [{ name: 'Diwali 🪔', emoji: '🎆', type: 'festival', color: '#FF9500' }],
  '2026-11-02': [{ name: 'Govardhan Puja', emoji: '🙏', type: 'festival', color: '#FF9500' }],
  '2026-11-03': [{ name: 'Bhai Dooj', emoji: '👫', type: 'festival', color: '#FF3D8A' }],
  '2026-11-05': [{ name: 'Chhath Puja', emoji: '☀️', type: 'festival', color: '#FFD60A' }],
  '2026-11-14': [{ name: "Children's Day", emoji: '🧒', type: 'national', color: '#FF3D8A' }],
  '2026-11-19': [{ name: 'Guru Nanak Jayanti', emoji: '🙏', type: 'sikh', color: '#FFD60A' }],

  // ── DECEMBER ──
  '2026-12-01': [{ name: 'World AIDS Day', emoji: '🎗️', type: 'occasion', color: '#EF4444' }],
  '2026-12-19': [{ name: 'Goa Liberation Day', emoji: '🇮🇳', type: 'national', color: '#138808' }],
  '2026-12-24': [{ name: 'Christmas Eve', emoji: '🎄', type: 'christian', color: '#10B981' }],
  '2026-12-25': [{ name: 'Christmas', emoji: '🎁', type: 'christian', color: '#10B981' }],
  '2026-12-31': [{ name: "New Year's Eve", emoji: '🥂', type: 'occasion', color: '#FF3D8A' }],
};

// Helper: get occasions for a date string YYYY-MM-DD
function getOccasions(dateStr) {
  return INDIAN_OCCASIONS[dateStr] || [];
}
