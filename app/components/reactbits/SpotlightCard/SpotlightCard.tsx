"use client";
import React, { useRef } from 'react';
import './SpotlightCard.css';

type SpotlightCardProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T> & {
  as?: T;
  className?: string;
  spotlightColor?: `rgba(${number}, ${number}, ${number}, ${number})`;
};

const SpotlightCard = <T extends React.ElementType = 'div'>({
  as,
  children,
  className = '',
  spotlightColor = 'rgba(255, 255, 255, 0.25)',
  ...rest
}: SpotlightCardProps<T>) => {
  const Component = as || 'div';
  const elRef = useRef<HTMLElement>(null);

  const handleMouseMove: React.MouseEventHandler<HTMLElement> = e => {
    if (!elRef.current) return;

    const rect = elRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    elRef.current.style.setProperty('--mouse-x', `${x}px`);
    elRef.current.style.setProperty('--mouse-y', `${y}px`);
    elRef.current.style.setProperty('--spotlight-color', spotlightColor);
  };

  return (
    <Component
      ref={elRef}
      onMouseMove={handleMouseMove}
      className={`card-spotlight ${className}`}
      {...(rest as React.ComponentPropsWithoutRef<T>)}
    >
      {children}
    </Component>
  );
};

export default SpotlightCard;
