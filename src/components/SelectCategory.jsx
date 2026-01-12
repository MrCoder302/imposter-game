import { useState, useEffect } from "react";

function SelectCategory({ onBack, onStart }) {
  const [categories, setCategories] = useState([]);
  // Change state to an Array
  const [selectedList, setSelectedList] = useState([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api.json")
      .then((res) => res.json())
      .then((data) => {
        setCategories(Object.keys(data));
        setLoading(false);
      });
  }, []);

  // Function to toggle selection
  const toggleCategory = (cat) => {
    if (selectedList.includes(cat)) {
      // Remove if already there
      setSelectedList(selectedList.filter((item) => item !== cat));
    } else {
      // Add if not there
      setSelectedList([...selectedList, cat]);
    }
  };

  const formatName = (name) => name.replace("_", " ").toUpperCase();

  if (loading) return <div className="text-white mt-10">Loading...</div>;

  return (
    <div className="mt-8 flex flex-col items-center w-full px-4 animate-fadeIn">
      <h2 className="text-white text-xl mb-2 tracking-widest font-bold">SELECT CATEGORIES</h2>
      <p className="text-neutral-500 text-sm mb-6">You can pick more than one</p>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {categories.map((cat) => {
          const isSelected = selectedList.includes(cat);
          return (
            <div
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 text-center font-bold text-sm
                ${isSelected
                  ? "bg-orange-500 border-orange-300 text-white scale-105 shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                  : "bg-neutral-800 border-neutral-700 text-neutral-400"
                }`}
            >
              {formatName(cat)}
              {isSelected && <span className="ml-2">✓</span>}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 mt-10 w-full max-w-xs">
        <button
          onClick={() => selectedList.length > 0 && onStart(selectedList)}
          disabled={selectedList.length === 0}
          className={`py-4 rounded-full font-black text-lg transition-all
            ${selectedList.length > 0 
              ? "bg-green-500 text-white shadow-lg active:scale-95" 
              : "bg-neutral-700 text-neutral-500 cursor-not-allowed"}`}
        >
          START GAME ({selectedList.length})
        </button>
        <button onClick={onBack} className="text-neutral-500 font-bold mb-5">← GO BACK</button>
      </div>
    </div>
  );
}

export default SelectCategory;