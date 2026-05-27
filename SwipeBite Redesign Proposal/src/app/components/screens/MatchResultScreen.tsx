import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { ChevronRight, Clock, Users, Zap, Heart, Scale, ArrowLeft } from 'lucide-react';
import { RECIPES } from '../../data/recipes';

function Confetti() {
  const pieces = Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 1.5 + Math.random() * 1.2,
    size: 6 + Math.random() * 8,
    color: ['#F0B429', '#E07A5F', '#6B8F71', '#FAF7F2', '#1A1714'][Math.floor(Math.random() * 5)],
    rotate: Math.random() * 360,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{ left: `${p.x}%`, top: -20, width: p.size, height: p.size / 2, background: p.color }}
          initial={{ y: -20, rotate: p.rotate, opacity: 1 }}
          animate={{ y: 800, rotate: p.rotate + 360, opacity: 0 }}
          transition={{ delay: p.delay, duration: p.duration, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

export function MatchResultScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showConfetti, setShowConfetti] = useState(true);

  const winner = RECIPES[0]; // Tavuk Şiş
  const alternatives = [
    { recipe: RECIPES[6], tag: 'Hızlı', tagColor: '#F0B429', tagBg: '#FFF8E7' },
    { recipe: RECIPES[1], tag: 'Hafif', tagColor: '#6B8F71', tagBg: '#EEF4EE' },
    { recipe: RECIPES[2], tag: 'Ekonomik', tagColor: '#E07A5F', tagBg: '#FFE4DC' },
  ];

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 3200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>

      {/* Hero */}
      <div className="relative flex-shrink-0" style={{ height: 320 }}>
        <img
          src={winner.image}
          alt={winner.name}
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(26,23,20,0.15) 30%, rgba(26,23,20,0.82) 100%)',
          }}
        />

        {/* Back button */}
        <button
          onClick={() => navigate('/home')}
          className="absolute top-12 left-5 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(26,23,20,0.4)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          <ArrowLeft size={16} strokeWidth={2} style={{ color: 'white' }} />
        </button>

        {/* Match badge */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 350, damping: 20 }}
          className="absolute top-12 left-1/2 -translate-x-1/2"
        >
          <div
            className="px-4 py-1.5 rounded-full flex items-center gap-2"
            style={{ background: '#F0B429' }}
          >
            <Heart size={12} fill="#1A1714" style={{ color: '#1A1714' }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '11px', color: '#1A1714', letterSpacing: '0.1em' }}>
              EŞLEŞME!
            </span>
          </div>
        </motion.div>

        {/* Winner info */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: '#F0B429', textTransform: 'uppercase', marginBottom: 4 }}>
              Bugünün kazananı
            </p>
            <h1
              style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: '38px',
                fontWeight: 700,
                color: '#FAF7F2',
                letterSpacing: '-0.025em',
                lineHeight: 1.05,
              }}
            >
              {winner.name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5">
                <Clock size={12} strokeWidth={1.5} style={{ color: 'rgba(250,247,242,0.65)' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(250,247,242,0.75)' }}>{winner.time} dk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={12} strokeWidth={1.5} style={{ color: 'rgba(250,247,242,0.65)' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(250,247,242,0.75)' }}>{winner.servings} kişi</span>
              </div>
              <div
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full"
                style={{ background: 'rgba(240,180,41,0.9)' }}
              >
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '11px', color: '#1A1714' }}>
                  %{winner.matchScore} eşleşme
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-5" style={{ scrollbarWidth: 'none' }}>
        {/* Liked by */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-[18px] p-4 mb-4"
          style={{ background: '#FFFFFF', border: '1px solid #E8E3DC' }}
        >
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#9E9890', textTransform: 'uppercase', marginBottom: 10 }}>
            Beğenenler
          </p>
          <div className="flex gap-3">
            {winner.likedBy.map((name) => (
              <div key={name} className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: '#F0B429' }}
                >
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#1A1714' }}>
                    {name[0]}
                  </span>
                </div>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#1A1714' }}>
                  {name}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Why matched */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="rounded-[18px] p-4 mb-4"
          style={{ background: '#FFFFFF', border: '1px solid #E8E3DC' }}
        >
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#9E9890', textTransform: 'uppercase', marginBottom: 12 }}>
            Neden Eşleşti?
          </p>
          <div className="flex flex-col gap-2.5">
            {[
              { icon: Heart, text: 'İkiniz de beğendi', detail: '2/2 oy', color: '#22C55E' },
              { icon: Scale, text: 'Ev uyumu yüksek', detail: `%${winner.matchScore}`, color: '#F0B429' },
              { icon: Zap, text: 'Kiler eşleşmesi', detail: `%${winner.pantryMatch} malzeme var`, color: '#E07A5F' },
            ].map(({ icon: Icon, text, detail, color }) => (
              <div key={text} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}18` }}
                >
                  <Icon size={14} strokeWidth={2} style={{ color }} />
                </div>
                <div className="flex-1">
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#1A1714' }}>{text}</p>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{ background: '#F0EBE3', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#6B6560' }}
                >
                  {detail}
                </span>
              </div>
            ))}
          </div>

          {/* Missing ingredients */}
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid #E8E3DC' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9E9890' }}>
              Eksik malzeme: {winner.ingredients.filter(i => !i.inPantry).map(i => i.name).join(', ')}
            </p>
          </div>
        </motion.div>

        {/* Alternatives */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-4"
        >
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#9E9890', textTransform: 'uppercase', marginBottom: 10 }}>
            Alternatifler
          </p>
          <div className="flex flex-col gap-2">
            {alternatives.map(({ recipe, tag, tagColor, tagBg }) => (
              <button
                key={recipe.id}
                onClick={() => navigate(`/recipe/${recipe.id}`)}
                className="flex items-center gap-3 p-3 rounded-[16px] text-left transition-all active:scale-[0.98]"
                style={{ background: '#FFFFFF', border: '1px solid #E8E3DC' }}
              >
                <img src={recipe.image} alt={recipe.name} className="w-12 h-12 rounded-[10px] object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#1A1714' }}>{recipe.name}</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9E9890', marginTop: 1 }}>{recipe.time} dk · {recipe.cuisine}</p>
                </div>
                <span
                  className="px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: tagBg, fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: tagColor }}
                >
                  {tag}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex gap-3 pb-6"
        >
          <button
            onClick={() => navigate(`/recipe/${winner.id}`)}
            className="flex-1 py-3.5 rounded-[16px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{ background: '#F0EBE3', border: '1px solid #E8E3DC' }}
          >
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#1A1714' }}>
              Tarifi Gör
            </span>
          </button>
          <button
            onClick={() => navigate(`/cook/${winner.id}`)}
            className="flex-[2] py-3.5 rounded-[16px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{ background: '#F0B429' }}
          >
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#1A1714' }}>
              Bu Tarifi Yapalım
            </span>
            <ChevronRight size={16} strokeWidth={2.5} style={{ color: '#1A1714' }} />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
