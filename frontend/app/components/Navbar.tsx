'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-xl font-bold gradient-text">MindCubes</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/#features" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Features
            </Link>
            <Link href="/agents" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Agents
            </Link>
            <Link href="/models" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Models
            </Link>
            <Link href="/chat" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Chat
            </Link>
            <Link href="/tasks" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Tasks
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Login
            </Link>
            <Link href="/register" className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-lg hover:from-indigo-700 hover:to-cyan-700 transition-all shadow-lg shadow-indigo-500/30">
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800">
          <div className="px-4 py-4 space-y-3">
            <Link href="/#features" className="block text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
              Features
            </Link>
            <Link href="/agents" className="block text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
              Agents
            </Link>
            <Link href="/models" className="block text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
              Models
            </Link>
            <Link href="/chat" className="block text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
              Chat
            </Link>
            <Link href="/tasks" className="block text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
              Tasks
            </Link>
            <div className="pt-4 space-y-3 border-t border-gray-200 dark:border-gray-800">
              <Link href="/login" className="block text-gray-700 dark:text-gray-300">
                Login
              </Link>
              <Link href="/register" className="block px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-lg text-center">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

