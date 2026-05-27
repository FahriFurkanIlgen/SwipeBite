import { useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, Users, Flame, ChevronRight, Check, Package, Sparkles } from 'lucide-react';
import { RECIPES } from '../../data/recipes';

export function RecipeDetailScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const recipe = RECIPES.find((r) => r.id === id) ?? RECIPES[0];

  const difficultyColor = recipe.difficulty === 'Kolay' ? '#6B8F71' : recipe.difficulty === 'Orta' ? '#F0B429' : '#E07A5F';

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Hero */}
      <div className="relative flex-shrink-0" style={{ height: 280 }}>
        <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(26,23,20,0.1) 50%, rgba(26,23,20,0.75) 100%)' }}
        />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-12 left-5 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(26,23,20,0.4)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          <ArrowLeft size={16} strokeWidth={2} style={{ color: 'white' }} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex flex-wrap gap-2 mb-2">
            {recipe.tags.map((t) => (
              <span
                key={t}
                className="px-2.5 py-0.5 rounded-full"
                style={{ background: 'rgba(250,247,242,0.15)', border: '1px solid rgba(250,247,242,0.2)', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#FAF7F2', letterSpacing: '0.06em' }}
              >
                {t}
              </span>
            ))}
          </div>
          <h1
            style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: '34px',
              fontWeight: 700,
              color: '#FAF7F2',
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
            }}
          >
            {recipe.name}
          </h1>
          <p className="mt-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'rgba(250,247,242,0.65)' }}>
            {recipe.cuisine}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-5" style={{ scrollbarWidth: 'none' }}>
        {/* Meta */}
        <div className="grid grid-cols-4 gap-2.5 mb-5">
          {[
            { label: 'Süre', value: `${recipe.time}dk`, icon: Clock },
            { label: 'Kişi', value: `${recipe.servings} kişi`, icon: Users },
            { label: 'Zorluk', value: recipe.difficulty, icon: Flame, color: difficultyColor },
            { label: 'Kalori', value: `${recipe.calories}`, icon: Sparkles },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-[14px] p-3 flex flex-col items-center gap-1.5"
              style={{ background: '#FFFFFF', border: '1px solid #E8E3DC' }}
            >
              <Icon size={14} strokeWidth={1.5} style={{ color: color ?? '#9E9890' }} />
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: color ?? '#1A1714' }}>
                {value}
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#9E9890', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Kiler uyumu */}
        <div
          className="rounded-[18px] p-4 mb-5 flex items-center gap-3"
          style={{ background: '#FFF8E7', border: '1px solid rgba(240,180,41,0.3)' }}
        >
          <div
            className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
            style={{ background: '#F0B429' }}
          >
            <Package size={18} strokeWidth={1.5} style={{ color: '#1A1714' }} />
          </div>
          <div className="flex-1">
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#1A1714' }}>
              %{recipe.pantryMatch} Kiler Uyumu
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#8A6800', marginTop: 1 }}>
              {recipe.ingredients.filter(i => !i.inPantry).length} malzeme eksik
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="w-12 h-12">
              <svg viewBox="0 0 44 44" fill="none">
                <circle cx="22" cy="22" r="18" stroke="#E8E3DC" strokeWidth="4" />
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  stroke="#F0B429"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 18}`}
                  strokeDashoffset={`${2 * Math.PI * 18 * (1 - recipe.pantryMatch / 100)}`}
                  transform="rotate(-90 22 22)"
                />
                <text x="22" y="26" textAnchor="middle" style={{ fontFamily: 'Inter', fontSize: '10px', fontWeight: 700, fill: '#1A1714' }}>
                  {recipe.pantryMatch}%
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <div className="mb-5">
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: '#9E9890', textTransform: 'uppercase', marginBottom: 12 }}>
            Malzemeler — {recipe.servings} kişilik
          </p>
          <div className="flex flex-col gap-2">
            {recipe.ingredients.map((ing) => (
              <div
                key={ing.name}
                className="flex items-center gap-3 p-3 rounded-[14px]"
                style={{ background: ing.inPantry ? '#F5FDF5' : '#FFFFFF', border: `1px solid ${ing.inPantry ? 'rgba(107,143,113,0.25)' : '#E8E3DC'}` }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: ing.inPantry ? '#6B8F71' : '#E8E3DC' }}
                >
                  {ing.inPantry ? (
                    <Check size={12} strokeWidth={2.5} style={{ color: 'white' }} />
                  ) : (
                    <div className="w-2 h-2 rounded-full" style={{ background: '#9E9890' }} />
                  )}
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#1A1714', flex: 1 }}>
                  {ing.name}
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9E9890' }}>
                  {ing.amount}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Steps preview */}
        <div className="mb-5">
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: '#9E9890', textTransform: 'uppercase', marginBottom: 12 }}>
            Hazırlanış — {recipe.steps.length} adım
          </p>
          <div className="flex flex-col gap-3">
            {recipe.steps.map((step) => (
              <div key={step.step} className="flex gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: '#F0EBE3' }}
                >
                  <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '12px', fontWeight: 700, color: '#6B6560' }}>
                    {step.step}
                  </span>
                </div>
                <div className="flex-1 pb-3" style={{ borderBottom: step.step < recipe.steps.length ? '1px solid #E8E3DC' : 'none' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#3D3530', lineHeight: 1.6 }}>
                    {step.description}
                  </p>
                  {step.duration && (
                    <p className="mt-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9E9890' }}>
                      <Clock size={9} style={{ display: 'inline', marginRight: 3 }} strokeWidth={1.5} />
                      {step.duration} dakika
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI adapt */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="rounded-[18px] p-4 mb-5 flex items-center gap-3 cursor-pointer"
          style={{ background: '#F0EBE3', border: '1px solid #E8E3DC' }}
        >
          <div
            className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
            style={{ background: '#1A1714' }}
          >
            <Sparkles size={16} strokeWidth={1.5} style={{ color: '#F0B429' }} />
          </div>
          <div className="flex-1">
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#1A1714' }}>AI bana göre uyarla</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B6560' }}>Alerji, kiler ve tercihlerinize göre</p>
          </div>
          <ChevronRight size={16} strokeWidth={1.5} style={{ color: '#9E9890' }} />
        </motion.div>

        {/* CTA */}
        <button
          onClick={() => navigate(`/cook/${recipe.id}`)}
          className="w-full py-4 rounded-[18px] flex items-center justify-center gap-2 mb-8 transition-all active:scale-[0.98]"
          style={{ background: '#F0B429' }}
        >
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#1A1714' }}>
            Pişirmeye Başla
          </span>
          <ChevronRight size={18} strokeWidth={2.5} style={{ color: '#1A1714' }} />
        </button>
      </div>
    </div>
  );
}
