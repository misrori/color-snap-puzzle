import React, { useRef, useState, useEffect } from "react";
import type { Block, BlockColor } from "@/hooks/useGameState";
import { GameBlock } from "./GameBlock";

const TARGET_COLORS: Record<BlockColor, string> = {
  red: "border-game-red bg-game-red/10",
  blue: "border-game-blue bg-game-blue/10",
  green: "border-game-green bg-game-green/10",
  yellow: "border-game-yellow bg-game-yellow/10",
  purple: "border-game-purple bg-game-purple/10",
  orange: "border-game-orange bg-game-orange/10",
  pink: "border-game-pink bg-game-pink/10",
  cyan: "border-game-cyan bg-game-cyan/10",
};

interface GameBoardProps {
  blocks: Block[];
  gridSize: number;
  onMove: (blockId: string, newPos: { row: number; col: number }) => void;
  showCelebration: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({ blocks, gridSize, onMove, showCelebration }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height);
      const cellSize = size / gridSize;
      setDimensions({
        width: size,
        height: size,
        offsetX: rect.left + (rect.width - size) / 2,
        offsetY: rect.top + (rect.height - size) / 2,
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [gridSize]);

  const cellSize = dimensions.width / gridSize;
  const gap = 6;

  return (
    <div ref={containerRef} className="w-full aspect-square max-w-[400px] mx-auto relative">
      {/* Grid background */}
      <div
        className={`absolute rounded-2xl bg-game-grid ${showCelebration ? "animate-celebrate" : ""}`}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Grid cells */}
        {Array.from({ length: gridSize * gridSize }).map((_, i) => {
          const row = Math.floor(i / gridSize);
          const col = i % gridSize;
          return (
            <div
              key={i}
              className="absolute rounded-lg bg-game-surface/60"
              style={{
                width: cellSize - gap,
                height: cellSize - gap,
                left: col * cellSize + gap / 2,
                top: row * cellSize + gap / 2,
              }}
            />
          );
        })}

        {/* Target indicators */}
        {blocks.map((block) => (
          <div
            key={`target-${block.id}`}
            className={`absolute rounded-lg border-2 border-dashed ${TARGET_COLORS[block.color]} flex items-center justify-center`}
            style={{
              width: cellSize - gap,
              height: cellSize - gap,
              left: block.targetPos.col * cellSize + gap / 2,
              top: block.targetPos.row * cellSize + gap / 2,
            }}
          >
            {!block.isPlaced && (
              <span className="text-lg opacity-30">✦</span>
            )}
          </div>
        ))}
      </div>

      {/* Blocks */}
      {blocks.map((block, i) => (
        <div key={block.id} className="animate-pop-in" style={{ animationDelay: `${i * 80}ms` }}>
          <GameBlock
            block={block}
            cellSize={cellSize}
            gridOffset={{ x: dimensions.offsetX, y: dimensions.offsetY }}
            gridSize={gridSize}
            onMove={onMove}
          />
        </div>
      ))}

      {/* Celebration overlay */}
      {showCelebration && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <span className="text-6xl animate-float-up">🎉</span>
        </div>
      )}
    </div>
  );
};
