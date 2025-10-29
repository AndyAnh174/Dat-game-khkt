"use client";
import { useEffect, useRef, useState } from "react";

export function Game({ onLose, onWin, armedClassName = "" }: { onLose: () => void; onWin: () => void; armedClassName?: string }) {
  const [armed, setArmed] = useState(false);
  const timerRef = useRef<number | null>(null);

  const arm = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setArmed(true);
    timerRef.current = window.setTimeout(() => {
      setArmed(false);
      onLose();
    }, 1000);
  };

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full">
      <button className="btn btn-primary w-full sm:w-auto" onClick={arm}>Bắt đầu 1s</button>
      <button
        className={`btn w-full sm:w-auto ${armed ? armedClassName : ""}`}
        onClick={() => {
          if (armed) {
            onWin();
          } else {
            onLose();
          }
        }}
      >
        Nhấn để thắng
      </button>
    </div>
  );
}


