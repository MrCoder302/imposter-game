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
        setIsVoting(true);
      }
    }
  };

  if (isFinalReveal) {
    return (
      <div className="flex flex-col items-center mt-12 animate-fadeIn px-6 text-center">
        <div className="bg-red-600 px-6 py-1 rounded-full text-xs font-black mb-4 tracking-widest uppercase shadow-lg shadow-red-900/20">
          Identity Exposed
        </div>
        
        <h2 className="text-5xl font-black text-white uppercase mb-10 italic leading-tight">
          {players[gameData.imposterIndex]} <br/> 
          <span className="text-orange-500 text-2xl not-italic font-bold tracking-tighter">WAS THE IMPOSTER</span>
        </h2>

        {/* Dynamic Word Section */}
        <div className={`grid ${gameData.mode === 2 ? "grid-cols-2" : "grid-cols-1"} gap-4 w-full max-w-xs mb-12`}>
          <div className="bg-neutral-800 p-4 rounded-2xl border border-neutral-700 shadow-xl">
            <p className="text-neutral-500 text-[10px] uppercase font-bold mb-1">Secret Word</p>
            <p className="text-xl font-bold text-white">{gameData.secretWord}</p>
          </div>
          
          {/* Only show this if Mode is Undercover (2) */}
          {gameData.mode === 2 && (
            <div className="bg-neutral-800 p-4 rounded-2xl border border-red-500/50 shadow-xl">
              <p className="text-red-500 text-[10px] uppercase font-bold mb-1">Imposter Word</p>
              <p className="text-xl font-bold text-white">{gameData.imposterWord}</p>
            </div>
          )}
        </div>

        <button onClick={onReset} className="bg-orange-500 hover:bg-orange-400 text-white font-black py-4 px-10 rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-900/40">
          PLAY AGAIN
        </button>
      </div>
    );
  }

  if (isVoting) {
    return (
      <div className="flex flex-col items-center mt-8 animate-fadeIn px-6 w-full">
        <h2 className="text-2xl font-black text-white uppercase mb-2 tracking-tighter text-center">Who is the Imposter?</h2>
        <p className="text-neutral-500 text-sm mb-8 text-center italic">Discuss with everyone, then reveal the truth.</p>
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-12">
          {players.map((name, i) => (
            <div key={i} className={`p-4 rounded-xl border text-center font-bold ${i === gameData.imposterIndex ? "border-neutral-700/50 bg-neutral-800/50" : "bg-neutral-800 border-neutral-700"}`}>
              {name}
            </div>
          ))}
        </div>
        <button onClick={() => setIsFinalReveal(true)} className="w-full max-w-xs bg-red-600 hover:bg-red-500 text-white font-black py-5 rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all animate-bounceIn">
          REVEAL THE IMPOSTER
        </button>
      </div>
    );
  }

  const isImposter = currentPlayer === gameData.imposterIndex;
  let displayWord = isImposter ? gameData.imposterWord : gameData.secretWord;
  let labelText = "Secret Word";
  let cardBgClass = isRevealed ? "bg-white text-black" : "bg-neutral-800 text-white";

  if (isImposter && gameData.mode === 1) {
    displayWord = "YOU ARE THE IMPOSTER";
    labelText = "Your Identity";
    cardBgClass = isRevealed ? "bg-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.4)]" : "bg-neutral-800 text-white";
  }

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
          ${cardBgClass} ${!isRevealed && "scale-95 hover:bg-neutral-700"}
        `}
      >
        {!isRevealed ? (
          <div>
            <div className="text-6xl mb-4">🤫</div>
            <p className="font-black tracking-widest text-xs opacity-50 uppercase">Tap to see word</p>
          </div>
        ) : (
          <div className="animate-fadeIn p-6">
            <p className="opacity-50 text-[10px] font-bold uppercase mb-2">{labelText}</p>
            <p className={`${gameData.mode === 1 && isImposter ? "text-3xl" : "text-5xl"} font-black tracking-tighter mb-12 uppercase`}>
              {displayWord}
            </p>
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