import { useEffect, useRef } from 'react';

interface ConstellationBgProps {
  starCount?: number;
  opacity?: number;
}

export default function ConstellationBg({ starCount = 100, opacity = 0.08 }: ConstellationBgProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    container.innerHTML = '';
    
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDelay = `${Math.random() * 3}s`;
      star.style.animationDuration = `${2 + Math.random() * 2}s`;
      container.appendChild(star);
    }
  }, [starCount]);

  return (
    <div
      ref={containerRef}
      className="constellation-bg"
      style={{ opacity }}
    />
  );
}
