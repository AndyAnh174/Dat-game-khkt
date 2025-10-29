export type NegativityResult = {
  matched: boolean;
  hits: string[];
};

function toNoDiacritics(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .toLowerCase();
}

const NEGATIVE_KEYWORDS_NO_DIACRITICS: string[] = [
  // insults / profanity (normalized, no diacritics)
  "ngu", "do ngu", "tham", "dien", "oc cho", "occho", "lon", "cu", "cac",
  // frustration
  "chan", "uc che", "ucche", "tuc", "cay", "met", "met moi", "nan", "that vong", "toang", "phe", "buc minh", "buc boi",
  // abbreviations / slang
  "vc", "vcl", "vkl", "cl", "cc", "vl", "dm", "dmm", "dcm", "dkm", "lolz", "khung",
  // intensity
  "rat te", "te qua", "te vl", "tham te", "toi te", "tham hoa",
  // negativity markers / phrases
  "ghet", "ghet qua", "tui", "nhuc", "thua mai", "thua hoai", "de biu", "bi",
  // compound phrases (kept as phrases to use includes)
  "dit me", "ditmemay", "do cho", ""
];

export function isNegative(text: string): NegativityResult {
  const normalized = toNoDiacritics(text);
  const tokens = normalized
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const hitsSet = new Set<string>();
  for (const key of NEGATIVE_KEYWORDS_NO_DIACRITICS) {
    const keyParts = key.split(/\s+/);
    if (keyParts.length === 1) {
      if (tokens.includes(key)) hitsSet.add(key);
    } else {
      const phrase = keyParts.join(" ");
      if (normalized.includes(phrase)) hitsSet.add(key);
    }
  }

  const hits = Array.from(hitsSet);
  return { matched: hits.length > 0, hits };
}


