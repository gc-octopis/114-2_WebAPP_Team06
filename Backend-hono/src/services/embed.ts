const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const EMBED_MODEL = process.env.EMBED_MODEL ?? "all-minilm";

export async function encodeQuery(text: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, input: text }),
  });

  if (!res.ok) {
    throw new Error(`Ollama embed failed: ${res.status} ${res.statusText}`);
  }

  const { embeddings } = (await res.json()) as { embeddings: number[][] };
  return embeddings[0];
}

export function cosineSim(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** MaxSim: highest similarity among all vectors stored for an item */
export function maxSim(query: number[], vecs: number[][]): number {
  if (!vecs.length) return 0;
  return Math.max(...vecs.map((v) => cosineSim(query, v)));
}
