"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { isNegative } from "../lib/negativity";
import { useFakeStream } from "../hooks/useFakeStream";
import { SnakeGame } from "../components/SnakeGame";
import { CommentBox } from "../components/CommentBox";
import { StatsPanel } from "../components/StatsPanel";
import { ChatbotBubble } from "../components/ChatbotBubble";
import { EthicsBanner } from "../components/EthicsBanner";

type GameState = "playing" | "lost" | "commenting";

export default function Home() {
  const [gameState, setGameState] = useState<GameState>("playing");
  const [shakeGame, setShakeGame] = useState(false);
  const [input, setInput] = useState("");
  const [totalWords, setTotalWords] = useState(0);
  const [negativeWords, setNegativeWords] = useState(0);
  const [botInterventions, setBotInterventions] = useState(0);
  const [showBot, setShowBot] = useState(false);
  const [streamKey, setStreamKey] = useState(0);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  const analysis = useMemo(() => isNegative(input), [input]);

  useEffect(() => {
    const words = input.trim().split(/\s+/).filter(Boolean).length;
    setTotalWords(words);
    setNegativeWords(analysis.hits.length);
  }, [input, analysis.hits.length]);

  // Start chatbot when negativity appears
  useEffect(() => {
    if (gameState === "commenting" && analysis.matched) {
      setShowBot(true);
      setBotInterventions((c) => c + 1);
      // retrigger stream
      setStreamKey((k) => k + 1);
    }
  }, [analysis.matched, gameState]);

  const { output } = useFakeStream({
    prompt: input,
    enabled: showBot,
  });

  // Auto-hide bot after inactivity
  const inactivityRef = useRef<number | null>(null);
  useEffect(() => {
    if (!showBot) return;
    if (inactivityRef.current) window.clearTimeout(inactivityRef.current);
    inactivityRef.current = window.setTimeout(() => setShowBot(false), 8000);
    return () => {
      if (inactivityRef.current) window.clearTimeout(inactivityRef.current);
      inactivityRef.current = null;
    };
  }, [showBot, streamKey, input]);

  return (
    <div className="min-h-screen bg-base-100">
      <main className="mx-auto max-w-3xl px-3 py-6 sm:px-6 sm:py-10">
        <header className="mb-4 sm:mb-6 flex items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold">🧠 Social & Behavioral Demo</h1>
        </header>

        {gameState === "playing" && (
          <section className={`card bg-base-200 shadow mb-4 sm:mb-6 ${shakeGame ? "anim-shake" : ""}`}>
            <div className="card-body p-4 sm:p-6">
              <h2 className="card-title">Mini-game: Click thử thách</h2>
              <p>Nhấn nút trong 1 giây để thắng. Nếu chậm → thua.</p>
              <SnakeGame
                onLose={() => {
                  setShakeGame(true);
                  window.setTimeout(() => setShakeGame(false), 420);
                  window.setTimeout(() => setGameState("lost"), 420);
                }}
                onWin={() => setGameState("lost")}
              />
            </div>
          </section>
        )}

        {gameState === "lost" && (
          <section className="alert alert-warning mb-4">
            <div className="flex w-full items-center gap-3 justify-between flex-col sm:flex-row">
              <span className="text-sm text-left w-full sm:flex-1">Bạn đã thua. Hãy chia sẻ cảm xúc của bạn bên dưới.</span>
              <button
                type="button"
                className="btn btn-sm w-full sm:w-auto shrink-0 whitespace-nowrap"
                onClick={() => setGameState("commenting")}
              >
                Viết bình luận
              </button>
            </div>
          </section>
        )}

        {gameState === "commenting" && (
          <CommentBox value={input} onChange={setInput} analysis={analysis} />
        )}

        <StatsPanel totalWords={totalWords} negativeWords={negativeWords} botInterventions={botInterventions} />
      </main>

      {/* Chatbot bubble */}
      {showBot && (
        <ChatbotBubble text={output} onClose={() => setShowBot(false)} />
      )}

      {/* Ethics banner */}
      {!dismissedBanner && (
        <EthicsBanner onDismiss={() => setDismissedBanner(true)} />
      )}
    </div>
  );
}

// components are imported above

