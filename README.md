# LLM Factory

A visual, step-by-step tour of how a language model turns a sentence into new text: tokens, IDs, embeddings, attention, prediction and generation.

## Demo



https://github.com/user-attachments/assets/9dc77250-7558-4299-8704-6d43ed7f23c2



## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000, type a sentence and press **Run**.

## Local model

Continuations are written by a local model through [Ollama](https://ollama.com):

```bash
ollama pull llama3.2
```

To use another model, add `OLLAMA_MODEL=your-model` to `.env.local`.
Without Ollama, the app falls back to simulated text.

## Stack

Next.js, React, TypeScript, Tailwind CSS, Framer Motion.
