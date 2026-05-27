import { MemoryRouter, Routes, Route, Outlet } from 'react-router';
import { FloatingTabBar } from './components/FloatingTabBar';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { OnboardingScreen } from './components/screens/OnboardingScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { SwipeTab } from './components/screens/SwipeTab';
import { SwipeSessionScreen } from './components/screens/SwipeSessionScreen';
import { MatchResultScreen } from './components/screens/MatchResultScreen';
import { RecipeDetailScreen } from './components/screens/RecipeDetailScreen';
import { CookModeScreen } from './components/screens/CookModeScreen';
import { WeeklyPlannerScreen } from './components/screens/WeeklyPlannerScreen';
import { PantryScreen } from './components/screens/PantryScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { ImportScreen } from './components/screens/ImportScreen';
import { InviteScreen } from './components/screens/InviteScreen';

function TabLayout() {
  return (
    <div className="relative h-full bg-background">
      <div
        className="h-full overflow-y-auto"
        style={{ paddingBottom: '7rem', scrollbarWidth: 'none' }}
      >
        <Outlet />
      </div>
      <FloatingTabBar />
    </div>
  );
}

export default function App() {
  /* MARKER-MAKE-KIT-INVOKED */
  return (
    <div
      className="w-screen h-screen flex items-center justify-center overflow-hidden"
      style={{ background: '#2C2520' }}
    >
      <div
        className="relative overflow-hidden bg-background"
        style={{
          width: 'min(390px, 100vw)',
          height: 'min(844px, 100svh)',
          borderRadius: 'clamp(0px, (100vw - 390px + 1px) * 999, 40px)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        <MemoryRouter initialEntries={['/welcome']}>
          <Routes>
            <Route path="/welcome" element={<WelcomeScreen />} />
            <Route path="/onboarding" element={<OnboardingScreen />} />
            <Route element={<TabLayout />}>
              <Route path="/home" element={<HomeScreen />} />
              <Route path="/swipe" element={<SwipeTab />} />
              <Route path="/planner" element={<WeeklyPlannerScreen />} />
              <Route path="/pantry" element={<PantryScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
            </Route>
            <Route path="/session/:id" element={<SwipeSessionScreen />} />
            <Route path="/match/:id" element={<MatchResultScreen />} />
            <Route path="/recipe/:id" element={<RecipeDetailScreen />} />
            <Route path="/cook/:id" element={<CookModeScreen />} />
            <Route path="/import" element={<ImportScreen />} />
            <Route path="/invite" element={<InviteScreen />} />
          </Routes>
        </MemoryRouter>
      </div>
    </div>
  );
}
