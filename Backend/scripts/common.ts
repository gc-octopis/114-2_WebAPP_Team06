import { db } from "../src/db";
import { encodeQuery } from "../src/services/embed";
import type {
  AnnouncementDTO,
  CalendarEventDTO,
  LinkCategoryDTO,
  LinkItemDTO,
  Language,
} from "../src/types";

import type { LinkCategoryWithEmbeddings } from "./fetch_myntu_links";

export const HEADERS = {
  "User-Agent": "Mozilla/5.0",
};

export const CALENDAR_PAGE_URL = "https://www.aca.ntu.edu.tw/w/acaEN/Calendar";
export const CHINESE_CALENDAR_PAGE_URL =
  "https://mail.ntu.edu.tw/owa/calendar/231111d435d54d41908fa9c59d0812a3@ntu.edu.tw/4576890d12e040bab4ab864c413aa2be12994112486015644960/calendar.html";

export const ANNOUNCEMENT_URLS = {
  zh: "https://ann.cc.ntu.edu.tw/index.asp?Page={}&catalog=",
  en: "https://ann.cc.ntu.edu.tw/eng/index.asp?Page={}&catalog=",
} as const;

export const MYNTU_API_URL = "https://my.ntu.edu.tw/mainHandler.ashx";

export const LINK_CATEGORIES = [
  { id: "students", zh: "學生專區", en: "Students", icon: "🎓" },
  { id: "courses", zh: "課程學習", en: "Courses", icon: "📚" },
  { id: "faculty", zh: "教職申辦", en: "Faculty & Staff", icon: "👔" },
  { id: "teaching", zh: "教學", en: "Teaching", icon: "🏫" },
  { id: "library", zh: "圖書研究", en: "Research", icon: "🔬" },
  { id: "finance", zh: "帳務財物", en: "Accounts", icon: "💰" },
  { id: "venue", zh: "場館交通", en: "Facilities", icon: "🏟️" },
  { id: "campus", zh: "校園資源", en: "Resources", icon: "🏫" },
  { id: "news", zh: "消息公告", en: "Bulletin", icon: "📢" },
  { id: "feedback", zh: "意見交流", en: "Opinions", icon: "💬" },
] as const;

export function normalizeLanguage(lang: string | undefined): Language {
  return lang === "en" ? "en" : "zh";
}

export async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return await response.text();
}

export async function fetchBinary(url: string): Promise<Uint8Array> {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

export function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function clearLinkTables() {
  db.query("DELETE FROM events_linkitem").run();
  db.query("DELETE FROM events_linkcategory").run();
}

export function clearAnnouncementLanguage(lang: Language) {
  db.query("DELETE FROM events_announcement WHERE language = ?").run(lang);
}

export function upsertCalendarEvents(
  events: Array<{ dateStart: string; dateEnd?: string | null; summary: string }>,
  language: Language,
): { created: number; updated: number } {
  let created = 0;
  let updated = 0;

  for (const event of events) {
    const now = new Date().toISOString();
    const dateEnd = event.dateEnd ?? null;
    const result = db
      .query(
        `INSERT INTO events_calendarevent
          (language, summary, date_start, date_end, location, description, uid, created_at, updated_at)
         VALUES (?, ?, ?, ?, '', '', ?, ?, ?)
         ON CONFLICT(uid) DO UPDATE SET
           language = excluded.language,
           summary = excluded.summary,
           date_start = excluded.date_start,
           date_end = excluded.date_end,
           location = excluded.location,
           description = excluded.description,
           updated_at = excluded.updated_at`
      )
      .run(language, event.summary, event.dateStart, dateEnd, `${language}:${event.dateStart}:${event.summary}`, now, now);

    if (result.changes === 1) {
      created += 1;
    } else {
      updated += 1;
    }
  }

  return { created, updated };
}

export function upsertAnnouncements(
  items: AnnouncementDTO[],
  language: Language,
): { created: number; updated: number } {
  let created = 0;
  let updated = 0;

  for (const item of items) {
    const now = new Date().toISOString();
    const result = db
      .query(
        `INSERT INTO events_announcement
          (language, category, unit, title, date, link, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(language, link) DO UPDATE SET
           category = excluded.category,
           unit = excluded.unit,
           title = excluded.title,
           date = excluded.date,
           updated_at = excluded.updated_at`
      )
      .run(language, item.category, item.unit, item.title, item.date, item.link, now, now);

    if (result.changes === 1) {
      created += 1;
    } else {
      updated += 1;
    }
  }

  return { created, updated };
}

export async function buildLinkEmbeddings(texts: string[]): Promise<number[][]> {
  if (process.env.SKIP_EMBEDDINGS === "1") {
    return [];
  }

  let warned = false;
  const vectors: number[][] = [];

  for (const text of texts) {
    const trimmed = text.trim();
    if (!trimmed) continue;

    try {
      vectors.push(await encodeQuery(trimmed));
    } catch (error) {
      if (!warned) {
        console.warn(
          "Embedding service is unavailable; link embeddings will be stored as empty arrays."
        );
        console.warn(error instanceof Error ? error.message : error);
        warned = true;
      }
      return [];
    }
  }

  return vectors;
}

export function resetLinksAndInsertCategories(categories: LinkCategoryDTO[]): number {
  clearLinkTables();

  const categoryIdMap = new Map<string, number>();

  for (const category of categories) {
    const result = db
      .query(
        `INSERT INTO events_linkcategory (slug, icon, label, label_en)
         VALUES (?, ?, ?, ?)`
      )
      .run(category.id, category.icon, category.label, category.label_en);

    const row = db
      .query("SELECT id FROM events_linkcategory WHERE slug = ?")
      .get(category.id) as { id: number } | null;

    if (!row) {
      throw new Error(`Failed to insert category ${category.id}`);
    }

    categoryIdMap.set(category.id, row.id);
  }

  return categoryIdMap.size;
}

export function upsertLinksWithEmbeddings(
  categories: LinkCategoryWithEmbeddings[]
): { categories: number; links: number } {
  clearLinkTables();
 
  let insertedCategories = 0;
  let insertedLinks = 0;
 
  // Use a transaction for atomicity — if anything fails, nothing is committed
  const run = db.transaction(() => {
    for (const category of categories) {
      db.query(
        `INSERT INTO events_linkcategory (slug, icon, label, label_en)
         VALUES (?, ?, ?, ?)`
      ).run(category.id, category.icon, category.label, category.label_en ?? "");
 
      const categoryRow = db
        .query("SELECT id FROM events_linkcategory WHERE slug = ?")
        .get(category.id) as { id: number } | null;
 
      if (!categoryRow) {
        throw new Error(`Failed to resolve category id for slug="${category.id}"`);
      }
 
      insertedCategories += 1;
 
      for (const link of category.links) {
        db.query(
          `INSERT INTO events_linkitem
             (category_id, label, label_en, url, url_en, icon, keywords, embeddings)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          categoryRow.id,
          link.label,
          link.label_en ?? "",
          link.url,
          link.url_en ?? "",
          link.icon,
          link.keywords,
          JSON.stringify(link.embeddings),
        );
 
        insertedLinks += 1;
      }
    }
  });
 
  run();
 
  return { categories: insertedCategories, links: insertedLinks };
}