function Leaderboard({ players, scores, roundsPlayed, totalRounds, roundHistory = [], onReset }) {
  const sorted = [...players].sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
  const topScore = scores[sorted[0]] || 0;
  const medals = ["🥇", "🥈", "🥉"];
  const winners = sorted.filter((p) => (scores[p] || 0) === topScore);
  const isTie = winners.length > 1;
  const completedRounds = roundsPlayed ?? totalRounds;

  // ── COMPUTE STATS PER PLAYER ──────────────────────────────────────
  const stats = {};
  players.forEach((p) => {
    stats[p] = {
      timesImposter: 0,
      timesCaught: 0,
      timesSurvived: 0,
      timesGuessedWord: 0,
      correctVotes: 0,
      wronglyBlamed: 0,
    };
  });

  roundHistory.forEach((r) => {
    // Imposter stats — r.imposter may be "Ali" or "Ali & Omar"
    const imposterNamesInRound = r.imposter ? r.imposter.split(" & ") : [];
    imposterNamesInRound.forEach((imp) => {
      if (stats[imp]) {
        stats[imp].timesImposter += 1;
        if (r.caught) stats[imp].timesCaught += 1;
        else stats[imp].timesSurvived += 1;
        if (r.guessedCorrectly) stats[imp].timesGuessedWord += 1;
      }
    });
    // Correct voters
    r.correctVoters?.forEach((voter) => {
      if (stats[voter]) stats[voter].correctVotes += 1;
    });
    // Wrongly blamed
    if (r.wronglyBlamed && stats[r.wronglyBlamed]) {
      stats[r.wronglyBlamed].wronglyBlamed += 1;
    }
  });

  // ── AWARD BADGES ──────────────────────────────────────────────────
  // Best detective — most correct votes
  const maxCorrect = Math.max(...players.map((p) => stats[p].correctVotes));
  const bestDetectives = maxCorrect > 0 ? players.filter((p) => stats[p].correctVotes === maxCorrect) : [];

  // Master imposter — survived as imposter the most
  const maxSurvived = Math.max(...players.map((p) => stats[p].timesSurvived));
  const masterImposters = maxSurvived > 0 ? players.filter((p) => stats[p].timesSurvived === maxSurvived) : [];

  // Scapegoat — wrongly blamed the most
  const maxBlamed = Math.max(...players.map((p) => stats[p].wronglyBlamed));
  const scapegoats = maxBlamed > 0 ? players.filter((p) => stats[p].wronglyBlamed === maxBlamed) : [];

  return (
    <div className="flex flex-col items-center mt-8 w-full pb-10 animate-fadeIn">
      {/* Header */}
      <div className="text-5xl sm:text-6xl mb-3">🏆</div>
      <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter mb-1">
        Final Scores
      </h2>
      <p className="text-neutral-500 text-sm mb-6">
        {completedRounds} round{completedRounds !== 1 ? "s" : ""} played
      </p>

      {/* Winner card */}
      <div className="w-full bg-gradient-to-br from-orange-500/15 to-yellow-500/5 border-2 border-orange-500/40 rounded-2xl px-5 py-5 mb-6 text-center shadow-[0_0_40px_rgba(249,115,22,0.1)]">
        <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest mb-2">
          {isTie ? "🤝 It's a Tie!" : "Winner"}
        </p>
        <p className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter leading-tight">
          {isTie ? winners.join(" & ") : sorted[0]}
        </p>
        <p className="text-orange-400 font-black text-2xl mt-1">{topScore} pts</p>
      </div>

      {/* Rankings */}
      <div className="w-full rounded-2xl border border-neutral-800 overflow-hidden mb-6">
        {sorted.map((name, i) => {
          const pts = scores[name] || 0;
          const isWinner = pts === topScore;
          const barWidth = topScore > 0 ? Math.round((pts / topScore) * 100) : 0;
          return (
            <div key={name} className={`px-4 py-4 border-b border-neutral-800 last:border-0 ${isWinner ? "bg-orange-500/5" : ""}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-base w-7 flex-shrink-0 text-center">
                    {i < 3 ? medals[i] : <span className="text-neutral-600 font-black text-xs">#{i + 1}</span>}
                  </span>
                  <span className={`font-bold text-sm truncate ${isWinner ? "text-white" : "text-neutral-300"}`}>{name}</span>
                </div>
                <span className={`font-black text-sm flex-shrink-0 ml-2 ${isWinner ? "text-orange-400" : "text-neutral-500"}`}>
                  {pts} pts
                </span>
              </div>
              <div className="overflow-hidden rounded-full bg-neutral-800 h-1.5 ml-10 mr-1">
                <div
                  className={`h-1.5 rounded-full transition-all duration-700 ${isWinner ? "bg-orange-500" : "bg-neutral-600"}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── POST-GAME STATS ── */}
      {roundHistory.length > 0 && (
        <>
          {/* Badges */}
          {(bestDetectives.length > 0 || masterImposters.length > 0 || scapegoats.length > 0) && (
            <div className="w-full mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-neutral-800" />
                <p className="text-neutral-500 text-xs font-black uppercase tracking-widest">Awards</p>
                <div className="h-px flex-1 bg-neutral-800" />
              </div>
              <div className="grid grid-cols-1 gap-2">
                {bestDetectives.length > 0 && (
                  <div className="flex items-center gap-3 bg-neutral-800 rounded-2xl px-4 py-3 border border-neutral-700">
                    <span className="text-2xl flex-shrink-0">🕵️</span>
                    <div className="min-w-0">
                      <p className="text-yellow-400 font-black text-xs uppercase tracking-wider">Best Detective</p>
                      <p className="text-white font-bold text-sm truncate">{bestDetectives.join(", ")}</p>
                      <p className="text-neutral-500 text-xs">{maxCorrect} correct vote{maxCorrect !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                )}
                {masterImposters.length > 0 && (
                  <div className="flex items-center gap-3 bg-neutral-800 rounded-2xl px-4 py-3 border border-neutral-700">
                    <span className="text-2xl flex-shrink-0">😈</span>
                    <div className="min-w-0">
                      <p className="text-red-400 font-black text-xs uppercase tracking-wider">Master Imposter</p>
                      <p className="text-white font-bold text-sm truncate">{masterImposters.join(", ")}</p>
                      <p className="text-neutral-500 text-xs">survived {maxSurvived} time{maxSurvived !== 1 ? "s" : ""} as imposter</p>
                    </div>
                  </div>
                )}
                {scapegoats.length > 0 && (
                  <div className="flex items-center gap-3 bg-neutral-800 rounded-2xl px-4 py-3 border border-neutral-700">
                    <span className="text-2xl flex-shrink-0">🐑</span>
                    <div className="min-w-0">
                      <p className="text-purple-400 font-black text-xs uppercase tracking-wider">Scapegoat</p>
                      <p className="text-white font-bold text-sm truncate">{scapegoats.join(", ")}</p>
                      <p className="text-neutral-500 text-xs">wrongly blamed {maxBlamed} time{maxBlamed !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Per-player stats */}
          <div className="w-full mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-neutral-800" />
              <p className="text-neutral-500 text-xs font-black uppercase tracking-widest">Player Stats</p>
              <div className="h-px flex-1 bg-neutral-800" />
            </div>
            <div className="w-full rounded-2xl border border-neutral-800 overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-5 px-4 py-2 bg-neutral-800/80 border-b border-neutral-700">
                <div className="col-span-2 text-[10px] font-black uppercase tracking-wider text-neutral-500">Player</div>
                <div className="text-[10px] font-black uppercase tracking-wider text-neutral-500 text-center" title="Times as Imposter">🎭</div>
                <div className="text-[10px] font-black uppercase tracking-wider text-neutral-500 text-center" title="Correct Votes">🎯</div>
                <div className="text-[10px] font-black uppercase tracking-wider text-neutral-500 text-center" title="Times Survived as Imposter">🛡️</div>
              </div>
              {sorted.map((name) => {
                const s = stats[name];
                return (
                  <div key={name} className="grid grid-cols-5 px-4 py-3 border-b border-neutral-800 last:border-0 items-center">
                    <div className="col-span-2 font-bold text-white text-sm truncate">{name}</div>
                    <div className="text-center">
                      <span className={`font-black text-sm ${s.timesImposter > 0 ? "text-red-400" : "text-neutral-600"}`}>
                        {s.timesImposter}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className={`font-black text-sm ${s.correctVotes > 0 ? "text-green-400" : "text-neutral-600"}`}>
                        {s.correctVotes}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className={`font-black text-sm ${s.timesSurvived > 0 ? "text-orange-400" : "text-neutral-600"}`}>
                        {s.timesSurvived}
                      </span>
                    </div>
                  </div>
                );
              })}
              {/* Legend */}
              <div className="px-4 py-2 bg-neutral-900/50 flex gap-4 flex-wrap">
                <span className="text-[10px] text-neutral-600">🎭 As Imposter</span>
                <span className="text-[10px] text-neutral-600">🎯 Correct Votes</span>
                <span className="text-[10px] text-neutral-600">🛡️ Survived</span>
              </div>
            </div>
          </div>
        </>
      )}

      <button
        onClick={onReset}
        className="w-full bg-orange-500 hover:bg-orange-400 active:scale-95 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-orange-900/30 uppercase tracking-widest text-sm"
      >
        Play Again
      </button>
    </div>
  );
}

export default Leaderboard;
