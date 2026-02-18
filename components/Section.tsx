import React from 'react';

interface SectionProps {
  title?: string;
  number?: string;
  children: React.ReactNode;
  className?: string;
  critical?: boolean;
  noBreak?: boolean;
}

export const Section: React.FC<SectionProps> = ({ title, number, children, className = "", critical = false, noBreak = false }) => {
  return (
    <div className={`mb-8 ${noBreak ? 'avoid-break' : ''} ${className}`}>
      {title && (
        <div className="flex items-baseline border-b-2 border-gold mb-4 pb-1">
          {number && <span className="text-lg font-bold font-sans text-forestGreen mr-3">{number}</span>}
          <h2 className="text-lg font-bold font-sans text-forestGreen uppercase tracking-tight">{title}</h2>
        </div>
      )}
      <div className={`${critical ? 'border-l-4 border-alertRed pl-4' : ''}`}>
        {children}
      </div>
    </div>
  );
};