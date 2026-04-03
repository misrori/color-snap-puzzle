import React from "react";
import { RotateCcw, Home } from "lucide-react";

interface GameHeaderProps {
  level: number;
  moves: number;
  score: number;
  onRestart: () => void;
  onMenu: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ level, moves, score, onRestart, onMenu }) => {
  return (
    <div className="flex items-center justify-between w-full max-w-[400px] mx-auto px-1 py-3">
      <button
        onClick={onMenu}
        className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground active:scale-95 transition-transform"
      >
        <Home size={20} />
      </button>

      <div className="flex items-center gap-4 text-sm font-bold">
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground">Szint</span>
          <span className="text-foreground text-lg">{level}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground">Lépés</span>
          <span className="text-foreground text-lg">{moves}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground">Pont</span>
          <span className="text-primary text-lg">{score}</span>
        </div>
      </div>

      <button
        onClick={onRestart}
        className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground active:scale-95 transition-transform"
      >
        <RotateCcw size={20} />
      </button>
    </div>
  );
};
