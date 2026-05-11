import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";

// ─── Routes ──────────────────────────────────────────────────────────────────
import { calendar      } from "./routes/calendar";
import { announcements } from "./routes/announcements";
import { links         } from "./routes/links";
import { preferences   } from "./routes/preferences";
// import { search        } from "./routes/search";
import { feedback      } from "./routes/feedback";
// import { contact       } from "./routes/contact";

// ─── App ─────────────────────────────────────────────────────────────────────
const app = new Hono();

// CORS — mirrors Django's CORS_ALLOWED_ORIGINS + CORS_ALLOW_HEADERS
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "User-Agent",
      "X-User-Id",
    ],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  })
);

// Global error handler — turns thrown errors into clean JSON responses
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

// 404 fallback
app.notFound((c) => c.json({ error: "Not found" }, 404));

// ─── Mount routes ─────────────────────────────────────────────────────────────
//  Each string here matches your existing Django URL patterns exactly,
//  so your frontend needs zero changes.
app.route("/api/calendar",       calendar);
app.route("/api/announcements",  announcements);
app.route("/api/links",          links);
app.route("/api/preferences",    preferences);
// app.route("/api/search",         search);
app.route("/api/feedback",       feedback);
// app.route("/api/contact",        contact);

// ─── Dev health check ────────────────────────────────────────────────────────
app.get("/", (c) => c.json({ status: "ok", routes: [
  "GET  /api/calendar/",
  "GET  /api/announcements/",
  "GET  /api/links/",
  "GET  /api/preferences/",
  "PATCH /api/preferences/",
  "GET  /api/search/",
  "GET  /api/feedback/",
  "POST /api/feedback/",
  "POST /api/contact/",
]}));

// ─── Export for Bun ───────────────────────────────────────────────────────────
export default {
  port: Number(process.env.PORT ?? 8000),
  fetch: app.fetch,
};