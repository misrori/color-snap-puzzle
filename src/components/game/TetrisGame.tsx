import React, { useEffect, useRef, useCallback } from "react";
import { useTetris, BOARD_WIDTH, BOARD_HEIGHT, type PieceType, type CellColor } from "@/hooks/useTetris";
import { Play, Pause, RotateCw, ChevronDown, ChevronLeft, ChevronRight, ChevronsDown, Home, RefreshCw } from "lucide-react";

const PIECE_COLORS: Record<PieceType, string> = {
  I: "bg-game-cyan",
  O: "bg-game-yellow",
  T: "bg-game-purple",
  S: "bg-game-green",
  Z: "bg-game-red",
  J: "bg-game-blue",
  L: "bg-game-orange",
};

const PIECE_BORDER: Record<PieceType, string> = {
  I: "border-[hsl(185,75%,38%)]",
  O: "border-[hsl(45,93%,48%)]",
  T: "border-[hsl(270,70%,50%)]",
  S: "border-[hsl(142,64%,40%)]",
  Z: "border-[hsl(0,78%,52%)]",
  J: "border-[hsl(217,90%,50%)]",
  L: "border-[hsl(25,95%,48%)]",
};

function Cell({ value, flash }: { value: CellColor | "ghost"; flash: boolean }) {
  if (value === "ghost") {
    return <div className="w-full h-full rounded-[3px] border border-muted-foreground/20 bg-muted-foreground/5" />;
  }
  if (!value) {
    return <div className={`w-full h-full rounded-[2px] ${flash ? "bg-primary/40 animate-pulse" : "bg-game-grid/80"}`} />;
  }
  return (
    <div
      className={`w-full h-full rounded-[3px] ${PIECE_COLORS[value]} border ${PIECE_BORDER[value]} border-b-2`}
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)" }}
    />
  );
}

function NextPiece({ shape, type }: { shape: number[][]; type: PieceType }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      {shape.map((row, r) => (
        <div key={r} className="flex gap-0.5">
          {row.map((cell, c) => (
            <div key={c} className="w-4 h-4">
              {cell ? (
                <div className={`w-full h-full rounded-[2px] ${PIECE_COLORS[type]} border ${PIECE_BORDER[type]}`}
                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)" }} />
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const TetrisGame: React.FC = () => {
  const game = useTetris();
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimer = useRef<number | null>(null);

  // Soft drop (acceleration) while holding
  const startSoftDrop = useCallback(() => {
    if (longPressTimer.current) return;
    longPressTimer.current = window.setInterval(() => {
      game.moveDown();
    }, 50) as unknown as number; // Fast acceleration
  }, [game.moveDown]);

  const stopSoftDrop = useCallback(() => {
    if (longPressTimer.current) {
      clearInterval(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    if (game.gameState !== "playing") return;
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft": e.preventDefault(); game.moveLeft(); break;
        case "ArrowRight": e.preventDefault(); game.moveRight(); break;
        case "ArrowDown": e.preventDefault(); game.moveDown(); break;
        case "ArrowUp": e.preventDefault(); game.rotate(); break;
        case " ": e.preventDefault(); game.hardDrop(); break;
        case "p": case "P": game.togglePause(); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [game.gameState, game.moveLeft, game.moveRight, game.moveDown, game.rotate, game.hardDrop, game.togglePause]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, time: Date.now() };
    
    // Start long press timer for acceleration
    longPressTimer.current = window.setTimeout(() => {
      startSoftDrop();
    }, 250) as unknown as number; // Long press after 250ms
  }, [startSoftDrop]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    stopSoftDrop();

    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    const dt = Date.now() - touchStart.current.time;
    touchStart.current = null;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Tap (rotate)
    if (absDx < 15 && absDy < 15 && dt < 200) {
      game.rotate();
      return;
    }

    // Swipes
    if (absDy > absDx) {
      if (dy > 35) {
        // Swipe down - hard drop
        game.hardDrop();
      } else if (dy < -35) {
        // Swipe up - rotate
        game.rotate();
      }
    } else {
      if (dx > 25) game.moveRight();
      else if (dx < -25) game.moveLeft();
    }
  }, [game.rotate, game.hardDrop, game.moveRight, game.moveLeft, stopSoftDrop]);

  // MENU
  if (game.gameState === "menu") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1">
            {["I", "T", "S", "Z", "L"].map((t, i) => (
              <div key={t} className={`w-8 h-8 rounded-md ${PIECE_COLORS[t as PieceType]} animate-pop-in game-block-shadow`}
                style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tight mt-2">
            Tetra Puzzle
          </h1>
          <p className="text-muted-foreground text-center text-base max-w-[260px]">
            Clear lines with falling blocks! 🎮
          </p>
        </div>
        <button onClick={game.startGame}
          className="flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-extrabold text-lg game-block-shadow active:scale-95 transition-transform">
          <Play size={24} /> Start Game
        </button>
        <div className="text-xs text-muted-foreground text-center max-w-[260px] space-y-1">
          <p>📱 Tap = rotate</p>
          <p>👆 Swipe side = move</p>
          <p>👇 Swipe down = drop</p>
        </div>
      </div>
    );
  }

  // GAME OVER
  if (game.gameState === "gameover") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-6">
        <span className="text-6xl animate-pop-in">💥</span>
        <h2 className="text-3xl font-black text-foreground">Game Over!</h2>
        <div className="bg-game-surface rounded-2xl p-6 game-block-shadow flex flex-col items-center gap-3 w-full max-w-[280px]">
          <div className="flex justify-between w-full">
            <span className="text-muted-foreground">Score</span>
            <span className="font-bold text-primary text-xl">{game.score}</span>
          </div>
          <div className="flex justify-between w-full">
            <span className="text-muted-foreground">Lines</span>
            <span className="font-bold">{game.lines}</span>
          </div>
          <div className="flex justify-between w-full">
            <span className="text-muted-foreground">Level</span>
            <span className="font-bold">{game.level}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => game.setGameState("menu")}
            className="flex items-center gap-2 bg-secondary text-foreground px-5 py-3 rounded-xl font-bold active:scale-95 transition-transform">
            <Home size={18} /> Menu
          </button>
          <button onClick={game.startGame}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold game-block-shadow active:scale-95 transition-transform">
            <RefreshCw size={18} /> Restart
          </button>
        </div>
      </div>
    );
  }

  // PLAYING / PAUSED
  const cellSize = `calc(min((100vw - 120px) / ${BOARD_WIDTH}, (100vh - 200px) / ${BOARD_HEIGHT}))`;

  return (
    <div className="flex flex-col items-center min-h-screen select-none">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-md px-3 py-2">
        <button onClick={() => game.setGameState("menu")}
          className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground active:scale-95 transition-transform">
          <Home size={18} />
        </button>
        <div className="flex items-center gap-4 text-sm font-bold">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-muted-foreground uppercase">Score</span>
            <span className="text-primary text-base">{game.score}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-muted-foreground uppercase">Lines</span>
            <span className="text-foreground text-base">{game.lines}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-muted-foreground uppercase">Level</span>
            <span className="text-foreground text-base">{game.level}</span>
          </div>
        </div>
        <button onClick={game.togglePause}
          className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground active:scale-95 transition-transform">
          {game.gameState === "paused" ? <Play size={18} /> : <Pause size={18} />}
        </button>
      </div>

      {/* Game area */}
      <div className="flex items-start justify-center gap-3 flex-1 px-2 pt-1">
        {/* Board */}
        <div
          className="relative rounded-xl overflow-hidden bg-foreground/5 border-2 border-border"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${cellSize})`,
            gridTemplateRows: `repeat(${BOARD_HEIGHT}, ${cellSize})`,
            gap: "1px",
            padding: "2px",
          }}
        >
          {game.displayBoard.map((row, r) =>
            row.map((cell, c) => (
              <div key={`${r}-${c}`} style={{ width: cellSize, height: cellSize }}>
                <Cell value={cell} flash={game.flashRows.includes(r)} />
              </div>
            ))
          )}

          {/* Pause overlay */}
          {game.gameState === "paused" && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
              <div className="text-center">
                <p className="text-2xl font-black text-foreground">⏸️ Paused</p>
                <p className="text-sm text-muted-foreground mt-1">Tap ▶ to resume</p>
              </div>
            </div>
          )}
        </div>

        {/* Side panel - next piece */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Next</span>
          <div className="bg-game-surface/50 backdrop-blur-md rounded-2xl p-3 border border-white/5 shadow-2xl">
            <NextPiece shape={game.nextShape} type={game.next} />
          </div>
        </div>
      </div>

      {/* Touch controls - Improved for Mobile */}
      <div className="grid grid-cols-5 gap-2 pb-8 pt-4 px-4 w-full max-w-md">
        <button onTouchStart={(e) => { e.preventDefault(); game.moveLeft(); }} onMouseDown={game.moveLeft}
          className="aspect-square rounded-2xl bg-secondary/80 backdrop-blur-sm flex items-center justify-center text-foreground active:scale-90 active:bg-primary/20 transition-all shadow-lg border border-white/5">
          <ChevronLeft size={32} />
        </button>
        <button onTouchStart={(e) => { e.preventDefault(); game.moveDown(); }} onMouseDown={game.moveDown}
          className="aspect-square rounded-2xl bg-secondary/80 backdrop-blur-sm flex items-center justify-center text-foreground active:scale-90 active:bg-primary/20 transition-all shadow-lg border border-white/5">
          <ChevronDown size={32} />
        </button>
        <button onTouchStart={(e) => { e.preventDefault(); game.hardDrop(); }} onMouseDown={game.hardDrop}
          className="aspect-square rounded-2xl bg-primary/30 backdrop-blur-sm flex items-center justify-center text-primary active:scale-90 active:bg-primary/40 transition-all shadow-xl border border-primary/20">
          <ChevronsDown size={32} />
        </button>
        <button onTouchStart={(e) => { e.preventDefault(); game.moveRight(); }} onMouseDown={game.moveRight}
          className="aspect-square rounded-2xl bg-secondary/80 backdrop-blur-sm flex items-center justify-center text-foreground active:scale-90 active:bg-primary/20 transition-all shadow-lg border border-white/5">
          <ChevronRight size={32} />
        </button>
        <button onTouchStart={(e) => { e.preventDefault(); game.rotate(); }} onMouseDown={game.rotate}
          className="aspect-square rounded-2xl bg-accent/80 backdrop-blur-sm flex items-center justify-center text-primary active:scale-90 active:bg-primary/20 transition-all shadow-lg border border-primary/10">
          <RotateCw size={32} />
        </button>
      </div>
    </div>
  );
};

export default TetrisGame;
