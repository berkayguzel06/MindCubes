'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStoredUser } from '@/hooks/useStoredUser';

export default function Home() {
  const containerRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const { user, hydrated } = useStoredUser();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      // Calculate mouse position as percentage (0 to 1)
      const x = clientX / innerWidth;
      const y = clientY / innerHeight;

      // Update CSS variables for smooth performance
      containerRef.current.style.setProperty('--mouse-x', `${x}`);
      containerRef.current.style.setProperty('--mouse-y', `${y}`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (user) {
      router.replace('/agents');
    }
  }, [hydrated, user, router]);

  if (!hydrated || user) {
    return (
      <main className="h-screen w-full flex items-center justify-center bg-black text-white">
        {user ? 'Yönlendiriliyorsunuz...' : 'Loading...'}
      </main>
    );
  }

  return (
    <main
      ref={containerRef}
      className="h-screen w-full overflow-hidden bg-[#0f172a] flex flex-col relative"
      style={{
        backgroundImage: `
          radial-gradient(at calc(0% + var(--mouse-x, 0.5) * 200px) calc(0% + var(--mouse-y, 0.5) * 200px), hsla(253,16%,7%,1) 0, transparent 50%), 
          radial-gradient(at calc(50% - var(--mouse-x, 0.5) * 200px) calc(0% + var(--mouse-y, 0.5) * 200px), hsla(225,39%,30%,1) 0, transparent 50%), 
          radial-gradient(at calc(100% - var(--mouse-x, 0.5) * 200px) calc(0% - var(--mouse-y, 0.5) * 200px), hsla(339,49%,30%,1) 0, transparent 50%)
        `
      } as React.CSSProperties}
    >
      {/* Navigation */}
      <nav className="w-full p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <img
            src="/icon.png"
            alt="MindCubes Logo"
            className="w-10 h-10 object-contain"
          />
          <span className="text-xl font-medium tracking-tight text-white">MindCubes</span>
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-5 py-2 bg-white text-black text-sm font-medium rounded-full hover:bg-gray-200 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-center tracking-tighter mb-8 max-w-5xl mx-auto">
          <span className="text-white">Build with</span>
          <br />
          <span className="text-gray-500">Intelligent Agents</span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl text-center mb-12 font-light">
          Orchestrate specialized AI models to solve complex problems.
          <br className="hidden md:block" />
          Simple, powerful, and designed for the future.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/register"
            className="px-8 py-4 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-all transform hover:scale-105"
          >
            Start Building
          </Link>
          <Link
            href="/chat"
            className="px-8 py-4 glass-panel text-white rounded-full font-medium hover:bg-white/5 transition-all"
          >
            View Demo
          </Link>
        </div>
      </div>

      {/* Footer / Bottom text */}
      <div className="absolute bottom-8 w-full text-center text-gray-600 text-xs tracking-widest uppercase">
        Powered by Advanced AI Models
      </div>
    </main>
  );
}
