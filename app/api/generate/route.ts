import { NextResponse } from "next/server";
import type { RawStep } from "@/lib/pipeline";

// Talks to a local Ollama server. Override with OLLAMA_HOST / OLLAMA_MODEL in .env.local.
const HOST = process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434";
const MODEL = process.env.OLLAMA_MODEL ?? "llama3.2:latest";
const MAX_STEPS = 20;
const TOP_K = 5;

interface OllamaLogprob {
  token: string;
  logprob: number;
  top_logprobs?: { token: string; logprob: number }[];
}

/** GET: is Ollama up and is the model there? Also loads the model into memory. */
export async function GET() {
  try {
    const tags = await fetch(`${HOST}/api/tags`, { cache: "no-store" }).then((r) => r.json());
    const names: string[] = (tags.models ?? []).map((m: { name: string }) => m.name);
    if (!names.includes(MODEL)) {
      return NextResponse.json({ ok: false, model: MODEL, error: `Model not found. Run: ollama pull ${MODEL}` });
    }
    // An empty prompt just loads the model, so the first real run is fast.
    await fetch(`${HOST}/api/generate`, { method: "POST", body: JSON.stringify({ model: MODEL, prompt: "" }) });
    return NextResponse.json({ ok: true, model: MODEL });
  } catch {
    return NextResponse.json({ ok: false, model: MODEL, error: "Ollama is not running" });
  }
}

/** POST { text }: the model continues the text, one token at a time. */
export async function POST(req: Request) {
  const { text } = (await req.json()) as { text?: string };
  if (!text?.trim()) return NextResponse.json({ error: "empty text" }, { status: 400 });

  try {
    const res = await fetch(`${HOST}/api/generate`, {
      method: "POST",
      body: JSON.stringify({
        model: MODEL,
        prompt: text.trim(),
        raw: true, // plain text continuation, no chat template
        stream: false,
        logprobs: true,
        top_logprobs: TOP_K,
        options: { temperature: 0, num_predict: 40, stop: ["\n"] },
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const logprobs: OllamaLogprob[] | undefined = data.logprobs;
    const steps = logprobs?.length ? fromLogprobs(logprobs) : fromText(data.response ?? "");
    return NextResponse.json({ model: MODEL, real: !!logprobs?.length, steps });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

const isWord = (s: string) => /[\p{L}\p{N}]/u.test(s);
const ends = (s: string) => /[.!?…]["')\]]*$/.test(s.trim());

/** Keep tokens up to and including the first sentence end that follows a word. */
function cut(steps: RawStep[]): RawStep[] {
  const out: RawStep[] = [];
  let sawWord = false;
  for (const s of steps) {
    if (!s.text) continue;
    out.push(s);
    if (isWord(s.text)) sawWord = true;
    if ((sawWord && ends(s.text)) || out.length >= MAX_STEPS) break;
  }
  return out;
}

/** Real tokens and real probabilities (newer Ollama versions). */
function fromLogprobs(lps: OllamaLogprob[]): RawStep[] {
  return cut(
    lps.map((lp) => {
      const text = lp.token.trim();
      const seen = new Set([text.toLowerCase()]);
      const others = (lp.top_logprobs ?? [])
        .map((t) => ({ text: t.token.trim(), p: Math.exp(t.logprob) }))
        .filter((c) => c.text && !seen.has(c.text.toLowerCase()) && seen.add(c.text.toLowerCase()));
      return {
        text,
        space: /^\s/.test(lp.token),
        candidates: [{ text, p: Math.exp(lp.logprob) }, ...others].slice(0, TOP_K),
      };
    }),
  );
}

/** Older Ollama: only the text comes back, so it is split into word-sized pieces. */
function fromText(response: string): RawStep[] {
  const pieces = response.match(/\s*[\p{L}\p{N}'’-]+|\s*[^\s\p{L}\p{N}]/gu) ?? [];
  return cut(pieces.map((p) => ({ text: p.trim(), space: /^\s/.test(p) })));
}
