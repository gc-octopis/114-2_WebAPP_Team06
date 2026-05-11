import { Hono } from "hono";
import { getAllLinkItemsWithEmbeddings } from "../queries/links";
import { encodeQuery, maxSim } from "../services/embed";
import type { SearchResult } from "../types";

export const search = new Hono();

const LEXICAL_WEIGHT  = 0.3;
const SEMANTIC_WEIGHT = 0.7;
const SCORE_THRESHOLD = 0.3;

search.get("/", async (c) => {
  const q = c.req.query("q")?.trim() ?? "";

  if (!q) return c.json([]);

  const [items, queryVec] = await Promise.all([
    // DB read and embed can be kicked off simultaneously
    Promise.resolve(getAllLinkItemsWithEmbeddings()),
    encodeQuery(q),
  ]);

  const ql = q.toLowerCase();

  const scored: SearchResult[] = items
    .map((item) => {
      const lexical  = item.keywords?.toLowerCase().includes(ql) ? 1 : 0;
      const semantic = maxSim(queryVec, item.embeddings);
      const score    = LEXICAL_WEIGHT * lexical + SEMANTIC_WEIGHT * semantic;

      return {
        label:    item.label,
        label_en: item.label_en,
        url:      item.url,
        url_en:   item.url_en,
        icon:     item.icon,
        score,
      };
    })
    .filter((item) => item.score > SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  return c.json(scored);
});
