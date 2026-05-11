import { db } from "../db";
import type { ContactMessage, CreateContactInput } from "../types";

export function saveContactMessage(input: CreateContactInput): ContactMessage {
  const now = new Date().toISOString();

  const result = db
    .query(
      `INSERT INTO events_contactmessage (name, email, message, created_at)
       VALUES (?, ?, ?, ?)
       RETURNING id, name, email, message, created_at`
    )
    .get(
      input.name?.trim() ?? "",
      input.email?.trim() ?? "",
      input.message,
      now
    ) as ContactMessage;

  return result;
}

/** Admin-only — not exposed via API, matches Django admin behaviour */
export function getAllContactMessages(): ContactMessage[] {
  return db
    .query("SELECT * FROM events_contactmessage ORDER BY created_at DESC")
    .all() as ContactMessage[];
}
