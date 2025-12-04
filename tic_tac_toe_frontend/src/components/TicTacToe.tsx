import { useEffect, useMemo, useState } from 'preact/hooks';

/**
 * Ocean Professional Theme constants
 */
const COLORS = {
  primary: '#2563EB', // Blue
  secondary: '#F59E0B', // Amber
  error: '#EF4444',
  bg: '#f9fafb',
  surface: '#ffffff',
  text: '#111827',
};

type Player = 'X' | 'O';
type Cell = Player | null;
type Mode = 'pvp' | 'ai';

interface Scores {
  X: number;
  O: number;
  draw: number;
}

/**
 * PUBLIC_INTERFACE
 * TicTacToe component: Interactive 3x3 board supporting PvP and simple AI.
 */
export default function TicTacToe() {
  /** Game state */
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [current, setCurrent] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [mode, setMode] = useState<Mode>('pvp');
  const [scores, setScores] = useState<Scores>({ X: 0, O: 0, draw: 0 });
  const [aiThinking, setAiThinking] = useState<boolean>(false);

  // Determine winning lines
  const LINES = useMemo(
    () => [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ],
    []
  );

  /** Winner detection */
  const calculateWinner = (b: Cell[]): Player | 'draw' | null => {
    for (const [a, c, d] of LINES) {
      if (b[a] && b[a] === b[c] && b[a] === b[d]) {
        return b[a];
      }
    }
    if (b.every((cell) => cell !== null)) return 'draw';
    return null;
  };

  /** Handle score update */
  const updateScores = (result: Player | 'draw' | null) => {
    if (!result) return;
    setScores((prev) => {
      if (result === 'draw') return { ...prev, draw: prev.draw + 1 };
      return { ...prev, [result]: prev[result] + 1 };
    });
  };

  /** Handle human move */
  const handleMove = (index: number) => {
    if (winner || board[index] || (mode === 'ai' && current === 'O' && !aiThinking)) return;
    const next = board.slice();
    next[index] = current;
    const result = calculateWinner(next);
    setBoard(next);
    setWinner(result);
    if (result) {
      updateScores(result);
    } else {
      setCurrent(current === 'X' ? 'O' : 'X');
    }
  };

  /** Simple AI: try win, block, center, corners, sides */
  const aiChooseMove = (b: Cell[]): number | null => {
    // Try to win
    const tryLine = (p: Player): number | null => {
      for (const [a, c, d] of LINES) {
        const line = [b[a], b[c], b[d]];
        const emptyIdx = [a, c, d].find((i) => b[i] === null);
        if (emptyIdx !== undefined) {
          const marks = line.filter((v) => v === p).length;
          const empties = line.filter((v) => v === null).length;
          if (marks === 2 && empties === 1) return emptyIdx;
        }
      }
      return null;
    };

    const win = tryLine('O');
    if (win !== null) return win;

    const block = tryLine('X');
    if (block !== null) return block;

    const preferred = [4, 0, 2, 6, 8, 1, 3, 5, 7];
    for (const i of preferred) {
      if (b[i] === null) return i;
    }
    return null;
  };

  /** Trigger AI move when it's O's turn in AI mode */
  useEffect(() => {
    if (mode === 'ai' && current === 'O' && !winner) {
      setAiThinking(true);
      const timer = setTimeout(() => {
        const move = aiChooseMove(board.slice());
        if (move !== null) {
          const next = board.slice();
          next[move] = 'O';
          const result = calculateWinner(next);
          setBoard(next);
          setWinner(result);
          if (result) {
            updateScores(result);
          } else {
            setCurrent('X');
          }
        }
        setAiThinking(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [mode, current, winner, board]);

  /** Reset for next round */
  const resetBoard = () => {
    setBoard(Array(9).fill(null));
    setCurrent('X');
    setWinner(null);
    setAiThinking(false);
  };

  /** New match (reset scores too) */
  const newMatch = () => {
    resetBoard();
    setScores({ X: 0, O: 0, draw: 0 });
  };

  return (
    <div class="ttt-wrapper">
      <div class="header">
        <h1 class="title">Tic Tac Toe</h1>
        <p class="subtitle">Ocean Professional Edition</p>
      </div>

      <div class="surface scorebar">
        <div class="score chip x">
          <span class="label">X Wins</span>
          <span class="value">{scores.X}</span>
        </div>
        <div class="score chip draw">
          <span class="label">Draws</span>
          <span class="value">{scores.draw}</span>
        </div>
        <div class="score chip o">
          <span class="label">O Wins</span>
          <span class="value">{scores.O}</span>
        </div>
      </div>

      <div class="surface controls">
        <div class="mode-toggle" role="group" aria-label="Game mode">
          <button
            class={`mode-btn ${mode === 'pvp' ? 'active' : ''}`}
            onClick={() => {
              setMode('pvp');
              resetBoard();
            }}
            aria-pressed={mode === 'pvp'}
          >
            Player vs Player
          </button>
          <button
            class={`mode-btn ${mode === 'ai' ? 'active' : ''}`}
            onClick={() => {
              setMode('ai');
              resetBoard();
            }}
            aria-pressed={mode === 'ai'}
          >
            Player vs AI
          </button>
        </div>
        <div class="actions">
          <button class="reset-btn" onClick={resetBoard} aria-label="Reset round">
            Reset
          </button>
          <button class="new-btn" onClick={newMatch} aria-label="New match">
            New Match
          </button>
        </div>
      </div>

      <div class="surface board" role="grid" aria-label="Tic Tac Toe board">
        {board.map((cell, i) => (
          <button
            key={i}
            class={`cell ${cell ? (cell === 'X' ? 'x' : 'o') : ''}`}
            onClick={() => handleMove(i)}
            disabled={!!cell || !!winner || (mode === 'ai' && current === 'O')}
            role="gridcell"
            aria-label={`Cell ${i + 1} ${cell ? cell : 'empty'}`}
          >
            {cell}
          </button>
        ))}
      </div>

      <div class="surface status">
        {!winner && (
          <p class="status-text">
            {mode === 'ai' && current === 'O'
              ? aiThinking
                ? 'AI thinking...'
                : 'AI turn'
              : `Current Turn: `}
            {!(mode === 'ai' && current === 'O') && (
              <span class={`badge ${current === 'X' ? 'x' : 'o'}`}>{current}</span>
            )}
          </p>
        )}
        {winner && (
          <div class="result">
            {winner === 'draw' ? (
              <p class="result-text">It’s a draw!</p>
            ) : (
              <p class="result-text">
                Winner: <span class={`badge ${winner === 'X' ? 'x' : 'o'}`}>{winner}</span>
              </p>
            )}
            <button class="play-again" onClick={resetBoard} aria-label="Play again">
              Play again
            </button>
          </div>
        )}
      </div>

      <style>
        {`
        .ttt-wrapper {
          min-height: calc(100dvh - 40px);
          padding: 20px;
          display: grid;
          grid-template-rows: auto auto auto 1fr auto;
          gap: 16px;
          align-items: start;
          justify-items: center;
          color: ${COLORS.text};
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(243, 244, 246, 0.9));
        }

        .header {
          text-align: center;
        }

        .title {
          margin: 8px 0 0 0;
          font-size: clamp(28px, 3.5vw, 40px);
          font-weight: 800;
          letter-spacing: -0.02em;
          color: ${COLORS.text};
        }

        .subtitle {
          margin: 4px 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .surface {
          background: ${COLORS.surface};
          border: 1px solid rgba(17, 24, 39, 0.08);
          box-shadow: 0 10px 25px rgba(17, 24, 39, 0.06);
          border-radius: 16px;
          width: min(680px, 96%);
          transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
        }
        .surface:hover {
          box-shadow: 0 12px 30px rgba(17, 24, 39, 0.09);
        }

        .scorebar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 12px;
        }
        .chip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-radius: 12px;
          background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(249,250,251,0.9));
          border: 1px solid rgba(17,24,39,0.08);
        }
        .chip .label {
          font-size: 14px;
          color: #6b7280;
        }
        .chip .value {
          font-weight: 800;
          font-size: 18px;
        }
        .chip.x .value { color: ${COLORS.primary}; }
        .chip.o .value { color: ${COLORS.secondary}; }
        .chip.draw .value { color: #374151; }

        .controls {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          padding: 14px;
        }
        .mode-toggle {
          display: inline-flex;
          gap: 8px;
          background: #f3f4f6;
          border-radius: 12px;
          padding: 6px;
          border: 1px solid rgba(17,24,39,0.08);
        }
        .mode-btn {
          appearance: none;
          border: 0;
          border-radius: 10px;
          padding: 10px 12px;
          background: transparent;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .mode-btn.active {
          background: ${COLORS.surface};
          color: ${COLORS.text};
          box-shadow: 0 6px 16px rgba(17,24,39,0.08);
          border: 1px solid rgba(17,24,39,0.08);
        }
        .mode-btn:hover { transform: translateY(-1px); }

        .actions {
          display: inline-flex;
          gap: 8px;
        }
        .reset-btn, .new-btn, .play-again {
          appearance: none;
          border: 0;
          border-radius: 10px;
          padding: 10px 14px;
          font-weight: 700;
          color: white;
          cursor: pointer;
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.22);
          transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease;
        }
        .reset-btn { background: ${COLORS.primary}; }
        .new-btn {
          background: ${COLORS.secondary};
          box-shadow: 0 8px 18px rgba(245, 158, 11, 0.22);
        }
        .reset-btn:hover, .new-btn:hover, .play-again:hover {
          transform: translateY(-1px);
          filter: brightness(1.05);
        }

        .board {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          padding: 14px;
        }
        .cell {
          width: min(120px, 26vw);
          height: min(120px, 26vw);
          max-width: 180px;
          max-height: 180px;
          aspect-ratio: 1;
          display: grid;
          place-items: center;
          font-size: clamp(42px, 8vw, 64px);
          font-weight: 900;
          color: ${COLORS.text};
          background: linear-gradient(180deg, #ffffff, #f3f4f6);
          border: 1px solid rgba(17,24,39,0.1);
          border-radius: 16px;
          cursor: pointer;
          transition: transform 0.12s ease, box-shadow 0.2s ease, background 0.2s ease;
          box-shadow: 0 10px 25px rgba(17,24,39,0.06);
        }
        .cell:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(17,24,39,0.10);
          background: linear-gradient(180deg, #ffffff, #eef2ff);
        }
        .cell:disabled {
          cursor: default;
          opacity: 0.95;
        }
        .cell.x { color: ${COLORS.primary}; }
        .cell.o { color: ${COLORS.secondary}; }

        .status {
          padding: 14px;
          display: grid;
          place-items: center;
        }
        .status-text {
          margin: 8px 0;
          font-weight: 600;
          color: #374151;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          border-radius: 999px;
          color: white;
          font-weight: 800;
          margin-left: 6px;
          font-size: 14px;
          letter-spacing: 0.02em;
        }
        .badge.x { background: ${COLORS.primary}; }
        .badge.o { background: ${COLORS.secondary}; }

        .result {
          display: grid;
          gap: 10px;
          place-items: center;
        }
        .result-text {
          font-weight: 800;
          font-size: 18px;
          color: ${COLORS.text};
        }
        .play-again {
          background: ${COLORS.primary};
        }

        @media (max-width: 640px) {
          .scorebar { grid-template-columns: 1fr; }
          .controls { grid-template-columns: 1fr; }
          .actions { justify-content: space-between; }
          .mode-toggle { justify-content: center; }
        }
        `}
      </style>
    </div>
  );
}
