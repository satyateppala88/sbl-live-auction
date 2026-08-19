export async function fileToJpegBase64(file: File, max = 512): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}

export function baseName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function levenshtein(a: string, b: string) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j]! + 1,
        cur[j - 1]! + 1,
        prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[n]!;
}

export type MatchCandidate = { id: string; name: string };

/** Fuzzy-match a filename to a candidate; returns best match + a 0..1 score. */
export function bestMatch(fileName: string, candidates: MatchCandidate[]) {
  const target = norm(baseName(fileName));
  let best: { candidate: MatchCandidate | null; score: number } = { candidate: null, score: 0 };
  for (const c of candidates) {
    const name = norm(c.name);
    if (!name || !target) continue;
    const dist = levenshtein(target, name);
    let score = 1 - dist / Math.max(target.length, name.length);
    if (name === target) score = 1;
    else if (name.includes(target) || target.includes(name)) score = Math.max(score, 0.9);
    if (score > best.score) best = { candidate: c, score };
  }
  return best;
}
