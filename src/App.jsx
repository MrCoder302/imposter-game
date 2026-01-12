import { useState } from "react";
import SelectPlayers from "./components/SelectPlayers.jsx";
import SelectCategory from "./components/SelectCategory.jsx";
import Game from "./components/Game.jsx";

function App() {
  const [step, setStep] = useState(1);
  const [players, setPlayers] = useState([]);
  const [gameData, setGameData] = useState(null);

  const handleStartGame = (selectedCategories) => {
    fetch("/api.json")
      .then((res) => res.json())
      .then((allData) => {
        let pool = [];
        selectedCategories.forEach((cat) => {
          pool = [...pool, ...allData[cat]];
        });

        // Pick 2 unique words
        const word1 = pool[Math.floor(Math.random() * pool.length)];
        let word2 = pool[Math.floor(Math.random() * pool.length)];
        while (word1 === word2) {
          word2 = pool[Math.floor(Math.random() * pool.length)];
        }

        setGameData({
          secretWord: word1,
          imposterWord: word2,
          imposterIndex: Math.floor(Math.random() * players.length),
        });
        setStep(3);
      });
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-neutral-900 text-white font-sans">
      <h1 className="text-white font-bold text-4xl mt-10 border-b-2 border-orange-500 pb-2">
        IMPOSTER
      </h1>

      {step === 1 && <SelectPlayers onNext={(names) => { setPlayers(names); setStep(2); }} />}
      {step === 2 && <SelectCategory onBack={() => setStep(1)} onStart={handleStartGame} />}
      {step === 3 && <Game players={players} gameData={gameData} onReset={() => setStep(1)} />}
    </div>
  );
}

export default App;