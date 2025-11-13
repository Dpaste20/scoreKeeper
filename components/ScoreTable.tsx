import React, { useMemo } from 'react';
import { Player } from '../types';
import { TrashIcon } from './Icons';

interface ScoreTableProps {
  players: Player[];
  numRounds: number;
  onScoreChange: (playerId: string, roundIndex: number, newScore: number | null) => void;
  onNameChange: (playerId: string, newName: string) => void;
  onRemovePlayer: (playerId: string) => void;
  onRemoveRound: (roundIndex: number) => void;
}

const ScoreTable: React.FC<ScoreTableProps> = ({
  players,
  numRounds,
  onScoreChange,
  onNameChange,
  onRemovePlayer,
  onRemoveRound
}) => {
  const playerTotals = useMemo(() => {
    return players.map(player => ({
      id: player.id,
      total: player.scores.reduce((sum, score) => sum + (score || 0), 0)
    }));
  }, [players]);
  
  const highestScore = useMemo(() => {
      if (players.length === 0) return -1;
      const allTotals = playerTotals.map(p => p.total);
      return Math.max(...allTotals);
  }, [playerTotals, players]);

  return (
    <div className="overflow-x-auto relative shadow-md rounded-lg bg-slate-800">
      <table className="w-full text-sm text-left text-slate-300 border-collapse">
        <thead className="text-xs text-slate-300 uppercase bg-slate-700/50 backdrop-blur-sm">
          <tr>
            <th scope="col" className="px-4 sm:px-6 py-3 sticky left-0 bg-slate-700/80 z-20 w-1/4 min-w-[150px]">
              Player
            </th>
            {Array.from({ length: numRounds }, (_, i) => (
              <th key={i} scope="col" className="px-6 py-3 text-center group">
                <div className="flex items-center justify-center gap-2">
                  <span>Round {i + 1}</span>
                  <button 
                    onClick={() => onRemoveRound(i)}
                    className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Remove Round ${i + 1}`}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </th>
            ))}
            <th scope="col" className="px-4 sm:px-6 py-3 text-right sticky right-0 bg-slate-700/80 z-20 min-w-[100px]">
              Total Score
            </th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => {
            const totalScore = playerTotals.find(p => p.id === player.id)?.total ?? 0;
            const isWinner = totalScore > 0 && totalScore === highestScore;
            
            return (
              <tr key={player.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors duration-200 group">
                <td className="px-2 sm:px-4 py-2 sticky left-0 bg-slate-800 group-hover:bg-slate-700/50 z-10 w-1/4 min-w-[150px]">
                  <div className="flex items-center gap-2">
                    <span className={`w-8 flex-shrink-0 text-center font-bold text-lg ${
                      index === 0 ? 'text-yellow-400' :
                      index === 1 ? 'text-slate-400' :
                      index === 2 ? 'text-orange-400' : 'text-slate-600'
                    }`}>
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) => onNameChange(player.id, e.target.value)}
                      className="w-full bg-transparent focus:bg-slate-700 rounded-md p-2 outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                      aria-label={`${player.name}'s name`}
                    />
                    <button 
                      onClick={() => onRemovePlayer(player.id)}
                      className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`Remove ${player.name}`}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
                {Array.from({ length: numRounds }).map((_, i) => (
                  <td key={i} className="px-6 py-2">
                    <input
                      type="number"
                      value={player.scores[i] ?? ''}
                      onChange={(e) => {
                        const score = parseInt(e.target.value, 10);
                        onScoreChange(player.id, i, isNaN(score) ? null : score);
                      }}
                      className="w-20 bg-slate-700/50 text-center rounded-md p-2 outline-none focus:ring-2 focus:ring-cyan-500 transition-all focus:bg-slate-600"
                      aria-label={`Score for ${player.name} in Round ${i+1}`}
                    />
                  </td>
                ))}
                <td className={`px-4 sm:px-6 py-2 text-right sticky right-0 bg-slate-800 group-hover:bg-slate-700/50 z-10 font-bold min-w-[100px] text-lg ${isWinner ? 'text-green-400' : 'text-slate-200'}`}>
                  {isWinner && <span className="text-yellow-400 mr-2" title="Highest Score">👑</span>}
                  {totalScore}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {players.length === 0 && (
        <div className="text-center py-16 text-slate-400">
            <h3 className="text-xl font-semibold">No Players Yet</h3>
            <p className="mt-2">Click "Add Player" to get started!</p>
        </div>
      )}
    </div>
  );
};

export default ScoreTable;