"use client";
import { useCountUp } from "../hooks/useCountUp";

export function StatsPanel({ totalWords, negativeWords, botInterventions }: { totalWords: number; negativeWords: number; botInterventions: number }) {
  const tw = useCountUp(totalWords);
  const nw = useCountUp(negativeWords);
  const bi = useCountUp(botInterventions);
  return (
    <section className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
      <div className="stats shadow w-full">
        <div className="stat">
          <div className="stat-title">Tổng số từ</div>
          <div className="stat-value text-primary text-3xl sm:text-5xl">{tw}</div>
        </div>
      </div>
      <div className="stats shadow w-full">
        <div className="stat">
          <div className="stat-title">Từ tiêu cực</div>
          <div className="stat-value text-error text-3xl sm:text-5xl">{nw}</div>
        </div>
      </div>
      <div className="stats shadow w-full">
        <div className="stat">
          <div className="stat-title">Lần chatbot can thiệp</div>
          <div className="stat-value text-3xl sm:text-5xl">{bi}</div>
        </div>
      </div>
    </section>
  );
}


