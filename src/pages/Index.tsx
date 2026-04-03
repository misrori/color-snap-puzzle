import { useGameState } from "@/hooks/useGameState";
import { GameMenu } from "@/components/game/GameMenu";
import { GameBoard } from "@/components/game/GameBoard";
import { GameHeader } from "@/components/game/GameHeader";
import { GameWin } from "@/components/game/GameWin";

const Index = () => {
  const game = useGameState();

  if (game.gameState === "menu") {
    return <GameMenu onStart={game.startGame} />;
  }

  if (game.gameState === "won") {
    return (
      <GameWin
        level={game.level}
        moves={game.moves}
        score={game.score}
        onNext={game.nextLevel}
        onRestart={game.restartLevel}
      />
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen px-4 pt-2 pb-6">
      <GameHeader
        level={game.level}
        moves={game.moves}
        score={game.score}
        onRestart={game.restartLevel}
        onMenu={() => game.setGameState("menu")}
      />
      <div className="flex-1 flex items-center w-full">
        <GameBoard
          blocks={game.blocks}
          gridSize={game.gridSize}
          onMove={game.moveBlock}
          showCelebration={game.showCelebration}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        Húzd a blokkokat a szaggatott célhelyekre! ✨
      </p>
    </div>
  );
};

export default Index;
