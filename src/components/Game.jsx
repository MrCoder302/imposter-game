import { useState, useRef, useEffect } from "react";

const PHASE = {
  REVEAL: "reveal",
  DISCUSS: "discuss",
  VOTE: "vote",
  GUESS: "guess",
  RESULT: "result",
};

// ── SOUNDS ───────────────────────────────────────────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
const getCtx = () => { if (!audioCtx) audioCtx = new AudioCtx(); return audioCtx; };
const playTone = (freq, type, duration, vol = 0.3, delay = 0) => {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  } catch (e) {}
};
const sounds = {
  flip: () => playTone(600, "sine", 0.08, 0.2),
  vote: () => { playTone(440, "sine", 0.1, 0.2); playTone(550, "sine", 0.1, 0.15, 0.1); },
  caught: () => { [300, 200, 150].forEach((f, i) => playTone(f, "sawtooth", 0.3, 0.4, i * 0.15)); },
  escape: () => { [200, 250, 300, 400].forEach((f, i) => playTone(f, i < 2 ? "sawtooth" : "sine", 0.3, 0.3, i * 0.13)); },
  win: () => { [523, 659, 784, 1047].forEach((f, i) => playTone(f, "sine", 0.2, 0.3, i * 0.12)); },
  correct: () => { playTone(784, "sine", 0.15, 0.3); playTone(1047, "sine", 0.2, 0.3, 0.15); },
  wrong: () => { playTone(200, "sawtooth", 0.25, 0.4); playTone(180, "sawtooth", 0.25, 0.35, 0.15); },
};

function Game({ players, gameData, currentRound, totalRounds, scores, onNextRound, onEndGame, onReset }) {
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [phase, setPhase] = useState(PHASE.REVEAL);
  const [votingPlayer, setVotingPlayer] = useState(0);
  const [currentVoteSelection, setCurrentVoteSelection] = useState(null);
  const [voteError, setVoteError] = useState(false);
  const voteCountsRef = useRef({});
  const voteLogRef = useRef([]);
  const [guessInput, setGuessInput] = useState("");
  const [guessResult, setGuessResult] = useState(null);
  const [roundResult, setRoundResult] = useState(null);

  // Support 1 or 2 imposters
  const imposterIndices = [gameData.imposterIndex, gameData.imposterIndex2].filter((i) => i != null);
  const imposterNames = imposterIndices.map((i) => players[i]);
  const isPlayerImposter = (name) => imposterNames.includes(name);
  const imposterLabel = imposterNames.join(" & ");

  // caughtName = the specific imposter who was voted out (null if nobody caught)
  const buildDeltas = (imposterCaught, guessedCorrectly, caughtName = null) => {
    const deltas = {};
    players.forEach((p) => (deltas[p] = 0));
    if (!imposterCaught) {
      // No imposter caught — all imposters get +3
      imposterNames.forEach((n) => { deltas[n] = 3; });
    } else if (guessedCorrectly) {
      // Caught imposter guessed the word — they get +2 consolation
      // Other imposter (if any) still gets +3 for surviving
      imposterNames.forEach((n) => {
        if (n === caughtName) deltas[n] = 2;
        else deltas[n] = 3; // uncaught partner rewards full points
      });
    } else {
      // Caught imposter gets 0, uncaught imposter gets +3, innocents get +2
      players.forEach((p) => {
        if (p === caughtName) deltas[p] = 0;
        else if (isPlayerImposter(p)) deltas[p] = 3; // uncaught partner
        else deltas[p] = 2; // innocents win
      });
    }
    return deltas;
  };

  // ── REVEAL ────────────────────────────────────────────────────────
  const handleCardClick = () => {
    if (!isRevealed) {
      sounds.flip(); setIsRevealed(true);
    } else {
      if (currentPlayer < players.length - 1) {
        sounds.flip(); setIsRevealed(false); setCurrentPlayer((p) => p + 1);
      } else {
        setPhase(PHASE.DISCUSS);
      }
    }
  };

  const isImposterCard = imposterIndices.includes(currentPlayer);
  let displayWord = isImposterCard ? gameData.imposterWord : gameData.secretWord;
  let labelText = "Secret Word";
  let cardBg = isRevealed ? "bg-white text-black" : "bg-neutral-800 text-white";
  if (isImposterCard && gameData.mode === 1) {
    displayWord = "YOU ARE THE IMPOSTER";
    labelText = "Your Identity";
    cardBg = isRevealed ? "bg-red-600 text-white" : "bg-neutral-800 text-white";
  }

  // ── VOTING ────────────────────────────────────────────────────────
  const finishVoting = (finalTallies) => {
    const totalVotes = Object.values(finalTallies).reduce((a, b) => a + b, 0);
    const skipCount = players.length - totalVotes;

    // No votes at all, or skips outnumber the highest vote count → no consensus
    if (totalVotes === 0 || skipCount > Math.max(...Object.values(finalTallies), 0)) {
      sounds.escape();
      setRoundResult({ imposterCaught: false, votedOutName: null, isTie: false, skippedVote: true, pointDeltas: buildDeltas(false, false, null), voteLog: voteLogRef.current });
      setPhase(PHASE.RESULT); return;
    }
    const maxVotes = Math.max(...Object.values(finalTallies));
    const topVoted = Object.keys(finalTallies).filter((n) => finalTallies[n] === maxVotes);

    if (topVoted.length > 1) {
      const allTopAreImposters = topVoted.every((n) => isPlayerImposter(n));
      if (allTopAreImposters) {
        // All tied players are imposters — catch them all, skip guess phase
        sounds.caught();
        const deltas = {};
        players.forEach((p) => (deltas[p] = 0));
        players.forEach((p) => { if (!isPlayerImposter(p)) deltas[p] = 2; });
        setRoundResult({
          imposterCaught: true,
          allImposters: true,
          votedOutName: topVoted.join(" & "),
          isTie: false,
          pointDeltas: deltas,
          voteLog: voteLogRef.current,
        });
        setPhase(PHASE.RESULT); return;
      }
      // Tie involves at least one innocent — no consensus
      sounds.escape();
      setRoundResult({ imposterCaught: false, votedOutName: null, isTie: true, skippedVote: false, pointDeltas: buildDeltas(false, false, null), voteLog: voteLogRef.current });
      setPhase(PHASE.RESULT); return;
    }

    const votedOut = topVoted[0];
    const imposterCaught = isPlayerImposter(votedOut);
    if (imposterCaught) {
      sounds.caught();
      setRoundResult({ imposterCaught: true, votedOutName: votedOut, isTie: false, pointDeltas: null, caughtName: votedOut, voteLog: voteLogRef.current, guessingImposter: votedOut });
      setPhase(PHASE.GUESS);
    } else {
      sounds.escape();
      setRoundResult({ imposterCaught: false, votedOutName: votedOut, isTie: false, pointDeltas: buildDeltas(false, false, null), voteLog: voteLogRef.current });
      setPhase(PHASE.RESULT);
    }
  };

  const advanceVoting = (nextIdx) => {
    setCurrentVoteSelection(null); setVoteError(false);
    if (nextIdx < players.length) { setVotingPlayer(nextIdx); }
    else { finishVoting({ ...voteCountsRef.current }); }
  };

  const handleConfirmVote = () => {
    if (!currentVoteSelection) { setVoteError(true); return; }
    sounds.vote();
    voteCountsRef.current[currentVoteSelection] = (voteCountsRef.current[currentVoteSelection] || 0) + 1;
    voteLogRef.current.push({ voter: players[votingPlayer], votedFor: currentVoteSelection });
    advanceVoting(votingPlayer + 1);
  };

  const handleSkipVote = () => {
    voteLogRef.current.push({ voter: players[votingPlayer], votedFor: null });
    advanceVoting(votingPlayer + 1);
  };

  // ── GUESS ─────────────────────────────────────────────────────────
  const handleGuessSubmit = () => {
    const correct = guessInput.trim().toLowerCase() === gameData.secretWord.toLowerCase();
    setGuessResult(correct ? "correct" : "wrong");
    correct ? sounds.correct() : sounds.wrong();
    const deltas = buildDeltas(true, correct, roundResult?.votedOutName);
    setTimeout(() => {
      setRoundResult((prev) => ({ ...prev, imposterGuessedCorrectly: correct, pointDeltas: deltas }));
      setPhase(PHASE.RESULT);
    }, 1600);
  };

  useEffect(() => {
    if (phase === PHASE.RESULT && roundResult?.imposterCaught && !roundResult?.imposterGuessedCorrectly) {
      sounds.win();
    }
  }, [phase]);

  // ── SHARED ────────────────────────────────────────────────────────
  const RoundBadge = () => (
    <div className="flex items-center gap-2 mb-4 mt-2">
      {/* Round progress bar */}
      <div className="flex gap-1">
        {Array.from({ length: totalRounds }).map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all ${
            i < currentRound - 1 ? "w-4 bg-orange-500/50" :
            i === currentRound - 1 ? "w-6 bg-orange-500" : "w-4 bg-neutral-700"
          }`} />
        ))}
      </div>
      <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
        {currentRound}/{totalRounds}
      </span>
    </div>
  );

  const ProgressDots = ({ current, total }) => (
    <div className="flex gap-1.5 mb-4">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`rounded-full transition-all duration-300 ${
          i < current ? "w-2 h-2 bg-green-500" :
          i === current ? "w-3 h-3 bg-orange-500 shadow-sm shadow-orange-500/50" :
          "w-2 h-2 bg-neutral-700"
        }`} />
      ))}
    </div>
  );

  // ── RENDER: REVEAL ────────────────────────────────────────────────
  if (phase === PHASE.REVEAL) {
    return (
      <div className="flex flex-col items-center mt-6 w-full text-center">
        <RoundBadge />

        <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-1">
          {currentPlayer + 1} of {players.length}
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-white uppercase mb-6 leading-tight">
          {players[currentPlayer]}
        </h2>

        {/* Card — responsive height using aspect ratio */}
        <div
          key={currentPlayer}
          onClick={handleCardClick}
          className={`w-full max-w-[260px] sm:max-w-[300px] aspect-[3/4] rounded-[2rem] sm:rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 shadow-2xl select-none
            ${cardBg} ${!isRevealed ? "scale-95 active:scale-90" : "active:scale-[0.98]"}
            ${isRevealed && isImposterCard && gameData.mode === 1 ? "shadow-red-900/50" : ""}`}
        >
          {!isRevealed ? (
            <div className="flex flex-col items-center">
              <div className="text-5xl sm:text-6xl mb-3">🤫</div>
              <p className="font-black tracking-widest text-[10px] opacity-40 uppercase">Tap to reveal</p>
            </div>
          ) : (
            <div className="animate-fadeIn p-5 sm:p-6 flex flex-col items-center">
              <p className="opacity-50 text-[10px] font-bold uppercase tracking-wider mb-3">{labelText}</p>
              <p className={`${gameData.mode === 1 && isImposterCard ? "text-2xl sm:text-3xl" : "text-4xl sm:text-5xl"} font-black tracking-tighter mb-10 uppercase text-center leading-tight`}>
                {displayWord}
              </p>
              <div className="bg-black/15 text-current text-[10px] py-2 px-4 rounded-full font-bold uppercase tracking-wider border border-current/15">
                Tap to hide & pass
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-neutral-600 text-[10px] uppercase font-bold tracking-widest">
          {isRevealed ? "Don't let others see!" : "Pass phone to this player"}
        </p>
      </div>
    );
  }

  // ── RENDER: DISCUSS ──────────────────────────────────────────────
  if (phase === PHASE.DISCUSS) {
    return (
      <div className="flex flex-col items-center mt-6 w-full text-center animate-fadeIn">
        <RoundBadge />

        <div className="text-5xl mb-4">💬</div>
        <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter mb-2">
          Discuss!
        </h2>
        <p className="text-neutral-400 text-sm mb-8 leading-relaxed max-w-xs">
          Everyone give a hint related to your word.<br />
          Then discuss who you think the imposter is.
        </p>

        {/* Tip cards */}
        <div className="w-full space-y-3 mb-8">
          <div className="flex items-start gap-3 bg-neutral-800 rounded-2xl px-4 py-3 text-left border border-neutral-700">
            <span className="text-xl flex-shrink-0">🗣️</span>
            <div>
              <p className="text-white font-bold text-sm">Give a one-word hint</p>
              <p className="text-neutral-500 text-xs mt-0.5">Be vague enough that the imposter can't guess the word</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-neutral-800 rounded-2xl px-4 py-3 text-left border border-neutral-700">
            <span className="text-xl flex-shrink-0">🕵️</span>
            <div>
              <p className="text-white font-bold text-sm">Watch for hesitation</p>
              <p className="text-neutral-500 text-xs mt-0.5">The imposter doesn't know the real word — their hint may be off</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-neutral-800 rounded-2xl px-4 py-3 text-left border border-neutral-700">
            <span className="text-xl flex-shrink-0">😈</span>
            <div>
              <p className="text-white font-bold text-sm">Imposter: blend in!</p>
              <p className="text-neutral-500 text-xs mt-0.5">Listen carefully and give a convincing hint to avoid suspicion</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setPhase(PHASE.VOTE)}
          className="w-full bg-orange-500 hover:bg-orange-400 active:scale-95 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-orange-900/30 uppercase tracking-widest text-sm"
        >
          Start Voting →
        </button>
      </div>
    );
  }

  // ── RENDER: VOTE ──────────────────────────────────────────────────
  if (phase === PHASE.VOTE) {
    const currentVoter = players[votingPlayer];
    return (
      <div className="flex flex-col items-center mt-6 w-full">
        <RoundBadge />
        <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter text-center mb-1">
          Who is the Imposter?
        </h2>
        <p className="text-neutral-500 text-sm mb-4 text-center">Each player votes privately</p>

        <ProgressDots current={votingPlayer} total={players.length} />

        {/* Current voter badge */}
        <div className="w-full bg-orange-500/10 border border-orange-500/25 rounded-2xl px-4 py-3 mb-5 text-center">
          <p className="text-neutral-500 text-[10px] uppercase tracking-widest font-bold mb-0.5">Now voting</p>
          <p className="text-orange-400 font-black text-lg">{currentVoter}</p>
        </div>

        {/* Player grid — 2 cols on small, up to 3 on wider */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full mb-4">
          {players.map((name, i) => {
            const isSelf = name === currentVoter;
            const isSelected = currentVoteSelection === name;
            return (
              <button
                key={i}
                disabled={isSelf}
                onClick={() => { if (!isSelf) { setCurrentVoteSelection(name); setVoteError(false); } }}
                className={`py-3 px-2 rounded-xl border-2 text-center font-bold transition-all text-sm active:scale-95 ${
                  isSelf
                    ? "bg-neutral-900 border-neutral-800 text-neutral-700 cursor-not-allowed"
                    : isSelected
                    ? "bg-red-600 border-red-400 text-white scale-105 shadow-lg shadow-red-900/30"
                    : "bg-neutral-800 border-neutral-700 text-white hover:border-neutral-500"
                }`}
              >
                <span className="block truncate">{name}</span>
                {isSelf && <span className="block text-[9px] text-neutral-700 mt-0.5 font-normal">you</span>}
              </button>
            );
          })}
        </div>

        {voteError && (
          <p className="text-red-400 text-xs font-bold mb-3 flex items-center gap-1">
            <span>⚠️</span> Select a player or skip
          </p>
        )}

        <button
          onClick={handleConfirmVote}
          className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 mb-2 text-sm ${
            currentVoteSelection
              ? "bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-900/30"
              : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
          }`}
        >
          {currentVoteSelection ? `Vote for ${currentVoteSelection} →` : "Select a player first"}
        </button>

        <button
          onClick={handleSkipVote}
          className="w-full py-3 rounded-2xl font-bold uppercase tracking-widest text-xs text-neutral-500 border border-neutral-800 hover:border-neutral-600 hover:text-neutral-400 transition-all active:scale-95"
        >
          Skip Vote
        </button>
      </div>
    );
  }

  // ── RENDER: GUESS ─────────────────────────────────────────────────
  if (phase === PHASE.GUESS) {
    return (
      <div className="flex flex-col items-center mt-6 w-full text-center">
        <RoundBadge />
        <div className="text-5xl mb-4">🎯</div>

        <div className="w-full bg-red-950/40 border border-red-500/30 rounded-2xl px-5 py-4 mb-6">
          <p className="text-red-400 font-black uppercase tracking-widest text-[10px] mb-1">Voted Out</p>
          <p className="text-white font-black text-xl">{roundResult?.guessingImposter || imposterLabel}</p>
          <p className="text-neutral-400 text-sm mt-0.5">was identified as the imposter</p>
        </div>

        <p className="text-white font-black text-lg mb-1">One Last Chance!</p>
        <p className="text-neutral-400 text-sm mb-6">
          Guess the word correctly for <span className="text-orange-400 font-bold">+2 points</span>
        </p>

        {guessResult === null ? (
          <>
            <input
              type="text"
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && guessInput.trim() && handleGuessSubmit()}
              placeholder="Type your guess..."
              className="w-full p-4 bg-neutral-800 border-2 border-neutral-700 focus:border-orange-500 rounded-xl text-white outline-none text-center font-bold text-lg mb-3 transition-colors"
              autoFocus
            />
            <button
              onClick={handleGuessSubmit}
              disabled={!guessInput.trim()}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 ${
                guessInput.trim()
                  ? "bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-900/30"
                  : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
              }`}
            >
              Submit Guess
            </button>
          </>
        ) : (
          <div className={`w-full py-6 px-4 rounded-2xl font-black text-xl animate-fadeIn ${
            guessResult === "correct"
              ? "bg-green-950/50 border-2 border-green-500 text-green-400"
              : "bg-red-950/50 border-2 border-red-500 text-red-400"
          }`}>
            {guessResult === "correct" ? "✅ Correct!" : "❌ Wrong!"}
            <p className="text-sm font-bold mt-2 text-neutral-400">
              {guessResult === "correct"
                ? `The word was "${gameData.secretWord}" — +2 pts!`
                : `The word was "${gameData.secretWord}"`}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── RENDER: RESULT ────────────────────────────────────────────────
  if (phase === PHASE.RESULT && roundResult) {
    const { imposterCaught, imposterGuessedCorrectly, votedOutName, pointDeltas, voteLog } = roundResult;
    const isLastRound = currentRound >= totalRounds;

    // Build stat object for this round
    const correctVoters = voteLog
      .filter(({ votedFor }) => votedFor && isPlayerImposter(votedFor))
      .map(({ voter }) => voter);
    const wronglyBlamed = (!imposterCaught && votedOutName) ? votedOutName : null;
    const roundStat = {
      round: currentRound,
      word: gameData.secretWord,
      imposter: imposterLabel,
      caught: imposterCaught,
      guessedCorrectly: imposterGuessedCorrectly || false,
      survivedVote: !imposterCaught,
      correctVoters,
      wronglyBlamed,
    };

    let headline, subline, emoji, headerBg;
    if (!imposterCaught) {
      if (roundResult.skippedVote) {
        headline = "VOTE SKIPPED!"; subline = "Most players skipped — imposter escapes!"; emoji = "🙈"; headerBg = "from-neutral-800";
      } else if (roundResult.isTie) {
        headline = "IT'S A DRAW!"; subline = "Tied votes — imposter escapes!"; emoji = "🤝"; headerBg = "from-neutral-800";
      } else {
        headline = "IMPOSTER ESCAPES!"; subline = votedOutName ? `${votedOutName} took the blame!` : "Nobody caught them!"; emoji = "😈"; headerBg = "from-red-950";
      }
    } else if (roundResult.allImposters) {
      headline = "BOTH CAUGHT!"; subline = `${votedOutName} were both the imposters!`; emoji = "🕵️🕵️"; headerBg = "from-green-950";
    } else if (imposterGuessedCorrectly) {
      headline = "GUESSED IT!"; subline = `${votedOutName} was caught but saved themselves!`; emoji = "🎯"; headerBg = "from-yellow-950";
    } else {
      headline = imposterNames.length > 1 ? "IMPOSTER CAUGHT!" : "IMPOSTER CAUGHT!";
      subline = `${votedOutName} was ${imposterNames.length > 1 ? "an" : "the"} imposter!`;
      emoji = "🕵️"; headerBg = "from-green-950";
    }

    const updatedScores = {};
    players.forEach((p) => { updatedScores[p] = (scores[p] || 0) + (pointDeltas[p] || 0); });
    const sortedPlayers = [...players].sort((a, b) => updatedScores[b] - updatedScores[a]);

    const voteBreakdown = {};
    players.forEach((p) => (voteBreakdown[p] = []));
    voteLog.forEach(({ voter, votedFor }) => { if (votedFor) voteBreakdown[votedFor].push(voter); });
    const skipped = voteLog.filter((v) => !v.votedFor).map((v) => v.voter);
    const anyVotes = Object.values(voteBreakdown).some((v) => v.length > 0);

    return (
      <div className="flex flex-col items-center mt-6 w-full pb-8">
        <RoundBadge />

        {/* Result header */}
        <div className={`w-full bg-gradient-to-b ${headerBg} to-transparent rounded-2xl p-5 text-center mb-4`}>
          <div className="text-4xl sm:text-5xl mb-2">{emoji}</div>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter leading-tight">{headline}</h2>
          <p className="text-neutral-400 text-sm mt-1">{subline}</p>
        </div>

        {/* Words */}
        <div className={`grid ${gameData.mode === 2 ? "grid-cols-2" : "grid-cols-1"} gap-3 w-full mb-4`}>
          <div className="bg-neutral-800 p-3 rounded-xl border border-neutral-700 text-center">
            <p className="text-neutral-500 text-[10px] uppercase font-bold mb-1">Secret Word</p>
            <p className="text-lg font-black text-white">{gameData.secretWord}</p>
          </div>
          {gameData.mode === 2 && (
            <div className="bg-neutral-800 p-3 rounded-xl border border-red-500/30 text-center">
              <p className="text-red-400 text-[10px] uppercase font-bold mb-1">Imposter's Word</p>
              <p className="text-lg font-black text-white">{gameData.imposterWord}</p>
            </div>
          )}
        </div>

        {/* Vote Breakdown */}
        <div className="w-full rounded-2xl border border-neutral-800 overflow-hidden mb-4">
          <div className="px-4 py-2.5 bg-neutral-800/80 border-b border-neutral-700">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">🗳️ Vote Breakdown</p>
          </div>
          {anyVotes ? (
            players.map((name) => {
              const voters = voteBreakdown[name];
              if (voters.length === 0) return null;
              const isImp = isPlayerImposter(name);
              const pct = Math.round((voters.length / players.length) * 100);
              return (
                <div key={name} className={`px-4 py-3 border-b border-neutral-800 last:border-0 ${isImp ? "bg-red-950/30" : ""}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`font-black text-sm truncate ${isImp ? "text-red-400" : "text-white"}`}>{name}</span>
                      {isImp && <span className="text-[9px] bg-red-900/50 text-red-400 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">IMPOSTER</span>}
                    </div>
                    <span className="text-orange-400 font-black text-sm flex-shrink-0 ml-2">{voters.length}v</span>
                  </div>
                  {/* Vote bar */}
                  <div className="w-full bg-neutral-800 rounded-full h-1 mb-1">
                    <div className={`h-1 rounded-full ${isImp ? "bg-red-500" : "bg-orange-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-neutral-600 text-[10px]">by {voters.join(", ")}</p>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-3 text-neutral-600 text-sm italic text-center">No votes cast</div>
          )}
          {skipped.length > 0 && (
            <div className="px-4 py-2 bg-neutral-900/50 text-[10px] text-neutral-600 italic border-t border-neutral-800">
              Skipped: {skipped.join(", ")}
            </div>
          )}
        </div>

        {/* Scores */}
        <div className="w-full rounded-2xl border border-neutral-800 overflow-hidden mb-5">
          <div className="px-4 py-2.5 bg-neutral-800/80 border-b border-neutral-700">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
              Scores — Round {currentRound}
            </p>
          </div>
          {sortedPlayers.map((name, i) => {
            const delta = pointDeltas[name] || 0;
            const total = updatedScores[name];
            const isImp = isPlayerImposter(name);
            const isLeading = i === 0;
            return (
              <div key={name} className={`flex items-center justify-between px-4 py-3 border-b border-neutral-800 last:border-0 ${isLeading ? "bg-orange-500/8" : ""}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-xs font-black w-5 flex-shrink-0 ${isLeading ? "text-orange-400" : "text-neutral-600"}`}>
                    {isLeading ? "👑" : `#${i + 1}`}
                  </span>
                  <span className="font-bold text-white text-sm truncate">{name}</span>
                  {isPlayerImposter(name) && <span className="text-[9px] bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">IMP</span>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {delta !== 0 && (
                    <span className={`text-xs font-black ${delta > 0 ? "text-green-400" : "text-red-400"}`}>
                      {delta > 0 ? `+${delta}` : delta}
                    </span>
                  )}
                  <span className="text-white font-black text-sm w-7 text-right">{total}</span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => onNextRound(pointDeltas, roundStat)}
          className="w-full bg-orange-500 hover:bg-orange-400 active:scale-95 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-orange-900/30 uppercase tracking-widest text-sm mb-3"
        >
          {isLastRound ? "🏆 See Final Scores" : `Round ${currentRound + 1} →`}
        </button>
        <button
          onClick={() => onEndGame(pointDeltas, roundStat)}
          className="w-full py-3 rounded-2xl font-bold uppercase tracking-widest text-xs text-neutral-500 border border-neutral-800 hover:border-neutral-600 hover:text-neutral-400 transition-all active:scale-95"
        >
          End Game & See Scores
        </button>
      </div>
    );
  }

  return null;
}

export default Game;
