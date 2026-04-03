import { useState, useCallback, useRef, useEffect } from "react";

// Tetromino shapes and their rotations
export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type CellColor = PieceType | null;

const PIECES: Record<PieceType, number[][][]> = {
  I: [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
    [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
  ],
  O: [
    [[1,1],[1,1]],
    [[1,1],[1,1]],
    [[1,1],[1,1]],
    [[1,1],[1,1]],
  ],
  T: [
    [[0,1,0],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,1],[0,1,0]],
    [[0,1,0],[1,1,0],[0,1,0]],
  ],
  S: [
    [[0,1,1],[1,1,0],[0,0,0]],
    [[0,1,0],[0,1,1],[0,0,1]],
    [[0,0,0],[0,1,1],[1,1,0]],
    [[1,0,0],[1,1,0],[0,1,0]],
  ],
  Z: [
    [[1,1,0],[0,1,1],[0,0,0]],
    [[0,0,1],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,0],[0,1,1]],
    [[0,1,0],[1,1,0],[1,0,0]],
  ],
  J: [
    [[1,0,0],[1,1,1],[0,0,0]],
    [[0,1,1],[0,1,0],[0,1,0]],
    [[0,0,0],[1,1,1],[0,0,1]],
    [[0,1,0],[0,1,0],[1,1,0]],
  ],
  L: [
    [[0,0,1],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,0],[0,1,1]],
    [[0,0,0],[1,1,1],[1,0,0]],
    [[1,1,0],[0,1,0],[0,1,0]],
  ],
};

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

const PIECE_TYPES: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

interface ActivePiece {
  type: PieceType;
  rotation: number;
  x: number;
  y: number;
}

function createEmptyBoard(): CellColor[][] {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
}

function getShape(piece: ActivePiece): number[][] {
  return PIECES[piece.type][piece.rotation];
}

function randomPiece(): PieceType {
  return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
}

function isValid(board: CellColor[][], piece: ActivePiece): boolean {
  const shape = getShape(piece);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const newR = piece.y + r;
      const newC = piece.x + c;
      if (newC < 0 || newC >= BOARD_WIDTH || newR >= BOARD_HEIGHT) return false;
      if (newR < 0) continue;
      if (board[newR][newC]) return false;
    }
  }
  return true;
}

function placePiece(board: CellColor[][], piece: ActivePiece): CellColor[][] {
  const newBoard = board.map(row => [...row]);
  const shape = getShape(piece);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const newR = piece.y + r;
      const newC = piece.x + c;
      if (newR >= 0 && newR < BOARD_HEIGHT) {
        newBoard[newR][newC] = piece.type;
      }
    }
  }
  return newBoard;
}

function clearLines(board: CellColor[][]): { board: CellColor[][]; linesCleared: number } {
  const remaining = board.filter(row => row.some(cell => cell === null));
  const linesCleared = BOARD_HEIGHT - remaining.length;
  const emptyRows = Array.from({ length: linesCleared }, () => Array(BOARD_WIDTH).fill(null) as CellColor[]);
  return { board: [...emptyRows, ...remaining], linesCleared };
}

function getSpeed(level: number): number {
  return Math.max(100, 800 - (level - 1) * 70);
}

function getLinePoints(lines: number, level: number): number {
  const base = [0, 100, 300, 500, 800];
  return (base[lines] || 800) * level;
}

function spawnPiece(type: PieceType): ActivePiece {
  return { type, rotation: 0, x: Math.floor((BOARD_WIDTH - PIECES[type][0][0].length) / 2), y: -1 };
}

export type GameState = "menu" | "playing" | "paused" | "gameover";

export function useTetris() {
  const [board, setBoard] = useState<CellColor[][]>(createEmptyBoard);
  const [gameState, setGameState] = useState<GameState>("menu");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [current, setCurrent] = useState<ActivePiece | null>(null);
  const [next, setNext] = useState<PieceType>(randomPiece);
  const [flashRows, setFlashRows] = useState<number[]>([]);

  const tickRef = useRef<number | null>(null);
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const boardRef = useRef(board);
  boardRef.current = board;
  const currentRef = useRef(current);
  currentRef.current = current;
  const nextRef = useRef(next);
  nextRef.current = next;
  const levelRef = useRef(level);
  levelRef.current = level;
  const linesRef = useRef(lines);
  linesRef.current = lines;

  const lockPiece = useCallback(() => {
    const cur = currentRef.current;
    if (!cur) return;

    const newBoard = placePiece(boardRef.current, cur);
    const { board: clearedBoard, linesCleared } = clearLines(newBoard);

    if (linesCleared > 0) {
      // Find which rows were cleared for flash effect
      const fullRows: number[] = [];
      newBoard.forEach((row, i) => {
        if (row.every(cell => cell !== null)) fullRows.push(i);
      });
      setFlashRows(fullRows);
      setTimeout(() => setFlashRows([]), 300);
    }

    setBoard(clearedBoard);
    const totalLines = linesRef.current + linesCleared;
    setLines(totalLines);
    setScore(s => s + getLinePoints(linesCleared, levelRef.current));
    const newLevel = Math.floor(totalLines / 10) + 1;
    setLevel(newLevel);

    // Spawn next
    const nextType = nextRef.current;
    const spawned = spawnPiece(nextType);
    if (!isValid(clearedBoard, spawned)) {
      setGameState("gameover");
      setCurrent(null);
      return;
    }
    setCurrent(spawned);
    setNext(randomPiece());
  }, []);

  const tick = useCallback(() => {
    if (gameStateRef.current !== "playing") return;
    const cur = currentRef.current;
    if (!cur) return;

    const moved = { ...cur, y: cur.y + 1 };
    if (isValid(boardRef.current, moved)) {
      setCurrent(moved);
    } else {
      lockPiece();
    }
  }, [lockPiece]);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }
    tickRef.current = window.setInterval(tick, getSpeed(level));
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [gameState, level, tick]);

  const startGame = useCallback(() => {
    const b = createEmptyBoard();
    setBoard(b);
    setScore(0);
    setLevel(1);
    setLines(0);
    setFlashRows([]);
    const firstType = randomPiece();
    const spawned = spawnPiece(firstType);
    setCurrent(spawned);
    setNext(randomPiece());
    setGameState("playing");
  }, []);

  const moveLeft = useCallback(() => {
    const cur = currentRef.current;
    if (!cur || gameStateRef.current !== "playing") return;
    const moved = { ...cur, x: cur.x - 1 };
    if (isValid(boardRef.current, moved)) setCurrent(moved);
  }, []);

  const moveRight = useCallback(() => {
    const cur = currentRef.current;
    if (!cur || gameStateRef.current !== "playing") return;
    const moved = { ...cur, x: cur.x + 1 };
    if (isValid(boardRef.current, moved)) setCurrent(moved);
  }, []);

  const moveDown = useCallback(() => {
    const cur = currentRef.current;
    if (!cur || gameStateRef.current !== "playing") return;
    const moved = { ...cur, y: cur.y + 1 };
    if (isValid(boardRef.current, moved)) {
      setCurrent(moved);
      setScore(s => s + 1);
    }
  }, []);

  const hardDrop = useCallback(() => {
    const cur = currentRef.current;
    if (!cur || gameStateRef.current !== "playing") return;
    let dropped = { ...cur };
    let dropDist = 0;
    while (isValid(boardRef.current, { ...dropped, y: dropped.y + 1 })) {
      dropped.y++;
      dropDist++;
    }
    setCurrent(dropped);
    setScore(s => s + dropDist * 2);
    // Lock immediately
    const newBoard = placePiece(boardRef.current, dropped);
    const { board: clearedBoard, linesCleared } = clearLines(newBoard);

    if (linesCleared > 0) {
      const fullRows: number[] = [];
      newBoard.forEach((row, i) => {
        if (row.every(cell => cell !== null)) fullRows.push(i);
      });
      setFlashRows(fullRows);
      setTimeout(() => setFlashRows([]), 300);
    }

    setBoard(clearedBoard);
    const totalLines = linesRef.current + linesCleared;
    setLines(totalLines);
    setScore(s => s + getLinePoints(linesCleared, levelRef.current));
    setLevel(Math.floor(totalLines / 10) + 1);

    const nextType = nextRef.current;
    const spawned = spawnPiece(nextType);
    if (!isValid(clearedBoard, spawned)) {
      setGameState("gameover");
      setCurrent(null);
      return;
    }
    setCurrent(spawned);
    setNext(randomPiece());
  }, []);

  const rotate = useCallback(() => {
    const cur = currentRef.current;
    if (!cur || gameStateRef.current !== "playing") return;
    const rotated = { ...cur, rotation: (cur.rotation + 1) % 4 };
    if (isValid(boardRef.current, rotated)) {
      setCurrent(rotated);
      return;
    }
    // Wall kick attempts
    for (const kick of [-1, 1, -2, 2]) {
      const kicked = { ...rotated, x: rotated.x + kick };
      if (isValid(boardRef.current, kicked)) {
        setCurrent(kicked);
        return;
      }
    }
  }, []);

  const togglePause = useCallback(() => {
    setGameState(s => s === "playing" ? "paused" : s === "paused" ? "playing" : s);
  }, []);

  // Compute ghost piece position
  let ghostY = current?.y ?? 0;
  if (current) {
    while (isValid(board, { ...current, y: ghostY + 1 })) {
      ghostY++;
    }
  }

  // Build display board (board + current piece + ghost)
  const displayBoard: (CellColor | "ghost")[][] = board.map(row => [...row] as (CellColor | "ghost")[]);
  if (current) {
    const shape = getShape(current);
    // Ghost
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const dr = ghostY + r;
        const dc = current.x + c;
        if (dr >= 0 && dr < BOARD_HEIGHT && dc >= 0 && dc < BOARD_WIDTH && !displayBoard[dr][dc]) {
          displayBoard[dr][dc] = "ghost";
        }
      }
    }
    // Active piece
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const dr = current.y + r;
        const dc = current.x + c;
        if (dr >= 0 && dr < BOARD_HEIGHT && dc >= 0 && dc < BOARD_WIDTH) {
          displayBoard[dr][dc] = current.type;
        }
      }
    }
  }

  // Next piece shape
  const nextShape = PIECES[next][0];

  return {
    displayBoard, nextShape, next, score, level, lines,
    gameState, flashRows,
    startGame, moveLeft, moveRight, moveDown, hardDrop, rotate, togglePause,
    setGameState,
  };
}

export { BOARD_WIDTH, BOARD_HEIGHT };
