import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Plus, RefreshCw, Download, Trash2, X, Trophy } from "lucide-react";

// --- Constants & Types ---
const STORAGE_KEY = "score_keeper_data";
const EXPIRY_TIME = 10 * 60 * 60 * 1000; // 10 hours

// --- Helper: Load Script for XLSX ---
const useXLSX = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    if (window.XLSX) {
      setIsLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js";
    script.async = true;
    script.onload = () => setIsLoaded(true);
    document.body.appendChild(script);
    return () => {
      // Cleanup if needed, though usually we want this to persist
    };
  }, []);
  return isLoaded;
};

const loadSavedData = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const now = Date.now();
      if (now - parsed.timestamp < EXPIRY_TIME) {
        return parsed;
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch (error) {
    console.error("Failed to load score data", error);
  }
  return null;
};

// --- Components ---

const ScoreTable = ({
  players,
  numRounds,
  onScoreChange,
  onNameChange,
  onRemovePlayer,
  onRemoveRound,
}) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-800/50 shadow-xl">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-slate-900/50 text-xs uppercase text-slate-400 font-semibold">
          <tr>
            <th className="px-4 py-4 min-w-[150px] sticky left-0 bg-slate-900 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
              Player Name
            </th>
            {Array.from({ length: numRounds }).map((_, i) => (
              <th
                key={i}
                className="px-2 py-4 min-w-[100px] text-center group relative"
              >
                <div className="flex flex-col items-center justify-center gap-1">
                  <span>Round {i + 1}</span>
                  <button
                    onClick={() => onRemoveRound(i)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 p-1 rounded hover:bg-slate-800"
                    title="Remove Round"
                  >
                    <X size={14} />
                  </button>
                </div>
              </th>
            ))}
            <th className="px-4 py-4 text-right font-bold text-cyan-400 min-w-[100px]">
              Total
            </th>
            <th className="px-4 py-4 text-center w-16">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {players.length === 0 ? (
            <tr>
              <td
                colSpan={numRounds + 3}
                className="px-4 py-8 text-center text-slate-500 italic"
              >
                No players added yet. Click "Add Player" to start.
              </td>
            </tr>
          ) : (
            players.map((player, idx) => {
              const totalScore = player.scores.reduce(
                (sum, s) => sum + (s || 0),
                0,
              );
              const isWinner = idx === 0 && totalScore > 0;

              return (
                <tr
                  key={player.id}
                  className={`hover:bg-slate-700/30 transition-colors ${isWinner ? "bg-yellow-900/10" : ""}`}
                >
                  <td className="px-4 py-3 sticky left-0 bg-slate-800 group-hover:bg-slate-700/90 transition-colors z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center gap-2">
                      {isWinner && (
                        <Trophy size={16} className="text-yellow-400" />
                      )}
                      <input
                        type="text"
                        value={player.name}
                        onChange={(e) =>
                          onNameChange(player.id, e.target.value)
                        }
                        className="w-full bg-transparent border-b border-transparent focus:border-cyan-500 outline-none text-slate-100 placeholder-slate-500 font-medium"
                        placeholder="Name"
                      />
                    </div>
                  </td>
                  {player.scores.map((score, roundIdx) => (
                    <td key={roundIdx} className="px-2 py-3 text-center">
                      <input
                        type="number"
                        value={score === null ? "" : score}
                        onChange={(e) => {
                          const val =
                            e.target.value === ""
                              ? null
                              : parseFloat(e.target.value);
                          onScoreChange(player.id, roundIdx, val);
                        }}
                        className="w-16 text-center bg-slate-900/50 border border-slate-700 rounded focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none py-1 text-slate-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="-"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-bold text-cyan-300 text-lg">
                    {totalScore}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onRemovePlayer(player.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-slate-700"
                      title="Remove Player"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const xlsxLoaded = useXLSX();
  const [initialData] = useState(() => loadSavedData());

  const [players, setPlayers] = useState(initialData?.players || []);
  const [gameTitle, setGameTitle] = useState(
    initialData?.gameTitle || "Score Keeper",
  );

  const numRounds = useMemo(
    () => (players.length > 0 ? players[0].scores.length : 5),
    [players],
  );

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const totalA = a.scores.reduce((sum, score) => sum + (score || 0), 0);
      const totalB = b.scores.reduce((sum, score) => sum + (score || 0), 0);
      return totalB - totalA;
    });
  }, [players]);

  useEffect(() => {
    const data = {
      players,
      gameTitle,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [players, gameTitle]);

  const handleAddPlayer = useCallback(() => {
    setPlayers((prevPlayers) => {
      const rounds = prevPlayers.length > 0 ? prevPlayers[0].scores.length : 5;
      const newPlayer = {
        id: new Date().getTime().toString(),
        name: `Player ${prevPlayers.length + 1}`,
        scores: Array(rounds).fill(null),
      };
      return [...prevPlayers, newPlayer];
    });
  }, []);

  const handleRemovePlayer = useCallback((id) => {
    if (window.confirm("Are you sure you want to remove this player?")) {
      setPlayers((prevPlayers) => prevPlayers.filter((p) => p.id !== id));
    }
  }, []);

  const handleNameChange = useCallback((id, newName) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((p) => (p.id === id ? { ...p, name: newName } : p)),
    );
  }, []);

  const handleScoreChange = useCallback((id, roundIndex, score) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((p) => {
        if (p.id === id) {
          const newScores = [...p.scores];
          newScores[roundIndex] = score;
          return { ...p, scores: newScores };
        }
        return p;
      }),
    );
  }, []);

  const handleAddRound = useCallback(() => {
    if (players.length === 0) {
      setPlayers([
        {
          id: new Date().getTime().toString(),
          name: "Player 1",
          scores: Array(5).fill(null),
        },
      ]);
      return;
    }
    setPlayers((prevPlayers) =>
      prevPlayers.map((p) => ({ ...p, scores: [...p.scores, null] })),
    );
  }, [players]);

  const handleRemoveRound = useCallback((roundIndex) => {
    if (
      window.confirm(`Are you sure you want to remove Round ${roundIndex + 1}?`)
    ) {
      setPlayers((prevPlayers) =>
        prevPlayers.map((p) => {
          const newScores = p.scores.filter((_, i) => i !== roundIndex);
          return { ...p, scores: newScores };
        }),
      );
    }
  }, []);

  const handleNewGame = useCallback(() => {
    if (
      window.confirm(
        "Are you sure you want to start a new game? All current scores will be lost.",
      )
    ) {
      setPlayers([]);
      setGameTitle(`New Game - ${new Date().toLocaleDateString()}`);
    }
  }, []);

  const handleClearRecords = useCallback(() => {
    if (
      window.confirm(
        "Are you sure you want to clear all saved records? This will delete data from browser storage and reset the app.",
      )
    ) {
      localStorage.removeItem(STORAGE_KEY);
      setPlayers([]);
      setGameTitle("Score Keeper");
    }
  }, []);

  const handleDownloadExcel = useCallback(() => {
    if (!players.length) return;
    if (typeof window.XLSX === "undefined") {
      alert("Excel library is still loading, please try again in a moment.");
      return;
    }

    const headers = ["Player"];
    for (let i = 0; i < numRounds; i++) {
      headers.push(`Round ${i + 1}`);
    }
    headers.push("Total Score");

    const data = sortedPlayers.map((player) => {
      const total = player.scores.reduce((sum, score) => sum + (score || 0), 0);
      return [player.name, ...player.scores.map((s) => s ?? ""), total];
    });

    const worksheetData = [headers, ...data];
    const ws = window.XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Scores");

    // --- DATE FORMATTING START ---
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const year = now.getFullYear();
    const dateString = `${day}-${month}-${year}`;
    // --- DATE FORMATTING END ---

    const safeTitle = gameTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase();

    // Save with date string (Using hyphens for OS compatibility)
    window.XLSX.writeFile(wb, `${safeTitle}_${dateString}.xlsx`);
  }, [sortedPlayers, numRounds, gameTitle, players.length]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <main className="max-w-7xl mx-auto">
        <header className="mb-8 border-b border-slate-800 pb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <input
                value={gameTitle}
                onChange={(e) => setGameTitle(e.target.value)}
                className="text-3xl sm:text-4xl font-bold tracking-tight text-white bg-transparent outline-none focus:ring-2 focus:ring-cyan-500 rounded-lg p-2 -ml-2 w-full max-w-lg placeholder-slate-600"
                placeholder="Enter Game Name..."
                aria-label="Game Title"
              />
              <p className="mt-2 text-slate-400 flex items-center gap-2">
                <Trophy size={16} className="text-cyan-500" />
                Highest Scores automatically on top
              </p>
            </div>
            {/* Stats Summary (Optional Visual) */}
            <div className="flex gap-4 text-sm font-medium text-slate-400">
              <div className="bg-slate-800 px-3 py-2 rounded-md">
                Players: <span className="text-white">{players.length}</span>
              </div>
              <div className="bg-slate-800 px-3 py-2 rounded-md">
                Rounds: <span className="text-white">{numRounds}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={handleAddPlayer}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg shadow-cyan-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus size={20} />
            Add Player
          </button>
          <button
            onClick={handleAddRound}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus size={20} />
            Add Round
          </button>
          <button
            onClick={handleDownloadExcel}
            disabled={players.length === 0 || !xlsxLoaded}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg shadow-emerald-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed disabled:transform-none"
            title={!xlsxLoaded ? "Loading Excel library..." : "Download .xlsx"}
          >
            <Download size={20} />
            Excel
          </button>

          <div className="ml-auto flex gap-3 w-full sm:w-auto mt-4 sm:mt-0 justify-end">
            <button
              onClick={handleClearRecords}
              className="flex items-center gap-2 text-slate-400 hover:text-orange-400 hover:bg-slate-800 py-2 px-4 rounded-lg transition-colors"
            >
              <Trash2 size={18} />
              <span className="hidden sm:inline">Clear Data</span>
            </button>
            <button
              onClick={handleNewGame}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg shadow-rose-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <RefreshCw size={18} />
              New Game
            </button>
          </div>
        </div>

        <ScoreTable
          players={sortedPlayers}
          numRounds={numRounds}
          onScoreChange={handleScoreChange}
          onNameChange={handleNameChange}
          onRemovePlayer={handleRemovePlayer}
          onRemoveRound={handleRemoveRound}
        />
      </main>
    </div>
  );
};

export default App;
