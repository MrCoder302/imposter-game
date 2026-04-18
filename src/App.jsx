import { useState } from "react";
import SelectPlayers from "./components/SelectPlayers.jsx";
import SelectCategory from "./components/SelectCategory.jsx";
import Game from "./components/Game.jsx";
import Leaderboard from "./components/Leaderboard.jsx";

const DIFFICULTIES = [
  { level: 1, label: "Easy",   emoji: "🟢", desc: "Common everyday words — great for beginners" },
  { level: 2, label: "Medium", emoji: "🟡", desc: "Moderate words — the default experience" },
  { level: 3, label: "Hard",   emoji: "🔴", desc: "Tricky and obscure words — for experienced players" },
];

// difficulty 1 → only "easy" tier
// difficulty 2 → "easy" + "medium" tiers
// difficulty 3 → all tiers
const TIERS = { 1: ["easy"], 2: ["easy", "medium"], 3: ["easy", "medium", "hard"] };

function App() {
  const [step, setStep] = useState(1);
  const [players, setPlayers] = useState([]);
  const [gameMode, setGameMode] = useState(1);
  const [difficulty, setDifficulty] = useState(2);
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
  // Cache fetched data so we only fetch once
  const [wordData, setWordData] = useState(null);

  const initScores = (playerNames) => {
    const initial = {};
    playerNames.forEach((name) => (initial[name] = 0));
    return initial;
  };

  const fetchWordData = () => {
    if (wordData) return Promise.resolve(wordData);
    return fetch(`${import.meta.env.BASE_URL}api.json`)
      .then((res) => res.json())
      .then((data) => { setWordData(data); return data; });
  };

  const buildPool = (allData, cats, diff, extraWords = []) => {
    const tiers = TIERS[diff] || TIERS[2];
    let pool = [];
    cats.forEach((cat) => {
      const catData = allData[cat] || {};
      tiers.forEach((tier) => {
        if (catData[tier]) pool = [...pool, ...catData[tier]];
      });
    });
    if (extraWords.length > 0) pool = [...pool, ...extraWords];
    return pool;
  };

  const pickGameData = (cats, mode, playerList, usedWordsSet, extraWords = [], diff = 2, allData) => {
    const pool = buildPool(allData, cats, diff, extraWords);
    const freshPool = pool.filter((w) => !usedWordsSet.has(w));
    const activePool = freshPool.length >= 2 ? freshPool : pool;

    const pickUnique = (exclude = null) => {
      const filtered = exclude ? activePool.filter((w) => w !== exclude) : activePool;
      return filtered[Math.floor(Math.random() * filtered.length)];
    };

    const word1 = pickUnique();
    let word2 = "???";
    if (mode === 2) word2 = pickUnique(word1);

    const idx1 = Math.floor(Math.random() * playerList.length);
    let idx2 = null;
    if (playerList.length >= 6) {
      do { idx2 = Math.floor(Math.random() * playerList.length); }
      while (idx2 === idx1);
    }

    return { secretWord: word1, imposterWord: word2, imposterIndex: idx1, imposterIndex2: idx2, mode, difficulty: diff };
  };

  const handleStartGame = (cats, extraWords) => {
    setSelectedCategories(cats);
    setCustomWords(extraWords || []);
    const freshUsed = new Set();
    setUsedWords(freshUsed);

    fetchWordData().then((allData) => {
      const data = pickGameData(cats, gameMode, players, freshUsed, extraWords, difficulty, allData);
      setUsedWords((prev) => new Set([...prev, data.secretWord]));
      setGameData(data);
      setCurrentRound(1);
      setRoundsPlayed(0);
      setRoundHistory([]);
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
      fetchWordData().then((allData) => {
        const data = pickGameData(selectedCategories, gameMode, players, usedWords, customWords, difficulty, allData);
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

  const selectedDiff = DIFFICULTIES.find((d) => d.level === difficulty);

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans">
      <header className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur border-b border-neutral-800">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-center">
          <h1 className="text-white font-black text-2xl sm:text-3xl tracking-widest">
            IMP<span className="text-orange-500">O</span>STER
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-10">

        {step === 1 && <SelectPlayers onNext={(names) => { setPlayers(names); setStep(2); }} />}

        {step === 2 && (
          <div className="flex flex-col items-center mt-8 animate-fadeIn w-full">
            <h2 className="text-lg sm:text-xl font-black mb-1 uppercase tracking-widest text-white">Game Setup</h2>
            <p className="text-neutral-500 text-sm mb-6">Configure your round</p>

            {/* Mode */}
            <p className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-2 self-start">Mode</p>
            <div className="grid grid-cols-1 gap-3 w-full mb-6">
              {[
                { mode: 1, title: "BLUFF", desc: "Imposter knows they're the imposter and must bluff with a fake hint." },
                { mode: 2, title: "UNDERCOVER", desc: "Imposter gets a different word — they don't know they're the imposter!" },
              ].map(({ mode, title, desc }) => (
                <button
                  key={mode}
                  onClick={() => setGameMode(mode)}
                  className={`p-4 bg-neutral-800 border-2 rounded-2xl transition-all text-left active:scale-[0.98]
                    ${gameMode === mode ? "border-orange-500" : "border-neutral-700 hover:border-neutral-600"}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-orange-500 font-black text-sm sm:text-base">MODE {mode}: {title}</p>
                    <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${gameMode === mode ? "bg-orange-500 border-orange-500" : "border-neutral-600"}`} />
                  </div>
                  <p className="text-neutral-400 text-xs leading-relaxed">{desc}</p>
                </button>
              ))}
            </div>

            {/* Difficulty */}
            <p className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-2 self-start">Difficulty</p>
            <div className="grid grid-cols-3 gap-2 w-full mb-3">
              {DIFFICULTIES.map(({ level, label, emoji }) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`py-3 px-2 rounded-xl border-2 text-center transition-all active:scale-95 ${
                    difficulty === level
                      ? level === 1 ? "bg-green-900/30 border-green-500 text-white"
                        : level === 2 ? "bg-yellow-900/30 border-yellow-500 text-white"
                        : "bg-red-900/30 border-red-500 text-white"
                      : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600"
                  }`}
                >
                  <div className="text-xl mb-1">{emoji}</div>
                  <p className="font-black text-xs uppercase tracking-wider">{label}</p>
                </button>
              ))}
            </div>
            <div className="w-full bg-neutral-800/60 rounded-xl px-4 py-2.5 mb-6 border border-neutral-700">
              <p className="text-neutral-400 text-xs text-center">
                {selectedDiff.emoji} <span className="font-bold text-white">{selectedDiff.label}:</span> {selectedDiff.desc}
              </p>
            </div>

            {/* Rounds */}
            <p className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-2 self-start">Rounds</p>
            <div className="w-full bg-neutral-800 rounded-2xl p-4 mb-8">
              <p className="text-center text-white text-sm font-black mb-3">
                <span className="text-orange-500">{totalRounds}</span> rounds
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
              onClick={() => setStep(3)}
              className="w-full bg-orange-500 hover:bg-orange-400 active:scale-95 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-orange-900/30 uppercase tracking-widest text-sm mb-3"
            >
              Next →
            </button>
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
