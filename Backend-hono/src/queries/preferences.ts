import { db } from "../db";
import type { UserPreference, UserPreferenceDTO, LinkItemPreferences } from "../types";

interface RawPreference {
  id: number;
  user_id: string;
  pinned_links: string; // JSON string in SQLite
  created_at: string;
  updated_at: string;
}

function parsePreference(row: RawPreference): UserPreference {
  return {
    ...row,
    pinned_links: row.pinned_links ? (JSON.parse(row.pinned_links) as LinkItemPreferences[]) : [],
  };
}

function toDTO(pref: UserPreference): UserPreferenceDTO {
  return { pinned_links: pref.pinned_links };
}

export function getPreferences(userId: string): UserPreferenceDTO {
  const row = db
    .query("SELECT * FROM events_userpreference WHERE user_id = ?")
    .get(userId) as RawPreference | null;

  if (!row) return { pinned_links: [] };
  return toDTO(parsePreference(row));
}

export function upsertPreferences(userId: string, pinnedLinks: LinkItemPreferences[]): UserPreferenceDTO {
  const now = new Date().toISOString();
  const json = JSON.stringify(pinnedLinks);

  db.query(
    `INSERT INTO events_userpreference (user_id, pinned_links, created_at, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       pinned_links = excluded.pinned_links,
       updated_at   = excluded.updated_at`
  ).run(userId, json, now, now);

  // Return shape matching frontend expectation
  return { pinned_links: pinnedLinks };
}

export function deletePreferences(userId: string): void {
  db.query("DELETE FROM events_userpreference WHERE user_id = ?").run(userId);
}
