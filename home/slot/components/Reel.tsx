
import React, { useMemo, useRef, useEffect } from 'react';

interface ReelProps {
  finalValue: number;
  spinning: boolean;
}

const SYMBOLS = Array.from({ length: 31 }, (_, i) => i);
const REEL_ITEM_HEIGHT_REM = 6; // Corresponds to h-24
const REEL_SETS = 5;

const Reel: React.FC<ReelProps> = ({ finalValue, spinning }) => {
  const reelRef = useRef<HTMLDivElement>(null);
  
  const displaySymbols = useMemo(() => {
    return Array(REEL_SETS).fill(SYMBOLS).flat();
  }, []);

  useEffect(() => {
    if (!reelRef.current) return;
    
    if (spinning) {
        // Start spinning animation
        const randomEndPosition = Math.floor(Math.random() * (displaySymbols.length - SYMBOLS.length) + SYMBOLS.length);
        const offset = -randomEndPosition * REEL_ITEM_HEIGHT_REM;
        reelRef.current.style.transform = `translateY(${offset}rem)`;
        reelRef.current.style.transitionDuration = '3000ms';
    } else {
        // Settle on the final value
        const targetSetIndex = Math.floor(REEL_SETS / 2);
        const targetIndex = (targetSetIndex * SYMBOLS.length) + finalValue;
        const offset = -targetIndex * REEL_ITEM_HEIGHT_REM;
        reelRef.current.style.transform = `translateY(${offset}rem)`;
        reelRef.current.style.transitionDuration = '1000ms'; // Settle duration
    }

  }, [spinning, finalValue, displaySymbols]);

  return (
    <div className="bg-gradient-to-b from-yellow-500 via-amber-500 to-yellow-600 p-2 sm:p-3 rounded-2xl shadow-inner shadow-black/50">
      <div className="bg-gradient-to-b from-gray-700 to-black p-1 sm:p-2 rounded-lg shadow-lg">
        <div className="h-24 w-20 sm:w-24 bg-black/50 rounded-md overflow-hidden relative">
            <div 
              ref={reelRef}
              className="absolute top-0 left-0 right-0 transition-transform ease-out"
              style={{ transform: 'translateY(0rem)' }}
            >
              {displaySymbols.map((symbol, index) => (
                <div 
                  key={index}
                  className="h-24 flex items-center justify-center text-5xl sm:text-6xl font-black"
                >
                   <span className="text-white filter drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
                    {symbol}
                   </span>
                </div>
              ))}
            </div>
             <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none"></div>
             <div className="absolute top-1/2 left-0 right-0 h-1 bg-yellow-400/50 -translate-y-1/2 blur-sm"></div>
        </div>
      </div>
    </div>
  );
};

export default Reel;
