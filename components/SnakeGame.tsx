"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Cell = { x: number; y: number };
type Dir = { x: number; y: number };

function same(a: Cell, b: Cell) { return a.x === b.x && a.y === b.y; }

function rnd(max: number) { return Math.floor(Math.random() * max); }

function placeFree(width: number, height: number, blocked: Cell[]): Cell {
  // naive retry; sufficient for small grids
  for (let i = 0; i < 500; i++) {
    const c = { x: rnd(width), y: rnd(height) };
    if (!blocked.some(b => same(b, c))) return c;
  }
  return { x: 0, y: 0 };
}

export function SnakeGame({ started, onLose, onWin, onReset, gridSize = 15 }: { started: boolean; onLose: () => void; onWin?: () => void; onReset?: () => void; gridSize?: number }) {
  const width = gridSize;
  const height = gridSize;

  const [snake, setSnake] = useState<Cell[]>(() => {
    const cx = Math.floor(width / 2);
    const cy = Math.floor(height / 2);
    return [ { x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy } ];
  });
  const [dir, setDir] = useState<Dir>({ x: 1, y: 0 });
  const [queuedDir, setQueuedDir] = useState<Dir | null>(null);
  const dirRef = useRef<Dir>({ x: 1, y: 0 });
  const queuedDirRef = useRef<Dir | null>(null);
  const [food, setFood] = useState<Cell>(() => placeFree(width, height, []));
  const [score, setScore] = useState(0);
  const [obstacles, setObstacles] = useState<Cell[]>([]);
  const [running, setRunning] = useState(false);

  const speedMs = useMemo(() => {
    // Exponential acceleration: quickly ramps up and guarantees difficulty
    const base = 180;
    const min = 60;
    const accelerated = base * Math.pow(0.93, score); // ~7% faster per point
    return Math.max(min, Math.round(accelerated));
  }, [score]);

  // Increase difficulty by adding obstacles every 5 points (up to 10)
  useEffect(() => {
    const targetObstacleCount = Math.min(10, Math.floor(score / 5));
    if (obstacles.length >= targetObstacleCount) return;
    const blocked = [...snake, food, ...obstacles];
    const additions: Cell[] = [];
    for (let i = obstacles.length; i < targetObstacleCount; i++) {
      additions.push(placeFree(width, height, [...blocked, ...additions]));
    }
    if (additions.length) setObstacles(prev => [...prev, ...additions]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, width, height]);

  // Keep refs in sync
  useEffect(() => { dirRef.current = dir; }, [dir]);
  useEffect(() => { queuedDirRef.current = queuedDir; }, [queuedDir]);

  // Controls: keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      let d: Dir | null = null;
      if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") d = { x: 0, y: -1 };
      if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") d = { x: 0, y: 1 };
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") d = { x: -1, y: 0 };
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") d = { x: 1, y: 0 };
      if (d) {
        setQueuedDir(d);
        queuedDirRef.current = d;
        if (!(d.x === -dirRef.current.x && d.y === -dirRef.current.y)) {
          setDir(d);
          dirRef.current = d;
        }
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Start game when started prop becomes true
  useEffect(() => {
    if (started) {
      setRunning(true);
    } else {
      setRunning(false);
    }
  }, [started]);

  // Tick loop using setInterval, restart when speed changes
  const intervalRef = useRef<number | null>(null);
  useEffect(() => {
    if (!running || !started) return;
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      setSnake(prev => {
        const head = prev[0];
        let nextDir = dirRef.current;
        const q = queuedDirRef.current;
        if (q) {
          if (!(q.x === -nextDir.x && q.y === -nextDir.y)) nextDir = q;
          queuedDirRef.current = null;
          setQueuedDir(null);
          setDir(nextDir);
          dirRef.current = nextDir;
        }
        const nextHead = { x: head.x + nextDir.x, y: head.y + nextDir.y };
        // Wall collision
        if (nextHead.x < 0 || nextHead.x >= width || nextHead.y < 0 || nextHead.y >= height) {
          setRunning(false);
          onLose();
          return prev;
        }
        // Self or obstacle collision
        if (prev.some((c, i) => i !== 0 && same(c, nextHead)) || obstacles.some(o => same(o, nextHead))) {
          setRunning(false);
          onLose();
          return prev;
        }

        // Move
        const grew = same(nextHead, food);
        const body = [nextHead, ...prev];
        if (!grew) body.pop();
        if (grew) {
          setScore(s => s + 1);
          const blocked = [...body, ...obstacles];
          // Place new food
          setFood(placeFree(width, height, blocked));
          // Add new obstacles every 3 points to increase board pressure
          if ((score + 1) % 3 === 0) {
            setObstacles((obs) => {
              const extras: Cell[] = [];
              const target = 1 + Math.min(3, Math.floor((score + 1) / 6));
              for (let i = 0; i < target; i++) {
                const c = placeFree(width, height, [...blocked, ...obs, ...extras]);
                extras.push(c);
              }
              return [...obs, ...extras];
            });
          }
          if (onWin && body.length >= width * height - 1) {
            setRunning(false);
            onWin();
          }
        }
        // Dynamic hazard: small chance to crystallize a wall each tick
        // Probability scales with score to guarantee eventual loss
        const p = Math.min(0.02 + score * 0.005, 0.18);
        if (Math.random() < p) {
          setObstacles((obs) => {
            const blockedCells = [...body, ...obs, food];
            const cand = placeFree(width, height, blockedCells);
            // avoid placing directly on the next immediate path if possible
            if (!(cand.x === nextHead.x && cand.y === nextHead.y)) {
              return [...obs, cand];
            }
            return obs;
          });
        }
        return body;
      });
    }, speedMs);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [speedMs, running, started, width, height, onLose, onWin, obstacles]);

  const reset = () => {
    setSnake(() => {
      const cx = Math.floor(width / 2);
      const cy = Math.floor(height / 2);
      return [ { x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy } ];
    });
    setDir({ x: 1, y: 0 });
    setQueuedDir(null);
    setFood(placeFree(width, height, []));
    setScore(0);
    setObstacles([]);
    setRunning(false);
    if (onReset) {
      onReset();
    }
  };

  // Mobile tap controls
  const go = (d: Dir) => {
    const cur = dirRef.current;
    if (d.x === -cur.x && d.y === -cur.y) return;
    setQueuedDir(d); queuedDirRef.current = d;
    setDir(d); dirRef.current = d;
  };

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-sm">
        <div
          className="relative grid bg-base-300 rounded-box overflow-hidden"
          style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`, aspectRatio: "1 / 1" }}
        >
          {Array.from({ length: width * height }).map((_, i) => {
            const x = i % width; const y = Math.floor(i / width);
            const isHead = same(snake[0], { x, y });
            const onSnake = snake.some(c => same(c, { x, y }));
            const isFood = same(food, { x, y });
            const isObs = obstacles.some(o => same(o, { x, y }));
            return (
              <div key={i} className="border border-base-content/10 relative">
                {onSnake && (
                  <div className={`absolute inset-0 ${isHead ? "bg-primary" : "bg-primary/80"}`}></div>
                )}
                {!onSnake && isObs && <div className="absolute inset-0 bg-error/80"></div>}
                {!onSnake && !isObs && isFood && <div className="absolute inset-1 bg-success rounded-sm"></div>}
              </div>
            );
          })}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="badge">Điểm: {score}</div>
          <div className="badge badge-outline">Tốc độ: {Math.round(1000 / speedMs)} fps</div>
        </div>

        {/* Sticky mobile control bar */}
        <div className="sticky bottom-2 mt-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-3 flex justify-center">
              <button type="button" className="btn btn-primary btn-lg w-32" onClick={() => go({ x: 0, y: -1 })} onTouchStart={() => go({ x: 0, y: -1 })} aria-label="Up">Lên</button>
            </div>
            <div className="flex justify-end">
              <button type="button" className="btn btn-primary btn-lg w-32" onClick={() => go({ x: -1, y: 0 })} onTouchStart={() => go({ x: -1, y: 0 })} aria-label="Left">Trái</button>
            </div>
            <div></div>
            <div className="flex justify-start">
              <button type="button" className="btn btn-primary btn-lg w-32" onClick={() => go({ x: 1, y: 0 })} onTouchStart={() => go({ x: 1, y: 0 })} aria-label="Right">Phải</button>
            </div>
            <div className="col-span-3 flex justify-center">
              <button type="button" className="btn btn-primary btn-lg w-32" onClick={() => go({ x: 0, y: 1 })} onTouchStart={() => go({ x: 0, y: 1 })} aria-label="Down">Xuống</button>
            </div>
          </div>
        </div>

        <div className="mt-2 flex gap-2">
          <button className="btn btn-xs" onClick={reset}>Reset</button>
        </div>
      </div>
    </div>
  );
}


