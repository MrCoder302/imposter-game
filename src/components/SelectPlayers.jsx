import { useState, useEffect } from "react"

function SelectPlayers({onNext}) {
  const [count, setCount] = useState(3)
  const [names, setNames] = useState(["Player 1", "Player 2", "Player 3"])

  // Effect to sync names array with the count
  useEffect(() => {
    if (count > names.length) {
      // Adding players
      setNames([...names, `Player ${count}`])
    } else if (count < names.length) {
      // Removing players
      setNames(names.slice(0, count))
    }
  }, [count])

  const updateName = (index, val) => {
    const newNames = [...names]
    newNames[index] = val
    setNames(newNames)
  }

  return (
    <div className="mt-5 flex flex-col items-center animate-fadeIn">
      <span className="text-white text-lg font-medium">Select Number of Players</span>
      
      {/* Number Selector UI */}
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

      {/* Dynamic Name Inputs */}
      <div className="w-full max-w-xs space-y-3 mt-4">
        {names.map((name, index) => (
          <input
            key={index}
            type="text"
            value={name}
            onChange={(e) => updateName(index, e.target.value)}
            className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-orange-500 outline-none transition-colors"
            placeholder={`Enter name for player ${index + 1}`}
          />
        ))}
      </div>

      <button 
        onClick={() => onNext(names)}
        className="mt-10 bg-orange-500 text-white font-bold py-3 px-10 rounded-full hover:bg-orange-600 transition-all shadow-lg shadow-orange-900/20 mb-6"
      >
        NEXT
      </button>
    </div>
  )
}

export default SelectPlayers