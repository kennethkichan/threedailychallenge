"use client";
import React from 'react';
import './confetti.css';

export function Confetti() {
  return (
    <div className="confetti-container" aria-hidden="true">
      {Array.from({ length: 150 }).map((_, i) => (
        <div key={i} className={`confetti confetti-piece-${i % 15}`} />
      ))}
    </div>
  );
};
