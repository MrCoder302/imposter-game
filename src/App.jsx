import { useState, useEffect } from "react";
import SelectPlayers from "./components/SelectPlayers.jsx";
import SelectCategory from "./components/SelectCategory.jsx";
import Game from "./components/Game.jsx";

function App() {
  const [step, setStep] = useState(1);
  const [players, setPlayers] = useState([]);
  const [gameMode, setGameMode] = useState(1); // 1: Bluff (Knows), 2: Undercover (Doesn't know)
  const [gameData, setGameData] = useState(null);

  const handleStartGame = (selectedCategories) => {
    fetch(`${import.meta.env.BASE_URL}api.json`)
      .then((res) => res.json())
      .then((allData) => {
        let pool = [];
        selectedCategories.forEach((cat) => {
          pool = [...pool, ...allData[cat]];
        });

        // 1. Pick the Secret Word for everyone
        const word1 = pool[Math.floor(Math.random() * pool.length)];
        let word2 = "???"; // Default placeholder

        // 2. Only pick a second word if we are in Undercover Mode (Mode 2)
        if (gameMode === 2) {
          word2 = pool[Math.floor(Math.random() * pool.length)];
          while (word1 === word2) {
            word2 = pool[Math.floor(Math.random() * pool.length)];
          }
        }

        setGameData({
          secretWord: word1,
          imposterWord: word2,
          imposterIndex: Math.floor(Math.random() * players.length),
          mode: gameMode,
        });
        setStep(4);
      });
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-neutral-900 text-white font-sans">
      <h1 className="text-white font-bold text-4xl mt-10 border-b-2 border-orange-500 pb-2">
        IMPOSTER
      </h1>

      {step === 1 && (
        <SelectPlayers 
          onNext={(names) => { 
            setPlayers(names); 
            setStep(2); 
          }} 
        />
      )}

      {step === 2 && (
        <div className="flex flex-col items-center mt-10 animate-fadeIn px-6 w-full max-w-sm">
          <h2 className="text-xl font-bold mb-6 italic tracking-tight">SELECT GAME MODE</h2>
          <div className="grid grid-cols-1 gap-4 w-full">
            <button 
              onClick={() => { setGameMode(1); setStep(3); }}
              className="p-6 bg-neutral-800 border-2 border-neutral-700 rounded-2xl hover:border-orange-500 transition-all text-left group"
            >
              <p className="text-orange-500 font-black text-lg group-hover:scale-105 transition-transform">MODE 1: BLUFF</p>
              <p className="text-neutral-400 text-sm mt-1">Imposter knows they are the imposter. Everyone else gets the same word.</p>
            </button>
            
            <button 
              onClick={() => { setGameMode(2); setStep(3); }}
              className="p-6 bg-neutral-800 border-2 border-neutral-700 rounded-2xl hover:border-orange-500 transition-all text-left group"
            >
              <p className="text-orange-500 font-black text-lg group-hover:scale-105 transition-transform">MODE 2: UNDERCOVER</p>
              <p className="text-neutral-400 text-sm mt-1">Everyone gets a word. The imposter gets a different one but doesn't know they are it.</p>
            </button>
          </div>
          <button onClick={() => setStep(1)} className="mt-8 text-neutral-500 uppercase text-xs font-bold tracking-widest hover:text-white">← Back to Players</button>
        </div>
      )}

      {step === 3 && (
        <SelectCategory 
          onBack={() => setStep(2)} 
          onStart={handleStartGame} 
        />
      )}

      {step === 4 && (
        <Game 
          players={players} 
          gameData={gameData} 
          onReset={() => setStep(1)} 
        />
      )}
    </div>
  );
}

export default App;