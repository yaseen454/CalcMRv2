import React from 'react';
import { useAuth } from '../lib/AuthProvider';
import { LogIn, LogOut, Github, Calculator } from 'lucide-react';
import { m } from 'motion/react';

export function Navigation() {
  const { user, signInWithGoogle, logout, authError } = useAuth();

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Calculator className="h-6 w-6 text-warframe-blue" />
            <span className="font-display font-bold text-xl text-warframe-gold tracking-widest hidden sm:inline-block">CALCMR</span>
          </div>

          <div className="flex items-center space-x-6">
            <a 
              href="https://github.com/yaseen454/CalcMRv2" 
              target="_blank" 
              rel="noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              title="GitHub Repository"
            >
              <Github className="h-5 w-5" />
            </a>

            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-sm font-medium text-white">{user.displayName}</span>
                  <span className="text-xs text-gray-400">Authenticated</span>
                </div>
                {user.photoURL && (
                  <img src={user.photoURL} alt="Avatar" className="h-8 w-8 rounded-full border border-warframe-gold/50" referrerPolicy="no-referrer" />
                )}
                <button 
                  onClick={logout}
                  className="flex items-center space-x-2 text-sm text-red-400 hover:text-red-300 transition-colors bg-red-400/10 hover:bg-red-400/20 px-3 py-1.5 rounded-md cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline-block">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-end relative">
                <button 
                  onClick={signInWithGoogle}
                  className="flex items-center space-x-2 text-sm text-warframe-blue hover:text-warframe-blue/80 transition-colors bg-warframe-blue/10 hover:bg-warframe-blue/20 px-4 py-2 rounded-md font-medium cursor-pointer"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign in with Google</span>
                </button>
                {authError && (
                  <div className="absolute top-12 right-0 bg-red-950/90 text-red-300 text-xs px-3 py-2 rounded-md border border-red-500/30 w-72 text-left shadow-2xl z-50">
                    <p className="font-semibold text-red-400 mb-0.5">Authentication Issue</p>
                    <p className="leading-normal">{authError}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
