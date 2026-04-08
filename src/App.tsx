import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Volume2, VolumeX, Sun, Moon } from 'lucide-react';
import { audio } from './audio';

type Tile = { id: string; value: number };
type Board = (Tile | null)[][];
type Direction = 'LEFT' | 'RIGHT' | 'UP' | 'DOWN';

const getEmptyBoard = (): Board => [
  [null, null, null, null],
  [null, null, null, null],
  [null, null, null, null],
  [null, null, null, null],
];

let tileIdCounter = 0;
const getNextId = () => `tile-${tileIdCounter++}`;

const addRandomTile = (board: Board): Board => {
  const emptyCells: { r: number; c: number }[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === null) emptyCells.push({ r, c });
    }
  }
  if (emptyCells.length === 0) return board;
  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const newBoard = board.map(row => [...row]);
  newBoard[randomCell.r][randomCell.c] = {
    id: getNextId(),
    value: Math.random() < 0.9 ? 2 : 4
  };
  return newBoard;
};

const rotateRight = (matrix: Board): Board => {
  const result: Board = getEmptyBoard();
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      result[c][3 - r] = matrix[r][c];
    }
  }
  return result;
};

const moveLeft = (board: Board): { newBoard: Board; score: number; moved: boolean } => {
  let newBoard = board.map(row => [...row]);
  let score = 0;
  let moved = false;

  for (let r = 0; r < 4; r++) {
    let row = newBoard[r].filter((val): val is Tile => val !== null);
    for (let c = 0; c < row.length - 1; c++) {
      if (row[c].value === row[c + 1].value) {
        row[c] = { id: row[c].id, value: row[c].value * 2 };
        score += row[c].value;
        row.splice(c + 1, 1);
      }
    }
    while (row.length < 4) row.push(null);
    for (let c = 0; c < 4; c++) {
      if (board[r][c]?.id !== row[c]?.id) moved = true;
      newBoard[r][c] = row[c];
    }
  }
  return { newBoard, score, moved };
};

const move = (board: Board, direction: Direction) => {
  let currentBoard = board;
  let rotations = 0;
  if (direction === 'RIGHT') rotations = 2;
  else if (direction === 'DOWN') rotations = 1;
  else if (direction === 'UP') rotations = 3;

  for (let i = 0; i < rotations; i++) currentBoard = rotateRight(currentBoard);
  
  const { newBoard, score, moved } = moveLeft(currentBoard);
  currentBoard = newBoard;

  for (let i = 0; i < (4 - rotations) % 4; i++) currentBoard = rotateRight(currentBoard);

  return { newBoard: currentBoard, score, moved };
};

const checkGameOver = (board: Board): boolean => {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === null) return false;
      if (c < 3 && board[r][c]?.value === board[r][c + 1]?.value) return false;
      if (r < 3 && board[r][c]?.value === board[r + 1][c]?.value) return false;
    }
  }
  return true;
};

const checkWin = (board: Board): boolean => {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c]?.value === 2048) return true;
    }
  }
  return false;
};

const getTileColor = (value: number, isDark: boolean) => {
  if (isDark) {
    switch (value) {
      case 2: return 'bg-zinc-800 text-zinc-300';
      case 4: return 'bg-zinc-700 text-zinc-200';
      case 8: return 'bg-indigo-500 text-white';
      case 16: return 'bg-violet-500 text-white';
      case 32: return 'bg-purple-500 text-white';
      case 64: return 'bg-fuchsia-500 text-white';
      case 128: return 'bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.5)]';
      case 256: return 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.6)]';
      case 512: return 'bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.7)]';
      case 1024: return 'bg-orange-500 text-white shadow-[0_0_30px_rgba(249,115,22,0.8)]';
      case 2048: return 'bg-amber-500 text-white shadow-[0_0_35px_rgba(245,158,11,0.9)]';
      default: return 'bg-zinc-100 text-zinc-900 shadow-[0_0_40px_rgba(244,244,245,1)]';
    }
  } else {
    switch (value) {
      case 2: return 'bg-[#eee4da] text-[#776e65]';
      case 4: return 'bg-[#ede0c8] text-[#776e65]';
      case 8: return 'bg-[#f2b179] text-[#f9f6f2]';
      case 16: return 'bg-[#f59563] text-[#f9f6f2]';
      case 32: return 'bg-[#f67c5f] text-[#f9f6f2]';
      case 64: return 'bg-[#f65e3b] text-[#f9f6f2]';
      case 128: return 'bg-[#edcf72] text-[#f9f6f2] shadow-[0_0_30px_10px_rgba(243,215,116,0.3)]';
      case 256: return 'bg-[#edcc61] text-[#f9f6f2] shadow-[0_0_30px_10px_rgba(243,215,116,0.4)]';
      case 512: return 'bg-[#edc850] text-[#f9f6f2] shadow-[0_0_30px_10px_rgba(243,215,116,0.5)]';
      case 1024: return 'bg-[#edc53f] text-[#f9f6f2] shadow-[0_0_30px_10px_rgba(243,215,116,0.6)]';
      case 2048: return 'bg-[#edc22e] text-[#f9f6f2] shadow-[0_0_30px_10px_rgba(243,215,116,0.7)]';
      default: return 'bg-[#3c3a32] text-[#f9f6f2]';
    }
  }
};

const getTileFontSize = (value: number) => {
  if (value < 100) return 'text-4xl sm:text-5xl';
  if (value < 1000) return 'text-3xl sm:text-4xl';
  return 'text-2xl sm:text-3xl';
};

export default function App() {
  const [board, setBoard] = useState<Board>(getEmptyBoard());
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [hasContinued, setHasContinued] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [moves, setMoves] = useState<number>(0);
  const [time, setTime] = useState<number>(0);

  const gameState = useRef({
    board: getEmptyBoard(),
    score: 0,
    gameOver: false,
    gameWon: false,
    hasContinued: false
  });

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const unlockAudio = () => audio.unlock();
    window.addEventListener('keydown', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
    window.addEventListener('touchend', unlockAudio, { once: true });
    window.addEventListener('mousedown', unlockAudio, { once: true });
    return () => {
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('touchend', unlockAudio);
      window.removeEventListener('mousedown', unlockAudio);
    };
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (!gameOver && !gameWon) {
      timer = setInterval(() => {
        setTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameOver, gameWon]);

  const initGame = useCallback(() => {
    let newBoard = getEmptyBoard();
    newBoard = addRandomTile(newBoard);
    newBoard = addRandomTile(newBoard);
    
    gameState.current = {
      board: newBoard,
      score: 0,
      gameOver: false,
      gameWon: false,
      hasContinued: false
    };

    setBoard(newBoard);
    setScore(0);
    setMoves(0);
    setTime(0);
    setGameOver(false);
    setGameWon(false);
    setHasContinued(false);
  }, []);

  useEffect(() => {
    const savedBest = localStorage.getItem('2048-best-score');
    if (savedBest) setBestScore(parseInt(savedBest, 10));
    initGame();
  }, [initGame]);

  const handleMove = useCallback(
    (direction: Direction) => {
      const state = gameState.current;
      if (state.gameOver || (state.gameWon && !state.hasContinued)) return;

      const { newBoard, score: moveScore, moved } = move(state.board, direction);

      if (moved) {
        setMoves(m => m + 1);
        if (moveScore > 0) {
          audio.playMerge();
        } else {
          audio.playMove();
        }

        const boardWithNewTile = addRandomTile(newBoard);
        const newScore = state.score + moveScore;
        
        const isWin = !state.gameWon && checkWin(boardWithNewTile);
        const isGameOver = !isWin && checkGameOver(boardWithNewTile);

        gameState.current = {
          ...state,
          board: boardWithNewTile,
          score: newScore,
          gameWon: state.gameWon || isWin,
          gameOver: isGameOver
        };

        setBoard(boardWithNewTile);
        setScore(newScore);
        
        if (newScore > bestScore) {
          setBestScore(newScore);
          localStorage.setItem('2048-best-score', newScore.toString());
        }

        if (isWin) {
          setGameWon(true);
          audio.playWin();
        } else if (isGameOver) {
          setGameOver(true);
          audio.playGameOver();
        }
      }
    },
    [bestScore]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        switch (e.key) {
          case 'ArrowUp': handleMove('UP'); break;
          case 'ArrowDown': handleMove('DOWN'); break;
          case 'ArrowLeft': handleMove('LEFT'); break;
          case 'ArrowRight': handleMove('RIGHT'); break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  const minSwipeDistance = 40;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (isLeftSwipe) handleMove('LEFT');
      if (isRightSwipe) handleMove('RIGHT');
    } else {
      if (isUpSwipe) handleMove('UP');
      if (isDownSwipe) handleMove('DOWN');
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const isDark = theme === 'dark';

  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#09090b' : '#faf8ef');
    }
    document.body.style.backgroundColor = isDark ? '#09090b' : '#faf8ef';
  }, [isDark]);

  return (
    <div 
      className={`min-h-[100dvh] font-sans flex justify-center selection:bg-indigo-500 selection:text-white ${isDark ? 'bg-zinc-950 text-zinc-300' : 'bg-[#faf8ef] text-[#776e65]'}`}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <div className="w-full max-w-[500px] p-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 mt-2 sm:mt-8">
          <h1 className={`text-5xl sm:text-6xl font-black tracking-tighter ${isDark ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400' : 'text-[#776e65]'}`}>2048</h1>
          <div className="flex gap-2">
            <div className={`border rounded-xl px-4 py-2 flex flex-col items-center justify-center min-w-[70px] sm:min-w-[80px] ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-[#bbada0] border-transparent'}`}>
              <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-[#eee4da]'}`}>分数</span>
              <span className={`font-bold text-xl sm:text-2xl leading-none ${isDark ? 'text-zinc-100' : 'text-white'}`}>{score}</span>
            </div>
            <div className={`border rounded-xl px-4 py-2 flex flex-col items-center justify-center min-w-[70px] sm:min-w-[80px] ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-[#bbada0] border-transparent'}`}>
              <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-[#eee4da]'}`}>最高分</span>
              <span className={`font-bold text-xl sm:text-2xl leading-none ${isDark ? 'text-zinc-100' : 'text-white'}`}>{bestScore}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center mb-8">
          <p className={`text-sm sm:text-base font-medium leading-tight max-w-[180px] sm:max-w-[220px] ${isDark ? 'text-zinc-400' : 'text-[#776e65]'}`}>
            合并数字，得到 <strong className={`font-bold ${isDark ? 'text-pink-400' : ''}`}>2048</strong> 方块！
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`p-2.5 rounded-xl transition-colors flex items-center justify-center ${isDark ? 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white' : 'bg-[#8f7a66] text-white hover:bg-[#9f8b77]'}`}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => {
                const newEnabled = !soundEnabled;
                setSoundEnabled(newEnabled);
                audio.enabled = newEnabled;
                if (newEnabled) audio.unlock();
              }}
              className={`p-2.5 rounded-xl transition-colors flex items-center justify-center ${isDark ? 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white' : 'bg-[#8f7a66] text-white hover:bg-[#9f8b77]'}`}
              aria-label="Toggle Sound"
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button 
              onClick={initGame} 
              className={`font-bold py-2.5 px-4 rounded-xl transition-colors text-sm ${isDark ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-[#8f7a66] text-white hover:bg-[#9f8b77]'}`}
            >
              新游戏
            </button>
          </div>
        </div>

        {/* Game Board Container */}
        <div 
          className={`p-3 sm:p-4 rounded-2xl relative touch-none w-full aspect-square ${isDark ? 'bg-zinc-900 border border-zinc-800 shadow-2xl' : 'bg-[#bbada0] shadow-lg'}`}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Grid Background */}
          <div className="grid grid-cols-4 grid-rows-4 gap-3 sm:gap-4 w-full h-full">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className={`rounded-xl w-full h-full ${isDark ? 'bg-zinc-950/50' : 'bg-[#cdc1b4]'}`}></div>
            ))}
          </div>

          {/* Tiles */}
          <div className="absolute inset-3 sm:inset-4 grid grid-cols-4 grid-rows-4 gap-3 sm:gap-4 pointer-events-none">
            {board.map((row, r) => 
              row.map((tile, c) => (
                <div key={`${r}-${c}`} className="relative w-full h-full">
                  {tile !== null && (
                    <motion.div
                      key={`${tile.id}-${tile.value}`}
                      layoutId={tile.id}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25, mass: 0.8 }}
                      className={`absolute inset-0 flex items-center justify-center rounded-xl font-bold ${getTileFontSize(tile.value)} ${getTileColor(tile.value, isDark)}`}
                    >
                      {tile.value}
                    </motion.div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Overlays */}
          {(gameOver || (gameWon && !hasContinued)) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl backdrop-blur-sm pointer-events-auto ${isDark ? 'bg-zinc-950/80' : 'bg-[#eee4da]/70'}`}
            >
              <h2 className={`text-5xl sm:text-6xl font-black mb-2 drop-shadow-md ${isDark ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400' : 'text-[#776e65]'}`}>
                {gameOver ? '游戏结束！' : '你赢了！'}
              </h2>
              {gameOver && (
                <p className={`text-xl sm:text-2xl font-bold mb-6 ${isDark ? 'text-zinc-300' : 'text-[#776e65]'}`}>
                  最终得分: {score}
                </p>
              )}
              <div className="flex gap-4 mt-2">
                {!gameOver && gameWon && (
                  <button 
                    onClick={() => {
                      setHasContinued(true);
                      gameState.current.hasContinued = true;
                    }} 
                    className={`font-bold py-3 px-6 rounded-xl text-lg transition-colors shadow-md ${isDark ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-[#8f7a66] text-white hover:bg-[#9f8b77]'}`}
                  >
                    继续游戏
                  </button>
                )}
                <button 
                  onClick={initGame} 
                  className={`font-bold py-3 px-6 rounded-xl text-lg transition-colors shadow-md ${isDark ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20' : 'bg-[#8f7a66] text-white hover:bg-[#9f8b77]'}`}
                >
                  再试一次
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Bottom Stats / Info to fill space */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className={`border rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-[#bbada0] border-transparent'}`}>
            <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-zinc-500' : 'text-[#eee4da]'}`}>移动步数</span>
            <span className={`font-mono text-2xl font-bold ${isDark ? 'text-zinc-200' : 'text-white'}`}>{moves}</span>
          </div>
          <div className={`border rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-[#bbada0] border-transparent'}`}>
            <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-zinc-500' : 'text-[#eee4da]'}`}>游戏时间</span>
            <span className={`font-mono text-2xl font-bold ${isDark ? 'text-zinc-200' : 'text-white'}`}>{formatTime(time)}</span>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <button 
            onClick={() => setShowInstructions(true)} 
            className={`text-sm transition-colors underline underline-offset-4 ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-[#776e65] hover:text-black'}`}
          >
            查看游戏说明
          </button>
        </div>

        {/* Instructions Modal */}
        {showInstructions && (
          <div 
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${isDark ? 'bg-black/60' : 'bg-black/50'}`} 
            onClick={() => setShowInstructions(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`border p-6 sm:p-8 rounded-2xl max-w-sm w-full shadow-2xl ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-[#faf8ef] border-transparent'}`} 
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-zinc-100' : 'text-[#776e65]'}`}>游戏说明</h2>
                <button onClick={() => setShowInstructions(false)} className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-[#776e65] hover:text-black'}`}>
                  <X size={28} />
                </button>
              </div>
              <div className={`mb-8 space-y-4 text-base sm:text-lg ${isDark ? 'text-zinc-400' : 'text-[#776e65]'}`}>
                <p>
                  <strong className={isDark ? 'text-zinc-200' : 'font-bold'}>滑动</strong>（或使用方向键）来移动方块。
                </p>
                <p>
                  当两个相同数字的方块接触时，它们会<strong className={isDark ? 'text-zinc-200' : 'font-bold'}>合并成一个</strong>。
                </p>
                <p>
                  不断合并，直到获得 <strong className={isDark ? 'text-pink-400' : 'font-bold'}>2048</strong> 方块！
                </p>
              </div>
              <button 
                onClick={() => setShowInstructions(false)} 
                className={`w-full font-bold py-3.5 rounded-xl transition-colors text-lg shadow-lg ${isDark ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20' : 'bg-[#8f7a66] text-white hover:bg-[#9f8b77] shadow-md'}`}
              >
                明白了！
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
