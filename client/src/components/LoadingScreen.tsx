import { useEffect, useState } from 'react';

export function LoadingScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  useEffect(() => {
    // Mark animation as complete after 1.5s
    const animationTimer = setTimeout(() => {
      setIsAnimationComplete(true);
    }, 1500);

    // Hide loading screen after 2.5s total
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => {
      clearTimeout(animationTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-500 ${
        isAnimationComplete ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Glow effect background */}
        <div className="absolute inset-0 flex items-center justify-center animate-glow-pulse">
          <div className="w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
        </div>

        {/* SVG Container for the logo elements */}
        <svg
          className="relative z-10"
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left Arc - slides in from left */}
          <g className="animate-slide-in-left">
            <path
              d="M 30 25 Q 20 60 30 95"
              stroke="hsl(var(--primary))"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* Right Arc - slides in from right */}
          <g className="animate-slide-in-right">
            <path
              d="M 60 25 Q 70 60 60 95"
              stroke="hsl(var(--primary))"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* Dot - slides in from right with delay */}
          <g className="animate-slide-in-dot">
            <circle
              cx="95"
              cy="60"
              r="8"
              fill="hsl(var(--primary))"
            />
          </g>
        </svg>

        {/* Optional: Loading text with fade-in */}
        <div className="absolute bottom-8 text-muted-foreground text-sm font-medium animate-fade-in tracking-wider">
          LOADING
        </div>
      </div>
    </div>
  );
}
