import { useEffect, useRef, useState } from "react";

type UseFakeStreamOptions = {
  prompt: string;
  enabled: boolean;
  onChunk?: (text: string) => void;
  onDone?: () => void;
};

const TEMPLATES_BASE = [
  "Bình tĩnh nào, ai cũng có lúc thua. Hít thở sâu nhé 😌",
  "Bạn đang làm tốt rồi. Thử nói nhẹ nhàng hơn xem sao 💬",
  "Thua chỉ là một bước để tiến bộ. Cố lên nhé ✨",
  "Cảm xúc mạnh đó! Nghỉ 10 giây rồi thử lại nha 😄",
  "Đếm 4-4-4: hít 4s, giữ 4s, thở 4s. Thử tiếp nhé 🌱",
  "Hãy đặt mục tiêu nhỏ: sống thêm 10 ô nữa thôi là đủ 👍",
  "Bạn có thể pause 5 giây, uống nước rồi quay lại nha 💧",
  "Thay vì từ mạnh, thử mô tả cảm giác: mình đang thấy thất vọng.",
  "Tuy khó chịu, nhưng bạn đã tiến bộ hơn lượt trước đó! 🚀",
];

const TEMPLATES_STRONG = [
  "Mình hiểu bạn đang rất bực. Ta thử nghỉ 15 giây rồi quay lại nhé 🤝",
  "Cảm xúc mạnh là bình thường. Đổi góc nhìn: lần này coi như luyện phản xạ ✨",
  "Đề xuất: hạ tốc độ mục tiêu, tập trung né 3 lần liên tiếp rồi tính tiếp.",
  "Thay vì trách bản thân, thử nói: ‘mình đang học, sai cũng được’ 💬",
];

function buildMessage(prompt: string, strong = false): string {
  const bank = strong ? TEMPLATES_STRONG : TEMPLATES_BASE;
  const base = bank[Math.floor(Math.random() * bank.length)];
  if (!prompt) return base;
  return `${base} Mình thấy bạn vừa nói: “${prompt}”.`;
}

export function useFakeStream({ prompt, enabled, onChunk, onDone }: UseFakeStreamOptions) {
  const [output, setOutput] = useState("");
  const intervalRef = useRef<number | null>(null);
  const indexRef = useRef(0);
  const wordsRef = useRef<string[]>([]);
  const strongRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    // Heuristic: stronger tone if prompt has many negative tokens
  const negCount = (prompt.match(/\b(ngu|vcl|vkl|vc|dm|dmm|dcm|dkm|chan|tuc|cay|te|toi te|nhuc|met|toang|phe)\b/gi) || []).length;
    strongRef.current = negCount >= 2 || prompt.length > 40;
    const message = buildMessage(prompt, strongRef.current);
    wordsRef.current = message.split(/\s+/);
    indexRef.current = 0;
    setOutput("");

    intervalRef.current = window.setInterval(() => {
      const batchSize = 2 + Math.floor(Math.random() * 4); // 2–5 words
      const slice = wordsRef.current.slice(indexRef.current, indexRef.current + batchSize);
      indexRef.current += slice.length;
      if (slice.length > 0) {
        const chunk = (output ? " " : "") + slice.join(" ");
        setOutput((prev) => {
          const next = prev + (prev ? " " : "") + slice.join(" ");
          onChunk?.(slice.join(" "));
          return next;
        });
      }
      if (indexRef.current >= wordsRef.current.length) {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        intervalRef.current = null;
        onDone?.();
      }
    }, 120 + Math.floor(Math.random() * 100));

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [enabled, prompt]);

  const stop = () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  return { output, stop };
}


