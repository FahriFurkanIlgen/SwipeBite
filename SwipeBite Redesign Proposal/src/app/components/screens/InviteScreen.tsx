import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Copy, QrCode, Share2, Check } from 'lucide-react';

const INVITE_CODE = 'SWBYT-7K4F';
const INVITE_URL = 'swipebite.app/join/SWBYT-7K4F';

export function InviteScreen() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  function handleCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-12 pb-6 flex items-center gap-3">
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
              fontSize: '24px',
              fontWeight: 700,
              color: '#1A1714',
              letterSpacing: '-0.02em',
            }}
          >
            Davet Et
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9E9890', marginTop: 1 }}>
            Yılmaz Evi'ne katılım daveti
          </p>
        </div>
      </div>

      <div className="flex-1 px-5 flex flex-col gap-5">
        {/* Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }}
          className="rounded-[24px] overflow-hidden relative"
          style={{ height: 180 }}
        >
          <img
            src="https://images.unsplash.com/photo-1623065608901-d973ed87284e?w=800&h=400&fit=crop&auto=format"
            alt="Aile sofrası"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(26,23,20,0.6), rgba(26,23,20,0.2))' }}
          />
          <div className="absolute inset-0 p-5 flex flex-col justify-end">
            <p
              style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontStyle: 'italic',
                fontSize: '20px',
                fontWeight: 400,
                color: '#FAF7F2',
                lineHeight: 1.3,
              }}
            >
              "Birlikte kaydırın,<br />birlikte yiyin."
            </p>
          </div>
        </motion.div>

        {/* Invite code */}
        <div
          className="rounded-[20px] p-5"
          style={{ background: '#FFFFFF', border: '1px solid #E8E3DC' }}
        >
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: '#9E9890', textTransform: 'uppercase', marginBottom: 12 }}>
            Davet Kodu
          </p>

          <div
            className="flex items-center justify-between p-4 rounded-[14px] mb-3"
            style={{ background: '#FAF7F2', border: '1px dashed #C8C0B8' }}
          >
            <span
              style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: '28px',
                fontWeight: 700,
                color: '#1A1714',
                letterSpacing: '0.08em',
              }}
            >
              {INVITE_CODE}
            </span>
            <button
              onClick={handleCopy}
              className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-all active:scale-90"
              style={{ background: copied ? '#6B8F71' : '#F0B429' }}
            >
              {copied ? (
                <Check size={16} strokeWidth={2.5} style={{ color: 'white' }} />
              ) : (
                <Copy size={15} strokeWidth={2} style={{ color: '#1A1714' }} />
              )}
            </button>
          </div>

          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9E9890', lineHeight: 1.5 }}>
            Kodu arkadaşınıza gönderin ya da aşağıdaki bağlantıyı paylaşın.
          </p>
        </div>

        {/* Share options */}
        <div className="flex flex-col gap-3">
          <button
            className="flex items-center gap-4 p-4 rounded-[18px] text-left transition-all active:scale-[0.98]"
            style={{ background: '#1A1714' }}
          >
            <div
              className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
              style={{ background: '#F0B429' }}
            >
              <Share2 size={18} strokeWidth={1.5} style={{ color: '#1A1714' }} />
            </div>
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#FAF7F2' }}>
                Bağlantıyı Paylaş
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'rgba(250,247,242,0.5)' }}>
                {INVITE_URL}
              </p>
            </div>
          </button>

          <button
            onClick={() => setShowQR(!showQR)}
            className="flex items-center gap-4 p-4 rounded-[18px] text-left transition-all active:scale-[0.98]"
            style={{ background: '#F0EBE3', border: '1px solid #E8E3DC' }}
          >
            <div
              className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
              style={{ background: '#FFFFFF' }}
            >
              <QrCode size={18} strokeWidth={1.5} style={{ color: '#6B6560' }} />
            </div>
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#1A1714' }}>
                QR Kod Göster
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9E9890' }}>
                Yanındakileri anında davet et
              </p>
            </div>
          </button>
        </div>

        {showQR && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[20px] p-6 flex flex-col items-center gap-3"
            style={{ background: '#FFFFFF', border: '1px solid #E8E3DC' }}
          >
            {/* Mock QR code */}
            <div
              className="w-40 h-40 rounded-[12px] flex items-center justify-center"
              style={{ background: '#1A1714' }}
            >
              <div className="grid grid-cols-7 gap-[3px] p-2">
                {Array.from({ length: 49 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[14px] h-[14px] rounded-[1px]"
                    style={{
                      background: Math.random() > 0.4 ? '#FAF7F2' : 'transparent',
                    }}
                  />
                ))}
              </div>
            </div>
            <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '18px', fontWeight: 700, color: '#1A1714', letterSpacing: '0.06em' }}>
              {INVITE_CODE}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9E9890', textAlign: 'center' }}>
              Kamerayı koda doğrultun
            </p>
          </motion.div>
        )}

        {/* Benefits */}
        <div
          className="rounded-[18px] p-4"
          style={{ background: '#FFF8E7', border: '1px solid rgba(240,180,41,0.3)' }}
        >
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8A6800', lineHeight: 1.6 }}>
            ✨ Davet ettiğiniz kişi tercihlerini eklediğinde, AI her ikinizin zevkine göre kişiselleştirilmiş öneriler sunar.
          </p>
        </div>
      </div>
    </div>
  );
}
