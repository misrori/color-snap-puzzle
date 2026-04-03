import React from "react";
import { ArrowRight, RotateCcw } from "lucide-react";

interface GameWinProps {
  level: number;
  moves: number;
  score: number;
  onNext: () => void;
  onRestart: () => void;
}

export const GameWin: React.FC<GameWinProps> = ({ level, moves, score, onNext, onRestart }) => {
  const bonus = Math.max(0, 100 - moves * 5);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-6">
      <span className="text-6xl animate-pop-in">🏆</span>

      <div className="flex flex-col items-center gap-1">
        <h2 className="text-3xl font-black text-foreground">Szint teljesítve!</h2>
        <p className="text-muted-foreground text-lg">Szint {level}</p>
      </div>

      <div className="bg-game-surface rounded-2xl p-6 game-block-shadow flex flex-col items-center gap-3 w-full max-w-[280px]">
        <div className="flex justify-between w-full">
          <span className="text-muted-foreground">Lépések</span>
          <span className="font-bold text-foreground">{moves}</span>
        </div>
        <div className="flex justify-between w-full">
          <span className="text-muted-foreground">Bónusz</span>
          <span className="font-bold text-primary">+{bonus}</span>
        </div>
        <div className="w-full h-px bg-border" />
        <div className="flex justify-between w-full">
          <span className="text-muted-foreground font-bold">Összpontszám</span>
          <span className="font-black text-primary text-xl">{score + bonus + 50}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRestart}
          className="flex items-center gap-2 bg-secondary text-foreground px-5 py-3 rounded-xl font-bold active:scale-95 transition-transform"
        >
          <RotateCcw size={18} />
          Újra
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold game-block-shadow active:scale-95 transition-transform"
        >
          Következő
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
