import * as cheerio from "cheerio";
import * as XLSX from "xlsx";
import { basename } from "path";
import {
  CALENDAR_PAGE_URL,
  fetchBinary,
  fetchText,
  normalizeLanguage,
  upsertCalendarEvents,
} from "./common";

import type { Language } from "../src/types";

const SHEET_EVENT_COLUMN = 10;

function parseArgs() {
  const pageUrl = process.env.CALENDAR_PAGE_URL || CALENDAR_PAGE_URL;
  const sourceUrl = process.env.CALENDAR_SOURCE_URL || "";
  return { pageUrl, sourceUrl };
}

function resolveUrl(baseUrl: string, href: string): string {
  return new URL(href, baseUrl).toString();
}

async function fetchCalendarLinks(pageUrl: string): Promise<Array<[string, string]>> {
  const html = await fetchText(pageUrl);
  const $ = cheerio.load(html);

  const links: Array<[string, string]> = [];
  $("a[href]").each((_, element) => {
    const href = $(element).attr("href")?.trim() || "";
    if (!href.toLowerCase().endsWith(".xls") && !href.toLowerCase().endsWith(".xlsx")) {
      return;
    }

    const heading = $(element).parents("h1,h2,h3,h4,h5,h6").first();
    const text = (heading.text() || $(element).text()).replace(/\s+/g, " ").trim();
    links.push([text, resolveUrl(pageUrl, href)]);
  });

  return links;
}

function pickPreferredLink(links: Array<[string, string]>): [string, string] {
  if (links.length === 0) {
    throw new Error("No xls/xlsx links found on NTU calendar page");
  }

  const today = new Date();
  const academicStartYear = today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1;
  const target = `${academicStartYear}-${academicStartYear + 1}`;

  const preferred = links.find(([label, url]) => label.includes(target) || url.includes(target));
  return preferred || links[0];
}

function parseYearHint(text: string): number | null {
  const match = text.match(/(20\d{2})[-_](20\d{2})/);
  return match ? Number(match[1]) : null;
}

function parseEventsFromSheet(
  binary: Uint8Array,
  yearHint: number | null,
): Array<{ dateStart: string; dateEnd: string | null; summary: string }> {
  const workbook = XLSX.read(binary, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" }) as string[][];

  const monthMap = new Map<string, number>([
    ["january", 0], ["february", 1], ["march", 2], ["april", 3], ["may", 4], ["june", 5],
    ["july", 6], ["august", 7], ["september", 8], ["october", 9], ["november", 10], ["december", 11],
  ]);

  const eventPattern = /^[A-Za-z]+,\s+([A-Za-z]+)\s+(\d{1,2})\s+(.*)$/;
  const events: Array<{ dateStart: string; dateEnd: string | null; summary: string }> = [];
  let currentYear = yearHint;

  for (const row of rows) {
    const yearCell = row[0];
    if (yearCell) {
      const cleaned = String(yearCell).trim();
      if (/^\d{4}$/.test(cleaned)) {
        currentYear = Number(cleaned);
      } else {
        const numericMatch = cleaned.match(/\b(20\d{2})\b/);
        if (numericMatch) currentYear = Number(numericMatch[1]);
      }
    }

    const eventCell = row[SHEET_EVENT_COLUMN];
    if (!eventCell) continue;

    const rawText = String(eventCell).replace(/\s+/g, " ").trim();
    const match = rawText.match(eventPattern);
    if (!match || !currentYear) continue;

    const monthName = match[1].toLowerCase();
    const day = Number(match[2]);
    const summary = match[3].trim();
    if (!summary || !monthMap.has(monthName)) continue;

    const month = monthMap.get(monthName)!;
    const date = new Date(currentYear, month, day);
    if (Number.isNaN(date.getTime())) continue;

    const start = date.toISOString().slice(0, 10);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);

    events.push({
      dateStart: start,
      dateEnd: end.toISOString().slice(0, 10),
      summary,
    });
  }

  const deduped = new Map<string, { dateStart: string; summary: string }>();
  for (const event of events) {
    deduped.set(`${event.dateStart}::${event.summary}`, event);
  }

  return Array.from(deduped.values()).sort((a, b) => a.dateStart.localeCompare(b.dateStart) || a.summary.localeCompare(b.summary));
}

export async function main() {
  const { pageUrl, sourceUrl } = parseArgs();
  const links = sourceUrl ? [[basename(sourceUrl), sourceUrl] as [string, string]] : await fetchCalendarLinks(pageUrl);
  const [sourceLabel, selectedUrl] = sourceUrl ? links[0] : pickPreferredLink(links);
  const yearHint = parseYearHint(sourceLabel) || parseYearHint(selectedUrl);

  console.log(`Using source: ${sourceLabel}`);
  console.log(`Source URL: ${selectedUrl}`);

  const binary = await fetchBinary(selectedUrl);
  const events = parseEventsFromSheet(binary, yearHint);

  console.log(`Parsed ${events.length} events`);
  const result = upsertCalendarEvents(events, normalizeLanguage("en"));

  console.log(`Synced to Hono DB: ${result.created} created, ${result.updated} updated`);
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
