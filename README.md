# LLM Factory

A visual, step-by-step tour of how a language model turns a sentence into new text: tokens, IDs, embeddings, attention, prediction and generation.

## Demo

Uploading LLM_Factory.mp4…

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

