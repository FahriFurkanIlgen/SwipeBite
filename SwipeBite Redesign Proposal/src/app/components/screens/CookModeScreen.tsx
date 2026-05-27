import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ChevronRight, ChevronLeft, Timer, Check, Volume2 } from 'lucide-react';
import { RECIPES } from '../../data/recipes';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function CookModeScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const recipe = RECIPES.find((r) => r.id === id) ?? RECIPES[0];

  const [stepIndex, setStepIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [completed, setCompleted] = useState(false);

  const currentStep = recipe.steps[stepIndex];
  const progress = (stepIndex + 1) / recipe.steps.length;

  useEffect(() => {
    if (currentStep.duration) {
      setTimerSeconds(currentStep.duration * 60);
      setTimerRunning(false);
    } else {
      setTimerSeconds(0);
    }
  }, [stepIndex]);

  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((s) => {
        if (s <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  function nextStep() {
    if (stepIndex < recipe.steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      setCompleted(true);
    }
  }

  function prevStep() {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  }

  if (completed) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-center"
        >
          <div className="text-6xl mb-5">🍽️</div>
          <h1
            style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: '34px',
              fontWeight: 700,
              color: '#1A1714',
              letterSpacing: '-0.02em',
            }}
          >
            Afiyet olsun!
          </h1>
          <p className="mt-2 mb-8" style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#6B6560' }}>
            {recipe.name} hazır. Servis edin!
          </p>
          <button
            onClick={() => navigate('/home')}
            className="px-8 py-4 rounded-[16px] transition-all active:scale-[0.98]"
            style={{ background: '#F0B429' }}
          >
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#1A1714' }}>
              Ana Sayfaya Dön
            </span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#1A1714' }}>
      {/* Hero photo */}
      <div className="relative flex-shrink-0" style={{ height: '40%' }}>
        <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" style={{ opacity: 0.6 }} />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(26,23,20,0.3) 0%, rgba(26,23,20,0.9) 100%)' }}
        />

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 px-5 pt-12 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(250,247,242,0.12)', border: '1px solid rgba(250,247,242,0.15)' }}
          >
            <ArrowLeft size={16} strokeWidth={2} style={{ color: '#FAF7F2' }} />
          </button>

          <div className="flex items-center gap-2">
            <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic', fontSize: '15px', color: 'rgba(250,247,242,0.8)' }}>
              {recipe.name}
            </span>
          </div>

          <button
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(250,247,242,0.12)', border: '1px solid rgba(250,247,242,0.15)' }}
          >
            <Volume2 size={15} strokeWidth={1.5} style={{ color: '#FAF7F2' }} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'rgba(250,247,242,0.1)' }}>
          <motion.div
            className="h-1"
            style={{ background: '#F0B429' }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          />
        </div>

        {/* Step indicator */}
        <div className="absolute bottom-4 left-5">
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(250,247,242,0.6)' }}>
            Adım {stepIndex + 1} / {recipe.steps.length}
          </span>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col px-5 pt-6 pb-6 overflow-hidden" style={{ background: '#FAF7F2' }}>
        {/* Step number + title */}
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="flex-1"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center mb-4"
              style={{ background: '#F0B429' }}
            >
              <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '14px', color: '#1A1714' }}>
                {currentStep.step}
              </span>
            </div>

            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '17px',
                fontWeight: 400,
                color: '#1A1714',
                lineHeight: 1.65,
              }}
            >
              {currentStep.description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Timer */}
        {currentStep.duration && (
          <div
            className="rounded-[20px] p-4 mb-5 flex items-center gap-4"
            style={{ background: '#FFFFFF', border: '1px solid #E8E3DC' }}
          >
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
              style={{ background: timerRunning ? '#E07A5F' : '#F0B429' }}
            >
              <Timer size={20} strokeWidth={1.5} style={{ color: '#1A1714' }} />
            </button>
            <div className="flex-1">
              <p
                style={{
                  fontFamily: 'Fraunces, Georgia, serif',
                  fontSize: '28px',
                  fontWeight: 700,
                  color: timerSeconds === 0 ? '#6B8F71' : '#1A1714',
                  letterSpacing: '-0.02em',
                }}
              >
                {timerSeconds === 0 ? '✓ Hazır' : formatTime(timerSeconds)}
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9E9890' }}>
                {timerRunning ? 'Sayıyor…' : timerSeconds > 0 ? 'Başlatmak için dokunun' : 'Süre doldu!'}
              </p>
            </div>
            {timerSeconds > 0 && (
              <div
                className="w-10 h-10 flex items-center justify-center"
                style={{ opacity: 0.4 }}
              >
                <div
                  className="w-8 h-8 rounded-full"
                  style={{
                    background: `conic-gradient(#F0B429 ${(1 - timerSeconds / (currentStep.duration! * 60)) * 360}deg, #E8E3DC 0)`,
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={prevStep}
            disabled={stepIndex === 0}
            className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 transition-all active:scale-90 disabled:opacity-30"
            style={{ background: '#F0EBE3', border: '1px solid #E8E3DC' }}
          >
            <ChevronLeft size={20} strokeWidth={2} style={{ color: '#6B6560' }} />
          </button>

          <button
            onClick={nextStep}
            className="flex-1 py-3 rounded-[14px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{ background: '#1A1714' }}
          >
            {stepIndex < recipe.steps.length - 1 ? (
              <>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#FAF7F2' }}>
                  Sonraki Adım
                </span>
                <ChevronRight size={16} strokeWidth={2} style={{ color: '#FAF7F2' }} />
              </>
            ) : (
              <>
                <Check size={16} strokeWidth={2.5} style={{ color: '#F0B429' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#FAF7F2' }}>
                  Tamamlandı
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
