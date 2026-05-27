import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Check, Share2, QrCode, Clock } from 'lucide-react';

const TOTAL_STEPS = 4;

const CUISINES = ['Türk', 'İtalyan', 'Japon', 'Meksika', 'Hint', 'Akdeniz', 'Çin', 'Fransız', 'Yunan', 'Tayland'];
const ALLERGIES = ['Gluten', 'Süt', 'Yumurta', 'Fındık', 'Deniz ürünleri', 'Soya', 'Yer fıstığı'];

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i === current ? 24 : 6,
            opacity: i <= current ? 1 : 0.25,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="h-1.5 rounded-full"
          style={{ background: i === current ? '#F0B429' : '#1A1714' }}
        />
      ))}
    </div>
  );
}

function Step1({
  selected,
  setSelected,
  allergies,
  setAllergies,
  spice,
  setSpice,
}: {
  selected: string[];
  setSelected: (v: string[]) => void;
  allergies: string[];
  setAllergies: (v: string[]) => void;
  spice: number;
  setSpice: (v: number) => void;
}) {
  function toggle<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-3" style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: '#9E9890', textTransform: 'uppercase' }}>
          Sevdiğiniz Mutfaklar
        </p>
        <div className="flex flex-wrap gap-2">
          {CUISINES.map((c) => {
            const active = selected.includes(c);
            return (
              <button
                key={c}
                onClick={() => setSelected(toggle(selected, c))}
                className="px-3.5 py-1.5 rounded-full transition-all active:scale-95"
                style={{
                  background: active ? '#F0B429' : '#F0EBE3',
                  border: `1px solid ${active ? '#F0B429' : '#E8E3DC'}`,
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  fontWeight: active ? 600 : 400,
                  color: active ? '#1A1714' : '#6B6560',
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-3" style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: '#9E9890', textTransform: 'uppercase' }}>
          Acı Seviyesi
        </p>
        <div className="flex gap-2">
          {[
            { level: 1, label: 'Hiç yok', emoji: '😌' },
            { level: 2, label: 'Az', emoji: '🌶' },
            { level: 3, label: 'Orta', emoji: '🌶🌶' },
            { level: 4, label: 'Fazla', emoji: '🔥' },
          ].map(({ level, label, emoji }) => (
            <button
              key={level}
              onClick={() => setSpice(level)}
              className="flex-1 py-2.5 rounded-[12px] transition-all active:scale-95 flex flex-col items-center gap-1"
              style={{
                background: spice === level ? '#FFF3CD' : '#F0EBE3',
                border: `1.5px solid ${spice === level ? '#F0B429' : 'transparent'}`,
              }}
            >
              <span style={{ fontSize: '16px' }}>{emoji}</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: spice === level ? '#1A1714' : '#9E9890', fontWeight: spice === level ? 600 : 400 }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3" style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: '#9E9890', textTransform: 'uppercase' }}>
          Alerjiler / İstemiyorum
        </p>
        <div className="flex flex-wrap gap-2">
          {ALLERGIES.map((a) => {
            const active = allergies.includes(a);
            return (
              <button
                key={a}
                onClick={() => setAllergies(toggle(allergies, a))}
                className="px-3.5 py-1.5 rounded-full transition-all active:scale-95"
                style={{
                  background: active ? '#FFE4DC' : '#F0EBE3',
                  border: `1px solid ${active ? '#E07A5F' : '#E8E3DC'}`,
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  fontWeight: active ? 600 : 400,
                  color: active ? '#E07A5F' : '#6B6560',
                }}
              >
                {active && '✕ '}{a}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Step2({ houseName, setHouseName }: { houseName: string; setHouseName: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B6560', lineHeight: 1.6 }}>
        Ev halkınıza bir isim verin. Bu isim paylaşım bağlantılarında ve bildirimlerinde görünecek.
      </p>
      <input
        type="text"
        placeholder="Örn: Yılmaz Ailesi, İstanbul Evi"
        value={houseName}
        onChange={(e) => setHouseName(e.target.value)}
        className="w-full py-4 px-4 rounded-[16px] outline-none"
        style={{
          background: '#F0EBE3',
          border: '1.5px solid transparent',
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: '20px',
          fontWeight: 400,
          color: '#1A1714',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#F0B429')}
        onBlur={(e) => (e.target.style.borderColor = 'transparent')}
      />
      <div
        className="rounded-[16px] p-4"
        style={{ background: '#FFF8E7', border: '1px solid #F0B429' }}
      >
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B5000' }}>
          💡 Evinize sonradan isim değiştirebilirsiniz. Şimdilik istediğiniz herhangi bir ismi kullanabilirsiniz.
        </p>
      </div>
    </div>
  );
}

function Step3({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B6560', lineHeight: 1.6 }}>
        Ev halkınızı davet edin. Onlar da kendi tercihlerini ekleyebilir ve birlikte eşleşebilirsiniz.
      </p>

      <button
        className="flex items-center gap-4 w-full p-4 rounded-[16px] text-left transition-all active:scale-[0.98]"
        style={{ background: '#F0EBE3', border: '1px solid #E8E3DC' }}
      >
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center" style={{ background: '#F0B429' }}>
          <Share2 size={18} style={{ color: '#1A1714' }} strokeWidth={1.5} />
        </div>
        <div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#1A1714' }}>Davet bağlantısı gönder</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B6560' }}>swipebite.app/join/ABC123</p>
        </div>
      </button>

      <button
        className="flex items-center gap-4 w-full p-4 rounded-[16px] text-left transition-all active:scale-[0.98]"
        style={{ background: '#F0EBE3', border: '1px solid #E8E3DC' }}
      >
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center" style={{ background: '#EDE8E1' }}>
          <QrCode size={18} style={{ color: '#6B6560' }} strokeWidth={1.5} />
        </div>
        <div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#1A1714' }}>QR kod göster</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B6560' }}>Yanındakileri hemen davet et</p>
        </div>
      </button>

      <button
        onClick={onNext}
        className="flex items-center gap-4 w-full p-4 rounded-[16px] text-left transition-all active:scale-[0.98]"
        style={{ background: '#F0EBE3', border: '1px solid #E8E3DC' }}
      >
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center" style={{ background: '#EDE8E1' }}>
          <Clock size={18} style={{ color: '#6B6560' }} strokeWidth={1.5} />
        </div>
        <div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#1A1714' }}>Sonra davet edeceğim</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B6560' }}>Şimdilik tek başına kullan</p>
        </div>
      </button>
    </div>
  );
}

function Step4({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center pt-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-20 h-20 rounded-[24px] flex items-center justify-center"
        style={{ background: '#F0B429' }}
      >
        <Check size={36} strokeWidth={2.5} style={{ color: '#1A1714' }} />
      </motion.div>

      <div>
        <h2
          style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: '28px',
            fontWeight: 700,
            color: '#1A1714',
            letterSpacing: '-0.02em',
          }}
        >
          Her şey hazır!
        </h2>
        <p
          className="mt-2"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B6560', lineHeight: 1.6 }}
        >
          Artık ilk yemek oturumunuzu başlatabilirsiniz. Kaydırın, eşleşin ve pişirin!
        </p>
      </div>

      <div
        className="w-full rounded-[20px] p-5"
        style={{ background: '#F0EBE3' }}
      >
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#9E9890', textTransform: 'uppercase', marginBottom: 12 }}>
          Bugün ne yesek?
        </p>
        <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic', fontSize: '16px', color: '#1A1714', lineHeight: 1.5 }}>
          "Ailecek kaydırın, AI sizin için en iyi eşleşmeyi bulsun."
        </p>
      </div>

      <button
        onClick={onFinish}
        className="w-full py-4 rounded-[16px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        style={{ background: '#F0B429' }}
      >
        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#1A1714' }}>
          İlk Oturumu Başlat
        </span>
        <ChevronRight size={18} strokeWidth={2.5} style={{ color: '#1A1714' }} />
      </button>
    </div>
  );
}

export function OnboardingScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [cuisines, setCuisines] = useState<string[]>(['Türk', 'Akdeniz']);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [spice, setSpice] = useState(2);
  const [houseName, setHouseName] = useState('');

  const STEPS = [
    { title: 'Tercihleriniz', subtitle: 'Size en uygun önerileri sunabilmemiz için' },
    { title: 'Evinize isim verin', subtitle: 'Birlikte kullanacağınız alan' },
    { title: 'Eşinizi davet edin', subtitle: 'Birlikte daha eğlenceli' },
    { title: 'Hazırsınız!', subtitle: '' },
  ];

  function handleNext() {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    }
  }

  const currentStep = STEPS[step];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 pt-14 pb-6">
        <ProgressDots current={step} total={TOTAL_STEPS} />
        <div className="mt-6">
          <h1
            style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: '30px',
              fontWeight: 700,
              color: '#1A1714',
              letterSpacing: '-0.02em',
            }}
          >
            {currentStep.title}
          </h1>
          {currentStep.subtitle && (
            <p className="mt-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B6560' }}>
              {currentStep.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6" style={{ scrollbarWidth: 'none' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {step === 0 && (
              <Step1
                selected={cuisines}
                setSelected={setCuisines}
                allergies={allergies}
                setAllergies={setAllergies}
                spice={spice}
                setSpice={setSpice}
              />
            )}
            {step === 1 && <Step2 houseName={houseName} setHouseName={setHouseName} />}
            {step === 2 && <Step3 onNext={handleNext} />}
            {step === 3 && <Step4 onFinish={() => navigate('/session/new')} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer CTA — hidden on step 2 (has its own CTAs) and step 3 */}
      {step !== 2 && step !== 3 && (
        <div className="px-6 pb-8 pt-2">
          <button
            onClick={handleNext}
            className="w-full py-4 rounded-[16px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{ background: '#F0B429' }}
          >
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#1A1714' }}>
              {step === TOTAL_STEPS - 2 ? 'Bitir' : 'Devam et'}
            </span>
            <ChevronRight size={18} strokeWidth={2.5} style={{ color: '#1A1714' }} />
          </button>
        </div>
      )}
    </div>
  );
}
