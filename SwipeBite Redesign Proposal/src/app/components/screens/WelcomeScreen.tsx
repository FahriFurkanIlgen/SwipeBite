import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Mail, ChevronRight } from 'lucide-react';

export function WelcomeScreen() {
  const navigate = useNavigate();
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState('');

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: '#1A1714' }}>
      {/* Hero food photo */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1647772809798-f34d785c981c?w=800&h=1200&fit=crop&auto=format"
          alt="Zengin Türk sofrası"
          className="w-full h-full object-cover"
          style={{ opacity: 0.75 }}
        />
        {/* Gradient scrim */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(26,23,20,0.1) 0%, rgba(26,23,20,0.2) 40%, rgba(26,23,20,0.85) 70%, rgba(26,23,20,0.98) 100%)',
          }}
        />
        {/* Film grain overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
            backgroundSize: '200px 200px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end px-6 pb-10">
        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-3"
        >
          <span
            className="text-[11px] tracking-[0.2em] uppercase"
            style={{ color: '#F0B429', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
          >
            Ev halkı için
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="mb-2"
        >
          <h1
            className="leading-none"
            style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: '62px',
              fontWeight: 700,
              color: '#FAF7F2',
              letterSpacing: '-0.03em',
            }}
          >
            Swipe
            <span style={{ color: '#F0B429' }}>Bite</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mb-8"
          style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: '22px',
            fontStyle: 'italic',
            fontWeight: 300,
            color: 'rgba(250,247,242,0.72)',
            letterSpacing: '-0.01em',
          }}
        >
          Kaydır. Eşleş. Pişir.
        </motion.p>

        {/* Auth surface */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.6 }}
          className="rounded-[24px] p-5"
          style={{
            background: 'rgba(250,247,242,0.07)',
            border: '1px solid rgba(250,247,242,0.12)',
            backdropFilter: 'none',
          }}
        >
          {!emailMode ? (
            <div className="flex flex-col gap-3">
              {/* Google */}
              <button
                onClick={() => navigate('/onboarding')}
                className="flex items-center justify-center gap-3 w-full py-3.5 rounded-[14px] transition-opacity active:opacity-80"
                style={{ background: '#FAF7F2' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#1A1714' }}>
                  Google ile devam et
                </span>
              </button>

              {/* Apple */}
              <button
                onClick={() => navigate('/onboarding')}
                className="flex items-center justify-center gap-3 w-full py-3.5 rounded-[14px] transition-opacity active:opacity-80"
                style={{ background: '#1A1714', border: '1px solid rgba(250,247,242,0.15)' }}
              >
                <svg width="16" height="18" viewBox="0 0 16 20" fill="white">
                  <path d="M13.23 10.56c-.02-2.18 1.79-3.23 1.87-3.28-1.02-1.49-2.6-1.69-3.16-1.72-1.35-.13-2.64.79-3.33.79-.68 0-1.74-.77-2.86-.75-1.47.02-2.83.86-3.59 2.17-1.53 2.66-.39 6.6 1.1 8.76.73 1.05 1.6 2.23 2.74 2.19 1.1-.05 1.52-.71 2.85-.71 1.33 0 1.71.71 2.88.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.19-2.4 1.21-2.47-.03-.01-2.32-.89-2.34-3.54z"/>
                  <path d="M11.1 3.65c.61-.73 1.02-1.75.91-2.77-.88.03-1.94.58-2.57 1.32-.57.65-1.06 1.69-.93 2.68.99.08 2-.5 2.59-1.23z"/>
                </svg>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#FAF7F2' }}>
                  Apple ile devam et
                </span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px" style={{ background: 'rgba(250,247,242,0.12)' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'rgba(250,247,242,0.4)', letterSpacing: '0.08em' }}>
                  VEYA
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(250,247,242,0.12)' }} />
              </div>

              {/* Email */}
              <button
                onClick={() => setEmailMode(true)}
                className="flex items-center justify-center gap-2.5 w-full py-3 rounded-[14px] transition-opacity active:opacity-80"
                style={{ border: '1px solid rgba(250,247,242,0.18)' }}
              >
                <Mail size={16} style={{ color: 'rgba(250,247,242,0.6)' }} strokeWidth={1.5} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', color: 'rgba(250,247,242,0.7)' }}>
                  E-posta ile giriş yap
                </span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button onClick={() => setEmailMode(false)} className="text-left mb-1">
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(250,247,242,0.5)' }}>
                  ← Geri
                </span>
              </button>
              <input
                type="email"
                placeholder="e-posta adresiniz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-3.5 px-4 rounded-[14px] outline-none"
                style={{
                  background: 'rgba(250,247,242,0.08)',
                  border: '1px solid rgba(250,247,242,0.15)',
                  color: '#FAF7F2',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                }}
              />
              <button
                onClick={() => navigate('/onboarding')}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[14px] transition-opacity active:opacity-80"
                style={{ background: '#F0B429' }}
              >
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#1A1714' }}>
                  Devam et
                </span>
                <ChevronRight size={16} style={{ color: '#1A1714' }} strokeWidth={2} />
              </button>
            </div>
          )}

          <p
            className="text-center mt-4"
            style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'rgba(250,247,242,0.3)', lineHeight: 1.5 }}
          >
            Devam ederek Kullanım Koşullarını ve Gizlilik Politikasını kabul etmiş olursunuz.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
