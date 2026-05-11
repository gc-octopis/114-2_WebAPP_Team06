import { db } from "../db";
import type { Announcement, AnnouncementDTO, PaginatedAnnouncements, Language } from "../types";

function toDTO(row: Announcement): AnnouncementDTO {
  return {
    category: row.category,
    unit: row.unit,
    title: row.title,
    date: row.date,
    link: row.link,
  };
}

export interface GetAnnouncementsOptions {
  lang?: Language;
  category?: string;
  page?: number;
  pageSize?: number;
}

export function getAnnouncements({
  lang = "zh",
  category,
  page = 1,
  pageSize = 10,
}: GetAnnouncementsOptions): PaginatedAnnouncements {
  // Clamp page size to match Django's max of 100
  const size = Math.min(Math.max(pageSize, 1), 100);
  const offset = (Math.max(page, 1) - 1) * size;

  const conditions: string[] = ["language = ?"];
  const params: unknown[] = [lang];

  if (category) {
    conditions.push("category = ?");
    params.push(category);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const total = (
    db
      .query(`SELECT COUNT(*) as count FROM events_announcement ${where}`)
      .get(...params) as { count: number }
  ).count;

  const rows = db
    .query(
      `SELECT id, language, category, unit, title, date, link, created_at, updated_at
       FROM events_announcement
       ${where}
       ORDER BY date DESC, id DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, size, offset) as Announcement[];

  return {
    results: rows.map(toDTO),
    total,
    page: Math.max(page, 1),
    pageSize: size,
    totalPages: Math.ceil(total / size),
  };
}

export function getAnnouncementCategories(lang: Language): string[] {
  const rows = db
    .query(
      `SELECT DISTINCT category FROM events_announcement
       WHERE language = ? AND category != ''
       ORDER BY category ASC`
    )
    .all(lang) as { category: string }[];
  return rows.map((r) => r.category);
}
