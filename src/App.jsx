import { useState } from "react";
import SelectPlayers from "./components/SelectPlayers.jsx";
import SelectCategory from "./components/SelectCategory.jsx";
import Game from "./components/Game.jsx";
import Leaderboard from "./components/Leaderboard.jsx";

function App() {
  const [step, setStep] = useState(1);
  const [players, setPlayers] = useState([]);
  const [gameMode, setGameMode] = useState(1);
  const [gameData, setGameData] = useState(null);
  const [totalRounds, setTotalRounds] = useState(5);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [scores, setScores] = useState({});
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [gameKey, setGameKey] = useState(0);
  const [usedWords, setUsedWords] = useState(new Set());
  const [customWords, setCustomWords] = useState([]);
  const [roundHistory, setRoundHistory] = useState([]);

  const initScores = (playerNames) => {
    const initial = {};
    playerNames.forEach((name) => (initial[name] = 0));
    return initial;
  };

  const pickGameData = (cats, mode, playerList, usedWordsSet, extraWords = []) => {
    return fetch(`${import.meta.env.BASE_URL}api.json`)
      .then((res) => res.json())
      .then((allData) => {
        let pool = [];
        cats.forEach((cat) => { pool = [...pool, ...allData[cat]]; });
        if (extraWords.length > 0) pool = [...pool, ...extraWords];
        const freshPool = pool.filter((w) => !usedWordsSet.has(w));
        const activePool = freshPool.length >= 2 ? freshPool : pool;
        const pickUnique = (exclude = null) => {
          const filtered = exclude ? activePool.filter((w) => w !== exclude) : activePool;
          return filtered[Math.floor(Math.random() * filtered.length)];
        };
        const word1 = pickUnique();
        let word2 = "???";
        if (mode === 2) word2 = pickUnique(word1);

        // Pick imposter(s) — 2 imposters when 6+ players
        const idx1 = Math.floor(Math.random() * playerList.length);
        let idx2 = null;
        if (playerList.length >= 6) {
          do { idx2 = Math.floor(Math.random() * playerList.length); }
          while (idx2 === idx1);
        }

        return {
          secretWord: word1,
          imposterWord: word2,
          imposterIndex: idx1,
          imposterIndex2: idx2, // null when < 6 players
          mode,
        };
      });
  };

  const handleStartGame = (cats, extraWords) => {
    setSelectedCategories(cats);
    setCustomWords(extraWords || []);
    const freshUsed = new Set();
    setUsedWords(freshUsed);
    pickGameData(cats, gameMode, players, freshUsed, extraWords).then((data) => {
      setUsedWords((prev) => new Set([...prev, data.secretWord]));
      setGameData(data);
      setCurrentRound(1);
      setRoundsPlayed(0);
      setScores(initScores(players));
      setGameKey(0);
      setStep(4);
    });
  };

  const handleNextRound = (pointDeltas, roundStat) => {
    const updatedScores = { ...scores };
    Object.entries(pointDeltas).forEach(([name, pts]) => {
      updatedScores[name] = (updatedScores[name] || 0) + pts;
    });
    setScores(updatedScores);
    if (roundStat) setRoundHistory((h) => [...h, roundStat]);
    const nextRound = currentRound + 1;
    setRoundsPlayed((r) => r + 1);
    if (nextRound > totalRounds) {
      setStep(5);
    } else {
      pickGameData(selectedCategories, gameMode, players, usedWords, customWords).then((data) => {
        setUsedWords((prev) => new Set([...prev, data.secretWord]));
        setGameData(data);
        setCurrentRound(nextRound);
        setGameKey((k) => k + 1);
      });
    }
  };

  const handleFullReset = () => {
    setStep(1);
    setPlayers([]);
    setGameData(null);
    setScores({});
    setCurrentRound(1);
    setRoundsPlayed(0);
    setRoundHistory([]);
    setSelectedCategories([]);
    setGameKey(0);
    setUsedWords(new Set());
    setCustomWords([]);
  };

  const handleEndGame = (pointDeltas, roundStat) => {
    if (pointDeltas) {
      const updatedScores = { ...scores };
      Object.entries(pointDeltas).forEach(([name, pts]) => {
        updatedScores[name] = (updatedScores[name] || 0) + pts;
      });
      setScores(updatedScores);
    }
    if (roundStat) setRoundHistory((h) => [...h, roundStat]);
    setRoundsPlayed((r) => r + 1);
    setStep(5);
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur border-b border-neutral-800">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-center">
          <h1 className="text-white font-black text-2xl sm:text-3xl tracking-widest">
            IMP<span className="text-orange-500">O</span>STER
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 pb-10">

        {step === 1 && <SelectPlayers onNext={(names) => { setPlayers(names); setStep(2); }} />}

        {step === 2 && (
          <div className="flex flex-col items-center mt-8 animate-fadeIn w-full">
            <h2 className="text-lg sm:text-xl font-black mb-1 uppercase tracking-widest text-white">Select Mode</h2>
            <p className="text-neutral-500 text-sm mb-6">How should the imposter play?</p>

            <div className="grid grid-cols-1 gap-3 w-full mb-8">
              {[
                { mode: 1, title: "BLUFF", desc: "Imposter knows they're the imposter and must bluff with a fake hint." },
                { mode: 2, title: "UNDERCOVER", desc: "Imposter gets a different word — they don't know they're the imposter!" },
              ].map(({ mode, title, desc }) => (
                <button
                  key={mode}
                  onClick={() => { setGameMode(mode); setStep(3); }}
                  className={`p-5 bg-neutral-800 border-2 rounded-2xl transition-all text-left group active:scale-[0.98]
                    ${gameMode === mode ? "border-orange-500" : "border-neutral-700 hover:border-neutral-500"}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-orange-500 font-black text-base sm:text-lg">MODE {mode}: {title}</p>
                    <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${gameMode === mode ? "bg-orange-500 border-orange-500" : "border-neutral-600"}`} />
                  </div>
                  <p className="text-neutral-400 text-sm leading-relaxed">{desc}</p>
                </button>
              ))}
            </div>

            {/* Round selector */}
            <div className="w-full bg-neutral-800 rounded-2xl p-5 mb-8">
              <p className="text-center text-white text-sm font-black uppercase tracking-widest mb-4">
                Rounds: <span className="text-orange-500">{totalRounds}</span>
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => setTotalRounds(n)}
                    className={`w-10 h-10 rounded-full font-black text-sm transition-all active:scale-90 ${
                      totalRounds === n
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-900/40"
                        : "bg-neutral-700 text-neutral-400 hover:bg-neutral-600"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(1)}
              className="text-neutral-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors py-2"
            >
              ← Back to Players
            </button>
          </div>
        )}

        {step === 3 && <SelectCategory onBack={() => setStep(2)} onStart={handleStartGame} />}

        {step === 4 && gameData && (
          <Game
            key={gameKey}
            players={players}
            gameData={gameData}
            currentRound={currentRound}
            totalRounds={totalRounds}
            scores={scores}
            onNextRound={handleNextRound}
            onEndGame={handleEndGame}
            onReset={handleFullReset}
          />
        )}

        {step === 5 && (
          <Leaderboard
            players={players}
            scores={scores}
            roundsPlayed={roundsPlayed}
            totalRounds={totalRounds}
            roundHistory={roundHistory}
            onReset={handleFullReset}
          />
        )}
      </main>
    </div>
  );
}

export default App;
