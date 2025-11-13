import React, { useState, useCallback, useMemo } from "react";
import { Player } from "./types";
import ScoreTable from "./components/ScoreTable";
import { PlusIcon, RefreshIcon, DownloadIcon } from "./components/Icons";

const INITIAL_PLAYERS: Player[] = [];

declare const XLSX: any;

const App: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [gameTitle, setGameTitle] = useState<string>("Score Keeper");

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

  const handleAddPlayer = useCallback(() => {
    setPlayers((prevPlayers) => {
      const rounds = prevPlayers.length > 0 ? prevPlayers[0].scores.length : 5;
      const newPlayer: Player = {
        id: new Date().getTime().toString(),
        name: `Player ${prevPlayers.length + 1}`,
        scores: Array(rounds).fill(null),
      };
      return [...prevPlayers, newPlayer];
    });
  }, []);

  const handleRemovePlayer = useCallback((id: string) => {
    if (window.confirm("Are you sure you want to remove this player?")) {
      setPlayers((prevPlayers) => prevPlayers.filter((p) => p.id !== id));
    }
  }, []);

  const handleNameChange = useCallback((id: string, newName: string) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((p) => (p.id === id ? { ...p, name: newName } : p)),
    );
  }, []);

  const handleScoreChange = useCallback(
    (id: string, roundIndex: number, score: number | null) => {
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
    },
    [],
  );

  const handleAddRound = useCallback(() => {
    if (players.length === 0) {
      alert("Please add a player first before adding a round.");
      return;
    }
    setPlayers((prevPlayers) =>
      prevPlayers.map((p) => ({ ...p, scores: [...p.scores, null] })),
    );
  }, [players]);

  const handleRemoveRound = useCallback((roundIndex: number) => {
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

  const handleDownloadExcel = useCallback(() => {
    if (!players.length) return;

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
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Scores");

    const now = new Date();
    const day = now.getDate().toString().padStart(2, "0");
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const year = now.getFullYear();

    const dateString = `${day}-${month}-${year}`;

    const filename = `Final_Scores_${dateString}.xlsx`;
    XLSX.writeFile(wb, filename);
  }, [sortedPlayers, numRounds, players.length]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8">
      <main className="max-w-7xl mx-auto">
        <header className="mb-6">
          <input
            value={gameTitle}
            onChange={(e) => setGameTitle(e.target.value)}
            className="text-3xl sm:text-4xl font-bold tracking-tight text-white bg-transparent outline-none focus:ring-2 focus:ring-cyan-500 rounded-lg p-2 -ml-2 w-full max-w-lg"
            aria-label="Game Title"
          />
          <p className="mt-2 text-slate-400">
            A simple and elegant way to keep track of scores. Players are
            automatically ranked.
          </p>
        </header>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={handleAddPlayer}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105"
          >
            <PlusIcon />
            Add Player
          </button>
          <button
            onClick={handleAddRound}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105"
          >
            <PlusIcon />
            Add Round
          </button>
          <button
            onClick={handleDownloadExcel}
            disabled={players.length === 0}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 disabled:bg-slate-500 disabled:cursor-not-allowed disabled:transform-none"
          >
            <DownloadIcon />
            Download Excel
          </button>
          <button
            onClick={handleNewGame}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 ml-auto"
          >
            <RefreshIcon />
            New Game
          </button>
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
