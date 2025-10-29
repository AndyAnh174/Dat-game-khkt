"use client";

export type Analysis = { matched: boolean; hits: string[] };

export function CommentBox({ value, onChange, analysis }: { value: string; onChange: (v: string) => void; analysis: Analysis }) {
  return (
    <section className="card bg-base-200 shadow mb-4 sm:mb-6">
      <div className="card-body gap-3 p-4 sm:p-6">
        <h2 className="card-title">Hộp bình luận</h2>
        <textarea
          className="textarea textarea-bordered w-full min-h-28"
          placeholder="Gõ phản hồi của bạn..."
          aria-label="Ô bình luận"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          {analysis.matched ? (
            <span className="badge badge-error">Có từ tiêu cực</span>
          ) : (
            <span className="badge">Trung tính</span>
          )}
          {analysis.hits.length > 0 && (
            <span className="text-sm opacity-70">Hits: {analysis.hits.join(", ")}</span>
          )}
        </div>
      </div>
    </section>
  );
}


