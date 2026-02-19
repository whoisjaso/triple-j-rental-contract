import React from 'react';

interface InputLineProps {
  label?: string;
  value: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  type?: string;
  width?: string;
  className?: string;
  readOnly?: boolean;
}

export const InputLine: React.FC<InputLineProps> = ({ 
  label, 
  value, 
  onChange, 
  placeholder = "", 
  type = "text",
  width = "w-full",
  className = "",
  readOnly = false
}) => {
  return (
    <div className={`flex flex-col ${width} ${className} print:block`}>
      {label && <label className="text-xs font-sans font-bold text-forestGreen uppercase tracking-wider mb-1">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className="legal-input font-serif text-charcoal placeholder-gray-300 text-sm py-1 bg-transparent"
      />
    </div>
  );
};