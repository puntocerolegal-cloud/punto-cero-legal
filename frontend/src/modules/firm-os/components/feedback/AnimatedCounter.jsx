import React, { useState, useEffect } from 'react';

export function AnimatedCounter({ value, duration = 1500, suffix = '' }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!value) return;

    const target = parseInt(value, 10);
    const increment = target / (duration / 50);
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplayValue(target);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, 50);

    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <span className="font-bold text-white">
      {displayValue.toLocaleString()}{suffix}
    </span>
  );
}
