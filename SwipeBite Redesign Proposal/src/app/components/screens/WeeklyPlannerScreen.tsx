import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { RefreshCw, ShoppingCart, Plus, Clock } from 'lucide-react';
import { WEEKLY_PLAN, RECIPES } from '../../data/recipes';

const MODES = [
  { id: 'yogun', label: 'Yoğun', emoji: '⚡' },
  { id: 'saglikli', label: 'Sağlıklı', emoji: '🥗' },
  { id: 'ekonomik', label: 'Ekonomik', emoji: '💰' },
  { id: 'konfor', label: 'Konfor', emoji: '🍲' },
  { id: 'cocuk', label: 'Çocuk Dostu', emoji: '👨‍👩‍👧' },
];

const SHOPPING_ITEMS = [
  { name: 'Limon', category: 'Meyve-Sebze', needed: true },
  { name: 'Krema', category: 'Süt Ürünleri', needed: true },
  { name: 'Parmesan', category: 'Peynir', needed: true },
  { name: 'Mozzarella', category: 'Peynir', needed: true },
  { name: 'Somon fileto', category: 'Et & Balık', needed: true },
];

export function WeeklyPlannerScreen() {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState('konfor');
  const [showShopping, setShowShopping] = useState(false);

  const today = new Date().getDay();

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
          Haftalık Plan
        </p>
        <h1
          style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: '30px',
            fontWeight: 700,
            color: '#1A1714',
            letterSpacing: '-0.02em',
          }}
        >
          Bu Hafta
        </h1>
      </div>

      {/* Mode pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {MODES.map((m) => {
          const isActive = m.id === activeMode;
          return (
            <button
              key={m.id}
              onClick={() => setActiveMode(m.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-all active:scale-95"
              style={{
                background: isActive ? '#1A1714' : '#F0EBE3',
                border: `1px solid ${isActive ? '#1A1714' : '#E8E3DC'}`,
              }}
            >
              <span style={{ fontSize: '13px' }}>{m.emoji}</span>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#FAF7F2' : '#6B6560',
                  whiteSpace: 'nowrap',
                }}
              >
                {m.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Week board */}
      <div className="flex flex-col gap-2.5 mb-6">
        {WEEKLY_PLAN.map((day, idx) => {
          const isToday = idx === 0;
          const hasRecipes = day.recipes.length > 0;
          const recipe = RECIPES.find((r) => r.name === day.recipes[0]);

          return (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-[18px] overflow-hidden"
              style={{
                background: '#FFFFFF',
                border: `1.5px solid ${isToday ? '#F0B429' : '#E8E3DC'}`,
              }}
            >
              <div className="flex items-stretch">
                {/* Day column */}
                <div
                  className="flex flex-col items-center justify-center px-3 py-3 flex-shrink-0"
                  style={{
                    background: isToday ? '#F0B429' : '#FAF7F2',
                    minWidth: 52,
                    borderRight: `1px solid ${isToday ? 'rgba(255,255,255,0.3)' : '#E8E3DC'}`,
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '10px',
                      fontWeight: 600,
                      color: isToday ? '#1A1714' : '#9E9890',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {day.day}
                  </p>
                  <p
                    style={{
                      fontFamily: 'Fraunces, Georgia, serif',
                      fontSize: '22px',
                      fontWeight: 700,
                      color: isToday ? '#1A1714' : '#3D3530',
                      lineHeight: 1.1,
                    }}
                  >
                    {day.date}
                  </p>
                </div>

                {/* Content */}
                <div className="flex-1 flex items-center px-3.5 py-3">
                  {hasRecipes && recipe ? (
                    <button
                      onClick={() => navigate(`/recipe/${recipe.id}`)}
                      className="flex items-center gap-3 w-full text-left"
                    >
                      <img
                        src={recipe.image}
                        alt={recipe.name}
                        className="w-10 h-10 rounded-[10px] object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#1A1714' }}>
                          {recipe.name}
                        </p>
                        {day.recipes[1] && (
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9E9890', marginTop: 1 }}>
                            + {day.recipes[1]}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          <Clock size={9} strokeWidth={1.5} style={{ color: '#9E9890' }} />
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9E9890' }}>
                            {recipe.time} dk
                          </span>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 w-full">
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#C8C0B8', flex: 1 }}>
                        Planlanmadı
                      </p>
                      <button
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: '#F0EBE3' }}
                        onClick={() => navigate('/swipe')}
                      >
                        <Plus size={14} strokeWidth={2} style={{ color: '#9E9890' }} />
                      </button>
                    </div>
                  )}

                  {hasRecipes && (
                    <button
                      className="ml-2 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: '#F0EBE3' }}
                    >
                      <RefreshCw size={12} strokeWidth={1.5} style={{ color: '#9E9890' }} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Market listesi */}
      <div className="mb-4">
        <button
          onClick={() => setShowShopping(!showShopping)}
          className="w-full rounded-[18px] p-4 flex items-center gap-3 transition-all active:scale-[0.98] text-left"
          style={{ background: '#FFFFFF', border: '1px solid #E8E3DC' }}
        >
          <div
            className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
            style={{ background: '#F0B429' }}
          >
            <ShoppingCart size={18} strokeWidth={1.5} style={{ color: '#1A1714' }} />
          </div>
          <div className="flex-1">
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#1A1714' }}>
              Market Listesi
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9E9890' }}>
              {SHOPPING_ITEMS.length} ürün eksik
            </p>
          </div>
          <motion.div animate={{ rotate: showShopping ? 180 : 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="#9E9890" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        </button>

        {showShopping && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 rounded-[16px] overflow-hidden"
            style={{ background: '#FFFFFF', border: '1px solid #E8E3DC' }}
          >
            {SHOPPING_ITEMS.map((item, i) => (
              <div
                key={item.name}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderTop: i > 0 ? '1px solid #F0EBE3' : 'none' }}
              >
                <div className="w-5 h-5 rounded-[5px] flex-shrink-0" style={{ border: '1.5px solid #E8E3DC' }} />
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#1A1714', flex: 1 }}>{item.name}</p>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9E9890' }}>{item.category}</span>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      <div style={{ height: 8 }} />
    </div>
  );
}
