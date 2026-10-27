// Simulated LLM pipeline. Everything is deterministic: the same sentence
// always produces the same tokens, IDs, vectors, attention and predictions.

export type TokenKind = "word" | "subword" | "punct";

export interface Token {
  index: number;
  text: string;
  wordIndex: number;
  kind: TokenKind;
  id: number;
  embedding: number[];
  combined: number[];
}

export interface Word {
  index: number;
  text: string;
  tokens: number[];
}

export interface Candidate {
  text: string;
  p: number;
}

export interface GenStep {
  text: string;
  isPunct: boolean;
  /** Preceded by a space when turned back into text. */
  space: boolean;
  candidates: Candidate[];
}

/** One generated token as returned by the model route. Candidates are present only when the model gives probabilities. */
export interface RawStep {
  text: string;
  space: boolean;
  candidates?: Candidate[];
}

export interface Pipeline {
  input: string;
  chars: number;
  words: Word[];
  tokens: Token[];
  attention: number[][];
  defaultFocus: number;
  generated: GenStep[];
}

export const DIMS = 8;
export const MAX_TOKENS = 16;
export const MAX_CHARS = 60;
export const VOCAB_SIZE = 50257;

export const DEFAULT_TEXT = "The cat sat on the mat.";

/* ---------- helpers ---------- */

function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v: number, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, v));

export const isPunct = (s: string) => /^[^\p{L}\p{N}]+$/u.test(s);

/* ---------- tokenizer (simplified, BPE-flavoured) ---------- */

const COMMON = new Set([
  "the", "and", "that", "with", "have", "this", "from", "they", "would", "there",
  "their", "about", "which", "people", "because", "through", "something", "everything",
  "morning", "nothing", "between", "another", "without", "electric", "beautiful",
  "favourite", "favorite", "tomorrow", "yesterday", "together", "language", "computer",
]);

const PREFIXES = ["under", "over", "grand", "super", "inter", "trans", "micro"];

const SUFFIXES = [
  "ization", "ation", "ingly", "ness", "ment", "able", "ible", "tion",
  "ing", "ful", "less", "ous", "ive", "est", "ly", "ed",
];

function splitCore(core: string, depth = 0): string[] {
  const lower = core.toLowerCase();
  if (COMMON.has(lower) || core.length <= 6 || depth >= 2) return [core];
  for (const pre of PREFIXES) {
    if (lower.startsWith(pre) && core.length - pre.length >= 4) {
      return [core.slice(0, pre.length), ...splitCore(core.slice(pre.length), depth + 1)];
    }
  }
  for (const suf of SUFFIXES) {
    if (lower.endsWith(suf) && core.length - suf.length >= 3) {
      const stem = core.slice(0, core.length - suf.length);
      return [...splitCore(stem, depth + 1), core.slice(core.length - suf.length)];
    }
  }
  if (core.length >= 10) {
    const cut = Math.ceil(core.length / 2);
    return [core.slice(0, cut), core.slice(cut)];
  }
  return [core];
}

function splitWord(word: string): string[] {
  const m = word.match(/^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u);
  const lead = m?.[1] ?? "";
  const core = m?.[2] ?? word;
  const trail = m?.[3] ?? "";
  const out: string[] = [];
  if (lead) out.push(lead);
  if (core) out.push(...splitCore(core));
  if (trail) out.push(trail);
  return out;
}

// A few IDs in the style of GPT-2's vocabulary; the rest are hashed.
const KNOWN_IDS: Record<string, number> = {
  The: 464, the: 262, cat: 3797, sat: 3332, on: 319, mat: 2603, ".": 13, ",": 11,
  I: 40, a: 257, and: 290, of: 286, to: 284, in: 287, is: 318, it: 340, love: 1842,
};

function tokenId(text: string): number {
  return KNOWN_IDS[text] ?? 1000 + (hash(text) % (VOCAB_SIZE - 1000));
}

function embed(text: string): number[] {
  const r = rng(hash(text.toLowerCase()));
  return Array.from({ length: DIMS }, () => (r() * 2 - 1) * 0.85);
}

function positional(pos: number): number[] {
  return Array.from({ length: DIMS }, (_, d) => {
    const freq = 1 / Math.pow(100, (2 * Math.floor(d / 2)) / DIMS);
    return d % 2 === 0 ? Math.sin(pos * freq) : Math.cos(pos * freq);
  });
}

/* ---------- attention (causal, heuristic) ---------- */

export const STOP = new Set([
  "the", "a", "an", "on", "of", "in", "to", "and", "is", "are", "was", "i", "it", "at", "for",
  "my", "me", "we", "you", "he", "she", "they", "this", "that", "with",
]);

function buildAttention(tokens: Token[]): number[][] {
  return tokens.map((q, i) => {
    const scores = tokens.map((k, j) => {
      if (j > i) return -Infinity;
      let s = 0;
      if (k.kind === "punct") s -= 1.2;
      else if (!STOP.has(k.text.toLowerCase())) s += 1.3;
      if (k.wordIndex === q.wordIndex && j !== i) s += 0.8;
      s -= 0.12 * (i - j);
      s += ((hash(`${q.text}|${k.text}|${i}|${j}`) % 1000) / 1000) * 0.6;
      return s * 1.25;
    });
    const max = Math.max(...scores.filter(Number.isFinite));
    const exps = scores.map((s) => (Number.isFinite(s) ? Math.exp(s - max) : 0));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map((e) => e / sum);
  });
}

/* ---------- generation ---------- */

// The continuation follows the topic of the sentence: if it mentions a known
// word (food, school, weather...), the "model" continues on that topic.

interface Topic { keys: string[]; cont: string[][] }

const EXACT: Record<string, string[]> = {
  "the cat sat on the mat.": ["It", "purred", "softly", "and", "fell", "asleep", "."],
  "i love learning new things.": ["Every", "day", "feels", "like", "an", "adventure", "."],
  "robots dream of electric sheep.": ["They", "count", "them", "in", "binary", "."],
  "tokenization is surprisingly simple.": ["Text", "becomes", "small", "reusable", "pieces", "."],
};

const TOPICS: Topic[] = [
  { keys: ["food", "pizza", "eat", "ate", "cook", "dinner", "lunch", "breakfast", "hungry", "coffee", "tea", "cake", "bread", "apple", "rice", "delicious"],
    cont: [["It", "smells", "really", "good", "."], ["I", "could", "eat", "it", "every", "day", "."]] },
  { keys: ["school", "learn", "study", "class", "teacher", "exam", "book", "read", "homework", "university", "student", "lesson"],
    cont: [["Every", "lesson", "makes", "me", "smarter", "."], ["The", "teacher", "was", "very", "proud", "."]] },
  { keys: ["rain", "snow", "sun", "sunny", "cold", "hot", "weather", "wind", "cloud", "summer", "winter"],
    cont: [["I", "stayed", "inside", "with", "warm", "tea", "."], ["The", "streets", "were", "quiet", "and", "empty", "."]] },
  { keys: ["mother", "father", "mom", "dad", "grandmother", "grandfather", "grandma", "grandpa", "sister", "brother", "friend", "family", "baby", "son", "daughter"],
    cont: [["They", "always", "make", "me", "smile", "."], ["We", "talked", "for", "hours", "."]] },
  { keys: ["cat", "dog", "bird", "fish", "horse", "animal", "pet", "puppy", "kitten"],
    cont: [["It", "looked", "very", "happy", "."], ["Then", "it", "fell", "asleep", "in", "the", "sun", "."]] },
  { keys: ["travel", "visit", "trip", "city", "country", "flight", "train", "beach", "sea", "mountain", "holiday", "vacation", "park"],
    cont: [["It", "will", "be", "a", "wonderful", "trip", "."], ["The", "view", "was", "beautiful", "."]] },
  { keys: ["computer", "robot", "machine", "model", "code", "program", "ai", "phone", "internet", "data", "language", "token", "llm"],
    cont: [["It", "learns", "from", "millions", "of", "examples", "."], ["The", "results", "were", "surprisingly", "good", "."]] },
  { keys: ["work", "job", "office", "meeting", "boss", "money", "project"],
    cont: [["The", "day", "felt", "very", "long", "."], ["Everyone", "was", "tired", "but", "happy", "."]] },
  { keys: ["play", "game", "football", "soccer", "music", "song", "sing", "dance", "movie", "film"],
    cont: [["It", "was", "so", "much", "fun", "."], ["We", "want", "to", "do", "it", "again", "."]] },
  { keys: ["love", "happy", "sad", "feel", "enjoy", "miss", "like"],
    cont: [["It", "makes", "life", "feel", "warm", "."], ["That", "feeling", "stayed", "with", "me", "."]] },
];

const GENERIC = [
  ["It", "was", "a", "quiet", "moment", "."],
  ["Then", "everything", "started", "to", "change", "."],
  ["And", "that", "was", "only", "the", "beginning", "."],
];

const ANSWERS = [["That", "is", "a", "good", "question", "."], ["Let", "me", "think", "about", "it", "."]];

const WORD_POOL = ["the", "a", "it", "and", "then", "so", "very", "just", "still", "again", "there", "she", "we", "slowly"];
const PUNCT_POOL = ["!", ",", "and", "today", "now", "again"];

const TERMINAL = /[.!?…]$/;

function matchesKey(word: string, key: string) {
  return word === key || word === key + "s" || (key.length >= 4 && word.startsWith(key));
}

function pickContinuation(input: string, words: string[]): string[] {
  const key = input.toLowerCase();
  if (EXACT[key]) return EXACT[key];
  const seed = hash(key);
  if (input.endsWith("?")) return ANSWERS[seed % ANSWERS.length];
  const lw = words.map((w) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ""));
  let best: Topic | null = null;
  let bestScore = 0;
  for (const t of TOPICS) {
    const score = lw.filter((w) => t.keys.some((k) => matchesKey(w, k))).length;
    if (score > bestScore) { best = t; bestScore = score; }
  }
  const bank = best ? best.cont : GENERIC;
  return bank[seed % bank.length];
}

function matchCase(w: string, ref: string) {
  if (isPunct(w) || isPunct(ref)) return w;
  if (ref[0] === ref[0].toLowerCase() && ref[0] !== ref[0].toUpperCase()) {
    return w === "I" ? w : w[0].toLowerCase() + w.slice(1);
  }
  return w[0].toUpperCase() + w.slice(1);
}

/** Runner-up tokens: words that other continuations put at the same position. */
function candidatesFor(chosen: string, pos: number, seed: number): Candidate[] {
  const r = rng(seed);
  const top = 0.34 + r() * 0.24;
  let pool: string[];
  if (isPunct(chosen)) {
    pool = PUNCT_POOL;
  } else {
    const banks = [...TOPICS.flatMap((t) => t.cont), ...GENERIC];
    const same = banks.map((b) => b[pos]).filter((w): w is string => !!w && !isPunct(w));
    pool = [...new Set([...same, ...WORD_POOL])];
  }
  pool = pool.filter((w) => w.toLowerCase() !== chosen.toLowerCase());
  const alts: string[] = [];
  while (alts.length < 4 && alts.length < pool.length) {
    const w = matchCase(pool[Math.floor(r() * pool.length)], chosen);
    if (!alts.some((a) => a.toLowerCase() === w.toLowerCase())) alts.push(w);
  }
  const raw = alts.map((_, i) => 4 - i + r());
  const sum = raw.reduce((a, b) => a + b, 0);
  const rest = 0.92 - top;
  return [
    { text: chosen, p: top },
    ...alts.map((w, i) => ({ text: w, p: (rest * raw[i]) / sum })),
  ];
}

/* ---------- build ---------- */

export function buildPipeline(raw: string): Pipeline {
  const input = raw.trim().replace(/\s+/g, " ").slice(0, MAX_CHARS);
  const words: Word[] = [];
  const tokens: Token[] = [];

  input.split(" ").filter(Boolean).forEach((wt) => {
    if (tokens.length >= MAX_TOKENS) return;
    const word: Word = { index: words.length, text: "", tokens: [] };
    const pieces = splitWord(wt);
    pieces.forEach((piece, pi) => {
      if (tokens.length >= MAX_TOKENS) return;
      const prevPunct = pi === 0 || isPunct(pieces[pi - 1]);
      const kind: TokenKind = isPunct(piece) ? "punct" : prevPunct ? "word" : "subword";
      const pos = tokens.length;
      const embedding = embed(piece);
      const pe = positional(pos);
      tokens.push({
        index: pos,
        text: piece,
        wordIndex: word.index,
        kind,
        id: tokenId(piece),
        embedding,
        combined: embedding.map((v, d) => clamp(v + pe[d] * 0.35)),
      });
      word.tokens.push(pos);
      word.text += piece;
    });
    if (word.tokens.length) words.push(word);
  });

  const attention = buildAttention(tokens);
  let defaultFocus = tokens.length - 1;
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (tokens[i].kind !== "punct") { defaultFocus = i; break; }
  }

  const key = input.toLowerCase();
  const steps = pickContinuation(input, words.map((w) => w.text)).map((text, pos) => ({ text, pos }));
  const last = tokens[tokens.length - 1]?.text ?? "";
  if (/[,;]$/.test(last)) {
    // Ended on a comma: carry on the same sentence.
    if (steps[0].text !== "I") steps[0].text = steps[0].text.toLowerCase();
  } else if (!TERMINAL.test(last)) {
    // Unfinished sentence: the model first predicts the full stop.
    steps.unshift({ text: ".", pos: -1 });
  }
  const generated: GenStep[] = steps.map(({ text, pos }, k) => ({
    text,
    isPunct: isPunct(text),
    space: !isPunct(text),
    candidates: candidatesFor(text, pos, hash(`${key}#${k}`)),
  }));

  return { input, chars: input.length, words, tokens, attention, defaultFocus, generated };
}

/** Swaps the simulated continuation for the real model's tokens. */
export function withGeneration(p: Pipeline, steps: RawStep[]): Pipeline {
  if (!steps.length) return p;
  const key = p.input.toLowerCase();
  const generated: GenStep[] = steps.map((s, k) => ({
    text: s.text,
    isPunct: isPunct(s.text),
    space: s.space,
    candidates: s.candidates?.length ? s.candidates : candidatesFor(s.text, k, hash(`${key}#${k}`)),
  }));
  return { ...p, generated };
}

/** True when a token should be preceded by a space when turned back into text. */
export function spaceBefore(t: Token, tokens: Token[]): boolean {
  return t.index > 0 && tokens[t.index - 1].wordIndex !== t.wordIndex;
}
