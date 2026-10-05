import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import LoginScreen from './components/LoginScreen';
import OnboardingScreen from './components/OnboardingScreen';
import DashboardScreen from './components/DashboardScreen';
import DiscoveryScreen from './components/DiscoveryScreen';
import { MyTeachingsScreen } from './components/MyTeachingsScreen';
import SplashScreen from './components/SplashScreen';
import { User } from './db';

type View = 'login' | 'onboarding' | 'dashboard' | 'discovery' | 'my-teachings';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState<View>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUserId = localStorage.getItem('skillshare_user_id');
    if (savedUserId) {
      fetch(`/api/users/${savedUserId}`)
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setCurrentUser(data.user);
            if (currentView === 'login') {
               setCurrentView('dashboard');
            }
          } else {
            localStorage.removeItem('skillshare_user_id');
          }
        })
        .catch(err => console.error('Failed to restore session:', err));
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    localStorage.setItem('skillshare_user_id', user.id);
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleUpdateUser = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('skillshare_user_id');
    setCurrentUser(null);
    setCurrentView('login');
  };

  return (
    <div className="min-h-screen relative">
      <AnimatePresence>
        {showSplash && (
          <SplashScreen onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>

      {/* Navigation Toggles - Floating fixed UI for demo purposes */}
      {!showSplash && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-black/80 backdrop-blur-md text-white p-2 rounded-full shadow-2xl flex gap-1 border border-white/10"
        >
          {!currentUser ? (
            <>
              <button 
                onClick={() => setCurrentView('login')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${currentView === 'login' ? 'bg-white text-black' : 'hover:bg-white/10'}`}
              >
                Login
              </button>
              <button 
                onClick={() => setCurrentView('onboarding')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${currentView === 'onboarding' ? 'bg-white text-black' : 'hover:bg-white/10'}`}
              >
                Onboarding
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setCurrentView('dashboard')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${currentView === 'dashboard' ? 'bg-white text-black' : 'hover:bg-white/10'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setCurrentView('discovery')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${currentView === 'discovery' ? 'bg-white text-black' : 'hover:bg-white/10'}`}
              >
                Discovery
              </button>
              <button 
                onClick={() => setCurrentView('my-teachings')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${currentView === 'my-teachings' ? 'bg-white text-black' : 'hover:bg-white/10'}`}
              >
                My Teachings
              </button>
            </>
          )}
        </motion.div>
      )}

      {/* View Rendering */}
      {!showSplash && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="h-full"
        >
          {currentView === 'login' && (
            <LoginScreen 
              onNavigate={setCurrentView} 
              onLoginSuccess={handleLoginSuccess}
            />
          )}
          {currentView === 'onboarding' && (
            <OnboardingScreen 
              onNavigate={setCurrentView} 
              onRegisterSuccess={handleLoginSuccess}
            />
          )}
          {currentView === 'dashboard' && (
            <DashboardScreen 
              onNavigate={setCurrentView} 
              user={currentUser}
              onLogout={handleLogout}
              onUpdateUser={handleUpdateUser}
            />
          )}
          {currentView === 'discovery' && (
            <DiscoveryScreen 
              onNavigate={setCurrentView} 
              user={currentUser}
              onLogout={handleLogout}
            />
          )}
          {currentView === 'my-teachings' && currentUser && (
            <MyTeachingsScreen 
              user={currentUser}
            />
          )}
        </motion.div>
      )}
    </div>
  );
}
