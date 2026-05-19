// ─── Calendar ────────────────────────────────────────────────────────────────

export type Language = "zh" | "en";

export interface CalendarEvent {
  id: number;
  language: Language;
  summary: string;
  date_start: string; // ISO date "YYYY-MM-DD"
  date_end: string | null;
  location: string;
  description: string;
  uid: string;
  created_at: string;
  updated_at: string;
}

/** Shape returned to the frontend — matches CalendarEventSerializer */
export interface CalendarEventDTO {
  id: number;
  summary: string;
  dateStart: string;
  dateEnd: string | null;
  location: string;
  description: string;
}

// ─── Announcements ───────────────────────────────────────────────────────────

export interface Announcement {
  id: number;
  language: Language;
  category: string;
  unit: string;
  title: string;
  date: string; // "YYYY-MM-DD"
  link: string;
  created_at: string;
  updated_at: string;
}

/** Shape returned to the frontend — matches AnnouncementSerializer */
export interface AnnouncementDTO {
  category: string;
  unit: string;
  title: string;
  date: string;
  link: string;
}

// Shape returned to the frontend — matches AnnouncementAPI expectations
export interface PaginatedAnnouncements {
  announcements: AnnouncementDTO[];
  categories: string[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ─── Links ───────────────────────────────────────────────────────────────────

export interface LinkItem {
  id: number;
  category_id: number;
  label: string;
  label_en: string | null;
  url: string;
  url_en: string;
  icon: string;
  keywords: string;
  embeddings: number[][];
}

export interface LinkItemDTO {
  label: string;
  label_en: string | null;
  url: string;
  url_en: string;
  icon: string;
}

export interface LinkItemPreferences {
  label: string;
  label_en: string | null;
  url: string;
  icon: string;
}

export interface LinkCategory {
  id: number;
  slug: string;
  icon: string;
  label: string;
  label_en: string | null;
}

/** Shape returned to the frontend — matches LinkCategorySerializer */
export interface LinkCategoryDTO {
  id: string; // slug, not numeric id
  icon: string;
  label: string;
  label_en: string | null;
  links: LinkItemDTO[];
}

// ─── User Preferences ────────────────────────────────────────────────────────

export interface UserPreference {
  id: number;
  user_id: string;
  pinned_links: LinkItemPreferences[]; // stored as JSON in SQLite
  created_at: string;
  updated_at: string;
}

// Frontend expects the key `pinned_links`
export interface UserPreferenceDTO {
  pinned_links: LinkItemPreferences[];
}

// ─── Feedback ────────────────────────────────────────────────────────────────

export interface FeedbackPost {
  id: number;
  parent_id: number | null;
  user_id?: string | null;
  nickname: string;
  avatar_color: string;
  title: string;
  content: string;
  created_at: string;
}

/** Recursive — matches FeedbackPostSerializer */
export interface FeedbackPostDTO {
  id: number;
  parent_id: number | null;
  user_id?: string | null;
  nickname: string;
  avatar_color: string;
  title: string;
  content: string;
  created_at: string; // formatted "YYYY-MM-DD HH:MM am/pm"
  replies: FeedbackPostDTO[];
  is_me?: boolean;
}

export interface CreateFeedbackInput {
  parent_id?: number | null;
  nickname?: string;
  avatar_color?: string;
  title: string;
  content: string;
}

// Shape returned for paginated feedback list, matching frontend expectations
export interface PaginatedFeedback {
  posts: FeedbackPostDTO[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ─── Contact ─────────────────────────────────────────────────────────────────

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

export interface CreateContactInput {
  name?: string;
  email?: string;
  message: string;
}

// ─── Search ──────────────────────────────────────────────────────────────────

export interface SearchResult extends LinkItemDTO {
  score: number;
}