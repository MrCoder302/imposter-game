import { useState, useEffect } from "react";

function SelectCategory({ onBack, onStart }) {
  const [categories, setCategories] = useState([]);
  const [selectedList, setSelectedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customInput, setCustomInput] = useState("");
  const [customWords, setCustomWords] = useState([]);
  const [customError, setCustomError] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api.json`)
      .then((res) => res.json())
      .then((data) => {
        setCategories(Object.keys(data));
        setLoading(false);
      });
  }, []);

  const toggleCategory = (cat) => {
    setSelectedList((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleAddCustomWord = () => {
    const word = customInput.trim();
    if (!word) return;
    if (customWords.map((w) => w.toLowerCase()).includes(word.toLowerCase())) {
      setCustomError("Already added!");
      return;
    }
    setCustomWords((prev) => [...prev, word]);
    setCustomInput("");
    setCustomError("");
  };

  const removeCustomWord = (word) => setCustomWords((prev) => prev.filter((w) => w !== word));

  const canStart = selectedList.length > 0 || customWords.length >= 2;
  const formatName = (name) => name.replace(/_/g, " ").toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center mt-20">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center mt-8 w-full animate-fadeIn pb-6">
      <h2 className="text-lg sm:text-xl font-black uppercase tracking-widest text-white mb-1">Categories</h2>
      <p className="text-neutral-500 text-sm mb-6">Pick one or more to draw words from</p>

      {/* Category grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full mb-8">
        {categories.map((cat) => {
          const isSelected = selectedList.includes(cat);
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`py-3 px-2 rounded-xl border-2 transition-all duration-200 text-center font-bold text-xs sm:text-sm active:scale-95 ${
                isSelected
                  ? "bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-900/30"
                  : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-500"
              }`}
            >
              {isSelected && <span className="mr-1">✓</span>}
              {formatName(cat)}
            </button>
          );
        })}
      </div>

      {/* Custom words */}
      <div className="w-full mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-neutral-800" />
          <p className="text-neutral-500 text-xs font-black uppercase tracking-widest">Custom Words</p>
          <div className="h-px flex-1 bg-neutral-800" />
        </div>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={customInput}
            onChange={(e) => { setCustomInput(e.target.value); setCustomError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleAddCustomWord()}
            placeholder="Add your own word..."
            className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 focus:border-orange-500 rounded-xl text-white outline-none text-sm transition-colors"
          />
          <button
            onClick={handleAddCustomWord}
            disabled={!customInput.trim()}
            className={`px-4 py-3 rounded-xl font-black text-sm transition-all active:scale-95 flex-shrink-0 ${
              customInput.trim()
                ? "bg-orange-500 hover:bg-orange-400 text-white"
                : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
            }`}
          >
            + Add
          </button>
        </div>

        {customError && <p className="text-red-400 text-xs mb-2 font-bold">⚠️ {customError}</p>}

        {customWords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {customWords.map((word) => (
              <div key={word} className="flex items-center gap-1.5 bg-neutral-800 border border-orange-500/30 px-3 py-1.5 rounded-full">
                <span className="text-white text-xs font-bold">{word}</span>
                <button
                  onClick={() => removeCustomWord(word)}
                  className="text-neutral-500 hover:text-red-400 text-xs font-black transition-colors leading-none"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {customWords.length === 1 && selectedList.length === 0 && (
          <p className="text-yellow-500 text-xs mt-3 font-bold">⚠️ Add at least 2 custom words, or select a category too.</p>
        )}
      </div>

      {/* Actions */}
      <button
        onClick={() => canStart && onStart(selectedList, customWords)}
        disabled={!canStart}
        className={`w-full py-4 rounded-2xl font-black text-base uppercase tracking-widest transition-all mb-3 ${
          canStart
            ? "bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-900/20 active:scale-95"
            : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
        }`}
      >
        {canStart
          ? `Start Game${customWords.length > 0 ? ` (+${customWords.length} custom)` : ""}`
          : "Select at least one category"}
      </button>

      <button
        onClick={onBack}
        className="text-neutral-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors py-2"
      >
        ← Go Back
      </button>
    </div>
  );
}

export default SelectCategory;
