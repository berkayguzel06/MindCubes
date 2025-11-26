'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import NexmindLogo from './nexmind3-logo.png';
import { useStoredUser } from '@/hooks/useStoredUser';

export default function Home() {
  const containerRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const { user, hydrated } = useStoredUser();

  useEffect(() => {
    let frameId: number;
    let startTime: number | null = null;

    const animate = (time: number) => {
      if (!containerRef.current) {
        frameId = requestAnimationFrame(animate);
        return;
      }

      if (startTime === null) {
        startTime = time;
      }

      const elapsed = (time - startTime) / 1000; // seconds

      // Faster & more visible looping movement around center
      const amplitude = 0.2; // how far it moves from center (0.5)
      const speedX = 1.3;
      const speedY = 1.7;

      const x = 0.5 + amplitude * Math.cos(elapsed * speedX);
      const y = 0.5 + amplitude * Math.sin(elapsed * speedY);

      containerRef.current.style.setProperty('--mouse-x', `${x}`);
      containerRef.current.style.setProperty('--mouse-y', `${y}`);

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
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
      <nav className="w-full p-6 flex justify-end items-center z-10">
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

        <div className="flex flex-col items-center gap-3 mb-2">
          <div className="flex items-center justify-center">
            <img
              src="/icon.png"
              alt="MindCubes Icon"
              className="w-56 h-56 md:w-64 md:h-64 object-contain drop-shadow-[0_12px_25px_rgba(15,23,42,0.35)]"
            />
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-center tracking-tighter mb-4 max-w-5xl mx-auto">
          <span className="text-white">Work with</span>
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
            Start Working with Agents
          </Link>
        </div>

        <div className="mt-10 md:mt-16 flex items-center gap-5 text-gray-300 text-sm md:text-base">
          <span className="uppercase tracking-[0.5em]">Powered by</span>
          <Image
            src={NexmindLogo}
            alt="Nexmind3 Logo"
            className="h-12 w-auto opacity-95"
            width={220}
            height={44}
            priority
          />
        </div>
      </div>

      {/* Footer spacer */}
      <div className="h-12" />
    </main>
  );
}
