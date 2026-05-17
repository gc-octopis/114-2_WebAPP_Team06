import { db } from "../db";
import type { CalendarEvent, CalendarEventDTO, Language } from "../types";

function toDTO(row: CalendarEvent): CalendarEventDTO {
  return {
    id: row.id,
    summary: row.summary,
    dateStart: row.date_start,
    dateEnd: row.date_end ?? null,
    location: row.location,
    description: row.description,
  };
}

export function getEvents(
  lang: Language,
  startDate?: string,
  endDate?: string
): CalendarEventDTO[] {
  const conditions: string[] = ["language = ?"];
  const params: unknown[] = [lang];

  if (startDate) {
    conditions.push("date_start >= ?");
    params.push(startDate);
  }
  if (endDate) {
    conditions.push("date_start <= ?");
    params.push(endDate);
  }

  const sql = `
    SELECT id, language, summary, date_start, date_end, location, description, uid, created_at, updated_at
    FROM events_calendarevent
    WHERE ${conditions.join(" AND ")}
    ORDER BY date_start ASC
  `;

  const rows = db.query(sql).all(...params) as CalendarEvent[];
  return rows.map(toDTO);
}

export function getEventByUid(uid: string): CalendarEvent | null {
  return (
    (db
      .query("SELECT * FROM events_calendarevent WHERE uid = ?")
      .get(uid) as CalendarEvent | null) ?? null
  );
}

export function getUpcomingEvents(lang: Language, limit = 10): CalendarEventDTO[] {
  const today = new Date().toISOString().slice(0, 10);
  const sql = `
    SELECT id, language, summary, date_start, date_end, location, description, uid, created_at, updated_at
    FROM events_calendarevent
    WHERE language = ? AND date_start >= ?
    ORDER BY date_start ASC
    LIMIT ?
  `;
  const rows = db.query(sql).all(lang, today, limit) as CalendarEvent[];
  return rows.map(toDTO);
}
