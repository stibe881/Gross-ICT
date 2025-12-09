import { useEffect, useState } from 'react';

export function LoadingScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  useEffect(() => {
    // Mark animation as complete after 3s
    const animationTimer = setTimeout(() => {
      setIsAnimationComplete(true);
    }, 3000);

    // Hide loading screen after 3.5s total
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 3500);

    return () => {
      clearTimeout(animationTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-700 ${
        isAnimationComplete ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Glow effect background */}
        <div className="absolute inset-0 flex items-center justify-center animate-glow-pulse">
          <div className="w-40 h-40 rounded-full bg-primary/20 blur-3xl" />
        </div>

        {/* SVG Container for the logo elements */}
        <svg
          className="relative z-10"
          width="160"
          height="160"
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left Arc - slides in from left */}
          <g className="animate-slide-in-left">
            <path
              d="M 40 30 Q 25 80 40 130"
              stroke="hsl(var(--primary))"
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
              opacity="0.9"
            />
          </g>

          {/* Right Arc - slides in from right */}
          <g className="animate-slide-in-right">
            <path
              d="M 80 30 Q 95 80 80 130"
              stroke="hsl(var(--primary))"
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
              opacity="0.9"
            />
          </g>

          {/* Dot - slides in from right with delay */}
          <g className="animate-slide-in-dot">
            <circle
              cx="130"
              cy="80"
              r="10"
              fill="hsl(var(--primary))"
              opacity="0.9"
            />
          </g>
        </svg>

        {/* Optional: Loading text with fade-in */}
        <div className="absolute bottom-12 text-muted-foreground text-base font-medium animate-fade-in tracking-[0.3em] uppercase">
          LOADING
        </div>
      </div>
    </div>
  );
}
