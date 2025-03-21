import React from 'react';

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src="/logo.svg" 
        alt="Genner Gibelguuger Logo" 
        className="w-full h-full"
        style={{ filter: 'invert(19%) sepia(92%) saturate(3868%) hue-rotate(353deg) brightness(85%) contrast(114%)' }}
      />
    </div>
  );
}