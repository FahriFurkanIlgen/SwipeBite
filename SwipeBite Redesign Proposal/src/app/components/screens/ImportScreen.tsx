import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Link, ClipboardPaste, Sparkles, Check, ChevronRight, Clock, Users } from 'lucide-react';

const MOCK_PARSED = {
  name: 'Nohutlu Ispanak Kavurma',
  cuisine: 'Türk Mutfağı',
  time: 30,
  difficulty: 'Kolay',
  servings: 4,
  image: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=400&h=600&fit=crop&auto=format',
  ingredients: [
    'Ispanak (500g)',
    'Nohut (1 kutu, 400g)',
    'Soğan (1 adet)',
    'Sarımsak (3 diş)',
    'Domates (2 adet)',
    'Zeytinyağı (3 kaşık)',
  ],
  source: 'instagram.com',
};

type Stage = 'input' | 'parsing' | 'preview';

export function ImportScreen() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('input');
  const [inputValue, setInputValue] = useState('');
  const [saved, setSaved] = useState(false);

  async function handleImport() {
    if (!inputValue.trim()) return;
    setStage('parsing');
    await new Promise((r) => setTimeout(r, 1800));
    setStage('preview');
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => navigate('/home'), 1200);
  }

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-12 pb-5 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: '#F0EBE3' }}
        >
          <ArrowLeft size={16} strokeWidth={2} style={{ color: '#1A1714' }} />
        </button>
        <div>
          <h1
            style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: '22px',
              fontWeight: 700,
              color: '#1A1714',
              letterSpacing: '-0.02em',
            }}
          >
            Tarif İçe Aktar
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9E9890' }}>
            Instagram, web sitesi veya metin
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5" style={{ scrollbarWidth: 'none' }}>
        <AnimatePresence mode="wait">
          {stage === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex flex-col gap-4"
            >
              {/* URL input */}
              <div
                className="rounded-[20px] p-4"
                style={{ background: '#FFFFFF', border: '1px solid #E8E3DC' }}
              >
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#9E9890', textTransform: 'uppercase', marginBottom: 10 }}>
                  Bağlantı veya Metin
                </p>
                <div
                  className="flex items-center gap-2 p-3 rounded-[14px] mb-3"
                  style={{ background: '#F0EBE3' }}
                >
                  <Link size={14} strokeWidth={1.5} style={{ color: '#9E9890', flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="https://instagram.com/p/… veya URL yapıştırın"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="flex-1 outline-none bg-transparent"
                    style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#1A1714' }}
                  />
                </div>
                <p
                  className="text-center mb-3"
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#C8C0B8', letterSpacing: '0.08em' }}
                >
                  VEYA
                </p>
                <textarea
                  placeholder="Tarif metnini buraya yapıştırın — Instagram altyazısı, blog yazısı, herhangi bir şey…"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  rows={4}
                  className="w-full resize-none outline-none rounded-[14px] p-3"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    color: '#1A1714',
                    background: '#F0EBE3',
                    lineHeight: 1.6,
                  }}
                />
              </div>

              {/* Examples */}
              <div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#9E9890', textTransform: 'uppercase', marginBottom: 8 }}>
                  Desteklenen Kaynaklar
                </p>
                <div className="flex gap-2 flex-wrap">
                  {['Instagram', 'YouTube', 'Yemek.com', 'NefisYemekler', 'Herhangi bir web sitesi'].map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1.5 rounded-full"
                      style={{ background: '#F0EBE3', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B6560' }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={handleImport}
                disabled={!inputValue.trim()}
                className="w-full py-4 rounded-[16px] flex items-center justify-center gap-2 mt-2 transition-all active:scale-[0.98] disabled:opacity-40"
                style={{ background: '#F0B429' }}
              >
                <Sparkles size={16} strokeWidth={1.5} style={{ color: '#1A1714' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#1A1714' }}>
                  AI ile Ayrıştır
                </span>
              </button>
            </motion.div>
          )}

          {stage === 'parsing' && (
            <motion.div
              key="parsing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-5"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                className="w-16 h-16 rounded-full"
                style={{ border: '3px solid #E8E3DC', borderTopColor: '#F0B429' }}
              />
              <div className="text-center">
                <p
                  style={{
                    fontFamily: 'Fraunces, Georgia, serif',
                    fontSize: '22px',
                    fontWeight: 700,
                    color: '#1A1714',
                    letterSpacing: '-0.01em',
                  }}
                >
                  AI Ayrıştırıyor
                </p>
                <p className="mt-1.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9E9890' }}>
                  Malzemeler, adımlar ve meta bilgiler çıkarılıyor…
                </p>
              </div>
            </motion.div>
          )}

          {stage === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4"
            >
              {/* Preview card */}
              <div
                className="rounded-[20px] overflow-hidden"
                style={{ border: '1px solid #E8E3DC' }}
              >
                <div className="relative h-40">
                  <img src={MOCK_PARSED.image} alt={MOCK_PARSED.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(26,23,20,0.7))' }} />
                  <div
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(240,180,41,0.9)' }}
                  >
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '10px', color: '#1A1714' }}>
                      {MOCK_PARSED.source}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3
                      style={{
                        fontFamily: 'Fraunces, Georgia, serif',
                        fontSize: '22px',
                        fontWeight: 700,
                        color: '#FAF7F2',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {MOCK_PARSED.name}
                    </h3>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(250,247,242,0.65)' }}>
                      {MOCK_PARSED.cuisine}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-white">
                  <div className="flex gap-3 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} strokeWidth={1.5} style={{ color: '#9E9890' }} />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B6560' }}>{MOCK_PARSED.time} dk</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={12} strokeWidth={1.5} style={{ color: '#9E9890' }} />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B6560' }}>{MOCK_PARSED.servings} kişi</span>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{ background: '#F0EBE3', fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B6560' }}
                    >
                      {MOCK_PARSED.difficulty}
                    </span>
                  </div>

                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#9E9890', textTransform: 'uppercase', marginBottom: 8 }}>
                    Malzemeler ({MOCK_PARSED.ingredients.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {MOCK_PARSED.ingredients.map((ing) => (
                      <span
                        key={ing}
                        className="px-2.5 py-1 rounded-full"
                        style={{ background: '#F0EBE3', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#3D3530' }}
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pb-6">
                <button
                  onClick={() => setStage('input')}
                  className="flex-1 py-3.5 rounded-[16px] transition-all active:scale-[0.98]"
                  style={{ background: '#F0EBE3', border: '1px solid #E8E3DC' }}
                >
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#1A1714' }}>Yeniden Dene</span>
                </button>
                <button
                  onClick={handleSave}
                  className="flex-[2] py-3.5 rounded-[16px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  style={{ background: saved ? '#6B8F71' : '#F0B429' }}
                >
                  {saved ? (
                    <>
                      <Check size={16} strokeWidth={2.5} style={{ color: 'white' }} />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: 'white' }}>Kaydedildi!</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#1A1714' }}>Tariflere Ekle</span>
                      <ChevronRight size={16} strokeWidth={2.5} style={{ color: '#1A1714' }} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
