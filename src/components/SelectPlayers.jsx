import { useState, useEffect } from "react";

function SelectPlayers({ onNext }) {
  const [count, setCount] = useState(() => {
    const saved = localStorage.getItem("imposterCount");
    return saved ? parseInt(saved) : 3;
  });

  const [names, setNames] = useState(() => {
    const saved = localStorage.getItem("imposterNames");
    return saved ? JSON.parse(saved) : ["Player 1", "Player 2", "Player 3"];
  });

  const [error, setError] = useState(false);

  useEffect(() => {
    localStorage.setItem("imposterCount", count);
    localStorage.setItem("imposterNames", JSON.stringify(names));
    if (error) setError(false);
  }, [count, names]);

  useEffect(() => {
    if (count > names.length) {
      setNames([...names, `Player ${count}`]);
    } else if (count < names.length) {
      setNames(names.slice(0, count));
    }
  }, [count]);

  const updateName = (index, val) => {
    const updated = [...names];
    updated[index] = val;
    setNames(updated);
  };

  const handleNext = () => {
    if (names.some((n) => n.trim() === "")) {
      setError(true);
    } else {
      onNext(names);
    }
  };

  return (
    <div className="flex flex-col items-center mt-8 w-full animate-fadeIn">
      <h2 className="text-lg sm:text-xl font-black uppercase tracking-widest text-white mb-1">Players</h2>
      <p className="text-neutral-500 text-sm mb-6">Set up who's playing</p>

      {/* Counter */}
      <div className="flex items-center gap-6 mb-8">
        <button
          onClick={() => count > 3 && setCount(count - 1)}
          className={`w-12 h-12 rounded-full border-2 font-black text-2xl flex items-center justify-center transition-all active:scale-90 ${
            count > 3 ? "border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white" : "border-neutral-700 text-neutral-700 cursor-not-allowed"
          }`}
        >
          −
        </button>
        <div className="text-center">
          <span className="text-5xl font-black text-white">{count}</span>
          <p className="text-neutral-500 text-xs uppercase tracking-widest mt-1">players</p>
        </div>
        <button
          onClick={() => count < 10 && setCount(count + 1)}
          className={`w-12 h-12 rounded-full border-2 font-black text-2xl flex items-center justify-center transition-all active:scale-90 ${
            count < 10 ? "border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white" : "border-neutral-700 text-neutral-700 cursor-not-allowed"
          }`}
        >
          +
        </button>
      </div>

      {/* Name inputs */}
      <div className="w-full space-y-2 mb-6">
        {names.map((name, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="text-neutral-600 font-black text-sm w-6 text-right flex-shrink-0">{index + 1}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => updateName(index, e.target.value)}
              className={`flex-1 px-4 py-3 bg-neutral-800 border rounded-xl text-white outline-none transition-colors text-sm font-medium ${
                error && name.trim() === ""
                  ? "border-red-500 bg-red-900/10"
                  : "border-neutral-700 focus:border-orange-500"
              }`}
              placeholder={`Player ${index + 1}`}
            />
          </div>
        ))}
      </div>

      {error && (
        <p className="text-red-400 text-sm font-bold mb-4 flex items-center gap-2">
          <span>⚠️</span> All player names are required
        </p>
      )}

      <button
        onClick={handleNext}
        className="w-full bg-orange-500 hover:bg-orange-400 active:scale-95 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-orange-900/30 uppercase tracking-widest text-sm"
      >
        Next →
      </button>
    </div>
  );
}

export default SelectPlayers;
