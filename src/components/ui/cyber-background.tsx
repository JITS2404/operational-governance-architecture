import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export const CyberBackground: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('fixed inset-0 -z-10 overflow-hidden', className)}>
      {/* Animated Grid */}
      <div className="absolute inset-0 cyber-grid opacity-30" />
      
      {/* Floating Geometric Shapes */}
      <div className="absolute top-10 left-10 w-20 h-20 border-2 border-cyan-400/30 rotate-45 animate-float-3d" />
      <div className="absolute top-32 right-20 w-16 h-16 border-2 border-purple-400/30 animate-pulse-slow" />
      <div className="absolute bottom-20 left-1/4 w-24 h-24 border-2 border-pink-400/30 rounded-full animate-float-3d animation-delay-2000" />
      
      {/* Neon Lines */}
      <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent animate-pulse" />
      <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-purple-400/50 to-transparent animate-pulse animation-delay-1000" />
      
      {/* Glowing Orbs */}
      <div className="absolute top-1/4 left-1/2 w-32 h-32 bg-gradient-radial from-blue-500/20 to-transparent rounded-full blur-xl animate-pulse-slow" />
      <div className="absolute bottom-1/3 right-1/3 w-40 h-40 bg-gradient-radial from-purple-500/20 to-transparent rounded-full blur-2xl animate-pulse-slow animation-delay-4000" />
    </div>
  );
};

export const MatrixRain: React.FC<{ className?: string }> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const charArray = chars.split('');
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = 1;
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0f0';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];
        ctx.fillStyle = `rgba(0, 255, 0, ${Math.random()})`;
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 50);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn('fixed inset-0 -z-10 opacity-20', className)}
    />
  );
};

export const NeonBorder: React.FC<{
  children: React.ReactNode;
  color?: 'cyan' | 'purple' | 'pink' | 'green';
  className?: string;
}> = ({ children, color = 'cyan', className }) => {
  const colors = {
    cyan: 'border-cyan-400 shadow-cyan-400/50',
    purple: 'border-purple-400 shadow-purple-400/50',
    pink: 'border-pink-400 shadow-pink-400/50',
    green: 'border-green-400 shadow-green-400/50',
  };

  return (
    <div className={cn(
      `relative border-2 ${colors[color]} rounded-lg p-4 backdrop-blur-sm bg-black/20`,
      'before:absolute before:inset-0 before:rounded-lg before:p-[2px]',
      'before:bg-gradient-to-r before:from-transparent before:via-current before:to-transparent',
      'before:animate-gradient-x before:-z-10',
      className
    )}>
      {children}
    </div>
  );
};

export const HologramEffect: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div className={cn('relative', className)}>
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-pink-400/20 animate-gradient-x blur-sm" />
      <div className="relative z-10 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x">
        {children}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-purple-400/10 to-pink-400/10 animate-gradient-x animation-delay-500" />
    </div>
  );
};