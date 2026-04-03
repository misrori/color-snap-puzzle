import React from "react";
import { Play } from "lucide-react";

interface GameMenuProps {
  onStart: () => void;
}

export const GameMenu: React.FC<GameMenuProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-8">
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-2">
          {["🔴", "🔵", "🟢", "🟡"].map((e, i) => (
            <span key={i} className="text-4xl animate-pop-in" style={{ animationDelay: `${i * 120}ms` }}>
              {e}
            </span>
          ))}
        </div>
        <h1 className="text-4xl font-black text-foreground tracking-tight">
          Színes Blokkok
        </h1>
        <p className="text-muted-foreground text-center text-base max-w-[260px]">
          Húzd a blokkokat a megfelelő helyükre! 🧩
        </p>
      </div>

      <button
        onClick={onStart}
        className="flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-extrabold text-lg game-block-shadow active:scale-95 transition-transform"
      >
        <Play size={24} />
        Játék indítása
      </button>

      <div className="text-xs text-muted-foreground text-center max-w-[240px]">
        Minden szintnél több blokk és nagyobb tábla vár rád!
      </div>
    </div>
  );
};
