import * as cheerio from "cheerio";
import {
  ANNOUNCEMENT_URLS,
  fetchText,
  normalizeLanguage,
  upsertAnnouncements,
} from "./common";
import type { AnnouncementDTO } from "../src/types";

function parseArgs() {
  const lang = process.env.ANN_LANG === "en" ? "en" : "zh";
  const maxPages = process.env.ANN_MAX_PAGES ? Number(process.env.ANN_MAX_PAGES) : null;
  return { lang, maxPages: Number.isFinite(maxPages as number) ? (maxPages as number) : null };
}

function getBaseUrl(lang: "zh" | "en"): string {
  return ANNOUNCEMENT_URLS[lang];
}

async function getLastPage(baseUrl: string, lang: "zh" | "en"): Promise<number> {
  const html = await fetchText(baseUrl.replace("{}", "1"));
  const $ = cheerio.load(html);

  const candidates: number[] = [];
  $("a[href]").each((_, element) => {
    const href = $(element).attr("href") || "";
    if (!href.includes("Page=")) return;
    const match = href.match(/[?&]Page=(\d+)/i);
    if (!match) return;
    const page = Number(match[1]);
    if (Number.isFinite(page)) candidates.push(page);
  });

  if (candidates.length > 0) return Math.max(...candidates);

  const markers = lang === "zh" ? ["最後一頁"] : ["Last", "Last Page"];
  $("a[href]").each((_, element) => {
    const text = $(element).text().trim();
    if (!markers.includes(text)) return;
    const href = $(element).attr("href") || "";
    const match = href.match(/[?&]Page=(\d+)/i);
    if (match) {
      candidates.push(Number(match[1]));
    }
  });

  return candidates.length > 0 ? Math.max(...candidates) : 1;
}

async function scrapeAnnouncements(lang: "zh" | "en", maxPages: number | null): Promise<AnnouncementDTO[]> {
  const baseUrl = getBaseUrl(lang);
  const lastPage = Math.max(1, Math.min(await getLastPage(baseUrl, lang), maxPages ?? Number.MAX_SAFE_INTEGER));

  console.log(`Language: ${lang} | Total pages: ${lastPage}`);

  const allData: AnnouncementDTO[] = [];

  for (let page = 1; page <= lastPage; page++) {
    console.log(`Scraping page ${page}`);
    const url = baseUrl.replace("{}", String(page));
    const html = await fetchText(url);
    const $ = cheerio.load(html);

    const table = $('table[width="780"]').first();
    if (!table.length) continue;

    table.find("tr.text, tr.texten").each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length < 4) return;

      const categoryNode = cells.eq(0).find('div[align="center"]').first();
      const category = (categoryNode.length ? categoryNode.text() : cells.eq(0).text()).trim();
      const unit = cells.eq(1).text().trim();
      const anchor = cells.eq(2).find("a[href]").first();
      if (!anchor.length) return;

      const title = anchor.text().replace(/\s+/g, " ").trim();
      const href = anchor.attr("href") || "";
      const link = new URL(href, url).toString();
      const date = cells.eq(3).text().trim();

      if (!title) return;
      allData.push({ category, unit, title, date, link });
    });
  }

  return allData
    .sort((a, b) => b.date.localeCompare(a.date) || b.title.localeCompare(a.title))
    .map((item) => ({
      ...item,
      date: item.date,
    }));
}

export async function main() {
  const { lang, maxPages } = parseArgs();
  const data = await scrapeAnnouncements(lang, maxPages);

  console.log(`Scraped ${data.length} announcements`);
  const result = upsertAnnouncements(data, normalizeLanguage(lang));
  console.log(`Synced to Hono DB: ${result.created} created, ${result.updated} updated`);
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
