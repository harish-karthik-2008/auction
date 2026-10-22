import React, { useMemo } from 'react';

export default function PetalBackground() {
  const petals = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: `${(i * 5.5 + Math.random() * 4) % 100}%`,
      animationDelay: `${(i * 0.8 + Math.random() * 2).toFixed(1)}s`,
      animationDuration: `${(10 + (i % 7) * 2).toFixed(1)}s`,
      size: `${8 + (i % 5) * 3}px`
    }));
  }, []);

  return (
    <div className="petal-container" aria-hidden="true">
      {petals.map((p) => (
        <div
          key={p.id}
          className="petal"
          style={{
            left: p.left,
            animationDelay: p.animationDelay,
            animationDuration: p.animationDuration,
            width: p.size,
            height: `${parseInt(p.size, 10) * 1.4}px`
          }}
        />
      ))}
    </div>
  );
}
