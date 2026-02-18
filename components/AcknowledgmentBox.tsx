import React from 'react';
import { InitialsBox } from './InitialsBox';

interface AcknowledgmentBoxProps {
  text: string;
  initials: string;
  onInitialsChange: (val: string) => void;
}

export const AcknowledgmentBox: React.FC<AcknowledgmentBoxProps> = ({ text, initials, onInitialsChange }) => {
  return (
    <div className="bg-lightGray p-4 my-4 rounded-sm border border-gray-200 avoid-break">
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <input type="checkbox" className="h-5 w-5 rounded border-gray-400 text-forestGreen focus:ring-forestGreen" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-charcoal text-sm leading-relaxed">{text}</p>
        </div>
      </div>
      <InitialsBox value={initials} onChange={onInitialsChange} />
    </div>
  );
};