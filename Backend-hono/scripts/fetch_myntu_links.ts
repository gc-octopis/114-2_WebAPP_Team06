import {
  LINK_CATEGORIES,
  MYNTU_API_URL,
  upsertLinksWithEmbeddings,
} from "./common";

// ─── Config ───────────────────────────────────────────────────────────────────

const MYNTU_BASE_URL = "https://my.ntu.edu.tw";
const DEFAULT_ICON_URL = `${MYNTU_BASE_URL}/nasattach/0.png`;

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? "";
const EMBED_MODEL = "nvidia/llama-nemotron-embed-vl-1b-v2:free";
export const EMBED_DIMS = 2048;

// ─── Types ────────────────────────────────────────────────────────────────────

/** A link item that already carries its embedding vectors — passed to upsertLinksWithEmbeddings */
export interface LinkItemWithEmbeddings {
  label: string;
  label_en: string | null;
  url: string;
  url_en: string;
  icon: string;
  keywords: string;
  embeddings: number[][];
}

export interface LinkCategoryWithEmbeddings {
  id: string;       // slug
  icon: string;
  label: string;
  label_en: string | null;
  links: LinkItemWithEmbeddings[];
}

// ─── Session (cookie warm-up) ─────────────────────────────────────────────────
//
// The NTU API (mainHandler.ashx) determines response language from a session
// cookie set by Default.aspx, NOT from the searchName or any request header.
// Without this warm-up, every request returns Chinese data regardless of lang.
// This mirrors Python's create_session() which does a real GET to Default.aspx.

interface NtuSession {
  cookie: string;
  lang: string;
}

async function createSession(langParam: "cht" | "eng"): Promise<NtuSession> {
  const initUrl = `${MYNTU_BASE_URL}/Default.aspx?lang=${langParam}`;
  let cookie = "";

  try {
    const res = await fetch(initUrl, {
      method: "GET",
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });

    // Extract all Set-Cookie headers and forward them on subsequent requests
    const setCookie = res.headers.getSetCookie?.() ?? [];
    cookie = setCookie
      .map((c) => c.split(";")[0]) // keep only name=value, strip path/domain/expires
      .join("; ");

    if (!cookie) {
      console.warn(`  ⚠ No cookies received for lang=${langParam} — English data may be empty`);
    }
  } catch (err) {
    console.warn(`  ⚠ Session warm-up failed for lang=${langParam}: ${err}`);
  }

  return { cookie, lang: langParam };
}

// ─── myNTU API ────────────────────────────────────────────────────────────────

async function fetchCategory(
  session: NtuSession,
  searchName: string
): Promise<Array<Record<string, unknown>>> {
  try {
    const res = await fetch(MYNTU_API_URL, {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        // Forward the session cookie — this is the key difference vs the old TS version
        ...(session.cookie ? { Cookie: session.cookie } : {}),
      },
      body: new URLSearchParams({ type: "more", searchName }).toString(),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

    return (await res.json()) as Array<Record<string, unknown>>;
  } catch (err) {
    console.warn(`  ⚠ Failed to fetch "${searchName}": ${err}`);
    return [];
  }
}

function buildIconUrl(sysId: string): string {
  return `${MYNTU_BASE_URL}/nasattach/${sysId}.png`;
}

async function checkImageExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

// ─── Embedding ────────────────────────────────────────────────────────────────

async function embedTexts(
  texts: string[],
  inputType: "passage" | "query" = "passage"
): Promise<number[][]> {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      "Missing OPENROUTER_API_KEY — add it to your .env\n" +
        "Get a free key at https://openrouter.ai/keys"
    );
  }

  const BATCH_SIZE = 32;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: EMBED_MODEL,
        input: batch,
        input_type: inputType,
        modality: batch.map(() => "text"),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenRouter embedding failed [${res.status}]: ${body}`);
    }

    const json = (await res.json()) as {
      data: Array<{ index: number; embedding: number[] }>;
    };

    const sorted = [...json.data].sort((a, b) => a.index - b.index);
    results.push(...sorted.map((d) => d.embedding));

    if (i + BATCH_SIZE < texts.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function main() {
  console.log("============================================================");
  console.log("myNTU Links Scraper + Nemotron Embedder");
  console.log(`Embedding model : ${EMBED_MODEL}`);
  console.log(`Embedding dims  : ${EMBED_DIMS}`);
  console.log("============================================================");

  if (!OPENROUTER_API_KEY) {
    console.error("\n❌ OPENROUTER_API_KEY is not set. Add it to your .env file.\n");
    process.exit(1);
  }

  // ── Phase 1: scrape Chinese data ──────────────────────────────────────────
  console.log("\n[1/3] Initialising Chinese session + fetching data...");
  const sessionZh = await createSession("cht");

  const raw = new Map<
    string,
    {
      category_id: string;
      label: string;
      label_en: string;
      url: string;
      url_en: string;
      icon: string;
    }
  >();

  for (const category of LINK_CATEGORIES) {
    const items = await fetchCategory(sessionZh, category.zh);
    for (const item of items) {
      const sysId = normalizeText(item.sys_id);
      if (!sysId || raw.has(sysId)) continue;

      // Mirror Python: check if icon image actually exists, fall back to default
      const iconUrl = buildIconUrl(sysId);
      const iconExists = await checkImageExists(iconUrl);

      raw.set(sysId, {
        category_id: category.id,
        label: normalizeText(item.sys_cname),
        label_en: "",
        url: normalizeText(item.href),
        url_en: "",
        icon: iconExists ? iconUrl : DEFAULT_ICON_URL,
      });
    }
    console.log(`  ${category.zh}: ${items.length} items`);
    await new Promise((r) => setTimeout(r, 150)); // mirrors Python's time.sleep(0.15)
  }

  console.log(`  → ${raw.size} unique links`);

  // ── Phase 2: merge English data ───────────────────────────────────────────
  // KEY FIX: warm up a real English session first so the lang cookie is set,
  // then pass it to every fetchCategory call for English.
  // Mirrors Python's: session_en = create_session("eng")
  console.log("\n[2/3] Initialising English session + merging data...");
  const sessionEn = await createSession("eng");

  for (const category of LINK_CATEGORIES) {
    const items = await fetchCategory(sessionEn, category.en);
    for (const item of items) {
      const sysId = normalizeText(item.sys_id);
      if (!raw.has(sysId)) continue;
      const current = raw.get(sysId)!;
      current.label_en = normalizeText(item.sys_cname);
      current.url_en = normalizeText(item.href);
    }
    console.log(`  ${category.en}: ${items.length} items`);
    await new Promise((r) => setTimeout(r, 150));
  }

  // ── Phase 3: generate embeddings ──────────────────────────────────────────
  console.log(`\n[3/3] Generating embeddings via OpenRouter...`);

  // Batch all texts together for efficiency — track count per item to re-split later
  const allTexts: string[] = [];
  const itemMeta: Array<{ sysId: string; count: number }> = [];

  for (const [sysId, record] of raw) {
    // Embed zh + en label + category labels as extra context
    // Matches the current upsertLinks logic: [label, label_en, cat.label, cat.label_en]
    const cat = LINK_CATEGORIES.find((c) => c.id === record.category_id);
    const texts = [
      record.label,
      record.label_en,
      cat?.zh ?? "",
      cat?.en ?? "",
    ].filter(Boolean) as string[];

    allTexts.push(...texts);
    itemMeta.push({ sysId, count: texts.length });
  }

  console.log(`  ${allTexts.length} texts to embed across ${raw.size} items`);
  const allVectors = await embedTexts(allTexts, "passage");

  // Re-associate vectors back to their items
  const embeddingMap = new Map<string, number[][]>();
  let offset = 0;
  for (const { sysId, count } of itemMeta) {
    embeddingMap.set(sysId, allVectors.slice(offset, offset + count));
    offset += count;
  }
  console.log(`  ✓ ${embeddingMap.size} items embedded`);

  // ── Assemble output ───────────────────────────────────────────────────────
  const grouped = new Map<string, LinkCategoryWithEmbeddings>();
  for (const cat of LINK_CATEGORIES) {
    grouped.set(cat.id, {
      id: cat.id,
      icon: cat.icon,
      label: cat.zh,
      label_en: cat.en,
      links: [],
    });
  }

  for (const [sysId, record] of raw) {
    const category = grouped.get(record.category_id);
    if (!category) continue;

    const keywords = [record.label, record.label_en]
      .filter(Boolean)
      .join(" ");

    category.links.push({
      label: record.label,
      label_en: record.label_en || null,
      url: record.url,
      url_en: record.url_en,
      icon: record.icon,
      keywords,
      embeddings: embeddingMap.get(sysId) ?? [],
    });
  }

  const categories = Array.from(grouped.values());
  const totalLinks = categories.reduce((s, c) => s + c.links.length, 0);

  // Print summary mirroring Python's output
  console.log(`\n  ${totalLinks} links across ${categories.length} categories:`);
  for (const cat of categories) {
    const enCount = cat.links.filter((l) => l.label_en).length;
    console.log(
      `  ${cat.icon} ${cat.label} (${cat.id}): ${cat.links.length} links, EN labels ${enCount}/${cat.links.length}`
    );
  }

  // ── Upsert into DB ────────────────────────────────────────────────────────
  const result = await upsertLinksWithEmbeddings(categories);
  console.log(
    `\n✅ Done! ${result.links} links across ${result.categories} categories synced.`
  );
}

if (import.meta.main) {
  main().catch((err) => {
    console.error("\n❌ Fatal:", err);
    process.exit(1);
  });
}