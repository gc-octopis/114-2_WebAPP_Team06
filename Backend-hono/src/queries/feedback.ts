import { db } from "../db";
import type { FeedbackPost, FeedbackPostDTO, CreateFeedbackInput } from "../types";

/**
 * Formats a UTC datetime string to Asia/Taipei local time.
 * Mirrors Django's: timezone.localtime(obj.created_at, ZoneInfo('Asia/Taipei'))
 *                   .strftime('%Y-%m-%d %I:%M %p').lower()
 */
function formatTaipeiTime(utcString: string): string {
  const date = new Date(utcString.endsWith("Z") ? utcString : utcString + "Z");
  return date
    .toLocaleString("en-US", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(
      /(\d+)\/(\d+)\/(\d+),\s(.+)/,
      (_, m, d, y, time) => `${y}-${m}-${d} ${time.toLowerCase()}`
    );
}

/**
 * Recursively fetches replies for a given parent post id.
 * Mirrors FeedbackPostSerializer's get_replies().
 */
function fetchReplies(parentId: number): FeedbackPostDTO[] {
  const rows = db
    .query(
      `SELECT id, parent_id, nickname, avatar_color, title, content, created_at
       FROM events_feedbackpost
       WHERE parent_id = ?
       ORDER BY created_at ASC, id ASC`
    )
    .all(parentId) as FeedbackPost[];

  return rows.map((row) => ({
    id: row.id,
    parent_id: row.parent_id,
    nickname: row.nickname,
    avatar_color: row.avatar_color,
    content: row.content,
    created_at: formatTaipeiTime(row.created_at),
    replies: fetchReplies(row.id), // recurse
  }));
}

function toDTO(row: FeedbackPost): FeedbackPostDTO {
  return {
    id: row.id,
    parent_id: row.parent_id,
    nickname: row.nickname,
    avatar_color: row.avatar_color,
    content: row.content,
    created_at: formatTaipeiTime(row.created_at),
    replies: fetchReplies(row.id),
  };
}

/** Returns all top-level posts (parent_id IS NULL) with nested replies. */
export function getTopLevelPosts(): FeedbackPostDTO[] {
  const rows = db
    .query(
      `SELECT id, parent_id, nickname, avatar_color, title, content, created_at
       FROM events_feedbackpost
       WHERE parent_id IS NULL
       ORDER BY created_at DESC, id DESC`
    )
    .all() as FeedbackPost[];

  return rows.map(toDTO);
}

export function getPostById(id: number): FeedbackPostDTO | null {
  const row = db
    .query("SELECT * FROM events_feedbackpost WHERE id = ?")
    .get(id) as FeedbackPost | null;

  return row ? toDTO(row) : null;
}

export function createPost(input: CreateFeedbackInput): FeedbackPostDTO {
  const now = new Date().toISOString();
  const nickname = input.nickname?.trim() || "Anonymous";
  const avatarColor = input.avatar_color ?? "#94a3b8";

  const result = db
    .query(
      `INSERT INTO events_feedbackpost
         (parent_id, nickname, avatar_color, title, content, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING id, parent_id, nickname, avatar_color, title, content, created_at`
    )
    .get(
      input.parent_id ?? null,
      nickname,
      avatarColor,
      input.title,
      input.content,
      now
    ) as FeedbackPost;

  return toDTO(result);
}

export function deletePost(id: number): boolean {
  const info = db
    .query("DELETE FROM events_feedbackpost WHERE id = ?")
    .run(id);
  return info.changes > 0;
}
