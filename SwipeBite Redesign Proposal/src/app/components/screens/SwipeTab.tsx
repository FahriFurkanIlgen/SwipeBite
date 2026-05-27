import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Play, RefreshCw, Clock, Users } from 'lucide-react';
import { RECIPES } from '../../data/recipes';

export function SwipeTab() {
  const navigate = useNavigate();
  const hasActiveSession = true;

  return (
    <div className="min-h-full bg-background px-5 pt-14">
      {/* Header */}
      <div className="mb-8">
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.12em',
            color: '#9E9890',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          Karar Zamanı
        </p>
        <h1
          style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: '32px',
            fontWeight: 700,
            color: '#1A1714',
            letterSpacing: '-0.02em',
          }}
        >
          Ne yesek?
        </h1>
        <p
          className="mt-1.5"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B6560' }}
        >
          Birlikte kaydırın, AI en iyi eşleşmeyi bulsun.
        </p>
      </div>

      {/* Active session card */}
      {hasActiveSession && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[24px] overflow-hidden mb-5"
          style={{ border: '1px solid #E8E3DC' }}
        >
          <div className="relative h-36">
            <img
              src={RECIPES[0].image}
              alt="Aktif oturum"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to bottom, rgba(26,23,20,0.1), rgba(26,23,20,0.75))' }}
            />
            <div className="relative p-4 h-full flex flex-col justify-end">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#E07A5F' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#FAF7F2', letterSpacing: '0.1em' }}>
                  AKTİF OTURUM
                </span>
              </div>
              <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '18px', fontWeight: 700, color: '#FAF7F2', letterSpacing: '-0.01em' }}>
                Akşam Yemeği Oturumu
              </p>
            </div>
          </div>
          <div className="bg-white p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1.5">
                  <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=32&h=32&fit=crop" alt="" className="w-6 h-6 rounded-full border-2 border-white" />
                  <img src="https://images.unsplash.com/photo-1494790108755-2616b612b0e3?w=32&h=32&fit=crop" alt="" className="w-6 h-6 rounded-full border-2 border-white" />
                </div>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B6560' }}>2 kişi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={12} strokeWidth={1.5} style={{ color: '#9E9890' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B6560' }}>5/8 oylandı</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full mb-4" style={{ background: '#EDE8E1' }}>
              <div className="h-1.5 rounded-full" style={{ width: '62.5%', background: '#F0B429' }} />
            </div>
            <button
              onClick={() => navigate('/session/active')}
              className="w-full py-3 rounded-[14px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{ background: '#F0B429' }}
            >
              <RefreshCw size={15} strokeWidth={2} style={{ color: '#1A1714' }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#1A1714' }}>
                Devam Et
              </span>
            </button>
          </div>
        </motion.div>
      )}

      {/* New session */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-[24px] p-5 mb-4"
        style={{ background: '#FFFFFF', border: '1px solid #E8E3DC' }}
      >
        <h3
          className="mb-1"
          style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: '20px',
            fontWeight: 700,
            color: '#1A1714',
            letterSpacing: '-0.01em',
          }}
        >
          Yeni Oturum Başlat
        </h3>
        <p
          className="mb-5"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B6560' }}
        >
          8 tarif arasında kaydırın, AI en iyi eşleşmeyi bulsun.
        </p>

        {/* Session type options */}
        <div className="flex flex-col gap-2.5 mb-5">
          {[
            { label: 'Hızlı Oturum', sub: '8 tarif, ~5 dakika', emoji: '⚡', active: true },
            { label: 'Detaylı Oturum', sub: '16 tarif, ~10 dakika', emoji: '🔍', active: false },
            { label: 'Tema Oturumu', sub: 'Sadece Türk mutfağı', emoji: '🇹🇷', active: false },
          ].map(({ label, sub, emoji, active }) => (
            <div
              key={label}
              className="flex items-center gap-3 p-3 rounded-[14px]"
              style={{
                background: active ? '#FFF8E7' : '#F0EBE3',
                border: `1.5px solid ${active ? '#F0B429' : 'transparent'}`,
              }}
            >
              <span style={{ fontSize: '20px' }}>{emoji}</span>
              <div className="flex-1">
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#1A1714' }}>{label}</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9E9890' }}>{sub}</p>
              </div>
              {active && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#F0B429' }}>
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/session/new')}
          className="w-full py-4 rounded-[16px] flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
          style={{ background: '#1A1714' }}
        >
          <Play size={16} fill="#F0B429" style={{ color: '#F0B429' }} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#FAF7F2' }}>
            Oturumu Başlat
          </span>
        </button>
      </motion.div>

      {/* Invite partner */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={() => navigate('/invite')}
        className="w-full rounded-[20px] p-4 flex items-center gap-4 text-left transition-all active:scale-[0.98]"
        style={{ background: '#F0EBE3', border: '1px solid #E8E3DC' }}
      >
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center" style={{ background: '#E8E3DC' }}>
          <Users size={18} strokeWidth={1.5} style={{ color: '#6B6560' }} />
        </div>
        <div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#1A1714' }}>
            Eşini Davet Et
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9E9890' }}>
            Birlikte karar verin
          </p>
        </div>
      </motion.button>

      <div style={{ height: 8 }} />
    </div>
  );
}
