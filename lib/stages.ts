export interface StageInfo {
  short: string;
  title: string;
  line: string;
}

export const STAGES: StageInfo[] = [
  { short: "Input", title: "Raw input", line: "To the model, this is just a string of characters." },
  { short: "Words", title: "Words", line: "First, the text is split at the spaces." },
  { short: "Tokens", title: "Tokens", line: "Words are cut into pieces the model knows. Tinted ones are parts of a word." },
  { short: "IDs", title: "Token IDs", line: "Each token is swapped for its number." },
  { short: "Embed", title: "Embeddings", line: "Each token becomes a point on a map of meaning. Similar tokens sit close." },
  { short: "Position", title: "Position", line: "Tokens get an order number, so the word order is not lost." },
  { short: "Attention", title: "Attention", line: "Each token looks back at earlier ones. Thicker line, more focus. Click a token." },
  { short: "Predict", title: "Prediction", line: "The model reads all the tokens, scores every possible next token, and the best one fills the blank." },
  { short: "Generate", title: "Generation", line: "The new token joins the text, and the whole text goes back in to predict the next one." },
  { short: "Output", title: "Output", line: "Tokens are joined back into text." },
];

export const GEN_STEP_MS = 750;

/** Time per generated token; long continuations play faster so the stage stays under ~9s. */
export const genStepMs = (count: number) => Math.round(Math.max(450, Math.min(GEN_STEP_MS, 9000 / Math.max(1, count))));

export function stageDuration(stage: number, genCount: number, tokenCount = 8): number {
  const base = [2000, 2000, 2400, 2300, 2800, 1000 + tokenCount * 150 + 1000, 4000, 3800, 0, 3500];
  if (stage === 8) return 600 + genCount * genStepMs(genCount) + 1000;
  return base[stage] ?? 4000;
}
