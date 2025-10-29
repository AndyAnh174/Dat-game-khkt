"use client";

export function ChatbotBubble({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-3 right-3 z-50 w-[90vw] max-w-sm sm:bottom-4 sm:right-4 anim-slide-in-br">
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Chatbot 🌿</h3>
            <button className="btn btn-ghost btn-xs" onClick={onClose}>Đóng</button>
          </div>
          <div className="prose max-w-none" aria-live="polite">
            {text || "..."}
          </div>
        </div>
      </div>
    </div>
  );
}


