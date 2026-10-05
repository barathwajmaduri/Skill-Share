import React, { useState } from 'react';
import { User } from '../db';
import CrowdAnimation from './CrowdAnimation';
import { GraduationCap, ArrowRight } from 'lucide-react';

interface LoginScreenProps {
  onNavigate: (view: 'login' | 'onboarding' | 'dashboard' | 'discovery') => void;
  onLoginSuccess: (user: User) => void;
}

export default function LoginScreen({ onNavigate, onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === 'true') {
      setSuccessMessage('Email verified successfully! You can now log in.');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    // Basic Validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error('Failed to parse JSON:', text);
        throw new Error('Server returned an invalid response');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Unable to connect to the server. Please check your internet connection.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-jakarta bg-earthy-cream text-earthy-dark overflow-x-hidden min-h-screen relative">
      {/* Animated Background for the whole page */}
      <div className="absolute inset-0 z-0">
        <CrowdAnimation />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] min-h-screen relative z-10">
        {/* Left Side - Hero */}
        <div className="relative hidden lg:flex flex-col justify-end p-12 overflow-hidden bg-earthy-rust/10 backdrop-blur-[2px]">
          <div className="absolute inset-0 bg-gradient-to-t from-earthy-dark/90 via-earthy-dark/20 to-transparent pointer-events-none z-10"></div>
          
          <div className="relative z-20 max-w-xl">
            <h1 className="text-earthy-cream font-fraunces text-6xl leading-[1.1] mb-6 drop-shadow-sm">
              Welcome Back.
            </h1>
            <p className="text-earthy-cream/80 text-xl font-medium max-w-md leading-relaxed drop-shadow-sm">
              Your learners and mentors are waiting. Dive back in to continue your skill sharing journey.
            </p>
            <div className="mt-12 flex gap-4 items-center">
              <div className="flex -space-x-3">
                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="User" className="w-10 h-10 rounded-full border-2 border-earthy-dark object-cover" referrerPolicy="no-referrer" />
                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" className="w-10 h-10 rounded-full border-2 border-earthy-dark object-cover" referrerPolicy="no-referrer" />
                <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="User" className="w-10 h-10 rounded-full border-2 border-earthy-dark object-cover" referrerPolicy="no-referrer" />
              </div>
              <p className="text-earthy-cream/90 text-sm font-bold">Join 2,000+ members today</p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <main className="flex items-center justify-center p-6 sm:p-12 lg:p-20 bg-white/90 backdrop-blur-xl relative z-20 shadow-2xl border-l border-white/20">
          <div className="w-full max-w-md">
            <div className="mb-10 flex justify-between items-center">
              <div className="flex items-center gap-2 text-earthy-dark">
                <GraduationCap className="w-6 h-6" />
                <span className="font-fraunces font-black text-xl tracking-tight">SkillShare</span>
              </div>
              <a 
                className="text-sm font-semibold text-earthy-green hover:text-earthy-dark transition-colors cursor-pointer" 
                onClick={() => onNavigate('onboarding')}
              >
                Sign Up
              </a>
            </div>
            
            <div className="mb-8">
              <h2 className="font-fraunces text-3xl text-earthy-dark mb-2">Log in to your account</h2>
              <p className="text-slate-500 font-medium">Enter your details to access your dashboard.</p>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              {successMessage && (
                <div className="p-3 bg-earthy-green/10 border border-earthy-green/20 text-earthy-green rounded-xl text-sm font-bold text-center">
                  {successMessage}
                </div>
              )}
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold text-center">
                  {error}
                </div>
              )}

              <label className="block">
                <span className="block text-sm font-bold text-earthy-dark mb-2">Email Address</span>
                <input 
                  className="w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-earthy-green focus:ring-1 focus:ring-earthy-green transition-all placeholder:text-slate-400 outline-none border" 
                  placeholder="alex@example.com" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label className="block">
                <span className="block text-sm font-bold text-earthy-dark mb-2">Password</span>
                <input 
                  className="w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-earthy-green focus:ring-1 focus:ring-earthy-green transition-all placeholder:text-slate-400 outline-none border" 
                  placeholder="••••••••" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-earthy-green focus:ring-earthy-green" />
                  <span className="text-sm text-slate-600 group-hover:text-earthy-dark transition-colors">Remember me</span>
                </label>
                <a className="text-sm font-bold text-earthy-green hover:text-earthy-dark transition-colors cursor-pointer">
                  Forgot password?
                </a>
              </div>

              <div className="pt-4">
                <button 
                  className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-earthy-dark text-white rounded-xl font-bold hover:bg-black transition-all group disabled:opacity-70 disabled:cursor-not-allowed" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Logging In...' : 'Log In'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
