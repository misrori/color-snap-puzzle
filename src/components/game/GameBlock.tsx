import React, { useRef, useState, useCallback } from "react";
import type { Block, BlockColor } from "@/hooks/useGameState";

const COLOR_CLASSES: Record<BlockColor, string> = {
  red: "bg-game-red",
  blue: "bg-game-blue",
  green: "bg-game-green",
  yellow: "bg-game-yellow",
  purple: "bg-game-purple",
  orange: "bg-game-orange",
  pink: "bg-game-pink",
  cyan: "bg-game-cyan",
};

const COLOR_EMOJIS: Record<BlockColor, string> = {
  red: "🔴",
  blue: "🔵",
  green: "🟢",
  yellow: "🟡",
  purple: "🟣",
  orange: "🟠",
  pink: "💗",
  cyan: "💎",
};

interface GameBlockProps {
  block: Block;
  cellSize: number;
  gridOffset: { x: number; y: number };
  gridSize: number;
  onMove: (blockId: string, newPos: { row: number; col: number }) => void;
}

export const GameBlock: React.FC<GameBlockProps> = ({ block, cellSize, gridOffset, gridSize, onMove }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const startRef = useRef<{ x: number; y: number; origX: number; origY: number } | null>(null);

  const gap = 6;
  const blockSize = cellSize - gap;
  const baseX = gridOffset.x + block.currentPos.col * cellSize + gap / 2;
  const baseY = gridOffset.y + block.currentPos.row * cellSize + gap / 2;

  const getGridPos = useCallback((clientX: number, clientY: number) => {
    const col = Math.round((clientX - gridOffset.x - cellSize / 2) / cellSize);
    const row = Math.round((clientY - gridOffset.y - cellSize / 2) / cellSize);
    return {
      row: Math.max(0, Math.min(gridSize - 1, row)),
      col: Math.max(0, Math.min(gridSize - 1, col)),
    };
  }, [gridOffset, cellSize, gridSize]);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (block.isPlaced) return;
    setDragging(true);
    startRef.current = { x: clientX, y: clientY, origX: baseX, origY: baseY };
    setDragPos({ x: baseX, y: baseY });
  }, [block.isPlaced, baseX, baseY]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!startRef.current || !dragging) return;
    const dx = clientX - startRef.current.x;
    const dy = clientY - startRef.current.y;
    setDragPos({
      x: startRef.current.origX + dx,
      y: startRef.current.origY + dy,
    });
  }, [dragging]);

  const handleEnd = useCallback((clientX: number, clientY: number) => {
    if (!dragging) return;
    setDragging(false);
    setDragPos(null);
    startRef.current = null;
    const newPos = getGridPos(clientX, clientY);
    if (newPos.row !== block.currentPos.row || newPos.col !== block.currentPos.col) {
      onMove(block.id, newPos);
    }
  }, [dragging, getGridPos, block, onMove]);

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    handleStart(t.clientX, t.clientY);
  }, [handleStart]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    handleMove(t.clientX, t.clientY);
  }, [handleMove]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    handleEnd(t.clientX, t.clientY);
  }, [handleEnd]);

  // Mouse handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);

    const onMM = (ev: MouseEvent) => handleMove(ev.clientX, ev.clientY);
    const onMU = (ev: MouseEvent) => {
      handleEnd(ev.clientX, ev.clientY);
      window.removeEventListener("mousemove", onMM);
      window.removeEventListener("mouseup", onMU);
    };
    window.addEventListener("mousemove", onMM);
    window.addEventListener("mouseup", onMU);
  }, [handleStart, handleMove, handleEnd]);

  const x = dragPos ? dragPos.x : baseX;
  const y = dragPos ? dragPos.y : baseY;

  return (
    <div
      ref={ref}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      className={`absolute rounded-xl flex items-center justify-center text-2xl font-black select-none
        ${COLOR_CLASSES[block.color]}
        ${dragging ? "game-block-shadow-dragging z-50 scale-110" : "game-block-shadow z-30"}
        ${block.isPlaced ? "animate-snap opacity-90 z-20" : "cursor-grab active:cursor-grabbing"}
        transition-[left,top] ${dragging ? "duration-0" : "duration-200 ease-out"}
      `}
      style={{
        width: blockSize,
        height: blockSize,
        left: x,
        top: y,
      }}
    >
      <span className="drop-shadow-sm">{COLOR_EMOJIS[block.color]}</span>
    </div>
  );
};
