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
        <div className="flex items-baseline border-b-2 border-luxury-ink mb-4 pb-1">
          {number && <span className="text-[10px] font-bold font-sans text-luxury-ink/50 mr-3 tracking-widest uppercase">{number}</span>}
          <h2 className="text-[10px] font-bold font-sans text-luxury-ink/50 uppercase tracking-widest">{title}</h2>
        </div>
      )}
      <div className={`${critical ? 'border-l-4 border-alert-red pl-4' : ''}`}>
        {children}
      </div>
    </div>
  );
};