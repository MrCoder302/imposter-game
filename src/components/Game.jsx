import { useState } from "react";

function Game({ players, gameData, onReset }) {
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isFinalReveal, setIsFinalReveal] = useState(false);

  const handleCardClick = () => {
    if (!isRevealed) {
      setIsRevealed(true);
    } else {
      if (currentPlayer < players.length - 1) {
        setIsRevealed(false);
        setCurrentPlayer((prev) => prev + 1);
      } else {
        // Last player finished hiding, move to Voting
        setIsVoting(true);
      }
    }
  };

  // SCREEN 3: THE FINAL REVEAL (After clicking Reveal button)
  if (isFinalReveal) {
    return (
      <div className="flex flex-col items-center mt-12 animate-fadeIn px-6 text-center">
        <div className="bg-red-600 px-6 py-1 rounded-full text-xs font-black mb-4 tracking-widest uppercase">Identity Exposed</div>
        
        <h2 className="text-5xl font-black text-white uppercase mb-10 italic">
          {players[gameData.imposterIndex]} <br/> 
          <span className="text-orange-500 text-2xl not-italic font-bold">WAS THE IMPOSTER</span>
        </h2>

        <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-12">
          <div className="bg-neutral-800 p-4 rounded-2xl border border-neutral-700">
            <p className="text-neutral-500 text-[10px] uppercase font-bold">Secret Word</p>
            <p className="text-xl font-bold">{gameData.secretWord}</p>
          </div>
          <div className="bg-neutral-800 p-4 rounded-2xl border border-red-500/50">
            <p className="text-red-500 text-[10px] uppercase font-bold">Imposter Word</p>
            <p className="text-xl font-bold">{gameData.imposterWord}</p>
          </div>
        </div>

        <button onClick={onReset} className="bg-orange-500 hover:bg-orange-400 text-white font-black py-4 px-10 rounded-2xl transition-all active:scale-95">
          PLAY AGAIN
        </button>
      </div>
    );
  }

  // SCREEN 2: VOTING / DISCUSSION (Before knowing who it is)
  if (isVoting) {
    return (
      <div className="flex flex-col items-center mt-8 animate-fadeIn px-6 w-full">
        <h2 className="text-2xl font-black text-white uppercase mb-2 tracking-tighter text-center">Who is the Imposter?</h2>
        <p className="text-neutral-500 text-sm mb-8 text-center italic">Discuss with everyone, then reveal the truth.</p>
        
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-12">
          {players.map((name, i) => (
            <div key={i} className="bg-neutral-800 p-4 rounded-xl border border-neutral-700 text-center font-bold">
              {name}
            </div>
          ))}
        </div>

        <button 
          onClick={() => setIsFinalReveal(true)}
          className="w-full max-w-xs bg-red-600 hover:bg-red-500 text-white font-black py-5 rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all animate-bounceIn"
        >
          REVEAL THE IMPOSTER
        </button>
      </div>
    );
  }

  // SCREEN 1: THE REVEAL LOOP (Player turns)
  const wordToShow = currentPlayer === gameData.imposterIndex 
    ? gameData.imposterWord 
    : gameData.secretWord;

  return (
    <div className="flex flex-col items-center mt-10 w-full px-6 text-center">
      <div className="bg-neutral-800 px-4 py-1 rounded-full text-[10px] font-bold text-orange-400 mb-4 tracking-widest uppercase">
        Player {currentPlayer + 1} of {players.length}
      </div>
      <h2 className="text-4xl font-black text-white uppercase mb-8">
        {players[currentPlayer]}
      </h2>

      <div 
        key={currentPlayer}
        onClick={handleCardClick}
        className={`w-full max-w-[300px] aspect-[3/4] rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 shadow-2xl relative
          ${isRevealed ? "bg-white text-black scale-100" : "bg-neutral-800 text-white scale-95 hover:bg-neutral-700"}
        `}
      >
        {!isRevealed ? (
          <div>
            <div className="text-6xl mb-4">🤫</div>
            <p className="font-black tracking-widest text-xs opacity-50 uppercase">Tap to see word</p>
          </div>
        ) : (
          <div className="animate-fadeIn p-6">
            <p className="text-neutral-400 text-[10px] font-bold uppercase mb-2">Secret Word</p>
            <p className="text-5xl font-black tracking-tighter mb-12">{wordToShow}</p>
            <div className="bg-black text-white text-[10px] py-2 px-4 rounded-full font-bold uppercase tracking-tighter">
              Tap to hide
            </div>
          </div>
        )}
      </div>

      <p className="mt-8 text-neutral-600 text-[10px] uppercase font-bold tracking-widest">
        {isRevealed ? "Don't let others see!" : "Pass phone to this player"}
      </p>
    </div>
  );
}

export default Game;