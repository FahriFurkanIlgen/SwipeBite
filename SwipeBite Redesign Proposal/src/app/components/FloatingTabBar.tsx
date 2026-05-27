import { useNavigate, useLocation } from 'react-router';
import { Home, Layers, CalendarDays, Package, User } from 'lucide-react';
import { motion } from 'motion/react';

const TABS = [
  { path: '/home', icon: Home, label: 'Ana Sayfa' },
  { path: '/swipe', icon: Layers, label: 'Eşleş' },
  { path: '/planner', icon: CalendarDays, label: 'Hafta' },
  { path: '/pantry', icon: Package, label: 'Kiler' },
  { path: '/profile', icon: User, label: 'Profil' },
];

export function FloatingTabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="absolute bottom-4 left-3 right-3 z-50">
      <div
        className="flex items-center justify-around rounded-[22px] px-2 py-2"
        style={{
          background: '#FFFFFF',
          boxShadow: '0 4px 24px rgba(26,23,20,0.12), 0 0 0 1px rgba(232,227,220,0.8)',
        }}
      >
        {TABS.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center gap-0.5 min-w-[56px] py-1"
              style={{ minHeight: 44 }}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-[14px]"
                  style={{ background: '#FAF7F2', border: '1px solid #E8E3DC' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2 : 1.5}
                  style={{ color: isActive ? '#F0B429' : '#9E9890' }}
                />
                <span
                  className="text-[10px] leading-none font-medium tracking-wide"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    color: isActive ? '#1A1714' : '#9E9890',
                  }}
                >
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
