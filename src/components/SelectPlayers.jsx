import { useState, useEffect } from "react"

function SelectPlayers({onNext}) {
  const [count, setCount] = useState(() => {
    const savedCount = localStorage.getItem("imposterCount");
    return savedCount ? parseInt(savedCount) : 3;
  });

  const [names, setNames] = useState(() => {
    const savedNames = localStorage.getItem("imposterNames");
    return savedNames ? JSON.parse(savedNames) : ["Player 1", "Player 2", "Player 3"];
  });

  // Track if user tried to submit without filling names
  const [error, setError] = useState(false);

  useEffect(() => {
    localStorage.setItem("imposterCount", count);
    localStorage.setItem("imposterNames", JSON.stringify(names));
    // Reset error when user starts typing
    if (error) setError(false);
  }, [count, names]);

  useEffect(() => {
    if (count > names.length) {
      setNames([...names, `Player ${count}`])
    } else if (count < names.length) {
      setNames(names.slice(0, count))
    }
  }, [count])

  const updateName = (index, val) => {
    const newNames = [...names]
    newNames[index] = val
    setNames(newNames)
  }

  // VALIDATION FUNCTION
  const handleNext = () => {
    // Check if any name is empty or just whitespace
    const hasEmptyName = names.some(name => name.trim() === "");
    
    if (hasEmptyName) {
      setError(true);
    } else {
      onNext(names);
    }
  }

  return (
    <div className="mt-5 flex flex-col items-center animate-fadeIn">
      <span className="text-white text-lg font-medium">Select Number of Players</span>
      
      <div className="flex flex-col items-center my-4">
        <span 
          onClick={() => count < 10 && setCount(count + 1)} 
          className="text-orange-500 font-bold text-5xl cursor-pointer select-none active:scale-90 transition-transform"
        >
          ^
        </span>
        
        <input 
          className="outline-0 p-2 w-20 bg-white text-black rounded-md font-bold text-center text-2xl my-2" 
          value={count} 
          type="number" 
          disabled
        />
        
        <span 
          onClick={() => count > 3 && setCount(count - 1)} 
          className="rotate-180 text-orange-500 font-bold text-5xl cursor-pointer select-none active:scale-90 transition-transform"
        >
          ^
        </span>
      </div>

      <div className="w-full max-w-xs space-y-3 mt-4">
        {names.map((name, index) => (
          <input
            key={index}
            type="text"
            value={name}
            onChange={(e) => updateName(index, e.target.value)}
            className={`w-full p-3 bg-neutral-800 border rounded-lg text-white outline-none transition-colors ${
              error && name.trim() === "" ? "border-red-500" : "border-neutral-700 focus:border-orange-500"
            }`}
            placeholder={`Enter name for player ${index + 1}`}
          />
        ))}
      </div>

      {error && <p className="text-red-500 mt-2 text-sm">All names are required!</p>}

      <button 
        onClick={handleNext}
        className="mt-10 bg-orange-500 text-white font-bold py-3 px-10 rounded-full hover:bg-orange-600 transition-all shadow-lg shadow-orange-900/20 mb-6"
      >
        NEXT
      </button>
    </div>
  )
}

export default SelectPlayers