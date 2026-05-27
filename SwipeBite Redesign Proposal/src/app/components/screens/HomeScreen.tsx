import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Package, CalendarDays, BookmarkCheck, Download, ChevronRight, Flame, Clock, Users } from 'lucide-react';
import { RECIPES } from '../../data/recipes';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return 'Gece yarısı acıktınız mı?';
  if (h < 12) return 'Günaydın, Deniz';
  if (h < 17) return 'İyi öğlenler, Deniz';
  if (h < 21) return 'İyi akşamlar, Deniz';
  return 'İyi geceler, Deniz';
}

const AI_SUGGESTIONS = [
  { text: 'Kilerde 6 malzeme eşleşiyor — Sebzeli Güveç hazırlamak çok kolay olur.', icon: '🫙', tag: 'Kiler Uyumu' },
  { text: 'Cuma akşamı için Pizza Margarita öneririz. Hafta sonu moduna mükemmel.', icon: '📅', tag: 'Haftalık Plan' },
  { text: 'Mercimek Çorbası: 2 kişi beğendi, 25 dk, malzemeler tamamen kilerde.', icon: '✨', tag: 'Ev Uyumu' },
];

export function HomeScreen() {
  const navigate = useNavigate();
  const featuredRecipe = RECIPES[0];

  return (
    <div className="min-h-full bg-background px-5 pt-14">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              color: '#9E9890',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            Çarşamba, 27 Mayıs
          </p>
          <h1
            style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: '26px',
              fontWeight: 700,
              color: '#1A1714',
              letterSpacing: '-0.02em',
            }}
          >
            {getGreeting()}
          </h1>
        </div>
        <button className="w-10 h-10 rounded-full overflow-hidden" style={{ border: '2px solid #F0B429' }}>
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&auto=format"
            alt="Profil"
            className="w-full h-full object-cover"
          />
        </button>
      </div>

      {/* Hero CTA Card */}
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onClick={() => navigate('/session/new')}
        className="w-full rounded-[24px] overflow-hidden mb-4 text-left relative"
        style={{ height: 200 }}
        whileTap={{ scale: 0.98 }}
      >
        <img
          src="https://images.unsplash.com/photo-1580069491658-8220b0e8722d?w=800&h=400&fit=crop&auto=format"
          alt="Lezzetli yemekler"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(26,23,20,0.6) 0%, rgba(26,23,20,0.1) 60%, rgba(26,23,20,0.0) 100%)',
          }}
        />
        <div className="relative p-5 h-full flex flex-col justify-between">
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', color: '#F0B429', textTransform: 'uppercase' }}>
              Yeni Oturum
            </p>
            <h2
              className="mt-1"
              style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: '28px',
                fontWeight: 700,
                color: '#FAF7F2',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              Bugün ne<br />yesek?
            </h2>
          </div>
          <div
            className="self-start flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ background: '#F0B429' }}
          >
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#1A1714' }}>
              Kaydırmaya başla
            </span>
            <ChevronRight size={14} strokeWidth={2.5} style={{ color: '#1A1714' }} />
          </div>
        </div>
      </motion.button>

      {/* Active Session Card */}
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={() => navigate('/session/active')}
        className="w-full rounded-[20px] p-4 mb-5 text-left flex items-center gap-4 transition-all active:scale-[0.98]"
        style={{ background: '#FFFFFF', border: '1px solid #E8E3DC' }}
      >
        <div className="relative flex-shrink-0">
          <img
            src={featuredRecipe.image}
            alt={featuredRecipe.name}
            className="w-14 h-14 rounded-[12px] object-cover"
          />
          <div
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full"
            style={{ background: '#E07A5F', border: '2px solid white' }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#E07A5F', textTransform: 'uppercase' }}>
            Aktif Oturum
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#1A1714', marginTop: 2 }}>
            Deniz'in oyu bekleniyor
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9E9890', marginTop: 1 }}>
            5/8 yemek oylandı
          </p>
        </div>
        <ChevronRight size={18} strokeWidth={1.5} style={{ color: '#C8C0B8' }} />
      </motion.button>

      {/* Quick Actions Grid */}
      <div className="mb-5">
        <p
          className="mb-3"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: '#9E9890', textTransform: 'uppercase' }}
        >
          Hızlı Erişim
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              icon: Package,
              label: 'Kilerim',
              sub: '24 malzeme',
              path: '/pantry',
              bg: '#F0EBE3',
              accent: '#6B6560',
            },
            {
              icon: CalendarDays,
              label: 'Haftalık Plan',
              sub: '3 gün planlandı',
              path: '/planner',
              bg: '#FFF8E7',
              accent: '#D4A017',
            },
            {
              icon: Download,
              label: 'Tarif İçe Aktar',
              sub: 'Instagram, web…',
              path: '/import',
              bg: '#F0EBE3',
              accent: '#6B6560',
            },
            {
              icon: BookmarkCheck,
              label: 'Kaydedilenler',
              sub: '12 tarif',
              path: '/profile',
              bg: '#EEF4EE',
              accent: '#4A7A50',
            },
          ].map(({ icon: Icon, label, sub, path, bg, accent }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="rounded-[18px] p-4 text-left transition-all active:scale-[0.96]"
              style={{ background: bg }}
            >
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center mb-3"
                style={{ background: 'rgba(255,255,255,0.6)' }}
              >
                <Icon size={18} strokeWidth={1.5} style={{ color: accent }} />
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#1A1714' }}>
                {label}
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9E9890', marginTop: 2 }}>
                {sub}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <p
            style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: '#9E9890', textTransform: 'uppercase' }}
          >
            AI Önerileri
          </p>
          <div className="flex items-center gap-1.5">
            <Flame size={11} style={{ color: '#F0B429' }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9E9890' }}>Kişiselleştirilmiş</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {AI_SUGGESTIONS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="rounded-[16px] p-4"
              style={{ background: '#FFFFFF', border: '1px solid #E8E3DC' }}
            >
              <div className="flex items-start gap-3">
                <span style={{ fontSize: '20px', lineHeight: 1 }}>{s.icon}</span>
                <div className="flex-1">
                  <span
                    className="inline-block px-2 py-0.5 rounded-full mb-1.5"
                    style={{
                      background: '#F0EBE3',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '10px',
                      fontWeight: 600,
                      color: '#6B6560',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {s.tag}
                  </span>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#3D3530', lineHeight: 1.5 }}>
                    {s.text}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent matches teaser */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: '#9E9890', textTransform: 'uppercase' }}>
            Son Eşleşmeler
          </p>
          <button>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#F0B429', fontWeight: 600 }}>Tümünü gör</span>
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {RECIPES.slice(0, 5).map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(`/recipe/${r.id}`)}
              className="flex-shrink-0 flex flex-col gap-1.5 active:scale-95 transition-transform"
              style={{ width: 88 }}
            >
              <div className="rounded-[14px] overflow-hidden" style={{ height: 88 }}>
                <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center gap-1">
                <Clock size={9} strokeWidth={1.5} style={{ color: '#9E9890', flexShrink: 0 }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#9E9890' }}>{r.time}dk</span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px', color: '#1A1714', lineHeight: 1.3 }}>
                {r.name}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 8 }} />
    </div>
  );
}
