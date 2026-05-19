import {
  CHINESE_CALENDAR_PAGE_URL,
  fetchText,
  normalizeLanguage,
  upsertCalendarEvents,
} from "./common";

function parseArgs() {
  const pageUrl = process.env.CALENDAR_PAGE_URL || CHINESE_CALENDAR_PAGE_URL;
  const sourceUrl = process.env.CALENDAR_SOURCE_URL || "";
  return { pageUrl, sourceUrl };
}

function toIcsUrl(url: string): string {
  const normalized = url.trim();
  if (normalized.toLowerCase().endsWith(".ics")) return normalized;
  if (normalized.toLowerCase().endsWith(".html")) return normalized.slice(0, -5) + ".ics";
  if (normalized.endsWith("/")) return normalized + "calendar.ics";
  return normalized + "/calendar.ics";
}

function removeIcsFolding(text: string): string {
  const normalized = text.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
  const lines = normalized.split("\n");
  const unfolded: string[] = [];

  for (const line of lines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1);
      continue;
    }
    unfolded.push(line);
  }

  return unfolded.join("\n");
}

function extractField(text: string, fieldName: string): string | null {
  const match = text.match(new RegExp(`${fieldName}(?:;[^:]*)?:([^\r\n]+)`));
  return match ? match[1].trim() : null;
}

function extractDate(text: string, fieldName: string): string | null {
  const match = text.match(new RegExp(`${fieldName}[^:]*:(\d{8})`));
  if (!match) return null;
  const value = match[1];
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function parseIcsEvents(icsContent: string): Array<{ dateStart: string; dateEnd: string | null; summary: string }> {
  const events: Array<{ dateStart: string; dateEnd: string | null; summary: string }> = [];
  const unfolded = removeIcsFolding(icsContent);
  const lines = unfolded.split("\n");

  let current: { dateStart?: string; dateEnd?: string; summary?: string } | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }

    if (line === "END:VEVENT") {
      if (current?.summary && current?.dateStart) {
        events.push({ dateStart: current.dateStart, dateEnd: current.dateEnd ?? null, summary: current.summary });
      }
      current = null;
      continue;
    }

    if (!current) continue;

    if (line.startsWith("SUMMARY:")) {
      current.summary = line.slice("SUMMARY:".length).trim();
      continue;
    }

    const dateMatch = line.match(/^DTSTART[^:]*:(\d{8})/);
    if (dateMatch) {
      current.dateStart = `${dateMatch[1].slice(0, 4)}-${dateMatch[1].slice(4, 6)}-${dateMatch[1].slice(6, 8)}`;
      continue;
    }

    const endMatch = line.match(/^DTEND[^:]*:(\d{8})/);
    if (endMatch) {
      current.dateEnd = `${endMatch[1].slice(0, 4)}-${endMatch[1].slice(4, 6)}-${endMatch[1].slice(6, 8)}`;
    }
  }

  const deduped = new Map<string, { dateStart: string; summary: string }>();
  for (const event of events) {
    deduped.set(`${event.dateStart}::${event.summary}`, event);
  }
  return Array.from(deduped.values()).sort((a, b) => a.dateStart.localeCompare(b.dateStart) || a.summary.localeCompare(b.summary));
}

export async function main() {
  const { pageUrl, sourceUrl } = parseArgs();
  const selectedUrl = sourceUrl ? sourceUrl : toIcsUrl(pageUrl);

  console.log(`Source URL: ${selectedUrl}`);

  const icsText = await fetchText(selectedUrl);
  if (!icsText.includes("BEGIN:VCALENDAR")) {
    throw new Error("Downloaded content is not a valid ICS file");
  }

  const events = parseIcsEvents(icsText);
  console.log(`Parsed ${events.length} events`);

  const result = upsertCalendarEvents(events, normalizeLanguage("zh"));
  console.log(`Synced to Hono DB: ${result.created} created, ${result.updated} updated`);
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
