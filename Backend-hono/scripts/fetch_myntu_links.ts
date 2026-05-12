import {
  LINK_CATEGORIES,
  MYNTU_API_URL,
  upsertLinks,
} from "./common";
import type { LinkCategoryDTO } from "../src/types";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

function createSession(langParam: string): HeadersInit {
  // The NTU API mostly cares about language context. A lightweight initial
  // request is enough for the public endpoint in practice.
  return {
    ...HEADERS,
    "Accept-Language": langParam === "eng" ? "en-US,en;q=0.9" : "zh-TW,zh;q=0.9,en;q=0.8",
  };
}

async function fetchCategory(langParam: string, searchName: string): Promise<Array<Record<string, unknown>>> {
  const response = await fetch(MYNTU_API_URL, {
    method: "POST",
    headers: {
      ...createSession(langParam),
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: new URLSearchParams({ type: "more", searchName }).toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch category ${searchName}: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as Array<Record<string, unknown>>;
}

function buildIconUrl(sysId: string): string {
  return `https://my.ntu.edu.tw/nasattach/${sysId}.png`;
}

function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export async function main() {
  console.log("============================================================");
  console.log("myNTU Links Scraper (Hono version)");
  console.log("============================================================");

  const raw = new Map<string, {
    category_id: string;
    label: string;
    label_en: string;
    url: string;
    url_en: string;
    icon: string;
  }>();

  console.log("\n[1/2] Fetching Chinese data...");
  for (const category of LINK_CATEGORIES) {
    const items = await fetchCategory("cht", category.zh);
    for (const item of items) {
      const sysId = normalizeText(item.sys_id);
      if (!sysId || raw.has(sysId)) continue;

      raw.set(sysId, {
        category_id: category.id,
        label: normalizeText(item.sys_cname),
        label_en: "",
        url: normalizeText(item.href),
        url_en: "",
        icon: buildIconUrl(sysId),
      });
    }
    console.log(`  ${category.zh}: ${items.length} items`);
  }

  console.log("\n[2/2] Fetching English data and merging...");
  for (const category of LINK_CATEGORIES) {
    const items = await fetchCategory("eng", category.en);
    for (const item of items) {
      const sysId = normalizeText(item.sys_id);
      if (!sysId || !raw.has(sysId)) continue;

      const current = raw.get(sysId)!;
      current.label_en = normalizeText(item.sys_cname);
      current.url_en = normalizeText(item.href);
    }
    console.log(`  ${category.en}: ${items.length} items`);
  }

  const grouped = new Map<string, LinkCategoryDTO>();
  for (const category of LINK_CATEGORIES) {
    grouped.set(category.id, {
      id: category.id,
      icon: category.icon,
      label: category.zh,
      label_en: category.en,
      links: [],
    });
  }

  for (const record of raw.values()) {
    const category = grouped.get(record.category_id);
    if (!category) continue;

    category.links.push({
      label: record.label,
      label_en: record.label_en || null,
      url: record.url,
      url_en: record.url_en,
      icon: record.icon,
    });
  }

  const categories = Array.from(grouped.values());
  const result = await upsertLinks(categories);
  console.log(`\n✅ Completed: ${result.links} links across ${result.categories} categories synced to Hono DB.`);
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
