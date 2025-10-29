"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  onLose: () => void;
  onWin?: () => void;
  durationMs?: number; // survive duration to win
};

type Obstacle = {
  id: number;
  lane: number; // 0,1,2
  y: number; // 0..100 (% from top)
};

export function ArcadeDodge({ onLose, onWin, durationMs = 20000 }: Props) {
  const [playerLane, setPlayerLane] = useState(1);
  const [running, setRunning] = useState(true);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const nextId = useRef(1);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const lastSpawnRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  const reset = () => {
    setPlayerLane(1);
    setObstacles([]);
    setRunning(true);
    lastTsRef.current = null;
    lastSpawnRef.current = 0;
    startTimeRef.current = null;
  };

  useEffect(() => {
    if (!running) return;

    const step = (ts: number) => {
      if (startTimeRef.current === null) startTimeRef.current = ts;
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;

      // Move obstacles: speed ~ 18% viewport per second
      setObstacles((prev) => {
        const moved = prev
          .map((o) => ({ ...o, y: o.y + (dt * 0.018) }))
          .filter((o) => o.y <= 110); // keep few extra below screen for cleanup
        return moved;
      });

      // Spawn new obstacles every 900–1200ms
      lastSpawnRef.current += dt;
      if (lastSpawnRef.current > 900 + Math.random() * 300) {
        lastSpawnRef.current = 0;
        const lane = Math.floor(Math.random() * 3);
        setObstacles((prev) => [
          ...prev,
          { id: nextId.current++, lane, y: -10 },
        ]);
      }

      // Collision detection when obstacle near bottom (~88–96%)
      let collided = false;
      setObstacles((prev) => {
        for (const o of prev) {
          if (o.lane === playerLane && o.y >= 88 && o.y <= 96) {
            collided = true;
            break;
          }
        }
        return prev;
      });

      if (collided) {
        setRunning(false);
        onLose();
        return;
      }

      // Win condition
      if (onWin && startTimeRef.current && ts - startTimeRef.current >= durationMs) {
        setRunning(false);
        onWin();
        return;
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [running, playerLane, onLose, onWin, durationMs]);

  // Mobile controls
  const moveLeft = () => setPlayerLane((l) => Math.max(0, l - 1));
  const moveRight = () => setPlayerLane((l) => Math.min(2, l + 1));

  return (
    <div className="w-full">
      <div className="relative mx-auto w-full max-w-sm h-60 sm:h-72 bg-base-300 rounded-box overflow-hidden">
        {/* Lanes backdrop */}
        <div className="absolute inset-0 grid grid-cols-3 opacity-20">
          <div className="border-r border-base-content/30"></div>
          <div className="border-r border-base-content/30"></div>
          <div></div>
        </div>

        {/* Player */}
        <div
          className="absolute bottom-2 h-6 w-16 sm:h-8 sm:w-20 bg-primary rounded-full shadow"
          style={{ left: `calc(${(playerLane + 0.5) * (100 / 3)}% - 40px)` }}
        />

        {/* Obstacles */}
        {obstacles.map((o) => (
          <div
            key={o.id}
            className="absolute top-0 h-6 w-14 sm:h-7 sm:w-16 bg-error rounded-md shadow"
            style={{
              transform: `translateY(${o.y}%)`,
              left: `calc(${(o.lane + 0.5) * (100 / 3)}% - 32px)`,
            }}
          />
        ))}
      </div>

      <div className="mt-3 flex gap-2 w-full">
        <button className="btn btn-outline btn-sm w-full" onClick={moveLeft} aria-label="Move left">◀ Trái</button>
        <button className="btn btn-outline btn-sm w-full" onClick={moveRight} aria-label="Move right">Phải ▶</button>
      </div>

      <div className="mt-2 flex gap-2">
        <button className="btn btn-xs" onClick={reset}>Reset</button>
      </div>
    </div>
  );
}


