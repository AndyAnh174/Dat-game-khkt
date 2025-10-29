"use client";

export function EthicsBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="toast toast-start toast-bottom">
      <div className="alert">
        <span>Đây là mô phỏng nghiên cứu hành vi, không lưu dữ liệu cá nhân.</span>
        <button className="btn btn-ghost btn-sm ml-2" onClick={onDismiss}>Ẩn</button>
      </div>
    </div>
  );
}


