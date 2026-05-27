import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Sparkles, ChevronRight, Package, Search } from 'lucide-react';
import { PANTRY_ITEMS } from '../../data/recipes';

type PantryData = Record<string, string[]>;

export function PantryScreen() {
  const navigate = useNavigate();
  const [pantry, setPantry] = useState<PantryData>(PANTRY_ITEMS);
  const [inputText, setInputText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Tümü');

  const categories = ['Tümü', ...Object.keys(pantry)];
  const allItems = Object.entries(pantry).flatMap(([cat, items]) => items.map((item) => ({ item, cat })));
  const filteredItems = activeCategory === 'Tümü'
    ? allItems
    : allItems.filter(({ cat }) => cat === activeCategory);

  function removeItem(cat: string, item: string) {
    setPantry((prev) => ({
      ...prev,
      [cat]: prev[cat].filter((i) => i !== item),
    }));
  }

  async function handleParse() {
    if (!inputText.trim()) return;
    setParsing(true);
    await new Promise((r) => setTimeout(r, 1200));

    const items = inputText
      .split(/[,،\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (items.length > 0) {
      setPantry((prev) => ({
        ...prev,
        'Diğer': [...(prev['Diğer'] ?? []), ...items],
      }));
    }
    setInputText('');
    setParsing(false);
  }

  const totalCount = allItems.length;

  return (
    <div className="min-h-full bg-background px-5 pt-14">
      {/* Header */}
      <div className="mb-6">
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
          Kilerim
        </p>
        <div className="flex items-end justify-between">
          <h1
            style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: '30px',
              fontWeight: 700,
              color: '#1A1714',
              letterSpacing: '-0.02em',
            }}
          >
            Ne var<br />kilerde?
          </h1>
          <div
            className="mb-1 px-3 py-1.5 rounded-full"
            style={{ background: '#F0EBE3' }}
          >
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#6B6560' }}>
              {totalCount} malzeme
            </span>
          </div>
        </div>
      </div>

      {/* Input */}
      <div
        className="rounded-[20px] p-4 mb-5"
        style={{ background: '#FFFFFF', border: '1px solid #E8E3DC' }}
      >
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#9E9890', textTransform: 'uppercase', marginBottom: 10 }}>
          Malzeme Ekle
        </p>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Yazdığınız metin veya liste — AI otomatik kategoriler (örn: 500g tavuk, 3 domates, süt, yumurta)"
          rows={3}
          className="w-full resize-none outline-none rounded-[12px] p-3"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: '#1A1714',
            background: '#F0EBE3',
            border: '1px solid transparent',
          }}
        />
        <button
          onClick={handleParse}
          disabled={!inputText.trim() || parsing}
          className="w-full mt-3 py-3 rounded-[14px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: parsing ? '#EDE8E1' : '#1A1714' }}
        >
          {parsing ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              >
                <Sparkles size={15} strokeWidth={1.5} style={{ color: '#F0B429' }} />
              </motion.div>
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#6B6560' }}>
                AI Ayrıştırıyor…
              </span>
            </>
          ) : (
            <>
              <Sparkles size={15} strokeWidth={1.5} style={{ color: '#F0B429' }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#FAF7F2' }}>
                AI ile Ekle
              </span>
            </>
          )}
        </button>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {categories.map((cat) => {
          const isActive = cat === activeCategory;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full transition-all active:scale-95"
              style={{
                background: isActive ? '#1A1714' : '#F0EBE3',
                border: `1px solid ${isActive ? '#1A1714' : '#E8E3DC'}`,
              }}
            >
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#FAF7F2' : '#6B6560',
                }}
              >
                {cat}
              </span>
            </button>
          );
        })}
      </div>

      {/* Items — categorized chips */}
      <div className="mb-5">
        {activeCategory === 'Tümü' ? (
          Object.entries(pantry).map(([cat, items]) =>
            items.length > 0 ? (
              <div key={cat} className="mb-4">
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    color: '#9E9890',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                >
                  {cat}
                </p>
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.div
                        key={item}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                        style={{ background: '#FFFFFF', border: '1px solid #E8E3DC' }}
                      >
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#1A1714' }}>
                          {item}
                        </span>
                        <button
                          onClick={() => removeItem(cat, item)}
                          className="w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: '#EDE8E1' }}
                        >
                          <X size={8} strokeWidth={2.5} style={{ color: '#6B6560' }} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <button
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full"
                    style={{ border: '1px dashed #C8C0B8' }}
                  >
                    <Plus size={11} strokeWidth={2} style={{ color: '#9E9890' }} />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9E9890' }}>Ekle</span>
                  </button>
                </div>
              </div>
            ) : null
          )
        ) : (
          <div className="flex flex-wrap gap-2">
            {filteredItems.map(({ item, cat }) => (
              <motion.div
                key={item}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: '#FFFFFF', border: '1px solid #E8E3DC' }}
              >
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#1A1714' }}>{item}</span>
                <button
                  onClick={() => removeItem(cat, item)}
                  className="w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: '#EDE8E1' }}
                >
                  <X size={8} strokeWidth={2.5} style={{ color: '#6B6560' }} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* AI CTA */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/session/new')}
        className="w-full rounded-[20px] p-5 mb-4 text-left"
        style={{ background: '#1A1714' }}
      >
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: '#F0B429', textTransform: 'uppercase', marginBottom: 6 }}>
          AI Önerisi
        </p>
        <h3
          style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: '20px',
            fontWeight: 700,
            color: '#FAF7F2',
            letterSpacing: '-0.01em',
            marginBottom: 4,
          }}
        >
          Bunlarla ne yapsam?
        </h3>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'rgba(250,247,242,0.6)', marginBottom: 14 }}>
          Kilerdeki {totalCount} malzemeyle yapılabilecek tarifleri bul
        </p>
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#F0B429' }}>
            Tarif Önerisi Al
          </span>
          <ChevronRight size={14} strokeWidth={2.5} style={{ color: '#F0B429' }} />
        </div>
      </motion.button>

      <div style={{ height: 8 }} />
    </div>
  );
}
