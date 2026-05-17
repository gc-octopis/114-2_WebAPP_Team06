import { Hono } from "hono";
import { getLinksWithCategories } from "../queries/links";

export const links = new Hono();

links.get("/", (c) => {
  return c.json(getLinksWithCategories());
});
