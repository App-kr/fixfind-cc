'use client';
import { useEffect, useRef } from 'react';

interface Props {
  children: React.ReactNode;
  delay?: number;   // ms
  style?: React.CSSProperties;
  className?: string;
}

export default function ScrollReveal({ children, delay = 0, style, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Delay then reveal
          const timer = setTimeout(() => {
            el.classList.add('visible');
          }, delay);
          observer.disconnect();
          return () => clearTimeout(timer);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={`reveal${className ? ' ' + className : ''}`} style={style}>
      {children}
    </div>
  );
}
