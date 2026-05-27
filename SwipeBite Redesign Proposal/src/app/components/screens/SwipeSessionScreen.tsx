import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'motion/react';
import { X, Heart, Star, ChevronsLeft, ArrowLeft, Clock, Users, Package } from 'lucide-react';
import { RECIPES, Recipe } from '../../data/recipes';

interface SwipeCardProps {
  recipe: Recipe;
  isTop: boolean;
  stackIndex: number;
  swipeDirection: 'like' | 'dislike' | 'superlike' | 'superdislike' | null;
  onSwiped: (direction: 'like' | 'dislike' | 'superlike' | 'superdislike') => void;
}

function SwipeCard({ recipe, isTop, stackIndex, swipeDirection, onSwiped }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-18, 18]);
  const likeOpacity = useTransform(x, [30, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, -30], [1, 0]);

  useEffect(() => {
    if (!isTop || !swipeDirection) return;
    let targetX = 0;
    if (swipeDirection === 'like' || swipeDirection === 'superlike') targetX = 650;
    if (swipeDirection === 'dislike' || swipeDirection === 'superdislike') targetX = -650;

    animate(x, targetX, {
      type: 'tween',
      duration: 0.28,
      ease: [0.32, 0, 0.67, 0],
    }).then(() => onSwiped(swipeDirection));
  }, [swipeDirection, isTop]);

  function handleDragEnd(_: unknown, info: { offset: { x: number }; velocity: { x: number } }) {
    const { offset, velocity } = info;
    const threshold = 85;
    const velThreshold = 700;

    if (offset.x > threshold || velocity.x > velThreshold) {
      animate(x, 650, { type: 'tween', duration: 0.25 }).then(() => onSwiped('like'));
    } else if (offset.x < -threshold || velocity.x < -velThreshold) {
      animate(x, -650, { type: 'tween', duration: 0.25 }).then(() => onSwiped('dislike'));
    } else {
      animate(x, 0, { type: 'spring', stiffness: 450, damping: 35 });
    }
  }

  return (
    <motion.div
      className="absolute inset-0 rounded-[28px] overflow-hidden"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        zIndex: 10 - stackIndex,
        scale: isTop ? 1 : 0.96 - stackIndex * 0.025,
        y: isTop ? 0 : stackIndex * 14,
        originX: 0.5,
        originY: 1,
        cursor: isTop ? 'grab' : 'default',
        boxShadow: isTop
          ? '0 20px 60px rgba(26,23,20,0.25), 0 4px 16px rgba(26,23,20,0.1)'
          : '0 8px 24px rgba(26,23,20,0.12)',
      }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.65}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: 'grabbing' }}
    >
      {/* Food photo */}
      <img
        src={recipe.image}
        alt={recipe.name}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(26,23,20,0.05) 40%, rgba(26,23,20,0.8) 100%)',
        }}
      />

      {/* Film grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          backgroundSize: '180px',
        }}
      />

      {/* Like badge */}
      <motion.div
        className="absolute top-8 left-6 px-4 py-1.5 rounded-[10px]"
        style={{
          opacity: likeOpacity,
          background: '#22C55E',
          border: '2.5px solid #16A34A',
          rotate: -12,
        }}
      >
        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '15px', color: 'white', letterSpacing: '0.05em' }}>
          BEĞENDİM
        </span>
      </motion.div>

      {/* Nope badge */}
      <motion.div
        className="absolute top-8 right-6 px-4 py-1.5 rounded-[10px]"
        style={{
          opacity: nopeOpacity,
          background: '#EF4444',
          border: '2.5px solid #DC2626',
          rotate: 12,
        }}
      >
        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '15px', color: 'white', letterSpacing: '0.05em' }}>
          HAYIR
        </span>
      </motion.div>

      {/* Card info */}
      {isTop && (
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {/* Tags */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {recipe.tags.map((t) => (
              <span
                key={t}
                className="px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(250,247,242,0.18)',
                  border: '1px solid rgba(250,247,242,0.25)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#FAF7F2',
                  letterSpacing: '0.06em',
                }}
              >
                {t}
              </span>
            ))}
          </div>

          <h2
            style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: '32px',
              fontWeight: 700,
              color: '#FAF7F2',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            {recipe.name}
          </h2>
          <p
            className="mt-1 mb-4"
            style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'rgba(250,247,242,0.65)' }}
          >
            {recipe.cuisine}
          </p>

          {/* Meta pills */}
          <div className="flex gap-2">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(26,23,20,0.55)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Clock size={11} strokeWidth={1.5} style={{ color: 'rgba(250,247,242,0.7)' }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 500, color: 'rgba(250,247,242,0.85)' }}>
                {recipe.time} dk
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(26,23,20,0.55)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Users size={11} strokeWidth={1.5} style={{ color: 'rgba(250,247,242,0.7)' }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 500, color: 'rgba(250,247,242,0.85)' }}>
                {recipe.servings} kişi
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: `rgba(240,180,41,0.85)` }}
            >
              <Package size={11} strokeWidth={1.5} style={{ color: '#1A1714' }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#1A1714' }}>
                %{recipe.pantryMatch} kiler
              </span>
            </div>
          </div>

          {/* AI reason */}
          <div
            className="mt-3 rounded-[12px] px-3.5 py-2.5"
            style={{ background: 'rgba(26,23,20,0.55)', border: '1px solid rgba(250,247,242,0.1)' }}
          >
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'rgba(250,247,242,0.75)', lineHeight: 1.5 }}>
              ✦ {recipe.aiReason}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function SwipeSessionScreen() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<{ id: string; vote: string }[]>([]);
  const [pendingSwipe, setPendingSwipe] = useState<'like' | 'dislike' | 'superlike' | 'superdislike' | null>(null);

  const currentCard = RECIPES[currentIndex];
  const progress = currentIndex / RECIPES.length;

  function triggerSwipe(dir: 'like' | 'dislike' | 'superlike' | 'superdislike') {
    if (!currentCard) return;
    setPendingSwipe(dir);
  }

  function handleSwiped(dir: 'like' | 'dislike' | 'superlike' | 'superdislike') {
    if (!currentCard) return;
    const newResults = [...results, { id: currentCard.id, vote: dir }];
    setResults(newResults);
    setPendingSwipe(null);

    const nextIndex = currentIndex + 1;
    if (nextIndex >= RECIPES.length) {
      navigate('/match/1', { state: { results: newResults } });
    } else {
      setCurrentIndex(nextIndex);
    }
  }

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/swipe')}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: '#F0EBE3' }}
        >
          <ArrowLeft size={16} strokeWidth={2} style={{ color: '#1A1714' }} />
        </button>
        <div className="flex-1">
          <div className="w-full h-1 rounded-full" style={{ background: '#EDE8E1' }}>
            <motion.div
              className="h-1 rounded-full"
              style={{ background: '#F0B429' }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 30 }}
            />
          </div>
          <p className="mt-1.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9E9890' }}>
            {currentIndex}/{RECIPES.length} tarif
          </p>
        </div>
        <div className="flex -space-x-1.5">
          <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=32&h=32&fit=crop" className="w-7 h-7 rounded-full border-2 border-white" alt="" />
          <img src="https://images.unsplash.com/photo-1494790108755-2616b612b0e3?w=32&h=32&fit=crop" className="w-7 h-7 rounded-full border-2 border-white" alt="" />
        </div>
      </div>

      {/* Card Stack */}
      <div className="flex-1 relative mx-5" style={{ minHeight: 0 }}>
        {currentIndex < RECIPES.length ? (
          <>
            {/* Background cards */}
            {RECIPES.slice(currentIndex + 1, currentIndex + 3).reverse().map((recipe, revIdx) => {
              const stackIdx = (RECIPES.slice(currentIndex + 1, currentIndex + 3).length - 1 - revIdx) + 1;
              return (
                <motion.div
                  key={recipe.id}
                  className="absolute inset-0 rounded-[28px] overflow-hidden"
                  style={{
                    zIndex: 10 - stackIdx,
                    scale: 0.96 - (stackIdx - 1) * 0.025,
                    y: stackIdx * 14,
                    originX: 0.5,
                    originY: 1,
                  }}
                >
                  <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(26,23,20,0.7) 100%)' }} />
                </motion.div>
              );
            })}

            {/* Top draggable card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCard.id}
                className="absolute inset-0"
                initial={{ scale: 0.92, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              >
                <SwipeCard
                  recipe={currentCard}
                  isTop={true}
                  stackIndex={0}
                  swipeDirection={pendingSwipe}
                  onSwiped={handleSwiped}
                />
              </motion.div>
            </AnimatePresence>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="text-4xl">🎉</div>
            <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '22px', fontWeight: 700, color: '#1A1714' }}>
              Oturum tamamlandı!
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-6 pt-5">
        <div className="flex items-center justify-center gap-4">
          {/* Super dislike */}
          <button
            onClick={() => triggerSwipe('superdislike')}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: '#FFE4DC', border: '1.5px solid #E07A5F' }}
          >
            <ChevronsLeft size={18} strokeWidth={2} style={{ color: '#E07A5F' }} />
          </button>

          {/* Dislike */}
          <button
            onClick={() => triggerSwipe('dislike')}
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
            style={{ background: '#FFFFFF', border: '1.5px solid #E8E3DC' }}
          >
            <X size={24} strokeWidth={2} style={{ color: '#EF4444' }} />
          </button>

          {/* Like */}
          <button
            onClick={() => triggerSwipe('like')}
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
            style={{ background: '#FFFFFF', border: '1.5px solid #E8E3DC' }}
          >
            <Heart size={22} strokeWidth={2} style={{ color: '#22C55E' }} fill="#22C55E" />
          </button>

          {/* Super like */}
          <button
            onClick={() => triggerSwipe('superlike')}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: '#FFF8E7', border: '1.5px solid #F0B429' }}
          >
            <Star size={18} strokeWidth={2} style={{ color: '#F0B429' }} fill="#F0B429" />
          </button>
        </div>
      </div>
    </div>
  );
}
