
import React, { useState, useCallback, useEffect } from 'react';
import Reel from './components/Reel';

const SPIN_COST = 10;
const WIN_MULTIPLIER = 10;
const JACKPOT_MULTIPLIER = 100;
const JACKPOT_NUMBER = 7;
const INITIAL_CREDITS = 100;
const NUM_REELS = 5;

// Define types for better readability and safety
type ReelsArray = [number, number, number, number, number];
type SpinningArray = [boolean, boolean, boolean, boolean, boolean];


const App: React.FC = () => {
  const [reels, setReels] = useState<ReelsArray>([5, 5, 5, 5, 5]);
  const [spinning, setSpinning] = useState<SpinningArray>([false, false, false, false, false]);
  const [credits, setCredits] = useState<number>(INITIAL_CREDITS);
  const [resultMessage, setResultMessage] = useState<string>('Welcome! Spin to win!');
  const [nextAutoSpin, setNextAutoSpin] = useState<string>('');

  const isSpinning = spinning.some(s => s);

  const runSpin = useCallback((isAutoSpin: boolean = false) => {
    if (isSpinning) return;
    if (!isAutoSpin && credits < SPIN_COST) {
      setResultMessage("Not enough credits!");
      return;
    }

    if (!isAutoSpin) {
      setCredits(prev => prev - SPIN_COST);
    }
    
    setSpinning([true, true, true, true, true]);
    setResultMessage(isAutoSpin ? 'Hourly free spin!' : '');

    // In a real application, this is where you would call a blockchain oracle
    // for a verifiable random number.
    // e.g., const randomNumbers = await getVerifiableRandomness(NUM_REELS);
    // For this simulation, we use Math.random().
    const newReels = Array.from({ length: NUM_REELS }, () => Math.floor(Math.random() * 31)) as ReelsArray;

    const stopReel = (index: number) => {
        setReels(prev => {
            const updatedReels = [...prev] as ReelsArray;
            updatedReels[index] = newReels[index];
            return updatedReels;
        });
        setSpinning(prev => {
            const updatedSpinning = [...prev] as SpinningArray;
            updatedSpinning[index] = false;
            return updatedSpinning;
        });
    }
    
    // Stagger the reel stops for a more dramatic effect
    for (let i = 0; i < NUM_REELS; i++) {
        setTimeout(() => stopReel(i), 1500 + i * 1000);
    }

    // Final result calculation
    setTimeout(() => {
        const [r1, r2, r3, r4, r5] = newReels;
        if (r1 === r2 && r2 === r3 && r3 === r4 && r4 === r5) {
            if (r1 === JACKPOT_NUMBER) {
                const winnings = SPIN_COST * JACKPOT_MULTIPLIER;
                setCredits(prev => prev + winnings);
                setResultMessage(`JACKPOT! You won ${winnings} credits!`);
            } else {
                const winnings = SPIN_COST * WIN_MULTIPLIER;
                setCredits(prev => prev + winnings);
                setResultMessage(`You won ${winnings} credits!`);
            }
        } else {
            setResultMessage(isAutoSpin ? 'Better luck next hour!' : 'Try again!');
        }
    }, 1500 + (NUM_REELS - 1) * 1000 + 500);
    
  }, [credits, isSpinning]);

  const handleManualSpin = useCallback(() => {
    runSpin(false);
  }, [runSpin]);

  const handleAutoSpin = useCallback(() => {
    runSpin(true);
  }, [runSpin]);
  
  // Effect for handling the hourly auto-spin
  useEffect(() => {
    const updateNextSpinTime = () => {
        const now = new Date();
        const nextHour = new Date(now);
        nextHour.setHours(now.getHours() + 1, 0, 0, 0);
        const diff = nextHour.getTime() - now.getTime();
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setNextAutoSpin(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
        return diff;
    };
    
    let intervalId: number;
    const timeoutId = setTimeout(() => {
        handleAutoSpin();
        intervalId = window.setInterval(handleAutoSpin, 3600000); // subsequent spins every hour
    }, updateNextSpinTime());

    const timerIntervalId = window.setInterval(updateNextSpinTime, 1000);

    return () => {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
        clearInterval(timerIntervalId);
    };
  }, [handleAutoSpin]);


  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-800 to-black text-white flex flex-col items-center justify-center p-4 font-sans">
      <header className="text-center mb-8">
        <h1 className="text-5xl font-bold text-yellow-400 tracking-wider" style={{ textShadow: '0 0 10px #facc15, 0 0 20px #facc15' }}>
          Gemini Lucky 5
        </h1>
        <p className="text-gray-300 text-lg mt-2">The ultimate 5-reel slot experience</p>
      </header>

      <main className="bg-gray-800/50 backdrop-blur-sm p-6 sm:p-10 rounded-3xl shadow-2xl border border-yellow-500/30 w-full max-w-4xl">
        {/* Reels Container */}
        <div className="flex justify-center items-center space-x-2 sm:space-x-4 mb-8">
          {reels.map((reelValue, index) => (
            <Reel key={index} finalValue={reelValue} spinning={spinning[index]} />
          ))}
        </div>
        
        {/* Results and Controls */}
        <div className="text-center space-y-6">
          <div className="h-8 text-2xl font-semibold text-yellow-300 transition-opacity duration-300">
            {resultMessage}
          </div>
          
          <div className="flex justify-center items-center space-x-6">
            <div className="bg-black/30 p-4 rounded-xl inline-block">
                <span className="text-gray-400 text-lg">CREDITS: </span>
                <span className="text-3xl font-bold text-white tracking-wider">{credits}</span>
            </div>
            <div className="bg-black/30 p-4 rounded-xl inline-block text-center">
                <div className="text-gray-400 text-sm leading-tight">FREE SPIN IN</div>
                <div className="text-2xl font-bold text-white tracking-wider">{nextAutoSpin}</div>
            </div>
          </div>
          
          <button
            onClick={handleManualSpin}
            disabled={isSpinning || credits < SPIN_COST}
            className="w-full max-w-xs mx-auto px-8 py-4 text-2xl font-bold text-gray-900 bg-gradient-to-b from-yellow-400 to-amber-500 rounded-lg shadow-lg
                       transform transition-all duration-300 hover:scale-105 hover:shadow-yellow-400/50
                       disabled:from-gray-500 disabled:to-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
          >
            {isSpinning ? 'SPINNING...' : `SPIN (COST ${SPIN_COST})`}
          </button>
        </div>
      </main>
      
      <footer className="mt-8 text-gray-500 text-sm text-center">
        <p>Blockchain Verifiable Randomness (Simulated)</p>
        <p>Built with React, TypeScript, and Tailwind CSS. Powered by Gemini.</p>
      </footer>
    </div>
  );
};

export default App;
