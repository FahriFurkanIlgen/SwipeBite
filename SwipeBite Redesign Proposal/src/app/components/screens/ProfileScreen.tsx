import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Heart, BarChart2, ChevronRight, Bell, Shield, HelpCircle, LogOut, Bookmark, Edit3, Users } from 'lucide-react';
import { RECIPES } from '../../data/recipes';

const STATS = [
  { label: 'Oturum', value: '24', icon: '🃏' },
  { label: 'Eşleşme', value: '18', icon: '✨' },
  { label: 'Pişirilen', value: '12', icon: '🍳' },
  { label: 'Kiler', value: '24', icon: '🫙' },
];

const PREFERENCES_SHORTCUT = [
  { label: 'Türk Mutfağı', active: true },
  { label: 'İtalyan', active: true },
  { label: 'Akdeniz', active: true },
  { label: 'Vejeteryan', active: false },
  { label: 'Vegan', active: false },
  { label: 'Az Acılı', active: true },
];

export function ProfileScreen() {
  const navigate = useNavigate();
  const savedRecipes = RECIPES.slice(0, 4);

  return (
    <div className="min-h-full bg-background px-5 pt-14">
      {/* Profile header */}
      <div className="flex items-start gap-4 mb-7">
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&auto=format"
            alt="Profil"
            className="w-16 h-16 rounded-[18px] object-cover"
          />
          <button
            className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: '#F0B429', border: '2px solid #FAF7F2' }}
          >
            <Edit3 size={11} strokeWidth={2} style={{ color: '#1A1714' }} />
          </button>
        </div>
        <div className="flex-1">
          <h1
            style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: '24px',
              fontWeight: 700,
              color: '#1A1714',
              letterSpacing: '-0.02em',
            }}
          >
            Deniz Yılmaz
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9E9890', marginTop: 2 }}>
            deniz@swipebite.app
          </p>
          <div
            className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full"
            style={{ background: '#F0EBE3' }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: '#F0B429' }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#6B6560' }}>
              Yılmaz Evi
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2.5 mb-6">
        {STATS.map(({ label, value, icon }) => (
          <div
            key={label}
            className="rounded-[16px] p-3 flex flex-col items-center gap-1"
            style={{ background: '#FFFFFF', border: '1px solid #E8E3DC' }}
          >
            <span style={{ fontSize: '16px' }}>{icon}</span>
            <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '20px', fontWeight: 700, color: '#1A1714', lineHeight: 1 }}>
              {value}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#9E9890', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Household */}
      <div
        className="rounded-[20px] p-4 mb-5"
        style={{ background: '#FFFFFF', border: '1px solid #E8E3DC' }}
      >
        <div className="flex items-center justify-between mb-3">
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#9E9890', textTransform: 'uppercase' }}>
            Ev Halkı
          </p>
          <button onClick={() => navigate('/invite')}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#F0B429' }}>+ Davet et</span>
          </button>
        </div>
        <div className="flex gap-3">
          {[
            { name: 'Deniz', img: 'photo-1535713875002-d1d0cf377fde', role: 'Sen' },
            { name: 'Selin', img: 'photo-1494790108755-2616b612b0e3', role: 'Eş' },
          ].map(({ name, img, role }) => (
            <div key={name} className="flex flex-col items-center gap-1.5">
              <div className="relative">
                <img
                  src={`https://images.unsplash.com/${img}?w=60&h=60&fit=crop&auto=format`}
                  alt={name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full"
                  style={{ background: '#6B8F71', border: '2px solid white' }}
                />
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 500, color: '#1A1714' }}>{name}</p>
              <span
                className="px-1.5 py-0.5 rounded-full"
                style={{ background: role === 'Sen' ? '#FFF8E7' : '#F0EBE3', fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 600, color: role === 'Sen' ? '#D4A017' : '#9E9890' }}
              >
                {role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#9E9890', textTransform: 'uppercase' }}>
            Tercihlerim
          </p>
          <button>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#F0B429' }}>Düzenle</span>
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {PREFERENCES_SHORTCUT.map(({ label, active }) => (
            <span
              key={label}
              className="px-3 py-1.5 rounded-full"
              style={{
                background: active ? '#F0EBE3' : '#FFFFFF',
                border: `1px solid ${active ? '#E8E3DC' : '#E8E3DC'}`,
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                fontWeight: active ? 500 : 400,
                color: active ? '#1A1714' : '#C8C0B8',
                textDecoration: active ? 'none' : 'line-through',
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Saved recipes */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#9E9890', textTransform: 'uppercase' }}>
            Kaydedilenler
          </p>
          <button>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#F0B429' }}>Tümünü gör</span>
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {savedRecipes.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(`/recipe/${r.id}`)}
              className="aspect-square rounded-[12px] overflow-hidden transition-all active:scale-95"
            >
              <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div
        className="rounded-[20px] overflow-hidden mb-6"
        style={{ background: '#FFFFFF', border: '1px solid #E8E3DC' }}
      >
        {[
          { icon: Bell, label: 'Bildirimler', sub: 'Eşleşme bildirimleri', path: null },
          { icon: Shield, label: 'Gizlilik', sub: 'Verileriniz', path: null },
          { icon: HelpCircle, label: 'Yardım', sub: 'SSS ve destek', path: null },
        ].map(({ icon: Icon, label, sub, path }, i) => (
          <button
            key={label}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-secondary"
            style={{ borderTop: i > 0 ? '1px solid #F0EBE3' : 'none' }}
          >
            <div
              className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: '#F0EBE3' }}
            >
              <Icon size={14} strokeWidth={1.5} style={{ color: '#6B6560' }} />
            </div>
            <div className="flex-1">
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '13px', color: '#1A1714' }}>{label}</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9E9890' }}>{sub}</p>
            </div>
            <ChevronRight size={14} strokeWidth={1.5} style={{ color: '#C8C0B8' }} />
          </button>
        ))}

        <button
          onClick={() => navigate('/welcome')}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
          style={{ borderTop: '1px solid #F0EBE3' }}
        >
          <div
            className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{ background: '#FFE4DC' }}
          >
            <LogOut size={14} strokeWidth={1.5} style={{ color: '#E07A5F' }} />
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '13px', color: '#E07A5F' }}>
            Çıkış Yap
          </p>
        </button>
      </div>

      <div style={{ height: 8 }} />
    </div>
  );
}
