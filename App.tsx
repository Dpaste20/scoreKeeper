import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import {
  Plus,
  RefreshCw,
  Download,
  Trash2,
  X,
  Trophy,
  BarChart2,
  ArrowLeft,
  TrendingUp,
  FileText, // Added icon for PDF
} from "lucide-react";

// --- Constants & Types ---
const STORAGE_KEY = "score_keeper_data";
const EXPIRY_TIME = 10 * 60 * 60 * 1000; // 10 hours

// Consistent color palette
const PLAYER_COLORS = [
  "#fbbf24", // Amber
  "#38bdf8", // Sky Blue
  "#f87171", // Red
  "#34d399", // Emerald
  "#a78bfa", // Purple
  "#f472b6", // Pink
  "#fb923c", // Orange
  "#94a3b8", // Slate
];

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
    return () => {};
  }, []);
  return isLoaded;
};

// --- Helper: Load Scripts for PDF Generation ---
const usePDFLibs = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const loadLibs = async () => {
      try {
        if (!window.html2canvas) {
          await loadScript(
            "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
          );
        }
        if (!window.jspdf) {
          await loadScript(
            "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
          );
        }
        setIsLoaded(true);
      } catch (err) {
        console.error("Failed to load PDF libs", err);
      }
    };

    loadLibs();
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

// 1. The Score Table
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

// 2. SVG Line Chart Component
const ScoreLineChart = ({ players }) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 300 });

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: 300, // Fixed height
        });
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prepare Data
  const data = useMemo(() => {
    if (!players.length) return [];

    const playerLines = players.map((p, pIdx) => {
      let runningTotal = 0;
      const points = [];
      points.push({ round: 0, score: 0 }); // Start point

      p.scores.forEach((s, rIdx) => {
        if (s !== null) {
          runningTotal += s;
          points.push({ round: rIdx + 1, score: runningTotal });
        }
      });
      return {
        id: p.id,
        name: p.name,
        color: PLAYER_COLORS[pIdx % PLAYER_COLORS.length],
        points: points,
      };
    });
    return playerLines;
  }, [players]);

  // Calculate Scales
  const allPoints = data.flatMap((d) => d.points);
  if (allPoints.length === 0)
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-500">
        Not enough data
      </div>
    );

  const maxRound = Math.max(...allPoints.map((p) => p.round));
  const minScore = Math.min(0, ...allPoints.map((p) => p.score));
  const maxScore = Math.max(10, ...allPoints.map((p) => p.score));

  const padding = { top: 20, right: 30, bottom: 30, left: 40 };
  const chartW = dimensions.width - padding.left - padding.right;
  const chartH = dimensions.height - padding.top - padding.bottom;

  const getX = (round) => padding.left + (round / maxRound) * chartW;
  const getY = (score) =>
    padding.top +
    chartH -
    ((score - minScore) / (maxScore - minScore)) * chartH;

  return (
    <div
      ref={containerRef}
      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 shadow-lg"
    >
      <h3 className="text-slate-300 font-semibold mb-4 flex items-center gap-2">
        <TrendingUp size={18} className="text-cyan-400" />
        Score Progression (Cumulative)
      </h3>
      <div className="relative h-[300px] w-full">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className="overflow-visible"
        >
          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
            const val = minScore + (maxScore - minScore) * tick;
            const y = getY(val);
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={dimensions.width - padding.right}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="4"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                >
                  {Math.round(val)}
                </text>
              </g>
            );
          })}

          {minScore < 0 && maxScore > 0 && (
            <line
              x1={padding.left}
              y1={getY(0)}
              x2={dimensions.width - padding.right}
              y2={getY(0)}
              stroke="#94a3b8"
              strokeWidth="1"
              opacity="0.5"
            />
          )}

          {/* Player Lines */}
          {data.map((player) => {
            if (player.points.length < 2) return null;
            const pathD = player.points
              .map(
                (p, i) =>
                  `${i === 0 ? "M" : "L"} ${getX(p.round)} ${getY(p.score)}`,
              )
              .join(" ");

            return (
              <g key={player.id} className="group">
                <path
                  d={pathD}
                  fill="none"
                  stroke={player.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-80 group-hover:opacity-100 group-hover:stroke-[4px] transition-all duration-300"
                />
                {player.points.map((p, i) => (
                  <circle
                    key={i}
                    cx={getX(p.round)}
                    cy={getY(p.score)}
                    r="4"
                    fill={player.color}
                    stroke="#1e293b"
                    strokeWidth="2"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <title>{`${player.name}: ${p.score} (Round ${p.round})`}</title>
                  </circle>
                ))}
              </g>
            );
          })}

          {/* X-Axis Labels */}
          {Array.from({ length: maxRound + 1 }).map((_, i) => {
            if (maxRound > 20 && i % 5 !== 0) return null;
            return (
              <text
                key={i}
                x={getX(i)}
                y={dimensions.height - 5}
                textAnchor="middle"
                fill="#64748b"
                fontSize="10"
              >
                {i === 0 ? "Start" : i}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-slate-700/50">
        {data.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-2 text-xs sm:text-sm text-slate-300"
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: p.color }}
            ></span>
            {p.name}
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. Stats View Component (Updated with PDF)
const StatsView = ({ players, onBack }) => {
  const pdfLibsLoaded = usePDFLibs();
  const statsRef = useRef(null); // Ref to capture
  const [isGenerating, setIsGenerating] = useState(false);

  const getTotal = (p) => p.scores.reduce((sum, s) => sum + (s || 0), 0);
  const sortedPlayers = [...players].sort((a, b) => getTotal(b) - getTotal(a));
  const maxTotal = sortedPlayers.length > 0 ? getTotal(sortedPlayers[0]) : 100;

  const handleDownloadPDF = async () => {
    if (!pdfLibsLoaded || !statsRef.current) return;
    setIsGenerating(true);

    try {
      const html2canvas = window.html2canvas;
      const jsPDF = window.jspdf.jsPDF;

      // Capture the DOM element
      const canvas = await html2canvas(statsRef.current, {
        scale: 2, // Higher scale for better resolution
        backgroundColor: "#0f172a", // Match slate-900 background
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      // Add image to PDF (if height > page, we might need multiple pages, but simple fit for now)
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      const dateStr = new Date().toISOString().split("T")[0];
      pdf.save(`score-stats-${dateStr}.pdf`);
    } catch (error) {
      console.error("PDF Generation failed", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <BarChart2 className="text-cyan-400" />
            Detailed Statistics
          </h2>
        </div>

        <button
          onClick={handleDownloadPDF}
          disabled={!pdfLibsLoaded || isGenerating}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg shadow-red-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <FileText size={20} />
          {isGenerating ? "Generating..." : "Save as PDF"}
        </button>
      </div>

      {/* CAPTURE AREA: This div and its children will be printed */}
      <div
        ref={statsRef}
        className="space-y-8 p-6 bg-slate-900 rounded-xl border border-slate-800/50"
      >
        {/* Header in Capture (so it shows on PDF) */}
        <div className="flex justify-between items-end border-b border-slate-700 pb-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Game Results</h1>
            <p className="text-slate-400 text-sm">
              {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-xs">Generated by Score Keeper</p>
          </div>
        </div>

        {/* LINE CHART SECTION */}
        <ScoreLineChart players={players} />

        {/* Detailed Player Breakdown */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-slate-200 mb-6">
            Player Performance Breakdown
          </h3>
          <div className="space-y-6">
            {sortedPlayers.map((player, idx) => {
              const total = getTotal(player);
              const avg = player.scores.filter((s) => s !== null).length
                ? (
                    total / player.scores.filter((s) => s !== null).length
                  ).toFixed(1)
                : 0;
              const percent = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

              return (
                <div key={player.id} className="relative group">
                  <div className="flex justify-between items-end mb-1">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border border-white/10"
                        style={{
                          backgroundColor: `${PLAYER_COLORS[idx % PLAYER_COLORS.length]}33`,
                          color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
                          borderColor:
                            PLAYER_COLORS[idx % PLAYER_COLORS.length],
                        }}
                      >
                        {idx + 1}
                      </div>
                      <span className="text-lg font-medium text-slate-200">
                        {player.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className="text-2xl font-bold"
                        style={{
                          color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
                        }}
                      >
                        {total}
                      </span>
                      <span className="text-xs text-slate-500 block">
                        Avg: {avg} / round
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${percent}%`,
                        backgroundColor:
                          PLAYER_COLORS[idx % PLAYER_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const xlsxLoaded = useXLSX();
  const [initialData] = useState(() => loadSavedData());

  const [players, setPlayers] = useState(initialData?.players || []);
  const [gameTitle, setGameTitle] = useState(
    initialData?.gameTitle || "Score Keeper",
  );
  const [currentView, setCurrentView] = useState("GAME"); // "GAME" or "STATS"

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

    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const dateString = `${day}-${month}-${year}`;

    const safeTitle = gameTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    window.XLSX.writeFile(wb, `${safeTitle}_${dateString}.xlsx`);
  }, [sortedPlayers, numRounds, gameTitle, players.length]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <main className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 border-b border-slate-800 pb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              {currentView === "GAME" ? (
                <>
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
                </>
              ) : (
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white p-2 -ml-2">
                  {gameTitle}
                </h1>
              )}
            </div>
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

        {/* View Switching */}
        {currentView === "STATS" ? (
          <StatsView players={players} onBack={() => setCurrentView("GAME")} />
        ) : (
          <>
            {/* Toolbar */}
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

              {/* Stats Button */}
              <button
                onClick={() => setCurrentView("STATS")}
                disabled={players.length === 0}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg shadow-purple-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <BarChart2 size={20} />
                Detailed Stats
              </button>

              <button
                onClick={handleDownloadExcel}
                disabled={players.length === 0 || !xlsxLoaded}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg shadow-emerald-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed disabled:transform-none"
                title={
                  !xlsxLoaded ? "Loading Excel library..." : "Download .xlsx"
                }
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

            {/* Main Table */}
            <ScoreTable
              players={sortedPlayers}
              numRounds={numRounds}
              onScoreChange={handleScoreChange}
              onNameChange={handleNameChange}
              onRemovePlayer={handleRemovePlayer}
              onRemoveRound={handleRemoveRound}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default App;
