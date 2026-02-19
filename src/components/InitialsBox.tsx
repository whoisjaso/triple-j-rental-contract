import React from 'react';

interface InitialsBoxProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
}

export const InitialsBox: React.FC<InitialsBoxProps> = ({ value, onChange, label = "Renter Initials" }) => {
  return (
    <div className="flex items-end justify-end mt-4">
      <div className="flex items-center gap-2">
        <span className="font-bold text-sm font-sans text-forest-green">{label}:</span>
        <input 
          type="text" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="border-b-2 border-charcoal w-16 text-center font-serif" 
          maxLength={4}
        />
      </div>
    </div>
  );
};