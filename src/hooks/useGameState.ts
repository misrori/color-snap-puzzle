import { useState, useCallback, useRef } from "react";

export type BlockColor = "red" | "blue" | "green" | "yellow" | "purple" | "orange" | "pink" | "cyan";

export interface Block {
  id: string;
  color: BlockColor;
  currentPos: { row: number; col: number };
  targetPos: { row: number; col: number };
  isPlaced: boolean;
}

export interface LevelConfig {
  gridSize: number;
  blockCount: number;
  colors: BlockColor[];
}

const ALL_COLORS: BlockColor[] = ["red", "blue", "green", "yellow", "purple", "orange", "pink", "cyan"];

function getLevelConfig(level: number): LevelConfig {
  if (level <= 2) return { gridSize: 3, blockCount: 3, colors: ALL_COLORS.slice(0, 3) };
  if (level <= 4) return { gridSize: 3, blockCount: 4, colors: ALL_COLORS.slice(0, 4) };
  if (level <= 6) return { gridSize: 4, blockCount: 5, colors: ALL_COLORS.slice(0, 5) };
  if (level <= 9) return { gridSize: 4, blockCount: 6, colors: ALL_COLORS.slice(0, 6) };
  return { gridSize: 5, blockCount: Math.min(8, 6 + Math.floor((level - 9) / 2)), colors: ALL_COLORS.slice(0, Math.min(8, 6 + Math.floor((level - 9) / 2))) };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateLevel(level: number): { blocks: Block[]; gridSize: number } {
  const config = getLevelConfig(level);
  const { gridSize, blockCount, colors } = config;

  // Generate random target positions
  const allPositions: { row: number; col: number }[] = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      allPositions.push({ row: r, col: c });
    }
  }

  const shuffledPositions = shuffle(allPositions);
  const targetPositions = shuffledPositions.slice(0, blockCount);
  
  // Generate starting positions (different from targets)
  const remainingPositions = shuffledPositions.slice(blockCount);
  let startPositions: { row: number; col: number }[];
  
  if (remainingPositions.length >= blockCount) {
    startPositions = shuffle(remainingPositions).slice(0, blockCount);
  } else {
    // Use all positions but ensure each start differs from its target
    startPositions = shuffle(allPositions).slice(0, blockCount);
    // Ensure no block starts at its target
    for (let i = 0; i < blockCount; i++) {
      if (startPositions[i].row === targetPositions[i].row && startPositions[i].col === targetPositions[i].col) {
        const swapIdx = (i + 1) % blockCount;
        [startPositions[i], startPositions[swapIdx]] = [startPositions[swapIdx], startPositions[i]];
      }
    }
  }

  const blocks: Block[] = colors.slice(0, blockCount).map((color, i) => ({
    id: `block-${i}`,
    color,
    currentPos: startPositions[i],
    targetPos: targetPositions[i],
    isPlaced: false,
  }));

  return { blocks, gridSize };
}

export function useGameState() {
  const [level, setLevel] = useState(1);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<"menu" | "playing" | "won">("menu");
  const [showCelebration, setShowCelebration] = useState(false);

  const initialData = useRef(generateLevel(1));
  const [blocks, setBlocks] = useState<Block[]>(initialData.current.blocks);
  const [gridSize, setGridSize] = useState(initialData.current.gridSize);

  const startGame = useCallback(() => {
    const data = generateLevel(1);
    setLevel(1);
    setMoves(0);
    setScore(0);
    setBlocks(data.blocks);
    setGridSize(data.gridSize);
    setGameState("playing");
    setShowCelebration(false);
  }, []);

  const restartLevel = useCallback(() => {
    const data = generateLevel(level);
    setMoves(0);
    setBlocks(data.blocks);
    setGridSize(data.gridSize);
    setShowCelebration(false);
  }, [level]);

  const moveBlock = useCallback((blockId: string, newPos: { row: number; col: number }) => {
    setBlocks(prev => {
      // Check if position is occupied by another block
      const occupant = prev.find(b => b.id !== blockId && b.currentPos.row === newPos.row && b.currentPos.col === newPos.col);
      if (occupant) return prev;

      const updated = prev.map(b => {
        if (b.id !== blockId) return b;
        const isPlaced = b.targetPos.row === newPos.row && b.targetPos.col === newPos.col;
        return { ...b, currentPos: newPos, isPlaced };
      });

      setMoves(m => m + 1);

      // Check win
      if (updated.every(b => b.isPlaced)) {
        setTimeout(() => {
          setShowCelebration(true);
          setTimeout(() => {
            setGameState("won");
          }, 1200);
        }, 300);
      }

      return updated;
    });
  }, []);

  const nextLevel = useCallback(() => {
    const newLevel = level + 1;
    const bonus = Math.max(0, 100 - moves * 5);
    setScore(s => s + bonus + 50);
    const data = generateLevel(newLevel);
    setLevel(newLevel);
    setMoves(0);
    setBlocks(data.blocks);
    setGridSize(data.gridSize);
    setGameState("playing");
    setShowCelebration(false);
  }, [level, moves]);

  return {
    level, moves, score, blocks, gridSize,
    gameState, showCelebration,
    startGame, restartLevel, moveBlock, nextLevel,
    setGameState,
  };
}
