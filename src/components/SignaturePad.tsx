import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, X, PenTool } from 'lucide-react';

interface SignaturePadProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ value, onChange, label = "Signature" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Setup Canvas Size and Context
  useEffect(() => {
    if (isEditing && canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      
      const setCanvasSize = () => {
        // slight buffer to prevent layout thrashing or scrollbars
        canvas.width = container.clientWidth; 
        canvas.height = 200; // Taller for easier signing on mobile
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.lineWidth = 2.5; // Slightly thicker for mobile readability
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = '#000000';
        }
      };

      setCanvasSize();
      
      // Optional: Handle resize (clears canvas, but keeps layout correct)
      window.addEventListener('resize', setCanvasSize);
      return () => window.removeEventListener('resize', setCanvasSize);
    }
  }, [isEditing]);

  // Handle Drawing Logic with Native Events for better control over preventDefault
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!isEditing || !canvas) return;

    let isDrawing = false;
    
    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;
      
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const start = (e: MouseEvent | TouchEvent) => {
       if (e.cancelable) e.preventDefault(); // Critical for stopping scroll
       isDrawing = true;
       const ctx = canvas.getContext('2d');
       const { x, y } = getPos(e);
       ctx?.beginPath();
       ctx?.moveTo(x, y);
    };

    const move = (e: MouseEvent | TouchEvent) => {
       if (e.cancelable) e.preventDefault(); 
       if (!isDrawing) return;
       const ctx = canvas.getContext('2d');
       const { x, y } = getPos(e);
       ctx?.lineTo(x, y);
       ctx?.stroke();
    };

    const end = (e: MouseEvent | TouchEvent) => {
       if (e.cancelable) e.preventDefault();
       isDrawing = false;
    };

    // Attach passive: false listeners
    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('mouseleave', end);
    
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', start);
      canvas.removeEventListener('mousemove', move);
      canvas.removeEventListener('mouseup', end);
      canvas.removeEventListener('mouseleave', end);
      
      canvas.removeEventListener('touchstart', start);
      canvas.removeEventListener('touchmove', move);
      canvas.removeEventListener('touchend', end);
    };
  }, [isEditing]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveSignature = () => {
     if (canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        onChange(dataUrl);
        setIsEditing(false);
     }
  };

  if (isEditing) {
    return (
      <div className="flex flex-col w-full mb-6" ref={containerRef}>
        <div className="flex justify-between items-end mb-2">
           {label && <label className="text-xs font-sans font-bold text-luxury-ink/50 uppercase tracking-wider">{label}</label>}
           <span className="text-xs text-gray-400 italic">Sign inside the box below</span>
        </div>
        
        <div className="border-2 border-luxury-ink rounded bg-white shadow-lg relative overflow-hidden">
          <canvas
            ref={canvasRef}
            className="block w-full bg-white cursor-crosshair touch-none"
            style={{ height: '200px' }} // Explicit height matching JS
          />
          
          {/* Helper line for signature baseline */}
          <div className="absolute bottom-10 left-4 right-4 border-b border-gray-200 pointer-events-none"></div>

          <button 
              type="button"
              onClick={clearCanvas} 
              className="absolute top-2 right-2 p-3 bg-gray-100 rounded-full text-gray-600 hover:bg-alert-red hover:text-white transition-colors shadow-sm z-10 active:bg-gray-300"
              title="Clear Signature"
            >
              <Eraser size={20} />
            </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
            <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="py-3 bg-gray-200 text-luxury-ink rounded-lg font-bold text-sm hover:bg-gray-300 flex items-center justify-center gap-2 active:bg-gray-400"
            >
                <X size={18} />
                Cancel
            </button>
            <button 
                type="button"
                onClick={saveSignature}
                className="py-3 bg-luxury-ink text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 shadow-md active:bg-green-950"
            >
                <Check size={18} />
                Save Signature
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full mb-4 break-inside-avoid">
      {label && <label className="text-xs font-sans font-bold text-luxury-ink/50 uppercase tracking-wider mb-1">{label}</label>}
      {value ? (
        <div className="relative group border-b-2 border-luxury-ink pb-2">
            <img src={value} alt="Signature" className="h-20 md:h-24 object-contain mr-auto" />
            <div className="absolute top-0 right-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity no-print">
                <button 
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded text-luxury-ink font-semibold shadow-sm"
                >
                    Edit / Redo
                </button>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">Signed electronically</div>
        </div>
      ) : (
        <>
            <button 
                type="button"
                onClick={() => setIsEditing(true)}
                className="signature-pad-placeholder w-full h-24 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-100 hover:border-luxury-gold transition-all group active:scale-95 active:bg-gray-200 no-print"
            >
                <PenTool className="mb-2 group-hover:text-luxury-gold" size={24} />
                <span className="font-bold text-sm group-hover:text-luxury-gold">Tap to Sign</span>
            </button>
            {/* Element specifically for PDF/Print when no signature is present */}
            <div className="signature-pad-empty-line hidden print:block border-b-2 border-luxury-ink h-16 w-full"></div>
        </>
      )}
    </div>
  );
};