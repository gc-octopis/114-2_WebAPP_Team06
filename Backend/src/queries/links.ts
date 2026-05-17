import { db } from "../db";
import type { LinkCategory, LinkItem, LinkCategoryDTO, LinkItemDTO } from "../types";

interface RawLinkRow {
  cat_id: number;
  cat_slug: string;
  cat_icon: string;
  cat_label: string;
  cat_label_en: string | null;
  item_id: number | null;
  item_label: string | null;
  item_label_en: string | null;
  item_url: string | null;
  item_url_en: string | null;
  item_icon: string | null;
}

/**
 * Returns all link categories with their nested items.
 * Mirrors LinkCategorySerializer with nested LinkItemSerializer.
 */
export function getLinksWithCategories(): LinkCategoryDTO[] {
  const rows = db
    .query(
      `SELECT
         c.id        AS cat_id,
         c.slug      AS cat_slug,
         c.icon      AS cat_icon,
         c.label     AS cat_label,
         c.label_en  AS cat_label_en,
         i.id        AS item_id,
         i.label     AS item_label,
         i.label_en  AS item_label_en,
         i.url       AS item_url,
         i.url_en    AS item_url_en,
         i.icon      AS item_icon
       FROM events_linkcategory c
       LEFT JOIN events_linkitem i ON i.category_id = c.id
       ORDER BY c.id ASC, i.id ASC`
    )
    .all() as RawLinkRow[];

  // Group items under their parent category
  const categoryMap = new Map<number, LinkCategoryDTO>();

  for (const row of rows) {
    if (!categoryMap.has(row.cat_id)) {
      categoryMap.set(row.cat_id, {
        id: row.cat_slug,
        icon: row.cat_icon,
        label: row.cat_label,
        label_en: row.cat_label_en,
        links: [],
      });
    }

    if (row.item_id !== null) {
      categoryMap.get(row.cat_id)!.links.push({
        label: row.item_label!,
        label_en: row.item_label_en ?? null,
        url: row.item_url!,
        url_en: row.item_url_en ?? "",
        icon: row.item_icon!,
      });
    }
  }

  return Array.from(categoryMap.values());
}

/**
 * Returns all link items with their raw embeddings — used by the search route.
 */
export function getAllLinkItemsWithEmbeddings(): LinkItem[] {
  const rows = db
    .query("SELECT * FROM events_linkitem ORDER BY id ASC")
    .all() as Array<Omit<LinkItem, "embeddings"> & { embeddings: string }>;

  return rows.map((row) => ({
    ...row,
    embeddings: row.embeddings ? (JSON.parse(row.embeddings) as number[][]) : [],
  }));
}

export function getLinkItemById(id: number): LinkItem | null {
  const row = db
    .query("SELECT * FROM events_linkitem WHERE id = ?")
    .get(id) as (Omit<LinkItem, "embeddings"> & { embeddings: string }) | null;

  if (!row) return null;
  return {
    ...row,
    embeddings: row.embeddings ? (JSON.parse(row.embeddings) as number[][]) : [],
  };
}
